// index.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from "./Sidebar.tsx";
import Header from "./Header.tsx";
import "./AdminLayoutDefault.scss";

const AdminLayoutDefault: React.FC = () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
    const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 992);

    const sidebarRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 992);
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    useEffect(() => {
        if (isMobile) {
            setIsSidebarCollapsed(false); // Không cần collapsed trên mobile
            setIsMobileSidebarOpen(false); // Đóng sidebar mobile khi chuyển sang mobile
        } else {
            setIsSidebarCollapsed(false); // Reset collapsed state
            setIsMobileSidebarOpen(false); // Reset mobile sidebar state
        }
    }, [isMobile]);

    const toggleSidebar = () => {
        if (isMobile) {
            setIsMobileSidebarOpen(prevState => {
                const newState = !prevState;
                return newState;
            });
        } else {
            setIsSidebarCollapsed(prevState => !prevState);
        }
    };

    const closeMobileSidebar = () => {
        if (isMobile && isMobileSidebarOpen) {
            setIsMobileSidebarOpen(false);
        }
    };

    // Use a global click listener for closing the sidebar
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const clickedElement = event.target as Node;
            const isClickInsideSidebar = sidebarRef.current && sidebarRef.current.contains(clickedElement);
            const isClickInsideHeader = headerRef.current && headerRef.current.contains(clickedElement);

            if (isMobile && isMobileSidebarOpen) {
                if (!isClickInsideSidebar && !isClickInsideHeader) {
                    closeMobileSidebar();
                }
            }
        };

        // Add event listener to the document
        document.addEventListener('click', handleClickOutside);

        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [isMobileSidebarOpen, isMobile]);

    return (
        <div
            className={`admin-layout-default ${isSidebarCollapsed ? 'sidebar-collapsed' : ''} ${isMobileSidebarOpen ? 'sidebar-open-mobile-overlay' : ''}`}
        >
            <Sidebar
                isCollapsed={isMobile ? false : isSidebarCollapsed}
                ref={sidebarRef}
                className={isMobile && isMobileSidebarOpen ? 'sidebar__open-mobile' : ''}
            />
            {isMobile && isMobileSidebarOpen && <div className="overlay" onClick={closeMobileSidebar}></div>}
            <div className={`right-block ${isSidebarCollapsed ? 'right-block-collapsed' : ''}`}>
                <Header onToggleSidebar={toggleSidebar} ref={headerRef} />
                <div className='main-content'>
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default AdminLayoutDefault;