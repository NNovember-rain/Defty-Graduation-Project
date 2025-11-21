import React from 'react';
import {useTranslation} from 'react-i18next';
import type {FormField} from '../../template/ManagementTemplate/FormTemplate';
import FormTemplate from '../../template/ManagementTemplate/FormTemplate';
import {createAssignment, getAssignmentById, updateAssignment} from '../../../shared/services/assignmentService.ts';
import {useNotification} from '../../../shared/notification/useNotification.ts';

const AssignmentForm: React.FC = () => {
    const { t } = useTranslation();
    const { message } = useNotification();

    function stripHtml(html: string): string {
        const tmp = document.createElement("div");
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || "";
    }


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
            key: 'commonDescription',
            labelKey: 'assignmentForm.commonDescriptionLabel',
            type: 'textEditor',
            required: true,
            gridSpan: 24,
        },
        {
            key: 'modules',
            labelKey: 'assignmentForm.moduleDescriptionsLabel',
            type: 'assignmentModules' as 'text',
            required: true,
            gridSpan: 24,

        },
    ];

    const assignmentValidationSchema = {
        title: (value: string, t: (key: string) => string) => {
            if (!value?.trim()) return t('assignmentForm.titleRequired');
            return null;
        },
        description: (value: string, t: (key: string) => string) => {
            if (!value?.trim()) return t('assignmentForm.descriptionRequired');
            return null;
        },
    };

    const breadcrumbItems = [
        { label: t('common.breadcrumb.home'), path: '/' },
        { label: t('common.breadcrumb.adminDashboard'), path: '/admin' },
        { label: t('assignmentPage.breadcrumb'), path: '/admin/content/assignments' },
    ];

    const serviceHandler = (formData: any) => {
        const data = formData as any;
        return {
            title: data.title || '',
            description: stripHtml(data.commonDescription || ''),
            classIds: data.classIds || [],
            modules: Array.isArray(data.modules)
                ? data.modules.map((m: any) => ({
                    moduleName: m.moduleName || '',
                    moduleDescription: stripHtml(m.description || ''),
                    solutions: Array.isArray(m.umlSolutions)
                        ? m.umlSolutions.map((u: any) => ({
                            typeUml: u.typeUmlId || '',
                            solutionCode: stripHtml(u.solutionCode || ''),
                        }))
                        : [],
                }))
                : [],
        };
    };

    return (
        <FormTemplate
            pageTitleKey="assignmentForm.title"
            breadcrumbItems={breadcrumbItems}
            formFields={assignmentFormFields}
            serviceGetById={async (id) => {
                const res = await getAssignmentById(id);
                console.log('Fetched assignment:', res);
                return {
                    ...res,
                    // commonDescription: res.description,
                    modules: res.modules?.map((m: any) => ({
                        moduleName: m.moduleName,
                        description: m.moduleDescription,
                        umlSolutions: Array.isArray(m.solutionResponses)
                            ? m.solutionResponses.map((s: any) => ({
                                typeUmlId: s.typeUml,
                                solutionCode: s.solutionCode,
                            }))
                            : [],
                    })) || [],
                };
            }}
            serviceCreate={async (formData) => {
                const payload = serviceHandler(formData);
                return createAssignment(payload);
            }}

            serviceUpdate={async (id, formData) => {
                const payload = serviceHandler(formData);
                return updateAssignment(id, payload);
            }}

            validationSchema={assignmentValidationSchema}
            redirectPath="/admin/content/assignments"
        />
    );
};

export default AssignmentForm;