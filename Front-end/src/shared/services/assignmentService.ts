import handleRequest from "./handleRequest.ts";
import {getWithParams} from "./getWithParams.ts";
import {del, get, patchJsonData} from "./request.ts";

const PREFIX_ASSIGNMENT = import.meta.env.VITE_PREFIX_ASSIGNMENT as string;
const PREFIX_CONTENT: string = import.meta.env.VITE_PREFIX_CONTENT as string;

export interface GetAssignmentsOptions {
    page?: number;
    limit?: number;
    name?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface GetAssignmentsResult {
    assignments: IAssignment[];
    total: number;
    page: number;
    limit: number;
}

export interface IAssignment {
    id: number;
    name: string;
    description: string;
    createdDate: string;
    isActive: boolean;
}

export const getAssignments = async (options: GetAssignmentsOptions = {}): Promise<GetAssignmentsResult> => {
    const params = {
        page: (options.page || 1) - 1,
        limit: options.limit,
        name: options.name,
        sortBy: options.sortBy,
        sortOrder: options.sortOrder,
    };

    const response = await handleRequest(getWithParams(`${PREFIX_CONTENT}/${PREFIX_ASSIGNMENT}`, params));
    const data = await response.json();
    return {
        assignments: data.result.content,
        total: data.result.totalElements,
        page: data.result.number,
        limit: data.result.size
    } as GetAssignmentsResult;
};

export const getAssignmentById = async (id: string | number): Promise<IAssignment> => {
    const response = await handleRequest(get(`${PREFIX_CONTENT}/${PREFIX_ASSIGNMENT}/${id}`));
    const data = await response.json();
    return data.result as IAssignment;
};


export const updateAssignment = async (id: string | number, data: Partial<Omit<IAssignment, '_id' | 'createdAt' | 'updatedAt'>>): Promise<IAssignment> => {
    const response = await handleRequest(patchJsonData(`${PREFIX_CONTENT}/${PREFIX_ASSIGNMENT}/${id}`, data));
    const updatedData = await response.json();
    return updatedData.data as IAssignment;
};

export const deleteAssignment = async (id: number): Promise<IAssignment> => {
    const response = await handleRequest(del(`${PREFIX_CONTENT}/${PREFIX_ASSIGNMENT}/${id}`));
    const deletedData = await response.json();
    return deletedData.data as IAssignment;
};

export const toggleAssignmentActiveStatus = async (id: number, isActive: boolean): Promise<IAssignment> => {
    const response = await handleRequest(
        patchJsonData(`${PREFIX_CONTENT}/${PREFIX_ASSIGNMENT}/${id}/toggle-active`, { isActive })
    );
    const updatedData = await response.json();
    return updatedData.data as IAssignment;
};

