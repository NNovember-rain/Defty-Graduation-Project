import React from "react";
import { Navigate } from "react-router-dom";
import ClientLayoutDefault from "../layouts/ClientLayoutDefault";
import ClientAuthLayout from "../layouts/ClientAuthLayout";
import ProtectedRoute from "../../shared/routes/ProtectedRoute";
import Login from "../pages/Login";
import Home from "../pages/Home";
import UnauthorizedPage from "../../shared/routes/UnauthorizedPage.tsx";
import ProblemDetail from "../pages/ProblemDetail";

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

interface RoutesConfigResult {
    path: string;
    element: React.ReactElement;
    children: ChildRouteEntry[];
}

const ClientAuthRoutesConfig: AppRoute[] = [
    {
        path: 'login',
        component: Login,
    },
    {
        path: '*',
        component: Login,
    },
];

const ProtectedClientRoutesConfig: AppRoute[] = [
    {
        path: '/problem/:slug',
        component: ProblemDetail
    },
    {
        path: '',
        component: Home
    },
    {
        path: '*',
        component: Home,
    },
];

function getClientRoutes(isAuthenticated: boolean): RoutesConfigResult {
    if (isAuthenticated) {
        const protectedRoutes: ChildRouteEntry[] = ProtectedClientRoutesConfig.map(route => ({
            path: route.path,
            element: (
                <ProtectedRoute
                    component={route.component}
                    requiredRoles={route.requiredRoles}
                    requiredAnyOfRoles={route.requiredAnyOfRoles}
                    requiredPermission={route.requiredPermission}
                    redirectTo={`/unauthorized`}
                />
            ),
        }));

        const authenticatedOnlyRoutes: ChildRouteEntry[] = [
            {
                path: 'unauthorized',
                element: <UnauthorizedPage />,
            },
            {
                path: '*',
                element: <Navigate to={``} replace />,
            },
            {
                path: '',
                element: <Navigate to={``} replace />,
            }
        ];

        return {
            path: '',
            element: <ClientLayoutDefault />,
            children: [...protectedRoutes, ...authenticatedOnlyRoutes],
        };
    } else {
        const authRoutes: ChildRouteEntry[] = ClientAuthRoutesConfig.map(route => ({
            path: route.path,
            element: <route.component />,
        }));

        return {
            path: '',
            element: <ClientAuthLayout />,
            children: authRoutes,
        };
    }
}

export default getClientRoutes;