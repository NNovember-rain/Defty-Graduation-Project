import { get, postJsonData, patchJsonData, del } from "./request"; // Giả định patch và remove là tên đúng
import { getWithParams } from "./getWithParams"; // Import common function
import handleRequest from "./handleRequest";

const PREFIX_AI_ORCHESTRATION: string = import.meta.env.VITE_PREFIX_AI_ORCHESTRATION as string;
const PREFIX_PROMPT: string = import.meta.env.VITE_PREFIX_PROMPT as string;

export interface IPrompt {
    _id?: string;
    name: string;
    description?: string;
    templateString: string;
    type: 'system' | 'user' | 'template';
    version: string;
    createdBy?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface GetPromptsOptions {
    page?: number;
    limit?: number;
    name?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface GetPromptsResult {
    prompts: IPrompt[];
    total: number;
    page: number;
    limit: number;
}

export const createPrompt = async (data: Omit<IPrompt, '_id' | 'createdAt' | 'updatedAt'>): Promise<IPrompt> => {
    const response = await handleRequest(postJsonData(`${PREFIX_AI_ORCHESTRATION}/${PREFIX_PROMPT}`, data));
    return await response.json() as Promise<IPrompt>;
};

export const getPrompts = async (options: GetPromptsOptions = {}): Promise<GetPromptsResult> => {
    const params = {
        page: options.page,
        limit: options.limit,
        name: options.name,
        sortBy: options.sortBy,
        sortOrder: options.sortOrder,
    };

    // Sử dụng getWithParams để xây dựng URL và gửi request
    const response = await handleRequest(getWithParams(`${PREFIX_AI_ORCHESTRATION}/${PREFIX_PROMPT}`, params));
    const data = await response.json();
    return {
        prompts: data.data,
        total: data.meta.total,
        page: data.meta.page,
        limit: data.meta.limit
    } as GetPromptsResult;
};

export const getPromptById = async (id: string): Promise<IPrompt> => {
    const response = await handleRequest(get(`${PREFIX_AI_ORCHESTRATION}/${PREFIX_PROMPT}/${id}`));
    const data = await response.json();
    return data.data as IPrompt;
};

export const updatePrompt = async (id: string, data: Partial<Omit<IPrompt, '_id' | 'createdAt' | 'updatedAt'>>): Promise<IPrompt> => {
    const response = await handleRequest(patchJsonData(`${PREFIX_AI_ORCHESTRATION}/${PREFIX_PROMPT}/${id}`, data));
    const updatedData = await response.json();
    return updatedData.data as IPrompt;
};

export const deletePrompt = async (id: string): Promise<IPrompt> => {
    const response = await handleRequest(del(`${PREFIX_AI_ORCHESTRATION}/${PREFIX_PROMPT}/${id}`));
    const deletedData = await response.json();
    return deletedData.data as IPrompt;
};