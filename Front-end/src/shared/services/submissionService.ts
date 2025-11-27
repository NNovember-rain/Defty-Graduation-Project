import handleRequest from "./handleRequest.ts"
import { getWithParams } from "./getWithParams.ts"
import { get, postJsonData, patchJsonData} from "./request.ts"

const PREFIX_SUBMISSIONS = import.meta.env.VITE_PREFIX_SUBMISSIONS as string

export interface GetSubmissionsOptions {
    page?: number
    limit?: number
    studentId?: number
    assignmentId?: number
    classId?: number
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

export interface ISubmissionDetail {
    id: number
    assignmentId?: number
    moduleName?: string
    descriptionModule?: string
    studentName: string
    studentCode: string
    assignmentTitle: string
    descriptionAssignment?: string
    typeUml?: string
    studentPlantUMLCode: string
    solutionCode?: string 
    score?: number
    createdDate: string
}

export interface ISubmission {
    id: number
    assignmentId?: number
    studentName: string
    assignmentTitle: string
    studentPlantUMLCode: string
    score?: number
    createdDate: string
}

export type TypeUml = "CLASS_DIAGRAM" | "USE_CASE_DIAGRAM";

export interface SubmissionRequest {
    classId: number
    assignmentClassDetailId: number
    moduleId: number
    typeUml: TypeUml
    studentPlantUmlCode: string
    examMode: boolean
}


// JSON helper types for AI feedback
export type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];
export interface JsonObject { [key: string]: JsonValue }

// Updated interfaces to match backend structure
export interface FeedbackAIResponse {
    id: number
    submissionId: number
    feedback: JsonObject // Map<String, Object> từ backend
    aiModalName: string
}

export interface FeedbackTeacherRequest {
    submissionId: number
    content: string
    score?: number
    comments?: string
}

export interface FeedbackTeacherResponse {
    id: number
    content: string // Backend trả về "content" không phải "feedback"
    teacherId?: number | null
    avatar?: string // URL ảnh đại diện giáo viên
    fullName?: string // Tên đầy đủ của giáo viên
    imageUrl?: string // URL ảnh đại diện giáo viên (new field)
    createdDate: string | null  // API trả về null hoặc string
    updatedDate: string | null  // API trả về null hoặc string
    score?: number // Thêm score để hiển thị điểm số
}

// Response cho Last Submission trong Test Mode
export interface LastSubmissionResponse {
    id: number
    studentPlantUMLCode: string
    score?: number | null
    feedbackTeacherResponse?: FeedbackTeacherResponse[] // Danh sách feedback của giáo viên
    createdDate: string
    submissionStatus?: string
    moduleId?: number // THÊM: Module ID đã dùng khi nộp
    typeUmlId?: number // THÊM: Type UML ID đã dùng khi nộp
}

export const getSubmissionsByClassAndAssignment = async (
    classId: number,
    assignmentClassDetailId: number,
    options: GetSubmissionsOptions = {}
): Promise<GetSubmissionsResult> => {
    const params = {
        page: (options.page || 1) - 1,
        size: options.limit || 10,
        sortBy: options.sortBy || "createdDate",
        sortOrder: options.sortOrder || "desc",
    }

    const response = await handleRequest(
        getWithParams(`${PREFIX_SUBMISSIONS}/class/${classId}/assignmentClassDetail/${assignmentClassDetailId}`, params)
    )

    const data = await response.json()

    return {
        submissions: data.result.content,
        total: data.result.totalElements,
        page: data.result.number + 1,
        limit: data.result.size,
    } as GetSubmissionsResult
}


export const createSubmission = async (data: SubmissionRequest): Promise<number> => {
    const response = await handleRequest(postJsonData(`${PREFIX_SUBMISSIONS}`, data))
    const result = await response.json()
    return result.result as number
}

export const getSubmissions = async (options: GetSubmissionsOptions = {}): Promise<GetSubmissionsResult> => {
    const params = {
        page: (options.page || 1) - 1,
        size: options.limit,
        studentId: options.studentId,
        assignmentId: options.assignmentId,
        classId: options.classId,
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

export const getSubmissionDetail = async (id: string | number): Promise<ISubmissionDetail> => {
    const response = await handleRequest(get(`${PREFIX_SUBMISSIONS}/${id}`))
    const data = await response.json()
    return data.result as ISubmissionDetail
}

// Fixed feedback API functions to match your backend endpoints
export const getFeedbackAI = async (submissionId: string | number): Promise<FeedbackAIResponse> => {
    const response = await handleRequest(get(`${PREFIX_SUBMISSIONS}/feedback/llm/${submissionId}`))
    const data = await response.json()
    return data.result as FeedbackAIResponse
}

export const addFeedbackTeacher = async (feedbackData: FeedbackTeacherRequest): Promise<number> => {
    const response = await handleRequest(postJsonData(`${PREFIX_SUBMISSIONS}/feedback/teacher`, feedbackData))
    const data = await response.json()
    return data.result as number
}

export const updateFeedbackTeacher = async (
    feedbackId: number,
    feedbackData: FeedbackTeacherRequest
): Promise<string> => {
    const response = await handleRequest(patchJsonData(`${PREFIX_SUBMISSIONS}/feedback/teacher/${feedbackId}`, feedbackData))
    const data = await response.json()
    return data.result as string
}

export const getFeedbackTeacher = async (submissionId: string | number): Promise<FeedbackTeacherResponse[]> => {
    const response = await handleRequest(get(`${PREFIX_SUBMISSIONS}/feedback/teacher/${submissionId}`))
    const data = await response.json()
    return data.result as FeedbackTeacherResponse[]
}

export const addScore = async (submissionId: string | number, point: number): Promise<string> => {
    const response = await handleRequest(
        get(`${PREFIX_SUBMISSIONS}/score/${submissionId}?point=${point}`, {
            method: 'PUT'
        })
    )
    const data = await response.json()
    return data.result as string
}

// Updated to match new backend endpoint
export const getSubmissionHistory = async (
    classId: number,
    assignmentId: number,
    studentId: number,
    examMode: boolean = false,
    options: GetSubmissionsOptions = {}
): Promise<GetSubmissionsResult> => {
    const params = {
        page: (options.page || 1) - 1,
        size: options.limit || 10,
        sortBy: options.sortBy || "createdDate",
        sortOrder: options.sortOrder || "desc",
        examMode: examMode.toString()
    }

    const response = await handleRequest(
        getWithParams(`${PREFIX_SUBMISSIONS}/class/${classId}/assignment/${assignmentId}/student/${studentId}`, params)
    )
    const data = await response.json()
    
    return {
        submissions: data.result.content,
        total: data.result.totalElements,
        page: data.result.number + 1,
        limit: data.result.size,
    } as GetSubmissionsResult
}

export const getLastSubmissionExamMode = async (
    classId: number,
    assignmentId: number
): Promise<LastSubmissionResponse | null> => {
    try {
        const response = await handleRequest(get(`${PREFIX_SUBMISSIONS}/class/${classId}/assignment/${assignmentId}/last`))
        const data = await response.json()
        return data.result as LastSubmissionResponse
    } catch (error) {
        console.log('No submission found:', error)
        return null
    }
}
