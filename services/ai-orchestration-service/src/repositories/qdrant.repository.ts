import { QdrantClient } from '@qdrant/js-client-rest';

// Types
export interface DocumentPayload {
    content: string;
    diagramType: string;
    keywords: string[];
    source?: string;
    metadata?: Record<string, any>;
}

// Qdrant Point type for better type safety
export interface QdrantPoint {
    id: string | number;
    vector: number[];
    payload: Record<string, unknown>;
}

export interface SearchResult {
    id: string;
    score: number;
    payload: DocumentPayload;
}

export interface UpsertDocument {
    id: string;
    vector: number[];
    payload: DocumentPayload;
}

// Global client instance
let qdrantClient: QdrantClient | null = null;
const COLLECTION_NAME = 'plantuml-knowledge';

/**
 * Khởi tạo máy khách Qdrant và bộ sưu tập (collection).
 * @param url URL của phiên bản Qdrant. Mặc định là 'http://localhost:6333'.
 */
export async function initQdrant(url = 'http://localhost:6333'): Promise<void> {
    try {
        qdrantClient = new QdrantClient({ url });

        const collections = await qdrantClient.getCollections();
        const exists = collections.collections.some(
            col => col.name === COLLECTION_NAME
        );

        if (!exists) {
            await createCollection();
            console.log('✅ Qdrant collection created');
        } else {
            console.log('✅ Qdrant collection exists');
        }
    } catch (error) {
        console.error('❌ Qdrant init failed:', error);
        throw error;
    }
}

/**
 * Tạo bộ sưu tập Qdrant với cấu hình vector tương thích BGE-M3.
 * Đây là một hàm helper nội bộ.
 */
async function createCollection(): Promise<void> {
    if (!qdrantClient) throw new Error('Qdrant client not initialized. Call initQdrant first.');

    await qdrantClient.createCollection(COLLECTION_NAME, {
        vectors: {
            size: 1024, // Kích thước của BGE-M3
            distance: 'Cosine' // Độ tương đồng Cosine là phổ biến cho các embedding
        },
        optimizers_config: {
            default_segment_number: 4,
            max_segment_size: 20000
        },
        wal_config: {
            wal_capacity_mb: 32,
            wal_segments_ahead: 0
        }
    });
}

/**
 * Thêm hoặc cập nhật các tài liệu trong bộ sưu tập Qdrant.
 * @param documents Một mảng các đối tượng UpsertDocument để thêm/cập nhật.
 */
export async function upsertDocuments(documents: UpsertDocument[]): Promise<void> {
    if (!qdrantClient) throw new Error('Qdrant client not initialized. Call initQdrant first.');

    try {
        const points: QdrantPoint[] = documents.map(doc => ({
            id: doc.id,
            vector: doc.vector,
            payload: {
                content: doc.payload.content,
                diagramType: doc.payload.diagramType,
                keywords: doc.payload.keywords,
                source: doc.payload.source,
                metadata: doc.payload.metadata
            }
        }));

        await qdrantClient.upsert(COLLECTION_NAME, {
            wait: true,
            points: points
        });
        console.log(`✅ Upserted ${documents.length} documents`);
    } catch (error) {
        console.error('❌ Qdrant upsert failed:', error);
        throw error;
    }
}

/**
 * Tìm kiếm các tài liệu tương tự trong bộ sưu tập Qdrant.
 * @param vector Vector truy vấn.
 * @param limit Số lượng kết quả tối đa cần trả về. Mặc định là 5.
 * @param filter Các điều kiện lọc tùy chọn cho tìm kiếm.
 * @param scoreThreshold Ngưỡng điểm số tương đồng tối thiểu để trả về kết quả.
 * @returns Một mảng các đối tượng SearchResult.
 */
export async function searchDocuments(
    vector: number[],
    limit = 5,
    filter?: Record<string, any>,
    scoreThreshold?: number
): Promise<SearchResult[]> {
    if (!qdrantClient) throw new Error('Qdrant client not initialized. Call initQdrant first.');

    try {
        const searchRequest: any = {
            vector,
            limit,
            with_payload: true // Bao gồm payload tài liệu trong kết quả
        };

        if (filter) {
            searchRequest.filter = filter;
        }
        if (scoreThreshold) {
            searchRequest.score_threshold = scoreThreshold;
        }

        const results = await qdrantClient.search(COLLECTION_NAME, searchRequest);

        return results.map(result => ({
            id: typeof result.id === 'string' ? result.id : result.id.toString(),
            score: result.score || 0,
            payload: result.payload as unknown as DocumentPayload
        }));
    } catch (error) {
        console.error('❌ Qdrant search failed:', error);
        throw error;
    }
}

/**
 * Xóa một tài liệu bằng ID của nó khỏi bộ sưu tập Qdrant.
 * @param id ID của tài liệu cần xóa.
 */
export async function deleteDocument(id: string): Promise<void> {
    if (!qdrantClient) throw new Error('Qdrant client not initialized. Call initQdrant first.');

    try {
        await qdrantClient.delete(COLLECTION_NAME, {
            wait: true,
            points: [id]
        });
        console.log(`✅ Deleted document: ${id}`);
    } catch (error) {
        console.error('❌ Qdrant delete failed:', error);
        throw error;
    }
}

/**
 * Xóa các tài liệu dựa trên một bộ lọc khỏi bộ sưu tập Qdrant.
 * @param filter Các điều kiện lọc để áp dụng cho việc xóa.
 */
export async function deleteDocumentsByFilter(filter: Record<string, any>): Promise<void> {
    if (!qdrantClient) throw new Error('Qdrant client not initialized. Call initQdrant first.');

    try {
        await qdrantClient.delete(COLLECTION_NAME, {
            wait: true,
            filter
        });
        console.log('✅ Deleted documents by filter');
    } catch (error) {
        console.error('❌ Qdrant delete by filter failed:', error);
        throw error;
    }
}

/**
 * Lấy một tài liệu bằng ID của nó từ bộ sưu tập Qdrant.
 * @param id ID của tài liệu cần lấy.
 * @returns Đối tượng SearchResult nếu tìm thấy, ngược lại là null.
 */
export async function getDocument(id: string): Promise<SearchResult | null> {
    if (!qdrantClient) throw new Error('Qdrant client not initialized. Call initQdrant first.');

    try {
        const results = await qdrantClient.retrieve(COLLECTION_NAME, {
            ids: [id],
            with_payload: true
        });

        if (results.length === 0) return null;

        const result = results[0];
        return {
            id: typeof result.id === 'string' ? result.id : result.id.toString(),
            score: 1.0, // Được lấy bằng ID, vì vậy điểm số là tối đa
            payload: result.payload as unknown as DocumentPayload
        };
    } catch (error) {
        console.error('❌ Qdrant retrieve failed:', error);
        throw error;
    }
}

/**
 * Đếm số lượng tài liệu trong bộ sưu tập, có thể lọc.
 * @param filter Bộ lọc tùy chọn để đếm các tài liệu cụ thể.
 * @returns Số lượng tài liệu.
 */
export async function countDocuments(filter?: Record<string, any>): Promise<number> {
    if (!qdrantClient) throw new Error('Qdrant client not initialized. Call initQdrant first.');

    try {
        if (filter) {
            // Nếu có bộ lọc, sử dụng count với bộ lọc
            const results = await qdrantClient.count(COLLECTION_NAME, {
                filter,
                exact: true
            });
            return results.count;
        }

        // Đối với đếm không lọc, lấy thông tin bộ sưu tập
        const info = await qdrantClient.getCollection(COLLECTION_NAME);
        return info.points_count || 0;
    } catch (error) {
        console.error('❌ Qdrant count failed:', error);
        throw error;
    }
}

/**
 * Lấy các thống kê về bộ sưu tập Qdrant.
 * @returns Một đối tượng chứa các thống kê bộ sưu tập.
 */
export async function getCollectionStats(): Promise<{
    name: string;
    points_count?: number;
    vectors_count?: number;
    segments_count?: number;
    disk_data_size?: number;
    ram_data_size?: number;
    config?: any;
    error?: string;
}> {
    if (!qdrantClient) throw new Error('Qdrant client not initialized. Call initQdrant first.');

    try {
        const info = await qdrantClient.getCollection(COLLECTION_NAME);

        // Xử lý các cấu trúc phản hồi khác nhau từ các phiên bản máy khách khác nhau
        const collectionInfo = (info as any).result || info;

        if (!collectionInfo) {
            console.warn('Qdrant getCollection did not return collection info.');
            return { name: COLLECTION_NAME, error: 'No collection info found' };
        }

        return {
            name: COLLECTION_NAME,
            points_count: collectionInfo.points_count,
            vectors_count: collectionInfo.vectors_count,
            segments_count: collectionInfo.segments_count,
            disk_data_size: collectionInfo.disk_data_size,
            ram_data_size: collectionInfo.ram_data_size,
            config: collectionInfo.config
        };
    } catch (error) {
        console.error('❌ Failed to get collection stats:', error);
        throw error;
    }
}

/**
 * Tạo một đối tượng lọc cho loại sơ đồ.
 * @param diagramType Loại sơ đồ để lọc.
 * @returns Một đối tượng lọc Qdrant.
 */
export function createDiagramTypeFilter(diagramType: string): Record<string, any> {
    return {
        must: [{
            key: 'diagramType',
            match: { value: diagramType }
        }]
    };
}

/**
 * Tạo một đối tượng lọc cho nguồn tài liệu.
 * @param source Nguồn để lọc.
 * @returns Một đối tượng lọc Qdrant.
 */
export function createSourceFilter(source: string): Record<string, any> {
    return {
        must: [{
            key: 'source',
            match: { value: source }
        }]
    };
}

/**
 * Tạo một bộ lọc kết hợp bằng cách sử dụng logic AND cho nhiều điều kiện.
 * @param conditions Một mảng các điều kiện lọc riêng lẻ.
 * @returns Một đối tượng lọc Qdrant kết hợp.
 */
export function createCombinedFilter(conditions: Record<string, any>[]): Record<string, any> {
    return {
        must: conditions
    };
}

/**
 * Kiểm tra xem máy khách Qdrant đã được khởi tạo chưa.
 * @returns True nếu đã được khởi tạo, ngược lại là false.
 */
export function isQdrantInitialized(): boolean {
    return qdrantClient !== null;
}