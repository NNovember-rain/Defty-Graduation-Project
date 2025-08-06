import React from 'react';
import {useTranslation} from 'react-i18next';
import type {FormField} from '../../template/ManagementTemplate/FormTemplate';
import FormTemplate from '../../template/ManagementTemplate/FormTemplate';
import {getUserById, type IUser, updateUser} from "../../../shared/services/userService.ts";

const UserForm: React.FC = () => {
    const { t } = useTranslation();

    const userFormFields: FormField[] = React.useMemo(() => [
        {
            key: 'name',
            labelKey: 'userForm.nameLabel',
            type: 'text',
            placeholderKey: 'userForm.namePlaceholder',
            required: true,
            gridSpan: 24,
        },
        {
            key: 'description',
            labelKey: 'userForm.descriptionLabel',
            type: 'textarea',
            placeholderKey: 'userForm.descriptionPlaceholder',
            gridSpan: 24,
        },
    ], []);

    // const userValidationSchema = React.useMemo(() => ({
    //     name: (value: string, t: (key: string) => string) => {
    //         if (!value?.trim()) return t('userForm.validation.nameRequired');
    //         return null;
    //     },
    // }), []);


    const breadcrumbItems = [
        { label: t('common.breadcrumb.home'), path: '/' },
        { label: t('common.breadcrumb.adminDashboard'), path: '/admin' },
        { label: t('userForm.breadcrumb'), path: '/admin/users' },
    ];

    return (
        <FormTemplate<IUser>
            pageTitleKey="userForm.title"
            breadcrumbItems={breadcrumbItems}
            formFields={userFormFields}
            serviceGetById={getUserById}
            // serviceCreate={createUser}
            serviceUpdate={updateUser}
            // validationSchema={userValidationSchema}
            redirectPath="/admin/users"
        />
    );
};

export default UserForm;