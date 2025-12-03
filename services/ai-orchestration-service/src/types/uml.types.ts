// ============================================================================
// UML PROCESSING TYPES
// ============================================================================

import { ReversedRelationship } from "../services/plantuml-processor-services/use-case";

export interface UmlInput {
    id: number;
    typeUmlName: string;
    contentAssignment: string;
    solutionPlantUmlCode: string;
    studentPlantUmlCode: string;
}

// ============================================================================
// SCORE TYPES
// ============================================================================

export interface ScoreBreakdown {
    // Use Case Diagram: actors, usecases, relationships, presentation
    // Class Diagram: entities, attributes, relationships, businessLogic
    [key: string]: {
        score: number;
        max: number;
        details: string;
    };
}

export interface ReferenceScore {
    total: number;
    breakdown: ScoreBreakdown;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    suggestedRange: string;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface DetectedError {
    code: string;
    category?: 'STRUCTURAL' | 'RELATIONSHIP' | 'CONCEPTUAL' | 'QUALITY';
    severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
    penalty: number;
    explanation: string;
    elements: string[];
    suggestion?: string;
    businessImpact?: string;
}

// ============================================================================
// COMPARISON TYPES
// ============================================================================

export interface ComparisonSummary {
    // Use Case Diagram specific
    actors?: {
        matched: number;
        missing: number;
        extra: number;
    };
    usecases?: {
        matched: number;
        missing: number;
        extra: number;
    };

    // Class Diagram specific
    classes?: {
        matched: number;
        missing: number;
        extra: number;
    };
    attributes?: {
        matched: number;
        missing: number;
        extra: number;
        misplaced?: number;
        patterns?: number; // Number of decomposition/consolidation patterns detected
    };

    // Relationships - varies by diagram type
    relationships: {
        // Use Case Diagram relationships
        actorToUC?: {
            matched: number;
            missing: number;
            extra: number;
        };
        include?: {
            matched: number;
            missing: number;
            extra: number;
            reversed?: number | ReversedRelationship[]; // Direction errors
        };
        extend?: {
            matched: number;
            missing: number;
            extra: number;
            reversed?: number | ReversedRelationship[];
        };

        // Shared relationship type (both Use Case and Class)
        generalization?: {
            matched: number;
            missing: number;
            extra: number;
            reversed?: number | ReversedRelationship[];
        };

        // Class Diagram relationships
        associations?: {
            matched: number;
            missing: number;
            extra: number;
            wrongMultiplicity?: number; // Multiplicity errors
        };
        aggregations?: {
            matched: number;
            missing: number;
            confusedWithComposition?: number; // Type confusion
        };
        compositions?: {
            matched: number;
            missing: number;
            confusedWithAggregation?: number; // Type confusion
        };
    };
}

// ============================================================================
// GRAPH ANALYSIS TYPES
// ============================================================================

export interface GraphPatternSummary {
    type: string;
    severity: 'POSITIVE' | 'NEUTRAL' | 'MINOR' | 'MAJOR' | 'CRITICAL';
    confidence: number;
    elements: Record<string, unknown>;
    structuralEquivalence: boolean;
    designQuality?: {
        rating: 'EXCELLENT' | 'GOOD' | 'ACCEPTABLE' | 'POOR';
        reasoning: string;
    };
}

export interface GraphEquivalenceSummary {
    type: string;
    confidence: number;
    explanation: string;
    affectedClasses?: string[]; // For Class Diagram
}

export interface GraphMetricsSummary {
    // Common metrics
    nodeCount?: number;
    edgeCount?: number;
    avgDegree?: number;
    maxDepth?: number;

    // Use Case specific
    pathCount?: number;

    // Class Diagram specific
    classCount?: number;
    compositionChainDepth?: number;
    avgAttributeCohesion?: number;

    // Centrality (both)
    degreeCentrality?: Record<string, number>;
    betweennessCentrality?: Record<string, number>;
}

// Use Case Diagram Graph Analysis
export interface UseCaseGraphAnalysisSummary {
    patterns: GraphPatternSummary[];
    structuralMetrics: {
        solution: GraphMetricsSummary;
        student: GraphMetricsSummary;
    };
    detectedEquivalences: GraphEquivalenceSummary[];
}

// Class Diagram Graph Analysis
export interface ClassGraphAnalysisSummary {
    patterns: GraphPatternSummary[];
    structuralMetrics: {
        solution: GraphMetricsSummary;
        student: GraphMetricsSummary;
    };
    lifecycleAnalysis: {
        compositionChains: Array<{
            chain: string[];
            chainNames: string[];
            depth: number;
            isCascadeDelete: boolean;
        }>;
        violationsCount: number;
    };
    detectedEquivalences: GraphEquivalenceSummary[];
    recommendationsCount: number;
}

// Union type for graph analysis
export type GraphAnalysisSummary = UseCaseGraphAnalysisSummary | ClassGraphAnalysisSummary;

// ============================================================================
// METADATA TYPES
// ============================================================================

export interface ProcessingMetadata {
    processingTime: string;
    aiCallsCount: number;
    pipelineVersion: string;
    timestamp: string;
}

// ============================================================================
// MAIN RESULT TYPE
// ============================================================================

export interface UmlProcessedResult {
    referenceScore: ReferenceScore;
    errors: DetectedError[];
    comparison: ComparisonSummary;
    graphAnalysis?: GraphAnalysisSummary; // Optional - included when graph analysis is performed
    feedback: string;
    humanReviewItems: string[];
    metadata: ProcessingMetadata;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export const isUseCaseGraphAnalysis = (
    analysis: GraphAnalysisSummary
): analysis is UseCaseGraphAnalysisSummary => {
    return !('lifecycleAnalysis' in analysis);
};

export const isClassGraphAnalysis = (
    analysis: GraphAnalysisSummary
): analysis is ClassGraphAnalysisSummary => {
    return 'lifecycleAnalysis' in analysis;
};

export const isUseCaseComparison = (
    comparison: ComparisonSummary
): boolean => {
    return 'actors' in comparison && 'usecases' in comparison;
};

export const isClassComparison = (
    comparison: ComparisonSummary
): boolean => {
    return 'classes' in comparison && 'attributes' in comparison;
};