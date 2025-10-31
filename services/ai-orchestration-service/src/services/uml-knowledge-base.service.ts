import { v4 as uuidv4 } from "uuid";
import {QdrantClient} from '@qdrant/js-client-rest';
import {IUMLChunk, IUMLKnowledgeBase, toPayload, validateUMLDocument} from '../models/qdrant/uml-knowledge-base.model';
import * as embeddingService from './uml-embedding.service';

export interface SearchFilter {
    diagramType?: string;
    tags?: string[];
}

export interface SearchResult {
    id: string;
    score: number;
    payload: IUMLChunk;
}

const COLLECTION_NAME = 'uml_knowledge_base';
const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 50;

let client: QdrantClient;

export const initService = (qdrantUrl: string, apiKey: string) => {
    client = new QdrantClient({ url: qdrantUrl, apiKey });
};

export const initCollection = async (): Promise<void> => {
    try {
        await client.getCollection(COLLECTION_NAME);
    } catch (error) {
        await client.createCollection(COLLECTION_NAME, {
            vectors: {
                size: embeddingService.getDimension(),
                distance: 'Cosine'
            }
        });
    }
};

const chunkText = (text: string): string[] => {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
        const end = Math.min(start + CHUNK_SIZE, text.length);
        chunks.push(text.slice(start, end));
        start += CHUNK_SIZE - CHUNK_OVERLAP;
    }

    return chunks;
};

export const indexDocument = async (umlDoc: IUMLKnowledgeBase): Promise<void> => {
    validateUMLDocument(umlDoc);

    const chunks = chunkText(umlDoc.content);
    const vectors = await embeddingService.encodeBatch(chunks);

    const points = chunks.map((chunk, index) => {
        const basePayload = toPayload(umlDoc);

        const chunkPayload: IUMLChunk = {
            id: uuidv4(),
            documentId: basePayload.documentId,
            chunkIndex: index,
            chunkText: chunk,
            title: basePayload.title,
            diagramType: basePayload.diagramType,
            tags: basePayload.tags,
            source: basePayload.source,
            createdAt: basePayload.createdAt
        };

        return {
            id: chunkPayload.id,
            vector: vectors[index],
            payload: chunkPayload as unknown as Record<string, unknown>
        };
    });

    await client.upsert(COLLECTION_NAME, {
        wait: true,
        points
    });
};

const buildFilter = (filters?: SearchFilter) => {
    if (!filters) return undefined;

    const must: any[] = [];

    if (filters.diagramType) {
        must.push({
            key: 'diagramType',
            match: { value: filters.diagramType }
        });
    }

    if (filters.tags && filters.tags.length > 0) {
        must.push({
            key: 'tags',
            match: { any: filters.tags }
        });
    }

    return must.length > 0 ? { must } : undefined;
};

export const search = async (query: string, limit: number = 5, filters?: SearchFilter): Promise<SearchResult[]> => {
    const queryVector = await embeddingService.encode(query);
    const filter = buildFilter(filters);

    const results = await client.search(COLLECTION_NAME, {
        vector: queryVector,
        limit,
        filter,
        with_payload: true
    });

    return results.map(result => ({
        id: result.id as string,
        score: result.score,
        payload: result.payload as unknown as IUMLChunk
    }));
};

export const documentExists = async (documentId: string): Promise<boolean> => {
    try {
        const results = await client.scroll(COLLECTION_NAME, {
            filter: {
                must: [
                    {
                        key: 'documentId',
                        match: { value: documentId }
                    }
                ]
            },
            limit: 1,
            with_payload: false
        });

        return results.points.length > 0;
    } catch (error) {
        return false;
    }
};

export const deleteDocument = async (documentId: string): Promise<void> => {
    await client.delete(COLLECTION_NAME, {
        filter: {
            must: [
                {
                    key: 'documentId',
                    match: { value: documentId }
                }
            ]
        }
    });
};

export const updateDocument = async (umlDoc: IUMLKnowledgeBase): Promise<void> => {
    validateUMLDocument(umlDoc);

    const exists = await documentExists(umlDoc.id);
    if (!exists) {
        throw new Error(`Document with id ${umlDoc.id} not found`);
    }

    const tempDoc = { ...umlDoc, id: `${umlDoc.id}_temp` };

    try {
        await indexDocument(tempDoc);
        await deleteDocument(umlDoc.id);
        await indexDocument(umlDoc);
        await deleteDocument(tempDoc.id);
    } catch (error) {
        try {
            await deleteDocument(tempDoc.id);
        } catch (cleanupError) {
            console.error('Failed to clean up temp document:', cleanupError);
        }

        throw new Error(`Failed to update document: ${(error as Error).message}`);
    }
};

export const updateDocumentSimple = async (umlDoc: IUMLKnowledgeBase): Promise<void> => {
    validateUMLDocument(umlDoc);

    const exists = await documentExists(umlDoc.id);
    if (!exists) {
        throw new Error(`Document with id ${umlDoc.id} not found`);
    }

    await deleteDocument(umlDoc.id);
    await indexDocument(umlDoc);
};

export const retrieve = async (query: string, topK: number = 3, filters?: SearchFilter): Promise<string> => {
    const results = await search(query, topK, filters);

    return results.map(r =>
        `[${r.payload.title} - ${r.payload.diagramType}]\n${r.payload.chunkText}`
    ).join('\n\n---\n\n');
};