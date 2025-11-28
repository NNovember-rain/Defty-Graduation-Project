import handleRequest from "../handleRequest";
import { getWithParams } from "../getWithParams";
import { del, get, patchJsonData, postFormData, putFormData } from "../request";
import type {IFileProcessing} from "./fileProcessingService";

const PREFIX_QUESTION_BANK_SERVICE = import.meta.env.VITE_PREFIX_QUESTION_BANK_SERVICE as string;
const PREFIX_QUESTION_GROUP = "/question-groups";

/* ========================
 * ENUMS
 * ======================== */
export enum DifficultyLevel {
    EASY = "EASY",
    MEDIUM = "MEDIUM",
    HARD = "HARD",
}

export enum ToeicPart {
    PART_1 = "PART_1",
    PART_2 = "PART_2",
    PART_3 = "PART_3",
    PART_4 = "PART_4",
    PART_5 = "PART_5",
    PART_6 = "PART_6",
    PART_7 = "PART_7",
    CUSTOM = "CUSTOM"
}

export enum FileType {
    IMAGE = "IMAGE",
    AUDIO = "AUDIO",
    VIDEO = "VIDEO",
    OTHER = "OTHER",
}

export enum Status {
    INACTIVE = 'INACTIVE',
    ACTIVE = 'ACTIVE',
    DELETED = 'DELETED',
}

/* ========================
 * INTERFACES
 * ======================== */

export interface GetQuestionGroupsOptions {
    page?: number;
    limit?: number;
    status?: Status;
    source?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';

    testSetIds?: string[];
    excludeTestSetIds?: string[];
    tagIds?: string[];
    questionPart?: string;
    difficulty?: string;
}

export interface GetQuestionGroupsResult {
    questionGroups: QuestionGroupResponse[];
    total: number;
    page: number;
    limit: number;
}

/** Tag interface - không có category */
export interface QuestionTagResponse {
    id: string;
    tagName: string;
    description?: string;
    status: number;
}

export interface AnswerResponse {
    id: string | undefined;
    tempKey: string;
    content: string;
    answerOrder: number;
    isCorrect: boolean;
    questionId: string;
    status: number;
}

export interface QuestionResponse {
    id: string | undefined;
    tempKey: string;
    questionNumber: number;
    questionText: string;
    difficulty: DifficultyLevel | null;
    questionGroupId: string;
    status: number;
    /** Danh sách câu trả lời */
    answers: AnswerResponse[];
    /** Thêm danh sách tags cho từng câu hỏi */
    tags: QuestionTagResponse[];
}

export interface FileResponse {
    id: string | undefined;
    tempKey: string;
    type: FileType;
    url: string;
    questionGroupId: string;
    displayOrder: number;
    status: number;
    name: string;
}

export interface QuestionGroupResponse {
    id: string | null;
    questionPart: ToeicPart;
    questionPartOrder: number;
    audioTranscript: string;
    explanation: string;
    passageText: string;
    difficulty: DifficultyLevel | null;
    notes: string;
    requiredImage: number;
    requiredAudio: boolean;
    status: number;
    createdAt: string;
    updatedAt: string;
    source: string;
    sourceFileProcessing: IFileProcessing,
    /** Thêm danh sách tags tổng hợp từ group */
    tags: QuestionTagResponse[];
    files: FileResponse[];
    questions: QuestionResponse[];
}

/* ========================
 * REQUEST INTERFACES
 * ======================== */

export interface QuestionGroupRequest {
    id: string | null;
    questionPart: ToeicPart;
    questionPartOrder?: number;
    audioTranscript?: string;
    explanation?: string;
    passageText?: string;
    difficulty: DifficultyLevel;
    notes?: string;
    requiredImage?: number;
    requiredAudio?: boolean;
}

export interface AnswerBulkRequest {
    id: string | null;
    content: string;
    answerOrder: number;
    isCorrect: boolean;
}

export interface QuestionBulkRequest {
    id: string | null;
    questionNumber: number;
    questionText: string;
    difficulty: DifficultyLevel;
    answers: AnswerBulkRequest[];
    tagIds: string[]
}

export interface FileBulkRequest {
    id: string | null;
    type: FileType;
    displayOrder?: number;
}

export interface QuestionGroupBulkRequest {
    id: string | null;
    questionGroup: QuestionGroupRequest;
    questions?: QuestionBulkRequest[];
    files?: FileBulkRequest[];
}

/* ========================
 * HELPER FUNCTIONS
 * ======================== */

const buildQuestionGroupFormData = (
    data: QuestionGroupBulkRequest,
    uploadedFiles?: File[]
): FormData => {
    const formData = new FormData();

    // SỬA ĐÂY: Tạo Blob với Content-Type là application/json
    const dataBlob = new Blob([JSON.stringify(data)], {
        type: 'application/json'
    });
    formData.append("data", dataBlob);

    if (uploadedFiles && uploadedFiles.length > 0) {
        uploadedFiles.forEach((file) => {
            formData.append("files", file);
        });
    }

    return formData;
};

/* ========================
 * API FUNCTIONS
 * ======================== */

export const getQuestionGroups = async (
    options: GetQuestionGroupsOptions = {}
): Promise<GetQuestionGroupsResult> => {
    const params = {
        page: (options.page || 1) - 1,
        limit: options.limit,
        status: options.status,
        source: options.source,
        sortBy: options.sortBy,
        sortOrder: options.sortOrder,
        testSetIds: options.testSetIds,
        excludeTestSetIds: options.excludeTestSetIds,
        tagIds: options.tagIds,
        questionPart: options.questionPart,
        difficulty: options.difficulty,
    };

    const response = await handleRequest(
        getWithParams(`${PREFIX_QUESTION_BANK_SERVICE}${PREFIX_QUESTION_GROUP}`, params)
    );
    const data = await response.json();

    return {
        questionGroups: data.data.content,
        total: data.data.totalElements,
        page: data.data.number + 1,
        limit: data.data.size,
    };
};

export const getQuestionGroupById = async (
    id: string
): Promise<QuestionGroupResponse> => {
    const response = await handleRequest(
        get(`${PREFIX_QUESTION_BANK_SERVICE}${PREFIX_QUESTION_GROUP}/${id}`)
    );
    const data = await response.json();
    return data.data as QuestionGroupResponse;
};

export const createQuestionGroup = async (
    data: QuestionGroupBulkRequest
): Promise<QuestionGroupResponse> => {
    const response = await handleRequest(
        postFormData(
            `${PREFIX_QUESTION_BANK_SERVICE}${PREFIX_QUESTION_GROUP}`,
            buildQuestionGroupFormData(data)
        )
    );
    const createdData = await response.json();
    return createdData.data as QuestionGroupResponse;
};

export const createQuestionGroupBulk = async (
    data: QuestionGroupBulkRequest,
    files?: File[]
): Promise<QuestionGroupResponse> => {
    const response = await handleRequest(
        postFormData(
            `${PREFIX_QUESTION_BANK_SERVICE}${PREFIX_QUESTION_GROUP}/bulk`,
            buildQuestionGroupFormData(data, files)
        )
    );
    const createdData = await response.json();
    return createdData.data as QuestionGroupResponse;
};

export const updateQuestionGroup = async (
    id: string,
    data: QuestionGroupBulkRequest
): Promise<QuestionGroupResponse> => {
    const response = await handleRequest(
        putFormData(
            `${PREFIX_QUESTION_BANK_SERVICE}${PREFIX_QUESTION_GROUP}/${id}`,
            buildQuestionGroupFormData(data)
        )
    );
    const updatedData = await response.json();
    return updatedData.data as QuestionGroupResponse;
};

export const updateQuestionGroupBulk = async (
    id: string,
    data: QuestionGroupBulkRequest,
    files?: File[]
): Promise<QuestionGroupResponse> => {
    const response = await handleRequest(
        putFormData(
            `${PREFIX_QUESTION_BANK_SERVICE}${PREFIX_QUESTION_GROUP}/${id}/bulk`,
            buildQuestionGroupFormData(data, files)
        )
    );
    const updatedData = await response.json();
    return updatedData.data as QuestionGroupResponse;
};

export const deleteQuestionGroup = async (id: string): Promise<void> => {
    await handleRequest(
        del(`${PREFIX_QUESTION_BANK_SERVICE}${PREFIX_QUESTION_GROUP}/${id}`)
    );
};

export const toggleQuestionGroupStatus = async (
    id: string
): Promise<QuestionGroupResponse> => {
    const response = await handleRequest(
        patchJsonData(
            `${PREFIX_QUESTION_BANK_SERVICE}${PREFIX_QUESTION_GROUP}/${id}/toggle-status`,
            {}
        )
    );
    const updatedData = await response.json();
    return updatedData.data as QuestionGroupResponse;
};

/* ========================
 * UTILITY FUNCTIONS
 * ======================== */

export const getStatusText = (status: string): string => {
    switch (status) {
        case Status.ACTIVE:
            return "Hoạt động";
        case Status.INACTIVE:
            return "Không hoạt động";
        case Status.DELETED:
            return "Đã xóa";
        default:
            return "Không xác định";
    }
};

export const getDifficultyText = (difficulty: DifficultyLevel): string => {
    switch (difficulty) {
        case DifficultyLevel.EASY:
            return "Dễ";
        case DifficultyLevel.MEDIUM:
            return "Trung bình";
        case DifficultyLevel.HARD:
            return "Khó";
        default:
            return "Không xác định";
    }
};

export const getToeicPartText = (part: ToeicPart): string => {
    switch (part) {
        case ToeicPart.PART_1:
            return "Part 1 - Mô tả tranh";
        case ToeicPart.PART_2:
            return "Part 2 - Hỏi đáp";
        case ToeicPart.PART_3:
            return "Part 3 - Đối thoại";
        case ToeicPart.PART_4:
            return "Part 4 - Bài nói chuyện";
        case ToeicPart.PART_5:
            return "Part 5 - Điền câu";
        case ToeicPart.PART_6:
            return "Part 6 - Điền đoạn văn";
        case ToeicPart.PART_7:
            return "Part 7 - Đọc hiểu";
        case ToeicPart.CUSTOM:
            return "Custom";
        default:
            return "Không xác định";
    }
};
export const getQuestionGroupByQuestionId = async (
    questionId: string
): Promise<QuestionGroupResponse> => {
    const response = await handleRequest(
        get(`${PREFIX_QUESTION_BANK_SERVICE}${PREFIX_QUESTION_GROUP}/accessible/by-question/${questionId}`)
    );
    const data = await response.json();
    return data.data as QuestionGroupResponse;
};