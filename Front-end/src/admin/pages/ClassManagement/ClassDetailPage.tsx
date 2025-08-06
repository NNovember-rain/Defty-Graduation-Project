import ClassPeopleTab from './tab/ClassPeopleTab.tsx';
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Spinner } from 'react-bootstrap';
import { getClassById, IClass } from '../../../shared/services/classManagementService.ts';

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
                return <div style={{ padding: '1rem' }}>{t('classDetail.tabs.classworkContent')}</div>;
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
        return <div style={{ padding: '1rem', display: 'flex', justifyContent: 'center' }}><Spinner animation="border" /></div>;
    }
    if (error) {
        return <div style={{ padding: '1rem', color: '#dc3545', backgroundColor: '#f8d7da', border: '1px solid #f5c6cb' }}>{error}</div>;
    }
    if (!classData) {
        return <div style={{ padding: '1rem', color: '#856404', backgroundColor: '#fff3cd', border: '1px solid #ffeeba' }}>{t('classDetail.error.classNotFound')}</div>;
    }

    return (
        <div style={{ padding: '1rem' }}>
            {/* Breadcrumb */}
            <div style={{ margin: '0 0 1rem', fontSize: '0.875rem' }}>
                <Link to="/" style={{ textDecoration: 'none', color: '#0d6efd' }}>{t('classPage.breadcrumb.home')}</Link>
                {' / '}
                <Link to="/admin" style={{ textDecoration: 'none', color: '#0d6efd' }}>{t('classPage.breadcrumb.adminDashboard')}</Link>
                {' / '}
                <Link to="/admin/class/list" style={{ textDecoration: 'none', color: '#0d6efd' }}>{t('classPage.breadcrumb.classManagement')}</Link>
                {' / '}
                <span style={{ color: '#6c757d' }}>{classData.name}</span>
            </div>

            {/* Banner chỉ hiển thị khi activeTab là 'stream' */}
            {activeTab === 'stream' && (
                <div
                    style={{
                        padding: '1.5rem',
                        marginBottom: '1.5rem',
                        color: '#fff',
                        backgroundColor: '#0d6efd',
                        height: '240px',
                        backgroundImage: 'url(https://gstatic.com/classroom/themes/Physics.jpg)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        borderRadius: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                        position: 'relative'
                    }}
                >
                    <h1 style={{ margin: 0, fontSize: '2rem' }}>{classData.name}</h1>
                    <p style={{ margin: '0.5rem 0 0' }}>{classData.description}</p>
                    <button style={{ position: 'absolute', top: '1rem', right: '1rem', padding: '0.5rem 1rem', backgroundColor: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        {t('classDetail.customise')}
                    </button>
                </div>
            )}

            {/* Thanh điều hướng ngang */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e0e0e0', marginBottom: '1.5rem' }}>
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

            {/* Nội dung chính dựa trên tab đã chọn */}
            {renderContent()}
        </div>
    );
};

export default ClassDetailPage;