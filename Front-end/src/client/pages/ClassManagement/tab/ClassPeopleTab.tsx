import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Spinner } from 'react-bootstrap';
import { getStudentsInClass, GetStudentsInClassOptions, getClassById } from '../../../../shared/services/classManagementService';
import { getUserById, IUser } from '../../../../shared/services/userService';

// Interface cho Teacher (sử dụng IUser từ userService)
interface ITeacher extends IUser {
    avatarUrl?: string; // Optional avatar URL
}

// Interface cho Student từ API response (dựa vào StudentInClassResponse từ backend)
interface IStudent {
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

// Mock data cho teachers - Sẽ được thay thế bằng API call
// const mockTeachers: ITeacher[] = [
//     { id: 1, name: 'Michael John', avatarUrl: 'https://via.placeholder.com/40' }
// ];

interface ClassPeopleTabProps {
    classId: number;
}

const ClassPeopleTab: React.FC<ClassPeopleTabProps> = ({ classId }) => {
    const { t } = useTranslation();
    const [teachers, setTeachers] = useState<ITeacher[]>([]);
    const [students, setStudents] = useState<IStudent[]>([]);
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [teacherLoading, setTeacherLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [pageSize] = useState(10);

    // Sorting states
    const [sortBy, setSortBy] = useState<string>('fullName');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    useEffect(() => {
        fetchPeople();
        fetchTeacher();
    }, [classId, currentPage, sortBy, sortOrder]);

    const fetchTeacher = async () => {
        setTeacherLoading(true);
        try {
            // First get class info to get teacher ID
            const classInfo = await getClassById(classId);
            if (classInfo.teacherId) {
                // Then get teacher details
                const teacherInfo = await getUserById(classInfo.teacherId);
                const teacher: ITeacher = {
                    ...teacherInfo,
                    avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(teacherInfo.fullName || teacherInfo.username)}&size=48&background=0d6efd&color=fff`
                };
                setTeachers([teacher]);
            }
        } catch (err: any) {
            console.error("Failed to fetch teacher:", err);
            // Set empty array if failed, don't show error for teacher
            setTeachers([]);
        } finally {
            setTeacherLoading(false);
        }
    };

    const fetchPeople = async () => {
        setLoading(true);
        setError(null);

        try {
            // Fetch real students data
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

    const handleSelectStudent = (studentId: string) => {
        if (selectedStudents.includes(studentId)) {
            setSelectedStudents(selectedStudents.filter(id => id !== studentId));
        } else {
            setSelectedStudents([...selectedStudents, studentId]);
        }
    };

    const handleSelectAllStudents = () => {
        if (selectedStudents.length === students.length) {
            setSelectedStudents([]);
        } else {
            setSelectedStudents(students.map(student => student.studentId));
        }
    };

    const handleSortChange = () => {
        if (sortBy === 'fullName') {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy('fullName');
            setSortOrder('asc');
        }
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        try {
            return new Date(dateString).toLocaleDateString();
        } catch {
            return dateString;
        }
    };

    const getStatusText = (isActive: number) => {
        switch (isActive) {
            case 1: return t('classDetail.peopleTab.active');
            case 0: return t('classDetail.peopleTab.inactive');
            case -1: return t('classDetail.peopleTab.deleted');
            default: return t('classDetail.peopleTab.unknown');
        }
    };

    const getStatusColor = (isActive: number) => {
        switch (isActive) {
            case 1: return '#28a745';
            case 0: return '#ffc107';
            case -1: return '#dc3545';
            default: return '#6c757d';
        }
    };

    if (loading || teacherLoading) {
        return (
            <div style={{ padding: '1rem', display: 'flex', justifyContent: 'center', color: '#e0e0e0' }}>
                <Spinner animation="border" style={{ color: '#0d6efd' }} />
                <span style={{ marginLeft: '0.5rem' }}>
                    {teacherLoading ? t('classDetail.peopleTab.loadingTeacher') : t('classDetail.peopleTab.loading')}
                </span>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                padding: '1rem',
                color: '#f5c6cb',
                backgroundColor: '#2d1b1e',
                border: '1px solid #842029',
                borderRadius: '4px',
                margin: '1rem'
            }}>
                {error}
            </div>
        );
    }

    return (
        <div style={{ padding: '1rem', color: '#e0e0e0' }}>
            {/* Phần Giáo viên */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #404040',
                paddingBottom: '0.5rem',
                marginBottom: '1.5rem'
            }}>
                <h2 style={{ margin: 0, fontWeight: 500, color: '#ffffff' }}>
                    {t('classDetail.peopleTab.teachersTitle')}
                </h2>
                {/*<div style={{*/}
                {/*    width: '24px',*/}
                {/*    height: '24px',*/}
                {/*    backgroundColor: '#404040',*/}
                {/*    borderRadius: '50%',*/}
                {/*    display: 'flex',*/}
                {/*    alignItems: 'center',*/}
                {/*    justifyContent: 'center',*/}
                {/*    cursor: 'pointer'*/}
                {/*}}>*/}
                {/*    <span style={{ fontSize: '1.2rem', color: '#e0e0e0' }}>+</span>*/}
                {/*</div>*/}
            </div>

            <div style={{ marginBottom: '2rem' }}>
                {teachers.length === 0 ? (
                    <div style={{
                        padding: '1rem',
                        textAlign: 'center',
                        color: '#a0a0a0',
                        backgroundColor: '#2a2a2a',
                        borderRadius: '4px'
                    }}>
                        {t('classDetail.peopleTab.noTeacher')}
                    </div>
                ) : (
                    teachers.map(teacher => (
                        <div key={teacher.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
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
                                <div style={{ fontSize: '1.1rem', fontWeight: '500', color: '#ffffff' }}>
                                    {teacher.fullName || teacher.username}
                                </div>
                                <div style={{ fontSize: '0.9rem', color: '#a0a0a0' }}>
                                    {teacher.email}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Phần Học sinh */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #404040',
                paddingBottom: '0.5rem',
                marginBottom: '1.5rem'
            }}>
                <h2 style={{ margin: 0, fontWeight: 500, color: '#ffffff' }}>
                    {t('classDetail.peopleTab.studentsTitle')}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: '#a0a0a0' }}>
                        {totalElements} {t('classDetail.peopleTab.studentCount')}
                    </span>

                </div>
            </div>



            {/* Danh sách học sinh */}
            <div>
                {students.length === 0 ? (
                    <div style={{
                        padding: '2rem',
                        textAlign: 'center',
                        color: '#a0a0a0',
                        backgroundColor: '#2a2a2a',
                        borderRadius: '4px'
                    }}>
                        {t('classDetail.peopleTab.noStudents')}
                    </div>
                ) : (
                    students.map(student => (
                        <div key={student.studentId} style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '1rem 0',
                            borderBottom: '1px solid #404040'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '50%',
                                    backgroundColor: '#505050',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginRight: '0.5rem',
                                    fontSize: '1.2rem',
                                    fontWeight: 'bold',
                                    color: 'white'
                                }}>
                                    {student.fullName?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '1.1rem', fontWeight: '500', color: '#ffffff' }}>
                                        {student.fullName || student.username}
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: '#a0a0a0' }}>
                                        {student.email}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#a0a0a0' }}>
                                        {student.userCode} • {t('classDetail.peopleTab.joined')}: {formatDate(student.enrolledAt)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginTop: '2rem',
                    padding: '1rem'
                }}>
                    <button
                        disabled={currentPage === 1}
                        onClick={() => handlePageChange(currentPage - 1)}
                        style={{
                            padding: '0.5rem 1rem',
                            border: '1px solid #404040',
                            borderRadius: '4px',
                            backgroundColor: currentPage === 1 ? '#2a2a2a' : '#404040',
                            color: currentPage === 1 ? '#606060' : '#e0e0e0',
                            cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
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
                                    border: '1px solid #404040',
                                    borderRadius: '4px',
                                    backgroundColor: pageNum === currentPage ? '#0d6efd' : '#404040',
                                    color: pageNum === currentPage ? 'white' : '#e0e0e0',
                                    cursor: 'pointer'
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
                            border: '1px solid #404040',
                            borderRadius: '4px',
                            backgroundColor: currentPage === totalPages ? '#2a2a2a' : '#404040',
                            color: currentPage === totalPages ? '#606060' : '#e0e0e0',
                            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {t('common.next')}
                    </button>
                </div>
            )}
        </div>
    );
};

export default ClassPeopleTab;