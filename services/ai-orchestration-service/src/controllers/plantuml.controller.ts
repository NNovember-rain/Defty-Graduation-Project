// src/controllers/plantuml.controller.ts
import { Request, Response } from 'express';
import * as ragService from '../services/plantuml-rag.service';

// Request/Response interfaces
interface AddDocumentsRequest {
    documents: ragService.RAGDocument[];
}

interface SearchContextRequest {
    query: string;
    limit?: number;
    diagramType?: string;
    threshold?: number;
    source?: string;
}

interface FindSimilarRequest {
    content: string;
    limit?: number;
    excludeId?: string;
}

interface DeleteDocumentsRequest {
    source: string;
}

// Response wrapper
interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    timestamp: string;
}

/**
 * Tạo một đối tượng phản hồi API chuẩn hóa.
 */
function createResponse<T>(
    success: boolean,
    data?: T,
    error?: string,
    message?: string
): ApiResponse<T> {
    return {
        success,
        data,
        error,
        message,
        timestamp: new Date().toISOString()
    };
}

/**
 * Khởi tạo bộ điều khiển PlantUML.
 * Hàm này sẽ thiết lập dịch vụ RAG.
 */
export async function initPlantUmlController(): Promise<void> {
    await ragService.initRAGService();
    console.log('✅ PlantUML Controller initialized');
}

/**
 * Thêm các tài liệu vào cơ sở tri thức.
 * POST /api/documents
 */
export async function addDocuments(req: Request, res: Response): Promise<void> {
    try {
        const { documents }: AddDocumentsRequest = req.body;

        // Xác thực dữ liệu đầu vào
        if (!documents || !Array.isArray(documents) || documents.length === 0) {
            res.status(400).json(
                createResponse(false, undefined, 'Documents array is required and must not be empty')
            );
            return;
        }

        // Xác thực từng tài liệu
        for (let i = 0; i < documents.length; i++) {
            const doc = documents[i];
            if (!doc.content) {
                res.status(400).json(
                    createResponse(false, undefined, `Document at index ${i} must have content`)
                );
                return;
            }
        }

        // Thêm tài liệu vào dịch vụ RAG
        const documentIds = await ragService.addDocuments(documents);

        res.status(201).json(
            createResponse(
                true,
                {
                    documentIds,
                    count: documents.length
                },
                undefined,
                `Successfully added ${documents.length} documents`
            )
        );

    } catch (error) {
        console.error('Controller error - addDocuments:', error);
        res.status(500).json(
            createResponse(
                false,
                undefined,
                'Failed to add documents',
                error instanceof Error ? error.message : 'Unknown error'
            )
        );
    }
}

/**
 * Tìm kiếm ngữ cảnh liên quan dựa trên một truy vấn.
 * POST /api/search
 */
export async function searchContext(req: Request, res: Response): Promise<void> {
    try {
        const { query, limit, diagramType, threshold, source }: SearchContextRequest = req.body;

        // Xác thực dữ liệu đầu vào
        if (!query || typeof query !== 'string' || query.trim().length === 0) {
            res.status(400).json(
                createResponse(false, undefined, 'Query is required and must be a non-empty string')
            );
            return;
        }

        // Xác thực các tham số số tùy chọn
        if (limit !== undefined && (typeof limit !== 'number' || limit < 1 || limit > 20)) {
            res.status(400).json(
                createResponse(false, undefined, 'Limit must be a number between 1 and 20')
            );
            return;
        }

        if (threshold !== undefined && (typeof threshold !== 'number' || threshold < 0 || threshold > 1)) {
            res.status(400).json(
                createResponse(false, undefined, 'Threshold must be a number between 0 and 1')
            );
            return;
        }

        // Thực hiện tìm kiếm ngữ cảnh
        const result = await ragService.searchContext(query.trim(), {
            limit: limit || 5,
            diagramType,
            threshold: threshold || 0.7,
            source
        });

        res.json(
            createResponse(
                true,
                result,
                undefined,
                `Found ${result.totalResults} relevant documents`
            )
        );

    } catch (error) {
        console.error('Controller error - searchContext:', error);
        res.status(500).json(
            createResponse(
                false,
                undefined,
                'Failed to search context',
                error instanceof Error ? error.message : 'Unknown error'
            )
        );
    }
}

/**
 * Tìm các tài liệu tương tự với nội dung đã cho.
 * POST /api/similar
 */
export async function findSimilar(req: Request, res: Response): Promise<void> {
    try {
        const { content, limit, excludeId }: FindSimilarRequest = req.body;

        // Xác thực dữ liệu đầu vào
        if (!content || content.trim().length === 0) {
            res.status(400).json(
                createResponse(false, undefined, 'Content is required and must be a non-empty string')
            );
            return;
        }

        if (limit !== undefined && (typeof limit !== 'number' || limit < 1 || limit > 10)) {
            res.status(400).json(
                createResponse(false, undefined, 'Limit must be a number between 1 and 10')
            );
            return;
        }

        // Tìm các tài liệu tương tự
        const results = await ragService.findSimilarDocuments(
            content.trim(),
            limit || 3,
            excludeId
        );

        res.json(
            createResponse(
                true,
                results,
                undefined,
                `Found ${results.length} similar documents`
            )
        );

    } catch (error) {
        console.error('Controller error - findSimilar:', error);
        res.status(500).json(
            createResponse(
                false,
                undefined,
                'Failed to find similar documents',
                error instanceof Error ? error.message : 'Unknown error'
            )
        );
    }
}

/**
 * Lấy một tài liệu bằng ID của nó.
 * GET /api/documents/:id
 */
export async function getDocument(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;

        if (!id) {
            res.status(400).json(
                createResponse(false, undefined, 'Document ID is required')
            );
            return;
        }

        const document = await ragService.getDocumentById(id);

        if (!document) {
            res.status(404).json(
                createResponse(false, undefined, 'Document not found')
            );
            return;
        }

        res.json(
            createResponse(true, document, undefined, 'Document retrieved successfully')
        );

    } catch (error) {
        console.error('Controller error - getDocument:', error);
        res.status(500).json(
            createResponse(
                false,
                undefined,
                'Failed to get document',
                error instanceof Error ? error.message : 'Unknown error'
            )
        );
    }
}

/**
 * Xóa một tài liệu bằng ID của nó.
 * DELETE /api/documents/:id
 */
export async function deleteDocument(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;

        if (!id) {
            res.status(400).json(
                createResponse(false, undefined, 'Document ID is required')
            );
            return;
        }

        // Kiểm tra xem tài liệu có tồn tại không
        const existing = await ragService.getDocumentById(id);
        if (!existing) {
            res.status(404).json(
                createResponse(false, undefined, 'Document not found')
            );
            return;
        }

        await ragService.deleteDocument(id);

        res.json(
            createResponse(true, undefined, undefined, `Document ${id} deleted successfully`)
        );

    } catch (error) {
        console.error('Controller error - deleteDocument:', error);
        res.status(500).json(
            createResponse(
                false,
                undefined,
                'Failed to delete document',
                error instanceof Error ? error.message : 'Unknown error'
            )
        );
    }
}

/**
 * Xóa các tài liệu theo nguồn gốc của chúng.
 * DELETE /api/documents/source/:source
 */
export async function deleteDocumentsBySource(req: Request, res: Response): Promise<void> {
    try {
        const { source } = req.params;

        if (!source) {
            res.status(400).json(
                createResponse(false, undefined, 'Source is required')
            );
            return;
        }

        await ragService.deleteDocumentsBySource(source);

        res.json(
            createResponse(true, undefined, undefined, `Documents from source '${source}' deleted successfully`)
        );

    } catch (error) {
        console.error('Controller error - deleteDocumentsBySource:', error);
        res.status(500).json(
            createResponse(
                false,
                undefined,
                'Failed to delete documents by source',
                error instanceof Error ? error.message : 'Unknown error'
            )
        );
    }
}

/**
 * Lấy các thống kê về cơ sở tri thức.
 * GET /api/stats
 */
export async function getStats(req: Request, res: Response): Promise<void> {
    try {
        const stats = await ragService.getRAGStats();

        res.json(
            createResponse(
                true,
                stats,
                undefined,
                'Statistics retrieved successfully'
            )
        );

    } catch (error) {
        console.error('Controller error - getStats:', error);
        res.status(500).json(
            createResponse(
                false,
                undefined,
                'Failed to get statistics',
                error instanceof Error ? error.message : 'Unknown error'
            )
        );
    }
}

/**
 * Điểm cuối để kiểm tra tình trạng sức khỏe của dịch vụ.
 * GET /health
 */
export function healthCheck(req: Request, res: Response): void {
    try {
        const serviceStatus = ragService.getServiceStatus();
        const isHealthy = serviceStatus.ready;

        const healthData = {
            status: isHealthy ? 'healthy' : 'unhealthy',
            services: serviceStatus,
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            timestamp: new Date().toISOString()
        };

        res.status(isHealthy ? 200 : 503).json(
            createResponse(
                isHealthy,
                healthData,
                isHealthy ? undefined : 'Some services are not ready'
            )
        );

    } catch (error) {
        console.error('Controller error - healthCheck:', error);
        res.status(500).json(
            createResponse(
                false,
                undefined,
                'Health check failed',
                error instanceof Error ? error.message : 'Unknown error'
            )
        );
    }
}

/**
 * Xây dựng một lời nhắc RAG (utility endpoint for testing).
 * POST /api/prompt
 */
export async function buildRAGPrompt(req: Request, res: Response): Promise<void> {
    try {
        const { query, systemPrompt, ...searchOptions } = req.body;

        if (!query || typeof query !== 'string' || query.trim().length === 0) {
            res.status(400).json(
                createResponse(false, undefined, 'Query is required and must be a non-empty string')
            );
            return;
        }

        const prompt = await ragService.buildRAGPrompt(
            query.trim(),
            systemPrompt || '',
            searchOptions
        );

        res.json(
            createResponse(
                true,
                { prompt },
                undefined,
                'RAG prompt built successfully'
            )
        );

    } catch (error) {
        console.error('Controller error - buildRAGPrompt:', error);
        res.status(500).json(
            createResponse(
                false,
                undefined,
                'Failed to build RAG prompt',
                error instanceof Error ? error.message : 'Unknown error'
            )
        );
    }
}