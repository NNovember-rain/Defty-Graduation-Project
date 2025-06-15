import React, { useEffect } from 'react';
import { useRoutes, Navigate } from 'react-router-dom';
import { useUserStore } from '../authentication/useUserStore';
import getAdminRoutes from '../../admin/routes';
import getClientRoutes from '../../client/routes';
import UnauthorizedPage from './UnauthorizedPage';
import { getCurrentAccount } from '../services/authService';

const RoutesConfig: React.FC = () => {
    const { setUser, clearUser, setLoading, setError, isAuthenticated, isLoading } = useUserStore();

    useEffect(() => {
        const initializeSession = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await getCurrentAccount();

                if (response.ok) {
                    const result = await response.json();
                    if (result && result.user) {
                        const userData = {
                            id: result.user.id,
                            username: result.user.username,
                            email: result.user.email,
                            firstName: result.user.firstName,
                            lastName: result.user.lastName,
                            roles: result.user.roles || []
                        };
                        setUser(userData);
                    } else {
                        clearUser();
                    }
                } else {
                    console.error("API error during session initialization:", response.status, response.statusText);
                    setError(`Lỗi xác thực: ${response.status} - ${response.statusText}`);
                    clearUser();
                }
            } catch (err: any) {
                console.error("Failed to initialize session (network/refresh error):", err);
                setError("Không thể khôi phục phiên. Vui lòng đăng nhập lại.");
                clearUser();
            } finally {
                setLoading(false);
            }
        };

        initializeSession();
    }, [setUser, clearUser, setLoading, setError]);

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '24px' }}>
                Đang tải dữ liệu người dùng...
            </div>
        );
    }

    const routes = [
        getAdminRoutes(isAuthenticated),
        getClientRoutes(isAuthenticated),
        { path: '/unauthorized', element: <UnauthorizedPage /> },
        { path: '*', element: <Navigate to="/" replace /> }
    ];

    return useRoutes(routes);
};

export default RoutesConfig;