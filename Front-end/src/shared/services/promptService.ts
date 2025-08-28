import {get, postJsonData, patchJsonData, del, bulkDelete} from "./request";
import { getWithParams } from "./getWithParams";
import handleRequest from "./handleRequest";

const PREFIX_AI_ORCHESTRATION: string = import.meta.env.VITE_PREFIX_AI_ORCHESTRATION as string;
const PREFIX_PROMPT: string = import.meta.env.VITE_PREFIX_PROMPT as string;

export interface IPrompt {
    _id?: string;
    name: string;
    description?: string;
    templateString: string;
    umlType?: 'use-case' | 'class';
    version: string;
    createdBy?: number;
    createdAt?: string;
    updatedAt?: string;
    isActive: boolean;
}

export interface GetPromptsOptions {
    page?: number;
    limit?: number;
    name?: string;
    umlType?: string;
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
        umlType: options.umlType,
        sortBy: options.sortBy,
        sortOrder: options.sortOrder,
    };

    const response = await handleRequest(getWithParams(`${PREFIX_AI_ORCHESTRATION}/${PREFIX_PROMPT}`, params));
    const data = await response.json();
    return {
        prompts: data.data,
        total: data.meta.total,
        page: data.meta.page,
        limit: data.meta.limit
    } as GetPromptsResult;
};

export const getPromptById = async (id: string | number): Promise<IPrompt> => {
    const response = await handleRequest(get(`${PREFIX_AI_ORCHESTRATION}/${PREFIX_PROMPT}/${id}`));
    const data = await response.json();
    return data.data as IPrompt;
};

export const updatePrompt = async (id: string | number, data: Partial<Omit<IPrompt, '_id' | 'createdAt' | 'updatedAt'>>): Promise<IPrompt> => {
    const response = await handleRequest(patchJsonData(`${PREFIX_AI_ORCHESTRATION}/${PREFIX_PROMPT}/${id}`, data));
    const updatedData = await response.json();
    return updatedData.data as IPrompt;
};

export const deletePrompt = async (id: string): Promise<IPrompt> => {
    const response = await handleRequest(del(`${PREFIX_AI_ORCHESTRATION}/${PREFIX_PROMPT}/${id}`));
    const deletedData = await response.json();
    return deletedData.data as IPrompt;
};

export const deletePromptsByIds = async (ids: string[]): Promise<void> => {
    await handleRequest(bulkDelete(`${PREFIX_AI_ORCHESTRATION}/${PREFIX_PROMPT}/bulk`, ids));
};

export const togglePromptActiveStatus = async (id: string, isActive: boolean): Promise<IPrompt> => {
    const response = await handleRequest(
        patchJsonData(`${PREFIX_AI_ORCHESTRATION}/${PREFIX_PROMPT}/${id}/toggle-active`, { isActive })
    );
    const updatedData = await response.json();
    return updatedData.data as IPrompt;
};