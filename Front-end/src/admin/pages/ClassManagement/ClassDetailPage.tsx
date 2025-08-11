import ClassPeopleTab from './tab/ClassPeopleTab.tsx';
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Spinner } from 'react-bootstrap';
import { getClassById, IClass } from '../../../shared/services/classManagementService.ts';
import AssignmentTab from "./tab/Assignment/AssignmentTab.tsx";

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

// Các mock data và interface
interface IPost {
    id: number;
    author: string;
    type: 'announcement' | 'assignment';
    content: string;
    date: string;
}

const mockPosts: IPost[] = [
    { id: 1, author: 'Michael John', type: 'assignment', content: 'posted a new assignment: required assignment 1', date: '18 Jul' },
    { id: 2, author: 'B21DCCN233_Dương Văn Dư', type: 'announcement', content: 'chào các bạn nhé', date: '18 Jul' },
    { id: 3, author: 'Michael John', type: 'announcement', content: 'ai cho em đăng lên đây', date: '18 Jul' }
];

const ClassDetailPage: React.FC = () => {
    const { t } = useTranslation();
    const { id } = useParams<{ id: string }>();

    const [classData, setClassData] = useState<IClass | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<string>('stream');

    // Breadcrumb items
    const breadcrumbItems: BreadcrumbItem[] = [
        { label: t('classPage.breadcrumb.home'), path: '/' },
        { label: t('classPage.breadcrumb.adminDashboard'), path: '/admin' },
        { label: t('classPage.breadcrumb.classManagement'), path: '/admin/class/list' },
        { label: classData?.name || '', path: undefined }
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

    const renderContent = () => {
        switch (activeTab) {
            case 'stream':
                return (
                    <div style={{ display: 'flex', gap: '1.5rem' }}>
                        {/* Sidebar */}
                        <div style={{ width: '300px', flexShrink: 0 }}>
                            <div style={{ padding: '1rem', marginBottom: '1rem', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
                                <h5 style={{ margin: 0, fontSize: '1.25rem' }}>{t('classDetail.classCode')}</h5>
                                <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#0d6efd' }}>{classData?.classCode || 'drbaoiun'}</p>
                            </div>
                            <div style={{ padding: '1rem', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
                                <h5 style={{ margin: 0, fontSize: '1.25rem' }}>{t('classDetail.upcoming')}</h5>
                                <p>{t('classDetail.noUpcomingWork')}</p>
                            </div>
                        </div>

                        {/* Feed bài đăng */}
                        <div style={{ flexGrow: 1 }}>
                            <div style={{ padding: '1rem', marginBottom: '1rem', border: '1px solid #e0e0e0', borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#cccccc', marginRight: '1rem' }}></div>
                                <p style={{ margin: 0, color: '#6c757d' }}>{t('classDetail.announcePlaceholder')}</p>
                            </div>

                            {/* Danh sách các bài đăng */}
                            {mockPosts.map(post => (
                                <div key={post.id} style={{ padding: '1rem', marginBottom: '1rem', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#cccccc', marginRight: '1rem' }}></div>
                                        <div>
                                            <p style={{ margin: 0, fontWeight: 'bold' }}>{post.author}</p>
                                            <small style={{ color: '#6c757d' }}>{post.content}</small>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'classwork':
                return <AssignmentTab classId={classData.id} />;
            case 'people':
                return <ClassPeopleTab classId={classData.id} />;
            case 'marks':
                return <div style={{ padding: '1rem' }}>{t('classDetail.tabs.marksContent')}</div>;
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
        <div style={{ padding: '1rem' }}>
            {/* Thông tin lớp học chỉ hiển thị khi activeTab là 'stream' */}
            {activeTab === 'stream' && (
                <div style={{
                    padding: '1.5rem',
                    marginBottom: '1.5rem',
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px'
                }}>
                    <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', color: '#333' }}>{classData.name}</h2>
                    {classData.description && (
                        <p style={{ margin: 0, color: '#6c757d' }}>{classData.description}</p>
                    )}
                </div>
            )}

            {/* Thanh điều hướng ngang với breadcrumb */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #e0e0e0',
                marginBottom: '1.5rem'
            }}>
                {/* Navigation tabs */}
                <div style={{ display: 'flex' }}>
                    {['stream', 'classwork', 'people', 'marks'].map(tab => (
                        <button
                            key={tab}
                            style={{
                                padding: '0.75rem 1rem',
                                border: 'none',
                                backgroundColor: 'transparent',
                                cursor: 'pointer',
                                color: activeTab === tab ? '#0d6efd' : '#6c757d',
                                borderBottom: activeTab === tab ? '3px solid #0d6efd' : '3px solid transparent'
                            }}
                            onClick={() => setActiveTab(tab)}
                        >
                            {t(`classDetail.tabs.${tab}`)}
                        </button>
                    ))}
                </div>

                {/* Breadcrumb */}
                <Breadcrumb items={breadcrumbItems} />
            </div>

            {/* Nội dung chính dựa trên tab đã chọn */}
            {renderContent()}
        </div>
    );
};

export default ClassDetailPage;