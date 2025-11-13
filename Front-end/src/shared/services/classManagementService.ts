import {
    get,
    postJsonData,
    del,
    patchJsonData,
} from "./request";
import { getWithParams } from "./getWithParams";
import handleRequest from "./handleRequest";

const CLASS_SERVICE_PREFIX: string = import.meta.env.VITE_PREFIX_CLASS_SERVICE as string;


export interface IClass {
    id: number;
    assistantIds: string[];
    teacherId: number;
    courseId?: number;
    courseColor?:string;
    inviteCode: string;
    className: string;
    classType: string;
    description: string | null;
    startDate: string;
    endDate: string;
    scheduleJson: any | null;
    currentStudents: number;
    // Các trường từ BaseEntity
    createdDate: string | null;
    createdBy: string | null;
    modifiedDate: string | null;
    modifiedBy: string | null;
    status: number;
}

export interface StudentInClassResponse {
    id: number;
    firstName: string;
    lastName: string;
    studentId: string;
    username: string;
    fullName: string;
    email: string;
    dob: string;
    userCode: string;
    createdDate: string;
    isActive: number;
    enrolledAt: string;
    enrollmentStatus: number;
    roles: any[];
}
export interface GetStudentsInClassResult {
    content: StudentInClassResponse[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
}
export interface GetStudentsInClassOptions {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface UpdateEnrollmentStatusRequest {
    status: number;
}
export interface JoinClassResponse {
    classId: number;
}

export type CreateClassRequest = Omit<IClass, 'id' | 'createdDate' | 'createdBy' | 'modifiedDate' | 'modifiedBy' | 'status' | 'currentStudents' | 'inviteCode'>;
export type UpdateClassRequest = Partial<CreateClassRequest>;

// --- 2. Định nghĩa Interfaces cho Phân trang và Kết quả API ---
export interface GetClassesOptions {
    page?: number;
    limit?: number;
    className?: string;
    teacherId?: number;
    courseId?: number;
    classType?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    status?: number;
}

export interface GetClassesResult {
    content: IClass[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
}

export interface ClassInEnrollment {
    classId: number;
    className: string;
    classCode: string;
    teacherName: string;
    newAssignments: number | null;
}

export interface ApiResponse<T> {
    code: number;
    message: string;
    result: T;
    errorCode?: string;
}

// --- 3. Các hàm gọi API cho Quản lý Lớp học ---
export const createClass = async (data: CreateClassRequest): Promise<ApiResponse<number>> => {
    const response = await handleRequest(postJsonData(`${CLASS_SERVICE_PREFIX}/class`, data));
    const result = await response.json() as ApiResponse<number>;

    if (result.code !== 201) {
        const rawMessage = result.message || 'Tạo lớp học thất bại';
        const formattedMessage = rawMessage.includes(':')
            ? rawMessage.split(':').slice(1).join(':').trim()
            : rawMessage;

        console.log(formattedMessage);
        throw new Error(formattedMessage);
    }

    return result;
};

export const updateClass = async (id: number, data: UpdateClassRequest): Promise<ApiResponse<number>> => {
    console.log(data);
    const response = await handleRequest(patchJsonData(`${CLASS_SERVICE_PREFIX}/class/${id}`, data));
    const result = await response.json() as ApiResponse<number>;

    // Kiểm tra status trong ApiResponse thay vì HTTP status
    if (result.code !== 200) {
        throw new Error(result.message || 'Cập nhật lớp học thất bại');
    }

    return result;
};
export const getClasses = async (options: GetClassesOptions = {}): Promise<GetClassesResult> => {
    const currentPage = options.page || 1;
    const entriesPerPage = options.limit || 10;
    const params = {
        page: currentPage - 1,
        size: entriesPerPage,
        class_name: options.className,
        teacher_id: options.teacherId,
        course_id: options.courseId,
        class_type: options.classType,
        sort: options.sortBy && options.sortOrder ? `${options.sortBy},${options.sortOrder}` : undefined,
        status: options.status !== undefined ? options.status : undefined
    };

    const response = await handleRequest(getWithParams(`${CLASS_SERVICE_PREFIX}/class`, params));

    const apiResponse = await response.json() as ApiResponse<{ content: IClass[], totalElements: number }>;

    if (apiResponse.code === 200 && apiResponse.result) {
        const totalElements = apiResponse.result.totalElements || 0;
        const totalPages = Math.ceil(totalElements / entriesPerPage);

        return {
            content: apiResponse.result.content || [],
            totalElements: totalElements,
            totalPages: totalPages,
            number: currentPage - 1,
            size: entriesPerPage,
        } as GetClassesResult;
    } else {
        throw new Error(apiResponse.message || "Failed to fetch classes.");
    }
};

export const getClassById = async (id: number): Promise<IClass> => {
    const response = await handleRequest(get(`${CLASS_SERVICE_PREFIX}/class/${id}`));
    const data = await response.json() as ApiResponse<IClass>;

    console.log("Dữ liệu trả về:", data);

    if (data.code === 200 && data.result) {
        return data.result;
    } else {
        throw new Error(data.message || "Failed to fetch class.");
    }
};

export const deleteClass = async (ids: number | number[]): Promise<ApiResponse<void>> => {
    let pathIds: string;

    if (Array.isArray(ids)) {
        pathIds = ids.join(',');
    } else {
        pathIds = ids.toString();
    }
    const response = await handleRequest(del(`${CLASS_SERVICE_PREFIX}/class/${pathIds}`));
    return await response.json() as ApiResponse<void>;
};

export const toggleClassStatus = async (id: number, status: 0 | 1): Promise<IClass> => {
    const response = await handleRequest(
        patchJsonData(`${CLASS_SERVICE_PREFIX}/class/toggle-status/${id}`, { status })
    );
    const updatedData = await response.json() as ApiResponse<IClass>;

    if (updatedData.code === 200 && updatedData.result) {
        return updatedData.result;
    } else {
        throw new Error(updatedData.message || "Failed to toggle class status.");
    }
};

// --- API cho Enrollment ---

export const addStudentsToClass = async (classId: number, studentIds: number[]): Promise<ApiResponse<any>> => {
    const response = await handleRequest(postJsonData(`${CLASS_SERVICE_PREFIX}/class/${classId}/enrollments/add-students`, { studentIds }));
    return await response.json() as ApiResponse<any>;
};
export const getStudentsInClass = async (
    classId: number,
    options: GetStudentsInClassOptions = {}
): Promise<GetStudentsInClassResult> => {
    // Input validation
    if (!classId || classId <= 0) {
        throw new Error("Invalid class ID provided");
    }

    if (options.limit && (options.limit < 1 || options.limit > 100)) {
        throw new Error("Limit must be between 1 and 100");
    }

    if (options.page && options.page < 1) {
        throw new Error("Page number must be greater than 0");
    }

    const params = {
        page: options.page ? options.page - 1 : 0,
        size: options.limit || 10,
        sortBy: options.sortBy || 'fullName',
        sortOrder: options.sortOrder || 'asc'
    };

    try {
        const response = await handleRequest(
            getWithParams(`${CLASS_SERVICE_PREFIX}/enrollment/${classId}/students`, params)
        );

        // Check response status
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error("Class not found or you don't have access to it");
            } else if (response.status === 403) {
                throw new Error("You don't have permission to view students in this class");
            } else if (response.status >= 500) {
                throw new Error("Server error occurred. Please try again later");
            } else {
                throw new Error(`Request failed with status ${response.status}`);
            }
        }

        const apiResponse = await response.json() as ApiResponse<{
            content: StudentInClassResponse[],
            totalElements: number,
            totalPages?: number,
            number?: number,
            size?: number
        }>;

        // Validate API response structure
        if (!apiResponse) {
            throw new Error("No response received from server");
        }

        if (apiResponse.code !== 200) {
            throw new Error(apiResponse.message || "API returned error status");
        }

        if (!apiResponse.result) {
            throw new Error("No data received from server");
        }

        // Extract and validate data
        const data = apiResponse.result;
        const content = Array.isArray(data.content) ? data.content : [];
        const totalElements = typeof data.totalElements === 'number' ? data.totalElements : 0;
        const pageSize = options.limit || 10;
        const totalPages = data.totalPages ?? Math.ceil(totalElements / pageSize);
        const currentPageNumber = data.number ?? (options.page ? options.page - 1 : 0);

        // Additional validation
        if (totalElements < 0) {
            console.warn("Received negative totalElements, setting to 0");
        }

        if (totalPages < 0) {
            console.warn("Received negative totalPages, calculating from totalElements");
        }

        // Validate content array
        const validatedContent = content.filter(student => {
            if (!student) return false;
            if (!student.studentId) {
                console.warn("Student without ID found, filtering out:", student);
                return false;
            }
            return true;
        });

        // Log warning if some students were filtered out
        if (validatedContent.length !== content.length) {
            console.warn(`Filtered out ${content.length - validatedContent.length} invalid students`);
        }

        return {
            content: validatedContent,
            totalElements: Math.max(0, totalElements),
            totalPages: Math.max(0, totalPages),
            number: Math.max(0, currentPageNumber),
            size: pageSize,
        } as GetStudentsInClassResult;

    } catch (error: any) {
        // Enhanced error handling
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error("Network error: Please check your internet connection");
        }

        if (error.name === 'SyntaxError') {
            throw new Error("Server returned invalid response format");
        }

        if (error.message) {
            throw error; // Re-throw with existing message
        }

        throw new Error("Failed to fetch students in class");
    }
};
// export const getClassesByStudentId = async (options: GetClassesOptions = {}): Promise<GetClassesResult> => {
//     const params = {
//         page: options.page ? options.page - 1 : 0,
//         size: options.limit || 10,
//         sort: options.sortBy && options.sortOrder ? `${options.sortBy},${options.sortOrder}` : undefined,
//     };
//
//     const response = await handleRequest(
//         getWithParams(`${CLASS_SERVICE_PREFIX}/enrollment/student/classes`, params)
//     );
//
//     const apiResponse = await response.json() as ApiResponse<{
//         content: ClassInEnrollment[],
//         totalElements: number
//     }>;
//
//     if (apiResponse.status === 200 && apiResponse.data) {
//         const totalElements = apiResponse.data.totalElements || 0;
//         const totalPages = Math.ceil(totalElements / (options.limit || 10));
//
//         return {
//             content: apiResponse.data.content || [],
//             totalElements: totalElements,
//             totalPages: totalPages,
//             number: options.page ? options.page - 1 : 0,
//             size: options.limit || 10,
//         } as GetClassesResult;
//     } else {
//         throw new Error(apiResponse.message || "Failed to fetch classes for student.");
//     }
// };

export const leaveClass = async (classId: number, studentId: number): Promise<ApiResponse<void>> => {
    const response = await handleRequest(del(`${CLASS_SERVICE_PREFIX}/class/${classId}/enrollments/students/${studentId}/leave`));
    return await response.json() as ApiResponse<void>;
};
export const updateEnrollmentStatus = async (classId: number, studentId: number, status: number): Promise<ApiResponse<any>> => {
    const requestData: UpdateEnrollmentStatusRequest = { status };

    const response = await handleRequest(
        patchJsonData(`${CLASS_SERVICE_PREFIX}/enrollment/class/${classId}/student/${studentId}/status`, requestData)
    );

    return await response.json() as ApiResponse<any>;
};
export const joinClassByInvite = async (inviteCode: string): Promise<ApiResponse<JoinClassResponse>> => {
    // Validate input
    if (!inviteCode || inviteCode.trim().length === 0) {
        throw new Error("Mã mời không được để trống");
    }

    if (inviteCode.trim().length < 5) {
        throw new Error("Mã mời phải có ít nhất 5 ký tự");
    }

    try {
        const response = await handleRequest(
            postJsonData(`${CLASS_SERVICE_PREFIX}/enrollment/join/${inviteCode.trim()}`, {})
        );

        const result = await response.json() as ApiResponse<JoinClassResponse>;

        if (result.code === 200) {
            // Student already in class
            console.log("Student already enrolled in class:", result.result);
            return result;
        } else if (result.code === 201) {
            // Join request sent, pending approval
            console.log("Join request sent successfully:", result.result);
            return result;
        } else {
            // Handle other status codes
            throw new Error(result.message || "Không thể tham gia lớp học");
        }

    } catch (error: any) {
        // Enhanced error handling
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error("Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet của bạn");
        }

        if (error.name === 'SyntaxError') {
            throw new Error("Server trả về dữ liệu không hợp lệ");
        }

        // Check for specific HTTP status codes if available
        if (error.response) {
            switch (error.response.status) {
                case 404:
                    throw new Error("Mã mời không hợp lệ hoặc đã hết hạn");
                case 403:
                    throw new Error("Bạn không có quyền tham gia lớp học này");
                case 409:
                    throw new Error("Bạn đã tham gia lớp học này rồi");
                case 500:
                    throw new Error("Lỗi server. Vui lòng thử lại sau");
                default:
                    throw new Error(error.message || "Có lỗi xảy ra khi tham gia lớp học");
            }
        }

        // Re-throw the error if it has a message, otherwise create a generic one
        throw new Error(error.message || "Không thể tham gia lớp học. Vui lòng thử lại");
    }
};

// API để import danh sách sinh viên vào lớp
export interface StudentImportRequest {
    userCode: string; // hoặc id nếu bạn dùng trực tiếp
    fullName?: string;
    email?: string;
    dob?: string;
}

// Gọi API backend POST /enrollment/class/{classId}/import
export const importStudentsToClass = async (
    classId: number,
    students: StudentImportRequest[]
): Promise<ApiResponse<any>> => {
    const response = await handleRequest(
        postJsonData(`${CLASS_SERVICE_PREFIX}/enrollment/class/${classId}/import`, students)
    );
    const data = await response.json() as ApiResponse<any>;
    if (data.code !== 200) {
        throw new Error(data.message || "Import sinh viên thất bại");
    }
    return data;
};
