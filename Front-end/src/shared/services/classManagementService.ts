import {get, postJsonData, putJsonData, del, bulkDelete, postFormData, putFormData, patchJsonData} from "./request";
import { getWithParams } from "./getWithParams";
import handleRequest from "./handleRequest";

const CLASS_SERVICE_PREFIX: string = import.meta.env.VITE_PREFIX_CLASS_SERVICE as string;

// --- 1. Định nghĩa Interfaces cho Dữ liệu Lớp học ---
export interface IClass {
    id: number;
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

// Interface cho Student từ API response (dựa vào StudentInClassResponse từ backend)
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

export type CreateClassRequest = Omit<IClass, 'id' | 'createdDate' | 'createdBy' | 'modifiedDate' | 'modifiedBy' | 'status'>;
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

// API Response chung từ Backend (để cast response)
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
    if (result.code !== 200) {
        throw new Error(result.message || 'Cập nhật lớp học thất bại');
    }

    return result;
};

const convertToFormData = (data: Record<string, any>): FormData => {
    const formData = new FormData();
    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            const value = data[key];
            if (value !== null && value !== undefined) {
                formData.append(key, value);
            }
        }
    }
    return formData;
};

// Hàm lấy danh sách lớp học được điều chỉnh
export const getClasses = async (options: GetClassesOptions = {}): Promise<GetClassesResult> => {
    const currentPage = options.page || 1; // Sử dụng trang 1-indexed của frontend
    const entriesPerPage = options.limit || 10; // Giới hạn mặc định

    const params = {
        page: currentPage - 1, // Backend dùng 0-indexed
        size: entriesPerPage,
        class_name: options.className,
        teacher_id: options.teacherId,
        sort: options.sortBy && options.sortOrder ? `${options.sortBy},${options.sortOrder}` : undefined,
        status: options.status !== undefined ? options.status : undefined
    };

    // Giả định API endpoint là `/class/teacher/{teacherId}` nếu có filter teacherId,
    // hoặc `/class` nếu là API tổng hợp có thể filter
    // Hiện tại, bạn đã có endpoint `/class/teacher/{teacherId}`
    // và `/class` (cho POST). Cần một GET `/class` chung có phân trang.
    // Nếu chưa có GET /class chung, bạn có thể gọi getClassesByTeacherId và hardcode teacherId tạm thời.

    // Giả định API GET /api/v1/class có thể nhận các params page, size, sort, name, etc.
    // Nếu bạn chỉ có /teacher/{teacherId}, bạn cần chọn một teacherId mặc định/tạm thời
    // hoặc tạo một endpoint GET /class chung có phân trang.

    // Tạm thời, tôi sẽ giả định có một endpoint GET ${CLASS_SERVICE_PREFIX}/class
    // có thể nhận các tham số filter và phân trang.
    // Nếu bạn chỉ có `getClassesByTeacherId`, bạn sẽ cần điều chỉnh ở đây.

    const response = await handleRequest(getWithParams(`${CLASS_SERVICE_PREFIX}/class`, params));
    const apiResponse = await response.json() as ApiResponse<{ content: IClass[], totalElements: number }>; // Cast đúng với response backend


    if (apiResponse.code === 200 && apiResponse.result) {
        const totalElements = apiResponse.result.totalElements || 0;
        const totalPages = Math.ceil(totalElements / entriesPerPage);

        return {
            content: apiResponse.result.content || [],
            totalElements: totalElements,
            totalPages: totalPages,
            number: currentPage - 1, // Lưu trữ 0-indexed page number
            size: entriesPerPage,
        } as GetClassesResult;
    } else {
        throw new Error(apiResponse.message || "Failed to fetch classes.");
    }
};

export const getClassById = async (id: number): Promise<IClass> => {
    const response = await handleRequest(get(`${CLASS_SERVICE_PREFIX}/class/${id}`));

    const data = await response.json();
    console.log("Dữ liệu trả về:", data);

    return data.result as IClass;
};

export const deleteClass = async (ids: number | number[], teacherId: number): Promise<ApiResponse<void>> => {
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
        patchJsonData(`${CLASS_SERVICE_PREFIX}/class/${id}/toggle-status`, { status })
    );
    const updatedData = await response.json();
    return updatedData.result as IClass;
};

// ... Các hàm API cho Enrollment (addStudentsToClass, getStudentsInClass, getClassesByStudentId, leaveClass)

// API để thêm danh sách sinh viên vào lớp (POST /api/v1/class/{classId}/enrollments/add-students)
export const addStudentsToClass = async (classId: number, studentIds: number[]): Promise<ApiResponse<any>> => {
    const response = await handleRequest(postJsonData(`${CLASS_SERVICE_PREFIX}/class/${classId}/enrollments/add-students`, { studentIds }));
    return await response.json() as ApiResponse<any>; // Tùy thuộc vào EnrollmentDto bạn định nghĩa
};

// API để lấy danh sách sinh viên trong lớp (GET /api/v1/class/{classId}/enrollments/students)
export interface GetStudentsInClassOptions {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface GetStudentsInClassResult {
    content: any[]; // Thay thế bằng IEnrollment hoặc StudentInClass DTO sau này
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
}

// Cập nhật hàm getStudentsInClass để gọi endpoint mới
export const getStudentsInClass = async (classId: number, options: GetStudentsInClassOptions = {}): Promise<GetStudentsInClassResult> => {
    const params = {
        page: options.page ? options.page - 1 : 0, // Backend sử dụng 0-indexed
        size: options.limit || 10,
        // sort: options.sortBy && options.sortOrder ? `${options.sortBy},${options.sortOrder}` : undefined,
    };

    // Gọi endpoint mới: /enrollment/class/{classId}/students
    const response = await handleRequest(
        getWithParams(`${CLASS_SERVICE_PREFIX}/enrollment/class/${classId}/students`, params)
    );

    const apiResponse = await response.json() as ApiResponse<{
        content: StudentInClassResponse[],
        totalElements: number
    }>;

    if (apiResponse.code === 200 && apiResponse.result) {
        const totalElements = apiResponse.result.totalElements || 0;
        const totalPages = Math.ceil(totalElements / (options.limit || 10));

        return {
            content: apiResponse.result.content || [],
            totalElements: totalElements,
            totalPages: totalPages,
            number: options.page ? options.page - 1 : 0,
            size: options.limit || 10,
        } as GetStudentsInClassResult;
    } else {
        throw new Error(apiResponse.message || "Failed to fetch students in class.");
    }
};


// API để lấy danh sách lớp theo ID sinh viên (GET /api/v1/enrollments/student/{studentId}/class)
export const getClassesByStudentId = async (options: GetClassesOptions = {}): Promise<GetClassesResult> => {
    const params = {
        page: options.page ? options.page - 1 : 0, // Backend sử dụng 0-indexed
        size: options.limit || 10,
        sort: options.sortBy && options.sortOrder ? `${options.sortBy},${options.sortOrder}` : undefined,
    };

    // Sử dụng endpoint chính xác từ API response bạn cung cấp
    const response = await handleRequest(
        getWithParams(`${CLASS_SERVICE_PREFIX}/enrollment/student/classes`, params)
    );

    const apiResponse = await response.json() as ApiResponse<{
        content: ClassInEnrollment[],
        totalElements: number
    }>;

    if (apiResponse.code === 200 && apiResponse.result) {
        const totalElements = apiResponse.result.totalElements || 0;
        const totalPages = Math.ceil(totalElements / (options.limit || 10));

        return {
            content: apiResponse.result.content || [],
            totalElements: totalElements,
            totalPages: totalPages,
            number: options.page ? options.page - 1 : 0,
            size: options.limit || 10,
        } as GetClassesResult;
    } else {
        throw new Error(apiResponse.message || "Failed to fetch classes for student.");
    }
};

// API để sinh viên rời lớp (DELETE /api/v1/class/{classId}/enrollments/students/{studentId}/leave)
export const leaveClass = async (classId: number, studentId: number): Promise<ApiResponse<void>> => {
    const response = await handleRequest(del(`${CLASS_SERVICE_PREFIX}/class/${classId}/enrollments/students/${studentId}/leave`));
    return await response.json() as ApiResponse<void>;
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
