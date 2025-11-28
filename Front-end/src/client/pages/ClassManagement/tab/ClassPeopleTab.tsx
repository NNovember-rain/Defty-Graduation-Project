import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    getStudentsInClass,
    GetStudentsInClassOptions,
    getClassById,
    importStudentsToClass,
    type StudentImportRequest
} from '../../../../shared/services/classManagementService';
import { getUserById, IUser } from '../../../../shared/services/userService';
import * as XLSX from 'xlsx';
import { useNotification } from "../../../../shared/notification/useNotification.ts";

interface ITeacher extends IUser {
    avatarUrl?: string;
}

interface IStudent {
    studentId: string;
    username: string;
    fullName: string;
    email: string;
    dob: string;
    userCode: string;
    createdDate: string;
    isActive: number;
    enrolledAt: string;
    enrollmentStatus: string;
    roles: any[];
}

interface ClassPeopleTabProps {
    classId: number;
}

// Skeleton Component for Dark Theme
const Skeleton: React.FC<{
    width?: string;
    height?: string;
    borderRadius?: string;
    style?: React.CSSProperties
}> = ({ width = '100%', height = '20px', borderRadius = '4px', style = {} }) => (
    <div style={{
        width,
        height,
        borderRadius,
        backgroundColor: '#3f3f3f',
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        ...style
    }} />
);

// Teacher Skeleton
const TeacherSkeleton: React.FC = () => (
    <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '1rem',
        backgroundColor: '#252525',
        borderRadius: '8px'
    }}>
        <Skeleton
            width="56px"
            height="56px"
            borderRadius="50%"
            style={{ marginRight: '1rem', flexShrink: 0 }}
        />
        <div style={{ flex: 1 }}>
            <Skeleton height="24px" width="60%" style={{ marginBottom: '0.5rem' }} />
            <Skeleton height="18px" width="40%" />
        </div>
    </div>
);

// Student Skeleton
const StudentSkeleton: React.FC = () => (
    <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem',
        backgroundColor: '#2a2a2a',
        border: '1px solid #3a3a3a',
        borderRadius: '8px'
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
            <Skeleton
                width="48px"
                height="48px"
                borderRadius="50%"
                style={{ flexShrink: 0 }}
            />
            <div style={{ flex: 1 }}>
                <Skeleton height="20px" width="50%" style={{ marginBottom: '0.5rem' }} />
                <Skeleton height="16px" width="70%" />
            </div>
        </div>
    </div>
);

const ClassPeopleTab: React.FC<ClassPeopleTabProps> = ({ classId }) => {
    const { t } = useTranslation();
    const { message } = useNotification();
    const [teachers, setTeachers] = useState<ITeacher[]>([]);
    const [students, setStudents] = useState<IStudent[]>([]);
    const [loading, setLoading] = useState(true);
    const [teacherLoading, setTeacherLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [pageSize] = useState(10);

    // Sorting states
    const [sortBy] = useState<string>('fullName');
    const [sortOrder] = useState<'asc' | 'desc'>('asc');

    // Add keyframe animation
    useEffect(() => {
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
        fetchPeople();
        fetchTeacher();
    }, [classId, currentPage, sortBy, sortOrder]);

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
        try {
            const classInfo = await getClassById(classId);
            if (classInfo.teacherId) {
                const teacherInfo = await getUserById(classInfo.teacherId);
                const teacher: ITeacher = {
                    ...teacherInfo,
                    avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(teacherInfo.fullName || teacherInfo.username)}&size=56&background=2563eb&color=fff`
                };
                setTeachers([teacher]);
            }
        } catch (err: any) {
            console.error("Failed to fetch teacher:", err);
            setTeachers([]);
        } finally {
            setTeacherLoading(false);
        }
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

    if (error) {
        return (
            <div style={{
                padding: '1.5rem',
                color: '#fca5a5',
                backgroundColor: '#450a0a',
                border: '1px solid #7f1d1d',
                borderRadius: '12px',
                margin: '1rem'
            }}>
                {error}
            </div>
        );
    }

    return (
        <div style={{ backgroundColor: '#1e1e1e', minHeight: '100vh' }}>
            {/* Phần Giáo viên */}
            <div style={{
                padding: '1.5rem',
                backgroundColor: '#2a2a2a',
                border: '1px solid #3a3a3a',
                borderRadius: '12px',
                marginBottom: '1.5rem'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.5rem'
                }}>
                    <h2 style={{
                        margin: 0,
                        fontSize: '1.25rem',
                        fontWeight: '600',
                        color: '#e5e7eb'
                    }}>
                        {t('classDetail.peopleTab.teachersTitle')}
                    </h2>
                </div>

                {teacherLoading ? (
                    <TeacherSkeleton />
                ) : teachers.length === 0 ? (
                    <div style={{
                        padding: '2rem',
                        textAlign: 'center',
                        color: '#9ca3af',
                        backgroundColor: '#252525',
                        borderRadius: '8px'
                    }}>
                        {t('classDetail.peopleTab.noTeacher')}
                    </div>
                ) : (
                    teachers.map(teacher => (
                        <div key={teacher.id} style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '1rem',
                            backgroundColor: '#252525',
                            borderRadius: '8px'
                        }}>
                            <div style={{
                                width: '56px',
                                height: '56px',
                                borderRadius: '50%',
                                backgroundColor: '#2563eb',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: '1rem',
                                fontSize: '1.5rem',
                                fontWeight: '600',
                                color: 'white',
                                flexShrink: 0
                            }}>
                                {(teacher.fullName || teacher.username)?.charAt(0)?.toUpperCase() || 'T'}
                            </div>
                            <div>
                                <div style={{
                                    fontSize: '1.125rem',
                                    fontWeight: '600',
                                    color: '#e5e7eb',
                                    marginBottom: '0.25rem'
                                }}>
                                    {teacher.fullName || teacher.username}
                                </div>
                                <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
                                    {teacher.email}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Phần Học sinh */}
            <div style={{
                padding: '1.5rem',
                backgroundColor: '#2a2a2a',
                border: '1px solid #3a3a3a',
                borderRadius: '12px'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.5rem'
                }}>
                    <div>
                        <h2 style={{
                            margin: '0 0 0.25rem 0',
                            fontSize: '1.25rem',
                            fontWeight: '600',
                            color: '#e5e7eb'
                        }}>
                            {t('classDetail.peopleTab.studentsTitle')}
                        </h2>
                        {!loading && (
                            <p style={{
                                margin: 0,
                                fontSize: '0.875rem',
                                color: '#9ca3af'
                            }}>
                                {totalElements} {t('classDetail.peopleTab.studentCount')}
                            </p>
                        )}
                    </div>
                </div>

                {/* Danh sách học sinh */}
                <div>
                    {loading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {Array.from({ length: pageSize }).map((_, idx) => (
                                <StudentSkeleton key={idx} />
                            ))}
                        </div>
                    ) : students.length === 0 ? (
                        <div style={{
                            padding: '3rem',
                            textAlign: 'center',
                            color: '#9ca3af',
                            backgroundColor: '#252525',
                            borderRadius: '8px'
                        }}>
                            <svg style={{ width: '64px', height: '64px', margin: '0 auto 1rem', color: '#4b5563' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <p style={{ margin: 0, fontSize: '1rem' }}>{t('classDetail.peopleTab.noStudents')}</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {students.map(student => (
                                <div key={student.studentId} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '1rem',
                                    backgroundColor: '#2a2a2a',
                                    border: '1px solid #3a3a3a',
                                    borderRadius: '8px',
                                    transition: 'all 0.2s'
                                }}
                                     onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#333333'}
                                     onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2a2a2a'}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                                        <div style={{
                                            width: '48px',
                                            height: '48px',
                                            borderRadius: '50%',
                                            backgroundColor: '#4b5563',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '1.125rem',
                                            fontWeight: '600',
                                            color: 'white',
                                            flexShrink: 0
                                        }}>
                                            {student.fullName?.charAt(0)?.toUpperCase() || 'U'}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{
                                                fontSize: '1rem',
                                                fontWeight: '600',
                                                color: '#e5e7eb',
                                                marginBottom: '0.25rem'
                                            }}>
                                                {student.fullName || student.username}
                                            </div>
                                            <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
                                                {student.email}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && !loading && (
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
                            onClick={() => setCurrentPage(currentPage - 1)}
                            style={{
                                padding: '0.5rem 1rem',
                                border: '1px solid #3a3a3a',
                                borderRadius: '6px',
                                backgroundColor: currentPage === 1 ? '#252525' : '#2a2a2a',
                                color: currentPage === 1 ? '#6b7280' : '#e5e7eb',
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
                                    onClick={() => setCurrentPage(pageNum)}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        border: '1px solid #3a3a3a',
                                        borderRadius: '6px',
                                        backgroundColor: pageNum === currentPage ? '#2563eb' : '#2a2a2a',
                                        color: pageNum === currentPage ? 'white' : '#e5e7eb',
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
                            onClick={() => setCurrentPage(currentPage + 1)}
                            style={{
                                padding: '0.5rem 1rem',
                                border: '1px solid #3a3a3a',
                                borderRadius: '6px',
                                backgroundColor: currentPage === totalPages ? '#252525' : '#2a2a2a',
                                color: currentPage === totalPages ? '#6b7280' : '#e5e7eb',
                                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: 500
                            }}
                        >
                            {t('common.next')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClassPeopleTab;