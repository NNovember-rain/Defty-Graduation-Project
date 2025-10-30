import axios from 'axios';

const DIMENSION = 1024;

let modelEndpoint: string;

export const initEmbeddingService = (endpoint?: string) => {
    modelEndpoint = endpoint || process.env.EMBEDDING_ENDPOINT || 'http://localhost:8000';
};

export const encode = async (text: string): Promise<number[]> => {
    try {
        const response = await axios.post(`${modelEndpoint}/embed`, {
            inputs: text
        });

        if (!Array.isArray(response.data) || response.data.length === 0) {
            throw new Error('Invalid response from embedding service');
        }

        return response.data[0];
    } catch (error) {
        if (axios.isAxiosError(error)) {
            throw new Error(`Embedding service error: ${error.message}`);
        }
        throw error;
    }
};

export const encodeBatch = async (texts: string[]): Promise<number[][]> => {
    try {
        const response = await axios.post(`${modelEndpoint}/embed`, {
            inputs: texts
        });

        if (!Array.isArray(response.data)) {
            throw new Error('Invalid response from embedding service');
        }

        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            throw new Error(`Embedding service error: ${error.message}`);
        }
        throw error;
    }
};

export const getDimension = (): number => DIMENSION;