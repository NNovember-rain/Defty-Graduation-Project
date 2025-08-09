import handleRequest from "./handleRequest.ts";
import {getWithParams} from "./getWithParams.ts";
import {del, get, patchJsonData} from "./request.ts";
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
    fullName: string | null;
    lastName: string | null;
    dob: string | null;
    email: string;
    isActive: boolean;
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

export const getUserById = async (id: string | number): Promise<IUser> => {
    const response = await handleRequest(get(`${PREFIX_IDENTITY}/${PREFIX_USER}/${id}`));
    const data = await response.json();
    return data.result as IUser;
};

export const updateUser = async (id: string | number, data: Partial<Omit<IUser, '_id' | 'createdAt' | 'updatedAt'>>): Promise<IUser> => {
    const response = await handleRequest(patchJsonData(`${PREFIX_IDENTITY}/${PREFIX_USER}/${id}`, data));
    const updatedData = await response.json();
    return updatedData.data as IUser;
};

export const deleteUser = async (id: number): Promise<IUser> => {
    const response = await handleRequest(del(`${PREFIX_IDENTITY}/${PREFIX_USER}/${id}`));
    const deletedData = await response.json();
    return deletedData.data as IUser;
};

export const toggleUserActiveStatus = async (id: number, isActive: boolean): Promise<IUser> => {
    const response = await handleRequest(
        patchJsonData(`${PREFIX_IDENTITY}/${PREFIX_USER}/${id}/toggle-active`, { isActive })
    );
    const updatedData = await response.json();
    return updatedData.data as IUser;
};
