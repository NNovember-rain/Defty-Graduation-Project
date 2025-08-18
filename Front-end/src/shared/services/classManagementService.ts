import {get, postJsonData, putJsonData, del, bulkDelete, postFormData, putFormData, patchJsonData} from "./request";
import { getWithParams } from "./getWithParams";
import handleRequest from "./handleRequest";

const CLASS_SERVICE_PREFIX: string = import.meta.env.VITE_PREFIX_CLASS_SERVICE as string;
const TEACHER_ROLE_ID: number = 3;

// --- 1. Định nghĩa Interfaces cho Dữ liệu Lớp học ---
export interface IClass {
    id: number;
    teacherId: number;
    name: string;
    description: string | null; // Cập nhật có thể null
    section: string | null;     // Cập nhật có thể null
    subject: string | null;     // Cập nhật có thể null
    room: string | null;        // Cập nhật có thể null
    // inviteCode?: string; // Đã bỏ nếu không dùng

    // Các trường từ BaseEntity (theo response của bạn, có thể là null nếu chưa hoạt động)
    createdDate: string | null;
    createdBy: string | null;
    modifiedDate: string | null;
    modifiedBy: string | null;
    status: number; // Thêm trường status nếu có trong Entity của bạn
}

// Interface cho Student từ API response (dựa vào StudentInClassResponse từ backend)
export interface StudentInClassResponse {
    studentId: string;
    username: string;
    fullName: string;
    email: string;
    dob: string; // LocalDate từ backend
    userCode: string;
    createdDate: string; // Date từ backend
    isActive: number; // 1 for active, 0 for inactive, -1 for deleted
    enrolledAt: string; // LocalDateTime từ backend
    enrollmentStatus: string;
    roles: any[]; // Set<RoleResponse> từ backend
}

// Cập nhật interface GetStudentsInClassResult
export interface GetStudentsInClassResult {
    content: StudentInClassResponse[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
}

// Request DTO cho việc tạo/cập nhật lớp
export type CreateClassRequest = Omit<IClass, 'id' | 'createdDate' | 'createdBy' | 'modifiedDate' | 'modifiedBy' | 'status'>;
export type UpdateClassRequest = Partial<CreateClassRequest>;

// --- 2. Định nghĩa Interfaces cho Phân trang và Kết quả API ---
// Cập nhật GetClassesOptions để thêm các filter mới
export interface GetClassesOptions {
    page?: number;
    limit?: number;
    name?: string;
    teacherId?: number;
    section?: string;
    subject?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    status?: number;
}

// Cập nhật GetClassesResult để khớp với RESPONSE BACKEND HIỆN TẠI VÀ TỰ TÍNH TOÁN
export interface GetClassesResult {
    content: IClass[];
    totalElements: number;
    // Các trường dưới đây sẽ được TÍNH TOÁN ở frontend, không phải lấy trực tiếp từ backend
    totalPages: number;
    number: number; // Trang hiện tại (0-indexed)
    size: number;   // Kích thước trang
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
    const formData = convertToFormData(data); // ← convert từ object sang FormData
    const response = await handleRequest(postFormData(`${CLASS_SERVICE_PREFIX}/class`, formData));
    return await response.json() as ApiResponse<number>;
};
export const updateClass = async (id: number, data: UpdateClassRequest): Promise<ApiResponse<number>> => {

    console.log(data);

    const formData = convertToFormData(data);
    const response = await handleRequest(putFormData(`${CLASS_SERVICE_PREFIX}/class/${id}`, formData));
    return await response.json() as ApiResponse<number>;
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
        class_name: options.name,
        teacher_id: options.teacherId,
        section: options.section,
        subject: options.subject,
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
export const getClassesByStudentId = async (studentId: number, options: GetClassesOptions = {}): Promise<GetClassesResult> => {
    const params = {
        page: options.page ? options.page - 1 : 0,
        size: options.limit || 10,
        sort: options.sortBy && options.sortOrder ? `${options.sortBy},${options.sortOrder}` : undefined,
    };
    const response = await handleRequest(getWithParams(`${CLASS_SERVICE_PREFIX}/enrollments/student/${studentId}/class`, params));
    const apiResponse = await response.json() as ApiResponse<any>;

    if (apiResponse.code === 200 && apiResponse.result) {
        return {
            content: apiResponse.result.content,
            totalElements: apiResponse.result.totalElements,
            totalPages: apiResponse.result.totalPages,
            number: apiResponse.result.number,
            size: apiResponse.result.size,
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