import React from 'react';
import { Outlet } from 'react-router-dom';

const AdminLayoutDefault: React.FC = () => {
    return (
        <>
            <Outlet />
        </>
    );
};

export default AdminLayoutDefault;