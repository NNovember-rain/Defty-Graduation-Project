import { get, postJsonData } from "./request";
import handleRequest from "./handleRequest.tsx";

const PREFIX_AUTH = import.meta.env.VITE_PREFIX_AUTH as string;

export const getCurrentAccount = (): Promise<Response> => {
    return handleRequest(get(`${PREFIX_AUTH}/check-auth`));
};

export const postLogin = (option: Record<string, any>): Promise<Response> => {
    return handleRequest(postJsonData(`${PREFIX_AUTH}/login`, option));
};

export const postLogout = (): Promise<Response> => {
    return handleRequest(postJsonData(`${PREFIX_AUTH}/logout`, {}));
};