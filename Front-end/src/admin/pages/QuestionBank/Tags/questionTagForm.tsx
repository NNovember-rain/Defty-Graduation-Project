import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
    createQuestionTag,
    getQuestionTagById,
    updateQuestionTag,
    type IQuestionTag,
    type CreateQuestionTagRequest,
    type UpdateQuestionTagRequest,
} from '../../../../shared/services/questionBankService/questionTagService.ts';

import FormTemplate, { type FormField } from '../../../template/ManagementTemplate/FormTemplate.tsx';

const QuestionTagForm: React.FC = () => {
    const { t } = useTranslation();

    const tagFormFields: FormField[] = React.useMemo(() => [
        {
            key: 'tagName',
            labelKey: 'Tên thẻ',
            type: 'text',
            placeholderKey: 'Nhập tên thẻ câu hỏi',
            required: true,
            gridSpan: 12,
            realTimeValidation: true,
        },
        // {
        //     key: 'tagCategory',
        //     labelKey: 'Danh mục thẻ',
        //     type: 'select',
        //     placeholderKey: 'Chọn danh mục thẻ',
        //     required: false,
        //     gridSpan: 12,
        //     options: [
        //         { value: 'SUBJECT', label: 'Môn học' },
        //         { value: 'DIFFICULTY', label: 'Độ khó' },
        //         { value: 'TOPIC', label: 'Chủ đề' },
        //         { value: 'SKILL', label: 'Kỹ năng' },
        //         { value: 'OTHER', label: 'Khác' },
        //     ],
        // },
        {
            key: 'description',
            labelKey: 'Mô tả',
            type: 'textarea',
            placeholderKey: 'Nhập mô tả cho thẻ câu hỏi',
            gridSpan: 24,
            required: false,
        },
    ], []);

    const tagValidationSchema = React.useMemo(() => ({
        tagName: (value: any, t: any) => {
            if (!value?.trim()) {
                return t ? t('Tên thẻ là bắt buộc') : 'Tên thẻ là bắt buộc';
            }
            if (value.trim().length < 2) {
                return t ? t('Tên thẻ phải có ít nhất 2 ký tự') : 'Tên thẻ phải có ít nhất 2 ký tự';
            }
            if (value.trim().length > 100) {
                return t ? t('Tên thẻ không được vượt quá 100 ký tự') : 'Tên thẻ không được vượt quá 100 ký tự';
            }
            return null;
        },
        // tagCategory: (value: any, t: any) => {
        //     // tagCategory is optional, so only validate if provided
        //     if (value && !['SUBJECT', 'DIFFICULTY', 'TOPIC', 'SKILL', 'OTHER'].includes(value)) {
        //         return t ? t('Danh mục thẻ không hợp lệ') : 'Danh mục thẻ không hợp lệ';
        //     }
        //     return null;
        // },
        description: (value: any, t: any) => {
            // description is optional, so only validate if provided
            if (value && value.trim().length > 500) {
                return t ? t('Mô tả không được vượt quá 500 ký tự') : 'Mô tả không được vượt quá 500 ký tự';
            }
            return null;
        },
    }), [t]);

    const breadcrumbItems = [
        { label: 'Trang chủ', path: '/' },
        { label: 'Ngân hàng câu hỏi', path: '/admin/question-bank' },
        { label: 'Quản lý thẻ', path: '/admin/question-bank/tags' },
    ];

    // Adapter cho serviceGetById
    const adaptedGetServiceGetById = useCallback(async (id: string): Promise<IQuestionTag> => {
        try {
            const tagData = await getQuestionTagById(id);

            // Process the data if needed
            const processedTagData: IQuestionTag = {
                ...tagData,
                // Ensure all required fields are present
                tagName: tagData.tagName || '',
                tagCategory: tagData.tagCategory || undefined,
                description: tagData.description || undefined,
            };

            return processedTagData;
        } catch (error) {
            console.error("Adapter failed to fetch question tag:", error);
            throw error;
        }
    }, []);

    return (
        <FormTemplate<IQuestionTag, CreateQuestionTagRequest, UpdateQuestionTagRequest>
            pageTitleKey="thẻ câu hỏi"
            breadcrumbItems={breadcrumbItems}
            formFields={tagFormFields}
            serviceGetById={adaptedGetServiceGetById}
            serviceCreate={createQuestionTag}
            serviceUpdate={updateQuestionTag}
            validationSchema={tagValidationSchema}
            redirectPath="/admin/question-bank/tags"
        />
    );
};

export default QuestionTagForm;