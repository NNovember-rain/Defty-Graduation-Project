import logger from '../../config/logger';
import { getErrorMessage } from '../../utils/errorHandler';
import * as promptService from '../prompt.service';
import { UmlInput, UmlProcessedResult } from '../../types/uml.types';
import { callAIApi } from "../../providers/ai-llm.provider";
import { AIValidationError, parseJsonResponse, UmlProcessingError } from "./index";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface DomainContext {
    keywords: string[];
    businessConcepts: string[];
    mandatoryEntities: string[];
    domainRules: string[];
    analysisPhaseConstraints: string[];
}

interface Attribute {
    name: string;
    // Analysis phase: NO visibility, NO detailed types
}

interface Operation {
    name: string;
    // Analysis phase: OPTIONAL, simple signatures only
}

interface Class {
    id: string;
    name: string;
    stereotype?: 'entity' | 'boundary' | 'control';
    attributes: Attribute[];
    operations?: Operation[];
}

interface Multiplicity {
    min: string;
    max: string;
}

interface Association {
    from: string;
    to: string;
    fromLabel?: string;
    toLabel?: string;
    fromMultiplicity: Multiplicity;
    toMultiplicity: Multiplicity;
}

interface Aggregation {
    whole: string;
    part: string;
    wholeMultiplicity: Multiplicity;
    partMultiplicity: Multiplicity;
}

interface Composition {
    composite: string;
    component: string;
    compositeMultiplicity: Multiplicity;
    componentMultiplicity: Multiplicity;
}

interface Generalization {
    parent: string;
    child: string;
}

interface Relationship {
    associations: Association[];
    aggregations: Aggregation[];
    compositions: Composition[];
    generalizations: Generalization[];
}

interface DiagramJSON {
    classes: Class[];
    relationships: Relationship;
}

interface NormalizedElement {
    original: string;
    canonical: string;
    similarityScore: number;
}

interface NormalizedClass extends Class {
    normalized: NormalizedElement;
    attributesNormalized: Array<Attribute & { normalized: NormalizedElement }>;
}

interface NormalizedDiagram {
    classes: NormalizedClass[];
    relationships: Relationship;
}

interface AttributeComparison {
    matched: Array<{
        className: string;
        solutionAttr: Attribute & { normalized: NormalizedElement };
        studentAttr: Attribute & { normalized: NormalizedElement };
    }>;
    missing: Array<{
        className: string;
        attribute: Attribute & { normalized: NormalizedElement };
    }>;
    extra: Array<{
        className: string;
        attribute: Attribute & { normalized: NormalizedElement };
    }>;
    misplaced: Array<{
        attrName: string;
        inClass: string;
        shouldBeIn: string;
        reasoning: string;
    }>;
}

interface RelationshipComparison {
    associations: {
        matched: number;
        missing: number;
        extra: number;
        wrongMultiplicity: Array<{
            from: string;
            to: string;
            expected: string;
            actual: string;
        }>;
    };
    aggregations: {
        matched: number;
        missing: number;
        confusedWithComposition: number;
    };
    compositions: {
        matched: number;
        missing: number;
        confusedWithAggregation: number;
    };
    generalizations: {
        matched: number;
        missing: number;
        extra: number;
    };
}

interface ComparisonResult {
    classes: {
        matched: Array<{ solution: NormalizedClass; student: NormalizedClass; similarity: number }>;
        missing: NormalizedClass[];
        extra: NormalizedClass[];
    };
    attributes: AttributeComparison;
    operations: {
        matched: number;
        missing: number;
    };
    relationships: RelationshipComparison;
}

interface DetectedError {
    code: string;
    category: 'STRUCTURAL' | 'RELATIONSHIP' | 'CONCEPTUAL' | 'QUALITY';
    severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
    penalty: number;
    explanation: string;
    elements: string[];
    suggestion?: string;
    businessImpact?: string;
}

interface ScoreBreakdown {
    entities: { score: number; max: number; details: string };
    attributes: { score: number; max: number; details: string };
    relationships: { score: number; max: number; details: string };
    businessLogic: { score: number; max: number; details: string };
}

interface ReferenceScore {
    total: number;
    breakdown: ScoreBreakdown;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    suggestedRange: string;
}

// ============================================================================
// STEP 1: VALIDATION & DOMAIN ANALYSIS
// ============================================================================

const step1_validateAndPreprocess = async (input: UmlInput): Promise<DomainContext> => {
    logger.info({
        message: 'STEP 1: Starting validation and domain analysis',
        event_type: 'step1_start',
        id: input.id
    });

    // Validate input structure
    if (!input.typeUmlName || !input.contentAssignment ||
        !input.solutionPlantUmlCode || !input.studentPlantUmlCode) {
        throw new UmlProcessingError('Missing required input fields');
    }

    if (input.typeUmlName.toLowerCase() !== 'class') {
        throw new UmlProcessingError('Only class diagrams supported in this pipeline');
    }

    // Validate PlantUML syntax
    const validatePlantUml = (code: string, label: string) => {
        if (!code.includes('@startuml') || !code.includes('@enduml')) {
            throw new UmlProcessingError(`${label}: Missing PlantUML tags`);
        }
        // Class diagram should have 'class' keyword
        if (!code.includes('class')) {
            throw new UmlProcessingError(`${label}: No class definitions found`);
        }
    };

    validatePlantUml(input.solutionPlantUmlCode, 'Solution');
    validatePlantUml(input.studentPlantUmlCode, 'Student');

    // Extract domain context using AI
    const prompt = await promptService.getPrompts({
        type: 'class-domain-extractor',
        isActive: true,
        limit: 1
    });

    if (!prompt.prompts || prompt.prompts.length === 0) {
        throw new Error('No active class domain extractor prompt found');
    }

    const promptContent = prompt.prompts[0].templateString
        .replace(/\{\{contentAssignment\}\}/g, input.contentAssignment);

    const aiResponse = await callAIApi(promptContent, input.id, 'step1-domain');
    const domainContext = parseJsonResponse<DomainContext>(aiResponse, input.id, 'step1');

    logger.info({
        message: 'STEP 1: Completed',
        event_type: 'step1_complete',
        id: input.id,
        keywordsCount: domainContext.keywords.length,
        mandatoryEntitiesCount: domainContext.mandatoryEntities.length,
        domainRulesCount: domainContext.domainRules.length
    });

    return domainContext;
};

// ============================================================================
// STEP 2: EXTRACT TO JSON
// ============================================================================

const step2_extractToJson = async (
    input: UmlInput,
    domainContext: DomainContext
): Promise<{ solution: DiagramJSON; student: DiagramJSON }> => {
    logger.info({
        message: 'STEP 2: Starting PlantUML to JSON extraction (single call)',
        event_type: 'step2_start',
        id: input.id
    });

    const prompt = await promptService.getPrompts({
        type: 'class-plantuml-extractor',
        isActive: true,
        limit: 1
    });

    if (!prompt.prompts || prompt.prompts.length === 0) {
        throw new Error('No active class PlantUML extractor prompt found');
    }

    // Single API call for both diagrams
    const promptContent = prompt.prompts[0].templateString
        .replace(/\{\{solutionPlantUmlCode\}\}/g, input.solutionPlantUmlCode)
        .replace(/\{\{studentPlantUmlCode\}\}/g, input.studentPlantUmlCode)
        .replace(/\{\{domainContext\}\}/g, JSON.stringify(domainContext));

    const aiResponse = await callAIApi(promptContent, input.id, 'step2-extract');
    const result = parseJsonResponse<{
        solution: DiagramJSON;
        student: DiagramJSON;
    }>(aiResponse, input.id, 'step2');

    logger.info({
        message: 'STEP 2: Completed',
        event_type: 'step2_complete',
        id: input.id,
        solution: {
            classes: result.solution.classes.length,
            associations: result.solution.relationships.associations.length,
            compositions: result.solution.relationships.compositions.length
        },
        student: {
            classes: result.student.classes.length,
            associations: result.student.relationships.associations.length,
            compositions: result.student.relationships.compositions.length
        }
    });

    return result;
};

// ============================================================================
// STEP 3: SEMANTIC NORMALIZATION
// ============================================================================

const step3_semanticNormalization = async (
    input: UmlInput,
    diagrams: { solution: DiagramJSON; student: DiagramJSON }
): Promise<{ solution: NormalizedDiagram; student: NormalizedDiagram }> => {
    logger.info({
        message: 'STEP 3: Starting semantic normalization (single call)',
        event_type: 'step3_start',
        id: input.id
    });

    const prompt = await promptService.getPrompts({
        type: 'class-semantic-normalizer',
        isActive: true,
        limit: 1
    });

    if (!prompt.prompts || prompt.prompts.length === 0) {
        throw new Error('No active class semantic normalizer prompt found');
    }

    const elementsToNormalize = {
        solution: {
            classes: diagrams.solution.classes.map(c => ({
                id: c.id,
                name: c.name,
                attributes: c.attributes.map(a => a.name)
            }))
        },
        student: {
            classes: diagrams.student.classes.map(c => ({
                id: c.id,
                name: c.name,
                attributes: c.attributes.map(a => a.name)
            }))
        }
    };

    // Single API call for both diagrams
    const promptContent = prompt.prompts[0].templateString
        .replace(/\{\{elements\}\}/g, JSON.stringify(elementsToNormalize));

    const aiResponse = await callAIApi(promptContent, input.id, 'step3-normalize');
    const normalized = parseJsonResponse<{
        solution: {
            classes: Array<{
                id: string;
                canonical: string;
                similarityScore: number;
                attributes: Array<{ name: string; canonical: string; similarityScore: number }>;
            }>;
        };
        student: {
            classes: Array<{
                id: string;
                canonical: string;
                similarityScore: number;
                attributes: Array<{ name: string; canonical: string; similarityScore: number }>;
            }>;
        };
    }>(aiResponse, input.id, 'step3');

    // Helper function to merge normalized data
    const mergeNormalized = (
        classes: Class[],
        normalizedClasses: typeof normalized.solution.classes
    ): NormalizedClass[] => {
        return classes.map(cls => {
            const norm = normalizedClasses.find(n => n.id === cls.id);

            const attributesNormalized = cls.attributes.map(attr => {
                const attrNorm = norm?.attributes.find(a => a.name === attr.name);
                return {
                    ...attr,
                    normalized: {
                        original: attr.name,
                        canonical: attrNorm?.canonical || attr.name,
                        similarityScore: attrNorm?.similarityScore || 1.0
                    }
                };
            });

            return {
                ...cls,
                attributesNormalized,
                normalized: {
                    original: cls.name,
                    canonical: norm?.canonical || cls.name,
                    similarityScore: norm?.similarityScore || 1.0
                }
            };
        });
    };

    const result = {
        solution: {
            classes: mergeNormalized(diagrams.solution.classes, normalized.solution.classes),
            relationships: diagrams.solution.relationships
        },
        student: {
            classes: mergeNormalized(diagrams.student.classes, normalized.student.classes),
            relationships: diagrams.student.relationships
        }
    };

    logger.info({
        message: 'STEP 3: Completed',
        event_type: 'step3_complete',
        id: input.id
    });

    return result;
};

// ============================================================================
// STEP 4: STRUCTURE COMPARISON WITH RULE-BASED ANALYSIS
// ============================================================================

const step4_structureComparison = (
    normalized: { solution: NormalizedDiagram; student: NormalizedDiagram }
): ComparisonResult => {
    logger.info({
        message: 'STEP 4: Starting structure comparison with rule-based analysis',
        event_type: 'step4_start'
    });

    const { solution, student } = normalized;

    // ===== Compare Classes =====
    const matchedClasses: ComparisonResult['classes']['matched'] = [];
    const missingClasses: NormalizedClass[] = [];
    const extraClasses: NormalizedClass[] = [];

    const studentClassMap = new Map(
        student.classes.map(c => [c.normalized.canonical.toLowerCase(), c])
    );

    for (const solClass of solution.classes) {
        const canonical = solClass.normalized.canonical.toLowerCase();
        const stuClass = studentClassMap.get(canonical);

        if (stuClass) {
            matchedClasses.push({
                solution: solClass,
                student: stuClass,
                similarity: Math.max(solClass.normalized.similarityScore, stuClass.normalized.similarityScore)
            });
            studentClassMap.delete(canonical);
        } else {
            missingClasses.push(solClass);
        }
    }

    extraClasses.push(...Array.from(studentClassMap.values()));

    // ===== Compare Attributes (Rule-based detection) =====
    const matchedAttributes: AttributeComparison['matched'] = [];
    const missingAttributes: AttributeComparison['missing'] = [];
    const extraAttributes: AttributeComparison['extra'] = [];
    const misplacedAttributes: AttributeComparison['misplaced'] = [];

    // For each matched class, compare attributes
    for (const match of matchedClasses) {
        const solClass = match.solution;
        const stuClass = match.student;

        const stuAttrMap = new Map(
            stuClass.attributesNormalized.map(a => [a.normalized.canonical.toLowerCase(), a])
        );

        for (const solAttr of solClass.attributesNormalized) {
            const canonical = solAttr.normalized.canonical.toLowerCase();
            const stuAttr = stuAttrMap.get(canonical);

            if (stuAttr) {
                matchedAttributes.push({
                    className: solClass.name,
                    solutionAttr: solAttr,
                    studentAttr: stuAttr
                });
                stuAttrMap.delete(canonical);
            } else {
                missingAttributes.push({
                    className: solClass.name,
                    attribute: solAttr
                });
            }
        }

        // Extra attributes in student class
        for (const stuAttr of stuAttrMap.values()) {
            extraAttributes.push({
                className: stuClass.name,
                attribute: stuAttr
            });
        }
    }

    // RULE-BASED: Detect misplaced attributes
    // Check if missing attributes exist in other student classes
    for (const missing of missingAttributes) {
        const attrCanonical = missing.attribute.normalized.canonical.toLowerCase();

        for (const stuClass of student.classes) {
            const foundAttr = stuClass.attributesNormalized.find(
                a => a.normalized.canonical.toLowerCase() === attrCanonical
            );

            if (foundAttr) {
                misplacedAttributes.push({
                    attrName: missing.attribute.name,
                    inClass: stuClass.name,
                    shouldBeIn: missing.className,
                    reasoning: `Attribute "${missing.attribute.name}" found in "${stuClass.name}" but should be in "${missing.className}"`
                });
                break;
            }
        }
    }

    // ===== Compare Operations (Simple - Analysis phase optional) =====
    let matchedOperations = 0;
    let missingOperations = 0;

    for (const match of matchedClasses) {
        const solOps = match.solution.operations || [];
        const stuOps = match.student.operations || [];

        matchedOperations += Math.min(solOps.length, stuOps.length);
        missingOperations += Math.max(0, solOps.length - stuOps.length);
    }

    // ===== Compare Relationships (Rule-based) =====
    const compareRelationshipArray = <T extends { from?: string; to?: string; whole?: string; part?: string; composite?: string; component?: string; parent?: string; child?: string }>(
        solRels: T[],
        stuRels: T[],
        getKey: (rel: T) => string
    ) => {
        const solSet = new Set(solRels.map(getKey));
        const stuSet = new Set(stuRels.map(getKey));

        let matched = 0;
        for (const key of solSet) {
            if (stuSet.has(key)) matched++;
        }

        return {
            matched,
            missing: solSet.size - matched,
            extra: stuSet.size - matched
        };
    };

    // Helper: Get canonical class name
    const getCanonical = (className: string, diagram: NormalizedDiagram): string => {
        const cls = diagram.classes.find(c => c.id === className || c.name === className);
        return cls?.normalized.canonical.toLowerCase() || className.toLowerCase();
    };

    // Associations
    const associationsResult = compareRelationshipArray(
        solution.relationships.associations,
        student.relationships.associations,
        r => `${getCanonical(r.from, solution)}-${getCanonical(r.to, solution)}`
    );

    // RULE-BASED: Check multiplicity mismatches
    const wrongMultiplicity: RelationshipComparison['associations']['wrongMultiplicity'] = [];
    for (const solAssoc of solution.relationships.associations) {
        const solFromCanonical = getCanonical(solAssoc.from, solution);
        const solToCanonical = getCanonical(solAssoc.to, solution);

        const stuAssoc = student.relationships.associations.find(a => {
            const stuFromCanonical = getCanonical(a.from, student);
            const stuToCanonical = getCanonical(a.to, student);
            return (stuFromCanonical === solFromCanonical && stuToCanonical === solToCanonical) ||
                (stuFromCanonical === solToCanonical && stuToCanonical === solFromCanonical); // bidirectional
        });

        if (stuAssoc) {
            const solMult = `${solAssoc.fromMultiplicity.min}..${solAssoc.fromMultiplicity.max}`;
            const stuMult = `${stuAssoc.fromMultiplicity.min}..${stuAssoc.fromMultiplicity.max}`;
            const solMultTo = `${solAssoc.toMultiplicity.min}..${solAssoc.toMultiplicity.max}`;
            const stuMultTo = `${stuAssoc.toMultiplicity.min}..${stuAssoc.toMultiplicity.max}`;

            if (solMult !== stuMult || solMultTo !== stuMultTo) {
                wrongMultiplicity.push({
                    from: solAssoc.from,
                    to: solAssoc.to,
                    expected: `${solMult} -> ${solMultTo}`,
                    actual: `${stuMult} -> ${stuMultTo}`
                });
            }
        }
    }

    // Aggregations
    const aggregationsBasic = compareRelationshipArray(
        solution.relationships.aggregations,
        student.relationships.aggregations,
        r => `${getCanonical(r.whole, solution)}-${getCanonical(r.part, solution)}`
    );

    // RULE-BASED: Check if confused with composition
    let confusedAggWithComp = 0;
    for (const solAgg of solution.relationships.aggregations) {
        const wholeCanonical = getCanonical(solAgg.whole, solution);
        const partCanonical = getCanonical(solAgg.part, solution);

        const foundInComp = student.relationships.compositions.some(c => {
            const compCanonical = getCanonical(c.composite, student);
            const componentCanonical = getCanonical(c.component, student);
            return compCanonical === wholeCanonical && componentCanonical === partCanonical;
        });

        if (foundInComp) confusedAggWithComp++;
    }

    // Compositions
    const compositionsBasic = compareRelationshipArray(
        solution.relationships.compositions,
        student.relationships.compositions,
        r => `${getCanonical(r.composite, solution)}-${getCanonical(r.component, solution)}`
    );

    // RULE-BASED: Check if confused with aggregation
    let confusedCompWithAgg = 0;
    for (const solComp of solution.relationships.compositions) {
        const compositeCanonical = getCanonical(solComp.composite, solution);
        const componentCanonical = getCanonical(solComp.component, solution);

        const foundInAgg = student.relationships.aggregations.some(a => {
            const wholeCanonical = getCanonical(a.whole, student);
            const partCanonical = getCanonical(a.part, student);
            return wholeCanonical === compositeCanonical && partCanonical === componentCanonical;
        });

        if (foundInAgg) confusedCompWithAgg++;
    }

    // Generalizations
    const generalizationsResult = compareRelationshipArray(
        solution.relationships.generalizations,
        student.relationships.generalizations,
        r => `${getCanonical(r.parent, solution)}-${getCanonical(r.child, solution)}`
    );

    const result: ComparisonResult = {
        classes: {
            matched: matchedClasses,
            missing: missingClasses,
            extra: extraClasses
        },
        attributes: {
            matched: matchedAttributes,
            missing: missingAttributes,
            extra: extraAttributes,
            misplaced: misplacedAttributes
        },
        operations: {
            matched: matchedOperations,
            missing: missingOperations
        },
        relationships: {
            associations: {
                ...associationsResult,
                wrongMultiplicity
            },
            aggregations: {
                ...aggregationsBasic,
                confusedWithComposition: confusedAggWithComp
            },
            compositions: {
                ...compositionsBasic,
                confusedWithAggregation: confusedCompWithAgg
            },
            generalizations: generalizationsResult
        }
    };

    logger.info({
        message: 'STEP 4: Completed',
        event_type: 'step4_complete',
        classes: {
            matched: matchedClasses.length,
            missing: missingClasses.length,
            extra: extraClasses.length
        },
        attributes: {
            matched: matchedAttributes.length,
            missing: missingAttributes.length,
            misplaced: misplacedAttributes.length
        },
        relationships: {
            associations: associationsResult.matched,
            compositions: compositionsBasic.matched,
            confusions: confusedAggWithComp + confusedCompWithAgg
        }
    });

    return result;
};

// ============================================================================
// STEP 5: HYBRID ERROR CLASSIFICATION + SCORING
// ============================================================================

const step5_classifyErrorsAndScore = async (
    input: UmlInput,
    comparison: ComparisonResult,
    normalized: { solution: NormalizedDiagram; student: NormalizedDiagram },
    domainContext: DomainContext
): Promise<{ errors: DetectedError[]; score: ReferenceScore }> => {
    logger.info({
        message: 'STEP 5: Starting hybrid error classification and scoring',
        event_type: 'step5_start',
        id: input.id
    });

    const prompt = await promptService.getPrompts({
        type: 'class-error-classifier-scorer',
        isActive: true,
        limit: 1
    });

    if (!prompt.prompts || prompt.prompts.length === 0) {
        throw new Error('No active class error classifier-scorer prompt found');
    }

    // Prepare input for AI
    const classificationInput = {
        domainContext,
        comparison: {
            classes: {
                matched: comparison.classes.matched.length,
                missing: comparison.classes.missing.map(c => c.name),
                extra: comparison.classes.extra.map(c => c.name)
            },
            attributes: {
                matched: comparison.attributes.matched.length,
                missing: comparison.attributes.missing,
                extra: comparison.attributes.extra,
                misplaced: comparison.attributes.misplaced
            },
            operations: comparison.operations,
            relationships: comparison.relationships
        },
        studentDiagram: {
            classCount: normalized.student.classes.length,
            classes: normalized.student.classes.map(c => ({
                name: c.name,
                attributeCount: c.attributes.length
            }))
        },
        solutionDiagram: {
            classCount: normalized.solution.classes.length,
            classes: normalized.solution.classes.map(c => ({
                name: c.name,
                attributeCount: c.attributes.length
            }))
        },
        scoringCriteria: {
            entities: { max: 25, description: "Business entity identification" },
            attributes: { max: 20, description: "Key attributes correctness" },
            relationships: { max: 40, description: "Relationships accuracy" },
            businessLogic: { max: 15, description: "Business logic coverage" }
        }
    };

    const promptContent = prompt.prompts[0].templateString
        .replace(/\{\{classificationInput\}\}/g, JSON.stringify(classificationInput, null, 2));

    const aiResponse = await callAIApi(promptContent, input.id, 'step5-classify-score');
    const result = parseJsonResponse<{
        errors: DetectedError[];
        score: {
            total: number;
            breakdown: ScoreBreakdown;
            reasoning: string;
        };
    }>(aiResponse, input.id, 'step5');

    // Determine confidence based on ambiguous matches and AI reasoning
    const lowSimilarityCount = [
        ...comparison.classes.matched.filter(m => m.similarity < 0.85),
        ...comparison.attributes.matched.filter(m => {
            const solAttr = m.solutionAttr as any;
            const stuAttr = m.studentAttr as any;
            return (solAttr.normalized?.similarityScore || 1) < 0.85 ||
                (stuAttr.normalized?.similarityScore || 1) < 0.85;
        })
    ].length;

    const confidence: 'HIGH' | 'MEDIUM' | 'LOW' =
        lowSimilarityCount === 0 ? 'HIGH' :
            lowSimilarityCount <= 3 ? 'MEDIUM' : 'LOW';

    const range = confidence === 'HIGH' ? 2 : confidence === 'MEDIUM' ? 4 : 6;
    const suggestedRange = `${Math.max(0, Math.floor(result.score.total - range))}-${Math.min(100, Math.ceil(result.score.total + range))}`;

    const finalScore: ReferenceScore = {
        total: Math.round(result.score.total * 10) / 10,
        breakdown: result.score.breakdown,
        confidence,
        suggestedRange
    };

    logger.info({
        message: 'STEP 5: Completed',
        event_type: 'step5_complete',
        id: input.id,
        errorsDetected: result.errors.length,
        criticalCount: result.errors.filter(e => e.severity === 'CRITICAL').length,
        majorCount: result.errors.filter(e => e.severity === 'MAJOR').length,
        minorCount: result.errors.filter(e => e.severity === 'MINOR').length,
        score: finalScore.total,
        confidence
    });

    return {
        errors: result.errors,
        score: finalScore
    };
};

// ============================================================================
// STEP 6: GENERATE FEEDBACK
// ============================================================================

const step6_generateFeedback = async (
    input: UmlInput,
    referenceScore: ReferenceScore,
    errors: DetectedError[],
    comparison: ComparisonResult
): Promise<string> => {
    logger.info({
        message: 'STEP 6: Starting feedback generation',
        event_type: 'step6_start',
        id: input.id
    });

    const prompt = await promptService.getPrompts({
        type: 'class-feedback-generator',
        isActive: true,
        limit: 1
    });

    if (!prompt.prompts || prompt.prompts.length === 0) {
        throw new Error('No active class feedback generator prompt found');
    }

    const feedbackInput = {
        score: referenceScore,
        errors: errors,
        comparison: {
            classes: {
                matched: comparison.classes.matched.length,
                missing: comparison.classes.missing.length,
                extra: comparison.classes.extra.length
            },
            attributes: {
                matched: comparison.attributes.matched.length,
                missing: comparison.attributes.missing.length,
                misplaced: comparison.attributes.misplaced.length
            },
            relationships: comparison.relationships
        },
        assignmentContext: input.contentAssignment.substring(0, 500)
    };

    const promptContent = prompt.prompts[0].templateString
        .replace(/\{\{feedbackInput\}\}/g, JSON.stringify(feedbackInput, null, 2));

    const feedback = await callAIApi(promptContent, input.id, 'step6-feedback');

    logger.info({
        message: 'STEP 6: Completed',
        event_type: 'step6_complete',
        id: input.id,
        feedbackLength: feedback.length
    });

    return feedback;
};

// ============================================================================
// MAIN ORCHESTRATOR
// ============================================================================

export const processClassDiagramWithAI = async (
    input: UmlInput
): Promise<UmlProcessedResult> => {
    const startTime = Date.now();

    try {
        logger.info({
            message: '🚀 Starting 6-step Class Diagram processing pipeline',
            event_type: 'pipeline_start',
            id: input.id,
            typeUmlName: input.typeUmlName
        });

        // STEP 1: Validation & Domain Analysis
        const domainContext = await step1_validateAndPreprocess(input);

        // STEP 2: Extract to JSON
        const diagrams = await step2_extractToJson(input, domainContext);

        // STEP 3: Semantic Normalization
        const normalized = await step3_semanticNormalization(input, diagrams);

        // STEP 4: Structure Comparison (Rule-based)
        const comparison = step4_structureComparison(normalized);

        // STEP 5: Hybrid Error Classification + Scoring (AI)
        const { errors, score: referenceScore } = await step5_classifyErrorsAndScore(
            input,
            comparison,
            normalized,
            domainContext
        );

        // STEP 6: Generate Feedback
        const feedback = await step6_generateFeedback(input, referenceScore, errors, comparison);

        const duration = Date.now() - startTime;

        // Identify items needing human review
        const humanReviewItems: string[] = [];

        // Low similarity matches
        comparison.classes.matched
            .filter(m => m.similarity < 0.85)
            .forEach(m => humanReviewItems.push(
                `Class similarity low: "${m.student.name}" vs "${m.solution.name}" (${(m.similarity * 100).toFixed(0)}%)`
            ));

        // Misplaced attributes (could be valid design choice)
        if (comparison.attributes.misplaced.length > 0) {
            humanReviewItems.push(
                `${comparison.attributes.misplaced.length} potentially misplaced attribute(s) - may be valid design choice`
            );
        }

        // Extra classes that might be valid extensions
        if (comparison.classes.extra.length > 0) {
            humanReviewItems.push(
                `${comparison.classes.extra.length} extra class(es) - may be valid additions: ${comparison.classes.extra.map(c => c.name).join(', ')}`
            );
        }

        // Relationship confusions (aggregation vs composition)
        const confusions = comparison.relationships.aggregations.confusedWithComposition +
            comparison.relationships.compositions.confusedWithAggregation;
        if (confusions > 0) {
            humanReviewItems.push(
                `${confusions} aggregation/composition confusion(s) - requires conceptual review`
            );
        }

        const result: UmlProcessedResult = {
            referenceScore: {
                total: referenceScore.total,
                breakdown: referenceScore.breakdown,
                confidence: referenceScore.confidence,
                suggestedRange: referenceScore.suggestedRange
            },
            errors: errors,
            comparison: {
                classes: {
                    matched: comparison.classes.matched.length,
                    missing: comparison.classes.missing.length,
                    extra: comparison.classes.extra.length
                },
                attributes: {
                    matched: comparison.attributes.matched.length,
                    missing: comparison.attributes.missing.length,
                    extra: comparison.attributes.extra.length,
                    misplaced: comparison.attributes.misplaced.length
                },
                relationships: {
                    associations: {
                        matched: comparison.relationships.associations.matched,
                        missing: comparison.relationships.associations.missing,
                        extra: comparison.relationships.associations.extra
                    },
                    compositions: {
                        matched: comparison.relationships.compositions.matched,
                        missing: comparison.relationships.compositions.missing
                    },
                    aggregations: {
                        matched: comparison.relationships.aggregations.matched,
                        missing: comparison.relationships.aggregations.missing
                    },
                    generalizations: {
                        matched: comparison.relationships.generalizations.matched,
                        missing: comparison.relationships.generalizations.missing,
                        extra: comparison.relationships.generalizations.extra
                    }
                }
            },
            feedback: feedback,
            humanReviewItems: humanReviewItems,
            metadata: {
                processingTime: `${(duration / 1000).toFixed(1)}s`,
                aiCallsCount: 5, // 1 domain + 1 extract + 1 normalize + 1 classify-score + 1 feedback
                pipelineVersion: '1.0.0-class-analysis',
                timestamp: new Date().toISOString()
            }
        };

        logger.info({
            message: '✅ Class Diagram processing pipeline completed successfully',
            event_type: 'pipeline_complete',
            id: input.id,
            durationMs: duration,
            durationSeconds: (duration / 1000).toFixed(2),
            score: referenceScore.total,
            confidence: referenceScore.confidence,
            errorsCount: errors.length,
            humanReviewItemsCount: humanReviewItems.length
        });

        return result;

    } catch (error: unknown) {
        const duration = Date.now() - startTime;

        logger.error({
            message: '❌ Class Diagram processing pipeline failed',
            event_type: 'pipeline_error',
            id: input.id,
            typeUmlName: input.typeUmlName,
            error_name: (error as Error).name,
            error_message: getErrorMessage(error),
            durationMs: duration,
            stack: (error as Error).stack
        });

        // Re-throw with context
        if (error instanceof AIValidationError) {
            throw error;
        } else if (error instanceof UmlProcessingError) {
            throw error;
        } else {
            throw new UmlProcessingError(`Class Diagram pipeline failed: ${getErrorMessage(error)}`);
        }
    }
};