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

// Graph Analysis Types
interface GraphNode {
    id: string;
    name: string;
    canonical?: string;
    attributes: Attribute[];
}

interface GraphEdge {
    from: string;
    to: string;
    type: 'association' | 'aggregation' | 'composition' | 'generalization';
}

interface GraphMetrics {
    classCount: number;
    avgDegree: number;
    maxDepth: number;
    degreeCentrality: Map<string, number>;
    betweennessCentrality: Map<string, number>;
    compositionChainDepth: number;
    attributeCohesion: number;
}

interface CompositionChain {
    chain: string[];
    depth: number;
    cascadeDelete: boolean;
}

interface LifecycleViolation {
    type: 'COMPOSITION_TO_AGGREGATION' | 'AGGREGATION_TO_COMPOSITION' | 'BROKEN_CASCADE';
    from: string;
    to: string;
    expected: string;
    actual: string;
    businessImpact: string;
}

interface GraphPattern {
    type: 'CLASS_DECOMPOSITION'
        | 'CLASS_CONSOLIDATION'
        | 'MISSING_CENTRAL_CLASS'
        | 'COMPOSITION_LIFECYCLE_VIOLATION'
        | 'ATTRIBUTE_MISPLACEMENT_WITH_RELATIONSHIP'
        | 'GENERALIZATION_CONSOLIDATION'
        | 'OVER_NORMALIZATION'
        | 'BIDIRECTIONAL_RELATIONSHIP_MISSING'
        | 'DESIGN_PATTERN_APPLIED';
    severity: 'POSITIVE' | 'NEUTRAL' | 'MINOR' | 'MAJOR' | 'CRITICAL';
    confidence: number;
    elements: {
        sourceClass?: string;
        decomposedInto?: string[];
        attributeMigration?: Array<{ attr: string; from: string; to: string }>;
        compositionChain?: string[];
        missingClass?: string;
        isolatedClasses?: string[];
        [key: string]: any;
    };
    structuralEquivalence: boolean;
    designQuality?: {
        rating: 'EXCELLENT' | 'GOOD' | 'ACCEPTABLE' | 'POOR';
        reasoning: string;
        cohesionImprovement?: string;
    };
}

interface GraphEquivalence {
    type: 'structural_decomposition' | 'structural_consolidation' | 'isomorphic' | 'refactored';
    confidence: number;
    explanation: string;
}

interface GraphRecommendation {
    code: 'IGNORE_EXTRA_CLASSES' | 'IGNORE_MISSING_CLASS' | 'REDUCE_PENALTY'
        | 'INCREASE_PENALTY' | 'ADD_BONUS' | 'REQUIRE_HUMAN_REVIEW';
    reason: string;
    affectedElements: string[];
    penaltyAdjustment?: number;
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
// STEP 1: VALIDATION & DOMAIN ANALYSIS
// ============================================================================

const step1_validateAndPreprocess = async (input: UmlInput): Promise<DomainContext> => {
    logger.info({
        message: 'BƯỚC 1: Bắt đầu validation và domain analysis',
        event_type: 'step1_start',
        id: input.id
    });

    if (!input.typeUmlName || !input.contentAssignment ||
        !input.solutionPlantUmlCode || !input.studentPlantUmlCode) {
        throw new UmlProcessingError('Thiếu trường bắt buộc trong input');
    }

    if (input.typeUmlName.toLowerCase() !== 'class') {
        throw new UmlProcessingError('Chỉ hỗ trợ class diagram trong pipeline này');
    }

    const validatePlantUml = (code: string, label: string) => {
        if (!code.includes('@startuml') || !code.includes('@enduml')) {
            throw new UmlProcessingError(`${label}: Thiếu PlantUML tags`);
        }
        if (!code.includes('class')) {
            throw new UmlProcessingError(`${label}: Không tìm thấy class definitions`);
        }
    };

    validatePlantUml(input.solutionPlantUmlCode, 'Solution');
    validatePlantUml(input.studentPlantUmlCode, 'Student');

    const prompt = await promptService.getPrompts({
        type: 'class-analysis-domain-extractor',
        isActive: true,
        limit: 1
    });

    if (!prompt.prompts || prompt.prompts.length === 0) {
        throw new Error('Không tìm thấy prompt class domain extractor');
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
        mandatoryEntitiesCount: domainContext.mandatoryEntities.length
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
        throw new Error('Không tìm thấy prompt class PlantUML extractor');
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
        solution: { classes: result.solution.classes.length },
        student: { classes: result.student.classes.length }
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
        throw new Error('Không tìm thấy prompt class semantic normalizer');
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
        message: 'BƯỚC 3: Hoàn thành',
        event_type: 'step3_complete',
        id: input.id
    });

    return result;
};

// ============================================================================
// STEP 4: STRUCTURE COMPARISON
// ============================================================================

const step4_structureComparison = (
    normalized: { solution: NormalizedDiagram; student: NormalizedDiagram }
): ComparisonResult => {
    logger.info({
        message: 'BƯỚC 4: Bắt đầu so sánh cấu trúc',
        event_type: 'step4_start'
    });

    const { solution, student } = normalized;

    // Compare Classes
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

    // Compare Attributes
    const matchedAttributes: AttributeComparison['matched'] = [];
    const missingAttributes: AttributeComparison['missing'] = [];
    const extraAttributes: AttributeComparison['extra'] = [];
    const misplacedAttributes: AttributeComparison['misplaced'] = [];

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

        for (const stuAttr of stuAttrMap.values()) {
            extraAttributes.push({
                className: stuClass.name,
                attribute: stuAttr
            });
        }
    }

    // Detect misplaced attributes
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

    // Compare Operations
    let matchedOperations = 0;
    let missingOperations = 0;

    for (const match of matchedClasses) {
        const solOps = match.solution.operations || [];
        const stuOps = match.student.operations || [];

        matchedOperations += Math.min(solOps.length, stuOps.length);
        missingOperations += Math.max(0, solOps.length - stuOps.length);
    }

    // Compare Relationships
    const getCanonical = (className: string, diagram: NormalizedDiagram): string => {
        const cls = diagram.classes.find(c => c.id === className || c.name === className);
        return cls?.normalized.canonical.toLowerCase() || className.toLowerCase();
    };

    const compareRelArray = <T extends any>(
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

        return { matched, missing: solSet.size - matched, extra: stuSet.size - matched };
    };

    // Associations
    const associationsResult = compareRelArray(
        solution.relationships.associations,
        student.relationships.associations,
        r => `${getCanonical(r.from, solution)}-${getCanonical(r.to, solution)}`
    );

    const wrongMultiplicity: RelationshipComparison['associations']['wrongMultiplicity'] = [];
    // (Implementation similar to original)

    // Aggregations
    const aggregationsBasic = compareRelArray(
        solution.relationships.aggregations,
        student.relationships.aggregations,
        r => `${getCanonical(r.whole, solution)}-${getCanonical(r.part, solution)}`
    );

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
    const compositionsBasic = compareRelArray(
        solution.relationships.compositions,
        student.relationships.compositions,
        r => `${getCanonical(r.composite, solution)}-${getCanonical(r.component, solution)}`
    );

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
    const generalizationsResult = compareRelArray(
        solution.relationships.generalizations,
        student.relationships.generalizations,
        r => `${getCanonical(r.parent, solution)}-${getCanonical(r.child, solution)}`
    );

    const result: ComparisonResult = {
        classes: { matched: matchedClasses, missing: missingClasses, extra: extraClasses },
        attributes: { matched: matchedAttributes, missing: missingAttributes, extra: extraAttributes, misplaced: misplacedAttributes },
        operations: { matched: matchedOperations, missing: missingOperations },
        relationships: {
            associations: { ...associationsResult, wrongMultiplicity },
            aggregations: { ...aggregationsBasic, confusedWithComposition: confusedAggWithComp },
            compositions: { ...compositionsBasic, confusedWithAggregation: confusedCompWithAgg },
            generalizations: generalizationsResult
        }
    };

    logger.info({
        message: 'BƯỚC 4: Hoàn thành',
        event_type: 'step4_complete',
        classes: { matched: matchedClasses.length, missing: missingClasses.length, extra: extraClasses.length }
    });

    return result;
};

// ============================================================================
// STEP 5: GRAPH ANALYSIS
// ============================================================================

class ClassGraphAnalyzer {
    private nodes: Map<string, GraphNode> = new Map();
    private edges: GraphEdge[] = [];
    private adjacencyList: Map<string, Set<string>> = new Map();

    constructor(diagram: NormalizedDiagram) {
        this.buildGraph(diagram);
    }

    private buildGraph(diagram: NormalizedDiagram) {
        // Add class nodes
        for (const cls of diagram.classes) {
            this.nodes.set(cls.id, {
                id: cls.id,
                name: cls.name,
                canonical: cls.normalized.canonical,
                attributes: cls.attributes
            });
            this.adjacencyList.set(cls.id, new Set());
        }

        // Add edges
        for (const assoc of diagram.relationships.associations) {
            this.addEdge(assoc.from, assoc.to, 'association');
        }

        for (const agg of diagram.relationships.aggregations) {
            this.addEdge(agg.whole, agg.part, 'aggregation');
        }

        for (const comp of diagram.relationships.compositions) {
            this.addEdge(comp.composite, comp.component, 'composition');
        }

        for (const gen of diagram.relationships.generalizations) {
            this.addEdge(gen.parent, gen.child, 'generalization');
        }
    }

    private addEdge(from: string, to: string, type: GraphEdge['type']) {
        this.edges.push({ from, to, type });
        this.adjacencyList.get(from)?.add(to);
        // Bidirectional for some types
        if (type === 'association') {
            this.adjacencyList.get(to)?.add(from);
        }
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

    public getBetweennessCentrality(): Map<string, number> {
        const centrality = new Map<string, number>();
        const nodeIds = Array.from(this.nodes.keys());

        for (const nodeId of nodeIds) {
            centrality.set(nodeId, 0);
        }

        // Simplified betweenness calculation
        for (const source of nodeIds) {
            for (const target of nodeIds) {
                if (source === target) continue;

                const paths = this.findAllPaths(source, target);
                if (paths.length === 0) continue;

                for (const path of paths) {
                    for (let i = 1; i < path.length - 1; i++) {
                        const current = centrality.get(path[i]) || 0;
                        centrality.set(path[i], current + 1 / paths.length);
                    }
                }
            }
        }

        return centrality;
    }

    private findAllPaths(from: string, to: string, maxDepth: number = 5): string[][] {
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

        for (const edge of compositionEdges) {
            const chain = this.buildCompositionChain(edge.from, [edge.from]);
            if (chain.length > 1) {
                chains.push({
                    chain,
                    depth: chain.length - 1,
                    cascadeDelete: true
                });
            }
        }

        return chains;
    }

    private buildCompositionChain(nodeId: string, visited: string[]): string[] {
        const compositionChildren = this.edges
            .filter(e => e.type === 'composition' && e.from === nodeId && !visited.includes(e.to))
            .map(e => e.to);

        if (compositionChildren.length === 0) {
            return visited;
        }

        let longestChain = visited;
        for (const child of compositionChildren) {
            const chain = this.buildCompositionChain(child, [...visited, child]);
            if (chain.length > longestChain.length) {
                longestChain = chain;
            }
        }

        return longestChain;
    }

    public calculateAttributeCohesion(classId: string): number {
        const node = this.nodes.get(classId);
        if (!node || node.attributes.length === 0) return 0;

        // Simplified cohesion: attributes count vs max expected
        const attrCount = node.attributes.length;
        const idealCount = 5; // Threshold

        if (attrCount <= idealCount) return 1.0;
        return idealCount / attrCount;
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
        const avgCohesion = this.nodes.size > 0 ? totalCohesion / this.nodes.size : 0;

        return {
            classCount: this.nodes.size,
            avgDegree: degrees.length > 0 ? degrees.reduce((a, b) => a + b, 0) / degrees.length : 0,
            maxDepth: maxChainDepth,
            degreeCentrality,
            betweennessCentrality,
            compositionChainDepth: maxChainDepth,
            attributeCohesion: avgCohesion
        };
    }

    public getNode(id: string): GraphNode | undefined {
        return this.nodes.get(id);
    }

    public hasEdge(from: string, to: string): boolean {
        return this.edges.some(e => e.from === from && e.to === to);
    }

    public getEdgeType(from: string, to: string): GraphEdge['type'] | null {
        const edge = this.edges.find(e => e.from === from && e.to === to);
        return edge?.type || null;
    }
}

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

    // PATTERN 1: CLASS_DECOMPOSITION
    if (comparison.classes.extra.length > 0) {
        // Detect if extra classes are result of decomposition
        for (const extraClass of comparison.classes.extra) {
            const compositionParents = normalized.student.relationships.compositions
                .filter(c => c.component === extraClass.id);

            if (compositionParents.length > 0) {
                // Check if attributes migrated
                const migrations: Array<{ attr: string; from: string; to: string }> = [];

                for (const missing of comparison.attributes.missing) {
                    const found = extraClass.attributesNormalized.find(
                        a => a.normalized.canonical.toLowerCase() ===
                            missing.attribute.normalized.canonical.toLowerCase()
                    );

                    if (found) {
                        migrations.push({
                            attr: found.name,
                            from: missing.className,
                            to: extraClass.name
                        });
                    }
                }

                if (migrations.length > 0) {
                    const cohesion = studentGraph.calculateAttributeCohesion(extraClass.id);

                    patterns.push({
                        type: 'CLASS_DECOMPOSITION',
                        severity: cohesion > 0.7 ? 'POSITIVE' : 'NEUTRAL',
                        confidence: 0.9,
                        elements: {
                            decomposedInto: [extraClass.name],
                            attributeMigration: migrations
                        },
                        structuralEquivalence: true,
                        designQuality: {
                            rating: cohesion > 0.8 ? 'EXCELLENT' : 'GOOD',
                            reasoning: `Áp dụng SRP, tách ${migrations.length} attributes`,
                            cohesionImprovement: `improved to ${cohesion.toFixed(2)}`
                        }
                    });

                    recommendations.push({
                        code: 'IGNORE_EXTRA_CLASSES',
                        reason: 'Class decomposition hợp lý với cohesion tốt',
                        affectedElements: [extraClass.name],
                        penaltyAdjustment: 0
                    });

                    equivalences.push({
                        type: 'structural_decomposition',
                        confidence: 0.9,
                        explanation: `${extraClass.name} là decomposition với ${migrations.length} attributes migrated`
                    });
                }
            }
        }
    }

    // PATTERN 2: MISSING_CENTRAL_CLASS
    const solutionMetrics = solutionGraph.getMetrics();
    const studentMetrics = studentGraph.getMetrics();

    for (const missingClass of comparison.classes.missing) {
        const betweenness = solutionMetrics.betweennessCentrality.get(missingClass.id) || 0;
        const degree = solutionMetrics.degreeCentrality.get(missingClass.id) || 0;

        if (betweenness > 0.5 || degree >= 3) {
            patterns.push({
                type: 'MISSING_CENTRAL_CLASS',
                severity: 'CRITICAL',
                confidence: 0.95,
                elements: {
                    missingClass: missingClass.name,
                    degree: degree,
                    betweenness: betweenness
                },
                structuralEquivalence: false,
                designQuality: {
                    rating: 'POOR',
                    reasoning: `Thiếu class trung tâm với degree=${degree}, betweenness=${betweenness.toFixed(2)}`
                }
            });

            recommendations.push({
                code: 'INCREASE_PENALTY',
                reason: 'Missing central/hub class - core entity',
                affectedElements: [missingClass.name],
                penaltyAdjustment: -5
            });
        }
    }

    // PATTERN 3: COMPOSITION_LIFECYCLE_VIOLATION
    for (const solComp of normalized.solution.relationships.compositions) {
        const compositeCanonical = solutionGraph.getNode(solComp.composite)?.canonical?.toLowerCase();
        const componentCanonical = solutionGraph.getNode(solComp.component)?.canonical?.toLowerCase();

        if (!compositeCanonical || !componentCanonical) continue;

        // Find in student
        const stuComposite = normalized.student.classes.find(
            c => c.normalized.canonical.toLowerCase() === compositeCanonical
        );
        const stuComponent = normalized.student.classes.find(
            c => c.normalized.canonical.toLowerCase() === componentCanonical
        );

        if (!stuComposite || !stuComponent) continue;

        // Check if relationship exists and type
        const edgeType = studentGraph.getEdgeType(stuComposite.id, stuComponent.id);

        if (edgeType === 'aggregation') {
            violations.push({
                type: 'COMPOSITION_TO_AGGREGATION',
                from: stuComposite.name,
                to: stuComponent.name,
                expected: 'composition',
                actual: 'aggregation',
                businessImpact: `${stuComponent.name} không nên tồn tại độc lập khi ${stuComposite.name} bị xóa`
            });

            patterns.push({
                type: 'COMPOSITION_LIFECYCLE_VIOLATION',
                severity: 'MAJOR',
                confidence: 1.0,
                elements: {
                    from: stuComposite.name,
                    to: stuComponent.name
                },
                structuralEquivalence: false,
                designQuality: {
                    rating: 'POOR',
                    reasoning: 'Vi phạm lifecycle dependency - cascade delete logic sai'
                }
            });

            recommendations.push({
                code: 'INCREASE_PENALTY',
                reason: 'Composition downgraded to Aggregation - lifecycle violation',
                affectedElements: [stuComposite.name, stuComponent.name],
                penaltyAdjustment: -8
            });
        }
    }

    // PATTERN 4: ATTRIBUTE_MISPLACEMENT_WITH_RELATIONSHIP
    for (const misplaced of comparison.attributes.misplaced) {
        // Find classes
        const shouldBeInClass = normalized.solution.classes.find(c => c.name === misplaced.shouldBeIn);
        const inClass = normalized.student.classes.find(c => c.name === misplaced.inClass);

        if (shouldBeInClass && inClass) {
            // Check if they have relationship
            const hasRelationship = studentGraph.hasEdge(shouldBeInClass.id, inClass.id) ||
                studentGraph.hasEdge(inClass.id, shouldBeInClass.id);

            if (hasRelationship) {
                patterns.push({
                    type: 'ATTRIBUTE_MISPLACEMENT_WITH_RELATIONSHIP',
                    severity: 'MINOR',
                    confidence: 0.85,
                    elements: {
                        attribute: misplaced.attrName,
                        from: misplaced.shouldBeIn,
                        to: misplaced.inClass
                    },
                    structuralEquivalence: false,
                    designQuality: {
                        rating: 'ACCEPTABLE',
                        reasoning: 'Attribute misplaced nhưng vẫn trong context có relationship'
                    }
                });

                recommendations.push({
                    code: 'REDUCE_PENALTY',
                    reason: 'Misplaced attribute có relationship - không phải random error',
                    affectedElements: [misplaced.attrName],
                    penaltyAdjustment: 3 // Giảm penalty từ -8 xuống -5
                });
            }
        }
    }

    // PATTERN 5: OVER_NORMALIZATION
    const complexityRatio = studentMetrics.classCount / Math.max(solutionMetrics.classCount, 1);

    if (complexityRatio > 2.5 && studentMetrics.avgDegree < 1.5) {
        patterns.push({
            type: 'OVER_NORMALIZATION',
            severity: 'MINOR',
            confidence: 0.8,
            elements: {
                complexityRatio: complexityRatio.toFixed(2),
                studentClasses: studentMetrics.classCount,
                solutionClasses: solutionMetrics.classCount
            },
            structuralEquivalence: false,
            designQuality: {
                rating: 'POOR',
                reasoning: `Over-engineering: ${complexityRatio.toFixed(1)}x classes, low connectivity`
            }
        });

        recommendations.push({
            code: 'REDUCE_PENALTY',
            reason: 'Over-normalization detected - complexity without benefit',
            affectedElements: [],
            penaltyAdjustment: -3
        });
    }

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
        violations: violations.length,
        recommendationsCount: recommendations.length
    });

    return result;
};

// ============================================================================
// STEP 6: ERROR CLASSIFICATION & SCORING (WITH GRAPH)
// ============================================================================

const step6_classifyErrorsAndScore = async (
    input: UmlInput,
    comparison: ComparisonResult,
    normalized: { solution: NormalizedDiagram; student: NormalizedDiagram },
    domainContext: DomainContext,
    graphAnalysis: GraphAnalysisResult
): Promise<{ errors: DetectedError[]; score: ReferenceScore }> => {
    logger.info({
        message: 'BƯỚC 6: Bắt đầu phân loại lỗi và chấm điểm (có Graph)',
        event_type: 'step6_start',
        id: input.id
    });

    const prompt = await promptService.getPrompts({
        type: 'class-analysis-error-classifier-scorer',
        isActive: true,
        limit: 1
    });

    if (!prompt.prompts || prompt.prompts.length === 0) {
        throw new Error('Không tìm thấy prompt class error classifier-scorer');
    }

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
        graphAnalysis: {
            patterns: graphAnalysis.patterns,
            recommendations: graphAnalysis.recommendations,
            equivalences: graphAnalysis.detectedEquivalences,
            metrics: graphAnalysis.structuralMetrics,
            lifecycleViolations: graphAnalysis.lifecycleAnalysis.violations
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
        suggestedRange,
        graphAdjustments: result.score.graphAdjustments
    };

    logger.info({
        message: 'BƯỚC 6: Hoàn thành',
        event_type: 'step6_complete',
        id: input.id,
        errorsDetected: result.errors.length,
        score: finalScore.total,
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
        throw new Error('Không tìm thấy prompt class feedback generator');
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
// MAIN ORCHESTRATOR
// ============================================================================

export const processClassDiagramWithGraphAnalysis = async (
    input: UmlInput
): Promise<UmlProcessedResult> => {
    const startTime = Date.now();

    try {
        logger.info({
            message: '🚀 Bắt đầu pipeline 7 bước Class Diagram (có Graph Analysis)',
            event_type: 'pipeline_start',
            id: input.id
        });

        const domainContext = await step1_validateAndPreprocess(input);
        const diagrams = await step2_extractToJson(input, domainContext);
        const normalized = await step3_semanticNormalization(input, diagrams);
        const comparison = step4_structureComparison(normalized);
        const graphAnalysis = step5_graphAnalysis(normalized, comparison);
        const { errors, score: referenceScore } = await step6_classifyErrorsAndScore(
            input, comparison, normalized, domainContext, graphAnalysis
        );
        const feedback = await step7_generateFeedback(
            input, referenceScore, errors, comparison, graphAnalysis
        );

        const duration = Date.now() - startTime;

        const humanReviewItems: string[] = [];

        comparison.classes.matched
            .filter(m => m.similarity < 0.85)
            .forEach(m => humanReviewItems.push(
                `Class similarity thấp: "${m.student.name}" vs "${m.solution.name}" (${(m.similarity * 100).toFixed(0)}%)`
            ));

        graphAnalysis.recommendations
            .filter(r => r.code === 'REQUIRE_HUMAN_REVIEW')
            .forEach(r => humanReviewItems.push(
                `Graph Analysis: ${r.reason} - ${r.affectedElements.join(', ')}`
            ));

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
            graphAnalysis: {
                patterns: graphAnalysis.patterns,
                structuralMetrics: graphAnalysis.structuralMetrics,
                lifecycleAnalysis: graphAnalysis.lifecycleAnalysis,
                detectedEquivalences: graphAnalysis.detectedEquivalences
            },
            feedback: feedback,
            humanReviewItems: humanReviewItems,
            metadata: {
                processingTime: `${(duration / 1000).toFixed(1)}s`,
                aiCallsCount: 5,
                pipelineVersion: '2.0.0-class-with-graph',
                timestamp: new Date().toISOString()
            }
        };

        logger.info({
            message: '✅ Pipeline Class Diagram hoàn thành thành công',
            event_type: 'pipeline_complete',
            id: input.id,
            durationMs: duration,
            score: referenceScore.total,
            patternsDetected: graphAnalysis.patterns.length
        });

        return result;

    } catch (error: unknown) {
        const duration = Date.now() - startTime;

        logger.error({
            message: '❌ Pipeline Class Diagram thất bại',
            event_type: 'pipeline_error',
            id: input.id,
            error_message: getErrorMessage(error),
            durationMs: duration
        });

        if (error instanceof AIValidationError || error instanceof UmlProcessingError) {
            throw error;
        } else {
            throw new UmlProcessingError(`Class Diagram pipeline failed: ${getErrorMessage(error)}`);
        }
    }
};