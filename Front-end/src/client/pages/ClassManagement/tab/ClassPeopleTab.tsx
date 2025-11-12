import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Spinner } from 'react-bootstrap';
import {
    getStudentsInClass,
    GetStudentsInClassOptions,
    getClassById,
    importStudentsToClass, type StudentImportRequest
} from '../../../../shared/services/classManagementService';
import { getUserById, IUser } from '../../../../shared/services/userService';
import * as XLSX from 'xlsx';
import {Button, Upload } from 'antd';
import {useNotification} from "../../../../shared/notification/useNotification.ts";

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

const ClassPeopleTab: React.FC<ClassPeopleTabProps> = ({ classId }) => {
    const { t } = useTranslation();
    const { message } = useNotification();
    const [teachers, setTeachers] = useState<ITeacher[]>([]);
    const [students, setStudents] = useState<IStudent[]>([]);
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [teacherLoading, setTeacherLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal states
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [studentsToRemove, setStudentsToRemove] = useState<string[]>([]);

    // Dropdown states
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);

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

    // Close dropdown when clicking outside
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
                    avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(teacherInfo.fullName || teacherInfo.username)}&size=48&background=2563eb&color=fff`
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

                {teachers.length === 0 ? (
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
                                color: 'white'
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
                        <p style={{
                            margin: 0,
                            fontSize: '0.875rem',
                            color: '#9ca3af'
                        }}>
                            {totalElements} {t('classDetail.peopleTab.studentCount')}
                        </p>
                    </div>
                </div>

                {/* Danh sách học sinh */}
                <div>
                    {students.length === 0 ? (
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
                                            color: 'white'
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
                                            <div style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '0.25rem' }}>
                                                {student.email}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ClassPeopleTab;