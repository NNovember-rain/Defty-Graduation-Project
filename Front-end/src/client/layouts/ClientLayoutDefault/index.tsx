import React from 'react';
import { Outlet } from 'react-router-dom';

const ClientLayoutDefault: React.FC = () => {
    return (
        <>
            <Outlet />
        </>
    );
};

export default ClientLayoutDefault;