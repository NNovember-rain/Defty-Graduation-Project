import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { FormField } from '../../template/ManagementTemplate/FormTemplate';
import FormTemplate from '../../template/ManagementTemplate/FormTemplate';
import { createUser, getUserById, updateUser } from '../../../shared/services/userService';
import { getRoles, type IRole } from '../../../shared/services/roleService';
import { useNotification } from "../../../shared/notification/useNotification.ts";
import {useParams} from "react-router-dom";

const UserForm: React.FC = () => {
    const { t } = useTranslation();
    const { message } = useNotification();
    const [roles, setRoles] = useState<IRole[]>([]);
    const { id } = useParams<{ id?: string }>();
    const isEditMode = !!id;
    console.log('UserForm mode:', isEditMode ? 'Edit' : 'Create');

    useEffect(() => {
        async function fetchRoles() {
            try {
                const response = await getRoles();
                const rolesArray = Array.isArray(response.roles) ? response.roles : [];
                setRoles(rolesArray);
            } catch (error) {
                console.error('Error fetching roles:', error);
                message.error(t('common.errorFetchingData'));
            }
        }
        fetchRoles();
    }, [t]);

    // Tạo form fields
    const userFormFields: FormField[] = [
        { key: 'fullName', labelKey: 'userForm.fullNameLabel', type: 'text', placeholderKey: 'userForm.fullNamePlaceholder', required: true, gridSpan: 12 },
        { key: 'email', labelKey: 'userForm.emailLabel', type: 'text', placeholderKey: 'userForm.emailPlaceholder', required: true, gridSpan: 12 },
        { key: 'username', labelKey: 'userForm.usernameLabel', type: 'text', placeholderKey: 'userForm.usernamePlaceholder', required: true, gridSpan: 12 },
        { key: 'dob', labelKey: 'userForm.dobLabel', type: 'date', placeholderKey: 'userForm.dobPlaceholder', required: true, gridSpan: 12 },
        { key: 'userCode', labelKey: 'userForm.userCodeLabel', type: 'text', placeholderKey: 'userForm.userCodePlaceholder', required: true, gridSpan: 12 },
        { key: 'password',
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
            options: roles.map(role => ({ value: String(role.id), labelKey: role.name })),
        },
    ];

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

    // --- Tùy chỉnh formData trước khi render FormTemplate ---
    const transformUserData = (userData: any) => {
        if (!userData) return {};
        return {
            ...userData,
            roleId: userData.roles && userData.roles.length > 0 ? String(userData.roles[0].id) : '',
        };
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
            serviceUpdate={updateUser}
            validationSchema={userValidationSchema}
            redirectPath="/admin/users"
        />
    );
};

export default UserForm;
