import handleRequest from "./handleRequest.ts";
import {getWithParams} from "./getWithParams.ts";
import {del, get, patchJsonData, postJsonData} from "./request.ts";

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

export interface IModule {
    id: number;
    moduleName: string;
    moduleDescription: string;
    solutionCode?: string;
}

export interface IAssignment {
    assignmentClasses: any;
    id: number;
    title: string,
    commonDescription: string;
    commonDescriptionHtml: string;
    assignmentDescriptionHtml: string;
    typeUmlName: number;
    solutionCode: string;
    assignmentCode: string;
    assignmentTitle: string;
    assignmentClassId: number;
    assignmentClassDetailId: number;
    createdDate: string;
    isActive: number;
    startDate: string | null;
    endDate: string | null;
    assignmentClassDetailResponseList: IModule[];
}

export interface IAssignAssignment {
    classIds: number[];
    assignmentIds: number[];
    startDate: string;
    endDate: string;
}

export interface ISolutionRequest {
    typeUml: string;
    solutionCode: string;
}

export interface IModuleRequest {
    moduleName: string;
    moduleDescription: string;
    solutionResponses: ISolutionRequest[];
}

export interface IAssignmentRequest {
    title: string;
    description: string;
    classIds: number[];
    modules: IModuleRequest[];
}

export interface IAssignmentClassDetailResponse {
    moduleName: string;
    moduleDescription: string;
    titleAssignment: string;
    solutionCode: string;
    assignmentDescription: string;
    assignmentDescriptionHtml: string;
    typeUml: string;
    checkedTest: boolean;
    startDate: string | Date | null;
    endDate: string | Date | null;
}

export const createAssignment = async (data: IAssignmentRequest): Promise<IAssignment> => {
    const response = await handleRequest(
        postJsonData(`${PREFIX_CONTENT}/${PREFIX_ASSIGNMENT}`, data)
    );
    const result = await response.json();
    return result.result as IAssignment;
};

export const assignAssignment = async (data: Omit<IAssignAssignment, '_id' | 'createdAt' | 'updatedAt'>): Promise<IAssignAssignment> => {
    const response = await handleRequest(postJsonData(`${PREFIX_CONTENT}/${PREFIX_ASSIGNMENT}/assign`, data));
    return await response.json() as Promise<IAssignAssignment>;
};

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

export const getUnassignedAssignments = async (
    classId: number,
    mode: string,
    options: GetAssignmentsOptions
): Promise<GetAssignmentsResult> => {
    const params = {
        page: (options.page || 1) - 1,
        size: options.limit,
        name: options.name,
        sortBy: options.sortBy,
        sortOrder: options.sortOrder,
        mode: mode,
    };

    const url = `${PREFIX_CONTENT}/${PREFIX_ASSIGNMENT}/unassigned/${classId}`;
    const response = await handleRequest(getWithParams(url, params));
    const data = await response.json();

    return {
        assignments: data.result.content,
        total: data.result.totalElements,
        page: data.result.number,
        limit: data.result.size
    } as GetAssignmentsResult;
};


export const getAssignmentsByClassId = async (classId: number, options: GetAssignmentsOptions = {}): Promise<GetAssignmentsResult> => {
    const params = {
        page: (options.page || 1) - 1,
        size: options.limit,
        name: options.name,
        sortBy: options.sortBy,
        sortOrder: options.sortOrder,
    };

    const response = await handleRequest(
        getWithParams(`${PREFIX_CONTENT}/${PREFIX_ASSIGNMENT}/class/${classId}`, params)
    );
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

export const unassignAssignment = async (id: number): Promise<IAssignment> => {
    const response = await handleRequest(del(`${PREFIX_CONTENT}/${PREFIX_ASSIGNMENT}/unassign/${id}`));
    const deletedData = await response.json();
    return deletedData.data as IAssignment;
};

export const getAssignmentByClassId = async (classId: string | number, assignmentId: string | number): Promise<IAssignment> => {
    const response = await handleRequest(get(`${PREFIX_CONTENT}/${PREFIX_ASSIGNMENT}/${classId}/${assignmentId}`));
    const data = await response.json();
    return data.result as IAssignment;
};

export const getAssignmentDetail = async (assignmentClassDetailId: string | number): Promise<IAssignment> => {
    const response = await handleRequest(get(`${PREFIX_CONTENT}/${PREFIX_ASSIGNMENT}/detail/${assignmentClassDetailId}`));
    const data = await response.json();
    return data.result as IAssignment;
};


export const getAssignmentAllModule = async (assignmentClassId: string | number): Promise<IAssignment> => {
    const response = await handleRequest(get(`${PREFIX_CONTENT}/${PREFIX_ASSIGNMENT}/detail/all-module/${assignmentClassId}`));
    const data = await response.json();
    return data.result as IAssignment;
};



export const updateAssignment = async (id: string | number, data: Partial<Omit<IAssignment, '_id' | 'createdAt' | 'updatedAt'>>): Promise<IAssignment> => {
    const response = await handleRequest(patchJsonData(`${PREFIX_CONTENT}/${PREFIX_ASSIGNMENT}/update/${id}`, data));
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

export const getAssignmentClassDetail = async (
    assignmentClassDetailId: string | number,
): Promise<IAssignmentClassDetailResponse> => {
    const url = `${PREFIX_CONTENT}/${PREFIX_ASSIGNMENT}/assignmentClassDetail/${assignmentClassDetailId}`;
    const response = await handleRequest(getWithParams(url));
    const data = await response.json();
    return data.result as IAssignmentClassDetailResponse;
};

