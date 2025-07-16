import React from "react";
import { Navigate } from "react-router-dom";
import AdminLayoutDefault from "../layouts/AdminLayoutDefault";
import AdminAuthLayout from "../layouts/AdminAuthLayout";
import ProtectedRoute from "../../shared/routes/ProtectedRoute";
import UnauthorizedPage from "../../shared/routes/UnauthorizedPage";
import LoginPage from "../pages/Login";
import DashboardPage from "../pages/Dashboard";
import User from "../pages/User";
import Role from "../pages/Role";
import Permission from "../pages/Permission";
import Prompt from "../pages/Prompt";
import PromptForm from "../pages/Prompt/promptForm.tsx";

interface AppRoute {
    path: string;
    component: React.ComponentType<any>;
    requiredRoles?: string[];
    requiredAnyOfRoles?: string[];
    requiredPermission?: string;
}

interface ChildRouteEntry {
    path: string;
    element: React.ReactElement;
}

interface AdminRoutesResult {
    path: string;
    element: React.ReactElement;
    children: ChildRouteEntry[];
}

const PREFIX_URL_ADMIN: string = import.meta.env.VITE_PREFIX_URL_ADMIN || '/admin';

const AuthRoutesConfig: AppRoute[] = [
    {
        path: 'login',
        component: LoginPage,
    },
    {
        path: '',
        component: LoginPage,
    },
    {
        path: '*',
        component: LoginPage,
    },
];

const ProtectedAdminRoutesConfig: AppRoute[] = [
    {
        path: 'dashboard',
        component: DashboardPage,
        requiredAnyOfRoles: ['admin', 'teacher'],
    },
    {
        path: 'users',
        component: User,
        requiredAnyOfRoles: ['admin', 'teacher'],
    },
    {
        path: 'roles',
        component: Role,
        requiredAnyOfRoles: ['admin', 'teacher'],
    },
    {
        path: 'permissions',
        component: Permission,
        requiredAnyOfRoles: ['admin', 'teacher'],
    },
    {
        path: 'settings/prompts',
        component: Prompt,
        requiredAnyOfRoles: ['admin'],
    },
    {
        path: 'settings/prompts/create',
        component: PromptForm,
        requiredAnyOfRoles: ['admin'],
    },
    {
        path: 'settings/prompts/update/:id',
        component: PromptForm,
        requiredAnyOfRoles: ['admin'],
    },
    {
        path: '',
        component: DashboardPage,
        requiredAnyOfRoles: ['admin', 'teacher'],
    },
    {
        path: '*',
        component: DashboardPage,
        requiredAnyOfRoles: ['admin', 'teacher'],
    },
];

function getAdminRoutes(isAuthenticated: boolean): AdminRoutesResult {
    if (isAuthenticated) {
        const protectedRoutes: ChildRouteEntry[] = ProtectedAdminRoutesConfig.map(route => ({
            path: route.path,
            element: (
                <ProtectedRoute
                    component={route.component}
                    requiredRoles={route.requiredRoles}
                    requiredAnyOfRoles={route.requiredAnyOfRoles}
                    requiredPermission={route.requiredPermission}
                    redirectTo={`${PREFIX_URL_ADMIN}/unauthorized`}
                />
            ),
        }));

        const additionalRoutes: ChildRouteEntry[] = [
            {
                path: 'unauthorized',
                element: <UnauthorizedPage />,
            },
            {
                path: '*',
                element: <Navigate to={`${PREFIX_URL_ADMIN}/dashboard`} replace />,
            },
        ];

        return {
            path: PREFIX_URL_ADMIN,
            element: <AdminLayoutDefault />,
            children: [...protectedRoutes, ...additionalRoutes],
        };
    } else {
        const authRoutes: ChildRouteEntry[] = AuthRoutesConfig.map(route => ({
            path: route.path,
            element: <route.component />,
        }));

        return {
            path: PREFIX_URL_ADMIN,
            element: <AdminAuthLayout />,
            children: authRoutes,
        };
    }
}

export default getAdminRoutes;