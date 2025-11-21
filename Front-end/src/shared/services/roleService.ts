import handleRequest from "./handleRequest.ts";
import {getWithParams} from "./getWithParams.ts";
import {del, get, patchJsonData, postJsonData} from "./request.ts";

const PREFIX_ROLES = import.meta.env.VITE_PREFIX_ROLES as string;
const PREFIX_IDENTITY: string = import.meta.env.VITE_PREFIX_IDENTITY as string;

export interface GetRolesOptions {
    page?: number;
    limit?: number;
    name?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface GetRolesResult {
    roles: IRole[];
    total: number;
    page: number;
    limit: number;
}

export interface IRole {
    id: number;
    name: string;
    description: string;
    createdDate: string;
    isActive: boolean;
    permissions: Permissions[];
}

export const createRole = async (data: Omit<IRole, '_id' | 'createdAt' | 'updatedAt'>): Promise<IRole> => {
    const response = await handleRequest(postJsonData(`${PREFIX_IDENTITY}/${PREFIX_ROLES}`, data));
    return await response.json() as Promise<IRole>;
};

export const getRoles = async (options: GetRolesOptions = {}): Promise<GetRolesResult> => {
    const params = {
        page: (options.page || 1) - 1,
        limit: options.limit,
        name: options.name,
        sortBy: options.sortBy,
        sortOrder: options.sortOrder,
    };

    const response = await handleRequest(getWithParams(`${PREFIX_IDENTITY}/${PREFIX_ROLES}`, params));
    const data = await response.json();
    return {
        roles: data.result.content,
        total: data.result.totalElements,
        // page: data.result.number - 1,
        limit: data.result.size
    } as GetRolesResult;
};

export const getRolesActive = async (options: GetRolesOptions = {}): Promise<GetRolesResult> => {
    const params = {
        page: (options.page || 1) - 1,
        limit: options.limit,
        name: options.name,
        sortBy: options.sortBy,
        sortOrder: options.sortOrder,
    };

    const response = await handleRequest(getWithParams(`${PREFIX_IDENTITY}/${PREFIX_ROLES}/isActive`, params));
    const data = await response.json();
    return {
        roles: data.result.content,
        total: data.result.totalElements,
        // page: data.result.number - 1,
        limit: data.result.size
    } as GetRolesResult;
};


export const getRoleById = async (id: string | number): Promise<IRole> => {
    const response = await handleRequest(get(`${PREFIX_IDENTITY}/${PREFIX_ROLES}/${id}`));
    const data = await response.json();
    return data.result as IRole;
};

export const updateRole = async (id: string | number, data: Partial<Omit<IRole, '_id' | 'createdAt' | 'updatedAt'>>): Promise<IRole> => {
    const response = await handleRequest(patchJsonData(`${PREFIX_IDENTITY}/${PREFIX_ROLES}/${id}`, data));
    const updatedData = await response.json();
    return updatedData.data as IRole;
};

export const deleteRole = async (id: number): Promise<IRole> => {
    const response = await handleRequest(del(`${PREFIX_IDENTITY}/${PREFIX_ROLES}/${id}`));
    const deletedData = await response.json();
    return deletedData.data as IRole;
};

export const toggleRoleActiveStatus = async (id: number, isActive: boolean): Promise<IRole> => {
    const response = await handleRequest(
        patchJsonData(`${PREFIX_IDENTITY}/${PREFIX_ROLES}/${id}/toggle-active`, { isActive })
    );
    const updatedData = await response.json();
    return updatedData.data as IRole;
};

