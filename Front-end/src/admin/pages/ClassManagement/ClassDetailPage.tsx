import ClassPeopleTab from './tab/ClassPeopleTab.tsx';
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Spinner } from 'react-bootstrap';
import { getClassById, IClass } from '../../../shared/services/classManagementService.ts';
import AssignmentTab from "./tab/Assignment/AssignmentTab.tsx";
import TeacherStreamTab from './tab/streamTab.tsx';

// Breadcrumb component
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

// Mock data cho deadline assignments
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

const ClassDetailPage: React.FC = () => {
    const { t } = useTranslation();
    const { id } = useParams<{ id: string }>();

    const [classData, setClassData] = useState<IClass | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<string>('stream');
    // const [activeTab, setActiveTab] = useState<string>('classwork');

    // Breadcrumb items
    const breadcrumbItems: BreadcrumbItem[] = [
        { label: t('classPage.breadcrumb.home'), path: '/' },
        { label: t('classPage.breadcrumb.adminDashboard'), path: '/admin' },
        { label: t('classPage.breadcrumb.classManagement'), path: '/admin/class' },
        { label: classData?.className || '', path: undefined }
    ];

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

    const formatDate = (dateString: string, timeString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);

        const diffTime = date.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return `Quá hạn ${Math.abs(diffDays)} ngày`;
        if (diffDays === 0) return `Hôm nay lúc ${timeString}`;
        if (diffDays === 1) return `Ngày mai lúc ${timeString}`;
        return `${diffDays} ngày nữa - ${timeString}`;
    };

    const renderStreamTab = () => {
        const urgentCount = mockDeadlines.filter(d => d.status === 'urgent').length;
        const overdueCount = mockDeadlines.filter(d => d.status === 'overdue').length;
        return <TeacherStreamTab classData={classData} />;

        // return (
        //     <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem' }}>
        //         {/* Main Content */}
        //         <div>
        //             {/* Quick Stats */}
        //             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        //                 <div style={{ padding: '1.25rem', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
        //                     <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
        //                         <div style={{ padding: '0.5rem', backgroundColor: '#dbeafe', borderRadius: '8px', color: '#2563eb' }}>
        //                             <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        //                             </svg>
        //                         </div>
        //                         <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Bài tập chưa làm</span>
        //                     </div>
        //                     <p style={{ fontSize: '1.875rem', fontWeight: '700', color: '#1e293b', margin: 0 }}>{mockDeadlines.length}</p>
        //                 </div>
        //
        //                 <div style={{ padding: '1.25rem', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
        //                     <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
        //                         <div style={{ padding: '0.5rem', backgroundColor: '#fef3c7', borderRadius: '8px', color: '#f59e0b' }}>
        //                             <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                                 <circle cx="12" cy="12" r="10" strokeWidth="2"/>
        //                                 <polyline points="12 6 12 12 16 14" strokeWidth="2"/>
        //                             </svg>
        //                         </div>
        //                         <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Sắp đến hạn</span>
        //                     </div>
        //                     <p style={{ fontSize: '1.875rem', fontWeight: '700', color: '#1e293b', margin: 0 }}>{urgentCount}</p>
        //                 </div>
        //
        //                 <div style={{ padding: '1.25rem', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
        //                     <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
        //                         <div style={{ padding: '0.5rem', backgroundColor: '#fee2e2', borderRadius: '8px', color: '#dc2626' }}>
        //                             <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                                 <circle cx="12" cy="12" r="10" strokeWidth="2"/>
        //                                 <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2"/>
        //                                 <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2"/>
        //                             </svg>
        //                         </div>
        //                         <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Quá hạn</span>
        //                     </div>
        //                     <p style={{ fontSize: '1.875rem', fontWeight: '700', color: '#1e293b', margin: 0 }}>{overdueCount}</p>
        //                 </div>
        //             </div>
        //
        //             {/* Deadlines List */}
        //             <div>
        //                 <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e293b', marginBottom: '1rem' }}>
        //                     Bài tập cần hoàn thành
        //                 </h3>
        //
        //                 {mockDeadlines.length === 0 ? (
        //                     <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
        //                         <svg style={{ width: '48px', height: '48px', color: '#10b981', margin: '0 auto 1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        //                         </svg>
        //                         <p style={{ fontSize: '1rem', color: '#64748b', margin: 0 }}>Tuyệt vời! Bạn đã hoàn thành tất cả bài tập</p>
        //                     </div>
        //                 ) : (
        //                     <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        //                         {mockDeadlines.map(assignment => {
        //                             const colors = getStatusColor(assignment.status);
        //                             return (
        //                                 <div
        //                                     key={assignment.id}
        //                                     style={{
        //                                         padding: '1.25rem',
        //                                         backgroundColor: '#fff',
        //                                         border: `1px solid ${colors.border}`,
        //                                         borderLeft: `4px solid ${colors.text}`,
        //                                         borderRadius: '12px',
        //                                         transition: 'all 0.2s',
        //                                         cursor: 'pointer'
        //                                     }}
        //                                     onMouseEnter={(e) => {
        //                                         e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
        //                                         e.currentTarget.style.transform = 'translateY(-2px)';
        //                                     }}
        //                                     onMouseLeave={(e) => {
        //                                         e.currentTarget.style.boxShadow = 'none';
        //                                         e.currentTarget.style.transform = 'translateY(0)';
        //                                     }}
        //                                 >
        //                                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        //                                         <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#1e293b', margin: 0, flex: 1 }}>
        //                                             {assignment.title}
        //                                         </h4>
        //                                         <div
        //                                             style={{
        //                                                 display: 'inline-flex',
        //                                                 alignItems: 'center',
        //                                                 gap: '0.375rem',
        //                                                 padding: '0.375rem 0.75rem',
        //                                                 backgroundColor: colors.bg,
        //                                                 color: colors.text,
        //                                                 borderRadius: '6px',
        //                                                 fontSize: '0.75rem',
        //                                                 fontWeight: '600'
        //                                             }}
        //                                         >
        //                                             {getStatusIcon(assignment.status)}
        //                                             <span style={{ textTransform: 'uppercase' }}>
        //                                                 {assignment.status === 'overdue' ? 'Quá hạn' :
        //                                                     assignment.status === 'urgent' ? 'Gấp' : 'Sắp tới'}
        //                                             </span>
        //                                         </div>
        //                                     </div>
        //
        //                                     <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.875rem', color: '#64748b' }}>
        //                                         <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        //                                             <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                                                 <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2"/>
        //                                                 <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2"/>
        //                                                 <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2"/>
        //                                                 <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2"/>
        //                                             </svg>
        //                                             <span>{formatDate(assignment.dueDate, assignment.dueTime)}</span>
        //                                         </div>
        //                                         <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        //                                             <span>Điểm:</span>
        //                                             <span style={{ fontWeight: '600', color: '#1e293b' }}>{assignment.totalPoints}</span>
        //                                         </div>
        //                                     </div>
        //                                 </div>
        //                             );
        //                         })}
        //                     </div>
        //                 )}
        //             </div>
        //         </div>
        //
        //         {/* Sidebar */}
        //         <div>
        //             <div style={{ position: 'sticky', top: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        //                 {/* Class Code */}
        //                 <div style={{ padding: '1.25rem', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
        //                     <h5 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#64748b', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        //                         {t('classDetail.classCode')}
        //                     </h5>
        //                     <div style={{
        //                         padding: '0.75rem',
        //                         backgroundColor: '#f1f5f9',
        //                         borderRadius: '8px',
        //                         border: '2px dashed #cbd5e1',
        //                         textAlign: 'center'
        //                     }}>
        //                         <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2563eb', margin: 0, letterSpacing: '0.1em' }}>
        //                             {classData?.inviteCode || 'N/A'}
        //                         </p>
        //                     </div>
        //                 </div>
        //
        //                 {/* Class Info */}
        //                 <div style={{ padding: '1.25rem', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
        //                     <h5 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#64748b', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        //                         Thông tin lớp
        //                     </h5>
        //                     <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        //                         {/*{classData?.section && (*/}
        //                         {/*    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>*/}
        //                         {/*        <svg style={{ width: '18px', height: '18px', color: '#64748b' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">*/}
        //                         {/*            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />*/}
        //                         {/*        </svg>*/}
        //                         {/*        <span style={{ fontSize: '0.875rem', color: '#475569' }}>Phòng: {classData.section}</span>*/}
        //                         {/*    </div>*/}
        //                         {/*)}*/}
        //                         {classData?.className && (
        //                             <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        //                                 <svg style={{ width: '18px', height: '18px', color: '#64748b' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        //                                 </svg>
        //                                 <span style={{ fontSize: '0.875rem', color: '#475569' }}>Môn: {classData.className}</span>
        //                             </div>
        //                         )}
        //                         <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        //                             <svg style={{ width: '18px', height: '18px', color: '#64748b' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        //                             </svg>
        //                             <span style={{ fontSize: '0.875rem', color: '#475569' }}>
        //                                 Tạo: {new Date(classData?.createdDate || '').toLocaleDateString('vi-VN')}
        //                             </span>
        //                         </div>
        //                     </div>
        //                 </div>
        //
        //                 {/* Quick Links */}
        //                 <div style={{ padding: '1.25rem', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
        //                     <h5 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#64748b', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        //                         Mô tả lớp học
        //                     </h5>
        //                     {classData.description && (
        //                         <div
        //                             style={{
        //                                 fontSize: '0.95rem',
        //                                 color: '#475569',
        //                                 lineHeight: 1.6,
        //                                 backgroundColor: '#f8fafc',
        //                                 borderRadius: '8px',
        //                                 padding: '0.75rem 1rem',
        //                                 marginTop: '0.25rem',
        //                                 maxHeight: '180px',
        //                                 overflowY: 'auto',
        //                                 whiteSpace: 'normal',
        //                             }}
        //                             dangerouslySetInnerHTML={{ __html: classData.description }}
        //                         />
        //                     )}
        //                 </div>
        //             </div>
        //         </div>
        //     </div>
        // );
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'stream':
                return renderStreamTab();
            case 'classwork':
                return <AssignmentTab classId={classData.id} />;
            case 'people':
                return <ClassPeopleTab classId={classData.id} />;
            default:
                return null;
        }
    };

    // Hiển thị loading, lỗi, hoặc nội dung
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
                    {/* {['stream', 'classwork', 'people'].map(tab => ( */}
                    {['stream', 'classwork', 'people'].map(tab => (
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
                            onClick={() => setActiveTab(tab)}
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