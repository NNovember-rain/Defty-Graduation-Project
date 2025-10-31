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

    function stripHtml(html: string): string {
        const tmp = document.createElement("div");
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || "";
    }

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
                    key: 'typeUmlId', // Đổi key thành typeUmlId để rõ ràng hơn
                    labelKey: 'assignmentForm.typeUmlLabel',
                    type: 'select',
                    required: true,
                    gridSpan: 12,
                    options: typeUmlOptions,
                    props: {
                        placeholder: t('assignmentForm.selectTypeUml'),
                        showSearch: true,
                        optionFilterProp: 'label',
                        // ĐÃ BỎ mode: 'multiple' -> Chỉ chọn 1 giá trị (string ID)
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

                // --- SỬA LOGIC GET: CHỈ LẤY MỘT ID ĐẦU TIÊN (STRING) ---
                return {
                    ...res,
                    moduleDescriptions: res.modules?.map((m: any) => ({
                        // Chỉ lấy ID đầu tiên và chuyển sang chuỗi (Single Select)
                        typeUmlId: m.typeUmlIds?.length > 0 ? String(m.typeUmlIds[0]) : undefined,
                        moduleName: m.moduleName,
                        description: m.moduleDescription,
                        solutionCode: m.solutionCode,
                    })) || []
                };
                // --- KẾT THÚC SỬA LOGIC GET ---
            }}
            serviceCreate={async (formData) => {
                const data = formData as any;
                const payload = {
                    title: data.title || '',
                    description: stripHtml(data.commonDescription || ''),
                    modules: Array.isArray(data.moduleDescriptions)
                        ? data.moduleDescriptions.map((m: any) => ({
                            moduleName: m.moduleName || '',
                            moduleDescription: stripHtml(m.description || ''),
                            solutionCode: stripHtml(m.solutionCode || ''),
                            typeUmlIds: m.typeUmlId ? [Number(m.typeUmlId)] : [],
                        }))
                        : [],
                };
                return createAssignment(payload);
            }}

            serviceUpdate={async (id, formData) => {
                const data = formData as any;
                const payload = {
                    title: data.title || '',
                    description: stripHtml(data.commonDescription || ''),
                    modules: Array.isArray(data.moduleDescriptions)
                        ? data.moduleDescriptions.map((m: any) => ({
                            moduleName: m.moduleName || '',
                            moduleDescription: m.description || '',
                            moduleDescription: stripHtml(m.description || ''),
                            solutionCode: stripHtml(m.solutionCode || ''),
                            typeUmlIds: m.typeUmlId ? [Number(m.typeUmlId)] : [],
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