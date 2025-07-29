import React from 'react';
import {useTranslation} from 'react-i18next';
import type {FormField} from '../../template/ManagementTemplate/FormTemplate';
import FormTemplate from '../../template/ManagementTemplate/FormTemplate';
import {createRole, getRoleById, type IRole, updateRole} from "../../../shared/services/roleService.ts";

const RoleForm: React.FC = () => {
    const { t } = useTranslation();

    const roleFormFields: FormField[] = React.useMemo(() => [
        {
            key: 'name',
            labelKey: 'roleForm.nameLabel',
            type: 'text',
            placeholderKey: 'roleForm.namePlaceholder',
            required: true,
            gridSpan: 24,
        },
        {
            key: 'description',
            labelKey: 'roleForm.descriptionLabel',
            type: 'textarea',
            placeholderKey: 'roleForm.descriptionPlaceholder',
            gridSpan: 24,
        },
        {
            key: 'permissions',
            labelKey: 'roleForm.permissionsLabel',
            type: 'duallistbox',
            required: true,
            gridSpan: 24,
        },
    ], []);

    const roleValidationSchema = React.useMemo(() => ({
        name: (value: string, t: (key: string) => string) => {
            if (!value?.trim()) return t('roleForm.validation.nameRequired');
            return null;
        },
        type: (value: 'system' | 'user' | 'template', t: (key: string) => string) => {
            if (!value) return t('roleForm.validation.typeRequired');
            return null;
        },
        version: (value: string, t: (key: string) => string) => {
            if (!value?.trim()) return t('roleForm.validation.versionRequired');
            return null;
        },
        permissions: (value: string[] | undefined, t: (key: string) => string) => {
            if (!value || value.length === 0) {
                return t('roleForm.validation.permissionsRequired');
            }
            return null;
        }
    }), []);


    const breadcrumbItems = [
        { label: t('common.breadcrumb.home'), path: '/' },
        { label: t('common.breadcrumb.adminDashboard'), path: '/admin' },
        { label: t('rolePage.breadcrumb'), path: '/admin/auth/roles' },
    ];

    return (
        <FormTemplate<IRole>
            pageTitleKey="roleForm.title"
            breadcrumbItems={breadcrumbItems}
            formFields={roleFormFields}
            serviceGetById={getRoleById}
            serviceCreate={createRole}
            serviceUpdate={updateRole}
            validationSchema={roleValidationSchema}
            redirectPath="/admin/auth/roles"
        />
    );
};

export default RoleForm;