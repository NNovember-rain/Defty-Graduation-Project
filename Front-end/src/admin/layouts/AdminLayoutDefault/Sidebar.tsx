// Sidebar.tsx
import React, { useState, forwardRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

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
}

const sidebarContentConfig: SidebarItem[] = [
    {
        id: 'overview',
        labelKey: 'sidebar.overview',
        icon: <MdDashboard />,
        path: '/admin/dashboard'
    },
    {
        id: 'userManagement',
        labelKey: 'sidebar.userManagement',
        icon: <FaUsers />,
        children: [
            { id: 'userList', labelKey: 'sidebar.userList', icon: <FaUsers />, path: '/admin/users' },
            { id: 'profileManagement', labelKey: 'sidebar.profileManagement', icon: <FaUserCog />, path: '/admin/profile' },
            { id: 'accountSettings', labelKey: 'sidebar.accountSettings', icon: <MdOutlineSettings />, path: '/admin/account-settings' },
            { id: 'resetPassword', labelKey: 'sidebar.resetPassword', icon: <FaKey />, path: '/admin/forgot-password' },
        ],
    },
    {
        id: 'contentManagement',
        labelKey: 'sidebar.contentManagement',
        icon: <FaFileAlt />,
        children: [
            {
                id: 'assignments',
                labelKey: 'sidebar.assignments',
                icon: <FaTasks />,
                path: '/admin/content/assignments'
            },
            {
                id: 'quizzesAndTests',
                labelKey: 'sidebar.quizzesAndTests',
                icon: <FaQuestionCircle />,
                path: '/admin/content/quizzes'
            },
            {
                id: 'lecturesAndMaterials',
                labelKey: 'sidebar.lecturesAndMaterials',
                icon: <FaBookOpen />,
                path: '/admin/content/materials'
            },
        ],
    },
    {
        id: 'classManagement',
        labelKey: 'sidebar.classManagement',
        icon: <FaGraduationCap />,
        path: '/admin/classes'
    },
    {
        id: 'submissionManagement',
        labelKey: 'sidebar.submissionManagement',
        icon: <FaClipboardList />,
        children: [
            { id: 'submissionList', labelKey: 'sidebar.submissionList', icon: <FaClipboardList />, path: '/admin/submissions' },
            { id: 'manualGrading', labelKey: 'sidebar.manualGrading', icon: <FaFileAlt />, path: '/admin/submissions/manual-grading' },
        ]
    },
    {
        id: 'feedbackAndComments',
        labelKey: 'sidebar.feedbackAndComments',
        icon: <FaComments />,
        children: [
            { id: 'manageAIFeedback', labelKey: 'sidebar.manageAIFeedback', icon: <FaComments />, path: '/admin/feedback/ai-feedback' },
            { id: 'studentFeedbackOnAI', labelKey: 'sidebar.studentFeedbackOnAI', icon: <FaComments />, path: '/admin/feedback/student-ai-feedback' },
            { id: 'editComments', labelKey: 'sidebar.editComments', icon: <FaEdit />, path: '/admin/feedback/edit' },
            { id: 'systemFeedback', labelKey: 'sidebar.systemFeedback', icon: <FaEnvelope />, path: '/admin/system-feedback' },
        ]
    },
    {
        id: 'reportsAndStatistics',
        labelKey: 'sidebar.reportsAndStatistics',
        icon: <FaChartBar />,
        children: [
            { id: 'overviewStatistics', labelKey: 'sidebar.overviewStatistics', icon: <FaChartBar />, path: '/admin/reports/overview' },
            { id: 'assignmentResultsStatistics', labelKey: 'sidebar.assignmentResultsStatistics', icon: <FaPollH />, path: '/admin/reports/assignment-results' },
            { id: 'studentProgress', labelKey: 'sidebar.studentProgress', icon: <FaRegListAlt />, path: '/admin/reports/student-progress' },
        ]
    },
    {
        id: 'systemConfiguration',
        labelKey: 'sidebar.systemConfiguration',
        icon: <MdOutlineSettings />,
        children: [
            { id: 'plantUMLConfiguration', labelKey: 'sidebar.plantUMLConfiguration', icon: <FaTools />, path: '/admin/settings/plantuml' },
            { id: 'aiAPIConfiguration', labelKey: 'sidebar.aiAPIConfiguration', icon: <FaTools />, path: '/admin/settings/ai-api' },
        ],
    },
];

interface SidebarProps {
    isCollapsed: boolean;
    className?: string; // Thêm prop className để nhận class từ parent
}

const Sidebar = forwardRef<HTMLDivElement, SidebarProps>(({ isCollapsed, className }, ref) => {
    const { t } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    const [openMenus, setOpenMenus] = useState<string[]>([]);
    const [isHovered, setIsHovered] = useState<boolean>(false);

    React.useEffect(() => {
        if (isCollapsed) {
            setOpenMenus([]);
        }
    }, [isCollapsed]);

    const isPathActive = (itemPath: string | undefined): boolean => {
        if (!itemPath) return false;
        return location.pathname === itemPath || location.pathname.startsWith(`${itemPath}/`);
    };

    const shouldItemBeActive = (item: SidebarItem): boolean => {
        if (item.path && isPathActive(item.path)) {
            return true;
        }
        if (item.children) {
            return item.children.some(child => shouldItemBeActive(child));
        }
        return false;
    };

    const handleMenuClick = (item: SidebarItem) => {
        const id = item.id;
        const hasChildren = item.children && item.children.length > 0;

        if (isCollapsed && hasChildren) {
            setOpenMenus(prevOpenMenus =>
                prevOpenMenus.includes(id)
                    ? prevOpenMenus.filter(menuId => menuId !== id)
                    : [...prevOpenMenus, id]
            );
            return;
        }

        if (hasChildren) {
            setOpenMenus(prevOpenMenus =>
                prevOpenMenus.includes(id)
                    ? prevOpenMenus.filter(menuId => menuId !== id)
                    : [...prevOpenMenus, id]
            );
        } else if (item.path) {
            navigate(item.path);
        }
    };

    const renderSidebarItems = (items: SidebarItem[]) => {
        return (
            <ul>
                {items.map(item => {
                    const hasChildren = item.children && item.children.length > 0;
                    const isOpen = openMenus.includes(item.id);
                    const isActive = shouldItemBeActive(item);

                    return (
                        <li key={item.id} className={`sidebar__item ${isActive ? 'active' : ''}`}>
                            <div
                                className='sidebar__item-header'
                                onClick={() => handleMenuClick(item)}
                                aria-expanded={hasChildren ? isOpen : undefined}
                                role="button"
                                tabIndex={0}
                            >
                                {item.icon && <span className='sidebar__item-icon'>{item.icon}</span>}
                                <span className='sidebar__item-label'>{t(item.labelKey)}</span>
                                {item.badge && (
                                    <span className={`sidebar__item-badge sidebar__item-badge--${item.type}`}>
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

                                        const content = (
                                            <>
                                                {child.icon && <span className='sidebar__item-icon'>{child.icon}</span>}
                                                <span className='sidebar__submenu-label'>{t(child.labelKey)}</span>
                                                {child.badge && (
                                                    <span className={`sidebar__item-badge sidebar__item-badge--${child.type}`}>
                                                        {child.badge}
                                                    </span>
                                                )}
                                                {hasGrandChildren && (
                                                    <span className='sidebar__item-toggle'>
                                                        {openMenus.includes(child.id) ? <IoIosArrowUp /> : <IoIosArrowDown />}
                                                    </span>
                                                )}
                                            </>
                                        );

                                        return (
                                            <li key={child.id} className={`sidebar__submenu-item ${isChildActive ? 'active' : ''}`}>
                                                {child.path ? (
                                                    <Link
                                                        to={child.path}
                                                        className='sidebar__submenu-link'
                                                        onClick={(e) => {
                                                            if (hasGrandChildren) {
                                                                e.preventDefault();
                                                                handleMenuClick(child);
                                                            }
                                                        }}
                                                        aria-expanded={hasGrandChildren ? openMenus.includes(child.id) : undefined}
                                                        role="link"
                                                        tabIndex={0}
                                                    >
                                                        {content}
                                                    </Link>
                                                ) : (
                                                    <div
                                                        className='sidebar__submenu-link'
                                                        onClick={() => handleMenuClick(child)}
                                                        aria-expanded={hasGrandChildren ? openMenus.includes(child.id) : undefined}
                                                        role="button"
                                                        tabIndex={0}
                                                    >
                                                        {content}
                                                    </div>
                                                )}

                                                {hasGrandChildren && openMenus.includes(child.id) && (
                                                    <ul className='sidebar__sub-submenu'>
                                                        {child.children!.map(grandchild => {
                                                            const isGrandChildActive = isPathActive(grandchild.path);

                                                            return (
                                                                <li key={grandchild.id} className={`sidebar__sub-submenu-item ${isGrandChildActive ? 'active' : ''}`}>
                                                                    <Link
                                                                        to={grandchild.path || '#'}
                                                                        className='sidebar__submenu-link'
                                                                        role="link"
                                                                        tabIndex={0}
                                                                    >
                                                                        {grandchild.icon && <span className='sidebar__item-icon'>{grandchild.icon}</span>}
                                                                        <span className='sidebar__submenu-label'>{t(grandchild.labelKey)}</span>
                                                                    </Link>
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
    };

    return (
        <div
            ref={ref}
            className={`sidebar ${isCollapsed ? 'sidebar__collapsed' : ''} ${isHovered ? 'sidebar__hovered' : ''} ${className || ''}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className='sidebar__logo'>
                <img src="/assets/images/defty.png" alt={t('sidebar.deftyLogoAlt')} className="sidebar__logo-image" />
                <span className="sidebar__logo-text">{t('login.defty')}</span>
            </div>

            <div className='sidebar__profile'>
                <img src="/assets/images/avatar.jpg" alt={t('sidebar.userAvatarAlt')} className="sidebar__profile-avatar" />
                <span className="sidebar__profile-name">{t('sidebar.userName')}</span>
            </div>

            <div className='sidebar__search'>
                <div className='sidebar__search--content'>
                    <input type='text' placeholder={t('sidebar.searchPlaceholder')} className='sidebar__search--content-input' />
                    <button className='sidebar__search--content-button'><FaSearch /></button>
                </div>
            </div>

            <div className='sidebar__content'>
                {renderSidebarItems(sidebarContentConfig)}
            </div>
        </div>
    );
});

export default Sidebar;