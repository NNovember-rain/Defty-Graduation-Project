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

    // @ts-ignore
    const promptFormFields: FormField[] = React.useMemo(() => [
        {
            key: 'name',
            labelKey: 'promptForm.nameLabel',
            type: 'text',
            placeholderKey: 'promptForm.namePlaceholder',
            required: true,
            gridSpan: 12,
        },
        {
            key: 'type',
            labelKey: 'promptPage.dataTableColumns.type',
            type: 'select',
            options: [
                // ========================================
                // USE CASE DIAGRAM PROMPTS
                // ========================================
                {
                    value: 'usecase-domain-extractor',
                    label: '[Use Case] Domain Context Extractor',
                    description: 'Extract keywords and requirements from Use Case assignment'
                },
                {
                    value: 'usecase-plantuml-extractor',
                    label: '[Use Case] PlantUML to JSON Parser',
                    description: 'Parse Use Case PlantUML code into structured JSON'
                },
                {
                    value: 'usecase-semantic-normalizer',
                    label: '[Use Case] Semantic Normalizer',
                    description: 'Normalize Use Case element names to canonical forms'
                },
                {
                    value: 'usecase-error-classifier-scorer',
                    label: '[Use Case] Error Classifier & Scorer',
                    description: 'Detect, classify errors and calculate score for Use Case diagrams'
                },
                {
                    value: 'usecase-feedback-generator',
                    label: '[Use Case] Feedback Generator',
                    description: 'Generate personalized feedback for Use Case diagrams'
                },

                // ========================================
                // CLASS DIAGRAM PROMPTS (ANALYSIS PHASE)
                // ========================================
                {
                    value: 'class-analysis-domain-extractor',
                    label: '[Class Analysis] Domain Context Extractor',
                    description: 'Extract business concepts and entities from Class Diagram assignment'
                },
                {
                    value: 'class-analysis-plantuml-extractor',
                    label: '[Class Analysis] PlantUML to JSON Parser',
                    description: 'Parse Class Diagram PlantUML code into structured JSON'
                },
                {
                    value: 'class-analysis-semantic-normalizer',
                    label: '[Class Analysis] Semantic Normalizer',
                    description: 'Normalize class and attribute names to canonical forms'
                },
                {
                    value: 'class-analysis-error-classifier-scorer',
                    label: '[Class Analysis] Error Classifier & Scorer',
                    description: 'Detect, classify errors and calculate score for Class diagrams'
                },
                {
                    value: 'class-analysis-feedback-generator',
                    label: '[Class Analysis] Feedback Generator',
                    description: 'Generate personalized feedback for Class diagrams'
                },
            ],
            required: true,
            gridSpan: 12,
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
            // @ts-ignore
            validationSchema={promptValidationSchema}
            redirectPath="/admin/settings/prompts"
        />
    );
};

export default PromptForm;