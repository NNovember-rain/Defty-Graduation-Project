import handleRequest from "./handleRequest.ts";
import {getWithParams} from "./getWithParams.ts";
import type {IRole} from "./roleService.ts";

const PREFIX_USER = import.meta.env.VITE_PREFIX_USER as string;
const PREFIX_IDENTITY: string = import.meta.env.VITE_PREFIX_IDENTITY as string;

export interface GetUsersOptions {
    page?: number;
    limit?: number;
    username?: string;
    email?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface GetUsersResult {
    users: IUser[];
    total: number;
    page: number;
    limit: number;
}

export interface IUser {
    id: number;
    username: string;
    firstName: string | null;
    lastName: string | null;
    dob: string | null;
    email: string;
    roles: IRole[];
}

export const getUsers = async (options: GetUsersOptions = {}): Promise<GetUsersResult> => {
    const params = {
        page: (options.page || 1) - 1,
        limit: options.limit,
        username: options.username,
        email: options.email,
        sortBy: options.sortBy,
        sortOrder: options.sortOrder,
    };

    // Sử dụng getWithParams để xây dựng URL và gửi request
    const response = await handleRequest(getWithParams(`${PREFIX_IDENTITY}/${PREFIX_USER}`, params));
    const data = await response.json();
    return {
        users: data.result.content,
        total: data.result.totalElements,
        // page: data.result.number - 1,
        limit: data.result.size
    } as GetUsersResult;
};

