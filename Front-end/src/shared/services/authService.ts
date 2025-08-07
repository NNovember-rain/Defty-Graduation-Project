import { get, postJsonData } from "./request";
import handleRequest from "./handleRequest";
import {getLocalStorageItem} from "../utils/localStorage.ts";

const PREFIX_AUTH = import.meta.env.VITE_PREFIX_AUTH as string;
const PREFIX_IDENTITY: string = import.meta.env.VITE_PREFIX_IDENTITY as string;
const PREFIX_USER: string = import.meta.env.VITE_PREFIX_USER as string;

const TEACHER_ROLE_ID: number = 3;

export interface IUser {
    id: string;
    username: string;
    fullName: string;
    email: string;
    userCode: string;
}

export interface IdentityApiResponse<T> {
    code: number;
    result: T;
    message?: string;
}

export const getCurrentAccount = (): Promise<Response> => {
    const token = getLocalStorageItem<string>("token");

    if (!token) {
        console.warn("No access token found. Cannot fetch current account info.");
        return Promise.reject(new Error("No access token found"));
    }
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
    return handleRequest(get(`${PREFIX_IDENTITY}/${PREFIX_USER}/myInfo`, { headers: headers }));
};

export const postLogin = (option: Record<string, any>): Promise<Response> => {
    return handleRequest(postJsonData(`${PREFIX_IDENTITY}/${PREFIX_AUTH}/login`, option));
};

export const postLogout = (): Promise<Response> => {
    const token = getLocalStorageItem<string>("token");
    if (!token) {
        console.warn("Không tìm thấy token. Không thể gửi yêu cầu logout với token trong body.");
        return Promise.reject(new Error("No access token found for logout request."));
    }
    const requestBody = {
        token: token,
    };
    return handleRequest(postJsonData(`${PREFIX_IDENTITY}/${PREFIX_AUTH}/logout`, requestBody));
};

export const getUsersByRole = async (roleId: number): Promise<IUser[]> => {
    const response = await await handleRequest(get(`${PREFIX_IDENTITY}/${PREFIX_USER}/by-role/${roleId}`));
    const apiResponse = await response.json() as IdentityApiResponse<IUser[]>;

    if (apiResponse.code === 200 && apiResponse.result) {
        return apiResponse.result; // Trả về mảng user
    } else {
        throw new Error(apiResponse.message || "Failed to fetch users by role.");
    }
};
