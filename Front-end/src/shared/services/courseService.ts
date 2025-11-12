import {
    get,
    postJsonData,
    del,
    patchJsonData,
} from "./request";
import { getWithParams } from "./getWithParams";
import handleRequest from "./handleRequest";

const CLASS_SERVICE_PREFIX: string = import.meta.env.VITE_PREFIX_CLASS_SERVICE as string;

export interface ICourse {
    id: number;
    courseName: string;
    description: string | null;
    status: number;
    collectionIds?: string[];
    // Các trường từ BaseEntity
    createdDate: string | null;
    createdBy: string | null;
    modifiedDate: string | null;
    modifiedBy: string | null;
}

export type CreateCourseRequest = Omit<ICourse, 'id' | 'createdDate' | 'createdBy' | 'modifiedDate' | 'modifiedBy' | 'status'>;
export type UpdateCourseRequest = Partial<CreateCourseRequest>;

// --- Định nghĩa Interfaces cho Phân trang và Kết quả API ---
export interface GetCoursesOptions {
    page?: number;
    limit?: number;
    courseName?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    status?: number;
}

export interface GetCoursesResult {
    content: ICourse[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
}

export interface ApiResponse<T> {
    code: number;
    message: string;
    result: T;
    errorCode?: string;
}

// --- Các hàm gọi API cho Quản lý Khóa học ---
export const createCourse = async (data: CreateCourseRequest): Promise<ApiResponse<number>> => {
    const response = await handleRequest(postJsonData(`${CLASS_SERVICE_PREFIX}/course`, data));
    const result = await response.json() as ApiResponse<number>;

    if (result.code !== 201) {
        const rawMessage = result.message || 'Tạo khóa học thất bại';
        const formattedMessage = rawMessage.includes(':')
            ? rawMessage.split(':').slice(1).join(':').trim()
            : rawMessage;

        console.log(formattedMessage);
        throw new Error(formattedMessage);
    }

    return result;
};

export const updateCourse = async (id: number, data: UpdateCourseRequest): Promise<ApiResponse<number>> => {
    console.log(data);
    const response = await handleRequest(patchJsonData(`${CLASS_SERVICE_PREFIX}/course/${id}`, data));
    const result = await response.json() as ApiResponse<number>;

    // Kiểm tra status trong ApiResponse thay vì HTTP status
    if (result.code !== 200) {
        throw new Error(result.message || 'Cập nhật khóa học thất bại');
    }

    return result;
};

export const getCourses = async (options: GetCoursesOptions = {}): Promise<GetCoursesResult> => {
    const currentPage = options.page || 1;
    const entriesPerPage = options.limit || 10;
    const params = {
        page: currentPage - 1,
        size: entriesPerPage,
        course_name: options.courseName,
        sort: options.sortBy && options.sortOrder ? `${options.sortBy},${options.sortOrder}` : undefined,
        status: options.status !== undefined ? options.status : undefined
    };

    const response = await handleRequest(getWithParams(`${CLASS_SERVICE_PREFIX}/course`, params));

    const apiResponse = await response.json() as ApiResponse<{ content: ICourse[], totalElements: number }>;

    if (apiResponse.code === 200 && apiResponse.result) {
        const totalElements = apiResponse.result.totalElements || 0;
        const totalPages = Math.ceil(totalElements / entriesPerPage);

        return {
            content: apiResponse.result.content || [],
            totalElements: totalElements,
            totalPages: totalPages,
            number: currentPage - 1,
            size: entriesPerPage,
        } as GetCoursesResult;
    } else {
        throw new Error(apiResponse.message || "Failed to fetch courses.");
    }
};

export const getCourseById = async (id: number): Promise<ICourse> => {
    const response = await handleRequest(get(`${CLASS_SERVICE_PREFIX}/course/${id}`));
    const data = await response.json() as ApiResponse<ICourse>;

    console.log("Dữ liệu khóa học trả về:", data);

    if (data.code === 200 && data.result) {
        return data.result;
    } else {
        throw new Error(data.message || "Failed to fetch course.");
    }
};

export const deleteCourse = async (ids: number | number[]): Promise<ApiResponse<void>> => {
    let pathIds: string;

    if (Array.isArray(ids)) {
        pathIds = ids.join(',');
    } else {
        pathIds = ids.toString();
    }
    const response = await handleRequest(del(`${CLASS_SERVICE_PREFIX}/course/${pathIds}`));
    return await response.json() as ApiResponse<void>;
};

export const toggleCourseStatus = async (id: number, status: 0 | 1): Promise<ICourse> => {
    const response = await handleRequest(
        patchJsonData(`${CLASS_SERVICE_PREFIX}/course/toggle-status/${id}`, { status })
    );
    const updatedData = await response.json() as ApiResponse<ICourse>;

    if (updatedData.code === 200 && updatedData.result) {
        return updatedData.result;
    } else {
        throw new Error(updatedData.message || "Failed to toggle course status.");
    }
};

// Hàm lấy tất cả khóa học đang hoạt động cho select
export const getActiveCourses = async (): Promise<ICourse[]> => {
    try {
        const result = await getCourses({ status: 1, limit: 1000 });
        return result.content;
    } catch (error) {
        console.error("Failed to fetch active courses:", error);
        return [];
    }
};