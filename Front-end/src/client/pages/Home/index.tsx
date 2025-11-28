import React, { useState, useEffect, useMemo } from 'react';
import { FaSearch, FaUsers, FaCalendar, FaBookOpen, FaPlus, FaTimes, FaSpinner, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { getClasses, type IClass, joinClassByInvite } from '../../../shared/services/classManagementService.ts';
import { getActiveCourses, type ICourse } from '../../../shared/services/courseService.ts';
import { useNavigate, useSearchParams } from "react-router-dom";
import { useUserStore } from '../../../shared/authentication/useUserStore.ts';
// import Pagination from '../../../shared/components/Pagination';

// Import SCSS styles
import './style.scss';
import AppSpinner from "../../common/appSpiner.tsx";
const ClassCardSkeleton = () => (
    <div className="my-classes__card-skeleton">
        <div className="skeleton-header"></div>
        <div className="skeleton-content">
            <div className="skeleton-title"></div>
            <div className="skeleton-stats"></div>
            <div className="skeleton-dates"></div>
            <div className="skeleton-button"></div>
        </div>
    </div>
);

const MyClasses = () => {
    const {hasRole} = useUserStore();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCourseId, setSelectedCourseId] = useState<string>('');
    const [classes, setClasses] = useState<IClass[]>([]);
    const [courses, setCourses] = useState<ICourse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [totalClasses, setTotalClasses] = useState(0);

    const [isJoinPopupOpen, setIsJoinPopupOpen] = useState(false);
    const [classCode, setClassCode] = useState('');
    const [joinError, setJoinError] = useState('');
    const [isJoining, setIsJoining] = useState(false);
    const [joinSuccess, setJoinSuccess] = useState<{show: boolean; message: string}>({ show: false, message: '' });

    const pageSize = 8;

    // Sync currentPage with URL
    const currentPage = parseInt(searchParams.get('page') || '1', 10);

    // Load courses khi component mount
    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const coursesData = await getActiveCourses();
                setCourses(coursesData);
            } catch (err) {
                console.error('Error loading courses:', err);
            }
        };
        fetchCourses();
    }, []);

    useEffect(() => {
        loadClasses(currentPage);
    }, [selectedCourseId, currentPage]);

    const loadClasses = async (page: number) => {
        try {
            setLoading(true);
            setError('');

            // Scroll to top when page changes
            window.scrollTo({ top: 0, behavior: 'smooth' });

            const result = await getClasses({
                page: page,
                limit: pageSize,
                sortBy: 'className',
                sortOrder: 'asc',
                courseId: selectedCourseId ? parseInt(selectedCourseId, 10) : undefined
            });

            setClasses(result.content);
            setTotalClasses(result.totalElements);
        } catch (err: any) {
            console.error('Error loading classes:', err);
            setError(err.message || 'Không thể tải danh sách lớp học');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        // Reset về trang 1 khi search
        setSearchParams({ page: '1' });

        if (!searchTerm.trim() && !selectedCourseId) {
            loadClasses(1);
            return;
        }

        try {
            setLoading(true);
            setError('');

            const result = await getClasses({
                page: 1,
                limit: pageSize,
                sortBy: 'className',
                sortOrder: 'asc',
                courseId: selectedCourseId ? parseInt(selectedCourseId, 10) : undefined
            });

            const filteredClasses = result.content.filter(classItem =>
                classItem.className.toLowerCase().includes(searchTerm.toLowerCase())
            );

            setClasses(filteredClasses);
            setTotalClasses(filteredClasses.length);
        } catch (err: any) {
            console.error('Error searching classes:', err);
            setError(err.message || 'Không thể tìm kiếm lớp học');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    // Helper function để tính màu chữ dựa trên độ sáng của background
    const getTextColor = (bgColor: string): string => {
        const hex = bgColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness > 128 ? '#1a1a1a' : '#ffffff';
    };

    // Helper function để tạo màu đậm hơn cho gradient
    const darkenColor = (color: string, percent: number): string => {
        const hex = color.replace('#', '');
        const r = Math.max(0, parseInt(hex.substr(0, 2), 16) * (1 - percent / 100));
        const g = Math.max(0, parseInt(hex.substr(2, 2), 16) * (1 - percent / 100));
        const b = Math.max(0, parseInt(hex.substr(4, 2), 16) * (1 - percent / 100));
        return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
    };

    const transformClassData = (apiClass: IClass) => {
        const getStatusInfo = (status: number) => {
            const now = new Date();
            const startDate = apiClass.startDate ? new Date(apiClass.startDate) : null;
            const endDate = apiClass.endDate ? new Date(apiClass.endDate) : null;

            if (status === 0) {
                return {
                    status: 'inactive',
                    statusLabel: 'Inactive',
                    statusClass: 'my-classes__card-status-badge--inactive'
                };
            }

            if (!startDate || !endDate) {
                return {
                    status: 'unscheduled',
                    statusLabel: 'Chưa xác định',
                    statusClass: 'my-classes__card-status-badge--upcoming'
                };
            }

            if (now < startDate) {
                return {
                    status: 'upcoming',
                    statusLabel: 'Sắp bắt đầu',
                    statusClass: 'my-classes__card-status-badge--upcoming'
                };
            } else if (now > endDate) {
                return {
                    status: 'completed',
                    statusLabel: 'Đã kết thúc',
                    statusClass: 'my-classes__card-status-badge--completed'
                };
            } else {
                return {
                    status: 'active',
                    statusLabel: 'Đang diễn ra',
                    statusClass: 'my-classes__card-status-badge--active'
                };
            }
        };

        const statusInfo = getStatusInfo(apiClass.status);

        const getInitials = (name: string) => {
            return name.split(' ')
                .map(word => word[0])
                .slice(0, 2)
                .join('')
                .toUpperCase();
        };

        // Lấy màu từ courseColor, nếu không có thì dùng màu mặc định
        const courseColor = apiClass.courseColor || '#f97316';

        return {
            id: apiClass.id,
            title: apiClass.className,
            level: apiClass.classType || 'general',
            levelLabel: apiClass.classType || 'General',
            ...statusInfo,
            courseColor: courseColor,
            teacher: {
                name: "Giảng viên",
                initials: getInitials(apiClass.className)
            },
            startDate: apiClass.startDate
                ? new Date(apiClass.startDate).toLocaleDateString('vi-VN')
                : "Chưa xác định",
            endDate: apiClass.endDate
                ? new Date(apiClass.endDate).toLocaleDateString('vi-VN')
                : "Chưa xác định",
            students: apiClass.currentStudents || 0,
            inviteCode: apiClass.inviteCode
        };
    };

    const transformedClasses = useMemo(() => {
        return classes.map(transformClassData);
    }, [classes]);

    const handleButtonClick = (classId?: number) => {
        if (classId) {
            navigate(`/class/${classId}`);
        } else {
            alert('Class ID not found');
        }
    };

    const handleJoinClass = async () => {
        setJoinError('');
        setJoinSuccess({ show: false, message: '' });

        if (!classCode.trim()) {
            setJoinError('Vui lòng nhập mã lớp học');
            return;
        }

        if (classCode.trim().length < 5) {
            setJoinError('Mã lớp học phải có ít nhất 5 ký tự');
            return;
        }

        setIsJoining(true);

        try {
            const response = await joinClassByInvite(classCode.trim());

            if (response.code === 200) {
                if (response.message.includes("already active")) {
                    setJoinSuccess({
                        show: true,
                        message: 'Bạn đã là thành viên của lớp học này rồi.'
                    });
                } else if (response.message.includes("pending approval")) {
                    setJoinSuccess({
                        show: true,
                        message: 'Bạn đã gửi yêu cầu tham gia rồi, vui lòng chờ giảng viên phê duyệt.'
                    });
                } else if (response.message.includes("rejected")) {
                    setJoinError('Yêu cầu tham gia trước đó đã bị từ chối. Vui lòng liên hệ giảng viên.');
                }
            } else if (response.code === 201) {
                setJoinSuccess({
                    show: true,
                    message: response.message.includes("re-sent")
                        ? "Bạn đã gửi lại yêu cầu tham gia, vui lòng chờ giảng viên phê duyệt."
                        : "Yêu cầu tham gia đã được gửi, vui lòng chờ giảng viên phê duyệt."
                });
            }
        } catch (error: any) {
            console.error('Error joining class:', error);
            setJoinError(error.message || 'Có lỗi xảy ra khi tham gia lớp học');
        } finally {
            setIsJoining(false);
        }
    };

    const handleJoinOrClose = async () => {
        if (joinSuccess.show) {
            // Nếu đã join thành công, reload và đóng popup
            await loadClasses(currentPage);
            handleCancelJoin();
        } else {
            // Nếu chưa join, thực hiện join
            await handleJoinClass();
        }
    };

    const handleCancelJoin = () => {
        setIsJoinPopupOpen(false);
        setClassCode('');
        setJoinError('');
        setJoinSuccess({ show: false, message: '' });
        setIsJoining(false);
    };

    const handleClassCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setClassCode(e.target.value);
        if (joinError) {
            setJoinError('');
        }
        if (joinSuccess.show) {
            setJoinSuccess({ show: false, message: '' });
        }
    };

    return (
        <div className="my-classes">
            {/* Header with Search */}
            <div className="my-classes__header">
                <div className="my-classes__header-content">
                    <div className="my-classes__header-flex">
                        {/* Left side - Search Row */}
                        <div className="flex-center my-classes__search-row">
                            <div className="my-classes__search-container">
                                <div className="my-classes__search-icon">
                                    <FaSearch className="icon"/>
                                </div>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    className="my-classes__search-input"
                                    placeholder="Tìm kiếm lớp học..."
                                />
                            </div>

                            {/* Course Filter - Only visible on desktop */}
                            <select
                                value={selectedCourseId}
                                onChange={(e) => {
                                    setSelectedCourseId(e.target.value);
                                    setSearchParams({page: '1'});
                                }}
                                className="my-classes__search-input my-classes__course-filter"
                            >
                                <option value="">Tất cả khóa học</option>
                                {courses.map(course => (
                                    <option key={course.id} value={course.id.toString()}>
                                        {course.courseName}
                                    </option>
                                ))}
                            </select>

                            <button onClick={handleSearch} className="my-classes__search-button">
                                <FaSearch className="icon"/>
                                <span>Tìm kiếm</span>
                            </button>
                        </div>

                        {/* Right side - Teacher Stats or Join Class Button */}
                        {(hasRole('admin') || hasRole('teacher') || hasRole('ta')) ? (
                            <div className="flex items-center gap-2 bg-gray-800/40 border border-gray-700 rounded-lg px-4 py-2 text-gray-100">
                                <span className="text-sm">Tổng số lớp: </span>
                                <span className="text-xl font-semibold text-green-400">{totalClasses}</span>
                            </div>

                        ) : (hasRole('student')) && (
                            <button
                                onClick={() => setIsJoinPopupOpen(true)}
                                className="my-classes__join-button"
                            >
                                <FaPlus className="icon"/>
                                <span>Tham gia lớp học</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Join Class Popup */}
            {isJoinPopupOpen && (
                <div className="my-classes__modal-overlay">
                    <div className="my-classes__modal-container">
                        <div className="my-classes__modal-header">
                            <h2 className="my-classes__modal-title vietnamese">
                                Tham gia lớp học
                            </h2>
                            <button
                                onClick={handleCancelJoin}
                                className="my-classes__modal-close"
                                disabled={isJoining}
                            >
                                <FaTimes className="icon"/>
                            </button>
                        </div>

                        <div className="my-classes__modal-content">
                            {/* Success Message */}
                            {joinSuccess.show && (
                                <div className="my-classes__alert--success">
                                    <FaCheckCircle className="icon"/>
                                    <p className="text">{joinSuccess.message}</p>
                                </div>
                            )}

                            <div className="my-classes__form-group">
                                <label className="my-classes__form-label">
                                    Mã lớp
                                </label>
                                <div className="my-classes__form-description">
                                    Nhập mã lớp học mà giảng viên đã cung cấp để tham gia.
                                </div>
                                <input
                                    type="text"
                                    value={classCode}
                                    onChange={handleClassCodeChange}
                                    placeholder="Mã lớp"
                                    disabled={isJoining || joinSuccess.show}
                                    className={`my-classes__form-input ${
                                        joinError ? 'my-classes__form-input--error' :
                                            joinSuccess.show ? 'my-classes__form-input--success' : ''
                                    }`}
                                />

                                {/* Error Message */}
                                {joinError && (
                                    <div className="my-classes__alert--error">
                                        <FaExclamationTriangle className="icon"/>
                                        <p className="text">{joinError}</p>
                                    </div>
                                )}
                            </div>

                            <div className="my-classes__form-actions">
                                <button
                                    onClick={handleCancelJoin}
                                    disabled={isJoining}
                                    className="my-classes__button--secondary"
                                >
                                    {joinSuccess.show ? 'Đóng' : 'Hủy'}
                                </button>

                                <button
                                    onClick={handleJoinOrClose}
                                    disabled={isJoining}
                                    className="my-classes__button--primary"
                                >
                                    {isJoining ? 'Đang tham gia...' : joinSuccess.show ? 'Xong' : 'Tham gia'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="my-classes__main">
                {/* Loading State */}
                {loading && (
                    <div className="my-classes__grid">
                        {[...Array(4)].map((_, i) => (
                            <ClassCardSkeleton key={i}/>
                        ))}
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div className="my-classes__error">
                        <div className="my-classes__error-content">
                            <div className="my-classes__error-icon">
                                <FaTimes className="icon"/>
                            </div>
                            <h3 className="my-classes__error-title vietnamese">Có lỗi xảy ra</h3>
                            <p className="my-classes__error-description">{error}</p>
                            <button
                                onClick={() => loadClasses(currentPage)}
                                className="my-classes__button--primary"
                            >
                                Thử lại
                            </button>
                        </div>
                    </div>
                )}

                {/* Classes Grid */}
                {!loading && !error && transformedClasses.length > 0 && (
                    <>
                        <div className="my-classes__grid">
                            {transformedClasses.map((classItem) => {
                                const textColor = getTextColor(classItem.courseColor);
                                const darkerColor = darkenColor(classItem.courseColor, 15);

                                return (
                                    <div key={classItem.id} className="my-classes__card">
                                        {/* Card Header với màu động từ courseColor */}
                                        <div
                                            className="my-classes__card-header"
                                            style={{
                                                background: `linear-gradient(135deg, ${classItem.courseColor}, ${darkerColor})`
                                            }}
                                        >
                                            {/*/!* Class Level Badge *!/*/}
                                            {/*<div className="my-classes__card-level-badge">*/}
                                            {/*    <span>{classItem.levelLabel}</span>*/}
                                            {/*</div>*/}

                                            {/*/!* Status Badge *!/*/}
                                            {/*<div className={`my-classes__card-status-badge ${classItem.statusClass}`}>*/}
                                            {/*    <span>{classItem.statusLabel}</span>*/}
                                            {/*</div>*/}

                                            {/* Teacher Avatar với màu động */}
                                            {/*<div*/}
                                            {/*    className="my-classes__card-avatar"*/}
                                            {/*    style={{*/}
                                            {/*        backgroundColor: classItem.courseColor,*/}
                                            {/*        color: textColor,*/}
                                            {/*        filter: 'brightness(0.9)'*/}
                                            {/*    }}*/}
                                            {/*>*/}
                                            {/*    {classItem.teacher.initials}*/}
                                            {/*</div>*/}
                                        </div>

                                        {/* Card Content */}
                                        <div className="my-classes__card-content">
                                            {/* Class Title */}
                                            <h3 className="my-classes__card-title vietnamese">
                                                {classItem.title}
                                            </h3>

                                            {/* Class Stats */}
                                            <div className="my-classes__card-stats">
                                                <div className="stat">
                                                    <FaUsers/>
                                                    <span>{classItem.students} học viên</span>
                                                </div>
                                            </div>

                                            {/* Action Button */}
                                            <button
                                                onClick={() => handleButtonClick(classItem.id)}
                                                className="my-classes__card-action"
                                            >
                                                Xem chi tiết
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Pagination */}
                        {/*<div className="flex justify-center mt-8 mb-8">*/}
                        {/*    <Pagination*/}
                        {/*        currentPage={currentPage}*/}
                        {/*        totalPages={Math.ceil(totalClasses / pageSize)}*/}
                        {/*        onPageChange={(page) => {*/}
                        {/*            setSearchParams({page: page.toString()});*/}
                        {/*        }}*/}
                        {/*    />*/}
                        {/*</div>*/}
                    </>
                )}

                {/* Empty State */}
                {!loading && !error && transformedClasses.length === 0 && (
                    <div className="my-classes__empty">
                        <div className="my-classes__empty-content">
                            <div className="my-classes__empty-icon">
                                <FaBookOpen className="icon"/>
                            </div>
                            <h3 className="my-classes__empty-title vietnamese">
                                {searchTerm ? 'Không tìm thấy lớp học' : 'Trống'}
                            </h3>
                            <p className="my-classes__empty-description">
                                {searchTerm
                                    ? 'Hãy thử với từ khóa khác hoặc tham gia lớp học mới.'
                                    : ''}
                            </p>
                            <div className="my-classes__empty-actions">
                                {searchTerm && (
                                    <button
                                        onClick={() => {
                                            setSearchTerm('');
                                            loadClasses(1);
                                        }}
                                        className="my-classes__button--secondary"
                                    >
                                        Xóa tìm kiếm
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsJoinPopupOpen(true)}
                                    className="my-classes__join-button"
                                >
                                    Tham gia lớp học
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default MyClasses;