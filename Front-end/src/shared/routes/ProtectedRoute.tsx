import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUserStore } from '../authentication/useUserStore';

interface ProtectedRouteProps {
    component: React.ComponentType<any>;
    requiredRoles?: string[];
    requiredAnyOfRoles?: string[];
    requiredPermission?: string;
    redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
                                                           component: Component,
                                                           requiredRoles,
                                                           requiredAnyOfRoles,
                                                           requiredPermission,
                                                           redirectTo = '/unauthorized',
                                                       }) => {
    debugger;
    const { user, isAuthenticated, isLoading, hasRole, hasAnyRole, hasPermission } = useUserStore();
    const PREFIX_URL_ADMIN: string = import.meta.env.VITE_PREFIX_URL_ADMIN || '/admin';

    if (isLoading) {
        return <div>Đang kiểm tra quyền truy cập...</div>;
    }

    if (!isAuthenticated || !user) {
        return <Navigate to={`${PREFIX_URL_ADMIN}/login`} replace />;
    }

    if (requiredRoles && requiredRoles.length > 0) {
        const userHasAllRequiredRoles = requiredRoles.every(role => hasRole(role));
        if (!userHasAllRequiredRoles) {
            return <Navigate to={redirectTo} replace />;
        }
    }

    if (requiredAnyOfRoles && requiredAnyOfRoles.length > 0) {
        const userHasAnyOfRoles = hasAnyRole(requiredAnyOfRoles);
        if (!userHasAnyOfRoles) {
            return <Navigate to={redirectTo} replace />;
        }
    }

    if (requiredPermission) {
        const userHasPermission = hasPermission(requiredPermission);
        if (!userHasPermission) {
            return <Navigate to={redirectTo} replace />;
        }
    }

    return <Component />;
};

export default ProtectedRoute;