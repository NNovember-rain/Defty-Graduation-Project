import ClassPeopleTab from './tab/ClassPeopleTab.tsx';
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom'; // Import useSearchParams
import { useTranslation } from 'react-i18next';
import { Spinner } from 'react-bootstrap';
import { getClassById, IClass } from '../../../shared/services/classManagementService.ts';
import AssignmentTab from "./tab/Assignment/AssignmentTab.tsx";
import TeacherStreamTab from './tab/streamTab.tsx';

// --- Components & Interfaces (giữ nguyên) ---

interface BreadcrumbItem {
    label: string;
    path?: string;
}

interface BreadcrumbProps {
    items: BreadcrumbItem[];
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
    return (
        <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
                {items.map((item, index) => (
                    <li key={index} className="breadcrumb__item">
                        {item.path ? (
                            <Link to={item.path} className="breadcrumb__item--link">
                                {item.label}
                            </Link>
                        ) : (
                            <span>{item.label}</span>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
};

// Mock data cho deadline assignments (giữ nguyên)
interface IDeadlineAssignment {
    id: number;
    title: string;
    dueDate: string;
    dueTime: string;
    status: 'urgent' | 'upcoming' | 'overdue';
    totalPoints: number;
}

const mockDeadlines: IDeadlineAssignment[] = [
    { id: 1, title: 'Assignment 1: Introduction to React', dueDate: '2025-10-26', dueTime: '23:59', status: 'upcoming', totalPoints: 100 },
    { id: 2, title: 'Lab 2: State Management', dueDate: '2025-10-25', dueTime: '18:00', status: 'urgent', totalPoints: 50 },
    { id: 3, title: 'Project Proposal', dueDate: '2025-10-23', dueTime: '12:00', status: 'overdue', totalPoints: 200 },
];

// --- ClassDetailPage Component (đã chỉnh sửa) ---

const ClassDetailPage: React.FC = () => {
    const { t } = useTranslation();
    const { id } = useParams<{ id: string }>();
    // Sử dụng useSearchParams để quản lý query params trong URL
    const [searchParams, setSearchParams] = useSearchParams();

    const [classData, setClassData] = useState<IClass | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Lấy tab hiện tại từ URL. Mặc định là 'stream'
    const activeTabParam = searchParams.get('tab') || 'stream';
    const validTabs = ['stream', 'classwork', 'people'];
    // Đảm bảo activeTab luôn là một giá trị hợp lệ
    const activeTab = validTabs.includes(activeTabParam) ? activeTabParam : 'stream';


    // Breadcrumb items (sử dụng useMemo để tránh re-render không cần thiết)
    const breadcrumbItems: BreadcrumbItem[] = useMemo(() => [
        { label: t('classPage.breadcrumb.home'), path: '/' },
        { label: t('classPage.breadcrumb.adminDashboard'), path: '/admin' },
        { label: t('classPage.breadcrumb.classManagement'), path: '/admin/class' },
        { label: classData?.className || '', path: undefined }
    ], [classData?.className, t]);

    // --- Xử lý Fetch Dữ liệu (giữ nguyên) ---
    useEffect(() => {
        const fetchClassDetails = async () => {
            if (!id) {
                setError(t('classDetail.error.noId'));
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);
            try {
                const data = await getClassById(parseInt(id, 10));
                setClassData(data);
            } catch (err: any) {
                console.error('Failed to fetch class details:', err);
                setError(err.message || t('common.errorFetchingData'));
            } finally {
                setLoading(false);
            }
        };

        fetchClassDetails();
    }, [id, t]);


    // --- Hàm chuyển đổi tab và cập nhật URL ---
    const handleTabChange = (tab: string) => {
        // Cập nhật URL với tab mới
        setSearchParams({ tab });
    };


    // --- Các hàm hỗ trợ cho render (giữ nguyên) ---
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'overdue': return { bg: '#fef2f2', border: '#fca5a5', text: '#dc2626' };
            case 'urgent': return { bg: '#fffbeb', border: '#fcd34d', text: '#f59e0b' };
            case 'upcoming': return { bg: '#f0fdf4', border: '#86efac', text: '#16a34a' };
            default: return { bg: '#f8fafc', border: '#cbd5e1', text: '#64748b' };
        }
    };

    const getStatusIcon = (status: string) => {
        const iconStyle = { width: '18px', height: '18px' };
        switch (status) {
            case 'overdue':
                return (
                    <svg style={iconStyle} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                        <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2"/>
                        <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2"/>
                    </svg>
                );
            case 'urgent':
                return (
                    <svg style={iconStyle} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                        <polyline points="12 6 12 12 16 14" strokeWidth="2"/>
                    </svg>
                );
            case 'upcoming':
                return (
                    <svg style={iconStyle} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeWidth="2"/>
                        <polyline points="22 4 12 14.01 9 11.01" strokeWidth="2"/>
                    </svg>
                );
            default:
                return (
                    <svg style={iconStyle} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                        <polyline points="12 6 12 12 16 14" strokeWidth="2"/>
                    </svg>
                );
        }
    };

    // Hàm này giữ nguyên vì nó chỉ được dùng trong TeacherStreamTab (đã được comment out)
    // const formatDate = (dateString: string, timeString: string) => { /* ... */ };


    // --- renderStreamTab (sử dụng component TeacherStreamTab) ---
    const renderStreamTab = () => {
        return <TeacherStreamTab classData={classData} />;
        // Phần code UI cũ đã bị comment out
    };


    // --- renderContent (sử dụng activeTab từ URL) ---
    const renderContent = () => {
        // classData đã được kiểm tra không null ở cuối component
        if (!classData) return null;

        switch (activeTab) {
            case 'stream':
                return renderStreamTab();
            case 'classwork':
                // Truyền classData.id an toàn
                return <AssignmentTab classId={classData.id} />;
            case 'people':
                // Truyền classData.id an toàn
                return <ClassPeopleTab classId={classData.id} />;
            default:
                // Nếu activeTab không hợp lệ (mặc dù đã xử lý ở trên), trả về null hoặc tab mặc định
                return renderStreamTab();
        }
    };


    // --- Kiểm tra trạng thái tải và lỗi (giữ nguyên) ---
    if (loading) {
        return <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}><Spinner animation="border" /></div>;
    }
    if (error) {
        return <div style={{
            padding: '1.5rem',
            color: '#721c24',
            backgroundColor: '#f8d7da',
            border: '1px solid #f5c6cb',
            borderRadius: '8px',
            margin: '1rem'
        }}>{error}</div>;
    }
    if (!classData) {
        return <div style={{
            padding: '1.5rem',
            color: '#856404',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffeeba',
            borderRadius: '8px',
            margin: '1rem'
        }}>{t('classDetail.error.classNotFound')}</div>;
    }


    // --- Render Component chính ---
    return (
        <div style={{ padding: '1.5rem', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
            {/* Header */}
            <div style={{
                padding: '1.5rem',
                marginBottom: '1.5rem',
                backgroundColor: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b', margin: '0 0 0.5rem 0' }}>
                            {classData.className}
                        </h1>
                    </div>
                    <Breadcrumb items={breadcrumbItems} />
                </div>

                {/* Navigation Tabs */}
                <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem', marginTop: '1rem' }}>
                    {validTabs.map(tab => (
                        <button
                            key={tab}
                            style={{
                                padding: '0.625rem 1.25rem',
                                border: 'none',
                                backgroundColor: activeTab === tab ? '#eff6ff' : 'transparent',
                                color: activeTab === tab ? '#2563eb' : '#64748b',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: activeTab === tab ? '600' : '500',
                                transition: 'all 0.2s'
                            }}
                            // Cập nhật hàm onClick để gọi handleTabChange
                            onClick={() => handleTabChange(tab)}
                            onMouseEnter={(e) => {
                                if (activeTab !== tab) {
                                    e.currentTarget.style.backgroundColor = '#f1f5f9';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (activeTab !== tab) {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                }
                            }}
                        >
                            {t(`classDetail.tabs.${tab}`)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Nội dung chính dựa trên tab đã chọn */}
            {renderContent()}
        </div>
    );
};

export default ClassDetailPage;