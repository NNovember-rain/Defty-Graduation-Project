import handleRequest from "./handleRequest.ts"
import { getWithParams } from "./getWithParams.ts"
import { get, postJsonData, patchJsonData, putJsonData } from "./request.ts"

const PREFIX_SUBMISSIONS = import.meta.env.VITE_PREFIX_SUBMISSIONS as string

export interface GetSubmissionsOptions {
    page?: number
    limit?: number
    studentName?: string
    studentCode?: string
    assignmentTitle?: string
    umlType?: string
    classCode?: string
    submissionStatus?: "SUBMITTED" | "PROCESSING" | "COMPLETED" | "REVIEWED" | "FAILED"
    fromDate?: string
    toDate?: string
    sortBy?: string
    sortOrder?: "asc" | "desc"
}

export interface GetSubmissionsResult {
    submissions: ISubmission[]
    total: number
    page: number
    limit: number
}

export interface ISubmission {
    id: number
    studentName: string
    studentCode?: string
    assignmentTitle: string
    umlType?: string
    classCode: string
    createdDate: string
    submissionStatus: "SUBMITTED" | "PROCESSING" | "COMPLETED" | "REVIEWED" | "FAILED"
}

export interface SubmissionDetailResponse {
    id: number
    studentCode: string
    studentName: string
    assignmentTitle: string
    typeUml: string
    classCode: string
    createdDate: Date
    submissionStatus: "SUBMITTED" | "PROCESSING" | "COMPLETED" | "REVIEWED" | "FAILED"
    studentPlantUMLCode: string
    solutionCode: string
    score?: number // Thêm điểm số để hiển thị
}

// Updated interfaces to match backend structure
export interface FeedbackAIResponse {
    id: number
    submissionId: number
    feedback: { [key: string]: any } // Map<String, Object> từ backend
    aiModalName: string
    // Removed: content, score, strengths, weaknesses, suggestions, createdDate
}

export interface FeedbackTeacherRequest {
    submissionId: number
    content: string
    score?: number
    comments?: string
}

export interface FeedbackTeacherResponse {
    id: number
    createdDate: Date
    updatedDate: Date
    feedback: string // Backend trả về "feedback" không phải "content"
    score?: number // Thêm score để hiển thị điểm số
    // Removed: submissionId, content, comments, teacherName
}

export const createSubmission = async (data: Omit<ISubmission, "id" | "createdDate">): Promise<ISubmission> => {
    const response = await handleRequest(postJsonData(`/${PREFIX_SUBMISSIONS}`, data))
    const result = await response.json()
    return { id: result.result, ...data } as ISubmission
}

export const getSubmissions = async (options: GetSubmissionsOptions = {}): Promise<GetSubmissionsResult> => {
    const params = {
        page: (options.page || 1) - 1,
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
    }

    const response = await handleRequest(getWithParams(`${PREFIX_SUBMISSIONS}`, params))
    const data = await response.json()
    return {
        submissions: data.result.content,
        total: data.result.totalElements,
        page: data.result.number + 1,
        limit: data.result.size,
    } as GetSubmissionsResult
}

export const getSubmissionDetail = async (id: string | number): Promise<SubmissionDetailResponse> => {
    const response = await handleRequest(get(`${PREFIX_SUBMISSIONS}/${id}`))
    const data = await response.json()
    return data.result as SubmissionDetailResponse
}

// Fixed feedback API functions to match your backend endpoints
export const getFeedbackAI = async (submissionId: string | number): Promise<FeedbackAIResponse> => {
    // Fixed: Changed from `/llm/${submissionId}` to `/feedback/llm/${submissionId}`
    const response = await handleRequest(get(`${PREFIX_SUBMISSIONS}/feedback/llm/${submissionId}`))
    const data = await response.json()
    return data.result as FeedbackAIResponse
}

export const addFeedbackTeacher = async (feedbackData: FeedbackTeacherRequest): Promise<number> => {
    // Fixed: Changed from `/teacher` to `/feedback/teacher`
    const response = await handleRequest(postJsonData(`${PREFIX_SUBMISSIONS}/feedback/teacher`, feedbackData))
    const data = await response.json()
    return data.result as number
}

export const updateFeedbackTeacher = async (
    feedbackId: number,
    feedbackData: FeedbackTeacherRequest
): Promise<string> => {
    // Fixed: Changed from `/teacher/${feedbackId}` to `/feedback/teacher/${feedbackId}`
    const response = await handleRequest(patchJsonData(`${PREFIX_SUBMISSIONS}/feedback/teacher/${feedbackId}`, feedbackData))
    const data = await response.json()
    return data.result as string
}

export const getFeedbackTeacher = async (submissionId: string | number): Promise<FeedbackTeacherResponse> => {
    // Fixed: Changed from `/teacher/${submissionId}` to `/feedback/teacher/${submissionId}`
    const response = await handleRequest(get(`${PREFIX_SUBMISSIONS}/feedback/teacher/${submissionId}`))
    const data = await response.json()
    return data.result as FeedbackTeacherResponse
}

export const addScore = async (submissionId: string | number, point: number): Promise<string> => {
    // Sử dụng pattern nhất quán với các API khác trong file
    const response = await handleRequest(
        get(`${PREFIX_SUBMISSIONS}/score/${submissionId}?point=${point}`, {
            method: 'PUT'
        })
    )
    const data = await response.json()
    return data.result as string
}
