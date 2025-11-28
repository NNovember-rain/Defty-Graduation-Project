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

interface NormalizedActor extends Actor {
    normalized: NormalizedElement;
}

interface NormalizedUseCase extends UseCase {
    normalized: NormalizedElement;
}

interface NormalizedDiagram {
    actors: NormalizedActor[];
    usecases: NormalizedUseCase[];
    relationships: Relationship;
    boundary: Boundary;
}

interface ComparisonResult {
    actors: {
        matched: Array<{ solution: NormalizedActor; student: NormalizedActor; similarity: number }>;
        missing: NormalizedActor[];
        extra: NormalizedActor[];
    };
    usecases: {
        matched: Array<{ solution: NormalizedUseCase; student: NormalizedUseCase; similarity: number }>;
        missing: NormalizedUseCase[];
        extra: NormalizedUseCase[];
    };
    relationships: {
        actorToUC: { matched: number; missing: number; extra: number };
        include: { matched: number; missing: number; extra: number };
        extend: { matched: number; missing: number; extra: number };
        generalization: { matched: number; missing: number; extra: number };
    };
}

interface MissingActorAnalysis {
    actor: NormalizedActor;
    isAbstractParent: boolean;
    hasDirectUseCases: boolean;
    childrenIds: string[];
    childrenInStudent: string[];
    severity: 'CRITICAL' | 'MINOR';
}

interface EnhancedComparisonResult extends ComparisonResult {
    missingActorsAnalysis: MissingActorAnalysis[];
}

// Graph Analysis Types
interface GraphNode {
    id: string;
    type: 'actor' | 'usecase';
    name: string;
    canonical?: string;
}

interface GraphEdge {
    from: string;
    to: string;
    type: 'actorToUC' | 'generalization' | 'include' | 'extend';
}

interface PathInfo {
    from: string;
    to: string;
    length: number;
    path: string[];
}

interface GraphMetrics {
    nodeCount: number;
    edgeCount: number;
    avgDegree: number;
    maxDepth: number;
    pathCount: number;
    degreeCentrality: Map<string, number>;
}

interface GraphPattern {
    type: 'ACTOR_SPECIALIZATION_WITH_PRESERVED_PATHS'
        | 'MISSING_ABSTRACTION_WITH_PRESERVED_LOGIC'
        | 'UC_CONSOLIDATION'
        | 'UC_DECOMPOSITION'
        | 'UC_OVER_DECOMPOSITION_WITH_DUPLICATE'
        | 'STRUCTURAL_ISOMORPHISM'
        | 'EXTRA_UNRELATED_ELEMENTS';
    severity: 'POSITIVE' | 'NEUTRAL' | 'MINOR' | 'MAJOR' | 'CRITICAL';
    confidence: number;
    elements: {
        parent?: string;
        children?: string[];
        preservedPaths?: string[];
        isolated?: string[];
        duplicates?: string[];
        missing?: string[];
        extra?: string[];
        [key: string]: unknown;
    };
    structuralEquivalence: boolean;
    designQuality?: {
        rating: 'EXCELLENT' | 'GOOD' | 'ACCEPTABLE' | 'POOR';
        reasoning: string;
    };
}

interface GraphEquivalence {
    type: 'path_preserved' | 'isomorphic' | 'consolidated' | 'decomposed';
    confidence: number;
    explanation: string;
}

interface GraphRecommendation {
    code: 'IGNORE_MISSING_ACTOR' | 'IGNORE_EXTRA_ACTOR' | 'IGNORE_MISSING_UC'
        | 'IGNORE_EXTRA_UC' | 'REDUCE_PENALTY' | 'ADD_BONUS' | 'REQUIRE_HUMAN_REVIEW';
    reason: string;
    affectedElements: string[];
    penaltyAdjustment?: number;
    requiresHumanReview?: boolean;
    reviewContext?: string;
}

interface GraphAnalysisResult {
    patterns: GraphPattern[];
    structuralMetrics: {
        solution: GraphMetrics;
        student: GraphMetrics;
    };
    detectedEquivalences: GraphEquivalence[];
    recommendations: GraphRecommendation[];
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
 * Find element by ID in an array
 */
const findById = <T extends { id: string }>(
    elements: T[],
    id: string
): T | undefined => {
    return elements.find(e => e.id === id);
};

/**
 * Compare Actor-to-UC relationships using canonical names instead of IDs
 * FIX FOR BUG 2: Relationships so sánh bằng exact IDs
 */
const compareActorToUCRelationships = (
    solutionRels: Array<{ actorId: string; ucId: string }>,
    studentRels: Array<{ actorId: string; ucId: string }>,
    solutionActors: NormalizedActor[],
    studentActors: NormalizedActor[],
    solutionUCs: NormalizedUseCase[],
    studentUCs: NormalizedUseCase[]
): { matched: number; missing: number; extra: number } => {
    // Build canonical keys for solution relationships
    const solutionKeys = new Map<string, { actorId: string; ucId: string }>();
    for (const rel of solutionRels) {
        const actor = findById(solutionActors, rel.actorId);
        const uc = findById(solutionUCs, rel.ucId);

        if (actor && uc) {
            const actorCanonical = actor.normalized.canonical.toLowerCase();
            const ucCanonical = uc.normalized.canonical.toLowerCase();
            const key = `${actorCanonical}::${ucCanonical}`;
            solutionKeys.set(key, rel);
        }
    }

    // Build canonical keys for student relationships (use array to handle duplicates)
    const studentKeysMap = new Map<string, Array<{ actorId: string; ucId: string }>>();
    for (const rel of studentRels) {
        const actor = findById(studentActors, rel.actorId);
        const uc = findById(studentUCs, rel.ucId);

        if (actor && uc) {
            const actorCanonical = actor.normalized.canonical.toLowerCase();
            const ucCanonical = uc.normalized.canonical.toLowerCase();
            const key = `${actorCanonical}::${ucCanonical}`;

            if (!studentKeysMap.has(key)) {
                studentKeysMap.set(key, []);
            }
            studentKeysMap.get(key)!.push(rel);
        }
    }

    // Match relationships by canonical keys
    let matched = 0;
    for (const [key] of solutionKeys) {
        const stuRels = studentKeysMap.get(key) || [];
        if (stuRels.length > 0) {
            stuRels.shift(); // Remove matched relationship
            matched++;
            if (stuRels.length === 0) {
                studentKeysMap.delete(key);
            }
        }
    }

    // Count extra relationships
    let extra = 0;
    for (const stuRels of studentKeysMap.values()) {
        extra += stuRels.length;
    }

    return {
        matched,
        missing: solutionKeys.size - matched,
        extra
    };
};

/**
 * Compare Include relationships using canonical names
 */
const compareIncludeRelationships = (
    solutionRels: Array<{ baseId: string; includedId: string }>,
    studentRels: Array<{ baseId: string; includedId: string }>,
    solutionUCs: NormalizedUseCase[],
    studentUCs: NormalizedUseCase[]
): { matched: number; missing: number; extra: number } => {
    // Build canonical keys for solution
    const solutionKeys = new Map<string, { baseId: string; includedId: string }>();
    for (const rel of solutionRels) {
        const baseUC = findById(solutionUCs, rel.baseId);
        const includedUC = findById(solutionUCs, rel.includedId);

        if (baseUC && includedUC) {
            const baseCanonical = baseUC.normalized.canonical.toLowerCase();
            const includedCanonical = includedUC.normalized.canonical.toLowerCase();
            const key = `${baseCanonical}::include::${includedCanonical}`;
            solutionKeys.set(key, rel);
        }
    }

    // Build canonical keys for student (handle duplicates)
    const studentKeysMap = new Map<string, Array<{ baseId: string; includedId: string }>>();
    for (const rel of studentRels) {
        const baseUC = findById(studentUCs, rel.baseId);
        const includedUC = findById(studentUCs, rel.includedId);

        if (baseUC && includedUC) {
            const baseCanonical = baseUC.normalized.canonical.toLowerCase();
            const includedCanonical = includedUC.normalized.canonical.toLowerCase();
            const key = `${baseCanonical}::include::${includedCanonical}`;

            if (!studentKeysMap.has(key)) {
                studentKeysMap.set(key, []);
            }
            studentKeysMap.get(key)!.push(rel);
        }
    }

    // Match
    let matched = 0;
    for (const [key] of solutionKeys) {
        const stuRels = studentKeysMap.get(key) || [];
        if (stuRels.length > 0) {
            stuRels.shift();
            matched++;
            if (stuRels.length === 0) {
                studentKeysMap.delete(key);
            }
        }
    }

    // Count extra
    let extra = 0;
    for (const stuRels of studentKeysMap.values()) {
        extra += stuRels.length;
    }

    return {
        matched,
        missing: solutionKeys.size - matched,
        extra
    };
};

/**
 * Compare Extend relationships using canonical names
 */
const compareExtendRelationships = (
    solutionRels: Array<{ baseId: string; extendedId: string; condition?: string; extensionPoint?: string }>,
    studentRels: Array<{ baseId: string; extendedId: string; condition?: string; extensionPoint?: string }>,
    solutionUCs: NormalizedUseCase[],
    studentUCs: NormalizedUseCase[]
): { matched: number; missing: number; extra: number } => {
    // Build canonical keys for solution
    const solutionKeys = new Map<string, typeof solutionRels[0]>();
    for (const rel of solutionRels) {
        const baseUC = findById(solutionUCs, rel.baseId);
        const extendedUC = findById(solutionUCs, rel.extendedId);

        if (baseUC && extendedUC) {
            const baseCanonical = baseUC.normalized.canonical.toLowerCase();
            const extendedCanonical = extendedUC.normalized.canonical.toLowerCase();
            const key = `${baseCanonical}::extend::${extendedCanonical}`;
            solutionKeys.set(key, rel);
        }
    }

    // Build canonical keys for student (handle duplicates)
    const studentKeysMap = new Map<string, Array<typeof studentRels[0]>>();
    for (const rel of studentRels) {
        const baseUC = findById(studentUCs, rel.baseId);
        const extendedUC = findById(studentUCs, rel.extendedId);

        if (baseUC && extendedUC) {
            const baseCanonical = baseUC.normalized.canonical.toLowerCase();
            const extendedCanonical = extendedUC.normalized.canonical.toLowerCase();
            const key = `${baseCanonical}::extend::${extendedCanonical}`;

            if (!studentKeysMap.has(key)) {
                studentKeysMap.set(key, []);
            }
            studentKeysMap.get(key)!.push(rel);
        }
    }

    // Match
    let matched = 0;
    for (const [key] of solutionKeys) {
        const stuRels = studentKeysMap.get(key) || [];
        if (stuRels.length > 0) {
            stuRels.shift();
            matched++;
            if (stuRels.length === 0) {
                studentKeysMap.delete(key);
            }
        }
    }

    // Count extra
    let extra = 0;
    for (const stuRels of studentKeysMap.values()) {
        extra += stuRels.length;
    }

    return {
        matched,
        missing: solutionKeys.size - matched,
        extra
    };
};

/**
 * Compare Generalization relationships using canonical names
 */
const compareGeneralizationRelationships = (
    solutionRels: Array<{ parentId: string; childId: string; type: 'actor' | 'usecase' }>,
    studentRels: Array<{ parentId: string; childId: string; type: 'actor' | 'usecase' }>,
    solutionActors: NormalizedActor[],
    studentActors: NormalizedActor[],
    solutionUCs: NormalizedUseCase[],
    studentUCs: NormalizedUseCase[]
): { matched: number; missing: number; extra: number } => {
    // Helper to get canonical by ID and type
    const getCanonical = (
        id: string,
        type: 'actor' | 'usecase',
        actors: NormalizedActor[],
        ucs: NormalizedUseCase[]
    ): string | null => {
        if (type === 'actor') {
            const actor = findById(actors, id);
            return actor ? actor.normalized.canonical.toLowerCase() : null;
        } else {
            const uc = findById(ucs, id);
            return uc ? uc.normalized.canonical.toLowerCase() : null;
        }
    };

    // Build canonical keys for solution
    const solutionKeys = new Map<string, typeof solutionRels[0]>();
    for (const rel of solutionRels) {
        const parentCanonical = getCanonical(rel.parentId, rel.type, solutionActors, solutionUCs);
        const childCanonical = getCanonical(rel.childId, rel.type, solutionActors, solutionUCs);

        if (parentCanonical && childCanonical) {
            const key = `${rel.type}::${parentCanonical}::gen::${childCanonical}`;
            solutionKeys.set(key, rel);
        }
    }

    // Build canonical keys for student (handle duplicates)
    const studentKeysMap = new Map<string, Array<typeof studentRels[0]>>();
    for (const rel of studentRels) {
        const parentCanonical = getCanonical(rel.parentId, rel.type, studentActors, studentUCs);
        const childCanonical = getCanonical(rel.childId, rel.type, studentActors, studentUCs);

        if (parentCanonical && childCanonical) {
            const key = `${rel.type}::${parentCanonical}::gen::${childCanonical}`;

            if (!studentKeysMap.has(key)) {
                studentKeysMap.set(key, []);
            }
            studentKeysMap.get(key)!.push(rel);
        }
    }

    // Match
    let matched = 0;
    for (const [key] of solutionKeys) {
        const stuRels = studentKeysMap.get(key) || [];
        if (stuRels.length > 0) {
            stuRels.shift();
            matched++;
            if (stuRels.length === 0) {
                studentKeysMap.delete(key);
            }
        }
    }

    // Count extra
    let extra = 0;
    for (const stuRels of studentKeysMap.values()) {
        extra += stuRels.length;
    }

    return {
        matched,
        missing: solutionKeys.size - matched,
        extra
    };
};

// ============================================================================
// STEP 1: VALIDATION & PREPROCESSING
// ============================================================================

const step1_validateAndPreprocess = async (input: UmlInput): Promise<DomainContext> => {
    logger.info({
        message: 'BƯỚC 1: Bắt đầu validation và preprocessing',
        event_type: 'step1_start',
        id: input.id
    });

    // Validate input structure
    if (!input.typeUmlName || !input.contentAssignment ||
        !input.solutionPlantUmlCode || !input.studentPlantUmlCode) {
        throw new UmlProcessingError('Thiếu trường bắt buộc trong input');
    }

    // Validate PlantUML syntax
    const validatePlantUml = (code: string, label: string) => {
        if (!code.includes('@startuml') || !code.includes('@enduml')) {
            throw new UmlProcessingError(`${label}: Thiếu PlantUML tags`);
        }
    };

    validatePlantUml(input.solutionPlantUmlCode, 'Solution');
    validatePlantUml(input.studentPlantUmlCode, 'Student');

    // Extract domain context using AI
    const prompt = await promptService.getPrompts({
        type: 'usecase-domain-extractor',
        isActive: true,
        limit: 1
    });

    if (!prompt.prompts || prompt.prompts.length === 0) {
        throw new Error('Không tìm thấy prompt domain extractor');
    }

    const promptContent = prompt.prompts[0].templateString
        .replace(/\{\{contentAssignment\}\}/g, input.contentAssignment);

    const aiResponse = await callAIApi(promptContent, input.id, 'step1-domain');
    const domainContext = parseJsonResponse<DomainContext>(aiResponse, input.id, 'step1');

    logger.info({
        message: 'BƯỚC 1: Hoàn thành',
        event_type: 'step1_complete',
        id: input.id,
        keywordsCount: domainContext.keywords.length,
        requirementsCount: domainContext.mandatoryRequirements.length
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
        type: 'usecase-plantuml-extractor',
        isActive: true,
        limit: 1
    });

    if (!prompt.prompts || prompt.prompts.length === 0) {
        throw new Error('Không tìm thấy prompt PlantUML extractor');
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

    logger.info({
        message: 'BƯỚC 2: Hoàn thành',
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
        type: 'usecase-semantic-normalizer',
        isActive: true,
        limit: 1
    });

    if (!prompt.prompts || prompt.prompts.length === 0) {
        throw new Error('Không tìm thấy prompt semantic normalizer');
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

    const promptContent = prompt.prompts[0].templateString
        .replace(/\{\{elements\}\}/g, JSON.stringify(elementsToNormalize))
        .replace(/\{\{domainContext\}\}/g, JSON.stringify(domainContext));

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
    const normalizedSolutionActors: NormalizedActor[] = diagrams.solution.actors.map(actor => {
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

    const normalizedSolutionUsecases: NormalizedUseCase[] = diagrams.solution.usecases.map(uc => {
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
    const normalizedStudentActors: NormalizedActor[] = diagrams.student.actors.map(actor => {
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

    const normalizedStudentUsecases: NormalizedUseCase[] = diagrams.student.usecases.map(uc => {
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
        message: 'BƯỚC 3: Hoàn thành',
        event_type: 'step3_complete',
        id: input.id
    });

    return result;
};

// ============================================================================
// STEP 4: STRUCTURE COMPARISON (FIXED - BUG 1 & BUG 2)
// ============================================================================

const step4_structureComparison = (
    normalized: { solution: NormalizedDiagram; student: NormalizedDiagram }
): EnhancedComparisonResult => {
    logger.info({
        message: 'BƯỚC 4: Bắt đầu so sánh cấu trúc (FIXED)',
        event_type: 'step4_start'
    });

    const { solution, student } = normalized;

    // =========================================================================
    // FIX BUG 1: Compare actors by canonical names with duplicate handling
    // =========================================================================
    const matchedActors: ComparisonResult['actors']['matched'] = [];
    const missingActors: NormalizedActor[] = [];
    const extraActors: NormalizedActor[] = [];

    // Build map: canonical -> array of actors (handles duplicates)
    const studentActorsByCanonical = buildCanonicalMap(student.actors);

    // Match solution actors with student actors
    for (const solActor of solution.actors) {
        const canonical = solActor.normalized.canonical.toLowerCase();
        const stuActors = studentActorsByCanonical.get(canonical) || [];

        if (stuActors.length > 0) {
            // Match with first unmatched student actor
            const stuActor = stuActors.shift()!;
            matchedActors.push({
                solution: solActor,
                student: stuActor,
                similarity: Math.max(solActor.normalized.similarityScore, stuActor.normalized.similarityScore)
            });

            // Clean up empty arrays
            if (stuActors.length === 0) {
                studentActorsByCanonical.delete(canonical);
            }
        } else {
            missingActors.push(solActor);
        }
    }

    // Remaining student actors are extra
    for (const stuActors of studentActorsByCanonical.values()) {
        extraActors.push(...stuActors);
    }

    // Analyze missing actors for abstract parent pattern
    const missingActorsAnalysis: MissingActorAnalysis[] = missingActors.map(actor => {
        const generalizationRelations = solution.relationships.generalization
            .filter(gen => gen.type === 'actor' && gen.parentId === actor.id);

        const isAbstractParent = generalizationRelations.length > 0;
        const childrenIds = generalizationRelations.map(gen => gen.childId);

        const hasDirectUseCases = solution.relationships.actorToUC
            .some(rel => rel.actorId === actor.id);

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

        let severity: 'CRITICAL' | 'MINOR' = 'CRITICAL';

        if (isAbstractParent && !hasDirectUseCases) {
            if (childrenInStudent.length === childrenIds.length) {
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

    // =========================================================================
    // FIX BUG 1 (continued): Compare usecases with duplicate handling
    // =========================================================================
    const matchedUsecases: ComparisonResult['usecases']['matched'] = [];
    const missingUsecases: NormalizedUseCase[] = [];
    const extraUsecases: NormalizedUseCase[] = [];

    // Build map: canonical -> array of usecases (handles duplicates)
    const studentUsecasesByCanonical = buildCanonicalMap(student.usecases);

    for (const solUc of solution.usecases) {
        const canonical = solUc.normalized.canonical.toLowerCase();
        const stuUcs = studentUsecasesByCanonical.get(canonical) || [];

        if (stuUcs.length > 0) {
            const stuUc = stuUcs.shift()!;
            matchedUsecases.push({
                solution: solUc,
                student: stuUc,
                similarity: Math.max(solUc.normalized.similarityScore, stuUc.normalized.similarityScore)
            });

            if (stuUcs.length === 0) {
                studentUsecasesByCanonical.delete(canonical);
            }
        } else {
            missingUsecases.push(solUc);
        }
    }

    for (const stuUcs of studentUsecasesByCanonical.values()) {
        extraUsecases.push(...stuUcs);
    }

    // =========================================================================
    // FIX BUG 2: Compare relationships using canonical names instead of IDs
    // =========================================================================
    const relationships = {
        // Actor-to-UC relationships using canonical comparison
        actorToUC: compareActorToUCRelationships(
            solution.relationships.actorToUC,
            student.relationships.actorToUC,
            solution.actors,
            student.actors,
            solution.usecases,
            student.usecases
        ),

        // Include relationships using canonical comparison
        include: compareIncludeRelationships(
            solution.relationships.include,
            student.relationships.include,
            solution.usecases,
            student.usecases
        ),

        // Extend relationships using canonical comparison
        extend: compareExtendRelationships(
            solution.relationships.extend,
            student.relationships.extend,
            solution.usecases,
            student.usecases
        ),

        // Generalization relationships using canonical comparison
        generalization: compareGeneralizationRelationships(
            solution.relationships.generalization,
            student.relationships.generalization,
            solution.actors,
            student.actors,
            solution.usecases,
            student.usecases
        )
    };

    const result: EnhancedComparisonResult = {
        actors: { matched: matchedActors, missing: missingActors, extra: extraActors },
        usecases: { matched: matchedUsecases, missing: missingUsecases, extra: extraUsecases },
        relationships,
        missingActorsAnalysis
    };

    logger.info({
        message: 'BƯỚC 4: Hoàn thành (FIXED)',
        event_type: 'step4_complete',
        actors: {
            matched: matchedActors.length,
            missing: missingActors.length,
            extra: extraActors.length
        },
        usecases: {
            matched: matchedUsecases.length,
            missing: missingUsecases.length,
            extra: extraUsecases.length
        },
        relationships: {
            actorToUC: relationships.actorToUC,
            include: relationships.include,
            extend: relationships.extend,
            generalization: relationships.generalization
        }
    });

    return result;
};

// ============================================================================
// STEP 5: GRAPH ANALYSIS (ENHANCED WITH ACTOR SPECIALIZATION DETECTION)
// ============================================================================

class UseCaseGraphAnalyzer {
    private nodes: Map<string, GraphNode> = new Map();
    private edges: GraphEdge[] = [];
    private adjacencyList: Map<string, Set<string>> = new Map();

    constructor(diagram: NormalizedDiagram) {
        this.buildGraph(diagram);
    }

    private buildGraph(diagram: NormalizedDiagram) {
        // Add actor nodes
        for (const actor of diagram.actors) {
            this.nodes.set(actor.id, {
                id: actor.id,
                type: 'actor',
                name: actor.name,
                canonical: actor.normalized.canonical
            });
            this.adjacencyList.set(actor.id, new Set());
        }

        // Add usecase nodes
        for (const uc of diagram.usecases) {
            this.nodes.set(uc.id, {
                id: uc.id,
                type: 'usecase',
                name: uc.name,
                canonical: uc.normalized.canonical
            });
            this.adjacencyList.set(uc.id, new Set());
        }

        // Add actorToUC edges
        for (const rel of diagram.relationships.actorToUC) {
            this.addEdge(rel.actorId, rel.ucId, 'actorToUC');
        }

        // Add generalization edges
        for (const rel of diagram.relationships.generalization) {
            this.addEdge(rel.parentId, rel.childId, 'generalization');
        }

        // Add include edges
        for (const rel of diagram.relationships.include) {
            this.addEdge(rel.baseId, rel.includedId, 'include');
        }

        // Add extend edges
        for (const rel of diagram.relationships.extend) {
            this.addEdge(rel.baseId, rel.extendedId, 'extend');
        }
    }

    private addEdge(from: string, to: string, type: GraphEdge['type']) {
        this.edges.push({ from, to, type });
        this.adjacencyList.get(from)?.add(to);
    }

    public findPaths(fromId: string, toId: string, maxDepth: number = 10): PathInfo[] {
        const paths: PathInfo[] = [];
        const visited = new Set<string>();

        const dfs = (currentId: string, targetId: string, currentPath: string[], depth: number) => {
            if (depth > maxDepth) return;
            if (currentId === targetId) {
                paths.push({
                    from: fromId,
                    to: toId,
                    length: currentPath.length,
                    path: [...currentPath, currentId]
                });
                return;
            }

            visited.add(currentId);
            const neighbors = this.adjacencyList.get(currentId) || new Set();

            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    dfs(neighbor, targetId, [...currentPath, currentId], depth + 1);
                }
            }

            visited.delete(currentId);
        };

        dfs(fromId, toId, [], 0);
        return paths;
    }

    public getDegreeCentrality(): Map<string, number> {
        const centrality = new Map<string, number>();

        for (const [nodeId, neighbors] of this.adjacencyList) {
            const inDegree = this.edges.filter(e => e.to === nodeId).length;
            const outDegree = neighbors.size;
            centrality.set(nodeId, inDegree + outDegree);
        }

        return centrality;
    }

    public getMetrics(): GraphMetrics {
        const degreeCentrality = this.getDegreeCentrality();
        const degrees = Array.from(degreeCentrality.values());

        // Calculate max depth (longest path from any actor to any usecase)
        let maxDepth = 0;
        const actors = Array.from(this.nodes.values()).filter(n => n.type === 'actor');
        const usecases = Array.from(this.nodes.values()).filter(n => n.type === 'usecase');

        let totalPaths = 0;
        for (const actor of actors) {
            for (const uc of usecases) {
                const paths = this.findPaths(actor.id, uc.id);
                totalPaths += paths.length;
                for (const path of paths) {
                    maxDepth = Math.max(maxDepth, path.length);
                }
            }
        }

        return {
            nodeCount: this.nodes.size,
            edgeCount: this.edges.length,
            avgDegree: degrees.length > 0 ? degrees.reduce((a, b) => a + b, 0) / degrees.length : 0,
            maxDepth,
            pathCount: totalPaths,
            degreeCentrality
        };
    }

    public findActorUseCasePaths(actorId: string): Map<string, PathInfo[]> {
        const paths = new Map<string, PathInfo[]>();
        const usecases = Array.from(this.nodes.values()).filter(n => n.type === 'usecase');

        for (const uc of usecases) {
            const foundPaths = this.findPaths(actorId, uc.id);
            if (foundPaths.length > 0) {
                paths.set(uc.id, foundPaths);
            }
        }

        return paths;
    }

    public getGeneralizationChildren(parentId: string): string[] {
        return this.edges
            .filter(e => e.type === 'generalization' && e.from === parentId)
            .map(e => e.to);
    }

    public isIsolated(nodeId: string): boolean {
        const degree = this.getDegreeCentrality().get(nodeId) || 0;
        return degree === 0;
    }

    public getNode(nodeId: string): GraphNode | undefined {
        return this.nodes.get(nodeId);
    }

    public getAllActors(): GraphNode[] {
        return Array.from(this.nodes.values()).filter(n => n.type === 'actor');
    }

    public getAllUseCases(): GraphNode[] {
        return Array.from(this.nodes.values()).filter(n => n.type === 'usecase');
    }

    public getEdges(): GraphEdge[] {
        return this.edges;
    }
}

/**
 * FIX BUG 3: Detect Actor Specialization patterns in student diagram
 * This detects when student applies actor hierarchy with preserved paths
 */
const detectActorSpecialization = (
    studentDiagram: NormalizedDiagram,
    solutionDiagram: NormalizedDiagram, // NEW PARAMETER
    studentGraph: UseCaseGraphAnalyzer
): { patterns: GraphPattern[]; recommendations: GraphRecommendation[]; equivalences: GraphEquivalence[] } => {
    const patterns: GraphPattern[] = [];
    const recommendations: GraphRecommendation[] = [];
    const equivalences: GraphEquivalence[] = [];

    // Build solution actor canonicals set for quick lookup
    const solutionActorCanonicals = new Set(
        solutionDiagram.actors.map(a => a.normalized.canonical.toLowerCase())
    );

    // Build solution's hierarchy map (parent -> children canonicals)
    const solutionHierarchyMap = new Map<string, Set<string>>();
    for (const gen of solutionDiagram.relationships.generalization.filter(g => g.type === 'actor')) {
        const parent = solutionDiagram.actors.find(a => a.id === gen.parentId);
        const child = solutionDiagram.actors.find(a => a.id === gen.childId);
        if (parent && child) {
            const parentCanonical = parent.normalized.canonical.toLowerCase();
            const childCanonical = child.normalized.canonical.toLowerCase();
            if (!solutionHierarchyMap.has(parentCanonical)) {
                solutionHierarchyMap.set(parentCanonical, new Set());
            }
            solutionHierarchyMap.get(parentCanonical)!.add(childCanonical);
        }
    }

    // Get actor generalizations in student diagram
    const studentGeneralizations = studentDiagram.relationships.generalization
        .filter(gen => gen.type === 'actor');

    if (studentGeneralizations.length === 0) {
        return { patterns, recommendations, equivalences };
    }

    logger.info({
        message: 'BƯỚC 5: Phát hiện actor generalization trong student diagram',
        count: studentGeneralizations.length,
        solutionHierarchies: solutionHierarchyMap.size
    });

    // Group student generalizations by parent
    const studentHierarchyMap = new Map<string, string[]>();
    for (const gen of studentGeneralizations) {
        if (!studentHierarchyMap.has(gen.parentId)) {
            studentHierarchyMap.set(gen.parentId, []);
        }
        studentHierarchyMap.get(gen.parentId)!.push(gen.childId);
    }

    // Analyze each hierarchy in student diagram
    for (const [parentId, childrenIds] of studentHierarchyMap) {
        const parentNode = studentGraph.getNode(parentId);
        if (!parentNode) continue;

        const parentCanonical = parentNode.canonical?.toLowerCase() || '';

        const childNodes = childrenIds
            .map(id => studentGraph.getNode(id))
            .filter((node): node is GraphNode => node !== undefined);

        if (childNodes.length === 0) continue;

        // =====================================================================
        // CRITICAL: Validate against solution
        // =====================================================================

        // Check 1: Does parent exist in solution?
        const parentInSolution = solutionActorCanonicals.has(parentCanonical);

        // Check 2: Which children exist in solution?
        const childrenAnalysis = childNodes.map(child => {
            const childCanonical = child.canonical?.toLowerCase() || '';
            const inSolution = solutionActorCanonicals.has(childCanonical);

            // Also check if this child is in solution's hierarchy for this parent
            const inSolutionHierarchy = solutionHierarchyMap.get(parentCanonical)?.has(childCanonical) || false;

            return {
                node: child,
                canonical: childCanonical,
                inSolution,
                inSolutionHierarchy
            };
        });

        const matchingChildren = childrenAnalysis.filter(c => c.inSolution);
        const extraChildren = childrenAnalysis.filter(c => !c.inSolution);
        const matchRatio = matchingChildren.length / childNodes.length;

        // Check 3: Does solution have same hierarchy structure?
        const solutionHasThisHierarchy = solutionHierarchyMap.has(parentCanonical);
        const solutionChildrenCount = solutionHierarchyMap.get(parentCanonical)?.size || 0;

        logger.info({
            message: 'BƯỚC 5: Phân tích actor hierarchy',
            parent: parentNode.name,
            parentCanonical,
            parentInSolution,
            totalChildren: childNodes.length,
            matchingChildren: matchingChildren.length,
            extraChildren: extraChildren.length,
            matchRatio,
            solutionHasThisHierarchy,
            solutionChildrenCount
        });

        // =====================================================================
        // Decision logic for patterns and recommendations
        // =====================================================================

        if (!parentInSolution) {
            // Parent doesn't exist in solution - this is likely wrong
            // Don't give bonus, let Step 6 handle as extra actors
            logger.info({
                message: 'BƯỚC 5: Parent không có trong solution, bỏ qua bonus',
                parent: parentNode.name
            });
            continue;
        }

        if (extraChildren.length > 0) {
            // Has extra children not in solution
            // Create pattern but with PENALTY recommendation, not bonus

            const preservedPaths: string[] = [];
            for (const child of matchingChildren) {
                const childPaths = studentGraph.findActorUseCasePaths(child.node.id);
                for (const [ucId] of childPaths) {
                    const ucNode = studentGraph.getNode(ucId);
                    if (ucNode) {
                        preservedPaths.push(`${parentNode.name} → ${ucNode.name} (via ${child.node.name})`);
                    }
                }
            }

            if (matchingChildren.length > 0 && matchRatio >= 0.3) {
                // Some children match - partial credit
                patterns.push({
                    type: 'ACTOR_SPECIALIZATION_WITH_PRESERVED_PATHS',
                    severity: 'MINOR', // Not POSITIVE because of extra children
                    confidence: matchRatio,
                    elements: {
                        parent: parentNode.name,
                        children: childNodes.map(c => c.name),
                        preservedPaths,
                        extra: extraChildren.map(c => c.node.name) // Track extra children
                    },
                    structuralEquivalence: false, // Not equivalent due to extras
                    designQuality: {
                        rating: 'ACCEPTABLE',
                        reasoning: `Student applied actor hierarchy but added ${extraChildren.length} extra children not in solution: ${extraChildren.map(c => c.node.name).join(', ')}`
                    }
                });

                // Recommendation: Partial bonus for matching, but flag extras
                if (matchRatio >= 0.5) {
                    // More than half match - small bonus for hierarchy concept
                    recommendations.push({
                        code: 'REDUCE_PENALTY',
                        reason: `Actor hierarchy partially matches solution (${matchingChildren.length}/${childNodes.length} children). Extra children should still be penalized.`,
                        affectedElements: matchingChildren.map(c => c.node.name),
                        penaltyAdjustment: Math.floor(matchRatio * 2), // Max +1 or +2
                        requiresHumanReview: false
                    });
                }

                // Flag extra children for penalty (DO NOT give bonus)
                for (const extra of extraChildren) {
                    recommendations.push({
                        code: 'REQUIRE_HUMAN_REVIEW',
                        reason: `Extra actor '${extra.node.name}' is child of hierarchy but NOT in solution. Should be penalized unless justified by requirements.`,
                        affectedElements: [extra.node.name],
                        penaltyAdjustment: 0, // No adjustment - let Step 6 apply penalty
                        requiresHumanReview: true,
                        reviewContext: `Actor '${extra.node.name}' is in student's hierarchy under '${parentNode.name}' but does not exist in solution.`
                    });
                }

            } else {
                // Very few or no children match - this is a wrong hierarchy
                patterns.push({
                    type: 'EXTRA_UNRELATED_ELEMENTS',
                    severity: 'MAJOR',
                    confidence: 0.9,
                    elements: {
                        isolated: extraChildren.map(c => c.node.name),
                        parent: parentNode.name
                    },
                    structuralEquivalence: false,
                    designQuality: {
                        rating: 'POOR',
                        reasoning: `Student created actor hierarchy with mostly extra actors not in solution`
                    }
                });

                // No bonus, just flag for review
                recommendations.push({
                    code: 'REQUIRE_HUMAN_REVIEW',
                    reason: `Actor hierarchy under '${parentNode.name}' contains ${extraChildren.length} actors not in solution`,
                    affectedElements: extraChildren.map(c => c.node.name),
                    penaltyAdjustment: 0,
                    requiresHumanReview: true
                });
            }

        } else if (matchingChildren.length === childNodes.length && solutionHasThisHierarchy) {
            // ALL children match solution AND solution has this hierarchy
            // This deserves bonus!

            const preservedPaths: string[] = [];
            for (const child of matchingChildren) {
                const childPaths = studentGraph.findActorUseCasePaths(child.node.id);
                for (const [ucId] of childPaths) {
                    const ucNode = studentGraph.getNode(ucId);
                    if (ucNode) {
                        preservedPaths.push(`${parentNode.name} → ${ucNode.name} (via ${child.node.name})`);
                    }
                }
            }

            patterns.push({
                type: 'ACTOR_SPECIALIZATION_WITH_PRESERVED_PATHS',
                severity: 'POSITIVE',
                confidence: 0.95,
                elements: {
                    parent: parentNode.name,
                    children: childNodes.map(c => c.name),
                    preservedPaths
                },
                structuralEquivalence: true,
                designQuality: {
                    rating: 'EXCELLENT',
                    reasoning: `Student correctly applied actor hierarchy matching solution structure`
                }
            });

            // Give bonus
            recommendations.push({
                code: 'ADD_BONUS',
                reason: `Excellent actor hierarchy design matching solution: ${parentNode.name} → [${childNodes.map(c => c.name).join(', ')}]`,
                affectedElements: [parentNode.name, ...childNodes.map(c => c.name)],
                penaltyAdjustment: 2, // +2 bonus
                requiresHumanReview: false
            });

            equivalences.push({
                type: 'path_preserved',
                confidence: 0.95,
                explanation: `Actor hierarchy matches solution exactly`
            });

            logger.info({
                message: 'BƯỚC 5: Actor hierarchy MATCHES solution - giving bonus',
                parent: parentNode.name,
                children: childNodes.map(c => c.name),
                bonus: 2
            });

        } else if (matchingChildren.length === childNodes.length && !solutionHasThisHierarchy) {
            // All children exist in solution but solution doesn't have THIS hierarchy
            // This is acceptable but not bonus-worthy

            patterns.push({
                type: 'ACTOR_SPECIALIZATION_WITH_PRESERVED_PATHS',
                severity: 'NEUTRAL',
                confidence: 0.8,
                elements: {
                    parent: parentNode.name,
                    children: childNodes.map(c => c.name),
                    preservedPaths: []
                },
                structuralEquivalence: true,
                designQuality: {
                    rating: 'GOOD',
                    reasoning: `Student created valid actor hierarchy (all actors exist in solution) but solution uses different structure`
                }
            });

            // Neutral - no bonus, no penalty for hierarchy itself
            recommendations.push({
                code: 'REDUCE_PENALTY',
                reason: `Valid alternative actor organization - all actors exist in solution`,
                affectedElements: [parentNode.name, ...childNodes.map(c => c.name)],
                penaltyAdjustment: 0, // Neutral
                requiresHumanReview: false
            });
        }
    }

    return { patterns, recommendations, equivalences };
};

const step5_graphAnalysis = (
    normalized: { solution: NormalizedDiagram; student: NormalizedDiagram },
    comparison: EnhancedComparisonResult
): GraphAnalysisResult => {
    logger.info({
        message: 'BƯỚC 5: Bắt đầu phân tích Graph (ENHANCED)',
        event_type: 'step5_start'
    });

    const solutionGraph = new UseCaseGraphAnalyzer(normalized.solution);
    const studentGraph = new UseCaseGraphAnalyzer(normalized.student);

    const patterns: GraphPattern[] = [];
    const equivalences: GraphEquivalence[] = [];
    const recommendations: GraphRecommendation[] = [];

    // PATTERN 1: ACTOR_SPECIALIZATION_WITH_PRESERVED_PATHS (from solution perspective)
    if (comparison.actors.extra.length > 0) {
        for (const extraActor of comparison.actors.extra) {
            const childrenIds = solutionGraph.getGeneralizationChildren(extraActor.id);

            // Check if this actor is a child of another actor in solution
            const isChild = normalized.solution.relationships.generalization
                .some(gen => gen.type === 'actor' && gen.childId === extraActor.id);

            if (isChild) {
                const parentRel = normalized.solution.relationships.generalization
                    .find(gen => gen.type === 'actor' && gen.childId === extraActor.id);

                if (parentRel) {
                    const parentNode = solutionGraph.getNode(parentRel.parentId);
                    if (parentNode) {
                        const parentPaths = solutionGraph.findActorUseCasePaths(parentNode.id);
                        const childPaths = studentGraph.findActorUseCasePaths(extraActor.id);

                        const preservedPaths: string[] = [];
                        let allPathsPreserved = true;

                        for (const [ucId] of parentPaths) {
                            const ucNode = solutionGraph.getNode(ucId);
                            if (ucNode && ucNode.canonical) {
                                const studentUc = normalized.student.usecases
                                    .find(u => u.normalized.canonical.toLowerCase() === ucNode.canonical?.toLowerCase());

                                if (studentUc) {
                                    const childPathsToUc = childPaths.get(studentUc.id);
                                    if (childPathsToUc && childPathsToUc.length > 0) {
                                        preservedPaths.push(`${parentNode.name}⇝${ucNode.name} (qua ${extraActor.name})`);
                                    } else {
                                        allPathsPreserved = false;
                                    }
                                }
                            }
                        }

                        if (allPathsPreserved && preservedPaths.length > 0) {
                            patterns.push({
                                type: 'ACTOR_SPECIALIZATION_WITH_PRESERVED_PATHS',
                                severity: 'POSITIVE',
                                confidence: 0.95,
                                elements: {
                                    parent: parentNode.name,
                                    children: [extraActor.name],
                                    preservedPaths
                                },
                                structuralEquivalence: true,
                                designQuality: {
                                    rating: 'EXCELLENT',
                                    reasoning: 'Áp dụng generalization hierarchy hợp lý, logic đầy đủ'
                                }
                            });

                            recommendations.push({
                                code: 'IGNORE_EXTRA_ACTOR',
                                reason: 'Actor là specialization hợp lý với path preserved',
                                affectedElements: [extraActor.name],
                                penaltyAdjustment: 0
                            });

                            equivalences.push({
                                type: 'path_preserved',
                                confidence: 0.95,
                                explanation: `${extraActor.name} bảo toàn tất cả paths từ ${parentNode.name}`
                            });
                        }
                    }
                }
            }
        }
    }

    // PATTERN 2: MISSING_ABSTRACTION_WITH_PRESERVED_LOGIC
    for (const missingAnalysis of comparison.missingActorsAnalysis) {
        if (missingAnalysis.isAbstractParent &&
            !missingAnalysis.hasDirectUseCases &&
            missingAnalysis.childrenInStudent.length === missingAnalysis.childrenIds.length) {

            patterns.push({
                type: 'MISSING_ABSTRACTION_WITH_PRESERVED_LOGIC',
                severity: 'MINOR',
                confidence: 0.9,
                elements: {
                    parent: missingAnalysis.actor.name,
                    children: missingAnalysis.childrenIds
                        .map(id => normalized.solution.actors.find(a => a.id === id)?.name)
                        .filter((name): name is string => name !== undefined)
                },
                structuralEquivalence: true,
                designQuality: {
                    rating: 'ACCEPTABLE',
                    reasoning: 'Thiếu abstraction layer nhưng logic đầy đủ'
                }
            });

            recommendations.push({
                code: 'REDUCE_PENALTY',
                reason: 'Thiếu abstract parent nhưng tất cả children đều có',
                affectedElements: [missingAnalysis.actor.name],
                penaltyAdjustment: -4 // Reduce penalty from -8 to -4
            });
        }
    }

    // PATTERN 3: EXTRA_UNRELATED_ELEMENTS (isolated nodes)
    for (const extraActor of comparison.actors.extra) {
        if (studentGraph.isIsolated(extraActor.id)) {
            patterns.push({
                type: 'EXTRA_UNRELATED_ELEMENTS',
                severity: 'CRITICAL',
                confidence: 1.0,
                elements: {
                    isolated: [extraActor.name]
                },
                structuralEquivalence: false
            });
        }
    }

    for (const extraUc of comparison.usecases.extra) {
        if (studentGraph.isIsolated(extraUc.id)) {
            patterns.push({
                type: 'EXTRA_UNRELATED_ELEMENTS',
                severity: 'CRITICAL',
                confidence: 1.0,
                elements: {
                    isolated: [extraUc.name]
                },
                structuralEquivalence: false
            });
        }
    }

    // PATTERN 4: UC_CONSOLIDATION or UC_DECOMPOSITION
    if (comparison.usecases.missing.length > 0 && comparison.usecases.extra.length > 0) {
        const missingCount = comparison.usecases.missing.length;
        const extraCount = comparison.usecases.extra.length;

        if (missingCount > extraCount) {
            patterns.push({
                type: 'UC_CONSOLIDATION',
                severity: 'MINOR',
                confidence: 0.6,
                elements: {
                    missing: comparison.usecases.missing.map(uc => uc.name),
                    extra: comparison.usecases.extra.map(uc => uc.name)
                },
                structuralEquivalence: false,
                designQuality: {
                    rating: 'ACCEPTABLE',
                    reasoning: 'Gộp nhiều UC thành ít UC - cần kiểm tra semantic'
                }
            });

            recommendations.push({
                code: 'REQUIRE_HUMAN_REVIEW',
                reason: 'Phát hiện UC consolidation - cần xác nhận semantic',
                affectedElements: comparison.usecases.extra.map(uc => uc.name)
            });

        } else if (extraCount > missingCount) {
            patterns.push({
                type: 'UC_DECOMPOSITION',
                severity: 'NEUTRAL',
                confidence: 0.6,
                elements: {
                    missing: comparison.usecases.missing.map(uc => uc.name),
                    extra: comparison.usecases.extra.map(uc => uc.name)
                },
                structuralEquivalence: false,
                designQuality: {
                    rating: 'GOOD',
                    reasoning: 'Tách UC thành chi tiết hơn - có thể là thiết kế tốt'
                }
            });

            recommendations.push({
                code: 'REQUIRE_HUMAN_REVIEW',
                reason: 'Phát hiện UC decomposition - cần kiểm tra rubric',
                affectedElements: comparison.usecases.extra.map(uc => uc.name)
            });
        }
    }

    // =========================================================================
    // FIX BUG 3: STUDENT-ONLY ACTOR HIERARCHY DETECTION
    // Detect actor generalization hierarchy that exists ONLY in student diagram
    // =========================================================================
    const actorSpecResult = detectActorSpecialization(
        normalized.student,
        normalized.solution,
        studentGraph
    );
    patterns.push(...actorSpecResult.patterns);
    recommendations.push(...actorSpecResult.recommendations);
    equivalences.push(...actorSpecResult.equivalences);

    // Calculate structural metrics
    const solutionMetrics = solutionGraph.getMetrics();
    const studentMetrics = studentGraph.getMetrics();

    const result: GraphAnalysisResult = {
        patterns,
        structuralMetrics: {
            solution: solutionMetrics,
            student: studentMetrics
        },
        detectedEquivalences: equivalences,
        recommendations
    };

    logger.info({
        message: 'BƯỚC 5: Hoàn thành (ENHANCED)',
        event_type: 'step5_complete',
        patternsDetected: patterns.length,
        equivalencesFound: equivalences.length,
        recommendationsCount: recommendations.length,
        actorHierarchyPatterns: actorSpecResult.patterns.length
    });

    return result;
};

// ============================================================================
// STEP 6: ERROR CLASSIFICATION & SCORING (WITH GRAPH INPUT)
// ============================================================================

const step6_classifyErrorsAndScore = async (
    input: UmlInput,
    comparison: EnhancedComparisonResult,
    normalized: { solution: NormalizedDiagram; student: NormalizedDiagram },
    domainContext: DomainContext,
    graphAnalysis: GraphAnalysisResult
): Promise<{ errors: DetectedError[]; score: ReferenceScore }> => {
    logger.info({
        message: 'BƯỚC 6: Bắt đầu phân loại lỗi và chấm điểm (có Graph input)',
        event_type: 'step6_start',
        id: input.id
    });

    const prompt = await promptService.getPrompts({
        type: 'usecase-error-classifier-scorer',
        isActive: true,
        limit: 1
    });

    if (!prompt.prompts || prompt.prompts.length === 0) {
        throw new Error('Không tìm thấy prompt error classifier-scorer');
    }

    const classificationInput = {
        domainContext,
        comparison: {
            actors: {
                matched: comparison.actors.matched.length,
                missing: comparison.actors.missing.map(a => a.name),
                extra: comparison.actors.extra.map(a => a.name),
                missingActorsAnalysis: comparison.missingActorsAnalysis
            },
            usecases: {
                matched: comparison.usecases.matched.length,
                missing: comparison.usecases.missing.map(uc => uc.name),
                extra: comparison.usecases.extra.map(uc => uc.name)
            },
            relationships: comparison.relationships
        },
        studentDiagram: {
            actorCount: normalized.student.actors.length,
            usecaseCount: normalized.student.usecases.length
        },
        solutionDiagram: {
            actorCount: normalized.solution.actors.length,
            usecaseCount: normalized.solution.usecases.length
        },
        graphAnalysis: {
            patterns: graphAnalysis.patterns,
            recommendations: graphAnalysis.recommendations,
            equivalences: graphAnalysis.detectedEquivalences,
            metrics: graphAnalysis.structuralMetrics
        },
        scoringCriteria: {
            actors: { max: 20, description: "Nhận diện và phân loại Actor" },
            usecases: { max: 30, description: "Nhận diện và chất lượng Use Case" },
            relationships: { max: 40, description: "Độ chính xác của Relationships" },
            presentation: { max: 10, description: "Boundary và bố cục" }
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

    // Determine confidence
    const lowSimilarityCount = [
        ...comparison.actors.matched.filter(m => m.similarity < 0.85),
        ...comparison.usecases.matched.filter(m => m.similarity < 0.85)
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

    return {
        errors: result.errors,
        score: finalScore
    };
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
        type: 'usecase-feedback-generator',
        isActive: true,
        limit: 1
    });

    if (!prompt.prompts || prompt.prompts.length === 0) {
        throw new Error('Không tìm thấy prompt feedback generator');
    }

    const feedbackInput = {
        score: referenceScore,
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
        graphAnalysis: {
            patterns: graphAnalysis.patterns,
            positivePatterns: graphAnalysis.patterns.filter(p => p.severity === 'POSITIVE'),
            detectedEquivalences: graphAnalysis.detectedEquivalences
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
// HELPER: Convert internal metrics to serializable format
// ============================================================================

const serializeGraphMetrics = (metrics: GraphMetrics): Record<string, unknown> => {
    return {
        nodeCount: metrics.nodeCount,
        edgeCount: metrics.edgeCount,
        avgDegree: metrics.avgDegree,
        maxDepth: metrics.maxDepth,
        pathCount: metrics.pathCount,
        degreeCentrality: Object.fromEntries(metrics.degreeCentrality)
    };
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
            message: 'Bắt đầu pipeline 7 bước xử lý Use Case Diagram (FIXED VERSION)',
            event_type: 'pipeline_start',
            id: input.id,
            typeUmlName: input.typeUmlName
        });

        // BƯỚC 1: Validation & Preprocessing
        const domainContext = await step1_validateAndPreprocess(input);

        // BƯỚC 2: Extract to JSON
        const diagrams = await step2_extractToJson(input, domainContext);

        // BƯỚC 3: Semantic Normalization
        const normalized = await step3_semanticNormalization(input, diagrams, domainContext);

        // BƯỚC 4: Structure Comparison (Rule-based - FIXED)
        const comparison = step4_structureComparison(normalized);

        // BƯỚC 5: Graph Analysis (Rule-based - ENHANCED)
        const graphAnalysis = step5_graphAnalysis(normalized, comparison);

        // BƯỚC 6: Error Classification & Scoring (Hybrid AI - có Graph input)
        const { errors, score: referenceScore } = await step6_classifyErrorsAndScore(
            input,
            comparison,
            normalized,
            domainContext,
            graphAnalysis
        );

        // BƯỚC 7: Generate Feedback
        const feedback = await step7_generateFeedback(
            input,
            referenceScore,
            errors,
            comparison,
            graphAnalysis
        );

        const duration = Date.now() - startTime;

        // Identify items needing human review
        const humanReviewItems: string[] = [];

        // Low similarity matches
        comparison.actors.matched
            .filter(m => m.similarity < 0.85)
            .forEach(m => humanReviewItems.push(
                `Actor similarity thấp: "${m.student.name}" vs "${m.solution.name}" (${(m.similarity * 100).toFixed(0)}%)`
            ));

        comparison.usecases.matched
            .filter(m => m.similarity < 0.85)
            .forEach(m => humanReviewItems.push(
                `UseCase similarity thấp: "${m.student.name}" vs "${m.solution.name}" (${(m.similarity * 100).toFixed(0)}%)`
            ));

        // Add graph analysis recommendations for human review
        graphAnalysis.recommendations
            .filter(r => r.code === 'REQUIRE_HUMAN_REVIEW')
            .forEach(r => humanReviewItems.push(
                `Graph Analysis: ${r.reason} - ${r.affectedElements.join(', ')}`
            ));

        // Build result matching UmlProcessedResult interface
        const result: UmlProcessedResult = {
            referenceScore: {
                total: referenceScore.total,
                breakdown: {
                    actors: referenceScore.breakdown.actors,
                    usecases: referenceScore.breakdown.usecases,
                    relationships: referenceScore.breakdown.relationships,
                    presentation: referenceScore.breakdown.presentation
                },
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
                relationships: {
                    actorToUC: comparison.relationships.actorToUC,
                    include: comparison.relationships.include,
                    extend: comparison.relationships.extend,
                    generalization: comparison.relationships.generalization
                }
            },
            feedback: feedback,
            humanReviewItems: humanReviewItems,
            metadata: {
                processingTime: `${(duration / 1000).toFixed(1)}s`,
                aiCallsCount: 5,
                pipelineVersion: '2.1.0-usecase-fixed',
                timestamp: new Date().toISOString()
            }
        };

        logger.info({
            message: '✅ Pipeline xử lý Use Case Diagram hoàn thành thành công (FIXED VERSION)',
            event_type: 'pipeline_complete',
            id: input.id,
            durationMs: duration,
            durationSeconds: (duration / 1000).toFixed(2),
            score: referenceScore.total,
            confidence: referenceScore.confidence,
            errorsCount: errors.length,
            patternsDetected: graphAnalysis.patterns.length,
            humanReviewItemsCount: humanReviewItems.length
        });

        return result;

    } catch (error: unknown) {
        const duration = Date.now() - startTime;

        logger.error({
            message: '❌ Pipeline xử lý Use Case Diagram thất bại',
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
            throw new UmlProcessingError(`Use Case Diagram pipeline failed: ${getErrorMessage(error)}`);
        }
    }
};