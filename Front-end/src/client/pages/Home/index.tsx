import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate hook
import {getClassesByStudentId} from "../../../shared/services/classManagementService.ts";
import {getUserById} from "../../../shared/services/userService.ts";

interface Class {
    classId: number;
    className: string;
    classCode: string;
    teacherName: string;
    newAssignments: number | null;
}

interface UserInfo {
    id: string;
    username: string;
    fullName: string;
    userCode: string;
    email: string;
}

interface ApiResponse<T> {
    code: number;
    message?: string;
    result: T;
}

interface ClassesResponse {
    content: Class[];
    totalElements: number;
}

const Home: React.FC = () => {
    const [classes, setClasses] = useState<Class[]>([]);
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Initialize navigate hook
    const navigate = useNavigate();

    // Get user ID from localStorage, context, or props - replace with your actual method
    const userId = "13"; // This should come from your auth context or storage

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch both APIs simultaneously using your existing API functions
                const [classesResult, userData] = await Promise.all([
                    getClassesByStudentId(Number(userId)),
                    getUserById(userId)
                ]);

                setClasses(classesResult.content);
                setUserInfo(userData);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [userId]);

    // Handle class card click
    const handleClassClick = (classId: number) => {
        navigate(`/class/${classId}`);
    };

    // Calculate stats from actual data
    const pendingAssignments = classes.reduce((total, cls) => total + (cls.newAssignments || 0), 0);
    const totalClasses = classes.length;

    const containerStyle: React.CSSProperties = {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)',
        color: 'white',
        padding: '2rem',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    };

    const welcomeSectionStyle: React.CSSProperties = {
        marginBottom: '2rem'
    };

    const welcomeMessageStyle: React.CSSProperties = {
        fontSize: '2rem',
        fontWeight: 'bold',
        marginBottom: '0.5rem',
        color: 'white'
    };

    const welcomeSubtitleStyle: React.CSSProperties = {
        color: '#ccc',
        fontSize: '1rem'
    };

    const quickStatsStyle: React.CSSProperties = {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
    };

    const statCardStyle: React.CSSProperties = {
        background: '#3a3a3a',
        padding: '1.5rem',
        borderRadius: '12px',
        transition: 'transform 0.3s',
        cursor: 'pointer'
    };

    const statCardAssignmentsStyle: React.CSSProperties = {
        ...statCardStyle,
        borderLeft: '4px solid #dc3545'
    };

    const statCardGradesStyle: React.CSSProperties = {
        ...statCardStyle,
        borderLeft: '4px solid #28a745'
    };

    const statCardDeadlinesStyle: React.CSSProperties = {
        ...statCardStyle,
        borderLeft: '4px solid #ffc107'
    };

    const statNumberStyle: React.CSSProperties = {
        fontSize: '2rem',
        fontWeight: 'bold',
        marginBottom: '0.5rem'
    };

    const statLabelStyle: React.CSSProperties = {
        color: '#ccc',
        fontSize: '0.9rem'
    };

    const sectionTitleStyle: React.CSSProperties = {
        fontSize: '1.5rem',
        marginBottom: '1.5rem',
        color: 'white',
        fontWeight: 'bold'
    };

    const classesGridStyle: React.CSSProperties = {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '1.5rem'
    };

    const classCardStyle: React.CSSProperties = {
        background: '#3a3a3a',
        borderRadius: '12px',
        padding: '1.5rem',
        transition: 'all 0.3s',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer'
    };

    const classCardTopBorderStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: 'linear-gradient(90deg, #007bff, #0056b3)'
    };

    const classHeaderStyle: React.CSSProperties = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '1rem'
    };

    const classInfoStyle: React.CSSProperties = {
        flex: 1
    };

    const classTitleStyle: React.CSSProperties = {
        color: 'white',
        fontSize: '1.2rem',
        fontWeight: 'bold',
        marginBottom: '0.5rem'
    };

    const teacherNameStyle: React.CSSProperties = {
        color: '#ccc',
        fontSize: '0.9rem'
    };

    const umlIconStyle: React.CSSProperties = {
        width: '40px',
        height: '40px',
        background: 'linear-gradient(45deg, #007bff, #0056b3)',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
    };

    const classFooterStyle: React.CSSProperties = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '1rem'
    };

    const subjectCodeStyle: React.CSSProperties = {
        background: 'rgba(0, 123, 255, 0.2)',
        color: '#007bff',
        padding: '0.3rem 0.8rem',
        borderRadius: '15px',
        fontSize: '0.8rem',
        fontWeight: '500'
    };

    const assignmentBadgeStyle: React.CSSProperties = {
        background: '#dc3545',
        color: 'white',
        padding: '0.3rem 0.8rem',
        borderRadius: '15px',
        fontSize: '0.8rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.3rem'
    };

    const dotStyle: React.CSSProperties = {
        width: '6px',
        height: '6px',
        background: 'white',
        borderRadius: '50%'
    };

    const loadingStyle: React.CSSProperties = {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '200px',
        fontSize: '1.2rem',
        color: '#ccc'
    };

    const errorStyle: React.CSSProperties = {
        background: '#dc3545',
        color: 'white',
        padding: '1rem',
        borderRadius: '8px',
        marginBottom: '2rem',
        textAlign: 'center'
    };

    const emptyStateStyle: React.CSSProperties = {
        textAlign: 'center',
        padding: '3rem',
        color: '#ccc'
    };

    const handleCardHover = (e: React.MouseEvent<HTMLDivElement>) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 123, 255, 0.3)';
    };

    const handleCardLeave = (e: React.MouseEvent<HTMLDivElement>) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = 'none';
    };

    const handleStatCardHover = (e: React.MouseEvent<HTMLDivElement>) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.3)';
    };

    const handleStatCardLeave = (e: React.MouseEvent<HTMLDivElement>) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = 'none';
    };

    const getSubjectIcon = (className: string) => {
        // Simple logic to choose icons based on class name
        if (className.toLowerCase().includes('java') || className.toLowerCase().includes('lập trình')) {
            return (
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            );
        } else if (className.toLowerCase().includes('database') || className.toLowerCase().includes('dữ liệu')) {
            return (
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z" />
                    <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z" />
                    <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z" />
                </svg>
            );
        } else {
            return (
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 000 2h4a1 1 0 100-2H3zm0 4a1 1 0 000 2h4a1 1 0 100-2H3zm0 4a1 1 0 100 2h4a1 1 0 100-2H3zm6 0a1 1 0 011-1h6a1 1 0 110 2h-6a1 1 0 01-1-1zM9 8a1 1 0 011-1h6a1 1 0 110 2h-6a1 1 0 01-1-1zM10 5a1 1 0 100 2h6a1 1 0 100-2h-6z" clipRule="evenodd" />
                </svg>
            );
        }
    };

    if (loading) {
        return (
            <div style={containerStyle}>
                <div style={loadingStyle}>
                    Đang tải dữ liệu...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={containerStyle}>
                <div style={errorStyle}>
                    Lỗi: {error}
                </div>
            </div>
        );
    }

    return (
        <div style={containerStyle}>
            {/* Welcome Section */}
            <div style={welcomeSectionStyle}>
                <h1 style={welcomeMessageStyle}>
                    Chào mừng, {userInfo?.fullName || 'Sinh viên'}
                </h1>
                {/*<p style={welcomeSubtitleStyle}>*/}
                {/*    Hôm nay là ngày tuyệt vời để học tập! ({userInfo?.userCode})*/}
                {/*</p>*/}
            </div>

            {/* Quick Stats */}
            <div style={quickStatsStyle}>
                <div
                    style={statCardAssignmentsStyle}
                    onMouseEnter={handleStatCardHover}
                    onMouseLeave={handleStatCardLeave}
                >
                    <div style={statNumberStyle}>{pendingAssignments}</div>
                    <div style={statLabelStyle}>Bài tập mới</div>
                </div>
                <div
                    style={statCardGradesStyle}
                    onMouseEnter={handleStatCardHover}
                    onMouseLeave={handleStatCardLeave}
                >
                    <div style={statNumberStyle}>{totalClasses}</div>
                    <div style={statLabelStyle}>Lớp đã đăng ký</div>
                </div>
                <div
                    style={statCardDeadlinesStyle}
                    onMouseEnter={handleStatCardHover}
                    onMouseLeave={handleStatCardLeave}
                >
                    <div style={statNumberStyle}>0</div>
                    <div style={statLabelStyle}>Deadline sắp tới</div>
                </div>
            </div>

            {/* Classes Section */}
            <div>
                <h2 style={sectionTitleStyle}>Lớp học của bạn</h2>
                {classes.length === 0 ? (
                    <div style={emptyStateStyle}>
                        <h3>Chưa có lớp học nào</h3>
                        <p>Bạn chưa đăng ký lớp học nào. Vui lòng liên hệ giáo vụ để đăng ký.</p>
                    </div>
                ) : (
                    <div style={classesGridStyle}>
                        {classes.map((classItem) => (
                            <div
                                key={classItem.classId}
                                style={classCardStyle}
                                onMouseEnter={handleCardHover}
                                onMouseLeave={handleCardLeave}
                                onClick={() => handleClassClick(classItem.classId)} // Add click handler
                            >
                                <div style={classCardTopBorderStyle}></div>
                                <div style={classHeaderStyle}>
                                    <div style={classInfoStyle}>
                                        <h3 style={classTitleStyle}>{classItem.className}</h3>
                                        <p style={teacherNameStyle}>{classItem.teacherName}</p>
                                    </div>
                                    <div style={umlIconStyle}>
                                        {getSubjectIcon(classItem.className)}
                                    </div>
                                </div>
                                <div style={classFooterStyle}>
                                    <span style={subjectCodeStyle}>{classItem.classCode}</span>
                                    {classItem.newAssignments && classItem.newAssignments > 0 && (
                                        <div style={assignmentBadgeStyle}>
                                            <div style={dotStyle}></div>
                                            <span>{classItem.newAssignments} bài tập mới</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Home;