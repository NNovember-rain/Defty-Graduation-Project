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
    FaEnvelope,
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
        id: 'userManagement',
        labelKey: 'sidebar.userManagement',
        icon: <FaUsers />,
        requiredAnyOfRoles: ['admin'],
        children: [
            { id: 'userList', labelKey: 'sidebar.userList', icon: <FaUsers />, path: '/admin/users', requiredAnyOfRoles: ['admin'] },
            { id: 'profileManagement', labelKey: 'sidebar.profileManagement', icon: <FaUserCog />, path: '/admin/profile', requiredAnyOfRoles: ['admin', 'teacher'] },
            { id: 'accountSettings', labelKey: 'sidebar.accountSettings', icon: <MdOutlineSettings />, path: '/admin/account-settings', requiredAnyOfRoles: ['admin', 'teacher'] },
            { id: 'resetPassword', labelKey: 'sidebar.resetPassword', icon: <FaKey />, path: '/admin/forgot-password', requiredAnyOfRoles: ['admin', 'teacher'] },
        ],
    },
    {
        id: 'contentManagement',
        labelKey: 'sidebar.contentManagement',
        icon: <FaFileAlt />,
        requiredAnyOfRoles: ['admin', 'teacher'], // Chỉ admin và teacher mới thấy mục này
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
        ],
    },
    {
        id: 'classManagement',
        labelKey: 'sidebar.classManagement',
        icon: <FaGraduationCap />,
        path: '/admin/classes',
        requiredAnyOfRoles: ['admin', 'teacher']
    },
    {
        id: 'submissionManagement',
        labelKey: 'sidebar.submissionManagement',
        icon: <FaClipboardList />,
        requiredAnyOfRoles: ['admin', 'teacher'],
        children: [
            { id: 'submissionList', labelKey: 'sidebar.submissionList', icon: <FaClipboardList />, path: '/admin/submissions', requiredAnyOfRoles: ['admin', 'teacher'] },
            { id: 'manualGrading', labelKey: 'sidebar.manualGrading', icon: <FaFileAlt />, path: '/admin/submission /manual-grading', requiredAnyOfRoles: ['admin', 'teacher'] },
        ]
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
        id: 'systemConfiguration',
        labelKey: 'sidebar.systemConfiguration',
        icon: <MdOutlineSettings />,
        requiredAnyOfRoles: ['admin'],
        children: [
            { id: 'plantUMLConfiguration', labelKey: 'sidebar.plantUMLConfiguration', icon: <FaTools />, path: '/admin/settings/plantuml', requiredAnyOfRoles: ['admin'] },
            { id: 'aiAPIConfiguration', labelKey: 'sidebar.aiAPIConfiguration', icon: <FaTools />, path: '/admin/settings/ai-api', requiredAnyOfRoles: ['admin'] },
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

    // Lấy thông tin người dùng từ useUserStore
    const { isAuthenticated, isLoading, hasRole, hasAnyRole, hasPermission } = useUserStore();

    // Reset open menus when sidebar is collapsed
    React.useEffect(() => {
        if (isCollapsed) {
            setOpenMenus([]);
        }
    }, [isCollapsed]);

    // Check if a path is active
    const isPathActive = useCallback((itemPath: string | undefined): boolean => {
        if (!itemPath) return false;
        return location.pathname === itemPath || location.pathname.startsWith(`${itemPath}/`);
    }, [location.pathname]);

    // Check if an item should be active (including children)
    const shouldItemBeActive = useCallback((item: SidebarItem): boolean => {
        if (item.path && isPathActive(item.path)) {
            return true;
        }
        if (item.children) {
            return item.children.some(child => shouldItemBeActive(child));
        }
        return false;
    }, [isPathActive]);

    // Hàm kiểm tra quyền truy cập cho một mục sidebar
    const hasAccess = useCallback((item: SidebarItem): boolean => {
        // Nếu đang tải hoặc chưa xác thực, không cho phép truy cập
        if (isLoading || !isAuthenticated) {
            return false;
        }

        // Nếu không yêu cầu quyền gì, thì có quyền truy cập
        if (!item.requiredRoles && !item.requiredAnyOfRoles && !item.requiredPermission) {
            return true;
        }

        // Kiểm tra requiredRoles (tất cả các vai trò phải có)
        if (item.requiredRoles && item.requiredRoles.length > 0) {
            const userHasAllRequiredRoles = item.requiredRoles.every(role => hasRole(role));
            if (!userHasAllRequiredRoles) {
                return false;
            }
        }

        // Kiểm tra requiredAnyOfRoles (chỉ cần có ít nhất một trong các vai trò)
        if (item.requiredAnyOfRoles && item.requiredAnyOfRoles.length > 0) {
            const userHasAnyOfRoles = hasAnyRole(item.requiredAnyOfRoles);
            if (!userHasAnyOfRoles) {
                return false;
            }
        }

        // Kiểm tra requiredPermission (nếu có)
        if (item.requiredPermission) {
            const userHasSpecificPermission = hasPermission(item.requiredPermission);
            if (!userHasSpecificPermission) {
                return false;
            }
        }

        return true;
    }, [isAuthenticated, isLoading, hasRole, hasAnyRole, hasPermission]); // Thêm dependencies cho useCallback

    // Handle menu click with proper navigation
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

    // Handle keyboard navigation
    const handleKeyDown = useCallback((event: React.KeyboardEvent, item: SidebarItem) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleMenuClick(item);
        }
    }, [handleMenuClick]);

    // Normalize string for search (remove diacritics)
    const normalizeString = useCallback((str: string): string => {
        return str
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();
    }, []);

    // Filter sidebar items based on search term AND user roles
    const filteredSidebarItems = useMemo(() => {
        const normalizedSearchTerm = searchTerm.trim() ? normalizeString(searchTerm.trim()) : '';

        const filterItems = (items: SidebarItem[]): SidebarItem[] => {
            return items.reduce((acc: SidebarItem[], item) => {
                // Chỉ hiển thị mục nếu người dùng có quyền truy cập
                if (!hasAccess(item)) {
                    return acc;
                }

                const translatedLabel = t(item.labelKey);
                const normalizedTranslatedLabel = normalizeString(translatedLabel);

                const itemMatchesSearch = normalizedSearchTerm ? normalizedTranslatedLabel.includes(normalizedSearchTerm) : true;

                if (item.children) {
                    const filteredChildren = filterItems(item.children); // Đệ quy lọc con
                    if (filteredChildren.length > 0) {
                        // Nếu item cha khớp với tìm kiếm HOẶC có con khớp, thì thêm item cha vào
                        if (itemMatchesSearch) {
                            acc.push({ ...item, children: filteredChildren });
                        } else {
                            // Nếu item cha không khớp tìm kiếm nhưng có con khớp, chỉ thêm con
                            // Nếu muốn hiển thị item cha, hãy bỏ comment dòng dưới và đảm bảo item cha có children là filteredChildren
                            acc.push({ ...item, children: filteredChildren });
                        }
                    } else if (itemMatchesSearch && !normalizedSearchTerm) {
                        // Nếu không có con nào khớp, nhưng item cha khớp với tìm kiếm VÀ không có searchTerm
                        // Hoặc item cha khớp tìm kiếm và không có con
                        acc.push(item);
                    } else if (itemMatchesSearch && normalizedSearchTerm && !filteredChildren.length) {
                        // Nếu có searchTerm, item cha khớp tìm kiếm và không có con nào khớp
                        acc.push(item);
                    }
                } else if (itemMatchesSearch) {
                    // Nếu là mục không có con và khớp với tìm kiếm
                    acc.push(item);
                }
                return acc;
            }, []);
        };

        return filterItems(sidebarContentConfig);
    }, [searchTerm, t, normalizeString, hasAccess]); // Thêm hasAccess vào dependencies

    // Handle search input change
    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    }, []);

    // Handle logo click
    const handleLogoClick = useCallback(() => {
        navigate('/admin/dashboard');
    }, [navigate]);

    // Handle profile click
    const handleProfileClick = useCallback(() => {
        navigate('/admin/profile');
    }, [navigate]);

    // Render sidebar items recursively
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
                                <span className='sidebar__item-label'>{t(item.labelKey)}</span>
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
                                                <span className='sidebar__submenu-label'>{t(child.labelKey)}</span>
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
                                                                            <span className='sidebar__submenu-label'>{t(grandchild.labelKey)}</span>
                                                                        </Link>
                                                                    ) : (
                                                                        <div className='sidebar__submenu-link'>
                                                                            {grandchild.icon && <span className='sidebar__item-icon'>{grandchild.icon}</span>}
                                                                            <span className='sidebar__submenu-label'>{t(grandchild.labelKey)}</span>
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
    }, [openMenus, searchTerm, shouldItemBeActive, t, handleMenuClick, handleKeyDown, isPathActive]);

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
                <img src="/assets/images/defty.png" alt={t('sidebar.deftyLogoAlt')} className="sidebar__logo-image" />
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