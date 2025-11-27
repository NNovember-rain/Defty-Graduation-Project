import React from 'react';
import {useNavigate} from "react-router-dom";

// Mock data cho giáo viên
const mockTeacherData = {
    stats: {
        totalStudents: 45,
        totalAssignments: 12,
        pendingGrading: 23,
        averageSubmissionRate: 87
    },
    upcomingDeadlines: [
        {
            id: 1,
            title: 'Assignment 1: Introduction to React',
            dueDate: '2025-11-20',
            dueTime: '23:59',
            submitted: 38,
            total: 45,
            ungraded: 15
        },
        {
            id: 2,
            title: 'Lab 2: State Management',
            dueDate: '2025-11-18',
            dueTime: '18:00',
            submitted: 42,
            total: 45,
            ungraded: 8
        },
    ],
    recentActivities: [
        { id: 1, type: 'submission', studentName: 'Nguyễn Văn A', action: 'đã nộp bài', item: 'Assignment 1', time: '2 giờ trước' },
        { id: 2, type: 'join', studentName: 'Trần Thị B', action: 'đã tham gia lớp', item: '', time: '5 giờ trước' },
        { id: 3, type: 'comment', studentName: 'Lê Văn C', action: 'đã comment', item: 'Lab 2', time: '1 ngày trước' },
        { id: 4, type: 'submission', studentName: 'Phạm Thị D', action: 'đã nộp bài', item: 'Project Proposal', time: '1 ngày trước' },
    ]
};

const TeacherStreamTab = ({ classData }) => {
    const { stats, upcomingDeadlines, recentActivities } = mockTeacherData;

    const getActivityIcon = (type) => {
        const iconStyle = { width: '18px', height: '18px' };
        switch (type) {
            case 'submission':
                return (
                    <svg style={iconStyle} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                );
            case 'join':
                return (
                    <svg style={iconStyle} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                );
            case 'comment':
                return (
                    <svg style={iconStyle} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                );
            default:
                return null;
        }
    };

    const getActivityColor = (type) => {
        switch (type) {
            case 'submission': return '#3b82f6';
            case 'join': return '#10b981';
            case 'comment': return '#f59e0b';
            default: return '#64748b';
        }
    };

    const formatDate = (dateString, timeString) => {
        const date = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);

        const diffTime = date.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return `Đã quá hạn ${Math.abs(diffDays)} ngày`;
        if (diffDays === 0) return `Hôm nay lúc ${timeString}`;
        if (diffDays === 1) return `Ngày mai lúc ${timeString}`;
        return `Còn ${diffDays} ngày - ${timeString}`;
    };

    const navigate = useNavigate();

    // 💡 Hàm xử lý click
    const handleCreateAssignment = () => {
        const url = `/admin/content/assignments/create?classId=${classData}`;
        navigate(url);
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.5rem' }}>
            {/* Main Content */}
            <div>
                {/* Stats Overview */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                    {/** Card Học sinh */}
                    <div style={{ padding: '1rem', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ padding: '0.5rem', backgroundColor: '#dbeafe', borderRadius: '8px', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                        <div style={{ marginLeft: '0.75rem', textAlign: 'right' }}>
                            <span style={{ fontSize: '1rem', color: '#64748b' }}>Học sinh</span>
                            <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b', margin: 0 }}>{stats.totalStudents}</p>
                        </div>
                    </div>

                    {/** Card Bài tập */}
                    <div style={{ padding: '1rem', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ padding: '0.5rem', backgroundColor: '#f0fdf4', borderRadius: '8px', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div style={{ marginLeft: '0.75rem', textAlign: 'right' }}>
                            <span style={{ fontSize: '1rem', color: '#64748b' }}>Bài tập</span>
                            <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b', margin: 0 }}>{stats.totalAssignments}</p>
                        </div>
                    </div>

                    {/** Card Chờ chấm */}
                    <div style={{ padding: '1rem', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ padding: '0.5rem', backgroundColor: '#fef3c7', borderRadius: '8px', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div style={{ marginLeft: '0.75rem', textAlign: 'right' }}>
                            <span style={{ fontSize: '1rem', color: '#64748b' }}>Chờ chấm</span>
                            <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b', margin: 0 }}>{stats.pendingGrading}</p>
                        </div>
                    </div>

                    {/** Card Tỷ lệ nộp */}
                    <div style={{ padding: '1rem', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ padding: '0.5rem', backgroundColor: '#ede9fe', borderRadius: '8px', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <div style={{ marginLeft: '0.75rem', textAlign: 'right' }}>
                            <span style={{ fontSize: '1rem', color: '#64748b' }}>Tỷ lệ nộp</span>
                            <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b', margin: 0 }}>{stats.averageSubmissionRate}%</p>
                        </div>
                    </div>
                </div>


                {/* Upcoming Deadlines */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e293b', margin: 0 }}>
                            Bài tập sắp đến hạn
                        </h3>
                        <button style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#3b82f6',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
                                onClick={handleCreateAssignment}
                        >
                            + Tạo bài tập mới
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {upcomingDeadlines.map(assignment => {
                            const submissionRate = Math.round((assignment.submitted / assignment.total) * 100);
                            return (
                                <div
                                    key={assignment.id}
                                    style={{
                                        padding: '1.25rem',
                                        backgroundColor: '#fff',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '12px',
                                        transition: 'all 0.2s',
                                        cursor: 'pointer'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.boxShadow = 'none';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                        <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#1e293b', margin: 0, flex: 1 }}>
                                            {assignment.title}
                                        </h4>
                                        {assignment.ungraded > 0 && (
                                            <div style={{
                                                padding: '0.375rem 0.75rem',
                                                backgroundColor: '#fef3c7',
                                                color: '#f59e0b',
                                                borderRadius: '6px',
                                                fontSize: '0.75rem',
                                                fontWeight: '600'
                                            }}>
                                                {assignment.ungraded} bài chưa chấm
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.875rem', color: '#64748b', marginBottom: '0.75rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2"/>
                                                <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2"/>
                                                <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2"/>
                                                <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2"/>
                                            </svg>
                                            <span>{formatDate(assignment.dueDate, assignment.dueTime)}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                            </svg>
                                            <span>{assignment.submitted}/{assignment.total} đã nộp</span>
                                        </div>
                                    </div>

                                    {/* Progress bar */}
                                    <div style={{ width: '100%', backgroundColor: '#f1f5f9', borderRadius: '999px', height: '8px', overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${submissionRate}%`,
                                            backgroundColor: submissionRate >= 80 ? '#10b981' : submissionRate >= 50 ? '#f59e0b' : '#ef4444',
                                            height: '100%',
                                            transition: 'width 0.3s'
                                        }}></div>
                                    </div>
                                    <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem', marginBottom: 0 }}>
                                        {submissionRate}% học sinh đã nộp bài
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Recent Activities */}
                <div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e293b', marginBottom: '1rem' }}>
                        Hoạt động gần đây
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {recentActivities.map(activity => (
                            <div
                                key={activity.id}
                                style={{
                                    padding: '1rem',
                                    backgroundColor: '#fff',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    transition: 'all 0.2s',
                                    cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
                            >
                                <div style={{
                                    padding: '0.5rem',
                                    backgroundColor: `${getActivityColor(activity.type)}15`,
                                    color: getActivityColor(activity.type),
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {getActivityIcon(activity.type)}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: '0.875rem', color: '#1e293b', margin: 0 }}>
                                        <strong>{activity.studentName}</strong> {activity.action}
                                        {activity.item && <span style={{ color: '#3b82f6' }}> {activity.item}</span>}
                                    </p>
                                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>{activity.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Sidebar - Quick Actions */}
            <div>
                <div style={{ position: 'sticky', top: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Class Code */}
                    <div style={{ padding: '1.25rem', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                        <h5 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#64748b', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Mã lớp học
                        </h5>
                        <div style={{
                            padding: '0.75rem',
                            backgroundColor: '#f1f5f9',
                            borderRadius: '8px',
                            border: '2px dashed #cbd5e1',
                            textAlign: 'center'
                        }}>
                            <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2563eb', margin: 0, letterSpacing: '0.1em' }}>
                                {classData?.inviteCode || 'N/A'}
                            </p>
                        </div>
                    </div>

                    {/* Class Info */}
                    <div style={{ padding: '1.25rem', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                        <h5 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#64748b', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Thông tin lớp
                        </h5>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {classData?.className && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <svg style={{ width: '18px', height: '18px', color: '#64748b' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                    <span style={{ fontSize: '0.875rem', color: '#475569' }}>Môn: {classData.className}</span>
                                </div>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <svg style={{ width: '18px', height: '18px', color: '#64748b' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span style={{ fontSize: '0.875rem', color: '#475569' }}>
                                    Tạo: {new Date(classData?.createdDate || '').toLocaleDateString('vi-VN')}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Class Description */}
                    <div style={{ padding: '1.25rem', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                        <h5 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#64748b', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Mô tả lớp học
                        </h5>
                        {classData?.description ? (
                            <div
                                style={{
                                    fontSize: '0.95rem',
                                    color: '#475569',
                                    lineHeight: 1.6,
                                    backgroundColor: '#f8fafc',
                                    borderRadius: '8px',
                                    padding: '0.75rem 1rem',
                                    maxHeight: '180px',
                                    overflowY: 'auto',
                                    whiteSpace: 'normal',
                                }}
                                dangerouslySetInnerHTML={{ __html: classData.description }}
                            />
                        ) : (
                            <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                                Chưa có mô tả cho lớp học này.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeacherStreamTab;