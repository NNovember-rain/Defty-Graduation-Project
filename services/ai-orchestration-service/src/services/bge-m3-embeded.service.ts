import { pipeline, FeatureExtractionPipeline } from '@xenova/transformers';

// Types
interface EmbeddingOptions {
    normalize?: boolean;
    pooling?: 'cls' | 'mean';
}

interface BatchEmbeddingOptions extends EmbeddingOptions {
    batchSize?: number;
}

interface SimilarityResult {
    text: string;
    similarity: number;
    index: number;
}

interface ModelStatus {
    loaded: boolean;
    loading: boolean;
    modelName: string;
    embeddingSize: number;
}

// Global model instance (singleton)
let embeddingModel: FeatureExtractionPipeline | null = null;
let isLoading: boolean = false;

/**
 * Khởi tạo mô hình BGE-M3 (chỉ gọi một lần khi khởi động).
 */
async function initEmbeddingModel(): Promise<FeatureExtractionPipeline> {
    if (embeddingModel) return embeddingModel;

    if (isLoading) {
        // Chờ quá trình tải đang diễn ra
        while (isLoading) {
            await sleep(100);
        }
        return embeddingModel!;
    }

    try {
        isLoading = true;
        console.log('🔄 Loading BGE-M3 model... (this may take 1-2 minutes)');

        embeddingModel = await pipeline(
            'feature-extraction',
            'Xenova/bge-m3',
            {
                quantized: true, // Giảm sử dụng bộ nhớ
                progress_callback: (progress: any) => {
                    if (progress.status === 'downloading') {
                        console.log(`📥 Downloading: ${Math.round(progress.progress || 0)}%`);
                    }
                }
            }
        );

        console.log('✅ BGE-M3 model loaded successfully');
        return embeddingModel;

    } catch (error) {
        console.error('❌ Failed to load BGE-M3 model:', error);
        throw error;
    } finally {
        isLoading = false;
    }
}

/**
 * Tạo một embedding duy nhất.
 */
async function generateEmbedding(
    text: string,
    options: EmbeddingOptions = {}
): Promise<number[]> {
    if (!embeddingModel) {
        await initEmbeddingModel();
    }

    try {
        const { normalize = true, pooling = 'cls' } = options;

        const output = await embeddingModel!(text, {
            pooling,
            normalize
        });

        // Chuyển đổi sang mảng thông thường
        return Array.from(output.data as Float32Array);

    } catch (error) {
        console.error('❌ Embedding generation failed:', error);
        throw error;
    }
}

/**
 * Tạo các embedding theo lô (hiệu quả hơn).
 */
async function generateBatchEmbeddings(
    texts: string[],
    options: BatchEmbeddingOptions = {}
): Promise<number[][]> {
    if (!embeddingModel) {
        await initEmbeddingModel();
    }

    if (!Array.isArray(texts) || texts.length === 0) {
        throw new Error('texts must be a non-empty array');
    }

    try {
        const { normalize = true, pooling = 'cls', batchSize = 8 } = options;
        const allEmbeddings: number[][] = [];

        // Xử lý theo từng khối để tránh các vấn đề về bộ nhớ
        for (let i = 0; i < texts.length; i += batchSize) {
            const batch = texts.slice(i, i + batchSize);
            console.log(`🔄 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(texts.length/batchSize)}`);

            const batchOutput = await embeddingModel!(batch, {
                pooling,
                normalize
            });

            const outputData = batchOutput.data as Float32Array;

            // Xử lý đầu ra đơn lẻ so với nhiều đầu ra
            if (batch.length === 1) {
                allEmbeddings.push(Array.from(outputData));
            } else {
                // Nhiều embedding được trả về dưới dạng cấu trúc lồng nhau
                for (let j = 0; j < batch.length; j++) {
                    const start = j * 1024; // Kích thước embedding của BGE-M3
                    const end = start + 1024;
                    allEmbeddings.push(Array.from(outputData.slice(start, end)));
                }
            }
        }

        return allEmbeddings;

    } catch (error) {
        console.error('❌ Batch embedding generation failed:', error);
        throw error;
    }
}

/**
 * Tính toán độ tương đồng cosine giữa hai embedding.
 */
function cosineSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
        throw new Error('Embeddings must have same dimensions');
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
        dotProduct += embedding1[i] * embedding2[i];
        norm1 += embedding1[i] * embedding1[i];
        norm2 += embedding2[i] * embedding2[i];
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

/**
 * Tìm các văn bản tương tự nhất từ một tập hợp.
 */
async function findSimilar(
    query: string,
    corpus: string[],
    topK: number = 5
): Promise<SimilarityResult[]> {
    console.log(`🔍 Finding ${topK} most similar texts for query`);

    // Tạo các embedding
    const queryEmbedding = await generateEmbedding(query);
    const corpusEmbeddings = await generateBatchEmbeddings(corpus);

    // Tính toán độ tương đồng
    const similarities: SimilarityResult[] = corpusEmbeddings.map((embedding, index) => ({
        text: corpus[index],
        similarity: cosineSimilarity(queryEmbedding, embedding),
        index
    }));

    // Sắp xếp theo độ tương đồng và trả về top K
    return similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK);
}

/**
 * Tiền xử lý văn bản PlantUML để có các embedding tốt hơn.
 */
function preprocessPlantUML(plantUMLText: string): string {
    // Xóa các thẻ @startuml/@enduml
    let processed = plantUMLText
        .replace(/@startuml[\s\S]*?\n/g, '')
        .replace(/@enduml/g, '')
        .trim();

    // Trích xuất và chuẩn hóa các phần tử PlantUML
    const elements: string[] = [];

    // Trích xuất các class, participant, component, v.v.
    const patterns: Record<string, RegExp> = {
        'class definition': /class\s+(\w+)/g,
        'participant': /participant\s+(\w+)/g,
        'component': /component\s+(\w+)/g,
        'relationship': /(\w+)\s*(-->|->|\*-->|\*->|<\|--)\s*(\w+)/g
    };

    for (const [type, pattern] of Object.entries(patterns)) {
        const matches = processed.match(pattern) || [];
        matches.forEach(match => {
            elements.push(`${type}: ${match}`);
        });
    }

    return elements.length > 0 ? elements.join(' ') : processed;
}

// Helper functions
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getModelStatus(): ModelStatus {
    return {
        loaded: embeddingModel !== null,
        loading: isLoading,
        modelName: 'BAAI/bge-m3',
        embeddingSize: 1024
    };
}

// Export functions
export {
    initEmbeddingModel,
    generateEmbedding,
    generateBatchEmbeddings,
    cosineSimilarity,
    findSimilar,
    preprocessPlantUML,
    getModelStatus,
    // Types
    type EmbeddingOptions,
    type BatchEmbeddingOptions,
    type SimilarityResult,
    type ModelStatus
};