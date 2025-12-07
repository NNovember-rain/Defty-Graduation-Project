import React from 'react';
import {Users, ClipboardList, BarChart3, ChevronRight, HistoryIcon} from "lucide-react";
import { useNavigate } from "react-router-dom";

// Mock data cho thống kê lớp học UML/CNPM
const mockClassStats = {
    overview: {
        totalStudents: 45,
        totalAssignments: 12,
        pendingGrading: 23,
        averageScore: 7.8,
        onTimeRate: 82,
        activeStudents: 38
    },
    submissionStats: {
        onTime: 37,
        late: 8,
        notSubmitted: 3,
        resubmissions: 12
    },
    recentSubmissions: [
        { id: 1, student: 'Nguyễn Văn A', assignment: 'Use Case - Hệ thống quản lý thư viện', time: '10 phút trước', status: 'pending' },
        { id: 2, student: 'Trần Thị B', assignment: 'Class Diagram - Quản lý sinh viên', time: '25 phút trước', status: 'pending' },
        { id: 3, student: 'Lê Văn C', assignment: 'Sequence Diagram - Đặt hàng online', time: '1 giờ trước', status: 'graded', score: 8.5 },
        { id: 4, student: 'Phạm Thị D', assignment: 'Activity Diagram - Quy trình thanh toán', time: '2 giờ trước', status: 'graded', score: 7.0 },
        { id: 5, student: 'Hoàng Văn E', assignment: 'Use Case - Hệ thống đặt vé', time: '3 giờ trước', status: 'graded', score: 9.0 }
    ],
    weeklyActivity: [
        { week: 'T2', submissions: 8 },
        { week: 'T3', submissions: 12 },
        { week: 'T4', submissions: 15 },
        { week: 'T5', submissions: 10 },
        { week: 'T6', submissions: 18 },
        { week: 'T7', submissions: 5 },
        { week: 'CN', submissions: 2 }
    ],
    upcomingDeadlines: [
        {
            id: 1,
            title: 'Use Case Diagram - Hệ thống quản lý bán hàng',
            dueDate: '2024-12-05',
            dueTime: '23:59',
            submitted: 38,
            total: 45,
            ungraded: 15
        },
        {
            id: 2,
            title: 'Class Diagram - Hệ thống quản lý khách sạn',
            dueDate: '2024-12-08',
            dueTime: '18:00',
            submitted: 42,
            total: 45,
            ungraded: 8
        },
    ]
};


const TeacherStreamTab = ({ classData }) => {
    const navigate = useNavigate();

    const handleCreateAssignment = () => {
        const url = `/admin/content/assignments/create?classId=${classData}`;
        navigate(url);
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
    const StatCard = ({ icon, label, value }) => {
        return (
            <div className="flex flex-col items-center justify-center p-5 bg-white rounded-xl shadow-sm border hover:shadow-md transition">
                {/* Icon nhỏ lại cho cân */}
                <div className="mb-2 text-gray-700">
                    {React.cloneElement(icon, { className: "w-6 h-6" })}
                </div>

                {/* Số to hơn để thu hút */}
                <div className="text-2xl font-semibold">
                    {value}
                </div>

                {/* Label rõ ràng nhưng nhỏ hơn giá trị */}
                <div className="text-sm text-gray-500 mt-1">
                    {label}
                </div>
            </div>
        );
    };


    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.5rem' }}>
            {/* Main Content */}
            <div>
                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <StatCard
                        icon={<Users className="w-8 h-8 text-gray-700" />}
                        label="Học sinh"
                        value={45}
                    />

                    <StatCard
                        icon={<ClipboardList className="w-8 h-8 text-gray-700" />}
                        label="Bài tập"
                        value={12}
                    />

                    <StatCard
                        icon={<BarChart3 className="w-8 h-8 text-gray-700" />}
                        label="Điểm TB"
                        value="7.8/10"
                    />
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
                        {mockClassStats.upcomingDeadlines.map(assignment => {
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

                {/* Recent Submissions */}
                <div style={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '1.25rem'
                }}>

                    {/* Header: icon + title + xem thêm */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '1rem'
                    }}>

                        {/* Icon + Title */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <HistoryIcon style={{ width: 20, height: 20 }} />
                            <h3 style={{
                                fontSize: '1rem',
                                fontWeight: '600',
                                color: '#1e293b',
                                margin: 0
                            }}>
                                Bài nộp gần đây
                            </h3>
                        </div>

                        {/* Xem thêm */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            cursor: 'pointer',
                            color: '#3b82f6',
                            fontSize: '0.875rem',
                            fontWeight: '500'
                        }}>
                            <span>Xem thêm</span>
                            <ChevronRight style={{ width: 16, height: 16 }} />
                        </div>
                    </div>

                    {/* List items */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {mockClassStats.recentSubmissions.map(submission => (
                            <div key={submission.id} style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0.75rem',
                                backgroundColor: '#f8fafc',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0'
                            }}>

                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#1e293b', margin: 0 }}>
                                        {submission.student}
                                    </p>
                                    <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
                                        {submission.assignment}
                                    </p>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            {submission.time}
          </span>

                                    {/* Status / Score */}
                                    {submission.status === 'pending' ? (
                                        <span style={{
                                            padding: '0.25rem 0.75rem',
                                            backgroundColor: '#fef3c7',
                                            color: '#f59e0b',
                                            borderRadius: '6px',
                                            fontSize: '0.75rem',
                                            fontWeight: '600'
                                        }}>
              Chờ chấm
            </span>
                                    ) : (
                                        <span style={{
                                            padding: '0.25rem 0.75rem',
                                            backgroundColor: '#d1fae5',
                                            color: '#059669',
                                            borderRadius: '6px',
                                            fontSize: '0.75rem',
                                            fontWeight: '600'
                                        }}>
              {submission.score} điểm
            </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            {/* Sidebar - GIỮ NGUYÊN */}
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

// Utility Components
const StatCard = ({ icon, label, value, suffix = '', color = '#1e293b' }) => (
    <div style={{
        padding: '1rem',
        backgroundColor: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        textAlign: 'center'
    }}>
        <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{icon}</div>
        <p style={{ fontSize: '1.5rem', fontWeight: '700', color, margin: '0 0 0.25rem 0' }}>
            {value}{suffix}
        </p>
        <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>{label}</p>
    </div>
);

const MetricBox = ({ label, value, color }) => (
    <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '1.75rem', fontWeight: '700', color, margin: 0 }}>{value}</p>
        <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>{label}</p>
    </div>
);

export default TeacherStreamTab;