export interface IUMLKnowledgeBase {
    id: string;
    title: string;
    content: string;
    diagramType: 'class' | 'sequence' | 'usecase' | 'activity' | 'component' | 'deployment';
    tags: string[];
    source?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IUMLChunk {
    id: string;
    documentId: string;
    chunkIndex: number;
    chunkText: string;
    title: string;
    diagramType: string;
    tags: string[];
    source?: string;
    createdAt: string;
}

const generateId = (): string => {
    return `uml_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const createUMLDocument = (data: Partial<IUMLKnowledgeBase>): IUMLKnowledgeBase => {
    return {
        id: data.id || generateId(),
        title: data.title || '',
        content: data.content || '',
        diagramType: data.diagramType || 'class',
        tags: data.tags || [],
        source: data.source,
        createdAt: data.createdAt || new Date(),
        updatedAt: data.updatedAt || new Date()
    };
};

export const validateUMLDocument = (doc: IUMLKnowledgeBase): void => {
    if (!doc.title || doc.title.trim().length === 0) {
        throw new Error('Title is required');
    }
    if (!doc.content || doc.content.trim().length === 0) {
        throw new Error('Content is required');
    }
    const validTypes = ['class', 'sequence', 'usecase', 'activity', 'component', 'deployment'];
    if (!validTypes.includes(doc.diagramType)) {
        throw new Error(`Invalid diagram type. Must be one of: ${validTypes.join(', ')}`);
    }
};

export const toPayload = (doc: IUMLKnowledgeBase): Omit<IUMLChunk, 'id' | 'chunkIndex' | 'chunkText'> => {
    return {
        documentId: doc.id,
        title: doc.title,
        diagramType: doc.diagramType,
        tags: doc.tags,
        source: doc.source,
        createdAt: doc.createdAt.toISOString()
    };
};