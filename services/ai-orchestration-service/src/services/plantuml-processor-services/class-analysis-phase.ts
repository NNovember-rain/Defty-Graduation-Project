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
}

interface Operation {
    name: string;
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

interface Relationships {
    associations: Association[];
    aggregations: Aggregation[];
    compositions: Composition[];
    generalizations: Generalization[];
}

interface DiagramJSON {
    classes: Class[];
    relationships: Relationships;
}

interface NormalizedElement {
    original: string;
    canonical: string;
    similarityScore: number;
}

interface NormalizedAttribute extends Attribute {
    normalized: NormalizedElement;
}

interface NormalizedClass extends Class {
    normalized: NormalizedElement;
    attributesNormalized: NormalizedAttribute[];
}

interface NormalizedDiagram {
    classes: NormalizedClass[];
    relationships: Relationships;
}

// ============================================================================
// ATTRIBUTE PATTERN TYPES (Step 4.3)
// ============================================================================

interface AttributeDecomposition {
    type: 'DECOMPOSITION';
    sourceAttribute: string;
    sourceClass: string;
    decomposedInto: string[];
    targetClass: string;
    confidence: number;
    isValid: boolean;
}

interface AttributeConsolidation {
    type: 'CONSOLIDATION';
    sourceAttributes: string[];
    sourceClass: string;
    consolidatedInto: string;
    targetClass: string;
    confidence: number;
    isValid: boolean;
}

type AttributePattern = AttributeDecomposition | AttributeConsolidation;

// ============================================================================
// COMPARISON RESULT TYPES
// ============================================================================

interface AttributeComparison {
    matched: Array<{
        className: string;
        solutionAttr: NormalizedAttribute;
        studentAttr: NormalizedAttribute;
        similarity: number;
    }>;
    missing: Array<{
        className: string;
        attribute: NormalizedAttribute;
    }>;
    extra: Array<{
        className: string;
        attribute: NormalizedAttribute;
    }>;
    misplaced: Array<{
        attrName: string;
        attrCanonical: string;
        inClass: string;
        inClassCanonical: string;
        shouldBeIn: string;
        shouldBeInCanonical: string;
        reasoning: string;
    }>;
    patterns: AttributePattern[];
}

interface RelationshipComparisonDetail {
    matched: number;
    missing: number;
    extra: number;
    details: {
        matchedPairs: Array<{ solution: string; student: string }>;
        missingKeys: string[];
        extraKeys: string[];
    };
}

interface AggregationComparisonDetail extends RelationshipComparisonDetail {
    confusedWithComposition: Array<{
        whole: string;
        part: string;
        wholeCanonical: string;
        partCanonical: string;
    }>;
}

interface CompositionComparisonDetail extends RelationshipComparisonDetail {
    confusedWithAggregation: Array<{
        composite: string;
        component: string;
        compositeCanonical: string;
        componentCanonical: string;
    }>;
}

interface GeneralizationComparisonDetail extends RelationshipComparisonDetail {
    reversed: Array<{
        solutionParent: string;
        solutionChild: string;
        studentParent: string;
        studentChild: string;
    }>;
}

interface RelationshipComparison {
    associations: RelationshipComparisonDetail & {
        wrongMultiplicity: Array<{
            from: string;
            to: string;
            expected: { from: Multiplicity; to: Multiplicity };
            actual: { from: Multiplicity; to: Multiplicity };
        }>;
    };
    aggregations: AggregationComparisonDetail;
    compositions: CompositionComparisonDetail;
    generalizations: GeneralizationComparisonDetail;
}

interface ComparisonResult {
    classes: {
        matched: Array<{
            solution: NormalizedClass;
            student: NormalizedClass;
            similarity: number;
        }>;
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



// ============================================================================
// PART 2: GRAPH ANALYSIS, ERROR CLASSIFICATION, SCORING & FEEDBACK
// ============================================================================


interface GraphNode {
    id: string;
    name: string;
    canonical?: string;
    type: 'class';
    attributeCount: number;
    operationCount: number;
}

interface GraphEdge {
    from: string;
    to: string;
    type: 'association' | 'aggregation' | 'composition' | 'generalization';
    fromCanonical: string;
    toCanonical: string;
}

interface GraphMetrics {
    classCount: number;
    edgeCount: number;
    avgDegree: number;
    maxDepth: number;
    degreeCentrality: Map<string, number>;
    betweennessCentrality: Map<string, number>;
    compositionChainDepth: number;
    avgAttributeCohesion: number;
}

interface CompositionChain {
    chain: string[];
    chainNames: string[];
    depth: number;
    isCascadeDelete: boolean;
}

interface LifecycleViolation {
    type: 'COMPOSITION_TO_AGGREGATION' | 'AGGREGATION_TO_COMPOSITION' | 'BROKEN_CASCADE';
    from: string;
    to: string;
    fromCanonical: string;
    toCanonical: string;
    expected: 'composition' | 'aggregation';
    actual: 'composition' | 'aggregation';
    businessImpact: string;
}

interface GraphPattern {
    type: 'CLASS_DECOMPOSITION'
        | 'CLASS_CONSOLIDATION'
        | 'MISSING_CENTRAL_CLASS'
        | 'MISSING_ABSTRACT_PARENT'
        | 'COMPOSITION_LIFECYCLE_VIOLATION'
        | 'ATTRIBUTE_MIGRATION_WITH_RELATIONSHIP'
        | 'GENERALIZATION_PRESERVED'
        | 'OVER_NORMALIZATION'
        | 'UNDER_NORMALIZATION'
        | 'STRUCTURAL_ISOMORPHISM'
        | 'ISOLATED_CLASS';
    severity: 'POSITIVE' | 'NEUTRAL' | 'MINOR' | 'MAJOR' | 'CRITICAL';
    confidence: number;
    elements: {
        sourceClass?: string;
        targetClasses?: string[];
        decomposedInto?: string[];
        consolidatedFrom?: string[];
        missingClass?: string;
        attributeMigration?: Array<{ attr: string; from: string; to: string }>;
        compositionChain?: string[];
        violationDetails?: LifecycleViolation;
        metrics?: Record<string, number | string>;
        [key: string]: unknown;
    };
    structuralEquivalence: boolean;
    designQuality?: {
        rating: 'EXCELLENT' | 'GOOD' | 'ACCEPTABLE' | 'POOR';
        reasoning: string;
        cohesionImprovement?: string;
    };
}

interface GraphEquivalence {
    type: 'structural_decomposition' | 'structural_consolidation' | 'isomorphic' | 'refactored' | 'hierarchy_preserved';
    confidence: number;
    explanation: string;
    affectedClasses: string[];
}

interface GraphRecommendation {
    code: 'IGNORE_EXTRA_CLASSES' | 'IGNORE_MISSING_CLASS' | 'REDUCE_PENALTY'
        | 'INCREASE_PENALTY' | 'ADD_BONUS' | 'REQUIRE_HUMAN_REVIEW' | 'IGNORE_ATTRIBUTE_DIFF';
    reason: string;
    affectedElements: string[];
    penaltyAdjustment: number;
    requiresHumanReview?: boolean;
    reviewContext?: string;
}

interface GraphAnalysisResult {
    patterns: GraphPattern[];
    structuralMetrics: {
        solution: GraphMetrics;
        student: GraphMetrics;
    };
    lifecycleAnalysis: {
        compositionChains: CompositionChain[];
        violations: LifecycleViolation[];
    };
    detectedEquivalences: GraphEquivalence[];
    recommendations: GraphRecommendation[];
}

// ============================================================================
// ERROR & SCORING TYPES
// ============================================================================

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
    [key: string]: { score: number; max: number; details: string };
}

interface GraphAdjustment {
    pattern: string;
    originalPenalty: number;
    adjustedPenalty: number;
    reasoning: string;
}

interface ReferenceScore {
    total: number;
    breakdown: ScoreBreakdown;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    suggestedRange: string;
    graphAdjustments?: GraphAdjustment[];
}

// ============================================================================
// HELPER FUNCTIONS FOR CANONICAL-BASED COMPARISON
// ============================================================================

/**
 * Build a map from canonical name to array of elements (handles duplicates)
 */
const buildCanonicalMap = <T extends { normalized: NormalizedElement }>(
    elements: T[]
): Map<string, T[]> => {
    const map = new Map<string, T[]>();
    for (const element of elements) {
        const canonical = element.normalized.canonical.toLowerCase();
        if (!map.has(canonical)) {
            map.set(canonical, []);
        }
        map.get(canonical)!.push(element);
    }
    return map;
};

/**
 * Build a map from canonical name to single element (first occurrence)
 */
const buildCanonicalMapSingle = <T extends { normalized: NormalizedElement }>(
    elements: T[]
): Map<string, T> => {
    const map = new Map<string, T>();
    for (const element of elements) {
        const canonical = element.normalized.canonical.toLowerCase();
        if (!map.has(canonical)) {
            map.set(canonical, element);
        }
    }
    return map;
};

/**
 * Find element by ID in an array
 */
const findById = <T extends { id: string }>(
    elements: T[],
    id: string
): T | undefined => {
    return elements.find(e => e.id === id);
};

/**
 * Find element by name in an array
 */
const findByName = <T extends { name: string }>(
    elements: T[],
    name: string
): T | undefined => {
    return elements.find(e => e.name === name);
};

/**
 * Get canonical name for a class by ID or name
 */
const getClassCanonical = (
    classIdOrName: string,
    diagram: NormalizedDiagram
): string | null => {
    const cls = diagram.classes.find(
        c => c.id === classIdOrName || c.name === classIdOrName
    );
    return cls?.normalized.canonical.toLowerCase() || null;
};

/**
 * Find class by canonical name
 */
const findClassByCanonical = (
    canonical: string,
    diagram: NormalizedDiagram
): NormalizedClass | undefined => {
    return diagram.classes.find(
        c => c.normalized.canonical.toLowerCase() === canonical.toLowerCase()
    );
};

// ============================================================================
// RELATIONSHIP COMPARISON HELPERS
// ============================================================================

/**
 * Compare Associations using canonical names
 * Associations are bidirectional, so A-B equals B-A
 */
const compareAssociations = (
    solutionRels: Association[],
    studentRels: Association[],
    solution: NormalizedDiagram,
    student: NormalizedDiagram
): RelationshipComparison['associations'] => {
    // Build canonical keys for solution (bidirectional - sort alphabetically)
    const solutionKeys = new Map<string, Association>();
    for (const rel of solutionRels) {
        const fromCanonical = getClassCanonical(rel.from, solution);
        const toCanonical = getClassCanonical(rel.to, solution);

        if (fromCanonical && toCanonical) {
            // Sort to make bidirectional comparison work
            const sortedKey = [fromCanonical, toCanonical].sort().join('::assoc::');
            solutionKeys.set(sortedKey, rel);
        }
    }

    // Build canonical keys for student (with array for duplicates)
    const studentKeysMap = new Map<string, Array<{ rel: Association; key: string }>>();
    for (const rel of studentRels) {
        const fromCanonical = getClassCanonical(rel.from, student);
        const toCanonical = getClassCanonical(rel.to, student);

        if (fromCanonical && toCanonical) {
            const sortedKey = [fromCanonical, toCanonical].sort().join('::assoc::');

            if (!studentKeysMap.has(sortedKey)) {
                studentKeysMap.set(sortedKey, []);
            }
            studentKeysMap.get(sortedKey)!.push({ rel, key: sortedKey });
        }
    }

    // Match relationships
    const matchedPairs: Array<{ solution: string; student: string }> = [];
    const matchedSolutionKeys = new Set<string>();
    const wrongMultiplicity: RelationshipComparison['associations']['wrongMultiplicity'] = [];

    for (const [key, solRel] of solutionKeys) {
        const stuRels = studentKeysMap.get(key) || [];
        if (stuRels.length > 0) {
            const stuData = stuRels.shift()!;
            matchedSolutionKeys.add(key);
            matchedPairs.push({ solution: key, student: stuData.key });

            // Check multiplicity
            const stuRel = stuData.rel;
            const solFromCanonical = getClassCanonical(solRel.from, solution);
            const solToCanonical = getClassCanonical(solRel.to, solution);
            const stuFromCanonical = getClassCanonical(stuRel.from, student);
            const stuToCanonical = getClassCanonical(stuRel.to, student);

            // Normalize direction for comparison
            let expectedFrom = solRel.fromMultiplicity;
            let expectedTo = solRel.toMultiplicity;
            let actualFrom = stuRel.fromMultiplicity;
            let actualTo = stuRel.toMultiplicity;

            // If student has reversed direction, swap multiplicities
            if (solFromCanonical === stuToCanonical && solToCanonical === stuFromCanonical) {
                actualFrom = stuRel.toMultiplicity;
                actualTo = stuRel.fromMultiplicity;
            }

            // Compare multiplicities
            const fromMatch = expectedFrom.min === actualFrom.min && expectedFrom.max === actualFrom.max;
            const toMatch = expectedTo.min === actualTo.min && expectedTo.max === actualTo.max;

            if (!fromMatch || !toMatch) {
                wrongMultiplicity.push({
                    from: solRel.from,
                    to: solRel.to,
                    expected: { from: expectedFrom, to: expectedTo },
                    actual: { from: actualFrom, to: actualTo }
                });
            }

            if (stuRels.length === 0) {
                studentKeysMap.delete(key);
            }
        }
    }

    // Count remaining
    const missingKeys = Array.from(solutionKeys.keys()).filter(k => !matchedSolutionKeys.has(k));
    const extraKeys: string[] = [];
    for (const stuRels of studentKeysMap.values()) {
        for (const stuData of stuRels) {
            extraKeys.push(stuData.key);
        }
    }

    return {
        matched: matchedPairs.length,
        missing: missingKeys.length,
        extra: extraKeys.length,
        details: { matchedPairs, missingKeys, extraKeys },
        wrongMultiplicity
    };
};

/**
 * Compare Aggregations using canonical names
 * Also detect confusion with Compositions
 */
const compareAggregations = (
    solutionRels: Aggregation[],
    studentRels: Aggregation[],
    studentCompositions: Composition[],
    solution: NormalizedDiagram,
    student: NormalizedDiagram
): AggregationComparisonDetail => {
    // Build canonical keys for solution: "whole::agg::part"
    const solutionKeys = new Map<string, Aggregation>();
    for (const rel of solutionRels) {
        const wholeCanonical = getClassCanonical(rel.whole, solution);
        const partCanonical = getClassCanonical(rel.part, solution);

        if (wholeCanonical && partCanonical) {
            const key = `${wholeCanonical}::agg::${partCanonical}`;
            solutionKeys.set(key, rel);
        }
    }

    // Build canonical keys for student aggregations
    const studentKeysMap = new Map<string, Array<{ rel: Aggregation; key: string }>>();
    for (const rel of studentRels) {
        const wholeCanonical = getClassCanonical(rel.whole, student);
        const partCanonical = getClassCanonical(rel.part, student);

        if (wholeCanonical && partCanonical) {
            const key = `${wholeCanonical}::agg::${partCanonical}`;

            if (!studentKeysMap.has(key)) {
                studentKeysMap.set(key, []);
            }
            studentKeysMap.get(key)!.push({ rel, key });
        }
    }

    // Build canonical keys for student compositions (to detect confusion)
    const studentCompKeys = new Set<string>();
    for (const rel of studentCompositions) {
        const compositeCanonical = getClassCanonical(rel.composite, student);
        const componentCanonical = getClassCanonical(rel.component, student);

        if (compositeCanonical && componentCanonical) {
            // Key format matching aggregation: "whole::part"
            studentCompKeys.add(`${compositeCanonical}::${componentCanonical}`);
        }
    }

    // Match and detect confusion
    const matchedPairs: Array<{ solution: string; student: string }> = [];
    const matchedSolutionKeys = new Set<string>();
    const confusedWithComposition: AggregationComparisonDetail['confusedWithComposition'] = [];

    for (const [key, solRel] of solutionKeys) {
        const stuRels = studentKeysMap.get(key) || [];
        if (stuRels.length > 0) {
            const stuData = stuRels.shift()!;
            matchedSolutionKeys.add(key);
            matchedPairs.push({ solution: key, student: stuData.key });

            if (stuRels.length === 0) {
                studentKeysMap.delete(key);
            }
        } else {
            // Check if student used composition instead
            const wholeCanonical = getClassCanonical(solRel.whole, solution)!;
            const partCanonical = getClassCanonical(solRel.part, solution)!;
            const compKey = `${wholeCanonical}::${partCanonical}`;

            if (studentCompKeys.has(compKey)) {
                confusedWithComposition.push({
                    whole: solRel.whole,
                    part: solRel.part,
                    wholeCanonical,
                    partCanonical
                });
                matchedSolutionKeys.add(key); // Count as "handled" (not pure missing)
            }
        }
    }

    const missingKeys = Array.from(solutionKeys.keys()).filter(k => !matchedSolutionKeys.has(k));
    const extraKeys: string[] = [];
    for (const stuRels of studentKeysMap.values()) {
        for (const stuData of stuRels) {
            extraKeys.push(stuData.key);
        }
    }

    return {
        matched: matchedPairs.length,
        missing: missingKeys.length,
        extra: extraKeys.length,
        details: { matchedPairs, missingKeys, extraKeys },
        confusedWithComposition
    };
};

/**
 * Compare Compositions using canonical names
 * Also detect confusion with Aggregations
 */
const compareCompositions = (
    solutionRels: Composition[],
    studentRels: Composition[],
    studentAggregations: Aggregation[],
    solution: NormalizedDiagram,
    student: NormalizedDiagram
): CompositionComparisonDetail => {
    // Build canonical keys for solution: "composite::comp::component"
    const solutionKeys = new Map<string, Composition>();
    for (const rel of solutionRels) {
        const compositeCanonical = getClassCanonical(rel.composite, solution);
        const componentCanonical = getClassCanonical(rel.component, solution);

        if (compositeCanonical && componentCanonical) {
            const key = `${compositeCanonical}::comp::${componentCanonical}`;
            solutionKeys.set(key, rel);
        }
    }

    // Build canonical keys for student compositions
    const studentKeysMap = new Map<string, Array<{ rel: Composition; key: string }>>();
    for (const rel of studentRels) {
        const compositeCanonical = getClassCanonical(rel.composite, student);
        const componentCanonical = getClassCanonical(rel.component, student);

        if (compositeCanonical && componentCanonical) {
            const key = `${compositeCanonical}::comp::${componentCanonical}`;

            if (!studentKeysMap.has(key)) {
                studentKeysMap.set(key, []);
            }
            studentKeysMap.get(key)!.push({ rel, key });
        }
    }

    // Build canonical keys for student aggregations (to detect confusion)
    const studentAggKeys = new Set<string>();
    for (const rel of studentAggregations) {
        const wholeCanonical = getClassCanonical(rel.whole, student);
        const partCanonical = getClassCanonical(rel.part, student);

        if (wholeCanonical && partCanonical) {
            studentAggKeys.add(`${wholeCanonical}::${partCanonical}`);
        }
    }

    // Match and detect confusion
    const matchedPairs: Array<{ solution: string; student: string }> = [];
    const matchedSolutionKeys = new Set<string>();
    const confusedWithAggregation: CompositionComparisonDetail['confusedWithAggregation'] = [];

    for (const [key, solRel] of solutionKeys) {
        const stuRels = studentKeysMap.get(key) || [];
        if (stuRels.length > 0) {
            const stuData = stuRels.shift()!;
            matchedSolutionKeys.add(key);
            matchedPairs.push({ solution: key, student: stuData.key });

            if (stuRels.length === 0) {
                studentKeysMap.delete(key);
            }
        } else {
            // Check if student used aggregation instead
            const compositeCanonical = getClassCanonical(solRel.composite, solution)!;
            const componentCanonical = getClassCanonical(solRel.component, solution)!;
            const aggKey = `${compositeCanonical}::${componentCanonical}`;

            if (studentAggKeys.has(aggKey)) {
                confusedWithAggregation.push({
                    composite: solRel.composite,
                    component: solRel.component,
                    compositeCanonical,
                    componentCanonical
                });
                matchedSolutionKeys.add(key);
            }
        }
    }

    const missingKeys = Array.from(solutionKeys.keys()).filter(k => !matchedSolutionKeys.has(k));
    const extraKeys: string[] = [];
    for (const stuRels of studentKeysMap.values()) {
        for (const stuData of stuRels) {
            extraKeys.push(stuData.key);
        }
    }

    return {
        matched: matchedPairs.length,
        missing: missingKeys.length,
        extra: extraKeys.length,
        details: { matchedPairs, missingKeys, extraKeys },
        confusedWithAggregation
    };
};

/**
 * Compare Generalizations using canonical names
 * Also detect reversed relationships (parent-child swapped)
 */
const compareGeneralizations = (
    solutionRels: Generalization[],
    studentRels: Generalization[],
    solution: NormalizedDiagram,
    student: NormalizedDiagram
): GeneralizationComparisonDetail => {
    // Build canonical keys for solution: "parent::gen::child"
    const solutionKeys = new Map<string, { rel: Generalization; parentCanonical: string; childCanonical: string }>();
    for (const rel of solutionRels) {
        const parentCanonical = getClassCanonical(rel.parent, solution);
        const childCanonical = getClassCanonical(rel.child, solution);

        if (parentCanonical && childCanonical) {
            const key = `${parentCanonical}::gen::${childCanonical}`;
            solutionKeys.set(key, { rel, parentCanonical, childCanonical });
        }
    }

    // Build canonical keys for student
    const studentKeysMap = new Map<string, Array<{
        rel: Generalization;
        key: string;
        parentCanonical: string;
        childCanonical: string;
    }>>();
    for (const rel of studentRels) {
        const parentCanonical = getClassCanonical(rel.parent, student);
        const childCanonical = getClassCanonical(rel.child, student);

        if (parentCanonical && childCanonical) {
            const key = `${parentCanonical}::gen::${childCanonical}`;

            if (!studentKeysMap.has(key)) {
                studentKeysMap.set(key, []);
            }
            studentKeysMap.get(key)!.push({ rel, key, parentCanonical, childCanonical });
        }
    }

    // Match and detect reversed
    const matchedPairs: Array<{ solution: string; student: string }> = [];
    const matchedSolutionKeys = new Set<string>();
    const reversed: GeneralizationComparisonDetail['reversed'] = [];

    for (const [key, solData] of solutionKeys) {
        const stuRels = studentKeysMap.get(key) || [];
        if (stuRels.length > 0) {
            const stuData = stuRels.shift()!;
            matchedSolutionKeys.add(key);
            matchedPairs.push({ solution: key, student: stuData.key });

            if (stuRels.length === 0) {
                studentKeysMap.delete(key);
            }
        } else {
            // Check for reversed relationship
            const reversedKey = `${solData.childCanonical}::gen::${solData.parentCanonical}`;
            const stuReversed = studentKeysMap.get(reversedKey);

            if (stuReversed && stuReversed.length > 0) {
                const stuData = stuReversed.shift()!;

                reversed.push({
                    solutionParent: solData.rel.parent,
                    solutionChild: solData.rel.child,
                    studentParent: stuData.rel.parent,
                    studentChild: stuData.rel.child
                });

                matchedSolutionKeys.add(key); // Count as handled

                if (stuReversed.length === 0) {
                    studentKeysMap.delete(reversedKey);
                }
            }
        }
    }

    const missingKeys = Array.from(solutionKeys.keys()).filter(k => !matchedSolutionKeys.has(k));
    const extraKeys: string[] = [];
    for (const stuRels of studentKeysMap.values()) {
        for (const stuData of stuRels) {
            extraKeys.push(stuData.key);
        }
    }

    return {
        matched: matchedPairs.length,
        missing: missingKeys.length,
        extra: extraKeys.length,
        details: { matchedPairs, missingKeys, extraKeys },
        reversed
    };
};

// ============================================================================
// STEP 1: VALIDATION & DOMAIN ANALYSIS
// ============================================================================

const step1_validateAndPreprocess = async (input: UmlInput): Promise<DomainContext> => {
    logger.info({
        message: 'BƯỚC 1: Bắt đầu validation và domain analysis',
        event_type: 'step1_start',
        id: input.id
    });

    // Validate required fields
    if (!input.typeUmlName || !input.contentAssignment ||
        !input.solutionPlantUmlCode || !input.studentPlantUmlCode) {
        throw new UmlProcessingError('Thiếu trường bắt buộc trong input');
    }

    // Validate PlantUML format
    const validatePlantUml = (code: string, label: string) => {
        if (!code.includes('@startuml') || !code.includes('@enduml')) {
            throw new UmlProcessingError(`${label}: Thiếu PlantUML tags (@startuml/@enduml)`);
        }
        if (!code.includes('class ')) {
            throw new UmlProcessingError(`${label}: Không tìm thấy class definitions`);
        }
    };

    validatePlantUml(input.solutionPlantUmlCode, 'Solution');
    validatePlantUml(input.studentPlantUmlCode, 'Student');

    // Get domain analysis prompt
    const prompt = await promptService.getPrompts({
        type: 'class-analysis-domain-extractor',
        isActive: true,
        limit: 1
    });

    if (!prompt.prompts || prompt.prompts.length === 0) {
        throw new Error('Không tìm thấy prompt class-analysis-domain-extractor');
    }

    const promptContent = prompt.prompts[0].templateString
        .replace(/\{\{contentAssignment\}\}/g, input.contentAssignment);

    const aiResponse = await callAIApi(promptContent, input.id, 'step1-domain');
    const domainContext = parseJsonResponse<DomainContext>(aiResponse, input.id, 'step1');

    // Validate domain context structure
    if (!domainContext.keywords || !Array.isArray(domainContext.keywords)) {
        domainContext.keywords = [];
    }
    if (!domainContext.mandatoryEntities || !Array.isArray(domainContext.mandatoryEntities)) {
        domainContext.mandatoryEntities = [];
    }
    if (!domainContext.domainRules || !Array.isArray(domainContext.domainRules)) {
        domainContext.domainRules = [];
    }

    logger.info({
        message: 'BƯỚC 1: Hoàn thành',
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
        message: 'BƯỚC 2: Bắt đầu trích xuất PlantUML sang JSON',
        event_type: 'step2_start',
        id: input.id
    });

    const prompt = await promptService.getPrompts({
        type: 'class-analysis-plantuml-extractor',
        isActive: true,
        limit: 1
    });

    if (!prompt.prompts || prompt.prompts.length === 0) {
        throw new Error('Không tìm thấy prompt class-analysis-plantuml-extractor');
    }

    const promptContent = prompt.prompts[0].templateString
        .replace(/\{\{solutionPlantUmlCode\}\}/g, input.solutionPlantUmlCode)
        .replace(/\{\{studentPlantUmlCode\}\}/g, input.studentPlantUmlCode)
        .replace(/\{\{domainContext\}\}/g, JSON.stringify(domainContext));

    const aiResponse = await callAIApi(promptContent, input.id, 'step2-extract');
    const result = parseJsonResponse<{
        solution: DiagramJSON;
        student: DiagramJSON;
    }>(aiResponse, input.id, 'step2');

    // Validate and normalize result structure
    const validateDiagram = (diagram: DiagramJSON, label: string): DiagramJSON => {
        if (!diagram.classes || !Array.isArray(diagram.classes)) {
            diagram.classes = [];
        }
        if (!diagram.relationships) {
            diagram.relationships = {
                associations: [],
                aggregations: [],
                compositions: [],
                generalizations: []
            };
        }
        if (!Array.isArray(diagram.relationships.associations)) {
            diagram.relationships.associations = [];
        }
        if (!Array.isArray(diagram.relationships.aggregations)) {
            diagram.relationships.aggregations = [];
        }
        if (!Array.isArray(diagram.relationships.compositions)) {
            diagram.relationships.compositions = [];
        }
        if (!Array.isArray(diagram.relationships.generalizations)) {
            diagram.relationships.generalizations = [];
        }

        // Ensure each class has required fields
        for (const cls of diagram.classes) {
            if (!cls.id) cls.id = cls.name;
            if (!cls.attributes) cls.attributes = [];
            if (!cls.operations) cls.operations = [];
        }

        return diagram;
    };

    result.solution = validateDiagram(result.solution, 'Solution');
    result.student = validateDiagram(result.student, 'Student');

    logger.info({
        message: 'BƯỚC 2: Hoàn thành',
        event_type: 'step2_complete',
        id: input.id,
        solution: {
            classesCount: result.solution.classes.length,
            associationsCount: result.solution.relationships.associations.length,
            aggregationsCount: result.solution.relationships.aggregations.length,
            compositionsCount: result.solution.relationships.compositions.length,
            generalizationsCount: result.solution.relationships.generalizations.length
        },
        student: {
            classesCount: result.student.classes.length,
            associationsCount: result.student.relationships.associations.length,
            aggregationsCount: result.student.relationships.aggregations.length,
            compositionsCount: result.student.relationships.compositions.length,
            generalizationsCount: result.student.relationships.generalizations.length
        }
    });

    return result;
};

// ============================================================================
// STEP 3: SEMANTIC NORMALIZATION
// ============================================================================

const step3_semanticNormalization = async (
    input: UmlInput,
    diagrams: { solution: DiagramJSON; student: DiagramJSON },
    domainContext: DomainContext
): Promise<{ solution: NormalizedDiagram; student: NormalizedDiagram }> => {
    logger.info({
        message: 'BƯỚC 3: Bắt đầu chuẩn hóa semantic',
        event_type: 'step3_start',
        id: input.id
    });

    const prompt = await promptService.getPrompts({
        type: 'class-analysis-semantic-normalizer',
        isActive: true,
        limit: 1
    });

    if (!prompt.prompts || prompt.prompts.length === 0) {
        throw new Error('Không tìm thấy prompt class-analysis-semantic-normalizer');
    }

    // Prepare elements for normalization
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
        },
        domainContext: {
            keywords: domainContext.keywords,
            mandatoryEntities: domainContext.mandatoryEntities
        }
    };

    const promptContent = prompt.prompts[0].templateString
        .replace(/\{\{elements\}\}/g, JSON.stringify(elementsToNormalize, null, 2));

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

    // Merge normalized data with original diagrams
    const mergeNormalized = (
        classes: Class[],
        normalizedClasses: typeof normalized.solution.classes
    ): NormalizedClass[] => {
        return classes.map(cls => {
            const norm = normalizedClasses.find(n => n.id === cls.id);

            // Normalize attributes
            const attributesNormalized: NormalizedAttribute[] = cls.attributes.map(attr => {
                const attrNorm = norm?.attributes.find(a => a.name === attr.name);
                return {
                    ...attr,
                    normalized: {
                        original: attr.name,
                        canonical: attrNorm?.canonical || attr.name.toLowerCase(),
                        similarityScore: attrNorm?.similarityScore || 1.0
                    }
                };
            });

            return {
                ...cls,
                attributesNormalized,
                normalized: {
                    original: cls.name,
                    canonical: norm?.canonical || cls.name.toLowerCase(),
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
        message: 'BƯỚC 3: Hoàn thành',
        event_type: 'step3_complete',
        id: input.id,
        solutionClassesNormalized: result.solution.classes.length,
        studentClassesNormalized: result.student.classes.length
    });

    return result;
};

// ============================================================================
// STEP 4: STRUCTURE COMPARISON (WITH AI FOR ATTRIBUTE PATTERNS)
// ============================================================================

const step4_structureComparison = async (
    input: UmlInput,
    normalized: { solution: NormalizedDiagram; student: NormalizedDiagram }
): Promise<ComparisonResult> => {
    logger.info({
        message: 'BƯỚC 4: Bắt đầu so sánh cấu trúc',
        event_type: 'step4_start',
        id: input.id
    });

    const { solution, student } = normalized;

    // ========================================================================
    // 4.1: Compare Classes using canonical names
    // ========================================================================

    const matchedClasses: ComparisonResult['classes']['matched'] = [];
    const missingClasses: NormalizedClass[] = [];
    const extraClasses: NormalizedClass[] = [];

    const studentClassMap = buildCanonicalMap(student.classes);

    for (const solClass of solution.classes) {
        const canonical = solClass.normalized.canonical.toLowerCase();
        const stuClasses = studentClassMap.get(canonical);

        if (stuClasses && stuClasses.length > 0) {
            const stuClass = stuClasses.shift()!;
            const similarity = Math.min(
                solClass.normalized.similarityScore,
                stuClass.normalized.similarityScore
            );

            matchedClasses.push({
                solution: solClass,
                student: stuClass,
                similarity
            });

            if (stuClasses.length === 0) {
                studentClassMap.delete(canonical);
            }
        } else {
            missingClasses.push(solClass);
        }
    }

    for (const stuClasses of studentClassMap.values()) {
        extraClasses.push(...stuClasses);
    }

    // ========================================================================
    // 4.2: Compare Attributes within matched classes
    // ========================================================================

    const matchedAttributes: AttributeComparison['matched'] = [];
    const missingAttributes: AttributeComparison['missing'] = [];
    const extraAttributes: AttributeComparison['extra'] = [];
    const misplacedAttributes: AttributeComparison['misplaced'] = [];

    for (const match of matchedClasses) {
        const solClass = match.solution;
        const stuClass = match.student;

        const stuAttrMap = buildCanonicalMap(stuClass.attributesNormalized);

        for (const solAttr of solClass.attributesNormalized) {
            const canonical = solAttr.normalized.canonical.toLowerCase();
            const stuAttrs = stuAttrMap.get(canonical);

            if (stuAttrs && stuAttrs.length > 0) {
                const stuAttr = stuAttrs.shift()!;
                matchedAttributes.push({
                    className: solClass.name,
                    solutionAttr: solAttr,
                    studentAttr: stuAttr,
                    similarity: Math.min(
                        solAttr.normalized.similarityScore,
                        stuAttr.normalized.similarityScore
                    )
                });

                if (stuAttrs.length === 0) {
                    stuAttrMap.delete(canonical);
                }
            } else {
                missingAttributes.push({
                    className: solClass.name,
                    attribute: solAttr
                });
            }
        }

        for (const stuAttrs of stuAttrMap.values()) {
            for (const stuAttr of stuAttrs) {
                extraAttributes.push({
                    className: stuClass.name,
                    attribute: stuAttr
                });
            }
        }
    }

    for (const extraClass of extraClasses) {
        for (const attr of extraClass.attributesNormalized) {
            extraAttributes.push({
                className: extraClass.name,
                attribute: attr
            });
        }
    }

    // Detect misplaced attributes
    for (const missing of missingAttributes) {
        const attrCanonical = missing.attribute.normalized.canonical.toLowerCase();

        for (const stuClass of student.classes) {
            const stuClassCanonical = stuClass.normalized.canonical.toLowerCase();
            const shouldBeInClass = matchedClasses.find(
                m => m.solution.name === missing.className
            );
            if (shouldBeInClass &&
                shouldBeInClass.student.normalized.canonical.toLowerCase() === stuClassCanonical) {
                continue;
            }

            const foundAttr = stuClass.attributesNormalized.find(
                a => a.normalized.canonical.toLowerCase() === attrCanonical
            );

            if (foundAttr) {
                misplacedAttributes.push({
                    attrName: missing.attribute.name,
                    attrCanonical: attrCanonical,
                    inClass: stuClass.name,
                    inClassCanonical: stuClassCanonical,
                    shouldBeIn: missing.className,
                    shouldBeInCanonical: solution.classes.find(
                        c => c.name === missing.className
                    )?.normalized.canonical.toLowerCase() || missing.className.toLowerCase(),
                    reasoning: `Attribute "${missing.attribute.name}" found in "${stuClass.name}" but should be in "${missing.className}"`
                });
                break;
            }
        }
    }

    // ========================================================================
    // 4.3: Detect Attribute Patterns with AI
    // ========================================================================

    let attributePatterns: AttributePattern[] = [];

    // Prepare input for AI: matched classes with full attribute comparison
    const matchedClassesWithAttributes = matchedClasses.map(match => {
        const solClass = match.solution;
        const stuClass = match.student;

        // Get matched, missing, extra attributes for this class
        const classMatchedAttrs = matchedAttributes
            .filter(m => m.className === solClass.name)
            .map(m => m.solutionAttr.name);

        const classMissingAttrs = missingAttributes
            .filter(m => m.className === solClass.name)
            .map(m => m.attribute.name);

        const classExtraAttrs = extraAttributes
            .filter(e => e.className === stuClass.name)
            .map(e => e.attribute.name);

        return {
            solutionClass: {
                name: solClass.name,
                canonical: solClass.normalized.canonical,
                attributes: solClass.attributesNormalized.map(a => ({
                    name: a.name,
                    canonical: a.normalized.canonical
                }))
            },
            studentClass: {
                name: stuClass.name,
                canonical: stuClass.normalized.canonical,
                attributes: stuClass.attributesNormalized.map(a => ({
                    name: a.name,
                    canonical: a.normalized.canonical
                }))
            },
            attributeComparison: {
                matched: classMatchedAttrs,
                missing: classMissingAttrs,
                extra: classExtraAttrs
            }
        };
    });

    // Check if there are potential patterns (missing or extra attributes exist)
    const hasPotentialPatterns = matchedClassesWithAttributes.some(
        cls => cls.attributeComparison.missing.length > 0 ||
            cls.attributeComparison.extra.length > 0
    );

    if (hasPotentialPatterns) {
        try {
            // Get prompt for attribute pattern detection
            const patternPrompt = await promptService.getPrompts({
                type: 'class-analysis-attribute-pattern-detector',
                isActive: true,
                limit: 1
            });

            if (patternPrompt.prompts && patternPrompt.prompts.length > 0) {
                const promptContent = patternPrompt.prompts[0].templateString
                    .replace(/\{\{matchedClassesWithAttributes\}\}/g,
                        JSON.stringify({ matchedClasses: matchedClassesWithAttributes }, null, 2));

                const aiResponse = await callAIApi(promptContent, input.id, 'step4.3-patterns');
                const patternResult = parseJsonResponse<{
                    patterns: Array<{
                        type: 'DECOMPOSITION' | 'CONSOLIDATION';
                        className: string;
                        sourceAttribute?: string;
                        sourceAttributes?: string[];
                        targetAttribute?: string;
                        targetAttributes?: string[];
                        confidence: number;
                        isValid: boolean;
                        reasoning: string;
                    }>;
                    unrelatedExtras: Array<{
                        className: string;
                        attribute: string;
                        reasoning: string;
                    }>;
                }>(aiResponse, input.id, 'step4.3');

                // Convert AI response to AttributePattern format
                attributePatterns = patternResult.patterns.map(p => {
                    if (p.type === 'DECOMPOSITION') {
                        return {
                            type: 'DECOMPOSITION',
                            sourceAttribute: p.sourceAttribute!,
                            sourceClass: p.className,
                            decomposedInto: p.targetAttributes || [],
                            targetClass: p.className,
                            confidence: p.confidence,
                            isValid: p.isValid,
                            reasoning: p.reasoning
                        } as AttributeDecomposition;
                    } else {
                        return {
                            type: 'CONSOLIDATION',
                            sourceAttributes: p.sourceAttributes || [],
                            sourceClass: p.className,
                            consolidatedInto: p.targetAttribute!,
                            targetClass: p.className,
                            confidence: p.confidence,
                            isValid: p.isValid,
                            reasoning: p.reasoning
                        } as AttributeConsolidation;
                    }
                });

                logger.info({
                    message: 'BƯỚC 4.3: Hoàn thành phát hiện Attribute Patterns với AI',
                    event_type: 'step4_3_complete',
                    id: input.id,
                    patternsDetected: attributePatterns.length,
                    decompositions: attributePatterns.filter(p => p.type === 'DECOMPOSITION').length,
                    consolidations: attributePatterns.filter(p => p.type === 'CONSOLIDATION').length,
                    unrelatedExtras: patternResult.unrelatedExtras.length
                });
            } else {
                logger.warn({
                    message: 'BƯỚC 4.3: Không tìm thấy prompt attribute-pattern-detector',
                    event_type: 'step4_3_prompt_not_found',
                    id: input.id
                });
            }
        } catch (error) {
            logger.error({
                message: 'BƯỚC 4.3: Lỗi khi phát hiện patterns, tiếp tục mà không có patterns',
                event_type: 'step4_3_error',
                id: input.id,
                error: getErrorMessage(error)
            });
            // Continue without patterns on error
        }
    } else {
        logger.info({
            message: 'BƯỚC 4.3: Không có potential patterns, bỏ qua AI call',
            event_type: 'step4_3_skip',
            id: input.id
        });
    }

    // ========================================================================
    // 4.4: Compare Operations (simplified)
    // ========================================================================

    let matchedOperations = 0;
    let missingOperations = 0;

    for (const match of matchedClasses) {
        const solOps = match.solution.operations || [];
        const stuOps = match.student.operations || [];

        matchedOperations += Math.min(solOps.length, stuOps.length);
        missingOperations += Math.max(0, solOps.length - stuOps.length);
    }

    // ========================================================================
    // 4.5: Compare Relationships
    // ========================================================================

    const associationsResult = compareAssociations(
        solution.relationships.associations,
        student.relationships.associations,
        solution,
        student
    );

    const aggregationsResult = compareAggregations(
        solution.relationships.aggregations,
        student.relationships.aggregations,
        student.relationships.compositions,
        solution,
        student
    );

    const compositionsResult = compareCompositions(
        solution.relationships.compositions,
        student.relationships.compositions,
        student.relationships.aggregations,
        solution,
        student
    );

    const generalizationsResult = compareGeneralizations(
        solution.relationships.generalizations,
        student.relationships.generalizations,
        solution,
        student
    );

    // ========================================================================
    // Build final comparison result
    // ========================================================================

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
            misplaced: misplacedAttributes,
            patterns: attributePatterns
        },
        operations: {
            matched: matchedOperations,
            missing: missingOperations
        },
        relationships: {
            associations: associationsResult,
            aggregations: aggregationsResult,
            compositions: compositionsResult,
            generalizations: generalizationsResult
        }
    };

    logger.info({
        message: 'BƯỚC 4: Hoàn thành',
        event_type: 'step4_complete',
        id: input.id,
        classes: {
            matched: matchedClasses.length,
            missing: missingClasses.length,
            extra: extraClasses.length
        },
        attributes: {
            matched: matchedAttributes.length,
            missing: missingAttributes.length,
            extra: extraAttributes.length,
            misplaced: misplacedAttributes.length,
            patterns: attributePatterns.length
        },
        relationships: {
            associations: {
                matched: associationsResult.matched,
                missing: associationsResult.missing,
                wrongMultiplicity: associationsResult.wrongMultiplicity.length
            },
            aggregations: {
                matched: aggregationsResult.matched,
                confusedWithComposition: aggregationsResult.confusedWithComposition.length
            },
            compositions: {
                matched: compositionsResult.matched,
                confusedWithAggregation: compositionsResult.confusedWithAggregation.length
            },
            generalizations: {
                matched: generalizationsResult.matched,
                reversed: generalizationsResult.reversed.length
            }
        }
    });

    return result;
};

// ============================================================================
// CLASS GRAPH ANALYZER
// ============================================================================

class ClassGraphAnalyzer {
    private nodes: Map<string, GraphNode> = new Map();
    private edges: GraphEdge[] = [];
    private adjacencyList: Map<string, Set<string>> = new Map();
    private reverseAdjacencyList: Map<string, Set<string>> = new Map();
    private readonly diagram: NormalizedDiagram;

    constructor(diagram: NormalizedDiagram) {
        this.diagram = diagram;
        this.buildGraph();
    }

    private buildGraph(): void {
        // Add class nodes
        for (const cls of this.diagram.classes) {
            this.nodes.set(cls.id, {
                id: cls.id,
                name: cls.name,
                canonical: cls.normalized.canonical.toLowerCase(),
                type: 'class',
                attributeCount: cls.attributes.length,
                operationCount: cls.operations?.length || 0
            });
            this.adjacencyList.set(cls.id, new Set());
            this.reverseAdjacencyList.set(cls.id, new Set());
        }

        // Add association edges (bidirectional)
        for (const assoc of this.diagram.relationships.associations) {
            const fromCanonical = getClassCanonical(assoc.from, this.diagram);
            const toCanonical = getClassCanonical(assoc.to, this.diagram);
            if (fromCanonical && toCanonical) {
                this.addEdge(assoc.from, assoc.to, 'association', fromCanonical, toCanonical);
                // Bidirectional
                this.adjacencyList.get(assoc.to)?.add(assoc.from);
                this.reverseAdjacencyList.get(assoc.from)?.add(assoc.to);
            }
        }

        // Add aggregation edges
        for (const agg of this.diagram.relationships.aggregations) {
            const wholeCanonical = getClassCanonical(agg.whole, this.diagram);
            const partCanonical = getClassCanonical(agg.part, this.diagram);
            if (wholeCanonical && partCanonical) {
                this.addEdge(agg.whole, agg.part, 'aggregation', wholeCanonical, partCanonical);
            }
        }

        // Add composition edges
        for (const comp of this.diagram.relationships.compositions) {
            const compositeCanonical = getClassCanonical(comp.composite, this.diagram);
            const componentCanonical = getClassCanonical(comp.component, this.diagram);
            if (compositeCanonical && componentCanonical) {
                this.addEdge(comp.composite, comp.component, 'composition', compositeCanonical, componentCanonical);
            }
        }

        // Add generalization edges
        for (const gen of this.diagram.relationships.generalizations) {
            const parentCanonical = getClassCanonical(gen.parent, this.diagram);
            const childCanonical = getClassCanonical(gen.child, this.diagram);
            if (parentCanonical && childCanonical) {
                this.addEdge(gen.parent, gen.child, 'generalization', parentCanonical, childCanonical);
            }
        }
    }

    private addEdge(from: string, to: string, type: GraphEdge['type'], fromCanonical: string, toCanonical: string): void {
        this.edges.push({ from, to, type, fromCanonical, toCanonical });
        this.adjacencyList.get(from)?.add(to);
        this.reverseAdjacencyList.get(to)?.add(from);
    }

    public getDegreeCentrality(): Map<string, number> {
        const centrality = new Map<string, number>();

        for (const nodeId of this.nodes.keys()) {
            const outDegree = this.adjacencyList.get(nodeId)?.size || 0;
            const inDegree = this.reverseAdjacencyList.get(nodeId)?.size || 0;
            centrality.set(nodeId, outDegree + inDegree);
        }

        return centrality;
    }

    public getBetweennessCentrality(): Map<string, number> {
        const centrality = new Map<string, number>();
        const nodeIds = Array.from(this.nodes.keys());

        for (const nodeId of nodeIds) {
            centrality.set(nodeId, 0);
        }

        // Simplified betweenness: count how many shortest paths pass through each node
        for (const source of nodeIds) {
            for (const target of nodeIds) {
                if (source === target) continue;

                const paths = this.findAllPaths(source, target, 5);
                if (paths.length === 0) continue;

                for (const path of paths) {
                    // Intermediate nodes (not source or target)
                    for (let i = 1; i < path.length - 1; i++) {
                        const current = centrality.get(path[i]) || 0;
                        centrality.set(path[i], current + 1 / paths.length);
                    }
                }
            }
        }

        return centrality;
    }

    private findAllPaths(from: string, to: string, maxDepth: number): string[][] {
        const paths: string[][] = [];
        const visited = new Set<string>();

        const dfs = (current: string, target: string, path: string[], depth: number) => {
            if (depth > maxDepth) return;
            if (current === target) {
                paths.push([...path, current]);
                return;
            }

            visited.add(current);
            const neighbors = this.adjacencyList.get(current) || new Set();

            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    dfs(neighbor, target, [...path, current], depth + 1);
                }
            }

            visited.delete(current);
        };

        dfs(from, to, [], 0);
        return paths;
    }

    public getCompositionChains(): CompositionChain[] {
        const chains: CompositionChain[] = [];
        const compositionEdges = this.edges.filter(e => e.type === 'composition');
        const visited = new Set<string>();

        // Find root composites (not component of any other)
        const components = new Set(compositionEdges.map(e => e.to));
        const roots = compositionEdges
            .map(e => e.from)
            .filter(from => !components.has(from));

        for (const root of roots) {
            if (visited.has(root)) continue;

            const chain = this.buildCompositionChain(root, [], visited);
            if (chain.length > 1) {
                const chainNames = chain.map(id => this.nodes.get(id)?.name || id);
                chains.push({
                    chain,
                    chainNames,
                    depth: chain.length - 1,
                    isCascadeDelete: true
                });
            }
        }

        return chains;
    }

    private buildCompositionChain(nodeId: string, currentChain: string[], visited: Set<string>): string[] {
        if (visited.has(nodeId)) return currentChain;
        visited.add(nodeId);

        const newChain = [...currentChain, nodeId];

        // Find composition children
        const children = this.edges
            .filter(e => e.type === 'composition' && e.from === nodeId)
            .map(e => e.to);

        if (children.length === 0) {
            return newChain;
        }

        // Follow longest chain
        let longestChain = newChain;
        for (const child of children) {
            const childChain = this.buildCompositionChain(child, newChain, visited);
            if (childChain.length > longestChain.length) {
                longestChain = childChain;
            }
        }

        return longestChain;
    }

    public calculateAttributeCohesion(classId: string): number {
        const node = this.nodes.get(classId);
        if (!node || node.attributeCount === 0) return 1.0;

        // Simple heuristic: ideal class has 3-7 attributes
        const attrCount = node.attributeCount;
        if (attrCount >= 3 && attrCount <= 7) return 1.0;
        if (attrCount < 3) return 0.8; // Too few - might be under-modeled
        if (attrCount <= 10) return 0.7; // Slightly high
        return Math.max(0.3, 7 / attrCount); // Decreasing for bloated classes
    }

    public getMetrics(): GraphMetrics {
        const degreeCentrality = this.getDegreeCentrality();
        const betweennessCentrality = this.getBetweennessCentrality();
        const chains = this.getCompositionChains();

        const degrees = Array.from(degreeCentrality.values());
        const maxChainDepth = chains.length > 0 ? Math.max(...chains.map(c => c.depth)) : 0;

        // Calculate average cohesion
        let totalCohesion = 0;
        for (const nodeId of this.nodes.keys()) {
            totalCohesion += this.calculateAttributeCohesion(nodeId);
        }
        const avgCohesion = this.nodes.size > 0 ? totalCohesion / this.nodes.size : 1.0;

        return {
            classCount: this.nodes.size,
            edgeCount: this.edges.length,
            avgDegree: degrees.length > 0 ? degrees.reduce((a, b) => a + b, 0) / degrees.length : 0,
            maxDepth: maxChainDepth,
            degreeCentrality,
            betweennessCentrality,
            compositionChainDepth: maxChainDepth,
            avgAttributeCohesion: avgCohesion
        };
    }

    public getNode(id: string): GraphNode | undefined {
        return this.nodes.get(id);
    }

    public getNodeByCanonical(canonical: string): GraphNode | undefined {
        for (const node of this.nodes.values()) {
            if (node.canonical === canonical.toLowerCase()) {
                return node;
            }
        }
        return undefined;
    }

    public hasEdge(from: string, to: string): boolean {
        return this.edges.some(e => e.from === from && e.to === to);
    }

    public hasEdgeByCanonical(fromCanonical: string, toCanonical: string): boolean {
        return this.edges.some(
            e => e.fromCanonical === fromCanonical.toLowerCase() &&
                e.toCanonical === toCanonical.toLowerCase()
        );
    }

    public getEdgeType(from: string, to: string): GraphEdge['type'] | null {
        const edge = this.edges.find(e => e.from === from && e.to === to);
        return edge?.type || null;
    }

    public getEdgeTypeByCanonical(fromCanonical: string, toCanonical: string): GraphEdge['type'] | null {
        const edge = this.edges.find(
            e => e.fromCanonical === fromCanonical.toLowerCase() &&
                e.toCanonical === toCanonical.toLowerCase()
        );
        return edge?.type || null;
    }

    public isIsolated(nodeId: string): boolean {
        const degree = this.getDegreeCentrality().get(nodeId) || 0;
        return degree === 0;
    }

    public getGeneralizationChildren(parentId: string): string[] {
        return this.edges
            .filter(e => e.type === 'generalization' && e.from === parentId)
            .map(e => e.to);
    }

    public getGeneralizationParent(childId: string): string | null {
        const edge = this.edges.find(e => e.type === 'generalization' && e.to === childId);
        return edge?.from || null;
    }

    public getEdges(): GraphEdge[] {
        return this.edges;
    }

    public getAllNodes(): GraphNode[] {
        return Array.from(this.nodes.values());
    }
}

// ============================================================================
// STEP 5: GRAPH ANALYSIS
// ============================================================================

const step5_graphAnalysis = (
    normalized: { solution: NormalizedDiagram; student: NormalizedDiagram },
    comparison: ComparisonResult
): GraphAnalysisResult => {
    logger.info({
        message: 'BƯỚC 5: Bắt đầu phân tích Graph',
        event_type: 'step5_start'
    });

    const solutionGraph = new ClassGraphAnalyzer(normalized.solution);
    const studentGraph = new ClassGraphAnalyzer(normalized.student);

    const patterns: GraphPattern[] = [];
    const equivalences: GraphEquivalence[] = [];
    const recommendations: GraphRecommendation[] = [];
    const violations: LifecycleViolation[] = [];

    const solutionMetrics = solutionGraph.getMetrics();
    const studentMetrics = studentGraph.getMetrics();

    // ========================================================================
    // PATTERN 1: CLASS_DECOMPOSITION (1 → N)
    // Student splits one class into multiple related classes
    // ========================================================================

    for (const extraClass of comparison.classes.extra) {
        // Check if this extra class is connected via composition to a matched class
        const compositionParents = normalized.student.relationships.compositions
            .filter(c => c.component === extraClass.id);

        if (compositionParents.length > 0) {
            // Check if attributes from solution migrated to this class
            const migrations: Array<{ attr: string; from: string; to: string }> = [];

            for (const missing of comparison.attributes.missing) {
                const foundAttr = extraClass.attributesNormalized.find(
                    a => a.normalized.canonical.toLowerCase() ===
                        missing.attribute.normalized.canonical.toLowerCase()
                );

                if (foundAttr) {
                    migrations.push({
                        attr: foundAttr.name,
                        from: missing.className,
                        to: extraClass.name
                    });
                }
            }

            if (migrations.length > 0) {
                const cohesion = studentGraph.calculateAttributeCohesion(extraClass.id);
                const isGoodDecomposition = cohesion >= 0.7 && migrations.length >= 2;

                patterns.push({
                    type: 'CLASS_DECOMPOSITION',
                    severity: isGoodDecomposition ? 'POSITIVE' : 'NEUTRAL',
                    confidence: 0.9,
                    elements: {
                        sourceClass: migrations[0].from,
                        decomposedInto: [extraClass.name],
                        attributeMigration: migrations,
                        metrics: {
                            cohesion: cohesion.toFixed(2),
                            migratedAttributes: migrations.length
                        }
                    },
                    structuralEquivalence: true,
                    designQuality: {
                        rating: isGoodDecomposition ? 'EXCELLENT' : 'GOOD',
                        reasoning: `Áp dụng SRP, tách ${migrations.length} attributes vào class mới`,
                        cohesionImprovement: `cohesion = ${cohesion.toFixed(2)}`
                    }
                });

                recommendations.push({
                    code: 'IGNORE_EXTRA_CLASSES',
                    reason: `Class "${extraClass.name}" là decomposition hợp lý với ${migrations.length} attributes migrated`,
                    affectedElements: [extraClass.name],
                    penaltyAdjustment: isGoodDecomposition ? 2 : 0 // Bonus for good design
                });

                // Also ignore the "missing" attributes that were migrated
                for (const migration of migrations) {
                    recommendations.push({
                        code: 'IGNORE_ATTRIBUTE_DIFF',
                        reason: `Attribute "${migration.attr}" được migrate từ "${migration.from}" sang "${migration.to}" - valid decomposition`,
                        affectedElements: [migration.attr],
                        penaltyAdjustment: 0
                    });
                }

                equivalences.push({
                    type: 'structural_decomposition',
                    confidence: 0.9,
                    explanation: `${extraClass.name} là decomposition của ${migrations[0].from} với ${migrations.length} attributes migrated`,
                    affectedClasses: [extraClass.name, migrations[0].from]
                });
            }
        }
    }

    // ========================================================================
    // PATTERN 2: CLASS_CONSOLIDATION (N → 1)
    // Student merges multiple classes into one
    // ========================================================================

    if (comparison.classes.missing.length >= 2 && comparison.classes.extra.length >= 1) {
        for (const extraClass of comparison.classes.extra) {
            // Check if this class has attributes from multiple missing classes
            const attributeSources = new Map<string, string[]>();

            for (const extraAttr of extraClass.attributesNormalized) {
                for (const missingClass of comparison.classes.missing) {
                    const foundInMissing = missingClass.attributesNormalized.find(
                        a => a.normalized.canonical.toLowerCase() ===
                            extraAttr.normalized.canonical.toLowerCase()
                    );

                    if (foundInMissing) {
                        if (!attributeSources.has(missingClass.name)) {
                            attributeSources.set(missingClass.name, []);
                        }
                        attributeSources.get(missingClass.name)!.push(extraAttr.name);
                    }
                }
            }

            // If attributes come from 2+ missing classes → consolidation
            if (attributeSources.size >= 2) {
                const consolidatedFrom = Array.from(attributeSources.keys());
                const totalAttrs = Array.from(attributeSources.values()).flat();

                patterns.push({
                    type: 'CLASS_CONSOLIDATION',
                    severity: 'MINOR', // Generally not ideal for analysis phase
                    confidence: 0.85,
                    elements: {
                        targetClasses: [extraClass.name],
                        consolidatedFrom,
                        attributeMigration: totalAttrs.map(attr => ({
                            attr,
                            from: 'multiple',
                            to: extraClass.name
                        }))
                    },
                    structuralEquivalence: false,
                    designQuality: {
                        rating: 'ACCEPTABLE',
                        reasoning: `Consolidated ${consolidatedFrom.length} classes into 1 - may violate SRP`
                    }
                });

                equivalences.push({
                    type: 'structural_consolidation',
                    confidence: 0.85,
                    explanation: `${extraClass.name} consolidates ${consolidatedFrom.join(', ')}`,
                    affectedClasses: [extraClass.name, ...consolidatedFrom]
                });

                // Reduce penalty for missing classes if consolidation detected
                recommendations.push({
                    code: 'REDUCE_PENALTY',
                    reason: `Classes ${consolidatedFrom.join(', ')} were consolidated into ${extraClass.name}`,
                    affectedElements: consolidatedFrom,
                    penaltyAdjustment: Math.min(consolidatedFrom.length * 2, 6) // Cap at 6
                });
            }
        }
    }

    // ========================================================================
    // PATTERN 3: MISSING_CENTRAL_CLASS
    // Missing class that has high centrality in solution
    // ========================================================================

    for (const missingClass of comparison.classes.missing) {
        const betweenness = solutionMetrics.betweennessCentrality.get(missingClass.id) || 0;
        const degree = solutionMetrics.degreeCentrality.get(missingClass.id) || 0;

        // High centrality = important class
        if (betweenness > 0.3 || degree >= 3) {
            patterns.push({
                type: 'MISSING_CENTRAL_CLASS',
                severity: 'CRITICAL',
                confidence: 0.95,
                elements: {
                    missingClass: missingClass.name,
                    metrics: {
                        degree,
                        betweenness: betweenness.toFixed(2)
                    }
                },
                structuralEquivalence: false,
                designQuality: {
                    rating: 'POOR',
                    reasoning: `Thiếu class trung tâm với degree=${degree}, betweenness=${betweenness.toFixed(2)}`
                }
            });

            recommendations.push({
                code: 'INCREASE_PENALTY',
                reason: `Missing central class "${missingClass.name}" - core entity in domain`,
                affectedElements: [missingClass.name],
                penaltyAdjustment: -5 // Additional penalty
            });
        }
    }

    // ========================================================================
    // PATTERN 4: MISSING_ABSTRACT_PARENT
    // Missing parent class but all children are present
    // ========================================================================

    for (const missingClass of comparison.classes.missing) {
        const childrenIds = solutionGraph.getGeneralizationChildren(missingClass.id);

        if (childrenIds.length >= 2) {
            // Check if all children exist in student
            let allChildrenPresent = true;
            const presentChildren: string[] = [];

            for (const childId of childrenIds) {
                const childClass = normalized.solution.classes.find(c => c.id === childId);
                if (childClass) {
                    const childCanonical = childClass.normalized.canonical.toLowerCase();
                    const inStudent = normalized.student.classes.some(
                        sc => sc.normalized.canonical.toLowerCase() === childCanonical
                    );

                    if (inStudent) {
                        presentChildren.push(childClass.name);
                    } else {
                        allChildrenPresent = false;
                    }
                }
            }

            if (allChildrenPresent && presentChildren.length === childrenIds.length) {
                patterns.push({
                    type: 'MISSING_ABSTRACT_PARENT',
                    severity: 'MINOR',
                    confidence: 0.9,
                    elements: {
                        missingClass: missingClass.name,
                        targetClasses: presentChildren
                    },
                    structuralEquivalence: true,
                    designQuality: {
                        rating: 'ACCEPTABLE',
                        reasoning: `Thiếu abstract parent "${missingClass.name}" nhưng tất cả ${presentChildren.length} children đều có`
                    }
                });

                recommendations.push({
                    code: 'REDUCE_PENALTY',
                    reason: `Abstract parent "${missingClass.name}" missing but all children present - logic preserved`,
                    affectedElements: [missingClass.name],
                    penaltyAdjustment: 4 // Reduce penalty significantly
                });

                equivalences.push({
                    type: 'hierarchy_preserved',
                    confidence: 0.9,
                    explanation: `Hierarchy logic preserved: ${presentChildren.join(', ')} without parent ${missingClass.name}`,
                    affectedClasses: [missingClass.name, ...presentChildren]
                });
            }
        }
    }

    // ========================================================================
    // PATTERN 5: COMPOSITION_LIFECYCLE_VIOLATION
    // Student uses aggregation where composition is expected (or vice versa)
    // ========================================================================

    for (const solComp of normalized.solution.relationships.compositions) {
        const compositeCanonical = getClassCanonical(solComp.composite, normalized.solution);
        const componentCanonical = getClassCanonical(solComp.component, normalized.solution);

        if (!compositeCanonical || !componentCanonical) continue;

        // Find corresponding classes in student
        const stuComposite = findClassByCanonical(compositeCanonical, normalized.student);
        const stuComponent = findClassByCanonical(componentCanonical, normalized.student);

        if (!stuComposite || !stuComponent) continue;

        // Check relationship type in student
        const stuEdgeType = studentGraph.getEdgeTypeByCanonical(compositeCanonical, componentCanonical);

        if (stuEdgeType === 'aggregation') {
            const violation: LifecycleViolation = {
                type: 'COMPOSITION_TO_AGGREGATION',
                from: stuComposite.name,
                to: stuComponent.name,
                fromCanonical: compositeCanonical,
                toCanonical: componentCanonical,
                expected: 'composition',
                actual: 'aggregation',
                businessImpact: `"${stuComponent.name}" không nên tồn tại độc lập khi "${stuComposite.name}" bị xóa`
            };

            violations.push(violation);

            patterns.push({
                type: 'COMPOSITION_LIFECYCLE_VIOLATION',
                severity: 'MAJOR',
                confidence: 1.0,
                elements: {
                    sourceClass: stuComposite.name,
                    targetClasses: [stuComponent.name],
                    violationDetails: violation
                },
                structuralEquivalence: false,
                designQuality: {
                    rating: 'POOR',
                    reasoning: 'Vi phạm lifecycle dependency - cascade delete logic sai'
                }
            });

            recommendations.push({
                code: 'INCREASE_PENALTY',
                reason: `Composition downgraded to Aggregation: ${stuComposite.name} → ${stuComponent.name}`,
                affectedElements: [stuComposite.name, stuComponent.name],
                penaltyAdjustment: -5
            });
        }
    }

    // Check reverse: aggregation should not be composition
    for (const solAgg of normalized.solution.relationships.aggregations) {
        const wholeCanonical = getClassCanonical(solAgg.whole, normalized.solution);
        const partCanonical = getClassCanonical(solAgg.part, normalized.solution);

        if (!wholeCanonical || !partCanonical) continue;

        const stuWhole = findClassByCanonical(wholeCanonical, normalized.student);
        const stuPart = findClassByCanonical(partCanonical, normalized.student);

        if (!stuWhole || !stuPart) continue;

        const stuEdgeType = studentGraph.getEdgeTypeByCanonical(wholeCanonical, partCanonical);

        if (stuEdgeType === 'composition') {
            const violation: LifecycleViolation = {
                type: 'AGGREGATION_TO_COMPOSITION',
                from: stuWhole.name,
                to: stuPart.name,
                fromCanonical: wholeCanonical,
                toCanonical: partCanonical,
                expected: 'aggregation',
                actual: 'composition',
                businessImpact: `"${stuPart.name}" có thể tồn tại độc lập, không nên bị xóa cùng "${stuWhole.name}"`
            };

            violations.push(violation);

            patterns.push({
                type: 'COMPOSITION_LIFECYCLE_VIOLATION',
                severity: 'MINOR', // Less severe than the reverse
                confidence: 1.0,
                elements: {
                    sourceClass: stuWhole.name,
                    targetClasses: [stuPart.name],
                    violationDetails: violation
                },
                structuralEquivalence: false,
                designQuality: {
                    rating: 'ACCEPTABLE',
                    reasoning: 'Aggregation upgraded to Composition - over-constraining lifecycle'
                }
            });
        }
    }

    // ========================================================================
    // PATTERN 6: ATTRIBUTE_MIGRATION_WITH_RELATIONSHIP
    // Misplaced attribute but classes have relationship
    // ========================================================================

    for (const misplaced of comparison.attributes.misplaced) {
        const shouldBeInClass = findClassByCanonical(misplaced.shouldBeInCanonical, normalized.student);
        const inClass = findClassByCanonical(misplaced.inClassCanonical, normalized.student);

        if (shouldBeInClass && inClass) {
            const hasRelationship =
                studentGraph.hasEdgeByCanonical(misplaced.shouldBeInCanonical, misplaced.inClassCanonical) ||
                studentGraph.hasEdgeByCanonical(misplaced.inClassCanonical, misplaced.shouldBeInCanonical);

            if (hasRelationship) {
                patterns.push({
                    type: 'ATTRIBUTE_MIGRATION_WITH_RELATIONSHIP',
                    severity: 'MINOR',
                    confidence: 0.85,
                    elements: {
                        attributeMigration: [{
                            attr: misplaced.attrName,
                            from: misplaced.shouldBeIn,
                            to: misplaced.inClass
                        }]
                    },
                    structuralEquivalence: false,
                    designQuality: {
                        rating: 'ACCEPTABLE',
                        reasoning: `Attribute "${misplaced.attrName}" misplaced but classes have relationship`
                    }
                });

                recommendations.push({
                    code: 'REDUCE_PENALTY',
                    reason: `Misplaced attribute "${misplaced.attrName}" - classes are related, not random error`,
                    affectedElements: [misplaced.attrName],
                    penaltyAdjustment: 2
                });
            }
        }
    }

    // ========================================================================
    // PATTERN 7: ISOLATED_CLASS
    // Extra class with no relationships
    // ========================================================================

    for (const extraClass of comparison.classes.extra) {
        if (studentGraph.isIsolated(extraClass.id)) {
            patterns.push({
                type: 'ISOLATED_CLASS',
                severity: 'MAJOR',
                confidence: 1.0,
                elements: {
                    sourceClass: extraClass.name
                },
                structuralEquivalence: false,
                designQuality: {
                    rating: 'POOR',
                    reasoning: `Class "${extraClass.name}" has no relationships - isolated/orphan class`
                }
            });

            recommendations.push({
                code: 'INCREASE_PENALTY',
                reason: `Isolated class "${extraClass.name}" - not connected to any other class`,
                affectedElements: [extraClass.name],
                penaltyAdjustment: -3
            });
        }
    }

    // ========================================================================
    // PATTERN 8: OVER_NORMALIZATION / UNDER_NORMALIZATION
    // ========================================================================

    const complexityRatio = studentMetrics.classCount / Math.max(solutionMetrics.classCount, 1);

    if (complexityRatio > 2.0 && studentMetrics.avgDegree < 1.5) {
        patterns.push({
            type: 'OVER_NORMALIZATION',
            severity: 'MINOR',
            confidence: 0.8,
            elements: {
                metrics: {
                    complexityRatio: complexityRatio.toFixed(2),
                    studentClasses: studentMetrics.classCount,
                    solutionClasses: solutionMetrics.classCount,
                    avgDegree: studentMetrics.avgDegree.toFixed(2)
                }
            },
            structuralEquivalence: false,
            designQuality: {
                rating: 'POOR',
                reasoning: `Over-engineering: ${complexityRatio.toFixed(1)}x classes với low connectivity`
            }
        });
    }

    if (complexityRatio < 0.5 && solutionMetrics.classCount >= 4) {
        patterns.push({
            type: 'UNDER_NORMALIZATION',
            severity: 'MAJOR',
            confidence: 0.8,
            elements: {
                metrics: {
                    complexityRatio: complexityRatio.toFixed(2),
                    studentClasses: studentMetrics.classCount,
                    solutionClasses: solutionMetrics.classCount
                }
            },
            structuralEquivalence: false,
            designQuality: {
                rating: 'POOR',
                reasoning: `Under-modeling: only ${studentMetrics.classCount} classes vs ${solutionMetrics.classCount} expected`
            }
        });
    }

    // ========================================================================
    // PATTERN 9: Handle Attribute Patterns from Step 4
    // ========================================================================

    for (const attrPattern of comparison.attributes.patterns) {
        if (attrPattern.type === 'DECOMPOSITION' && attrPattern.isValid) {
            recommendations.push({
                code: 'IGNORE_ATTRIBUTE_DIFF',
                reason: `Attribute decomposition: "${attrPattern.sourceAttribute}" → ${attrPattern.decomposedInto.join(', ')}`,
                affectedElements: [attrPattern.sourceAttribute, ...attrPattern.decomposedInto],
                penaltyAdjustment: 2 // Bonus for good design
            });

            equivalences.push({
                type: 'structural_decomposition',
                confidence: attrPattern.confidence,
                explanation: `Attribute "${attrPattern.sourceAttribute}" decomposed into ${attrPattern.decomposedInto.length} granular attributes`,
                affectedClasses: [attrPattern.sourceClass, attrPattern.targetClass]
            });
        }

        if (attrPattern.type === 'CONSOLIDATION' && !attrPattern.isValid) {
            recommendations.push({
                code: 'INCREASE_PENALTY',
                reason: `Attribute consolidation loses detail: ${attrPattern.sourceAttributes.join(', ')} → "${attrPattern.consolidatedInto}"`,
                affectedElements: [attrPattern.consolidatedInto],
                penaltyAdjustment: -2
            });
        }
    }

    // ========================================================================
    // Build result
    // ========================================================================

    const result: GraphAnalysisResult = {
        patterns,
        structuralMetrics: {
            solution: solutionMetrics,
            student: studentMetrics
        },
        lifecycleAnalysis: {
            compositionChains: studentGraph.getCompositionChains(),
            violations
        },
        detectedEquivalences: equivalences,
        recommendations
    };

    logger.info({
        message: 'BƯỚC 5: Hoàn thành',
        event_type: 'step5_complete',
        patternsDetected: patterns.length,
        equivalencesDetected: equivalences.length,
        recommendationsCount: recommendations.length,
        violationsCount: violations.length,
        metrics: {
            solutionClasses: solutionMetrics.classCount,
            studentClasses: studentMetrics.classCount,
            solutionEdges: solutionMetrics.edgeCount,
            studentEdges: studentMetrics.edgeCount
        }
    });

    return result;
};

// ============================================================================
// STEP 6: ERROR CLASSIFICATION & SCORING
// ============================================================================

const step6_classifyErrorsAndScore = async (
    input: UmlInput,
    comparison: ComparisonResult,
    normalized: { solution: NormalizedDiagram; student: NormalizedDiagram },
    domainContext: DomainContext,
    graphAnalysis: GraphAnalysisResult
): Promise<{ errors: DetectedError[]; score: ReferenceScore }> => {
    logger.info({
        message: 'BƯỚC 6: Bắt đầu phân loại lỗi và chấm điểm',
        event_type: 'step6_start',
        id: input.id
    });

    const prompt = await promptService.getPrompts({
        type: 'class-analysis-error-classifier-scorer',
        isActive: true,
        limit: 1
    });

    if (!prompt.prompts || prompt.prompts.length === 0) {
        throw new Error('Không tìm thấy prompt class-analysis-error-classifier-scorer');
    }

    // Prepare classification input
    const classificationInput = {
        domainContext: {
            keywords: domainContext.keywords,
            mandatoryEntities: domainContext.mandatoryEntities,
            domainRules: domainContext.domainRules
        },
        comparison: {
            classes: {
                matched: comparison.classes.matched.length,
                matchedNames: comparison.classes.matched.map(m => ({
                    solution: m.solution.name,
                    student: m.student.name,
                    similarity: m.similarity
                })),
                missing: comparison.classes.missing.map(c => c.name),
                extra: comparison.classes.extra.map(c => c.name)
            },
            attributes: {
                matched: comparison.attributes.matched.length,
                missing: comparison.attributes.missing.map(m => ({
                    className: m.className,
                    attrName: m.attribute.name
                })),
                extra: comparison.attributes.extra.map(e => ({
                    className: e.className,
                    attrName: e.attribute.name
                })),
                misplaced: comparison.attributes.misplaced,
                patterns: comparison.attributes.patterns
            },
            operations: comparison.operations,
            relationships: {
                associations: {
                    matched: comparison.relationships.associations.matched,
                    missing: comparison.relationships.associations.missing,
                    extra: comparison.relationships.associations.extra,
                    wrongMultiplicity: comparison.relationships.associations.wrongMultiplicity.length
                },
                aggregations: {
                    matched: comparison.relationships.aggregations.matched,
                    missing: comparison.relationships.aggregations.missing,
                    confusedWithComposition: comparison.relationships.aggregations.confusedWithComposition.length
                },
                compositions: {
                    matched: comparison.relationships.compositions.matched,
                    missing: comparison.relationships.compositions.missing,
                    confusedWithAggregation: comparison.relationships.compositions.confusedWithAggregation.length
                },
                generalizations: {
                    matched: comparison.relationships.generalizations.matched,
                    missing: comparison.relationships.generalizations.missing,
                    extra: comparison.relationships.generalizations.extra,
                    reversed: comparison.relationships.generalizations.reversed.length
                }
            }
        },
        graphAnalysis: {
            patterns: graphAnalysis.patterns.map(p => ({
                type: p.type,
                severity: p.severity,
                confidence: p.confidence,
                elements: p.elements,
                designQuality: p.designQuality
            })),
            recommendations: graphAnalysis.recommendations,
            equivalences: graphAnalysis.detectedEquivalences,
            lifecycleViolations: graphAnalysis.lifecycleAnalysis.violations.map(v => ({
                type: v.type,
                from: v.from,
                to: v.to,
                expected: v.expected,
                actual: v.actual,
                businessImpact: v.businessImpact
            }))
        },
        scoringCriteria: {
            entities: { max: 25, description: "Business entity identification" },
            attributes: { max: 20, description: "Key attributes correctness" },
            relationships: { max: 40, description: "Relationships accuracy (type + multiplicity)" },
            businessLogic: { max: 15, description: "Business logic and domain coverage" }
        }
    };

    const promptContent = prompt.prompts[0].templateString
        .replace(/\{\{classificationInput\}\}/g, JSON.stringify(classificationInput, null, 2));

    const aiResponse = await callAIApi(promptContent, input.id, 'step6-classify-score');
    const result = parseJsonResponse<{
        errors: DetectedError[];
        score: {
            total: number;
            breakdown: ScoreBreakdown;
            reasoning: string;
            graphAdjustments?: GraphAdjustment[];
        };
    }>(aiResponse, input.id, 'step6');

    // Calculate confidence based on similarity scores
    const lowSimilarityMatches = comparison.classes.matched.filter(m => m.similarity < 0.85);
    const lowSimilarityAttrs = comparison.attributes.matched.filter(m => m.similarity < 0.85);
    const totalLowSimilarity = lowSimilarityMatches.length + lowSimilarityAttrs.length;

    const confidence: 'HIGH' | 'MEDIUM' | 'LOW' =
        totalLowSimilarity === 0 ? 'HIGH' :
            totalLowSimilarity <= 3 ? 'MEDIUM' : 'LOW';

    const range = confidence === 'HIGH' ? 2 : confidence === 'MEDIUM' ? 4 : 6;
    const suggestedRange = `${Math.max(0, Math.floor(result.score.total - range))}-${Math.min(100, Math.ceil(result.score.total + range))}`;

    const finalScore: ReferenceScore = {
        total: Math.round(result.score.total * 10) / 10,
        breakdown: result.score.breakdown,
        confidence,
        suggestedRange,
        graphAdjustments: result.score.graphAdjustments
    };

    logger.info({
        message: 'BƯỚC 6: Hoàn thành',
        event_type: 'step6_complete',
        id: input.id,
        errorsDetected: result.errors.length,
        score: finalScore.total,
        confidence,
        graphAdjustmentsCount: result.score.graphAdjustments?.length || 0
    });

    return { errors: result.errors, score: finalScore };
};

// ============================================================================
// STEP 7: GENERATE FEEDBACK
// ============================================================================

const step7_generateFeedback = async (
    input: UmlInput,
    referenceScore: ReferenceScore,
    errors: DetectedError[],
    comparison: ComparisonResult,
    graphAnalysis: GraphAnalysisResult
): Promise<string> => {
    logger.info({
        message: 'BƯỚC 7: Bắt đầu tạo feedback',
        event_type: 'step7_start',
        id: input.id
    });

    const prompt = await promptService.getPrompts({
        type: 'class-analysis-feedback-generator',
        isActive: true,
        limit: 1
    });

    if (!prompt.prompts || prompt.prompts.length === 0) {
        throw new Error('Không tìm thấy prompt class-analysis-feedback-generator');
    }

    const feedbackInput = {
        score: referenceScore,
        errors: errors.map(e => ({
            code: e.code,
            category: e.category,
            severity: e.severity,
            penalty: e.penalty,
            explanation: e.explanation,
            elements: e.elements,
            suggestion: e.suggestion
        })),
        comparison: {
            classes: {
                matched: comparison.classes.matched.length,
                missing: comparison.classes.missing.map(c => c.name),
                extra: comparison.classes.extra.map(c => c.name)
            },
            attributes: {
                matched: comparison.attributes.matched.length,
                missing: comparison.attributes.missing.length,
                misplaced: comparison.attributes.misplaced.length,
                patterns: comparison.attributes.patterns.length
            },
            relationships: {
                associations: comparison.relationships.associations,
                compositions: comparison.relationships.compositions,
                aggregations: comparison.relationships.aggregations,
                generalizations: comparison.relationships.generalizations
            }
        },
        graphAnalysis: {
            positivePatterns: graphAnalysis.patterns.filter(p => p.severity === 'POSITIVE'),
            negativePatterns: graphAnalysis.patterns.filter(p =>
                p.severity === 'MAJOR' || p.severity === 'CRITICAL'
            ),
            equivalences: graphAnalysis.detectedEquivalences,
            lifecycleViolations: graphAnalysis.lifecycleAnalysis.violations.length
        },
        assignmentContext: input.contentAssignment.substring(0, 500)
    };

    const promptContent = prompt.prompts[0].templateString
        .replace(/\{\{feedbackInput\}\}/g, JSON.stringify(feedbackInput, null, 2));

    const feedback = await callAIApi(promptContent, input.id, 'step7-feedback');

    logger.info({
        message: 'BƯỚC 7: Hoàn thành',
        event_type: 'step7_complete',
        id: input.id,
        feedbackLength: feedback.length
    });

    return feedback;
};

// ============================================================================
// HELPER: Serialize GraphMetrics for output
// ============================================================================

const serializeGraphMetrics = (metrics: GraphMetrics): Record<string, unknown> => {
    return {
        classCount: metrics.classCount,
        edgeCount: metrics.edgeCount,
        avgDegree: Math.round(metrics.avgDegree * 100) / 100,
        maxDepth: metrics.maxDepth,
        compositionChainDepth: metrics.compositionChainDepth,
        avgAttributeCohesion: Math.round(metrics.avgAttributeCohesion * 100) / 100,
        degreeCentrality: Object.fromEntries(metrics.degreeCentrality),
        betweennessCentrality: Object.fromEntries(
            Array.from(metrics.betweennessCentrality.entries())
                .map(([k, v]) => [k, Math.round(v * 100) / 100])
        )
    };
};

// ============================================================================
// MAIN ORCHESTRATOR
// ============================================================================

export const processClassDiagramAnalysisPhaseWithAI = async (
    input: UmlInput
): Promise<UmlProcessedResult> => {
    const startTime = Date.now();

    try {
        logger.info({
            message: 'Bắt đầu pipeline 7 bước Class Diagram Analysis Phase',
            event_type: 'pipeline_start',
            id: input.id,
            typeUmlName: input.typeUmlName
        });

        // STEP 1: Validation & Domain Analysis
        const domainContext = await step1_validateAndPreprocess(input);

        // STEP 2: Extract PlantUML to JSON
        const diagrams = await step2_extractToJson(input, domainContext);

        // STEP 3: Semantic Normalization
        const normalized = await step3_semanticNormalization(input, diagrams, domainContext);

        // STEP 4: Structure Comparison (NOW WITH AI FOR ATTRIBUTE PATTERNS)
        const comparison = await step4_structureComparison(input, normalized);

        // STEP 5: Graph Analysis (Rule-based)
        const graphAnalysis = step5_graphAnalysis(normalized, comparison);

        // STEP 6: Error Classification & Scoring (AI)
        const { errors, score } = await step6_classifyErrorsAndScore(
            input, comparison, normalized, domainContext, graphAnalysis
        );

        // STEP 7: Generate Feedback (AI)
        const feedback = await step7_generateFeedback(
            input, score, errors, comparison, graphAnalysis
        );

        const duration = Date.now() - startTime;

        // Collect items for human review
        const humanReviewItems: string[] = [];

        // Low similarity class matches
        comparison.classes.matched
            .filter(m => m.similarity < 0.85)
            .forEach(m => humanReviewItems.push(
                `Class similarity thấp: "${m.student.name}" vs "${m.solution.name}" (${(m.similarity * 100).toFixed(0)}%)`
            ));

        // Low similarity attribute matches
        comparison.attributes.matched
            .filter(m => m.similarity < 0.85)
            .forEach(m => humanReviewItems.push(
                `Attribute similarity thấp: "${m.studentAttr.name}" vs "${m.solutionAttr.name}" in ${m.className}`
            ));

        // Graph analysis requiring review
        graphAnalysis.recommendations
            .filter(r => r.requiresHumanReview)
            .forEach(r => humanReviewItems.push(
                `Graph Analysis: ${r.reason} - ${r.affectedElements.join(', ')}`
            ));

        // Build result
        const result: UmlProcessedResult = {
            referenceScore: {
                total: score.total,
                breakdown: score.breakdown,
                confidence: score.confidence,
                suggestedRange: score.suggestedRange
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
                    misplaced: comparison.attributes.misplaced.length,
                    patterns: comparison.attributes.patterns.length
                },
                relationships: {
                    associations: {
                        matched: comparison.relationships.associations.matched,
                        missing: comparison.relationships.associations.missing,
                        extra: comparison.relationships.associations.extra,
                        wrongMultiplicity: comparison.relationships.associations.wrongMultiplicity.length
                    },
                    compositions: {
                        matched: comparison.relationships.compositions.matched,
                        missing: comparison.relationships.compositions.missing,
                        confusedWithAggregation: comparison.relationships.compositions.confusedWithAggregation.length
                    },
                    aggregations: {
                        matched: comparison.relationships.aggregations.matched,
                        missing: comparison.relationships.aggregations.missing,
                        confusedWithComposition: comparison.relationships.aggregations.confusedWithComposition.length
                    },
                    generalization: {
                        matched: comparison.relationships.generalizations.matched,
                        missing: comparison.relationships.generalizations.missing,
                        extra: comparison.relationships.generalizations.extra,
                        reversed: comparison.relationships.generalizations.reversed.length
                    }
                }
            },
            graphAnalysis: {
                patterns: graphAnalysis.patterns,
                structuralMetrics: {
                    solution: serializeGraphMetrics(graphAnalysis.structuralMetrics.solution),
                    student: serializeGraphMetrics(graphAnalysis.structuralMetrics.student)
                },
                lifecycleAnalysis: {
                    compositionChains: graphAnalysis.lifecycleAnalysis.compositionChains,
                    violationsCount: graphAnalysis.lifecycleAnalysis.violations.length
                },
                detectedEquivalences: graphAnalysis.detectedEquivalences,
                recommendationsCount: graphAnalysis.recommendations.length
            },
            feedback: feedback,
            humanReviewItems: humanReviewItems,
            metadata: {
                processingTime: `${(duration / 1000).toFixed(1)}s`,
                aiCallsCount: 6,
                pipelineVersion: '2.2.0-class-analysis-with-pattern-ai',
                timestamp: new Date().toISOString()
            }
        };

        logger.info({
            message: '✅ Pipeline Class Diagram Analysis Phase hoàn thành thành công',
            event_type: 'pipeline_complete',
            id: input.id,
            durationMs: duration,
            durationSeconds: (duration / 1000).toFixed(2),
            score: score.total,
            confidence: score.confidence,
            errorsCount: errors.length,
            patternsDetected: graphAnalysis.patterns.length,
            equivalencesDetected: graphAnalysis.detectedEquivalences.length,
            humanReviewItemsCount: humanReviewItems.length
        });

        return result;

    } catch (error: unknown) {
        const duration = Date.now() - startTime;

        logger.error({
            message: '❌ Pipeline Class Diagram Analysis Phase thất bại',
            event_type: 'pipeline_error',
            id: input.id,
            typeUmlName: input.typeUmlName,
            error_name: (error as Error).name,
            error_message: getErrorMessage(error),
            durationMs: duration,
            stack: (error as Error).stack
        });

        if (error instanceof AIValidationError) {
            throw error;
        } else if (error instanceof UmlProcessingError) {
            throw error;
        } else {
            throw new UmlProcessingError(`Class Diagram Analysis Phase pipeline failed: ${getErrorMessage(error)}`);
        }
    }
};