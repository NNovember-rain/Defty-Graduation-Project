import React from 'react';
import { Link } from 'react-router-dom';

const UnauthorizedPage: React.FC = () => {
    return (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <h1>403 - Truy cập Bị Từ Chối</h1>
            <p>Bạn không có quyền để xem trang này.</p>
            <Link to={``}>Về trang chủ</Link>
        </div>
    );
};

export default UnauthorizedPage;