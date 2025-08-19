import { v4 as uuidv4 } from 'uuid';
import * as embeddingService from './bge-m3-embeded.service';
import * as qdrantRepo from '../repositories/qdrant.repository';

// Types
export interface RAGDocument {
    content: string;
    diagramType?: string;
    source?: string;
    metadata?: Record<string, any>;
}

export interface RAGSearchOptions {
    limit?: number;
    diagramType?: string;
    threshold?: number;
    source?: string;
}

export interface RAGSearchResult {
    documents: qdrantRepo.SearchResult[];
    context: string;
    totalResults: number;
    query: string;
}

export interface DocumentStats {
    totalDocuments: number;
    byDiagramType: Record<string, number>;
    bySources: Record<string, number>;
}

// PlantUML keywords for extraction
const PLANTUML_KEYWORDS = [
    'class', 'interface', 'abstract', 'enum', 'annotation',
    'participant', 'actor', 'boundary', 'control', 'entity', 'database',
    'component', 'package', 'node', 'artifact', 'cloud', 'folder',
    'state', 'start', 'end', 'fork', 'join',
    'usecase', 'rectangle', 'note', 'title', 'legend',
    'extends', 'implements', 'composition', 'aggregation'
];

/**
 * Khởi tạo dịch vụ RAG.
 */
export async function initRAGService(): Promise<void> {
    await qdrantRepo.initQdrant();
    await embeddingService.initEmbeddingModel();
    console.log('✅ RAG Service initialized');
}

/**
 * Thêm một tài liệu duy nhất vào cơ sở tri thức.
 */
export async function addDocument(document: RAGDocument): Promise<string> {
    const documents = await addDocuments([document]);
    return documents[0];
}

/**
 * Thêm nhiều tài liệu vào cơ sở tri thức.
 */
export async function addDocuments(documents: RAGDocument[]): Promise<string[]> {
    try {
        const processedDocs: qdrantRepo.UpsertDocument[] = [];
        const documentIds: string[] = [];

        for (const doc of documents) {
            // Tạo ID duy nhất
            const id = uuidv4();
            documentIds.push(id);

            // Tiền xử lý nội dung PlantUML
            const processedContent = embeddingService.preprocessPlantUML(doc.content);

            // Tạo embedding
            const vector = await embeddingService.generateEmbedding(processedContent);

            // Trích xuất metadata
            const diagramType = doc.diagramType || detectDiagramType(doc.content);
            const keywords = extractPlantUMLKeywords(doc.content);

            processedDocs.push({
                id,
                vector,
                payload: {
                    content: doc.content,
                    diagramType,
                    keywords,
                    source: doc.source || 'unknown',
                    metadata: {
                        ...doc.metadata,
                        processedContent,
                        addedAt: new Date().toISOString()
                    }
                }
            });
        }

        // Lưu trữ vào Qdrant
        await qdrantRepo.upsertDocuments(processedDocs);

        console.log(`✅ Added ${documents.length} documents to RAG knowledge base`);
        return documentIds;

    } catch (error) {
        console.error('❌ Failed to add documents to RAG:', error);
        throw error;
    }
}

/**
 * Tìm kiếm ngữ cảnh liên quan.
 */
export async function searchContext(
    query: string,
    options: RAGSearchOptions = {}
): Promise<RAGSearchResult> {
    try {
        const {
            limit = 5,
            diagramType,
            threshold = 0.7,
            source
        } = options;

        // Tạo embedding truy vấn
        const queryVector = await embeddingService.generateEmbedding(query);

        // Xây dựng bộ lọc
        let filter: Record<string, any> | undefined;
        const filterConditions: Record<string, any>[] = [];

        if (diagramType) {
            filterConditions.push({
                key: 'diagramType',
                match: { value: diagramType }
            });
        }

        if (source) {
            filterConditions.push({
                key: 'source',
                match: { value: source }
            });
        }

        if (filterConditions.length > 0) {
            filter = qdrantRepo.createCombinedFilter(filterConditions);
        }

        // Tìm kiếm trong Qdrant
        const results = await qdrantRepo.searchDocuments(
            queryVector,
            limit,
            filter,
            threshold
        );

        // Xây dựng chuỗi ngữ cảnh
        const context = results
            .map((r, index) =>
                `[${index + 1}] Score: ${r.score.toFixed(3)} | Type: ${r.payload.diagramType}\n${r.payload.content}`
            )
            .join('\n\n---\n\n');

        return {
            documents: results,
            context,
            totalResults: results.length,
            query
        };

    } catch (error) {
        console.error('❌ Failed to search RAG context:', error);
        throw error;
    }
}

/**
 * Tìm các tài liệu tương tự với nội dung đã cho.
 */
export async function findSimilarDocuments(
    content: string,
    limit = 3,
    excludeId?: string
): Promise<qdrantRepo.SearchResult[]> {
    try {
        // Tiền xử lý và tạo embedding
        const processedContent = embeddingService.preprocessPlantUML(content);
        const vector = await embeddingService.generateEmbedding(processedContent);

        // Tìm các tài liệu tương tự
        const results = await qdrantRepo.searchDocuments(vector, limit + (excludeId ? 1 : 0));

        // Lọc tài liệu bị loại trừ
        return excludeId
            ? results.filter(r => r.id !== excludeId).slice(0, limit)
            : results;

    } catch (error) {
        console.error('❌ Failed to find similar documents:', error);
        throw error;
    }
}

/**
 * Lấy tài liệu bằng ID của nó.
 */
export async function getDocumentById(id: string): Promise<qdrantRepo.SearchResult | null> {
    try {
        return await qdrantRepo.getDocument(id);
    } catch (error) {
        console.error('❌ Failed to get document by ID:', error);
        throw error;
    }
}

/**
 * Xóa tài liệu bằng ID của nó.
 */
export async function deleteDocument(id: string): Promise<void> {
    try {
        await qdrantRepo.deleteDocument(id);
        console.log(`✅ Deleted document: ${id}`);
    } catch (error) {
        console.error('❌ Failed to delete document:', error);
        throw error;
    }
}

/**
 * Xóa các tài liệu theo nguồn gốc của chúng.
 */
export async function deleteDocumentsBySource(source: string): Promise<void> {
    try {
        const filter = qdrantRepo.createSourceFilter(source);
        await qdrantRepo.deleteDocumentsByFilter(filter);
        console.log(`✅ Deleted documents from source: ${source}`);
    } catch (error) {
        console.error('❌ Failed to delete documents by source:', error);
        throw error;
    }
}

/**
 * Lấy các thống kê về cơ sở tri thức.
 */
export async function getRAGStats(): Promise<DocumentStats & { qdrant: any }> {
    try {
        // Lấy thống kê bộ sưu tập Qdrant
        const qdrantStats = await qdrantRepo.getCollectionStats();

        // Lấy tổng số tài liệu
        const totalDocuments = await qdrantRepo.countDocuments();

        // Lấy tài liệu theo loại sơ đồ (cách tiếp cận đơn giản)
        const diagramTypes = ['class', 'sequence', 'component', 'state', 'usecase', 'unknown'];
        const byDiagramType: Record<string, number> = {};

        for (const type of diagramTypes) {
            const filter = qdrantRepo.createDiagramTypeFilter(type);
            byDiagramType[type] = await qdrantRepo.countDocuments(filter);
        }

        return {
            totalDocuments,
            byDiagramType,
            bySources: {}, // TODO: Triển khai nếu cần
            qdrant: qdrantStats
        };

    } catch (error) {
        console.error('❌ Failed to get RAG stats:', error);
        throw error;
    }
}

/**
 * Tự động phát hiện loại sơ đồ PlantUML.
 */
export function detectDiagramType(content: string): string {
    const lowerContent = content.toLowerCase();

    // Các mẫu sơ đồ Class
    if (lowerContent.includes('class ') || lowerContent.includes('interface ') ||
        lowerContent.includes('abstract ') || lowerContent.includes('enum ')) {
        return 'class';
    }

    // Các mẫu sơ đồ Sequence
    if (lowerContent.includes('participant ') || lowerContent.includes('actor ') ||
        lowerContent.includes('->') || lowerContent.includes('<-')) {
        return 'sequence';
    }

    // Các mẫu sơ đồ Component
    if (lowerContent.includes('component ') || lowerContent.includes('package ') ||
        lowerContent.includes('node ') || lowerContent.includes('artifact ')) {
        return 'component';
    }

    // Các mẫu sơ đồ State
    if (lowerContent.includes('state ') || lowerContent.includes('[*]') ||
        lowerContent.includes('-->')) {
        return 'state';
    }

    // Các mẫu sơ đồ Use Case
    if (lowerContent.includes('usecase ') || lowerContent.includes('actor ') ||
        lowerContent.includes('rectangle ')) {
        return 'usecase';
    }

    return 'unknown';
}

/**
 * Trích xuất các từ khóa PlantUML từ nội dung.
 */
export function extractPlantUMLKeywords(content: string): string[] {
    const lowerContent = content.toLowerCase();
    return PLANTUML_KEYWORDS.filter(keyword =>
        lowerContent.includes(keyword.toLowerCase())
    );
}

/**
 * Xây dựng một lời nhắc RAG với ngữ cảnh.
 */
export async function buildRAGPrompt(
    query: string,
    systemPrompt: string = '',
    searchOptions?: RAGSearchOptions
): Promise<string> {
    try {
        // Lấy ngữ cảnh liên quan
        const ragResult = await searchContext(query, searchOptions);

        // Xây dựng lời nhắc
        let prompt = '';

        if (systemPrompt) {
            prompt += `${systemPrompt}\n\n`;
        }

        if (ragResult.context) {
            prompt += `# Relevant Context:\n${ragResult.context}\n\n`;
        }

        prompt += `# User Query:\n${query}`;

        return prompt;

    } catch (error) {
        console.error('❌ Failed to build RAG prompt:', error);
        // Trả về lời nhắc cơ bản mà không có ngữ cảnh khi xảy ra lỗi
        return systemPrompt ? `${systemPrompt}\n\n# User Query:\n${query}` : query;
    }
}

/**
 * Kiểm tra xem dịch vụ RAG đã sẵn sàng chưa.
 */
export function isRAGReady(): boolean {
    return qdrantRepo.isQdrantInitialized() && embeddingService.getModelStatus().loaded;
}

/**
 * Lấy trạng thái của dịch vụ.
 */
export function getServiceStatus(): {
    qdrant: boolean;
    embeddings: any;
    ready: boolean;
} {
    return {
        qdrant: qdrantRepo.isQdrantInitialized(),
        embeddings: embeddingService.getModelStatus(),
        ready: isRAGReady()
    };
}