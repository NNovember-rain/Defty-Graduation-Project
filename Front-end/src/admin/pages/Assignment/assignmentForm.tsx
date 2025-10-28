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
                console.log(response)
                const typeUmlsArray = Array.isArray(response.typeUmls) ? response.typeUmls : [];
                setTypeUMLs(typeUmlsArray);
            } catch (error) {
                console.error('Error fetching Type UMLs:', error);
                message.error(t('common.errorFetchingData'));
            }
        }
        fetchTypeUMLs();
    }, [t]);

    const typeUmlOptions = typeUMLs.map(type => ({
        value: String(type.id),
        label: type.name,
    }));

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
            key: 'moduleDescriptions',
            labelKey: 'assignmentForm.moduleDescriptionsLabel',
            type: 'dynamicList',
            required: true,
            gridSpan: 24,
            itemFields: [
                {
                    key: 'moduleId',
                    labelKey: 'assignmentForm.typeUmlLabel',
                    type: 'select',
                    required: true,
                    gridSpan: 12,
                    options: typeUmlOptions,
                    props: {
                        placeholder: t('assignmentForm.selectTypeUml'),
                        showSearch: true,
                        optionFilterProp: 'label',
                    },
                },
                {
                    key: 'moduleName',
                    labelKey: 'assignmentForm.moduleName',
                    type: 'text',
                    required: true,
                    gridSpan: 24,
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
            ],
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
            serviceGetById={async (id) => {
                const res = await getAssignmentById(id);
                return {
                    ...res,
                    moduleDescriptions: res.modules?.map((m: any) => ({
                        moduleId: m.typeUmlIds.map((tid: number) => String(tid)),
                        moduleName: m.moduleName,
                        description: m.moduleDescription,
                        solutionCode: m.solutionCode,
                    })) || []
                };
            }}
            serviceCreate={async (formData) => {
                const data = formData as any;
                const payload = {
                    title: data.title || '',
                    description: data.commonDescription || '',
                    modules: Array.isArray(data.moduleDescriptions)
                        ? data.moduleDescriptions.map((m: any) => ({
                            moduleName: m.moduleName || '',              // lấy đúng giá trị input text
                            moduleDescription: m.description || '',
                            solutionCode: m.solutionCode || '',
                            typeUmlIds: Array.isArray(m.moduleId) ? m.moduleId.map((id: string) => Number(id)) : [],
                        }))
                        : [],
                };
                return createAssignment(payload);
            }}

            serviceUpdate={async (id, formData) => {
                const data = formData as any;
                const payload = {
                    title: data.title || '',
                    description: data.commonDescription || '',
                    modules: Array.isArray(data.moduleDescriptions)
                        ? data.moduleDescriptions.map((m: any) => ({
                            moduleName: m.moduleName || '',              // lấy đúng giá trị input text
                            moduleDescription: m.description || '',
                            solutionCode: m.solutionCode || '',
                            typeUmlIds: Array.isArray(m.moduleId) ? m.moduleId.map((id: string) => Number(id)) : [],
                        }))
                        : [],
                };
                return updateAssignment(id, payload);
            }}

            validationSchema={assignmentValidationSchema}
            redirectPath="/admin/content/assignments"
        />
    );
};

export default AssignmentForm;
