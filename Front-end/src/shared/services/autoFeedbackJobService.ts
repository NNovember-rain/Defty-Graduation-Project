import handleRequest from "./handleRequest";
import { postFormData, del } from "./request";
import { getWithParams } from "./getWithParams";

// Endpoint đầy đủ: submission/excel-job
const PREFIX_SUBMISSIONS = import.meta.env.VITE_PREFIX_SUBMISSIONS as string;
const EXCEL_JOB_PATH = "excel-job";

export type TypeUml = "CLASS" | "USE_CASE";

export interface IAutoFeedbackJob {
    id: number;
    title: string;
    typeUml: TypeUml;
    assignment: string;
    solutionCode: string;
    createdDate: string;
}

export interface GetAutoFeedbackJobsOptions {
    page?: number;
    size?: number;
    title?: string;
    typeUml?: TypeUml;
    fromDate?: string;
    toDate?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}

export interface GetAutoFeedbackJobsResult {
    jobs: IAutoFeedbackJob[];
    total: number;
    page: number;
    size: number;
}

/**
 * Lấy danh sách Auto Feedback Jobs
 */
export const getAutoFeedbackJobs = async (
    options: GetAutoFeedbackJobsOptions = {}
): Promise<GetAutoFeedbackJobsResult> => {
    const params: Record<string, any> = {
        page: (options.page || 1) - 1,
        size: options.size || 10,
        sortBy: options.sortBy || "createdDate",
        sortOrder: options.sortOrder || "desc",
    };

    if (options.title) {
        params.title = options.title;
    }

    if (options.typeUml) {
        params.typeUml = options.typeUml;
    }

    if (options.fromDate) {
        params.fromDate = options.fromDate;
    }

    if (options.toDate) {
        params.toDate = options.toDate;
    }

    const response = await handleRequest(
        getWithParams(`${PREFIX_SUBMISSIONS}/${EXCEL_JOB_PATH}`, params)
    );

    const data = await response.json();

    return {
        jobs: data.result.content || [],
        total: data.result.totalElements || 0,
        page: data.result.number + 1,
        size: data.result.size || 10,
    } as GetAutoFeedbackJobsResult;
};

/**
 * Upload file Excel để tạo Auto Feedback Job
 */
export const uploadAutoFeedbackJob = async (file: File): Promise<number> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await handleRequest(
        postFormData(`${PREFIX_SUBMISSIONS}/${EXCEL_JOB_PATH}`, formData)
    );

    const data = await response.json();
    return data.result as number;
};

/**
 * Xóa Auto Feedback Job theo ID
 */
export const deleteAutoFeedbackJob = async (id: number): Promise<any> => {
    const response = await handleRequest(
        del(`${PREFIX_SUBMISSIONS}/${EXCEL_JOB_PATH}/${id}`)
    );
    const data = await response.json();
    return data.result;
};
