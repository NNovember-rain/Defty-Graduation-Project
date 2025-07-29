import React from 'react';
import {useTranslation} from 'react-i18next';
import type {FormField} from '../../template/ManagementTemplate/FormTemplate';
import FormTemplate from '../../template/ManagementTemplate/FormTemplate';
import {
    createPermission,
    getPermissionById,
    type IPermission,
    updatePermission
} from "../../../shared/services/permissionService.ts";

const PermissionForm: React.FC = () => {
    const { t } = useTranslation();

    const permissionFormFields: FormField[] = React.useMemo(() => [
        {
            key: 'name',
            labelKey: 'permissionForm.nameLabel',
            type: 'text',
            placeholderKey: 'permissionForm.namePlaceholder',
            required: true,
            gridSpan: 24,
        },
        {
            key: 'description',
            labelKey: 'permissionForm.descriptionLabel',
            type: 'textarea',
            placeholderKey: 'permissionForm.descriptionPlaceholder',
            gridSpan: 24,
        },
    ], []);

    const permissionValidationSchema = React.useMemo(() => ({
        name: (value: string, t: (key: string) => string) => {
            if (!value?.trim()) return t('permissionForm.validation.nameRequired');
            const pattern = /^[a-z]+(\.[a-z]+)+$/;
            if (!pattern.test(value)) {
                return t('permissionForm.validation.nameInvalid');
            }
            return null;
        },
    }), []);


    const breadcrumbItems = [
        { label: t('common.breadcrumb.home'), path: '/' },
        { label: t('common.breadcrumb.adminDashboard'), path: '/admin' },
        { label: t('permissionPage.breadcrumb'), path: '/admin/auth/permissions' },
    ];

    return (
        <FormTemplate<IPermission>
            pageTitleKey="permissionForm.title"
            breadcrumbItems={breadcrumbItems}
            formFields={permissionFormFields}
            serviceGetById={getPermissionById}
            serviceCreate={createPermission}
            serviceUpdate={updatePermission}
            validationSchema={permissionValidationSchema}
            redirectPath="/admin/auth/permissions"
        />
    );
};

export default PermissionForm;