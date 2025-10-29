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

// Interface cho Teacher (sử dụng IUser từ userService)
interface ITeacher extends IUser {
    avatarUrl?: string;
}

// Interface cho Student từ API response
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

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        try {
            return new Date(dateString).toLocaleDateString('vi-VN');
        } catch {
            return dateString;
        }
    };

    const handleBulkAction = (action: string) => {
        if (selectedStudents.length === 0) return;

        switch (action) {
            case 'email':
                handleEmailStudents(selectedStudents);
                break;
            case 'remove':
                setStudentsToRemove(selectedStudents);
                setShowConfirmModal(true);
                break;
        }
    };

    const handleSingleAction = (action: string, studentId: string, event: React.MouseEvent) => {
        event.stopPropagation();
        setOpenDropdown(null);

        switch (action) {
            case 'email':
                handleEmailStudents([studentId]);
                break;
            case 'remove':
                setStudentsToRemove([studentId]);
                setShowConfirmModal(true);
                break;
        }
    };

    const handleEmailStudents = (studentIds: string[]) => {
        const selectedStudentsData = students.filter(student =>
            studentIds.includes(student.studentId)
        );
        const emails = selectedStudentsData.map(student => student.email).join(',');

        const defaultSubject = 'Thông báo từ lớp học';
        const defaultBody = 'Xin chào các em,\n\nTôi có thông báo quan trọng muốn chia sẻ với các em.\n\nTrân trọng,\nGiáo viên';

        const gmailUrl = `https://mail.google.com/mail/u/0/?view=cm&to=${encodeURIComponent(emails)}&su=${encodeURIComponent(defaultSubject)}&body=${encodeURIComponent(defaultBody)}`;

        window.open(gmailUrl, '_blank');
    };

    const handleRemoveStudents = async () => {
        try {
            console.log('Removing students:', studentsToRemove);

            await fetchPeople();
            setSelectedStudents([]);
            setShowConfirmModal(false);
            setStudentsToRemove([]);

            alert(t('classDetail.peopleTab.removeSuccess'));
        } catch (error) {
            console.error('Failed to remove students:', error);
            alert(t('classDetail.peopleTab.removeError'));
        }
    };

    const toggleDropdown = (studentId: string, event: React.MouseEvent) => {
        event.stopPropagation();
        setOpenDropdown(openDropdown === studentId ? null : studentId);
    };

    if (loading || teacherLoading) {
        return (
            <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Spinner animation="border" style={{ color: '#3b82f6' }} />
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                padding: '1.5rem',
                color: '#dc2626',
                backgroundColor: '#fee2e2',
                border: '1px solid #fca5a5',
                borderRadius: '12px',
                margin: '1rem'
            }}>
                {error}
            </div>
        );
    }

    return (
        <div>
            {/* Phần Giáo viên */}
            <div style={{
                padding: '1.5rem',
                backgroundColor: '#fff',
                border: '1px solid #e2e8f0',
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
                        color: '#1e293b'
                    }}>
                        {t('classDetail.peopleTab.teachersTitle')}
                    </h2>
                </div>

                {teachers.length === 0 ? (
                    <div style={{
                        padding: '2rem',
                        textAlign: 'center',
                        color: '#64748b',
                        backgroundColor: '#f8fafc',
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
                            backgroundColor: '#f8fafc',
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
                                    color: '#1e293b',
                                    marginBottom: '0.25rem'
                                }}>
                                    {teacher.fullName || teacher.username}
                                </div>
                                <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
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
                backgroundColor: '#fff',
                border: '1px solid #e2e8f0',
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
                            color: '#1e293b'
                        }}>
                            {t('classDetail.peopleTab.studentsTitle')}
                        </h2>
                        <p style={{
                            margin: 0,
                            fontSize: '0.875rem',
                            color: '#64748b'
                        }}>
                            {totalElements} {t('classDetail.peopleTab.studentCount')}
                        </p>
                    </div>
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

                {/* Thanh hành động hàng loạt */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem',
                    padding: '0.75rem 1rem',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '0.5rem' }}>
                            <input
                                type="checkbox"
                                checked={selectedStudents.length === students.length && students.length > 0}
                                onChange={handleSelectAllStudents}
                                style={{
                                    width: '18px',
                                    height: '18px',
                                    cursor: 'pointer',
                                    accentColor: '#3b82f6'
                                }}
                            />
                            <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
                                Chọn tất cả
                            </span>
                        </label>
                        {selectedStudents.length > 0 && (
                            <>
                                <div style={{
                                    padding: '0.375rem 0.75rem',
                                    backgroundColor: '#eff6ff',
                                    color: '#2563eb',
                                    borderRadius: '6px',
                                    fontSize: '0.875rem',
                                    fontWeight: '600'
                                }}>
                                    {selectedStudents.length} đã chọn
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => handleBulkAction('email')}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            border: '1px solid #cbd5e1',
                                            borderRadius: '6px',
                                            backgroundColor: 'white',
                                            color: '#475569',
                                            cursor: 'pointer',
                                            fontSize: '0.875rem',
                                            fontWeight: '500',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                                    >
                                        <svg style={{ width: '14px', height: '14px', marginRight: '0.375rem', display: 'inline-block', verticalAlign: 'middle' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        Gửi email
                                    </button>
                                    <button
                                        onClick={() => handleBulkAction('remove')}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            border: '1px solid #fca5a5',
                                            borderRadius: '6px',
                                            backgroundColor: 'white',
                                            color: '#dc2626',
                                            cursor: 'pointer',
                                            fontSize: '0.875rem',
                                            fontWeight: '500',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                                    >
                                        <svg style={{ width: '14px', height: '14px', marginRight: '0.375rem', display: 'inline-block', verticalAlign: 'middle' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        Xóa
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Danh sách học sinh */}
                <div>
                    {students.length === 0 ? (
                        <div style={{
                            padding: '3rem',
                            textAlign: 'center',
                            color: '#64748b',
                            backgroundColor: '#f8fafc',
                            borderRadius: '8px'
                        }}>
                            <svg style={{ width: '64px', height: '64px', margin: '0 auto 1rem', color: '#cbd5e1' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                    backgroundColor: '#fff',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    transition: 'all 0.2s'
                                }}
                                     onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                     onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedStudents.includes(student.studentId)}
                                            onChange={() => handleSelectStudent(student.studentId)}
                                            style={{
                                                width: '18px',
                                                height: '18px',
                                                cursor: 'pointer',
                                                accentColor: '#3b82f6'
                                            }}
                                        />
                                        <div style={{
                                            width: '48px',
                                            height: '48px',
                                            borderRadius: '50%',
                                            backgroundColor: '#cbd5e1',
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
                                                color: '#1e293b',
                                                marginBottom: '0.25rem'
                                            }}>
                                                {student.fullName || student.username}
                                            </div>
                                            <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>
                                                {student.email}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                                {student.userCode} • Tham gia: {formatDate(student.enrolledAt)}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ position: 'relative' }}>
                                        <button
                                            style={{
                                                cursor: 'pointer',
                                                fontSize: '1.25rem',
                                                padding: '0.5rem',
                                                border: 'none',
                                                backgroundColor: 'transparent',
                                                color: '#64748b',
                                                borderRadius: '6px'
                                            }}
                                            onClick={(e) => toggleDropdown(student.studentId, e)}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            ⋮
                                        </button>
                                        {openDropdown === student.studentId && (
                                            <div style={{
                                                position: 'absolute',
                                                right: 0,
                                                top: '100%',
                                                backgroundColor: 'white',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '8px',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                                zIndex: 1000,
                                                minWidth: '180px',
                                                overflow: 'hidden'
                                            }}>
                                                <button
                                                    style={{
                                                        width: '100%',
                                                        padding: '0.75rem 1rem',
                                                        border: 'none',
                                                        backgroundColor: 'transparent',
                                                        textAlign: 'left',
                                                        cursor: 'pointer',
                                                        borderBottom: '1px solid #e2e8f0',
                                                        fontSize: '0.875rem',
                                                        color: '#475569',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.5rem'
                                                    }}
                                                    onClick={(e) => handleSingleAction('email', student.studentId, e)}
                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                >
                                                    <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                    </svg>
                                                    {t('classDetail.peopleTab.emailStudent')}
                                                </button>
                                                <button
                                                    style={{
                                                        width: '100%',
                                                        padding: '0.75rem 1rem',
                                                        border: 'none',
                                                        backgroundColor: 'transparent',
                                                        textAlign: 'left',
                                                        cursor: 'pointer',
                                                        fontSize: '0.875rem',
                                                        color: '#dc2626',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.5rem'
                                                    }}
                                                    onClick={(e) => handleSingleAction('remove', student.studentId, e)}
                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                >
                                                    <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                    {t('classDetail.peopleTab.removeStudent')}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginTop: '1.5rem',
                        padding: '1rem 0'
                    }}>
                        <button
                            disabled={currentPage === 1}
                            onClick={() => handlePageChange(currentPage - 1)}
                            style={{
                                padding: '0.5rem 1rem',
                                border: '1px solid #e2e8f0',
                                borderRadius: '6px',
                                backgroundColor: currentPage === 1 ? '#f8fafc' : 'white',
                                color: currentPage === 1 ? '#94a3b8' : '#475569',
                                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: '500'
                            }}
                        >
                            Trước
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
                                        padding: '0.5rem 0.875rem',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '6px',
                                        backgroundColor: pageNum === currentPage ? '#3b82f6' : 'white',
                                        color: pageNum === currentPage ? 'white' : '#475569',
                                        cursor: 'pointer',
                                        fontSize: '0.875rem',
                                        fontWeight: '500',
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
                                border: '1px solid #e2e8f0',
                                borderRadius: '6px',
                                backgroundColor: currentPage === totalPages ? '#f8fafc' : 'white',
                                color: currentPage === totalPages ? '#94a3b8' : '#475569',
                                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: '500'
                            }}
                        >
                            Sau
                        </button>
                    </div>
                )}
            </div>

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1050
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        padding: '2rem',
                        maxWidth: '500px',
                        width: '90%',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.15)'
                    }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            backgroundColor: '#fee2e2',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1rem'
                        }}>
                            <svg style={{ width: '24px', height: '24px', color: '#dc2626' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 style={{
                            marginTop: 0,
                            marginBottom: '0.5rem',
                            textAlign: 'center',
                            fontSize: '1.25rem',
                            fontWeight: '600',
                            color: '#1e293b'
                        }}>
                            {t('classDetail.peopleTab.confirmRemoval')}
                        </h3>
                        <p style={{
                            marginBottom: '2rem',
                            color: '#64748b',
                            textAlign: 'center',
                            fontSize: '0.875rem'
                        }}>
                            {studentsToRemove.length === 1
                                ? t('classDetail.peopleTab.confirmRemoveOne')
                                : t('classDetail.peopleTab.confirmRemoveMultiple', { count: studentsToRemove.length })
                            }
                        </p>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                            <button
                                style={{
                                    padding: '0.625rem 1.5rem',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    backgroundColor: 'white',
                                    color: '#475569',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    transition: 'all 0.2s'
                                }}
                                onClick={() => {
                                    setShowConfirmModal(false);
                                    setStudentsToRemove([]);
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                style={{
                                    padding: '0.625rem 1.5rem',
                                    border: 'none',
                                    borderRadius: '8px',
                                    backgroundColor: '#dc2626',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    transition: 'all 0.2s'
                                }}
                                onClick={handleRemoveStudents}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                            >
                                {t('common.confirm')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClassPeopleTab;