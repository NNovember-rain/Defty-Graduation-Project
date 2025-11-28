import {
    get,
    postFormData,
    del,
    patchJsonData,
} from "../request";
import { getWithParams } from "../getWithParams";
import handleRequest from "../handleRequest";

const QUESTION_BANK_SERVICE_PREFIX: string = import.meta.env.VITE_PREFIX_QUESTION_BANK_SERVICE as string;

// --- Interfaces ---
export interface IFileProcessing {
    id: string;
    testSetId: string;
    testSetName?: string;
    partType: string;
    fileName: string;
    fileSize: number;
    totalQuestionsFound?: number;
    questionsInserted?: number;
    questionsDuplicated?: number;
    questionsFailed?: number;
    conflictResolution: string;
    existingQuestionsCount?: number;
    errorCode?: string;
    errorMessage?: string;
    manuallyResolved?: boolean;
    // Các trường từ BaseEntity
    createdDate: string | null;
    createdBy: string | null;
    modifiedDate: string | null;
    modifiedBy: string | null;
    status: number;
}

export interface CreateFileProcessingRequest {
    testSetId: string;
    partType: string; // LC, RC
    file: File;
}

export interface GetFileProcessingsOptions {
    page?: number;
    limit?: number;
    testSetId?: string;
    partType?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface GetFileProcessingsResult {
    content: IFileProcessing[];
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

// --- API Functions ---
export const uploadTestFile = async (data: CreateFileProcessingRequest): Promise<ApiResponse<string>> => {
    const formData = new FormData();
    formData.append('testSetId', data.testSetId);
    formData.append('partType', data.partType);
    formData.append('file', data.file);

    const response = await handleRequest(
        postFormData(`${QUESTION_BANK_SERVICE_PREFIX}/file-processing/upload`, formData)
    );
    const result = await response.json() as ApiResponse<string>;

    if (result.status !== 201) {
        const rawMessage = result.message || 'Upload file thất bại';
        const formattedMessage = rawMessage.includes(':')
            ? rawMessage.split(':').slice(1).join(':').trim()
            : rawMessage;
        throw new Error(formattedMessage);
    }

    return result;
};

export const getProcessingById = async (id: string): Promise<IFileProcessing> => {
    const response = await handleRequest(
        get(`${QUESTION_BANK_SERVICE_PREFIX}/file-processing/${id}`)
    );
    const data = await response.json() as ApiResponse<IFileProcessing>;

    if (data.status === 200 && data.data) {
        return data.data;
    } else {
        throw new Error(data.message || "Failed to fetch file processing.");
    }
};

export const getFileProcessings = async (options: GetFileProcessingsOptions = {}): Promise<GetFileProcessingsResult> => {
    const currentPage = options.page || 1;
    const entriesPerPage = options.limit || 10;

    const params = {
        page: currentPage - 1,
        size: entriesPerPage,
        test_set_id: options.testSetId,
        part_type: options.partType,
        status: options.status,
        sort: options.sortBy && options.sortOrder ? `${options.sortBy},${options.sortOrder}` : undefined,
    };

    const response = await handleRequest(
        getWithParams(`${QUESTION_BANK_SERVICE_PREFIX}/file-processing`, params)
    );

    const apiResponse = await response.json() as ApiResponse<{ content: IFileProcessing[], totalElements: number }>;

    if (apiResponse.status === 200 && apiResponse.data) {
        const totalElements = apiResponse.data.totalElements || 0;
        const totalPages = Math.ceil(totalElements / entriesPerPage);

        return {
            content: apiResponse.data.content || [],
            totalElements: totalElements,
            totalPages: totalPages,
            number: currentPage - 1,
            size: entriesPerPage,
        } as GetFileProcessingsResult;
    } else {
        throw new Error(apiResponse.message || "Failed to fetch file processings.");
    }
};

export const deleteProcessings = async (ids: string | string[]): Promise<ApiResponse<void>> => {
    let pathIds: string;

    if (Array.isArray(ids)) {
        pathIds = ids.join(',');
    } else {
        pathIds = ids;
    }

    const response = await handleRequest(
        del(`${QUESTION_BANK_SERVICE_PREFIX}/file-processing/${pathIds}`)
    );
    return await response.json() as ApiResponse<void>;
};

export const markAsResolved = async (id: string): Promise<ApiResponse<string>> => {
    const response = await handleRequest(
        patchJsonData(`${QUESTION_BANK_SERVICE_PREFIX}/file-processing/${id}/resolve`, {})
    );
    const result = await response.json() as ApiResponse<string>;

    if (result.status !== 200) {
        throw new Error(result.message || "Failed to mark as resolved.");
    }

    return result;
};

export const cancelProcessing = async (id: string): Promise<ApiResponse<string>> => {
    const response = await handleRequest(
        patchJsonData(`${QUESTION_BANK_SERVICE_PREFIX}/file-processing/${id}/cancel`, {})
    );
    const result = await response.json() as ApiResponse<string>;

    if (result.status !== 200) {
        throw new Error(result.message || "Failed to cancel processing.");
    }

    return result;
};