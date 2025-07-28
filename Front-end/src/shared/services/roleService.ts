import handleRequest from "./handleRequest.ts";
import {getWithParams} from "./getWithParams.ts";

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
}

export const getRoles = async (options: GetRolesOptions = {}): Promise<GetRolesResult> => {
    const params = {
        page: (options.page || 1) - 1,
        limit: options.limit,
        name: options.name,
        sortBy: options.sortBy,
        sortOrder: options.sortOrder,
    };

    // Sử dụng getWithParams để xây dựng URL và gửi request
    const response = await handleRequest(getWithParams(`${PREFIX_IDENTITY}/${PREFIX_ROLES}`, params));
    const data = await response.json();
    return {
        roles: data.result.content,
        total: data.result.totalElements,
        // page: data.result.number - 1,
        limit: data.result.size
    } as GetRolesResult;
};

