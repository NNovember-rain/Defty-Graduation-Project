import React from "react";
import {Navigate} from "react-router-dom";
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
import TestNotification from "../../shared/notification/TestNotification.tsx";
import RoleForm from "../pages/Role/roleForm.tsx";
import PermissionForm from "../pages/Permission/permissionForm.tsx";
import ClassManagement from "../pages/ClassManagement";
import classForm from "../pages/ClassManagement/classForm.tsx";
import Submission from "../pages/Submission";
import SubmissionForm from "../pages/Submission";
import UserForm from "../pages/User/userForm.tsx";
import Assignment from "../pages/Assignment";
import TypeUml from "../pages/TypeUml";
import TypeUMlForm from "../pages/TypeUml/typeUmlForm.tsx";
import ClassDetailPage from "../pages/ClassManagement/ClassDetailPage.tsx";
import AssignmentDetail from "../pages/ClassManagement/tab/Assignment/AssignmentDetail.tsx";
import AssignmentForm from "../pages/Assignment/assignmentForm.tsx";
import SubmissionDetail from "../pages/Submission/SubmissionDetail.tsx";
import StudentAssignmentManagerAntD from "../pages/ClassManagement/tab/Assignment/StudentAssignmentManagerAntD.tsx";


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
        requiredAnyOfRoles: ['admin'],
    },
    {
        path: 'users',
        component: User,
        requiredAnyOfRoles: ['admin'],
    },
    {
        path: 'users/create',
        component: UserForm,
        requiredAnyOfRoles: ['admin'],
    },
    {
        path: 'users/update/:id',
        component: UserForm,
        requiredAnyOfRoles: ['admin'],
    },
    {
        path: 'auth/roles',
        component: Role,
        requiredAnyOfRoles: ['admin'],
    },
    {
        path: 'auth/roles/create',
        component: RoleForm,
        requiredAnyOfRoles: ['admin'],
    },
    {
        path: 'auth/roles/update/:id',
        component: RoleForm,
        requiredAnyOfRoles: ['admin'],
    },
    {
        path: 'auth/permissions',
        component: Permission,
        requiredAnyOfRoles: ['admin'],
    },
    {
        path: 'auth/permissions/create',
        component: PermissionForm,
        requiredAnyOfRoles: ['admin'],
    },
    {
        path: 'auth/permissions/update/:id',
        component: PermissionForm,
        requiredAnyOfRoles: ['admin'],
    },
    {
        path: 'class/list',
        component: ClassManagement,
        requiredAnyOfRoles: ['admin', 'teacher'],
    },
    {
        path: 'class/categories',
        component: ClassManagement,
        requiredAnyOfRoles: ['admin'],
    },
    {
        path: 'class/reports',
        component: ClassManagement,
        requiredAnyOfRoles: ['admin', 'teacher'],
    },
    {
        path: 'class/settings',
        component: ClassManagement,
        requiredAnyOfRoles: ['admin'],
    },
    {
        path: 'class/create',
        component: classForm,
        requiredAnyOfRoles: ['admin', 'teacher'],
    },
    {
        path: 'class/update/:id',
        component: classForm,
        requiredAnyOfRoles: ['admin', 'teacher'],
    },
    {
        path: 'class/assignment/:id',
        component: AssignmentDetail,
        requiredAnyOfRoles: ['admin', 'teacher'],
    },
    {
        path: 'class/:classId/assignment/:assignmentId/detail',
        component: StudentAssignmentManagerAntD,
        requiredAnyOfRoles: ['admin', 'teacher'],
    },
    {
        path: 'assignments/:submissionId/details',
        component: SubmissionDetail,
        requiredAnyOfRoles: ['admin', 'teacher'],
    },
    {
        path: 'content/assignments',
        component: Assignment,
        requiredAnyOfRoles: ['admin', 'teacher'],
    },
    {
        path: 'content/assignments/create',
        component: AssignmentForm,
        requiredAnyOfRoles: ['admin', 'teacher'],
    },
    {
        path: 'content/assignments/update/:id',
        component: AssignmentForm,
        requiredAnyOfRoles: ['admin', 'teacher'],
    },
    {
        path: 'content/type-uml',
        component: TypeUml,
        requiredAnyOfRoles: ['admin', 'teacher'],
    },
    {
        path: 'class/view/:id',
        component: ClassDetailPage,
        requiredAnyOfRoles: ['admin', 'teacher'],
    },
    {
        path: 'content/type-uml/create',
        component: TypeUMlForm,
        requiredAnyOfRoles: ['admin', 'teacher'],
    },
    {
        path: 'content/type-uml/update/:id',
        component: TypeUMlForm,
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
        path: 'test/notification',
        component: TestNotification,
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
    {
        path: 'submissions',
        component: Submission,
        requiredAnyOfRoles: ['admin', 'teacher'],
    },
    {
        path: 'submissions/create',
        component: SubmissionForm,
        requiredAnyOfRoles: ['admin', 'teacher'],
    },
    {
        path: "/admin/submissions/detail/:id",
        component: SubmissionDetail,
        requiredAnyOfRoles: ['admin', 'teacher'],
    }
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