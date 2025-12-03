import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Mail, Calendar, Award, TrendingUp, Clock, CheckCircle, XCircle, BookOpen } from 'lucide-react';

interface StudentDetailViewProps {
    studentId: string;
    classId: number;
    onBack: () => void;
}

// Mock data cho chi tiết học viên
const mockStudentDetail = {
    studentInfo: {
        studentId: '1',
        fullName: 'Nguyễn Văn A',
        email: 'nguyenvana@email.com',
        username: 'nguyenvana',
        userCode: 'SV001',
        dob: '2002-05-15',
        avatarUrl: null,
        enrolledAt: '2024-09-01',
        enrollmentStatus: 1
    },
    statistics: {
        totalAssignments: 12,
        completedAssignments: 10,
        pendingAssignments: 2,
        averageScore: 8.3,
        onTimeSubmissions: 9,
        lateSubmissions: 1,
        totalScore: 83,
        highestScore: 9.5,
        lowestScore: 7.5
    },
    assignmentHistory: [
        {
            id: 1,
            title: 'Use Case Diagram - Hệ thống quản lý thư viện',
            dueDate: '2024-11-15',
            submittedAt: '2024-11-14 20:30',
            score: 9.0,
            status: 'graded',
            isLate: false,
            feedback: 'Bài làm tốt, sơ đồ rõ ràng và đầy đủ'
        },
        {
            id: 2,
            title: 'Class Diagram - Quản lý sinh viên',
            dueDate: '2024-11-20',
            submittedAt: '2024-11-20 23:45',
            score: 7.5,
            status: 'graded',
            isLate: true,
            feedback: 'Thiếu một số thuộc tính quan trọng'
        },
        {
            id: 3,
            title: 'Sequence Diagram - Đặt hàng online',
            dueDate: '2024-11-25',
            submittedAt: '2024-11-24 18:00',
            score: 8.5,
            status: 'graded',
            isLate: false,
            feedback: 'Tốt, cần chú ý thêm về return message'
        },
        {
            id: 4,
            title: 'Activity Diagram - Quy trình thanh toán',
            dueDate: '2024-11-28',
            submittedAt: '2024-11-27 15:20',
            score: 9.5,
            status: 'graded',
            isLate: false,
            feedback: 'Xuất sắc! Logic flow rất rõ ràng'
        },
        {
            id: 5,
            title: 'State Diagram - Quản lý đơn hàng',
            dueDate: '2024-12-01',
            submittedAt: '2024-11-30 22:10',
            score: 8.0,
            status: 'graded',
            isLate: false,
            feedback: 'Bài làm tốt, cần bổ sung thêm một số trạng thái'
        },
        {
            id: 6,
            title: 'Use Case Diagram - Hệ thống đặt vé',
            dueDate: '2024-12-05',
            submittedAt: null,
            score: null,
            status: 'pending',
            isLate: false,
            feedback: null
        },
        {
            id: 7,
            title: 'Class Diagram - Hệ thống quản lý khách sạn',
            dueDate: '2024-12-08',
            submittedAt: null,
            score: null,
            status: 'not_submitted',
            isLate: false,
            feedback: null
        }
    ],
    performanceByType: [
        { type: 'Use Case Diagram', count: 3, avgScore: 8.7, bestScore: 9.5 },
        { type: 'Class Diagram', count: 3, avgScore: 7.8, bestScore: 8.5 },
        { type: 'Sequence Diagram', count: 2, avgScore: 8.5, bestScore: 9.0 },
        { type: 'Activity Diagram', count: 2, avgScore: 8.8, bestScore: 9.5 },
        { type: 'State Diagram', count: 2, avgScore: 8.0, bestScore: 8.5 }
    ],
    recentActivity: [
        { date: '2024-11-30', action: 'Nộp bài State Diagram - Quản lý đơn hàng', type: 'submission' },
        { date: '2024-11-27', action: 'Nộp bài Activity Diagram - Quy trình thanh toán', type: 'submission' },
        { date: '2024-11-24', action: 'Nộp bài Sequence Diagram - Đặt hàng online', type: 'submission' },
        { date: '2024-11-20', action: 'Nộp bài Class Diagram - Quản lý sinh viên (Trễ)', type: 'late_submission' }
    ]
};

const StudentDetailView: React.FC<StudentDetailViewProps> = ({ studentId, classId, onBack }) => {
    const [selectedTab, setSelectedTab] = useState<'overview' | 'assignments'>('overview');
    const [studentData, setStudentData] = useState(mockStudentDetail);

    useEffect(() => {
        // TODO: Fetch student detail from API
        // fetchStudentDetail(studentId, classId);
    }, [studentId, classId]);

    const calculateAge = (dob: string) => {
        const today = new Date();
        const birthDate = new Date(dob);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const getStatusBadge = (status: string, isLate: boolean) => {
        if (status === 'graded') {
            return {
                text: isLate ? 'Đã chấm (Trễ)' : 'Đã chấm',
                bgColor: isLate ? '#fef3c7' : '#d1fae5',
                textColor: isLate ? '#f59e0b' : '#059669'
            };
        } else if (status === 'pending') {
            return {
                text: 'Chờ chấm',
                bgColor: '#dbeafe',
                textColor: '#2563eb'
            };
        } else {
            return {
                text: 'Chưa nộp',
                bgColor: '#fee2e2',
                textColor: '#dc2626'
            };
        }
    };

    const OverviewTab = () => (
        <div>
            {/* Statistics Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', textAlign: 'center' }}>
                    <div style={{ color: '#64748b', marginBottom: '0.5rem' }}>
                        <BookOpen style={{ width: '24px', height: '24px', margin: '0 auto' }} />
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.25rem' }}>
                        {studentData.statistics.completedAssignments}/{studentData.statistics.totalAssignments}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Bài hoàn thành</div>
                </div>

                <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', textAlign: 'center' }}>
                    <div style={{ color: '#64748b', marginBottom: '0.5rem' }}>
                        <Award style={{ width: '24px', height: '24px', margin: '0 auto' }} />
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.25rem' }}>
                        {studentData.statistics.averageScore}/10
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Điểm trung bình</div>
                </div>

                <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', textAlign: 'center' }}>
                    <div style={{ color: '#059669', marginBottom: '0.5rem' }}>
                        <TrendingUp style={{ width: '24px', height: '24px', margin: '0 auto' }} />
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#059669', marginBottom: '0.25rem' }}>
                        {studentData.statistics.highestScore}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Điểm cao nhất</div>
                </div>

                <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', textAlign: 'center' }}>
                    <div style={{ color: '#f59e0b', marginBottom: '0.5rem' }}>
                        <svg style={{ width: '24px', height: '24px', margin: '0 auto' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                        </svg>
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#f59e0b', marginBottom: '0.25rem' }}>
                        {studentData.statistics.lowestScore}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Điểm thấp nhất</div>
                </div>
            </div>

            {/* Recent Activity */}
            <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <Clock style={{ width: '18px', height: '18px', color: '#64748b' }} />
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1e293b', margin: 0 }}>
                        Hoạt động gần đây
                    </h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {studentData.recentActivity.map((activity, idx) => (
                        <div key={idx} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            padding: '0.75rem',
                            backgroundColor: '#f8fafc',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0'
                        }}>
                            <div style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: activity.type === 'late_submission' ? '#f59e0b' : '#3b82f6',
                                flexShrink: 0
                            }}></div>
                            <div style={{ flex: 1 }}>
                                <p style={{ fontSize: '0.875rem', color: '#1e293b', margin: 0 }}>{activity.action}</p>
                            </div>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{formatDate(activity.date)}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Performance by Assignment Type */}
            <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <svg style={{ width: '18px', height: '18px', color: '#64748b' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1e293b', margin: 0 }}>
                        Thành tích theo loại bài tập
                    </h3>
                </div>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {studentData.performanceByType.map((item, idx) => (
                        <div key={idx} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '1rem',
                            backgroundColor: '#f8fafc',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0'
                        }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.25rem' }}>
                                    {item.type}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                    {item.count} bài tập
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Điểm TB</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e293b' }}>{item.avgScore}</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Cao nhất</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#059669' }}>{item.bestScore}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const AssignmentsTab = () => (
        <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {studentData.assignmentHistory.map((assignment) => {
                    const statusBadge = getStatusBadge(assignment.status, assignment.isLate);

                    return (
                        <div key={assignment.id} style={{
                            padding: '1.25rem',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            backgroundColor: '#f8fafc'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ fontSize: '0.95rem', fontWeight: '600', color: '#1e293b', margin: '0 0 0.5rem 0' }}>
                                        {assignment.title}
                                    </h4>
                                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#64748b' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <Calendar style={{ width: '14px', height: '14px' }} />
                                            <span>Hạn nộp: {formatDate(assignment.dueDate)}</span>
                                        </div>
                                        {assignment.submittedAt && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <CheckCircle style={{ width: '14px', height: '14px' }} />
                                                <span>Đã nộp: {formatDate(assignment.submittedAt.split(' ')[0])} {assignment.submittedAt.split(' ')[1]}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                    {assignment.score !== null && (
                                        <div style={{
                                            padding: '0.5rem 1rem',
                                            backgroundColor: '#dbeafe',
                                            color: '#2563eb',
                                            borderRadius: '6px',
                                            fontSize: '0.875rem',
                                            fontWeight: '700'
                                        }}>
                                            {assignment.score} điểm
                                        </div>
                                    )}
                                    <span style={{
                                        padding: '0.375rem 0.75rem',
                                        backgroundColor: statusBadge.bgColor,
                                        color: statusBadge.textColor,
                                        borderRadius: '6px',
                                        fontSize: '0.75rem',
                                        fontWeight: '600'
                                    }}>
                                        {statusBadge.text}
                                    </span>
                                </div>
                            </div>
                            {assignment.feedback && (
                                <div style={{
                                    padding: '0.75rem',
                                    backgroundColor: '#fff',
                                    borderRadius: '6px',
                                    fontSize: '0.875rem',
                                    color: '#475569',
                                    borderLeft: '3px solid #3b82f6',
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '0.5rem'
                                }}>
                                    <svg style={{ width: '16px', height: '16px', marginTop: '0.125rem', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                    </svg>
                                    <div>
                                        <strong>Nhận xét:</strong> {assignment.feedback}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );

    return (
        <div style={{ backgroundColor: '#f9fafb', minHeight: '100vh'}}>
            <div style={{margin: '0 auto' }}>
                {/* Header */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <button
                        onClick={onBack}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 1rem',
                            backgroundColor: '#fff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            color: '#1e293b',
                            marginBottom: '1rem'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
                    >
                        <ArrowLeft style={{ width: '16px', height: '16px' }} />
                        Quay lại danh sách
                    </button>

                    {/* Student Info Card */}
                    <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                backgroundColor: '#3b82f6',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '2rem',
                                fontWeight: 'bold',
                                color: 'white'
                            }}>
                                {studentData.studentInfo.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ flex: 1 }}>
                                <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b', margin: '0 0 0.5rem 0' }}>
                                    {studentData.studentInfo.fullName}
                                </h1>
                                <div style={{ display: 'flex', gap: '2rem', fontSize: '0.875rem', color: '#64748b' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Mail style={{ width: '16px', height: '16px' }} />
                                        {studentData.studentInfo.email}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <User style={{ width: '16px', height: '16px' }} />
                                        MSSV: {studentData.studentInfo.userCode}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Calendar style={{ width: '16px', height: '16px' }} />
                                        {calculateAge(studentData.studentInfo.dob)} tuổi
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>
                    <button
                        onClick={() => setSelectedTab('overview')}
                        style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: 'transparent',
                            color: selectedTab === 'overview' ? '#2563eb' : '#64748b',
                            border: 'none',
                            borderBottom: selectedTab === 'overview' ? '2px solid #2563eb' : '2px solid transparent',
                            fontSize: '0.875rem',
                            fontWeight: selectedTab === 'overview' ? '600' : '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Tổng quan
                    </button>
                    <button
                        onClick={() => setSelectedTab('assignments')}
                        style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: 'transparent',
                            color: selectedTab === 'assignments' ? '#2563eb' : '#64748b',
                            border: 'none',
                            borderBottom: selectedTab === 'assignments' ? '2px solid #2563eb' : '2px solid transparent',
                            fontSize: '0.875rem',
                            fontWeight: selectedTab === 'assignments' ? '600' : '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <BookOpen style={{ width: '16px', height: '16px' }} />
                        Lịch sử bài tập
                    </button>
                </div>

                {/* Tab Content */}
                {selectedTab === 'overview' && <OverviewTab />}
                {selectedTab === 'assignments' && <AssignmentsTab />}
            </div>
        </div>
    );
};

export default StudentDetailView;