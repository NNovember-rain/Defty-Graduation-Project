// Sidebar.tsx
import React, { useState, forwardRef, useMemo, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUserStore } from '../../../shared/authentication/useUserStore'; // Import useUserStore

import {
    FaSearch,
    FaChartBar,
    FaFileAlt,
    FaUsers,
    FaTasks,
    FaClipboardList,
    FaComments,
    FaEdit,
    FaGraduationCap,
    FaPollH,
    FaBookOpen,
    FaUserCog,
    FaKey,
    FaTools,
    FaRegListAlt,
    FaQuestionCircle,
    FaEnvelope, FaBoxes, FaCog,
    FaSync
} from 'react-icons/fa';
import { MdDashboard, MdOutlineSettings } from 'react-icons/md';
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';

interface SidebarItem {
    id: string;
    labelKey: string;
    icon?: React.ReactNode;
    path?: string;
    children?: SidebarItem[];
    badge?: string;
    type?: 'new' | 'info';
    requiredRoles?: string[]; // Thêm thuộc tính này để kiểm tra tất cả các vai trò
    requiredAnyOfRoles?: string[]; // Thêm thuộc tính này để kiểm tra bất kỳ vai trò nào
    requiredPermission?: string; // Thêm thuộc tính này để kiểm tra quyền cụ thể
}

const sidebarContentConfig: SidebarItem[] = [
    {
        id: 'overview',
        labelKey: 'sidebar.overview',
        icon: <MdDashboard />,
        path: '/admin/dashboard',
        requiredAnyOfRoles: ['admin', 'teacher']
    },
    {
        id: 'reportsAndStatistics',
        labelKey: 'sidebar.reportsAndStatistics',
        icon: <FaChartBar />,
        requiredAnyOfRoles: ['admin', 'teacher'],
        children: [
            { id: 'overviewStatistics', labelKey: 'sidebar.overviewStatistics', icon: <FaChartBar />, path: '/admin/reports/overview', requiredAnyOfRoles: ['admin', 'teacher'] },
            { id: 'assignmentResultsStatistics', labelKey: 'sidebar.assignmentResultsStatistics', icon: <FaPollH />, path: '/admin/reports/assignment-results', requiredAnyOfRoles: ['admin', 'teacher'] },
            { id: 'studentProgress', labelKey: 'sidebar.studentProgress', icon: <FaRegListAlt />, path: '/admin/reports/student-progress', requiredAnyOfRoles: ['admin', 'teacher'] },
        ]
    },
    {
        id: 'contentManagement',
        labelKey: 'sidebar.contentManagement',
        icon: <FaFileAlt />,
        requiredAnyOfRoles: ['admin', 'teacher'],
        children: [
            {
                id: 'assignments',
                labelKey: 'sidebar.assignments',
                icon: <FaTasks />,
                path: '/admin/content/assignments',
                requiredAnyOfRoles: ['admin', 'teacher']
            },
            {
                id: 'quizzesAndTests',
                labelKey: 'sidebar.quizzesAndTests',
                icon: <FaQuestionCircle />,
                path: '/admin/content/quizzes',
                requiredAnyOfRoles: ['admin', 'teacher']
            },
            {
                id: 'lecturesAndMaterials',
                labelKey: 'sidebar.lecturesAndMaterials',
                icon: <FaBookOpen />,
                path: '/admin/content/materials',
                requiredAnyOfRoles: ['admin', 'teacher']
            },
            {
                id: 'lecturesAndMaterials',
                labelKey: 'sidebar.typeUml',
                icon: <FaTools />,
                path: '/admin/content/type-uml',
                requiredAnyOfRoles: ['admin', 'teacher']
            },
        ],
    },
    {
        id: 'classManagement',
        labelKey: 'sidebar.classManagement',
        icon: <FaGraduationCap />,
        path: '/admin/class',
        requiredAnyOfRoles: ['admin', 'teacher']
        ,
        children: [
            {
                id: 'classList',
                labelKey: 'sidebar.classList',
                icon: <FaBookOpen />,
                path: '/admin/class/list',
                requiredAnyOfRoles: ['admin', 'teacher', 'student']
            },
            {
                id: 'courseCategories',
                labelKey: 'sidebar.courseCategories', // "Danh mục khóa học"
                icon: <FaBoxes />, // Biểu tượng hộp (cho danh mục)
                path: '/admin/class/categories', // Trang quản lý danh mục/chương trình
                requiredAnyOfRoles: ['admin'] // Chỉ admin
            },
            // 3. Thống kê / Báo cáo lớp học (Class Statistics / Reports) (Tùy chọn)
            // Có thể là báo cáo tổng hợp riêng cho lớp học, nếu mục "Báo cáo & Thống kê" chung quá rộng
            {
                id: 'classReports',
                labelKey: 'sidebar.classReports', // "Báo cáo lớp học"
                icon: <FaChartBar />, // Biểu tượng biểu đồ cột
                path: '/admin/class/reports', // Trang báo cáo thống kê lớp học
                requiredAnyOfRoles: ['admin', 'teacher'] // Admin và giáo viên có thể xem
            },
            // 4. Cài đặt chung cho lớp học (Global Class Settings) (Chỉ Admin)
            {
                id: 'globalClassSettings',
                labelKey: 'sidebar.globalClassSettings', // "Cài đặt chung lớp học"
                icon: <FaCog />, // Biểu tượng bánh răng
                path: '/admin/class/settings', // Trang cài đặt chung
                requiredAnyOfRoles: ['admin'] // Chỉ admin
            }
        ]
    },
    { 
        id: 'submissionList', 
        labelKey: 'sidebar.submissionList', 
        icon: <FaClipboardList />, 
        path: '/admin/submissions', 
        requiredAnyOfRoles: ['admin', 'teacher'] 
    },
    {
        id: 'submissionAutoManagement',
        labelKey: 'sidebar.submissionAutoManagement',
        icon: <FaSync />,
        path: '/admin/submission/auto',
        requiredAnyOfRoles: ['admin', 'teacher'],
    },
    {
        id: 'feedbackAndComments',
        labelKey: 'sidebar.feedbackAndComments',
        icon: <FaComments />,
        requiredAnyOfRoles: ['admin', 'teacher'],
        children: [
            { id: 'manageAIFeedback', labelKey: 'sidebar.manageAIFeedback', icon: <FaComments />, path: '/admin/feedback/ai-feedback', requiredAnyOfRoles: ['admin'] },
            { id: 'studentFeedbackOnAI', labelKey: 'sidebar.studentFeedbackOnAI', icon: <FaComments />, path: '/admin/feedback/student-ai-feedback', requiredAnyOfRoles: ['admin'] },
            { id: 'editComments', labelKey: 'sidebar.editComments', icon: <FaEdit />, path: '/admin/feedback/edit', requiredAnyOfRoles: ['admin', 'teacher'] },
            { id: 'systemFeedback', labelKey: 'sidebar.systemFeedback', icon: <FaEnvelope />, path: '/admin/system-feedback', requiredAnyOfRoles: ['admin'] },
        ]
    },
    {
        id: 'systemConfiguration',
        labelKey: 'sidebar.systemConfiguration',
        icon: <MdOutlineSettings />,
        requiredAnyOfRoles: ['admin'],
        children: [
            { id: 'promptConfiguration', labelKey: 'sidebar.promptConfiguration', icon: <FaTools />, path: '/admin/settings/prompts', requiredAnyOfRoles: ['admin'] }
        ],
    },
    {
        id: 'userManagement',
        labelKey: 'sidebar.userManagement',
        icon: <FaUsers />,
        requiredAnyOfRoles: ['admin'],
        children: [
            { id: 'userList', labelKey: 'sidebar.userManagement', icon: <FaUsers />, path: '/admin/users', requiredAnyOfRoles: ['admin'] },
            { id: 'roleManagement', labelKey: 'sidebar.roleManagement', icon: <FaUserCog />, path: '/admin/auth/roles', requiredAnyOfRoles: ['admin'] },
            { id: 'permissionManagement', labelKey: 'sidebar.permissionManagement', icon: <FaKey />, path: '/admin/auth/permissions', requiredAnyOfRoles: ['admin'] },
        ],
    },
];

interface SidebarProps {
    isCollapsed: boolean;
    className?: string;
}

const Sidebar = forwardRef<HTMLDivElement, SidebarProps>(({ isCollapsed, className }, ref) => {
    const { t } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    const [openMenus, setOpenMenus] = useState<string[]>([]);
    const [isHovered, setIsHovered] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>('');

    const { isAuthenticated, isLoading, hasRole, hasAnyRole, hasPermission } = useUserStore();

    // Debug user roles
    React.useEffect(() => {
        if (!isLoading && isAuthenticated) {
            console.log('Current user roles:', useUserStore.getState().user?.roles?.map(r => r.name));
            console.log('Has admin role:', hasRole('admin'));
            console.log('Has teacher role:', hasRole('teacher'));
            console.log('Has any admin/teacher role:', hasAnyRole(['admin', 'teacher']));
        }
    }, [isAuthenticated, isLoading, hasRole, hasAnyRole]);

    React.useEffect(() => {
        if (isCollapsed) {
            setOpenMenus([]);
        }
    }, [isCollapsed]);

    const isPathActive = useCallback((itemPath: string | undefined): boolean => {
        if (!itemPath) return false;
        return location.pathname === itemPath || location.pathname.startsWith(`${itemPath}/`);
    }, [location.pathname]);

    const shouldItemBeActive = useCallback((item: SidebarItem): boolean => {
        if (item.path && isPathActive(item.path)) {
            return true;
        }
        if (item.children) {
            return item.children.some(child => shouldItemBeActive(child));
        }
        return false;
    }, [isPathActive]);

    const hasAccess = useCallback((item: SidebarItem): boolean => {
        if (isLoading || !isAuthenticated) {
            return false;
        }

        if (!item.requiredRoles && !item.requiredAnyOfRoles && !item.requiredPermission) {
            return true;
        }

        if (item.requiredRoles && item.requiredRoles.length > 0) {
            const userHasAllRequiredRoles = item.requiredRoles.every(role => hasRole(role));
            if (!userHasAllRequiredRoles) {
                return false;
            }
        }

        if (item.requiredAnyOfRoles && item.requiredAnyOfRoles.length > 0) {
            const userHasAnyOfRoles = hasAnyRole(item.requiredAnyOfRoles);
            if (!userHasAnyOfRoles) {
                return false;
            }
        }

        if (item.requiredPermission) {
            const userHasSpecificPermission = hasPermission(item.requiredPermission);
            if (!userHasSpecificPermission) {
                return false;
            }
        }

        return true;
    }, [isAuthenticated, isLoading, hasRole, hasAnyRole, hasPermission]);

    const handleMenuClick = useCallback((item: SidebarItem) => {
        const id = item.id;
        const hasChildren = item.children && item.children.length > 0;

        if (hasChildren) {
            setOpenMenus(prevOpenMenus =>
                prevOpenMenus.includes(id)
                    ? prevOpenMenus.filter(menuId => menuId !== id)
                    : [...prevOpenMenus, id]
            );
        } else if (item.path) {
            navigate(item.path);
        }
    }, [navigate]);

    const handleKeyDown = useCallback((event: React.KeyboardEvent, item: SidebarItem) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleMenuClick(item);
        }
    }, [handleMenuClick]);

    const normalizeString = useCallback((str: string): string => {
        return str
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();
    }, []);

    // Hàm tiện ích để highlight văn bản
    const highlightText = useCallback((text: string, searchTerm: string): React.ReactNode => {
        if (!searchTerm.trim()) {
            return text;
        }

        const normalizedText = normalizeString(text);
        const normalizedSearchTerm = normalizeString(searchTerm.trim());
        const parts: React.ReactNode[] = [];
        let startIndex = 0;

        let match;
        // Sử dụng regex với 'g' (global) để tìm tất cả các lần xuất hiện
        const regex = new RegExp(normalizedSearchTerm, 'gi');

        while ((match = regex.exec(normalizedText)) !== null) {
            const preMatchText = text.substring(startIndex, match.index);
            const matchedText = text.substring(match.index, match.index + normalizedSearchTerm.length);

            if (preMatchText) {
                parts.push(<React.Fragment key={`pre-${startIndex}`}>{preMatchText}</React.Fragment>);
            }
            parts.push(<span key={`match-${match.index}`} className="sidebar__highlight">{matchedText}</span>);
            startIndex = match.index + normalizedSearchTerm.length;
        }

        const postMatchText = text.substring(startIndex);
        if (postMatchText) {
            parts.push(<React.Fragment key={`post-${startIndex}`}>{postMatchText}</React.Fragment>);
        }

        return <>{parts}</>;
    }, [normalizeString]);


    const filteredSidebarItems = useMemo(() => {
        const normalizedSearchTerm = searchTerm.trim() ? normalizeString(searchTerm.trim()) : '';

        const filterItems = (items: SidebarItem[]): SidebarItem[] => {
            return items.reduce((acc: SidebarItem[], item) => {
                if (!hasAccess(item)) {
                    return acc;
                }

                const translatedLabel = t(item.labelKey);
                const normalizedTranslatedLabel = normalizeString(translatedLabel);

                const itemMatchesSearch = normalizedSearchTerm ? normalizedTranslatedLabel.includes(normalizedSearchTerm) : true;

                if (item.children) {
                    const filteredChildren = filterItems(item.children);
                    if (filteredChildren.length > 0) {
                        // Nếu item cha khớp hoặc có con khớp, thêm item cha và các con đã lọc
                        if (itemMatchesSearch || filteredChildren.length > 0) { // Đảm bảo item cha được thêm nếu có con khớp
                            acc.push({ ...item, children: filteredChildren });
                        }
                    } else if (itemMatchesSearch) { // Nếu không có con nhưng item cha khớp
                        acc.push(item);
                    }
                } else if (itemMatchesSearch) { // Nếu là item lá và khớp
                    acc.push(item);
                }
                return acc;
            }, []);
        };

        return filterItems(sidebarContentConfig);
    }, [searchTerm, t, normalizeString, hasAccess]);

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    }, []);

    const handleLogoClick = useCallback(() => {
        navigate('/admin/dashboard');
    }, [navigate]);

    const handleProfileClick = useCallback(() => {
        navigate('/admin/profile');
    }, [navigate]);

    const renderSidebarItems = useCallback((items: SidebarItem[]) => {
        return (
            <ul>
                {items.map(item => {
                    const hasChildren = item.children && item.children.length > 0;
                    const isOpen = openMenus.includes(item.id) || (searchTerm.trim() && hasChildren);
                    const isActive = shouldItemBeActive(item);

                    return (
                        <li key={item.id} className={`sidebar__item ${isActive ? 'active' : ''}`}>
                            <div
                                className='sidebar__item-header'
                                onClick={() => handleMenuClick(item)}
                                onKeyDown={(e) => handleKeyDown(e, item)}
                                role="button"
                                tabIndex={0}
                            >
                                {item.icon && <span className='sidebar__item-icon'>{item.icon}</span>}
                                {/* Sử dụng highlightText cho label */}
                                <span className='sidebar__item-label'>{highlightText(t(item.labelKey), searchTerm)}</span>
                                {item.badge && (
                                    <span className={`sidebar__item-badge sidebar__item-badge--${item.type || 'info'}`}>
                                        {item.badge}
                                    </span>
                                )}
                                {hasChildren && (
                                    <span className='sidebar__item-toggle'>
                                        {isOpen ? <IoIosArrowUp /> : <IoIosArrowDown />}
                                    </span>
                                )}
                            </div>
                            {hasChildren && isOpen && (
                                <ul className='sidebar__submenu'>
                                    {item.children!.map(child => {
                                        const hasGrandChildren = child.children && child.children.length > 0;
                                        const isChildActive = shouldItemBeActive(child);
                                        const isChildOpen = openMenus.includes(child.id) || (searchTerm.trim() && hasGrandChildren);

                                        const content = (
                                            <>
                                                {child.icon && <span className='sidebar__item-icon'>{child.icon}</span>}
                                                {/* Sử dụng highlightText cho submenu label */}
                                                <span className='sidebar__submenu-label'>{highlightText(t(child.labelKey), searchTerm)}</span>
                                                {child.badge && (
                                                    <span className={`sidebar__item-badge sidebar__item-badge--${child.type || 'info'}`}>
                                                        {child.badge}
                                                    </span>
                                                )}
                                                {hasGrandChildren && (
                                                    <span className='sidebar__item-toggle'>
                                                        {isChildOpen ? <IoIosArrowUp /> : <IoIosArrowDown />}
                                                    </span>
                                                )}
                                            </>
                                        );

                                        return (
                                            <li key={child.id} className={`sidebar__submenu-item ${isChildActive ? 'active' : ''}`}>
                                                {child.path && !hasGrandChildren ? (
                                                    <Link
                                                        to={child.path}
                                                        className='sidebar__submenu-link'
                                                        role="link"
                                                        tabIndex={0}
                                                    >
                                                        {content}
                                                    </Link>
                                                ) : (
                                                    <div
                                                        className='sidebar__submenu-link'
                                                        onClick={() => handleMenuClick(child)}
                                                        onKeyDown={(e) => handleKeyDown(e, child)}
                                                        role="button"
                                                        tabIndex={0}
                                                    >
                                                        {content}
                                                    </div>
                                                )}

                                                {hasGrandChildren && isChildOpen && (
                                                    <ul className='sidebar__sub-submenu'>
                                                        {child.children!.map(grandchild => {
                                                            const isGrandChildActive = isPathActive(grandchild.path);

                                                            return (
                                                                <li key={grandchild.id} className={`sidebar__sub-submenu-item ${isGrandChildActive ? 'active' : ''}`}>
                                                                    {grandchild.path ? (
                                                                        <Link
                                                                            to={grandchild.path}
                                                                            className='sidebar__submenu-link'
                                                                            role="link"
                                                                            tabIndex={0}
                                                                        >
                                                                            {grandchild.icon && <span className='sidebar__item-icon'>{grandchild.icon}</span>}
                                                                            {/* Sử dụng highlightText cho sub-submenu label */}
                                                                            <span className='sidebar__submenu-label'>{highlightText(t(grandchild.labelKey), searchTerm)}</span>
                                                                        </Link>
                                                                    ) : (
                                                                        <div className='sidebar__submenu-link'>
                                                                            {grandchild.icon && <span className='sidebar__item-icon'>{grandchild.icon}</span>}
                                                                            {/* Sử dụng highlightText cho sub-submenu label */}
                                                                            <span className='sidebar__submenu-label'>{highlightText(t(grandchild.labelKey), searchTerm)}</span>
                                                                        </div>
                                                                    )}
                                                                </li>
                                                            );
                                                        })}
                                                    </ul>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </li>
                    );
                })}
            </ul>
        );
    }, [openMenus, searchTerm, shouldItemBeActive, t, handleMenuClick, handleKeyDown, isPathActive, highlightText]); // Thêm highlightText vào dependencies

    return (
        <div
            ref={ref}
            className={`sidebar ${isCollapsed ? 'sidebar__collapsed' : ''} ${isHovered ? 'sidebar__hovered' : ''} ${className || ''}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div
                className='sidebar__logo'
                onClick={handleLogoClick}
                onKeyDown={(e) => e.key === 'Enter' && handleLogoClick()}
                role="button"
                tabIndex={0}
            >
                <img src="/assets/images/defty.jpg" alt={t('sidebar.deftyLogoAlt')} className="sidebar__logo-image" />
                <span className="sidebar__logo-text">{t('login.defty')}</span>
            </div>

            <div
                className='sidebar__profile'
                onClick={handleProfileClick}
                onKeyDown={(e) => e.key === 'Enter' && handleProfileClick()}
                role="button"
                tabIndex={0}
            >
                <img src="/assets/images/avatar.jpg" alt={t('sidebar.userAvatarAlt')} className="sidebar__profile-avatar" />
                <span className="sidebar__profile-name">{t('sidebar.userName')}</span>
            </div>

            <div className='sidebar__search'>
                <div className='sidebar__search--content'>
                    <input
                        type='text'
                        placeholder={t('sidebar.searchPlaceholder')}
                        className='sidebar__search--content-input'
                        value={searchTerm}
                        onChange={handleSearchChange}
                        aria-label={t('sidebar.searchPlaceholder')}
                    />
                    <button
                        className='sidebar__search--content-button'
                        type="button"
                        aria-label="Search"
                    >
                        <FaSearch />
                    </button>
                </div>
            </div>

            <div className='sidebar__content'>
                {filteredSidebarItems.length > 0 ? (
                    renderSidebarItems(filteredSidebarItems)
                ) : (
                    <div className="sidebar__no-results">
                        <p>{t('sidebar.noResults')}</p>
                    </div>
                )}
            </div>
        </div>
    );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;