import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { FormField } from '../../template/ManagementTemplate/FormTemplate';
import FormTemplate from '../../template/ManagementTemplate/FormTemplate';
import { createUser, getUserById, updateUser } from '../../../shared/services/userService';
import { getRolesActive, type IRole } from '../../../shared/services/roleService';
import { useParams } from "react-router-dom";

const UserForm: React.FC = () => {
    const { t } = useTranslation();
    const [roles, setRoles] = useState<IRole[]>([]);
    const { id } = useParams<{ id?: string }>();
    const isEditMode = !!id;

    // Lấy danh sách role active
    useEffect(() => {
        async function fetchRoles() {
            try {
                const response = await getRolesActive();
                setRoles(response.roles);
            } catch (error) {
                console.error('Error fetching roles:', error);
            }
        }
        fetchRoles();
    }, [t]);

    const userFormFields = React.useMemo<FormField[]>(() => [
        { key: 'fullName', labelKey: 'userForm.fullNameLabel', type: 'text', placeholderKey: 'userForm.fullNamePlaceholder', required: true, gridSpan: 12 },
        { key: 'email', labelKey: 'userForm.emailLabel', type: 'text', placeholderKey: 'userForm.emailPlaceholder', required: true, gridSpan: 12 },
        { key: 'username', labelKey: 'userForm.usernameLabel', type: 'text', placeholderKey: 'userForm.usernamePlaceholder', required: true, gridSpan: 12 },
        { key: 'dob', labelKey: 'userForm.dobLabel', type: 'date', placeholderKey: 'userForm.dobPlaceholder', required: true, gridSpan: 12 },
        { key: 'userCode', labelKey: 'userForm.userCodeLabel', type: 'text', placeholderKey: 'userForm.userCodePlaceholder', required: true, gridSpan: 12 },
        {
            key: 'password',
            labelKey: 'userForm.passwordLabel',
            type: 'password',
            placeholderKey: 'userForm.passwordPlaceholder',
            gridSpan: 12,
            hideOnEdit: true,
            required: !isEditMode,
        },
        {
            key: 'roleId',
            labelKey: 'userForm.roleLabel',
            type: 'select',
            placeholderKey: 'userForm.rolePlaceholder',
            gridSpan: 12,
            required: true,
            options: roles.map(role => ({
                value: String(role.id),
                label: role.name
            })),
        },
    ], [roles, isEditMode]);

    const userValidationSchema = React.useMemo(() => {
        const validatePassword = (password: string): string | null => {
            if (!password) return t("login.passwordRequired");
            if (password.length < 8) return t("login.passwordMinLength");
            if (!/[a-z]/.test(password)) return t("login.passwordLowercase");
            if (!/[A-Z]/.test(password)) return t("login.passwordUppercase");
            if (!/[0-9]/.test(password)) return t("login.passwordNumber");
            if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return t("login.passwordSpecialChar");
            return null;
        };

        return {
            userCode: (value: string) => !value?.trim() ? t('userForm.validation.userCodeRequired') : null,
            dob: (value: string) => !value ? t('userForm.validation.dobLabelRequired') : null,
            fullName: (value: string) => !value?.trim() ? t('userForm.validation.fullNameRequired') : null,
            email: (value: string) => {
                if (!value?.trim()) return t('userForm.validation.emailRequired');
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return emailRegex.test(value) ? null : t('userForm.validation.emailInvalid');
            },
            username: (value: string) => !value?.trim() ? t('userForm.validation.usernameRequired') : null,
            password: (value: string) => validatePassword(value),
        };
    }, [t]);

    const breadcrumbItems = [
        { label: t('common.breadcrumb.home'), path: '/' },
        { label: t('common.breadcrumb.adminDashboard'), path: '/admin' },
        { label: t('userForm.breadcrumb'), path: '/admin/users' },
    ];

    // Transform dữ liệu user để fill form
    const transformUserData = (userData: any) => {
        if (!userData) return {};
        return {
            ...userData,
            roleId: userData.roles && userData.roles.length > 0 ? String(userData.roles[0].id) : '',
        };
    };

    // Hàm xử lý update user để gửi roleId mới
    const handleUpdateUser = async (userId: string, formData: any) => {
        const payload = { ...formData };
        if (payload.roleId) {
            payload.roles = [{ id: Number(payload.roleId) }];
            delete payload.roleId; // tránh gửi trùng
        }
        return updateUser(userId, payload);
    };

    return (
        <FormTemplate
            pageTitleKey="userForm.title"
            breadcrumbItems={breadcrumbItems}
            formFields={userFormFields}
            serviceGetById={async (id) => {
                const user = await getUserById(id);
                return transformUserData(user);
            }}
            serviceCreate={createUser}
            serviceUpdate={handleUpdateUser} // <-- dùng hàm custom
            validationSchema={userValidationSchema}
            redirectPath="/admin/users"
        />
    );
};

export default UserForm;
