import React from 'react';
import { useTranslation } from 'react-i18next';
import FormTemplate from '../../template/ManagementTemplate/FormTemplate';
import type { FormField } from '../../template/ManagementTemplate/FormTemplate';
import {
    createPrompt,
    getPromptById,
    updatePrompt,
    type IPrompt
} from '../../../shared/services/promptService';

const PromptForm: React.FC = () => {
    const { t } = useTranslation();

    const promptFormFields: FormField[] = React.useMemo(() => [
        {
            key: 'name',
            labelKey: 'promptForm.nameLabel',
            type: 'text',
            placeholderKey: 'promptForm.namePlaceholder',
            required: true,
            gridSpan: 24,
        },
        {
            key: 'description',
            labelKey: 'promptForm.descriptionLabel',
            type: 'textarea',
            placeholderKey: 'promptForm.descriptionPlaceholder',
            gridSpan: 24,
        },
        {
            key: 'templateString',
            labelKey: 'promptForm.templateStringLabel',
            type: 'textarea',
            placeholderKey: 'promptForm.templateStringPlaceholder',
            required: true,
            gridSpan: 24,
        },
        {
            key: 'version',
            labelKey: 'promptForm.versionLabel',
            type: 'text',
            placeholderKey: 'promptForm.versionPlaceholder',
            required: true,
            gridSpan: 24,
        },
    ], []);

    const promptValidationSchema = React.useMemo(() => ({
        name: (value: string, t: (key: string) => string) => {
            if (!value?.trim()) return t('promptForm.validation.nameRequired');
            return null;
        },
        templateString: (value: string, t: (key: string) => string) => {
            if (!value?.trim()) return t('promptForm.validation.templateStringRequired');
            return null;
        },
        type: (value: 'system' | 'user' | 'template', t: (key: string) => string) => {
            if (!value) return t('promptForm.validation.typeRequired');
            return null;
        },
        version: (value: string, t: (key: string) => string) => {
            if (!value?.trim()) return t('promptForm.validation.versionRequired');
            return null;
        },
    }), []);

    const breadcrumbItems = [
        { label: t('promptPage.breadcrumb.home'), path: '/' },
        { label: t('promptPage.breadcrumb.adminDashboard'), path: '/admin' },
        { label: t('promptPage.breadcrumb.promptManagement'), path: '/admin/settings/prompts' },
    ];

    return (
        <FormTemplate<IPrompt>
            pageTitleKey="promptForm.title"
            breadcrumbItems={breadcrumbItems}
            formFields={promptFormFields}
            serviceGetById={getPromptById}
            serviceCreate={createPrompt}
            serviceUpdate={updatePrompt}
            validationSchema={promptValidationSchema}
            redirectPath="/admin/settings/prompts"
        />
    );
};

export default PromptForm;