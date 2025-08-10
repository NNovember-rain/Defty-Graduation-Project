import React, {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import type {FormField} from '../../template/ManagementTemplate/FormTemplate';
import FormTemplate from '../../template/ManagementTemplate/FormTemplate';
import {createAssignment, getAssignmentById, updateAssignment} from '../../../shared/services/assignmentService.ts';
import {useNotification} from '../../../shared/notification/useNotification.ts';
import {getTypeUmls, type ITypeUml} from "../../../shared/services/typeUmlService.ts";

const AssignmentForm: React.FC = () => {
    const { t } = useTranslation();
    const { message } = useNotification();

    const [typeUMLs, setTypeUMLs] = useState<ITypeUml[]>([]);

    useEffect(() => {
        async function fetchTypeUMLs() {
            try {
                const response = await getTypeUmls();
                const typeUmlsArray = Array.isArray(response.typeUmls) ? response.typeUmls : [];
                setTypeUMLs(typeUmlsArray);
            } catch (error) {
                console.error('Error fetching Type UMLs:', error);
                message.error(t('common.errorFetchingData'));
            }
        }
        fetchTypeUMLs();
    }, [t]);

    const assignmentFormFields: FormField[] = [
        {
            key: 'title',
            labelKey: 'assignmentForm.titleLabel',
            type: 'text',
            placeholderKey: 'assignmentForm.titlePlaceholder',
            required: true,
            gridSpan: 24,
        },
        {
            key: 'typeUmlId',
            labelKey: 'assignmentForm.typeUmlLabel',
            type: 'select',
            required: true,
            gridSpan: 24,
            options: typeUMLs.map(type => ({
                value: String(type.id),
                labelKey: type.name,
            })),
        },
        {
            key: 'description',
            labelKey: 'assignmentForm.descriptionLabel',
            type: 'textEditor',
            required: true,
            gridSpan: 24,
        },
        {
            key: 'solutionCode',
            labelKey: 'assignmentForm.solutionCodeLabel',
            type: 'textEditor',
            placeholderKey: 'assignmentForm.solutionCodePlaceholder',
            required: true,
            gridSpan: 24,
        },
    ];

    const assignmentValidationSchema = {
        title: (value: string, t: (key: string) => string) => {
            if (!value?.trim()) return t('assignmentForm.validation.titleRequired');
            return null;
        },
        description: (value: string, t: (key: string) => string) => {
            if (!value?.trim()) return t('assignmentForm.validation.descriptionRequired');
            return null;
        },
        typeUmlId: (value: string, t: (key: string) => string) => {
            if (!value) return t('assignmentForm.validation.typeUmlRequired');
            return null;
        }
    };

    const breadcrumbItems = [
        { label: t('common.breadcrumb.home'), path: '/' },
        { label: t('common.breadcrumb.adminDashboard'), path: '/admin' },
        { label: t('assignmentPage.breadcrumb'), path: '/admin/content/assignments' },
    ];

    return (
        <FormTemplate
            pageTitleKey="assignmentForm.title"
            breadcrumbItems={breadcrumbItems}
            formFields={assignmentFormFields}
            serviceGetById={getAssignmentById}
            serviceCreate={createAssignment}
            serviceUpdate={updateAssignment}
            validationSchema={assignmentValidationSchema}
            redirectPath="/admin/content/assignments"
        />
    );
};

export default AssignmentForm;
