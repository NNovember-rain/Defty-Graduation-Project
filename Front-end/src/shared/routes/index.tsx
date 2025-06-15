import React, { useEffect } from 'react';
import { useRoutes, Navigate } from 'react-router-dom';
import { useUserStore } from '../authentication/useUserStore';
import getAdminRoutes from '../../admin/routes';
import UnauthorizedPage from "./UnauthorizedPage.tsx";
import getClientRoutes from "../../client/routes";

const RoutesConfig: React.FC = () => {
    const { setUser, clearUser, setLoading, setError, isAuthenticated, isLoading } = useUserStore();

    useEffect(() => {
        const initializeSession = async () => {
            setLoading(true);
            setError(null);
            try {
                const storedAuthData = localStorage.getItem('myAuthData');
                if (storedAuthData) {
                    const authData = JSON.parse(storedAuthData);
                    await new Promise(resolve => setTimeout(resolve, 500));

                    // Dữ liệu người dùng mẫu (vai trò và quyền hạn sẽ đến từ Backend)
                    const demoUser = {
                        id: authData.user.id,
                        username: authData.user.username,
                        email: authData.user.email,
                        firstName: authData.user.firstName,
                        lastName: authData.user.lastName,
                        roles: authData.user.roles || [] // Cần đảm bảo cấu trúc này khớp với ProfileUser trong userStore
                    };
                    setUser(demoUser);
                } else {
                    clearUser();
                }
            } catch (err: any) {
                console.error("Failed to initialize session:", err);
                setError("Không thể khôi phục phiên. Vui lòng đăng nhập lại.");
                clearUser();
            } finally {
                setLoading(false);
            }
        };

        initializeSession();
    }, [setUser, clearUser, setLoading, setError]);

    // Hiển thị trạng thái loading toàn cục trong khi xác thực phiên
    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '24px' }}>
                Đang tải dữ liệu người dùng...
            </div>
        );
    }

    // Kết hợp các routes từ Admin và Client
    const routes = [
        getAdminRoutes(isAuthenticated), // Truyền isAuthenticated cho AdminRoutes
        getClientRoutes(isAuthenticated), // Truyền isAuthenticated cho ClientRoutes
        { path: '/unauthorized', element: <UnauthorizedPage /> }, // Trang lỗi 403 chung
        { path: '*', element: <Navigate to="/" replace /> } // Catch-all cho các route không khớp
];

    return useRoutes(routes);
};

export default RoutesConfig;