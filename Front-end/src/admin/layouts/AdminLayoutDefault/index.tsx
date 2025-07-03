import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from "./Sidebar.tsx";
import Header from "./Header.tsx";
import "./AdminLayoutDefault.scss";

const AdminLayoutDefault: React.FC = () => {
    return (
        <div className='admin-layout-default'>
            <Sidebar/>
            <div className='right-block'>
                <Header/>
                <div className='main-content'>
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default AdminLayoutDefault;