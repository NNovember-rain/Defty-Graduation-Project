export interface UmlInput {
    id: number;
    typeUmlName: string;
    contentAssignment: string;
    solutionPlantUmlCode: string;
    studentPlantUmlCode: string;
}

export interface ScoreBreakdown {
    // Use Case: actors, usecases, relationships, presentation
    // Class: entities, attributes, relationships, businessLogic
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

export interface DetectedError {
    code: string;
    category?: 'STRUCTURAL' | 'RELATIONSHIP' | 'CONCEPTUAL' | 'QUALITY'; // For Class Diagram
    severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
    penalty: number;
    explanation: string;
    elements: string[];
    suggestion?: string;
    businessImpact?: string; // For Class Diagram
}

export interface ComparisonSummary {
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
    classes?: {
        matched: number;
        missing: number;
        extra: number;
    };
    attributes?: {
        matched: number;
        missing: number;
        extra: number;
        misplaced?: number; // For Class Diagram
    };
    relationships: {
        actorToUC?: {
            matched: number;
            missing: number;
            extra: number;
        };
        include?: {
            matched: number;
            missing: number;
            extra: number;
        };
        extend?: {
            matched: number;
            missing: number;
            extra: number;
        };
        generalization?: {
            matched: number;
            missing: number;
            extra: number;
        };
        associations?: {
            matched: number;
            missing: number;
            extra: number;
        };
        aggregations?: {
            matched: number;
            missing: number;
        };
        compositions?: {
            matched: number;
            missing: number;
        };
    };
}

export interface ProcessingMetadata {
    processingTime: string;
    aiCallsCount: number;
    pipelineVersion: string;
    timestamp: string;
}

export interface UmlProcessedResult {
    referenceScore: ReferenceScore;
    errors: DetectedError[];
    comparison: ComparisonSummary;
    feedback: string;
    humanReviewItems: string[];
    metadata: ProcessingMetadata;
}