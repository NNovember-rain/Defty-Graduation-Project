import logger from '../../config/logger';
import { getErrorMessage } from '../../utils/errorHandler';
import * as promptService from '../prompt.service';
import { UmlInput, UmlProcessedResult } from '../../types/uml.types';
import {callAIApi} from "../../providers/ai-llm.provider";
import {AIValidationError, parseJsonResponse, UmlProcessingError} from "./index";

interface DomainContext {
    keywords: string[];
    mandatoryRequirements: string[];
    scopeBoundaries: string;
}

interface Actor {
    id: string;
    name: string;
    type: 'primary' | 'secondary' | 'system';
    position?: string;
}

interface UseCase {
    id: string;
    name: string;
    description?: string;
}

interface Relationship {
    actorToUC: Array<{ actorId: string; ucId: string }>;
    include: Array<{ baseId: string; includedId: string }>;
    extend: Array<{ baseId: string; extendedId: string; condition?: string; extensionPoint?: string }>;
    generalization: Array<{ parentId: string; childId: string; type: 'actor' | 'usecase' }>;
}

interface Boundary {
    defined: boolean;
    ucInside: string[];
    actorsOutside: string[];
}

interface DiagramJSON {
    actors: Actor[];
    usecases: UseCase[];
    relationships: Relationship;
    boundary: Boundary;
}

interface NormalizedElement {
    original: string;
    canonical: string;
    similarityScore: number;
}

interface NormalizedDiagram {
    actors: Array<Actor & { normalized: NormalizedElement }>;
    usecases: Array<UseCase & { normalized: NormalizedElement }>;
    relationships: Relationship;
    boundary: Boundary;
}

interface ComparisonResult {
    actors: {
        matched: Array<{ solution: Actor; student: Actor; similarity: number }>;
        missing: Actor[];
        extra: Actor[];
    };
    usecases: {
        matched: Array<{ solution: UseCase; student: UseCase; similarity: number }>;
        missing: UseCase[];
        extra: UseCase[];
    };
    relationships: {
        actorToUC: { matched: number; missing: number; extra: number };
        include: { matched: number; missing: number; extra: number };
        extend: { matched: number; missing: number; extra: number };
        generalization: { matched: number; missing: number; extra: number };
    };
}

interface DetectedError {
    code: string;
    severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
    penalty: number;
    explanation: string;
    elements: string[];
    suggestion?: string;
}

interface ScoreBreakdown {
    actors: { score: number; max: number; details: string };
    usecases: { score: number; max: number; details: string };
    relationships: { score: number; max: number; details: string };
    presentation: { score: number; max: number; details: string };
}

interface ReferenceScore {
    total: number;
    breakdown: ScoreBreakdown;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    suggestedRange: string;
}

// ============================================================================
// STEP 1: VALIDATION & PREPROCESSING
// ============================================================================

const step1_validateAndPreprocess = async (input: UmlInput): Promise<DomainContext> => {
    logger.info({
        message: 'STEP 1: Starting validation and preprocessing',
        event_type: 'step1_start',
        id: input.id
    });

    // Validate input structure
    if (!input.typeUmlName || !input.contentAssignment ||
        !input.solutionPlantUmlCode || !input.studentPlantUmlCode) {
        throw new UmlProcessingError('Missing required input fields');
    }

    if (input.typeUmlName.toLowerCase() !== 'use-case') {
        throw new UmlProcessingError('Only use-case diagrams supported currently');
    }

    // Validate PlantUML syntax
    const validatePlantUml = (code: string, label: string) => {
        if (!code.includes('@startuml') || !code.includes('@enduml')) {
            throw new UmlProcessingError(`${label}: Missing PlantUML tags`);
        }
    };

    validatePlantUml(input.solutionPlantUmlCode, 'Solution');
    validatePlantUml(input.studentPlantUmlCode, 'Student');

    // Extract domain context using AI
    const prompt = await promptService.getPrompts({
        type: 'uml-domain-extractor',
        isActive: true,
        limit: 1
    });

    if (!prompt.prompts || prompt.prompts.length === 0) {
        throw new Error('No active domain extractor prompt found');
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
        requirementsCount: domainContext.mandatoryRequirements.length
    });

    return domainContext;
};

// ============================================================================
// STEP 2: EXTRACT TO JSON (OPTIMIZED - Single API Call)
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
        type: 'uml-plantuml-extractor',
        isActive: true,
        limit: 1
    });

    if (!prompt.prompts || prompt.prompts.length === 0) {
        throw new Error('No active PlantUML extractor prompt found');
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
            actors: result.solution.actors.length,
            usecases: result.solution.usecases.length
        },
        student: {
            actors: result.student.actors.length,
            usecases: result.student.usecases.length
        }
    });

    return result;
};

// ============================================================================
// STEP 3: SEMANTIC NORMALIZATION (OPTIMIZED - Single API Call)
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
        type: 'uml-semantic-normalizer',
        isActive: true,
        limit: 1
    });

    if (!prompt.prompts || prompt.prompts.length === 0) {
        throw new Error('No active semantic normalizer prompt found');
    }

    const elementsToNormalize = {
        solution: {
            actors: diagrams.solution.actors.map(a => ({ id: a.id, name: a.name })),
            usecases: diagrams.solution.usecases.map(uc => ({ id: uc.id, name: uc.name }))
        },
        student: {
            actors: diagrams.student.actors.map(a => ({ id: a.id, name: a.name })),
            usecases: diagrams.student.usecases.map(uc => ({ id: uc.id, name: uc.name }))
        }
    };

    // Single API call for both diagrams
    const promptContent = prompt.prompts[0].templateString
        .replace(/\{\{elements\}\}/g, JSON.stringify(elementsToNormalize));

    const aiResponse = await callAIApi(promptContent, input.id, 'step3-normalize');
    const normalized = parseJsonResponse<{
        solution: {
            actors: Array<{ id: string; canonical: string; similarityScore: number }>;
            usecases: Array<{ id: string; canonical: string; similarityScore: number }>;
        };
        student: {
            actors: Array<{ id: string; canonical: string; similarityScore: number }>;
            usecases: Array<{ id: string; canonical: string; similarityScore: number }>;
        };
    }>(aiResponse, input.id, 'step3');

    // Merge normalized data with original - Solution
    const normalizedSolutionActors = diagrams.solution.actors.map(actor => {
        const norm = normalized.solution.actors.find(n => n.id === actor.id);
        return {
            ...actor,
            normalized: {
                original: actor.name,
                canonical: norm?.canonical || actor.name,
                similarityScore: norm?.similarityScore || 1.0
            }
        };
    });

    const normalizedSolutionUsecases = diagrams.solution.usecases.map(uc => {
        const norm = normalized.solution.usecases.find(n => n.id === uc.id);
        return {
            ...uc,
            normalized: {
                original: uc.name,
                canonical: norm?.canonical || uc.name,
                similarityScore: norm?.similarityScore || 1.0
            }
        };
    });

    // Merge normalized data with original - Student
    const normalizedStudentActors = diagrams.student.actors.map(actor => {
        const norm = normalized.student.actors.find(n => n.id === actor.id);
        return {
            ...actor,
            normalized: {
                original: actor.name,
                canonical: norm?.canonical || actor.name,
                similarityScore: norm?.similarityScore || 1.0
            }
        };
    });

    const normalizedStudentUsecases = diagrams.student.usecases.map(uc => {
        const norm = normalized.student.usecases.find(n => n.id === uc.id);
        return {
            ...uc,
            normalized: {
                original: uc.name,
                canonical: norm?.canonical || uc.name,
                similarityScore: norm?.similarityScore || 1.0
            }
        };
    });

    const result = {
        solution: {
            actors: normalizedSolutionActors,
            usecases: normalizedSolutionUsecases,
            relationships: diagrams.solution.relationships,
            boundary: diagrams.solution.boundary
        },
        student: {
            actors: normalizedStudentActors,
            usecases: normalizedStudentUsecases,
            relationships: diagrams.student.relationships,
            boundary: diagrams.student.boundary
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
// STEP 4: STRUCTURE COMPARISON (ENHANCED with Generalization Analysis)
// ============================================================================

interface MissingActorAnalysis {
    actor: Actor;
    isAbstractParent: boolean;
    hasDirectUseCases: boolean;
    childrenIds: string[];
    childrenInStudent: string[];
    severity: 'CRITICAL' | 'MINOR';
}

interface EnhancedComparisonResult extends ComparisonResult {
    missingActorsAnalysis: MissingActorAnalysis[];
}

const step4_structureComparison = (
    normalized: { solution: NormalizedDiagram; student: NormalizedDiagram }
): EnhancedComparisonResult => {
    logger.info({
        message: 'STEP 4: Starting structure comparison with generalization analysis',
        event_type: 'step4_start'
    });

    const { solution, student } = normalized;

    // Compare actors by canonical names
    const matchedActors: ComparisonResult['actors']['matched'] = [];
    const missingActors: Actor[] = [];
    const extraActors: Actor[] = [];

    const studentActorMap = new Map(student.actors.map(a => [a.normalized.canonical.toLowerCase(), a]));

    for (const solActor of solution.actors) {
        const canonical = solActor.normalized.canonical.toLowerCase();
        const stuActor = studentActorMap.get(canonical);

        if (stuActor) {
            matchedActors.push({
                solution: solActor,
                student: stuActor,
                similarity: Math.max(solActor.normalized.similarityScore, stuActor.normalized.similarityScore)
            });
            studentActorMap.delete(canonical);
        } else {
            missingActors.push(solActor);
        }
    }

    extraActors.push(...Array.from(studentActorMap.values()));

    // ENHANCED: Analyze missing actors for abstract parent pattern
    const missingActorsAnalysis: MissingActorAnalysis[] = missingActors.map(actor => {
        // Check if this actor is a parent in generalization
        const generalizationRelations = solution.relationships.generalization
            .filter(gen => gen.type === 'actor' && gen.parentId === actor.id);

        const isAbstractParent = generalizationRelations.length > 0;
        const childrenIds = generalizationRelations.map(gen => gen.childId);

        // Check if actor has direct use case relationships
        const hasDirectUseCases = solution.relationships.actorToUC
            .some(rel => rel.actorId === actor.id);

        // Check which children exist in student diagram
        const childrenInStudent: string[] = [];
        if (isAbstractParent) {
            for (const childId of childrenIds) {
                const childActor = solution.actors.find(a => a.id === childId);
                if (childActor) {
                    const childCanonical = childActor.normalized.canonical.toLowerCase();
                    const existsInStudent = student.actors.some(
                        sa => sa.normalized.canonical.toLowerCase() === childCanonical
                    );
                    if (existsInStudent) {
                        childrenInStudent.push(childId);
                    }
                }
            }
        }

        // Determine severity
        let severity: 'CRITICAL' | 'MINOR' = 'CRITICAL';

        if (isAbstractParent && !hasDirectUseCases) {
            // Pure abstract parent without direct use cases
            if (childrenInStudent.length === childrenIds.length) {
                // All children exist in student - just missing abstraction
                severity = 'MINOR';
            }
        }

        return {
            actor,
            isAbstractParent,
            hasDirectUseCases,
            childrenIds,
            childrenInStudent,
            severity
        };
    });

    // Compare usecases
    const matchedUsecases: ComparisonResult['usecases']['matched'] = [];
    const missingUsecases: UseCase[] = [];
    const extraUsecases: UseCase[] = [];

    const studentUsecaseMap = new Map(student.usecases.map(uc => [uc.normalized.canonical.toLowerCase(), uc]));

    for (const solUc of solution.usecases) {
        const canonical = solUc.normalized.canonical.toLowerCase();
        const stuUc = studentUsecaseMap.get(canonical);

        if (stuUc) {
            matchedUsecases.push({
                solution: solUc,
                student: stuUc,
                similarity: Math.max(solUc.normalized.similarityScore, stuUc.normalized.similarityScore)
            });
            studentUsecaseMap.delete(canonical);
        } else {
            missingUsecases.push(solUc);
        }
    }

    extraUsecases.push(...Array.from(studentUsecaseMap.values()));

    // Compare relationships (simplified - match by canonical IDs)
    const compareRelationships = (
        solRels: any[],
        stuRels: any[],
        getKey: (rel: any) => string
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

    const relationships = {
        actorToUC: compareRelationships(
            solution.relationships.actorToUC,
            student.relationships.actorToUC,
            r => `${r.actorId}-${r.ucId}`
        ),
        include: compareRelationships(
            solution.relationships.include,
            student.relationships.include,
            r => `${r.baseId}-${r.includedId}`
        ),
        extend: compareRelationships(
            solution.relationships.extend,
            student.relationships.extend,
            r => `${r.baseId}-${r.extendedId}`
        ),
        generalization: compareRelationships(
            solution.relationships.generalization,
            student.relationships.generalization,
            r => `${r.parentId}-${r.childId}`
        )
    };

    const result: EnhancedComparisonResult = {
        actors: { matched: matchedActors, missing: missingActors, extra: extraActors },
        usecases: { matched: matchedUsecases, missing: missingUsecases, extra: extraUsecases },
        relationships,
        missingActorsAnalysis
    };

    logger.info({
        message: 'STEP 4: Completed',
        event_type: 'step4_complete',
        actors: {
            matched: matchedActors.length,
            missing: missingActors.length,
            extra: extraActors.length,
            abstractParents: missingActorsAnalysis.filter(a => a.isAbstractParent).length
        },
        usecases: { matched: matchedUsecases.length, missing: missingUsecases.length, extra: extraUsecases.length }
    });

    return result;
};

// ============================================================================
// STEP 5: ERROR CLASSIFICATION (ENHANCED)
// ============================================================================

const step5_errorClassification = async (
    input: UmlInput,
    comparison: EnhancedComparisonResult,
    normalized: { solution: NormalizedDiagram; student: NormalizedDiagram },
    domainContext: DomainContext
): Promise<DetectedError[]> => {
    logger.info({
        message: 'STEP 5: Starting error classification with generalization analysis',
        event_type: 'step5_start',
        id: input.id
    });

    const prompt = await promptService.getPrompts({
        type: 'uml-error-classifier',
        isActive: true,
        limit: 1
    });

    if (!prompt.prompts || prompt.prompts.length === 0) {
        throw new Error('No active error classifier prompt found');
    }

    const classificationInput = {
        domainContext,
        comparison: {
            actors: comparison.actors,
            usecases: comparison.usecases,
            relationships: comparison.relationships,
            missingActorsAnalysis: comparison.missingActorsAnalysis
        },
        studentDiagram: normalized.student,
        solutionDiagram: normalized.solution
    };

    const promptContent = prompt.prompts[0].templateString
        .replace(/\{\{classificationInput\}\}/g, JSON.stringify(classificationInput, null, 2));

    const aiResponse = await callAIApi(promptContent, input.id, 'step5-classify');
    const errors = parseJsonResponse<{ errors: DetectedError[] }>(aiResponse, input.id, 'step5');

    logger.info({
        message: 'STEP 5: Completed',
        event_type: 'step5_complete',
        id: input.id,
        errorsDetected: errors.errors.length,
        criticalCount: errors.errors.filter(e => e.severity === 'CRITICAL').length,
        majorCount: errors.errors.filter(e => e.severity === 'MAJOR').length,
        minorCount: errors.errors.filter(e => e.severity === 'MINOR').length
    });

    return errors.errors;
};

// ============================================================================
// STEP 6: CALCULATE REFERENCE SCORE (UNCHANGED - Let AI decide penalty)
// ============================================================================

const step6_calculateScore = (
    comparison: EnhancedComparisonResult,
    errors: DetectedError[]
): ReferenceScore => {
    logger.info({
        message: 'STEP 6: Starting score calculation',
        event_type: 'step6_start'
    });

    // Actors scoring (20%)
    const totalActors = comparison.actors.matched.length + comparison.actors.missing.length;
    const actorMatchScore = totalActors > 0
        ? (comparison.actors.matched.length / totalActors) * 15
        : 0;
    const actorPenalty = comparison.actors.extra.length > 0 ? 0 : 5;
    const actorsScore = Math.min(20, actorMatchScore + actorPenalty);

    // UseCases scoring (30%)
    const totalUsecases = comparison.usecases.matched.length + comparison.usecases.missing.length;
    const usecaseMatchScore = totalUsecases > 0
        ? (comparison.usecases.matched.length / totalUsecases) * 20
        : 0;
    const usecaseQualityScore = 10; // Simplified - would check for fragments/abstraction
    const usecasesScore = Math.min(30, usecaseMatchScore + usecaseQualityScore);

    // Relationships scoring (40%)
    const relScore = {
        actorToUC: comparison.relationships.actorToUC.matched > 0
            ? (comparison.relationships.actorToUC.matched /
            (comparison.relationships.actorToUC.matched + comparison.relationships.actorToUC.missing)) * 20
            : 0,
        include: comparison.relationships.include.matched > 0
            ? (comparison.relationships.include.matched /
            (comparison.relationships.include.matched + comparison.relationships.include.missing)) * 10
            : 0,
        extend: comparison.relationships.extend.matched > 0
            ? (comparison.relationships.extend.matched /
            (comparison.relationships.extend.matched + comparison.relationships.extend.missing)) * 10
            : 0
    };
    const relationshipsScore = Math.min(40, relScore.actorToUC + relScore.include + relScore.extend);

    // Presentation scoring (10%)
    const presentationScore = 10; // Simplified - would check boundary and layout

    // Calculate total before penalties
    let total = actorsScore + usecasesScore + relationshipsScore + presentationScore;

    // Apply error penalties (AI decides penalty including for abstract parents)
    const totalPenalty = errors.reduce((sum, err) => sum + err.penalty, 0);
    total = Math.max(0, total - totalPenalty);

    // Determine confidence based on ambiguous matches
    const lowSimilarityCount = [
        ...comparison.actors.matched.filter(m => m.similarity < 0.85),
        ...comparison.usecases.matched.filter(m => m.similarity < 0.85)
    ].length;

    const confidence: 'HIGH' | 'MEDIUM' | 'LOW' =
        lowSimilarityCount === 0 ? 'HIGH' :
            lowSimilarityCount <= 3 ? 'MEDIUM' : 'LOW';

    const range = confidence === 'HIGH' ? 2 : confidence === 'MEDIUM' ? 4 : 6;
    const suggestedRange = `${Math.max(0, Math.floor(total - range))}-${Math.min(100, Math.ceil(total + range))}`;

    const result: ReferenceScore = {
        total: Math.round(total * 10) / 10,
        breakdown: {
            actors: { score: Math.round(actorsScore * 10) / 10, max: 20, details: `Matched: ${comparison.actors.matched.length}/${totalActors}` },
            usecases: { score: Math.round(usecasesScore * 10) / 10, max: 30, details: `Matched: ${comparison.usecases.matched.length}/${totalUsecases}` },
            relationships: { score: Math.round(relationshipsScore * 10) / 10, max: 40, details: `Actor-UC: ${comparison.relationships.actorToUC.matched}` },
            presentation: { score: presentationScore, max: 10, details: 'Layout and boundary' }
        },
        confidence,
        suggestedRange
    };

    logger.info({
        message: 'STEP 6: Completed',
        event_type: 'step6_complete',
        total: result.total,
        confidence,
        totalPenalty
    });

    return result;
};

// ============================================================================
// STEP 7: GENERATE FEEDBACK
// ============================================================================

const step7_generateFeedback = async (
    input: UmlInput,
    referenceScore: ReferenceScore,
    errors: DetectedError[],
    comparison: ComparisonResult
): Promise<string> => {
    logger.info({
        message: 'STEP 7: Starting feedback generation',
        event_type: 'step7_start',
        id: input.id
    });

    const prompt = await promptService.getPrompts({
        type: 'uml-feedback-generator',
        isActive: true,
        limit: 1
    });

    if (!prompt.prompts || prompt.prompts.length === 0) {
        throw new Error('No active feedback generator prompt found');
    }

    const feedbackInput = {
        score: referenceScore,
        errors: errors,
        comparison: comparison,
        assignmentContext: input.contentAssignment.substring(0, 500) // First 500 chars for context
    };

    const promptContent = prompt.prompts[0].templateString
        .replace(/\{\{feedbackInput\}\}/g, JSON.stringify(feedbackInput, null, 2));

    const feedback = await callAIApi(promptContent, input.id, 'step7-feedback');

    logger.info({
        message: 'STEP 7: Completed',
        event_type: 'step7_complete',
        id: input.id,
        feedbackLength: feedback.length
    });

    return feedback;
};

// ============================================================================
// MAIN ORCHESTRATOR
// ============================================================================

export const processUseCaseUmlWithAI = async (
    input: UmlInput
): Promise<UmlProcessedResult> => {
    const startTime = Date.now();

    try {
        logger.info({
            message: '🚀 Starting 7-step UML processing pipeline',
            event_type: 'pipeline_start',
            id: input.id,
            typeUmlName: input.typeUmlName
        });

        // STEP 1: Validation & Preprocessing
        const domainContext = await step1_validateAndPreprocess(input);

        // STEP 2: Extract to JSON
        const diagrams = await step2_extractToJson(input, domainContext);

        // STEP 3: Semantic Normalization
        const normalized = await step3_semanticNormalization(input, diagrams);

        // STEP 4: Structure Comparison
        const comparison = step4_structureComparison(normalized);

        // STEP 5: Error Classification
        const errors = await step5_errorClassification(input, comparison, normalized, domainContext);

        // STEP 6: Calculate Reference Score
        const referenceScore = step6_calculateScore(comparison, errors);

        // STEP 7: Generate Feedback
        const feedback = await step7_generateFeedback(input, referenceScore, errors, comparison);

        const duration = Date.now() - startTime;

        // Identify items needing human review
        const humanReviewItems: string[] = [];

        // Low similarity matches
        comparison.actors.matched
            .filter(m => m.similarity < 0.85)
            .forEach(m => humanReviewItems.push(
                `Actor similarity low: "${m.student.name}" vs "${m.solution.name}" (${(m.similarity * 100).toFixed(0)}%)`
            ));

        comparison.usecases.matched
            .filter(m => m.similarity < 0.85)
            .forEach(m => humanReviewItems.push(
                `UseCase similarity low: "${m.student.name}" vs "${m.solution.name}" (${(m.similarity * 100).toFixed(0)}%)`
            ));

        // Extra elements that might be valid
        if (comparison.usecases.extra.length > 0) {
            humanReviewItems.push(
                `${comparison.usecases.extra.length} extra usecase(s) - may be valid additions: ${comparison.usecases.extra.map(uc => uc.name).join(', ')}`
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
                actors: {
                    matched: comparison.actors.matched.length,
                    missing: comparison.actors.missing.length,
                    extra: comparison.actors.extra.length
                },
                usecases: {
                    matched: comparison.usecases.matched.length,
                    missing: comparison.usecases.missing.length,
                    extra: comparison.usecases.extra.length
                },
                relationships: comparison.relationships
            },
            feedback: feedback,
            humanReviewItems: humanReviewItems,
            metadata: {
                processingTime: `${(duration / 1000).toFixed(1)}s`,
                aiCallsCount: 7, // 1 domain + 2 extract + 2 normalize + 1 classify + 1 feedback
                pipelineVersion: '1.0.0',
                timestamp: new Date().toISOString()
            }
        };

        logger.info({
            message: '✅ UML processing pipeline completed successfully',
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
            message: '❌ UML processing pipeline failed',
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
            throw new UmlProcessingError(`Pipeline failed: ${getErrorMessage(error)}`);
        }
    }
};