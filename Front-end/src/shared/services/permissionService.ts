import handleRequest from "./handleRequest.ts";
import {getWithParams} from "./getWithParams.ts";
import {del, get, patchJsonData, postJsonData} from "./request.ts";

const PREFIX_PERMISSIONS = import.meta.env.VITE_PREFIX_PERMISSIONS as string;
const PREFIX_IDENTITY: string = import.meta.env.VITE_PREFIX_IDENTITY as string;

export interface GetPermissionsOptions {
    page?: number;
    limit?: number;
    name?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface GetPermissionsResult {
    permissions: IPermission[];
    total: number;
    page: number;
    limit: number;
}

export interface IPermission {
    id: number;
    name: string;
    description: string;
    createdDate: string;
    isActive: boolean;
}

export const createPermission = async (data: Omit<IPermission, '_id' | 'createdAt' | 'updatedAt'>): Promise<IPermission> => {
    const response = await handleRequest(postJsonData(`${PREFIX_IDENTITY}/${PREFIX_PERMISSIONS}`, data));
    return await response.json() as Promise<IPermission>;
};

export const getPermissions = async (options: GetPermissionsOptions = {}): Promise<GetPermissionsResult> => {
    const params = {
        page: (options.page || 1) - 1,
        limit: options.limit,
        name: options.name,
        sortBy: options.sortBy,
        sortOrder: options.sortOrder,
    };

    const response = await handleRequest(getWithParams(`${PREFIX_IDENTITY}/${PREFIX_PERMISSIONS}`, params));
    const data = await response.json();
    return {
        permissions: data.result.content,
        total: data.result.totalElements,
        // page: data.result.number - 1,
        limit: data.result.size
    } as GetPermissionsResult;
};

export const getPermissionById = async (id: string | number): Promise<IPermission> => {
    const response = await handleRequest(get(`${PREFIX_IDENTITY}/${PREFIX_PERMISSIONS}/${id}`));
    const data = await response.json();
    return data.data as IPermission;
};

export const updatePermission = async (id: string | number, data: Partial<Omit<IPermission, '_id' | 'createdAt' | 'updatedAt'>>): Promise<IPermission> => {
    const response = await handleRequest(patchJsonData(`${PREFIX_IDENTITY}/${PREFIX_PERMISSIONS}/${id}`, data));
    const updatedData = await response.json();
    return updatedData.data as IPermission;
};

export const deletePermission = async (id: number): Promise<IPermission> => {
    const response = await handleRequest(del(`${PREFIX_IDENTITY}/${PREFIX_PERMISSIONS}/${id}`));
    const deletedData = await response.json();
    return deletedData.data as IPermission;
};

export const togglePermissionActiveStatus = async (id: number, isActive: boolean): Promise<IPermission> => {
    const response = await handleRequest(
        patchJsonData(`${PREFIX_IDENTITY}/${PREFIX_PERMISSIONS}/${id}/toggle-active`, { isActive })
    );
    const updatedData = await response.json();
    return updatedData.data as IPermission;
};

