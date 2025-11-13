import handleRequest from "./handleRequest";
import { getWithParams } from "./getWithParams";

const PREFIX_SUBMISSIONS = import.meta.env.VITE_PREFIX_SUBMISSIONS || '';
const EXCEL_JOB_ENTRY_PATH = '/excel-job-entry';

export interface IAutoFeedbackLLMEntry {
    id: number;
    studentPlantUMLCode: string;
    feedBackLLM: string;
    studentInfo: string;
    createdDate: string;
    score?: number;
}

export interface GetAutoFeedbackLLMEntriesOptions {
    jobId: number;
    studentInfo?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    size?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface AutoFeedbackLLMEntriesResponse {
    content: IAutoFeedbackLLMEntry[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    first: boolean;
    last: boolean;
}

export const getAutoFeedbackLLMEntries = async (
    options: GetAutoFeedbackLLMEntriesOptions
): Promise<AutoFeedbackLLMEntriesResponse> => {
    const { jobId, ...params } = options;
    
    const queryParams: Record<string, string> = {};
    
    if (params.studentInfo) queryParams.studentInfo = params.studentInfo;
    if (params.fromDate) queryParams.fromDate = params.fromDate;
    if (params.toDate) queryParams.toDate = params.toDate;
    if (params.page !== undefined) queryParams.page = params.page.toString();
    if (params.size !== undefined) queryParams.size = params.size.toString();
    if (params.sortBy) queryParams.sortBy = params.sortBy;
    if (params.sortOrder) queryParams.sortOrder = params.sortOrder;

    const response = await handleRequest(
        getWithParams(`${PREFIX_SUBMISSIONS}${EXCEL_JOB_ENTRY_PATH}/${jobId}`, queryParams)
    );

    const data = await response.json();

    return {
        content: data.result.content || [],
        totalElements: data.result.totalElements || 0,
        totalPages: data.result.totalPages || 0,
        size: data.result.size || 10,
        number: data.result.number || 0,
        first: data.result.first || false,
        last: data.result.last || false,
    } as AutoFeedbackLLMEntriesResponse;
};

export interface IAutoFeedbackLLMJobDetail {
    title: string;
    typeUml: string;
    assignment: string;
    solutionCode: string;
    entries: IAutoFeedbackLLMEntry[];
}

export const getAutoFeedbackLLMJobDetail = async (jobId: number): Promise<IAutoFeedbackLLMJobDetail> => {
    const url = `${PREFIX_SUBMISSIONS}/excel-job/${jobId}`;
    
    const response = await handleRequest(getWithParams(url, {}));

    const data = await response.json();

    return {
        title: data.result.title || '',
        typeUml: data.result.typeUml || '',
        assignment: data.result.assignment || '',
        solutionCode: data.result.solutionCode || '',
        entries: data.result.entries || [],
    } as IAutoFeedbackLLMJobDetail;
};