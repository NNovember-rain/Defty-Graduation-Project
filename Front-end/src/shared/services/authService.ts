import { get, postJsonData } from "./request";
import handleRequest from "./handleRequest";
import {getLocalStorageItem} from "../utils/localStorage.ts";

const PREFIX_AUTH = import.meta.env.VITE_PREFIX_AUTH as string;
const PREFIX_IDENTITY: string = import.meta.env.VITE_PREFIX_IDENTITY as string;
const PREFIX_USER: string = import.meta.env.VITE_PREFIX_USER as string;

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