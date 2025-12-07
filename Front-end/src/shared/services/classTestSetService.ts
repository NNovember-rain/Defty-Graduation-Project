// ============================================
// 1. Service File - classTestSetService.ts
// Location: shared/services/classTestSetService.ts
// ============================================

import {
    get,
    postJsonData,
    del,
    patchJsonData,
} from "../services/request.ts";
import { getWithParams } from "../services/getWithParams";
import handleRequest from "../services/handleRequest";

const QUESTION_BANK_SERVICE_PREFIX: string = import.meta.env
    .VITE_PREFIX_QUESTION_BANK_SERVICE as string;

// ================================================================
//  INTERFACES
// ================================================================

export interface IClassTestSet {
    id: number;
    classId: number;
    testSetId: string;
    testSetName: string;
    testSetSlug: string;
    collectionName?: string;
    totalQuestions: number;
    startDate: string | null;
    endDate: string | null;
    assignedBy: number;
    isActive: boolean;
    status: number;
    createdDate: string;
    modifiedDate: string;
}

export interface AssignTestSetsToClassesRequest {
    classIds: number[];
    testSets: {
        testSetId: string;
        startDate: string | null;
        endDate: string | null;
    }[];
}

export interface UpdateAssignmentRequest {
    startDate?: string | null;
    endDate?: string | null;
    isActive?: boolean;
}

export interface ApiResponse<T> {
    status: number;
    message: string;
    data: T;
    errorCode?: string;
}

export interface GetClassTestSetsOptions {
    page?: number;
    limit?: number;
}

export interface GetClassTestSetsResult {
    content: IClassTestSet[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
}

// ================================================================
//  API FUNCTIONS
// ================================================================

/**
 * Gán nhiều test sets cho nhiều lớp
 * POST /test-sets/assign-to-classes
 */
export const assignTestSetsToClasses = async (
    data: AssignTestSetsToClassesRequest,
    teacherId: number
): Promise<ApiResponse<number[]>> => {
    const response = await handleRequest(
        postJsonData(
            `${QUESTION_BANK_SERVICE_PREFIX}/test-sets/assign-to-classes`,
            data,
            {
                headers: {
                    'X-User-Id': teacherId.toString()
                }
            }
        )
    );
    const result = (await response.json()) as ApiResponse<number[]>;

    if (result.status !== 201) {
        const rawMessage = result.message || "Gán bài test thất bại";
        const formattedMessage = rawMessage.includes(":")
            ? rawMessage.split(":").slice(1).join(":").trim()
            : rawMessage;
        throw new Error(formattedMessage);
    }

    return result;
};

/**
 * Lấy danh sách test sets của một lớp (có phân trang)
 * GET /test-sets/by-class/{classId}
 */
export const getTestSetsByClassId = async (
    classId: number,
    options: GetClassTestSetsOptions = {}
): Promise<GetClassTestSetsResult> => {
    const currentPage = options.page || 1;
    const entriesPerPage = options.limit || 10;

    const params = {
        page: currentPage - 1,
        size: entriesPerPage,
    };

    const response = await handleRequest(
        getWithParams(
            `${QUESTION_BANK_SERVICE_PREFIX}/test-sets/by-class/${classId}`,
            params
        )
    );

    const apiResponse = (await response.json()) as ApiResponse<{
        content: IClassTestSet[];
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
        throw new Error(apiResponse.message || "Không thể tải danh sách bài test.");
    }
};

/**
 * Lấy tất cả test sets của lớp (không phân trang)
 * GET /test-sets/by-class/{classId}/all
 */
export const getAllTestSetsByClassId = async (
    classId: number
): Promise<ApiResponse<IClassTestSet[]>> => {
    const response = await handleRequest(
        get(`${QUESTION_BANK_SERVICE_PREFIX}/test-sets/by-class/${classId}/all`)
    );
    const result = (await response.json()) as ApiResponse<IClassTestSet[]>;

    if (result.status === 200) {
        return result;
    } else {
        throw new Error(result.message || "Không thể tải danh sách bài test.");
    }
};

/**
 * Lấy các test sets đang active của lớp
 * GET /test-sets/by-class/{classId}/active
 */
export const getActiveTestSetsByClassId = async (
    classId: number
): Promise<ApiResponse<IClassTestSet[]>> => {
    const response = await handleRequest(
        get(`${QUESTION_BANK_SERVICE_PREFIX}/test-sets/by-class/${classId}/active`)
    );
    const result = (await response.json()) as ApiResponse<IClassTestSet[]>;

    if (result.status === 200) {
        return result;
    } else {
        throw new Error(result.message || "Không thể tải danh sách bài test active.");
    }
};

/**
 * Lấy chi tiết một assignment
 * GET /test-sets/assignments/{assignmentId}
 */
export const getAssignmentById = async (
    assignmentId: number
): Promise<ApiResponse<IClassTestSet>> => {
    const response = await handleRequest(
        get(`${QUESTION_BANK_SERVICE_PREFIX}/test-sets/assignments/${assignmentId}`)
    );
    const result = (await response.json()) as ApiResponse<IClassTestSet>;

    if (result.status === 200) {
        return result;
    } else {
        throw new Error(result.message || "Không thể tải thông tin assignment.");
    }
};

/**
 * Cập nhật assignment
 * PATCH /test-sets/assignments/{assignmentId}
 */
export const updateAssignment = async (
    assignmentId: number,
    data: UpdateAssignmentRequest
): Promise<ApiResponse<number>> => {
    const response = await handleRequest(
        patchJsonData(
            `${QUESTION_BANK_SERVICE_PREFIX}/test-sets/assignments/${assignmentId}`,
            data
        )
    );
    const result = (await response.json()) as ApiResponse<number>;

    if (result.status !== 200) {
        throw new Error(result.message || "Cập nhật assignment thất bại.");
    }

    return result;
};

/**
 * Gỡ một test set khỏi lớp (soft delete)
 * DELETE /test-sets/by-class/{classId}/test-set/{testSetId}
 */
export const removeTestSetFromClass = async (
    classId: number,
    testSetId: string
): Promise<ApiResponse<void>> => {
    const response = await handleRequest(
        del(`${QUESTION_BANK_SERVICE_PREFIX}/test-sets/by-class/${classId}/test-set/${testSetId}`)
    );
    const result = (await response.json()) as ApiResponse<void>;

    if (result.status !== 200) {
        throw new Error(result.message || "Gỡ bài test thất bại.");
    }

    return result;
};

/**
 * Gỡ nhiều test sets khỏi lớp
 * DELETE /test-sets/by-class/{classId}/test-sets
 */
export const removeTestSetsFromClass = async (
    classId: number,
    testSetIds: string[]
): Promise<ApiResponse<void>> => {
    const response = await handleRequest(
        del(`${QUESTION_BANK_SERVICE_PREFIX}/test-sets/by-class/${classId}/test-sets`, {
            body: JSON.stringify(testSetIds),
            headers: {
                'Content-Type': 'application/json'
            }
        })
    );
    const result = (await response.json()) as ApiResponse<void>;

    if (result.status !== 200) {
        throw new Error(result.message || "Gỡ các bài test thất bại.");
    }

    return result;
};

/**
 * Xóa vĩnh viễn assignment
 * DELETE /test-sets/assignments/{assignmentId}
 */
export const deleteAssignment = async (
    assignmentId: number
): Promise<ApiResponse<void>> => {
    const response = await handleRequest(
        del(`${QUESTION_BANK_SERVICE_PREFIX}/test-sets/assignments/${assignmentId}`)
    );
    const result = (await response.json()) as ApiResponse<void>;

    if (result.status !== 200) {
        throw new Error(result.message || "Xóa assignment thất bại.");
    }

    return result;
};

/**
 * Lấy danh sách lớp được gán một test set
 * GET /test-sets/{testSetId}/classes
 */
export const getClassesByTestSetId = async (
    testSetId: string
): Promise<ApiResponse<IClassTestSet[]>> => {
    const response = await handleRequest(
        get(`${QUESTION_BANK_SERVICE_PREFIX}/test-sets/${testSetId}/classes`)
    );
    const result = (await response.json()) as ApiResponse<IClassTestSet[]>;

    if (result.status === 200) {
        return result;
    } else {
        throw new Error(result.message || "Không thể tải danh sách lớp.");
    }
};
