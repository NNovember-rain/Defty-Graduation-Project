import React, { useEffect } from 'react';
import { useRoutes, Navigate } from 'react-router-dom';
import {type UserProfile, useUserStore} from '../authentication/useUserStore';
import getAdminRoutes from '../../admin/routes';
import getClientRoutes from '../../client/routes';
import UnauthorizedPage from './UnauthorizedPage';
import { getCurrentAccount } from '../services/authService';
import { useTranslation } from 'react-i18next';

const RoutesConfig: React.FC = () => {
    const { setUser, clearUser, setLoading, setError, isAuthenticated, isLoading } = useUserStore();
    const { t } = useTranslation();

    useEffect(() => {
        const initializeSession = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await getCurrentAccount();

                if (response.ok) {
                    const result = await response.json();
                    if (result.code === 200 && result.result) {
                        const userData: UserProfile = {
                            id: result.result.id,
                            username: result.result.username,
                            email: result.result.email,
                            firstName: result.result.firstName,
                            lastName: result.result.lastName,
                            dob: result.result.dob,
                            roles: result.result.roles || []
                        };
                        setUser(userData);
                    } else {
                        clearUser();
                    }
                } else {
                    console.error("API error during session initialization:", response.status, response.statusText);
                    setError(t('routesConfig.authError', { status: response.status, statusText: response.statusText }));
                    clearUser();
                }
            } catch (err: any) {
                console.error("Failed to initialize session (network/refresh error):", err);
                setError(t('routesConfig.sessionRestoreError'));
                clearUser();
            } finally {
                setLoading(false);
            }
        };

        initializeSession();
    }, []);

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '24px' }}>
                {t('routesConfig.loadingUserData')}
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