import {
    get,
    postJsonData,
    del,
    patchJsonData,
    putJsonData,
} from "../request";
import { getWithParams } from "../getWithParams";
import handleRequest from "../handleRequest";

const QUESTION_BANK_SERVICE_PREFIX: string = import.meta.env.VITE_PREFIX_QUESTION_BANK_SERVICE as string;

export interface IQuestionTag {
    id: string;
    tagName: string;
    tagCategory?: string;
    description?: string;
    // Các trường từ BaseEntity
    createdDate: string | null;
    createdBy: string | null;
    modifiedDate: string | null;
    modifiedBy: string | null;
    status: number;
}

export type CreateQuestionTagRequest = Omit<IQuestionTag, 'id' | 'createdDate' | 'createdBy' | 'modifiedDate' | 'modifiedBy' | 'status'>;
export type UpdateQuestionTagRequest = Partial<CreateQuestionTagRequest>;

// --- Interfaces cho Phân trang và Kết quả API ---
export interface GetQuestionTagsOptions {
    page?: number;
    limit?: number;
    tagName?: string;
    tagCategory?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    status?: number;
}

export interface GetQuestionTagsResult {
    content: IQuestionTag[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
}

export interface ApiResponse<T> {
    status: number;
    message: string;
    data: T;
    errorCode?: string;
}

// --- Các hàm gọi API cho Quản lý Question Tag ---
export const createQuestionTag = async (data: CreateQuestionTagRequest): Promise<ApiResponse<string>> => {
    const response = await handleRequest(postJsonData(`${QUESTION_BANK_SERVICE_PREFIX}/question-tags`, data));
    const result = await response.json() as ApiResponse<string>;

    if (result.status !== 201) {
        const rawMessage = result.message || 'Tạo thẻ câu hỏi thất bại';
        const formattedMessage = rawMessage.includes(':')
            ? rawMessage.split(':').slice(1).join(':').trim()
            : rawMessage;

        console.log(formattedMessage);
        throw new Error(formattedMessage);
    }

    return result;
};

export const updateQuestionTag = async (id: string, data: UpdateQuestionTagRequest): Promise<ApiResponse<string>> => {
    console.log(data);
    const response = await handleRequest(putJsonData(`${QUESTION_BANK_SERVICE_PREFIX}/question-tags/${id}`, data));
    const result = await response.json() as ApiResponse<string>;

    if (result.status !== 200) {
        throw new Error(result.message || 'Cập nhật thẻ câu hỏi thất bại');
    }

    return result;
};

export const getQuestionTags = async (options: GetQuestionTagsOptions = {}): Promise<GetQuestionTagsResult> => {
    const currentPage = options.page || 1;
    const entriesPerPage = options.limit || 10;
    const params = {
        page: currentPage - 1,
        size: entriesPerPage,
        tag_name: options.tagName,
        tag_category: options.tagCategory,
        sort: options.sortBy && options.sortOrder ? `${options.sortBy},${options.sortOrder}` : undefined,
        status: options.status !== undefined ? options.status : undefined
    };

    const response = await handleRequest(getWithParams(`${QUESTION_BANK_SERVICE_PREFIX}/question-tags`, params));

    const apiResponse = await response.json() as ApiResponse<{ content: IQuestionTag[], totalElements: number }>;

    if (apiResponse.status === 200 && apiResponse.data) {
        const totalElements = apiResponse.data.totalElements || 0;
        const totalPages = Math.ceil(totalElements / entriesPerPage);

        return {
            content: apiResponse.data.content || [],
            totalElements: totalElements,
            totalPages: totalPages,
            number: currentPage - 1,
            size: entriesPerPage,
        } as GetQuestionTagsResult;
    } else {
        throw new Error(apiResponse.message || "Failed to fetch question tags.");
    }
};

export const getQuestionTagById = async (id: string): Promise<IQuestionTag> => {
    const response = await handleRequest(get(`${QUESTION_BANK_SERVICE_PREFIX}/question-tags/${id}`));
    const data = await response.json() as ApiResponse<IQuestionTag>;

    console.log("Dữ liệu trả về:", data);

    if (data.status === 200 && data.data) {
        return data.data;
    } else {
        throw new Error(data.message || "Failed to fetch question tag.");
    }
};

export const deleteQuestionTag = async (ids: string | string[]): Promise<ApiResponse<void>> => {
    let pathIds: string;

    if (Array.isArray(ids)) {
        pathIds = ids.join(',');
    } else {
        pathIds = ids;
    }
    const response = await handleRequest(del(`${QUESTION_BANK_SERVICE_PREFIX}/question-tags/${pathIds}`));
    return await response.json() as ApiResponse<void>;
};

export const toggleQuestionTagStatus = async (id: string): Promise<ApiResponse<string>> => {
    const response = await handleRequest(
        patchJsonData(`${QUESTION_BANK_SERVICE_PREFIX}/question-tags/toggle-status/${id}`, {})
    );
    const result = await response.json() as ApiResponse<string>;

    if (result.status !== 200) {
        throw new Error(result.message || "Failed to toggle question tag status.");
    }

    return result;
};

export const getAllActiveQuestionTags = async (): Promise<ApiResponse<IQuestionTag[]>> => {
    const response = await handleRequest(get(`${QUESTION_BANK_SERVICE_PREFIX}/question-tags/active`));
    const result = await response.json() as ApiResponse<IQuestionTag[]>;

    if (result.status === 200) {
        return result;
    } else {
        throw new Error(result.message || "Failed to fetch active question tags.");
    }
};