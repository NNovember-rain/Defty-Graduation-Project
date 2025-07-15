import handleRequest from "./handleRequest.ts";
import {getWithParams} from "./getWithParams.ts";


const PREFIX_ROLES = import.meta.env.VITE_PREFIX_ROLES as string;
const PREFIX_IDENTITY: string = import.meta.env.VITE_PREFIX_IDENTITY as string;

export const getRoles = async (
    page?: number,
    size?: number,
    filters?: Record<string, string | number>
): Promise<Response> => {
    const url = `${PREFIX_IDENTITY}/${PREFIX_ROLES}`;
    const params = {
        page,
        size,
        ...filters,
    };
    return handleRequest(getWithParams(url, params));
};
