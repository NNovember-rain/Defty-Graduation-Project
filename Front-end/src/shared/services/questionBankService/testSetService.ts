import {
    get,
    postJsonData,
    del,
    patchJsonData,
    putJsonData,
} from "../request";
import { getWithParams } from "../getWithParams";
import handleRequest from "../handleRequest";
import type { QuestionGroupResponse } from "./questionGroupService";

const QUESTION_BANK_SERVICE_PREFIX: string = import.meta.env
    .VITE_PREFIX_QUESTION_BANK_SERVICE as string;

// ================================================================
//  INTERFACES
// ================================================================

export interface ITestSet {
    id: string;
    testName: string;
    slug: string;
    testNumber?: number;
    description?: string;
    totalQuestions?: number;
    collectionId: string;
    collectionName?: string;
    duration?: number;
    directionSetId?: string;
    createdDate: string | null;
    createdBy: string | null;
    modifiedDate: string | null;
    modifiedBy: string | null;
    status: number;
    isPublic: boolean | null;
    isTaken: boolean | null;
}

export interface IPublicTestSet extends ITestSet {
    attemptCount: number;
    commentCount: number;
}

export type CreateTestSetRequest = Omit<
    ITestSet,
    | "id"
    | "createdDate"
    | "createdBy"
    | "modifiedDate"
    | "modifiedBy"
    | "status"
    | "collectionName"
>;

export type UpdateTestSetRequest = Partial<CreateTestSetRequest>;

export interface GetTestSetsOptions {
    page?: number;
    limit?: number;
    testName?: string;
    slug?: string;
    collectionId?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    status?: number;
}

export interface GetTestSetsResult {
    content: ITestSet[] | IPublicTestSet[];
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

/** Danh sách ID + thứ tự của các nhóm câu hỏi trong bài test */
export interface TestSetQuestionOrder {
    questionGroupId: string;
    questionPartOrder: number | null;
}

// ================================================================
//  NEW INTERFACES FOR OVERVIEW & QUESTIONS
// ================================================================

export interface TestSetOverviewResponse {
    id: string;
    testName: string;
    slug: string;
    testNumber?: number;
    description?: string;
    collectionName?: string;
    totalQuestions: number;
    duration?: number;
    isTaken: boolean;
    attemptCount: number;
    commentCount: number;
    partQuestionCount: Record<string, number>; // { "PART_1": 6, "PART_2": 25, ... }
}

export interface FileMinimalDTO {
    id: string;
    url: string;
    fileType: string;
    displayOrder: number;
}

export interface AnswerMinimalDTO {
    id: string;
    content: string;
    answerOrder: number;
    // Không có isCorrect khi user làm bài
}

export interface QuestionMinimalDTO {
    id: string;
    questionNumber: number;
    questionText: string;
    answers: AnswerMinimalDTO[];
}

export interface QuestionGroupMinimalDTO {
    id: string;
    questionPart: string;
    audioTranscript?: string;
    passageText?: string;
    files: FileMinimalDTO[];
    questions: QuestionMinimalDTO[];
}

export interface TestSetQuestionsResponse {
    collectionId: string,
    testSetId: string;
    testName: string;
    questionGroups: QuestionGroupMinimalDTO[];
}

// ================================================================
//  CRUD OPERATIONS FOR TEST SETS
// ================================================================

export const createTestSet = async (
    data: CreateTestSetRequest
): Promise<ApiResponse<string>> => {
    const response = await handleRequest(
        postJsonData(`${QUESTION_BANK_SERVICE_PREFIX}/test-sets`, data)
    );
    const result = (await response.json()) as ApiResponse<string>;

    if (result.status !== 201) {
        const rawMessage = result.message || "Tạo bài test thất bại";
        const formattedMessage = rawMessage.includes(":")
            ? rawMessage.split(":").slice(1).join(":").trim()
            : rawMessage;

        throw new Error(formattedMessage);
    }

    return result;
};

export const updateTestSet = async (
    id: string,
    data: UpdateTestSetRequest
): Promise<ApiResponse<string>> => {
    const response = await handleRequest(
        putJsonData(`${QUESTION_BANK_SERVICE_PREFIX}/test-sets/${id}`, data)
    );
    const result = (await response.json()) as ApiResponse<string>;

    if (result.status !== 200) {
        throw new Error(result.message || "Cập nhật bài test thất bại");
    }

    return result;
};

export const getTestSets = async (
    options: GetTestSetsOptions = {}
): Promise<GetTestSetsResult> => {
    const currentPage = options.page || 1;
    const entriesPerPage = options.limit || 10;
    const params = {
        page: currentPage - 1,
        size: entriesPerPage,
        test_name: options.testName,
        slug: options.slug,
        collection_id: options.collectionId,
        sort:
            options.sortBy && options.sortOrder
                ? `${options.sortBy},${options.sortOrder}`
                : undefined,
        status: options.status !== undefined ? options.status : undefined,
    };

    const response = await handleRequest(
        getWithParams(`${QUESTION_BANK_SERVICE_PREFIX}/test-sets`, params)
    );
    const apiResponse = (await response.json()) as ApiResponse<{
        content: ITestSet[];
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
        throw new Error(apiResponse.message || "Failed to fetch test sets.");
    }
};

export const getTestSetById = async (id: string): Promise<ITestSet> => {
    const response = await handleRequest(
        get(`${QUESTION_BANK_SERVICE_PREFIX}/test-sets/${id}`)
    );
    const data = (await response.json()) as ApiResponse<ITestSet>;

    if (data.status === 200 && data.data) {
        return data.data;
    } else {
        throw new Error(data.message || "Failed to fetch test set.");
    }
};

export const deleteTestSet = async (
    ids: string | string[]
): Promise<ApiResponse<void>> => {
    const pathIds = Array.isArray(ids) ? ids.join(",") : ids;
    const response = await handleRequest(
        del(`${QUESTION_BANK_SERVICE_PREFIX}/test-sets/${pathIds}`)
    );
    return (await response.json()) as ApiResponse<void>;
};

export const toggleTestSetStatus = async (
    id: string
): Promise<ApiResponse<string>> => {
    const response = await handleRequest(
        patchJsonData(`${QUESTION_BANK_SERVICE_PREFIX}/test-sets/toggle-status/${id}`, {})
    );
    const result = (await response.json()) as ApiResponse<string>;

    if (result.status !== 200) {
        throw new Error(result.message || "Failed to toggle test set status.");
    }

    return result;
};

export const getAllActiveTestSets = async (): Promise<
    ApiResponse<ITestSet[]>
> => {
    const response = await handleRequest(
        get(`${QUESTION_BANK_SERVICE_PREFIX}/test-sets/active`)
    );
    const result = (await response.json()) as ApiResponse<ITestSet[]>;

    if (result.status === 200) {
        return result;
    } else {
        throw new Error(result.message || "Failed to fetch active test sets.");
    }
};

export const getTestSetsByCollection = async (
    collectionId: string
): Promise<ApiResponse<ITestSet[]>> => {
    const response = await handleRequest(
        get(`${QUESTION_BANK_SERVICE_PREFIX}/test-sets/collection/${collectionId}`)
    );
    const result = (await response.json()) as ApiResponse<ITestSet[]>;

    if (result.status === 200) {
        return result;
    } else {
        throw new Error(result.message || "Failed to fetch test sets by collection.");
    }
};

// ================================================================
//  QUESTION GROUPS MANAGEMENT INSIDE TEST SET
// ================================================================

/**
 * Gán thêm danh sách nhóm câu hỏi vào bài test
 * POST /test-sets/{testSetId}/question-groups
 */
export const addQuestionGroupsToTestSet = async (
    testSetId: string,
    payload: { questionGroupId: string; questionPartOrder: number | null }[]
): Promise<ApiResponse<string[]>> => {
    const response = await handleRequest(
        postJsonData(
            `${QUESTION_BANK_SERVICE_PREFIX}/test-sets/${testSetId}/question-groups`,
            payload
        )
    );
    const result = (await response.json()) as ApiResponse<string[]>;

    if (result.status !== 201) {
        throw new Error(result.message || "Thêm nhóm câu hỏi vào bài test thất bại");
    }

    return result;
};

export const updateQuestionGroupOrders = async (
    testSetId: string,
    payload: { questionGroupId: string; questionPartOrder: number | null }[]
): Promise<void> => {
    const response = await handleRequest(
        patchJsonData(
            `${QUESTION_BANK_SERVICE_PREFIX}/test-sets/${testSetId}/question-groups`,
            payload
        )
    );

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Không thể cập nhật thứ tự nhóm câu hỏi");
    }
};

/**
 * Lấy danh sách nhóm câu hỏi trong bài test
 * GET /test-sets/{testSetId}/question-groups
 */
export interface GetTestSetQuestionGroupsOptions {
    page?: number;
    limit?: number;
    tagIds?: string[];
    questionPart?: string;
    difficulty?: string;
}

export interface GetTestSetQuestionGroupsResult {
    content: QuestionGroupResponse[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
}

export const getQuestionGroupsOfTestSet = async (
    testSetId: string,
    options: GetTestSetQuestionGroupsOptions = {}
): Promise<GetTestSetQuestionGroupsResult> => {
    const currentPage = options.page || 1;
    const entriesPerPage = options.limit || 10;

    const params = {
        page: currentPage - 1,
        limit: entriesPerPage,
        tagIds: options.tagIds?.join(","),
        questionPart: options.questionPart,
        difficulty: options.difficulty,
    };

    const response = await handleRequest(
        getWithParams(
            `${QUESTION_BANK_SERVICE_PREFIX}/test-sets/${testSetId}/question-groups`,
            params
        )
    );

    const apiResponse = (await response.json()) as ApiResponse<{
        content: QuestionGroupResponse[];
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
        throw new Error(
            apiResponse.message || "Không thể tải danh sách nhóm câu hỏi."
        );
    }
};

/**
 * Xóa danh sách nhóm câu hỏi khỏi bài test
 * DELETE /test-sets/{testSetId}/question-groups?ids=uuid1,uuid2,...
 */
export const removeQuestionGroupsFromTestSet = async (
    testSetId: string,
    questionGroupIds: string[]
): Promise<ApiResponse<void>> => {
    const idsParam = questionGroupIds.join(",");
    const response = await handleRequest(
        del(`${QUESTION_BANK_SERVICE_PREFIX}/test-sets/${testSetId}/question-groups/${idsParam}`)
    );

    const result = (await response.json()) as ApiResponse<void>;

    if (result.status !== 200) {
        throw new Error(result.message || "Xóa nhóm câu hỏi khỏi bài test thất bại");
    }

    return result;
};

// ================================================================
//  TEST SET OVERVIEW & QUESTIONS (FOR TAKING TEST)
// ================================================================

/**
 * Lấy thông tin tổng quan của bài test (cho màn chọn chế độ)
 * GET /test-sets/{id}/overview
 */
export const getTestSetOverview = async (
    slug: string
): Promise<ApiResponse<TestSetOverviewResponse>> => {
    const response = await handleRequest(
        get(`${QUESTION_BANK_SERVICE_PREFIX}/test-sets/accessible/${slug}/overview`)
    );
    const result = (await response.json()) as ApiResponse<TestSetOverviewResponse>;

    if (result.status === 200) {
        return result;
    } else {
        throw new Error(result.message || "Không thể tải thông tin bài test.");
    }
};

/**
 * Lấy câu hỏi của bài test (cho màn làm bài)
 * GET /test-sets/{slug}/questions?parts=PART_1,PART_2
 */
export const getTestSetQuestions = async (
    slug: string,
    parts?: string[]
): Promise<ApiResponse<TestSetQuestionsResponse>> => {
    const params = parts && parts.length > 0
        ? { parts: parts.join(",") }
        : {};

    const response = await handleRequest(
        getWithParams(`${QUESTION_BANK_SERVICE_PREFIX}/test-sets/accessible/${slug}/questions`, params)
    );
    const result = (await response.json()) as ApiResponse<TestSetQuestionsResponse>;

    if (result.status === 200) {
        return result;
    } else {
        throw new Error(result.message || "Không thể tải câu hỏi bài test.");
    }
};

/**
 * Lấy câu hỏi của bài test theo ID
 * GET /test-sets/accessible/{testSetId}/questions?parts=PART_1,PART_2
 */
export const getTestSetQuestionsByTestSetId = async (
    testSetId: string,
    parts?: string[]
): Promise<ApiResponse<TestSetQuestionsResponse>> => {
    const params = parts && parts.length > 0
        ? { parts: parts.join(",") }
        : {};

    const response = await handleRequest(
        getWithParams(`${QUESTION_BANK_SERVICE_PREFIX}/test-sets/accessible/testSet/${testSetId}/questions`, params)
    );
    const result = (await response.json()) as ApiResponse<TestSetQuestionsResponse>;

    if (result.status === 200) {
        return result;
    } else {
        throw new Error(result.message || "Không thể tải cấu trúc bài test.");
    }
};

export const getQuestionGroupOrders = async (
    testSetId: string
): Promise<TestSetQuestionOrder[]> => {
    const response = await handleRequest(
        get(`${QUESTION_BANK_SERVICE_PREFIX}/test-sets/accessible/${testSetId}/question-groups/orders`)
    );
    const data = await response.json();
    return data.data as TestSetQuestionOrder[];
};

export const toggleTestSetPublic = async (
    id: string
): Promise<ApiResponse<string>> => {
    const response = await handleRequest(
        patchJsonData(`${QUESTION_BANK_SERVICE_PREFIX}/test-sets/toggle-public/${id}`, {})
    );
    const result = (await response.json()) as ApiResponse<string>;

    if (result.status !== 200) {
        throw new Error(result.message || "Failed to toggle test set public status.");
    }

    return result;
};

export const getPublicTestSets = async (
    options: GetTestSetsOptions = {}
): Promise<GetTestSetsResult> => {
    const currentPage = options.page || 1;
    const entriesPerPage = options.limit || 10;

    const params = {
        page: currentPage - 1,
        size: entriesPerPage,
        test_name: options.testName,
        collection_id: options.collectionId,
        sort:
            options.sortBy && options.sortOrder
                ? `${options.sortBy},${options.sortOrder}`
                : "createdDate,desc",
    };

    const response = await handleRequest(
        getWithParams(`${QUESTION_BANK_SERVICE_PREFIX}/test-sets/accessible`, params)
    );
    const apiResponse = (await response.json()) as ApiResponse<{
        content: IPublicTestSet[];
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
        throw new Error(apiResponse.message || "Không thể tải danh sách bài test công khai.");
    }
};