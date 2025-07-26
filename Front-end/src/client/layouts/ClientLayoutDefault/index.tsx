import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from "./Header.tsx";
import "./ClientLayoutDefault.scss";

const ClientLayoutDefault: React.FC = () => {
    return (
        <>
            <Header/>
            <div className="outlet-container">
                <Outlet />
            </div>
        </>
    );
};

export default ClientLayoutDefault;