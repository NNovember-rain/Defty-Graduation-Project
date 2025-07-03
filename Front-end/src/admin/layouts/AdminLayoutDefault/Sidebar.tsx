// Sidebar.tsx
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom'; // Import useLocation
import { FaSearch, FaRegCalendarAlt, FaTh, FaEnvelope, FaChartBar, FaTable, FaFileAlt } from 'react-icons/fa';
import { MdDashboard, MdWidgets, MdOutlineSettings } from 'react-icons/md';
import { LuGalleryHorizontal } from 'react-icons/lu';
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io'; // Import icons for expand/collapse


interface SidebarItem {
    id: string;
    label: string;
    icon?: React.ReactNode;
    path?: string;
    children?: SidebarItem[];
    badge?: string;
    type?: 'new' | 'info';
}

const sidebarContent: SidebarItem[] = [
    {
        id: 'search',
        label: 'Search',
        icon: <FaSearch />,
        path: '/search' // Example path for items without children
    },
    {
        id: 'dashboard',
        label: 'Dashboard',
        icon: <MdDashboard />,
        children: [
            { id: 'dashboard-v1', label: 'Dashboard v1', path: '/dashboard/v1' },
            { id: 'dashboard-v2', label: 'Dashboard v2', path: '/dashboard/v2' },
            { id: 'dashboard-v3', label: 'Dashboard v3', path: '/dashboard/v3' },
        ],
    },
    {
        id: 'widgets',
        label: 'Widgets',
        icon: <MdWidgets />,
        badge: 'New',
        type: 'new',
        path: '/widgets' // Example path
    },
    {
        id: 'layout-options',
        label: 'Layout Options',
        icon: <MdOutlineSettings />,
        badge: '9',
        type: 'info',
        children: [
            { id: 'top-nav', label: 'Top Navigation', path: '/layout/top-nav' },
            { id: 'boxed', label: 'Boxed', path: '/layout/boxed' },
        ],
    },
    {
        id: 'ui-elements',
        label: 'UI Elements',
        icon: <FaTh />,
        children: [
            { id: 'general', label: 'General', path: '/ui/general' },
            { id: 'icons', label: 'Icons', path: '/ui/icons' },
        ],
    },
    {
        id: 'forms',
        label: 'Forms',
        icon: <FaFileAlt />,
        children: [
            { id: 'general-forms', label: 'General Elements', path: '/forms/general' },
            { id: 'advanced-forms', label: 'Advanced Elements', path: '/forms/advanced' },
        ],
    },
    {
        id: 'tables',
        label: 'Tables',
        icon: <FaTable />,
        children: [
            { id: 'simple-tables', label: 'Simple Tables', path: '/tables/simple' },
            { id: 'data-tables', label: 'DataTables', path: '/tables/data' },
        ],
    },
    {
        id: 'charts',
        label: 'Charts',
        icon: <FaChartBar />,
        children: [
            { id: 'chartjs', label: 'ChartJS', path: '/charts/chartjs' },
            { id: 'flot', label: 'Flot', path: '/charts/flot' },
        ],
    },
    {
        id: 'examples',
        label: 'Examples',
        children: [
            { id: 'calendar', label: 'Calendar', icon: <FaRegCalendarAlt />, badge: '2', type: 'info', path: '/examples/calendar' },
            { id: 'gallery', label: 'Gallery', icon: <LuGalleryHorizontal />, path: '/examples/gallery' },
            { id: 'kanban-board', label: 'Kanban Board', icon: <FaTh />, path: '/examples/kanban' },
            { id: 'mailbox', label: 'Mailbox', icon: <FaEnvelope />, path: '/examples/mailbox' },
        ],
    },
    {
        id: 'pages',
        label: 'Pages',
        path: '/pages' // Example path
    },
    {
        id: 'extras',
        label: 'Extras',
        path: '/extras' // Example path
    },
    {
        id: 'search-example',
        label: 'Search',
        icon: <FaSearch />,
        path: '/search-example' // Example path
    },
];

const Sidebar: React.FC = () => {
    const location = useLocation(); // Get current location
    const [openMenus, setOpenMenus] = useState<string[]>([]); // State to manage open menus

    const handleMenuClick = (id: string, hasChildren: boolean) => {
        if (hasChildren) {
            setOpenMenus(prevOpenMenus =>
                prevOpenMenus.includes(id)
                    ? prevOpenMenus.filter(menuId => menuId !== id)
                    : [...prevOpenMenus, id]
            );
        }
        // If no children, navigation will be handled by Link component
    };

    const renderSidebarItems = (items: SidebarItem[]) => {
        return (
            <ul>
                {items.map(item => {
                    const hasChildren = item.children && item.children.length > 0;
                    const isOpen = openMenus.includes(item.id);
                    // @ts-ignore
                    const isActive = item.path === location.pathname || (hasChildren && item.children.some(child => child.path === location.pathname));

                    return (
                        <li key={item.id} className={`sidebar__item ${isActive ? 'active' : ''}`}>
                            <div className='sidebar__item-header' onClick={() => handleMenuClick(item.id, hasChildren)}>
                                {item.icon && <span className='sidebar__item-icon'>{item.icon}</span>}
                                <span className='sidebar__item-label'>{item.label}</span>
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
                                        const isChildActive = child.path === location.pathname;
                                        return (
                                            <li key={child.id} className={`sidebar__submenu-item ${isChildActive ? 'active' : ''}`}>
                                                {child.icon && <span className='sidebar__item-icon'>{child.icon}</span>}
                                                <span className='sidebar__submenu-label'>{child.label}</span>
                                                {child.badge && (
                                                    <span className={`sidebar__item-badge sidebar__item-badge--${child.type}`}>
                                                        {child.badge}
                                                    </span>
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
        <div className='sidebar'>
            <div className='sidebar__logo'>
                <img src="/assets/images/defty.png" alt="AdminLTE Logo" className="sidebar__logo-image" />
                <span className="sidebar__logo-text">ADMINLTE 3</span>
            </div>

            <div className='sidebar__profile'>
                <img src="/assets/images/avatar.jpg" alt="User Avatar" className="sidebar__profile-avatar" />
                <span className="sidebar__profile-name">Alexander Pierce</span>
            </div>

            <div className='sidebar__search'>
                <input type='text' placeholder='Search' className='sidebar__search-input' />
                <button className='sidebar__search-button'><FaSearch /></button>
            </div>

            <div className='sidebar__content'>
                {renderSidebarItems(sidebarContent)}
            </div>
        </div>
    );
};

export default Sidebar;