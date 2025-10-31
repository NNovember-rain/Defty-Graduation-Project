import { get, postJsonData, patchJsonData, del, bulkDelete } from "./request";
import handleRequest from "./handleRequest";

const PREFIX_AI_ORCHESTRATION: string = import.meta.env.VITE_PREFIX_AI_ORCHESTRATION as string;
const PREFIX_UML_KNOWLEDGE: string = 'uml-knowledge-base';

export interface IUMLKnowledgeBase {
    id?: string | number;
    title: string;
    content: string;
    diagramType: 'class' | 'sequence' | 'usecase' | 'activity' | 'component' | 'deployment';
    tags: string[];
    source?: string;
    createdAt?: string;
    updatedAt?: string;
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

export interface SearchFilter {
    diagramType?: string;
    tags?: string[];
}

export interface SearchResult {
    id: string;
    score: number;
    payload: IUMLChunk;
}

export interface GetDocumentsOptions {
    page?: number;
    limit?: number;
    title?: string;
    diagramType?: string;
    tags?: string[];
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface GetDocumentsResult {
    documents: IUMLKnowledgeBase[];
    total: number;
    page: number;
    limit: number;
}

export interface SearchDocumentsPayload {
    query: string;
    limit?: number;
    filters?: SearchFilter;
}

export interface SearchDocumentsResponse {
    success: boolean;
    data: SearchResult[];
    meta?: {
        query: string;
        limit: number;
        count: number;
    };
}

export interface RetrieveContextPayload {
    query: string;
    topK?: number;
    filters?: SearchFilter;
}

export interface RetrieveContextResponse {
    success: boolean;
    data: {
        context: string;
        query: string;
        sources: number;
    };
}

export const createDocument = async (
    data: Omit<IUMLKnowledgeBase, 'id' | 'createdAt' | 'updatedAt'>
): Promise<IUMLKnowledgeBase> => {
    const response = await handleRequest(
        postJsonData(`${PREFIX_AI_ORCHESTRATION}/${PREFIX_UML_KNOWLEDGE}/documents`, data)
    );
    const result = await response.json();
    return result.data as IUMLKnowledgeBase;
};

export const getDocumentById = async (id: string | number): Promise<IUMLKnowledgeBase> => {
    const response = await handleRequest(
        get(`${PREFIX_AI_ORCHESTRATION}/${PREFIX_UML_KNOWLEDGE}/documents/${id}`)
    );
    const data = await response.json();
    return data.data as IUMLKnowledgeBase;
};

export const updateDocument = async (
    id: string | number,
    data: Partial<Omit<IUMLKnowledgeBase, '_id' | 'createdAt' | 'updatedAt'>>
): Promise<IUMLKnowledgeBase> => {
    const response = await handleRequest(
        patchJsonData(`${PREFIX_AI_ORCHESTRATION}/${PREFIX_UML_KNOWLEDGE}/documents/${id}`, data)
    );
    const updatedData = await response.json();
    return updatedData.data as IUMLKnowledgeBase;
};

export const deleteDocument = async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await handleRequest(
        del(`${PREFIX_AI_ORCHESTRATION}/${PREFIX_UML_KNOWLEDGE}/documents/${id}`)
    );
    return await response.json();
};

export const deleteDocumentsByIds = async (ids: string[]): Promise<void> => {
    await handleRequest(
        bulkDelete(`${PREFIX_AI_ORCHESTRATION}/${PREFIX_UML_KNOWLEDGE}/documents/bulk`, ids)
    );
};

export const searchDocuments = async (
    payload: SearchDocumentsPayload
): Promise<SearchDocumentsResponse> => {
    const response = await handleRequest(
        postJsonData(`${PREFIX_AI_ORCHESTRATION}/${PREFIX_UML_KNOWLEDGE}/search`, payload)
    );
    return await response.json() as SearchDocumentsResponse;
};

export const retrieveContext = async (
    payload: RetrieveContextPayload
): Promise<RetrieveContextResponse> => {
    const response = await handleRequest(
        postJsonData(`${PREFIX_AI_ORCHESTRATION}/${PREFIX_UML_KNOWLEDGE}/retrieve`, payload)
    );
    return await response.json() as RetrieveContextResponse;
};

export const searchDocumentsByDiagramType = async (
    query: string,
    diagramType: IUMLKnowledgeBase['diagramType'],
    limit: number = 5
): Promise<SearchDocumentsResponse> => {
    return await searchDocuments({
        query,
        limit,
        filters: { diagramType }
    });
};

export const searchDocumentsByTags = async (
    query: string,
    tags: string[],
    limit: number = 5
): Promise<SearchDocumentsResponse> => {
    return await searchDocuments({
        query,
        limit,
        filters: { tags }
    });
};

export const getContextForRAG = async (
    query: string,
    diagramType?: IUMLKnowledgeBase['diagramType'],
    topK: number = 3
): Promise<string> => {
    const filters = diagramType ? { diagramType } : undefined;

    const response = await retrieveContext({
        query,
        topK,
        filters
    });

    return response.data.context;
};