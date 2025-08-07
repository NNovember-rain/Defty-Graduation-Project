import handleRequest from "./handleRequest.ts";
import {getWithParams} from "./getWithParams.ts";
import {del, get, patchJsonData, postJsonData} from "./request.ts";

const PREFIX_TYPEUML = import.meta.env.VITE_PREFIX_TYPEUML as string;
const PREFIX_CONTENT: string = import.meta.env.VITE_PREFIX_CONTENT as string;

export interface GetTypeUmlOptions {
    page?: number;
    limit?: number;
    name?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface GetTypeUmlResult {
    typeUmls: ITypeUml[];
    total: number;
    page: number;
    limit: number;
}

export interface ITypeUml {
    id: number;
    name: string;
    description: string;
    createdDate: string;
    isActive: boolean;
}

export const createTypeUml = async (data: Omit<ITypeUml, '_id' | 'createdAt' | 'updatedAt'>): Promise<ITypeUml> => {
    const response = await handleRequest(postJsonData(`${PREFIX_CONTENT}/${PREFIX_TYPEUML}`, data));
    return await response.json() as Promise<ITypeUml>;
};

export const getTypeUmls = async (options: GetTypeUmlOptions = {}): Promise<GetTypeUmlResult> => {
    const params = {
        page: (options.page || 1) - 1,
        limit: options.limit,
        name: options.name,
        sortBy: options.sortBy,
        sortOrder: options.sortOrder,
    };

    const response = await handleRequest(getWithParams(`${PREFIX_CONTENT}/${PREFIX_TYPEUML}`, params));
    const data = await response.json();
    return {
        typeUmls: data.result.content,
        total: data.result.totalElements,
        // page: data.result.number - 1,
        limit: data.result.size
    } as GetTypeUmlResult;
};

export const getTypeUmlById = async (id: string | number): Promise<ITypeUml> => {
    const response = await handleRequest(get(`${PREFIX_CONTENT}/${PREFIX_TYPEUML}/${id}`));
    const data = await response.json();
    return data.result as ITypeUml;
};

export const updateTypeUml = async (id: string | number, data: Partial<Omit<ITypeUml, '_id' | 'createdAt' | 'updatedAt'>>): Promise<ITypeUml> => {
    const response = await handleRequest(patchJsonData(`${PREFIX_CONTENT}/${PREFIX_TYPEUML}/${id}`, data));
    const updatedData = await response.json();
    return updatedData.data as ITypeUml;
};

export const deleteTypeUml = async (id: number): Promise<ITypeUml> => {
    const response = await handleRequest(del(`${PREFIX_CONTENT}/${PREFIX_TYPEUML}/${id}`));
    const deletedData = await response.json();
    return deletedData.data as ITypeUml;
};

export const toggleTypeUmlActiveStatus = async (id: number, isActive: boolean): Promise<ITypeUml> => {
    const response = await handleRequest(
        patchJsonData(`${PREFIX_CONTENT}/${PREFIX_TYPEUML}/${id}/toggle-active`, { isActive })
    );
    const updatedData = await response.json();
    return updatedData.data as ITypeUml;
};

