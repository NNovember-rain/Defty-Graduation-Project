import {
    get,
    postJsonData,
    del,
    patchJsonData,
    putJsonData,
} from "../request";
import { getWithParams } from "../getWithParams";
import handleRequest from "../handleRequest";

const QUESTION_BANK_SERVICE_PREFIX: string = import.meta.env
    .VITE_PREFIX_QUESTION_BANK_SERVICE as string;

// ================================================================
//  INTERFACES
// ================================================================

export interface ITestCollection {
    id: string;
    collectionName: string;
    slug: string;
    description?: string;
    totalTests?: number;
    isPublic?: boolean; // ✅ thêm trạng thái công khai

    // Base fields
    createdDate: string | null;
    createdBy: string | null;
    modifiedDate: string | null;
    modifiedBy: string | null;
    status: number;
}

export type CreateTestCollectionRequest = Omit<
    ITestCollection,
    "id" | "createdDate" | "createdBy" | "modifiedDate" | "modifiedBy" | "status" | "isPublic"
>;

export type UpdateTestCollectionRequest = Partial<CreateTestCollectionRequest>;

export interface GetTestCollectionsOptions {
    page?: number;
    limit?: number;
    collectionName?: string;
    slug?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    status?: number;
}

export interface GetTestCollectionsResult {
    content: ITestCollection[];
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

// ================================================================
//  CRUD SERVICES
// ================================================================

export const createTestCollection = async (
    data: CreateTestCollectionRequest
): Promise<ApiResponse<string>> => {
    const response = await handleRequest(
        postJsonData(`${QUESTION_BANK_SERVICE_PREFIX}/test-collections`, data)
    );
    const result = (await response.json()) as ApiResponse<string>;

    if (result.status !== 201) {
        const msg = result.message || "Tạo bộ sưu tập thất bại";
        throw new Error(msg.includes(":") ? msg.split(":").slice(1).join(":").trim() : msg);
    }
    return result;
};

export const updateTestCollection = async (
    id: string,
    data: UpdateTestCollectionRequest
): Promise<ApiResponse<string>> => {
    const response = await handleRequest(
        putJsonData(`${QUESTION_BANK_SERVICE_PREFIX}/test-collections/${id}`, data)
    );
    const result = (await response.json()) as ApiResponse<string>;

    if (result.status !== 200) {
        throw new Error(result.message || "Cập nhật bộ sưu tập thất bại");
    }

    return result;
};

export const getTestCollections = async (
    options: GetTestCollectionsOptions = {}
): Promise<GetTestCollectionsResult> => {
    const currentPage = options.page || 1;
    const entriesPerPage = options.limit || 10;

    const params = {
        page: currentPage - 1,
        size: entriesPerPage,
        collection_name: options.collectionName,
        slug: options.slug,
        sort:
            options.sortBy && options.sortOrder
                ? `${options.sortBy},${options.sortOrder}`
                : undefined,
        status: options.status !== undefined ? options.status : undefined,
    };

    const response = await handleRequest(
        getWithParams(`${QUESTION_BANK_SERVICE_PREFIX}/test-collections`, params)
    );

    const apiResponse = (await response.json()) as ApiResponse<{
        content: ITestCollection[];
        totalElements: number;
    }>;

    if (apiResponse.status === 200 && apiResponse.data) {
        const totalElements = apiResponse.data.totalElements || 0;
        const totalPages = Math.ceil(totalElements / entriesPerPage);

        return {
            content: apiResponse.data.content || [],
            totalElements,
            totalPages,
            number: currentPage - 1,
            size: entriesPerPage,
        };
    } else {
        throw new Error(apiResponse.message || "Failed to fetch test collections.");
    }
};

export const getTestCollectionById = async (
    id: string
): Promise<ITestCollection> => {
    const response = await handleRequest(
        get(`${QUESTION_BANK_SERVICE_PREFIX}/test-collections/${id}`)
    );
    const data = (await response.json()) as ApiResponse<ITestCollection>;

    if (data.status === 200 && data.data) {
        return data.data;
    } else {
        throw new Error(data.message || "Failed to fetch test collection.");
    }
};

export const deleteTestCollection = async (
    ids: string | string[]
): Promise<ApiResponse<void>> => {
    const pathIds = Array.isArray(ids) ? ids.join(",") : ids;
    const response = await handleRequest(
        del(`${QUESTION_BANK_SERVICE_PREFIX}/test-collections/${pathIds}`)
    );
    return (await response.json()) as ApiResponse<void>;
};

export const toggleTestCollectionStatus = async (
    id: string
): Promise<ApiResponse<string>> => {
    const response = await handleRequest(
        patchJsonData(
            `${QUESTION_BANK_SERVICE_PREFIX}/test-collections/toggle-status/${id}`,
            {}
        )
    );
    const result = (await response.json()) as ApiResponse<string>;

    if (result.status !== 200) {
        throw new Error(result.message || "Failed to toggle test collection status.");
    }

    return result;
};

export const getAllActiveTestCollections = async (): Promise<
    ApiResponse<ITestCollection[]>
> => {
    const response = await handleRequest(
        get(`${QUESTION_BANK_SERVICE_PREFIX}/test-collections/active`)
    );
    const result = (await response.json()) as ApiResponse<ITestCollection[]>;

    if (result.status === 200) {
        return result;
    } else {
        throw new Error(result.message || "Failed to fetch active test collections.");
    }
};

// ================================================================
//  PUBLIC COLLECTIONS SERVICES (NEW)
// ================================================================

/**
 * Lấy danh sách bộ sưu tập công khai (public)
 * GET /test-collections/accessible
 */
export const getPublicTestCollections = async (
    options: GetTestCollectionsOptions = {}
): Promise<GetTestCollectionsResult> => {
    const currentPage = options.page || 1;
    const entriesPerPage = options.limit || 10;
    const params = {
        page: currentPage - 1,
        size: entriesPerPage,
        collection_name: options.collectionName,
    };

    const response = await handleRequest(
        getWithParams(`${QUESTION_BANK_SERVICE_PREFIX}/test-collections/accessible`, params)
    );

    const apiResponse = (await response.json()) as ApiResponse<{
        content: ITestCollection[];
        totalElements: number;
    }>;

    if (apiResponse.status === 200 && apiResponse.data) {
        const totalElements = apiResponse.data.totalElements || 0;
        const totalPages = Math.ceil(totalElements / entriesPerPage);

        return {
            content: apiResponse.data.content || [],
            totalElements,
            totalPages,
            number: currentPage - 1,
            size: entriesPerPage,
        };
    } else {
        throw new Error(apiResponse.message || "Failed to fetch public test collections.");
    }
};

/**
 * Toggle trạng thái công khai / riêng tư của bộ sưu tập
 * PATCH /test-collections/toggle-public/{id}
 */
export const toggleTestCollectionPublic = async (
    id: string
): Promise<ApiResponse<string>> => {
    const response = await handleRequest(
        patchJsonData(
            `${QUESTION_BANK_SERVICE_PREFIX}/test-collections/toggle-public/${id}`,
            {}
        )
    );
    const result = (await response.json()) as ApiResponse<string>;

    if (result.status !== 200) {
        throw new Error(
            result.message || "Failed to toggle test collection public status."
        );
    }

    return result;
};