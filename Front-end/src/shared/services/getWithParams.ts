import { get } from "./request";
import type {Moment} from "moment";

interface Params {
    [key: string]: string | number | Moment | undefined;
}

export const getWithParams = async (url: string, params: Params = {}) => {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && key !== 'pageSize') {
            queryParams.append(key, value.toString());
        }
    });

    const queryString = queryParams.toString();
    return get(queryString ? `${url}?${queryString}` : url);
};