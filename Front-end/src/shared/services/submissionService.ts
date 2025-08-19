import handleRequest from "./handleRequest.ts";
import { getWithParams } from "./getWithParams.ts";
import { get, postJsonData } from "./request.ts";

const PREFIX_SUBMISSIONS = import.meta.env.VITE_PREFIX_SUBMISSIONS as string;

export interface GetSubmissionsOptions {
    page?: number;
    limit?: number;
    studentName?: string;
    studentCode?: string;
    assignmentTitle?: string;
    umlType?: string;
    classCode?: string;
    submissionStatus?: 'SUBMITTED' |'PROCESSING' |'COMPLETED' | 'REVIEWED' | 'FAILED';
    fromDate?: string;
    toDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface GetSubmissionsResult {
    submissions: ISubmission[];
    total: number;
    page: number;
    limit: number;
}

export interface ISubmission {
    id: number;
    studentName: string;
    studentCode?: string;
    assignmentTitle: string;
    umlType?: string;
    classCode: string;
    createdDate: string;
    submissionStatus: 'SUBMITTED' |'PROCESSING' |'COMPLETED' | 'REVIEWED' | 'FAILED';
}

export interface CreateSubmissionRequest {
    studentId: number;
    classId: number;
    assignmentId: number;
    studentPlantUmlCode: string;
}

export const createSubmission = async (data: CreateSubmissionRequest): Promise<ISubmission> => {
    const response = await handleRequest(postJsonData(`${PREFIX_SUBMISSIONS}`, data));
    const result = await response.json();

    return {
        id: result.result,
        studentName: 'N/A', // Placeholder, as backend doesn't require this in request
        studentCode: 'N/A', // Placeholder
        assignmentTitle: 'N/A', // Placeholder
        umlType: 'N/A', // Placeholder
        classCode: String(data.classId),
        createdDate: new Date().toISOString(), // Use current date as placeholder
        submissionStatus: 'SUBMITTED',
        ...data
    } as ISubmission;
};

export const getSubmissions = async (options: GetSubmissionsOptions = {}): Promise<GetSubmissionsResult> => {
    const params = {
        page: (options.page || 1) - 1, // API sử dụng 0-based indexing
        size: options.limit,
        studentName: options.studentName,
        studentCode: options.studentCode,
        assignmentTitle: options.assignmentTitle,
        umlType: options.umlType,
        classCode: options.classCode,
        submissionStatus: options.submissionStatus,
        fromDate: options.fromDate,
        toDate: options.toDate,
        sortBy: options.sortBy,
        sortOrder: options.sortOrder,
    };

    const response = await handleRequest(getWithParams(`${PREFIX_SUBMISSIONS}`, params));
    const data = await response.json();
    return {
        submissions: data.result.content,
        total: data.result.totalElements,
        page: data.result.number + 1, // Chuyển về 1-based indexing
        limit: data.result.size,
    } as GetSubmissionsResult;

};

export const getSubmissionById = async (id: string | number): Promise<ISubmission> => {
    const response = await handleRequest(get(`/${PREFIX_SUBMISSIONS}/${id}`));
    const data = await response.json();
    return data.result as ISubmission;
};