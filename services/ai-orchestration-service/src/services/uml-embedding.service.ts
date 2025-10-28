import axios from 'axios';

const MODEL_NAME = 'BAAI/bge-m3';
const DIMENSION = 1024;

let modelEndpoint: string;

export const initEmbeddingService = (endpoint?: string) => {
    modelEndpoint = endpoint || process.env.EMBEDDING_ENDPOINT || 'http://localhost:8000';
};

export const encode = async (text: string): Promise<number[]> => {
    try {
        const response = await axios.post(`${modelEndpoint}/embed`, {
            text: text,
            model: MODEL_NAME
        });

        if (!response.data || !response.data.embedding) {
            throw new Error('Invalid response from embedding service');
        }

        return response.data.embedding;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            throw new Error(`Embedding service error: ${error.message}`);
        }
        throw error;
    }
};

export const encodeBatch = async (texts: string[]): Promise<number[][]> => {
    try {
        const response = await axios.post(`${modelEndpoint}/embed/batch`, {
            texts: texts,
            model: MODEL_NAME
        });

        if (!response.data || !response.data.embeddings) {
            throw new Error('Invalid response from embedding service');
        }

        return response.data.embeddings;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            throw new Error(`Embedding service error: ${error.message}`);
        }
        throw error;
    }
};

export const getDimension = (): number => DIMENSION;