import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    getStudentsInClass, type GetStudentsInClassOptions, getClassById, updateEnrollmentStatus,
    type StudentImportRequest, importStudentsToClass
} from '../../../../shared/services/classManagementService';
import { getUserById, getUsersByIds, type IUser } from '../../../../shared/services/userService';
import { useUserStore } from '../../../../shared/authentication/useUserStore';
import { PersonSkeleton, StudentSkeleton } from '../../../../shared/components/Common/Skeleton';
import * as XLSX from 'xlsx';
import {Button, message, Upload} from 'antd';
import StudentDetailView from './StudentDetailView';

interface ITeacher extends IUser {
    fullName: string;
    avatarUrl?: string;
}

interface IStudent extends IUser{
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

interface ClassPeopleTabProps {
    classId: number;
}
const ClassPeopleTab: React.FC<ClassPeopleTabProps> = ({ classId }) => {
    const {hasRole} = useUserStore();
    const { t } = useTranslation();
    const [teachers, setTeachers] = useState<ITeacher[]>([]);
    const [students, setStudents] = useState<IStudent[]>([]);
    const [teacherLoading, setTeacherLoading] = useState(true);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [studentsLoading, setStudentsLoading] = useState(true);
    const [teacherError, setTeacherError] = useState<string | null>(null);
    const [studentsError, setStudentsError] = useState<string | null>(null);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [pageSize] = useState(10);
    const [sortBy, ] = useState<string>('fullName');
    const [sortOrder, ] = useState<'asc' | 'desc'>('asc');
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [showStudentDetail, setShowStudentDetail] = useState(false);

    useEffect(() => {
        // Thêm keyframe animation cho pulse
        const style = document.createElement('style');
        style.textContent = `
        @keyframes pulse {
            0%, 100% {
                opacity: 1;
            }
            50% {
                opacity: 0.5;
            }
        }
    `;
        document.head.appendChild(style);

        return () => {
            document.head.removeChild(style);
        };
    }, []);

    useEffect(() => {
        fetchTeacher();
        fetchStudents();
    }, [classId]);

    useEffect(() => {
        if (!teacherLoading) {
            fetchStudents();
        }
    }, [currentPage, sortBy, sortOrder]);

    useEffect(() => {
        const handleClickOutside = () => setOpenDropdown(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const handleFileUpload = (file: File) => {
        const reader = new FileReader();
        reader.onload = (evt) => {
            const data = evt.target?.result;
            if (!data) return;

            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

            const studentsToImport = jsonData.map(item => ({
                username: item['Username'] || '',
                fullName: item['Full Name'] || '',
                email: item['Email'] || '',
                dob: item['Date of Birth'] || '',
                userCode: item['Student Code'] || '',
            }));

            handleImport(studentsToImport);
        };
        reader.readAsBinaryString(file);
    };

    // Thêm function để xem chi tiết
    const handleViewStudentDetail = (studentId: string, event: React.MouseEvent) => {
        event.stopPropagation();
        setOpenDropdown(null);
        setSelectedStudentId(studentId);
        setShowStudentDetail(true);
    };

// Thêm function để quay lại
    const handleBackToList = () => {
        setShowStudentDetail(false);
        setSelectedStudentId(null);
    };

    const fetchPeople = async () => {
        setLoading(true);
        setError(null);

        try {
            const options: GetStudentsInClassOptions = {
                page: currentPage,
                limit: pageSize,
                sortBy: sortBy,
                sortOrder: sortOrder
            };

            const result = await getStudentsInClass(classId, options);

            setStudents(result.content);
            setTotalElements(result.totalElements);
            setTotalPages(result.totalPages);

        } catch (err: any) {
            console.error("Failed to fetch class people:", err);
            setError(err.message || t('common.errorFetchingData'));
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async (students: StudentImportRequest[]) => {
        setLoading(true);
        try {
            await importStudentsToClass(classId, students);
            message.success('Import thành công!');
            fetchPeople();
        } catch (err) {
            console.error(err);
            message.error('Import thất bại!');
        } finally {
            setLoading(false);
        }
    };

    const fetchTeacher = async () => {
        setTeacherLoading(true);
        setTeacherError(null);
        try {
            if (!classId || classId <= 0) {
                throw new Error('Invalid class ID');
            }
            const classInfo = await getClassById(classId);
            if (!classInfo || !classInfo.teacherId) {
                setTeachers([]);
                return;
            }
            const teacherInfo = await getUserById(classInfo.teacherId);
            if (!teacherInfo) {
                setTeacherError('Không tìm thấy giáo viên');
                return;
            }
            const teacher: ITeacher = {
                ...teacherInfo,
                fullName: `${teacherInfo.firstName || ''} ${teacherInfo.lastName || ''}`.trim(),
                avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    `${teacherInfo.firstName || ''} ${teacherInfo.lastName || ''}`.trim()
                )}&size=48&background=0d6efd&color=fff`
            };
            setTeachers([teacher]);
        } catch (err: any) {
            console.error("Failed to fetch teacher:", err);
            if (err.message?.includes('404') || err.message?.includes('Not Found')) {
                setTeacherError('Không tìm thấy giáo viên');
            } else if (err.message?.includes('network') || err.message?.includes('fetch')) {
                setTeacherError('Lỗi kết nối mạng, vui lòng thử lại');
            } else {
                setTeacherError('Không thể tải thông tin giáo viên');
            }
            setTeachers([]);
        } finally {
            setTeacherLoading(false);
        }
    };

    const fetchStudents = async () => {
        setStudentsLoading(true);
        setStudentsError(null);
        try {
            if (!classId || classId <= 0) {
                throw new Error('Invalid class ID');
            }
            const options: GetStudentsInClassOptions = {
                page: currentPage,
                limit: pageSize,
                sortBy: sortBy,
                sortOrder: sortOrder
            };
            const result = await getStudentsInClass(classId, options);
            if (!result) {
                throw new Error('No data returned from server');
            }
            const studentsData = result.content || [];
            setStudents(studentsData);
            setTotalElements(result.totalElements || 0);
            setTotalPages(result.totalPages || 0);
        } catch (err: any) {
            console.error("Failed to fetch students:", err);
            if (err.message?.includes('404') || err.message?.includes('Not Found')) {
                setStudentsError('Không tìm thấy lớp học');
            } else if (err.message?.includes('network') || err.message?.includes('fetch')) {
                setStudentsError('Lỗi kết nối mạng, vui lòng thử lại');
            } else {
                setStudentsError('Không thể tải danh sách học viên');
            }
            setStudents([]);
            setTotalElements(0);
            setTotalPages(0);
        } finally {
            setStudentsLoading(false);
        }
    };



    const retryFetch = (type: 'teacher' | 'assistant' | 'students') => {
        if (type === 'teacher') {
            fetchTeacher();
        } else {
            fetchStudents();
        }
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleSingleAction = async (action: string, studentId: string, event: React.MouseEvent) => {
        event.stopPropagation();
        setOpenDropdown(null);
        // const loadingToast = toast.loading('Đang xử lý...');
        try {
            switch (action) {
                case 'approve':
                    await handleApproveStudent(studentId);
                    break;
                case 'reject':
                    await handleRejectStudent(studentId);
                    break;
                case 'remove':
                    await handleRemoveStudent(studentId);
                    break;
                default:
                    console.warn('Unknown action:', action);
                    return;
            }
        } catch (error) {
            console.error('Error handling action:', error);
            // toast.dismiss(loadingToast);
            // toast.error('Có lỗi xảy ra khi thực hiện thao tác');
        }
    };

    const handleApproveStudent = async (studentId: string) => {
        try {
            const response = await updateEnrollmentStatus(classId, parseInt(studentId), 1);
            if (response.code === 200) {
                setStudents(prevStudents =>
                    prevStudents.map(student =>
                        student.studentId === studentId
                            ? { ...student, enrollmentStatus: 1 }
                            : student
                    )
                );
                // toast.success('Duyệt học sinh thành công');
            } else {
                throw new Error(response.message || 'Failed to approve student');
            }
        } catch (error: any) {
            throw new Error(error.message || 'Không thể duyệt học sinh');
        }
    };

    const handleRejectStudent = async (studentId: string) => {
        try {
            const response = await updateEnrollmentStatus(classId, parseInt(studentId), 2);
            if (response.code === 200) {
                setStudents(prevStudents =>
                    prevStudents.map(student =>
                        student.studentId === studentId
                            ? { ...student, enrollmentStatus: 2 }
                            : student
                    )
                );
                // toast.success('Từ chối học sinh thành công');
            } else {
                throw new Error(response.message || 'Failed to reject student');
            }
        } catch (error: any) {
            throw new Error(error.message || 'Không thể từ chối học sinh');
        }
    };

    const handleRemoveStudent = async (studentId: string) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa học sinh này khỏi lớp không?')) {
            return;
        }
        try {
            const response = await updateEnrollmentStatus(classId, parseInt(studentId), -1);
            if (response.code === 200) {
                setStudents(prevStudents =>
                    prevStudents.filter(student => student.studentId !== studentId)
                );
                setTotalElements(prev => Math.max(0, prev - 1));
                // toast.success('Xóa học sinh khỏi lớp thành công');
            } else {
                throw new Error(response.message || 'Failed to remove student');
            }
        } catch (error: any) {
            throw new Error(error.message || 'Không thể xóa học sinh khỏi lớp');
        }
    };

    const toggleDropdown = (studentId: string, event: React.MouseEvent) => {
        event.stopPropagation();
        setOpenDropdown(openDropdown === studentId ? null : studentId);
    };

    const ErrorDisplay: React.FC<{ error: string; onRetry: () => void; type: 'teacher' | 'assistant' | 'students'; }> = ({ error, onRetry }) => (
        <div style={{
            padding: '1rem',
            backgroundColor: '#fef3c7',
            border: '1px solid #fbbf24',
            borderRadius: '8px',
            marginBottom: '1rem'
        }}>
            <div style={{ color: '#92400e', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                {error}
            </div>
            <button
                onClick={onRetry}
                style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid #92400e',
                    borderRadius: '6px',
                    backgroundColor: 'transparent',
                    color: '#92400e',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 500
                }}
            >
                Thử lại
            </button>
        </div>
    );

    const calculateAge = (dob: any) => {
        if (!dob) return null;
        const today = new Date();
        const birthDate = new Date(dob);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    if (showStudentDetail && selectedStudentId) {
        return (
            <StudentDetailView
                studentId={selectedStudentId}
                classId={classId}
                onBack={handleBackToList}
            />
        );
    }

    return (
        <div style={{ backgroundColor: '#f9fafb', minHeight: '100vh'}}>
            <div style={{ margin: '0 auto' }}>
                {/* Teacher Section */}
                <div style={{
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    padding: '2rem',
                    marginBottom: '1.5rem',
                    border: '1px solid #e5e7eb'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderBottom: '1px solid #e5e7eb',
                        paddingBottom: '0.75rem',
                        marginBottom: '1.5rem'
                    }}>
                        <h2 style={{ margin: 0, fontWeight: 600, fontSize: '1.25rem', color: '#111827' }}>
                            Giáo viên
                        </h2>
                    </div>
                    <div>
                        {teacherLoading ? (
                            <div style={{ display: 'flex', alignItems: 'center', padding: '1rem' }}>
                                <PersonSkeleton />
                            </div>
                        ) : teacherError ? (
                            <ErrorDisplay error={teacherError} onRetry={() => retryFetch('teacher')} type="teacher" />
                        ) : teachers.length === 0 ? (
                            <div style={{
                                padding: '1.5rem',
                                textAlign: 'center',
                                color: '#6b7280',
                                backgroundColor: '#f9fafb',
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb',
                                fontSize: '0.875rem'
                            }}>
                                Không có giáo viên nào
                            </div>
                        ) : (
                            teachers.map(teacher => (
                                <div key={teacher.id} style={{ display: 'flex', alignItems: 'center' }}>
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '50%',
                                        backgroundColor: '#0d6efd',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginRight: '1rem',
                                        fontSize: '1.2rem',
                                        fontWeight: 'bold',
                                        color: 'white'
                                    }}>
                                        {(teacher.fullName || teacher.username)?.charAt(0)?.toUpperCase() || 'T'}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#111827' }}>
                                            {teacher.fullName || teacher.username}
                                        </div>
                                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                            {teacher.email}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Student Section */}
                <div style={{
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    padding: '2rem',
                    border: '1px solid #e5e7eb'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderBottom: '1px solid #e5e7eb',
                        paddingBottom: '0.75rem',
                        marginBottom: '1.5rem'
                    }}>
                        <h2 style={{ margin: 0, fontWeight: 600, fontSize: '1.25rem', color: '#111827' }}>
                            Học viên
                        </h2>
                        {/*{!studentsLoading && !studentsError && (*/}
                        {/*    <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>*/}
                        {/*        {totalElements} học sinh*/}
                        {/*    </span>*/}
                        {/*)}*/}
                        <Upload
                            accept=".xlsx,.xls"
                            showUploadList={false}
                            beforeUpload={(file) => {
                                handleFileUpload(file);
                                return false;
                            }}
                        >
                            <Button
                                type="primary"
                                style={{
                                    backgroundColor: '#3b82f6',
                                    borderColor: '#3b82f6',
                                    borderRadius: '8px',
                                    padding: '0.5rem 1.25rem',
                                    height: 'auto',
                                    fontWeight: '500'
                                }}
                            >
                                <svg style={{ width: '16px', height: '16px', marginRight: '0.5rem', display: 'inline-block', verticalAlign: 'middle' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                Upload File
                            </Button>
                        </Upload>
                    </div>

                    {studentsLoading ? (
                        <div>
                            {Array.from({length: pageSize}).map((_, idx) => (
                                <StudentSkeleton key={idx}/>
                            ))}
                        </div>
                    ) : studentsError ? (
                        <ErrorDisplay error={studentsError} onRetry={() => retryFetch('students')} type="students" />
                    ) : (
                        <>
                            <div>
                                {students.length === 0 ? (
                                    <div style={{
                                        padding: '2rem',
                                        textAlign: 'center',
                                        color: '#6b7280',
                                        backgroundColor: '#f9fafb',
                                        borderRadius: '8px',
                                        border: '1px solid #e5e7eb',
                                        fontSize: '0.875rem'
                                    }}>
                                        Không có học viên nào
                                    </div>
                                ) : (
                                    students.map(student => {
                                        const getStatusInfo = (enrollmentStatus: any) => {
                                            switch (enrollmentStatus) {
                                                case 1:
                                                    return { text: 'Đã tham gia', color: '#065f46', bgColor: '#d1fae5', actions: ['view', 'remove'] };
                                                case 0:
                                                    return { text: 'Chờ duyệt', color: '#92400e', bgColor: '#fef3c7', actions: ['approve', 'reject'] };
                                                case 2:
                                                    return { text: 'Đã từ chối', color: '#991b1b', bgColor: '#fee2e2', actions: ['approve', 'remove'] };
                                                case -1:
                                                    return { text: 'Đã rời lớp', color: '#6b7280', bgColor: '#f3f4f6', actions: [] };
                                                default:
                                                    return { text: 'Không xác định', color: '#6b7280', bgColor: '#e5e7eb', actions: ['view', 'remove'] };
                                            }
                                        };

                                        const statusInfo = getStatusInfo(student.enrollmentStatus);
                                        const age = calculateAge(student.dob);

                                        return (
                                            <div key={student.studentId} style={{
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                justifyContent: 'space-between',
                                                padding: '1.5rem 0',
                                                borderBottom: '1px solid #f3f4f6',
                                                opacity: student.enrollmentStatus === -1 ? 0.6 : 1
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flex: 1 }}>
                                                    <div style={{
                                                        width: '56px',
                                                        height: '56px',
                                                        borderRadius: '50%',
                                                        overflow: 'hidden',
                                                        backgroundColor: '#d1d5db',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '1.4rem',
                                                        fontWeight: 'bold',
                                                        color: 'white',
                                                        flexShrink: 0
                                                    }}>
                                                        {student.avatarUrl ? (
                                                            <img src={student.avatarUrl} alt={student.fullName} style={{
                                                                width: '100%',
                                                                height: '100%',
                                                                objectFit: 'cover'
                                                            }} />
                                                        ) : (
                                                            student.fullName?.charAt(0)?.toUpperCase() || 'U'
                                                        )}
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.5rem',
                                                            marginBottom: '0.5rem'
                                                        }}>
                                                            <div style={{
                                                                fontSize: '1.1rem',
                                                                fontWeight: 600,
                                                                color: '#111827'
                                                            }}>
                                                                {student.fullName || student.username}
                                                            </div>
                                                            {/*{age && (*/}
                                                            {/*    <span style={{*/}
                                                            {/*        fontSize: '0.75rem',*/}
                                                            {/*        color: '#6b7280',*/}
                                                            {/*        backgroundColor: '#f3f4f6',*/}
                                                            {/*        padding: '0.2rem 0.5rem',*/}
                                                            {/*        borderRadius: '4px'*/}
                                                            {/*    }}>*/}
                                                            {/*        {age} tuổi*/}
                                                            {/*    </span>*/}
                                                            {/*)}*/}
                                                        </div>
                                                        <div style={{
                                                            fontSize: '0.875rem',
                                                            color: '#6b7280'
                                                        }}>
                                                            {student.email}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.75rem',
                                                    flexShrink: 0
                                                }}>
                                                    <span style={{
                                                        fontSize: '0.75rem',
                                                        padding: '0.4rem 0.75rem',
                                                        borderRadius: '20px',
                                                        backgroundColor: statusInfo.bgColor,
                                                        color: statusInfo.color,
                                                        fontWeight: 600,
                                                        border: `1px solid ${statusInfo.color}30`,
                                                        whiteSpace: 'nowrap'
                                                    }}>
                                                        {statusInfo.text}
                                                    </span>

                                                    {(hasRole('admin') || hasRole('teacher') || hasRole('ta')) && (
                                                        <div style={{ position: 'relative' }}>
                                                            <div
                                                                style={{
                                                                    cursor: 'pointer',
                                                                    fontSize: '1.4rem',
                                                                    padding: '0.5rem',
                                                                    borderRadius: '4px',
                                                                    backgroundColor: 'transparent',
                                                                    border: 'none',
                                                                    color: '#6b7280',
                                                                    lineHeight: '1'
                                                                }}
                                                                onClick={(e) => toggleDropdown(student.studentId, e)}
                                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                            >
                                                                ⋮
                                                            </div>

                                                            {openDropdown === student.studentId && (
                                                                <div style={{
                                                                    position: 'absolute',
                                                                    right: 0,
                                                                    top: '100%',
                                                                    backgroundColor: 'white',
                                                                    border: '1px solid #e5e7eb',
                                                                    borderRadius: '8px',
                                                                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                                                                    zIndex: 1000,
                                                                    minWidth: '180px',
                                                                    overflow: 'hidden',
                                                                    marginTop: '0.25rem'
                                                                }}>
                                                                    {statusInfo.actions.includes('approve') && (
                                                                        <button
                                                                            style={{
                                                                                width: '100%',
                                                                                padding: '0.75rem 1rem',
                                                                                border: 'none',
                                                                                backgroundColor: 'transparent',
                                                                                textAlign: 'left',
                                                                                cursor: 'pointer',
                                                                                borderBottom: '1px solid #f3f4f6',
                                                                                color: '#10b981',
                                                                                fontSize: '0.875rem',
                                                                                fontWeight: 500
                                                                            }}
                                                                            onClick={(e) => handleSingleAction('approve', student.studentId, e)}
                                                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                                                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                                        >
                                                                            Duyệt học sinh
                                                                        </button>
                                                                    )}

                                                                    {statusInfo.actions.includes('reject') && (
                                                                        <button
                                                                            style={{
                                                                                width: '100%',
                                                                                padding: '0.75rem 1rem',
                                                                                border: 'none',
                                                                                backgroundColor: 'transparent',
                                                                                textAlign: 'left',
                                                                                cursor: 'pointer',
                                                                                borderBottom: '1px solid #f3f4f6',
                                                                                color: '#f59e0b',
                                                                                fontSize: '0.875rem',
                                                                                fontWeight: 500
                                                                            }}
                                                                            onClick={(e) => handleSingleAction('reject', student.studentId, e)}
                                                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                                                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                                        >
                                                                            Từ chối
                                                                        </button>
                                                                    )}

                                                                    {statusInfo.actions.includes('remove') && (
                                                                        <button
                                                                            style={{
                                                                                width: '100%',
                                                                                padding: '0.75rem 1rem',
                                                                                border: 'none',
                                                                                backgroundColor: 'transparent',
                                                                                textAlign: 'left',
                                                                                cursor: 'pointer',
                                                                                color: '#dc2626',
                                                                                fontSize: '0.875rem',
                                                                                fontWeight: 500
                                                                            }}
                                                                            onClick={(e) => handleSingleAction('remove', student.studentId, e)}
                                                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                                                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                                        >
                                                                            {student.enrollmentStatus === -1 ? 'Xóa vĩnh viễn' : 'Xóa khỏi lớp'}
                                                                        </button>
                                                                    )}

                                                                    <button
                                                                        style={{
                                                                            width: '100%',
                                                                            padding: '0.75rem 1rem',
                                                                            border: 'none',
                                                                            backgroundColor: 'transparent',
                                                                            textAlign: 'left',
                                                                            cursor: 'pointer',
                                                                            borderBottom: '1px solid #f3f4f6',
                                                                            color: '#3b82f6',
                                                                            fontSize: '0.875rem',
                                                                            fontWeight: 500
                                                                        }}
                                                                        onClick={(e) => handleViewStudentDetail(student.studentId, e)}
                                                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                                                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                                    >
                                                                        👁️ Xem chi tiết
                                                                    </button>

                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {totalPages > 1 && (
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    marginTop: '2rem',
                                    padding: '1rem 0'
                                }}>
                                    <button
                                        disabled={currentPage === 1}
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '6px',
                                            backgroundColor: currentPage === 1 ? '#f9fafb' : 'white',
                                            color: currentPage === 1 ? '#9ca3af' : '#374151',
                                            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                            fontSize: '0.875rem',
                                            fontWeight: 500
                                        }}
                                    >
                                        {t('common.previous')}
                                    </button>

                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        const startPage = Math.max(1, currentPage - 2);
                                        const pageNum = startPage + i;
                                        if (pageNum > totalPages) return null;

                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => handlePageChange(pageNum)}
                                                style={{
                                                    padding: '0.5rem 1rem',
                                                    border: '1px solid #e5e7eb',
                                                    borderRadius: '6px',
                                                    backgroundColor: pageNum === currentPage ? '#2563eb' : 'white',
                                                    color: pageNum === currentPage ? 'white' : '#374151',
                                                    cursor: 'pointer',
                                                    fontSize: '0.875rem',
                                                    fontWeight: 500,
                                                    minWidth: '40px'
                                                }}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}

                                    <button
                                        disabled={currentPage === totalPages}
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '6px',
                                            backgroundColor: currentPage === totalPages ? '#f9fafb' : 'white',
                                            color: currentPage === totalPages ? '#9ca3af' : '#374151',
                                            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                            fontSize: '0.875rem',
                                            fontWeight: 500
                                        }}
                                    >
                                        {t('common.next')}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ClassPeopleTab;