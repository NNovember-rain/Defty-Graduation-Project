import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
    createTestCollection,
    getTestCollectionById,
    updateTestCollection,
    type ITestCollection,
    type CreateTestCollectionRequest,
    type UpdateTestCollectionRequest,
} from '../../../../shared/services/questionBankService/testCollectionService.ts';

import FormTemplate, { type FormField } from '../../../template/ManagementTemplate/FormTemplate.tsx';

const TestCollectionForm: React.FC = () => {
    const { t } = useTranslation();

    const collectionFormFields: FormField[] = React.useMemo(() => [
        {
            key: 'collectionName',
            labelKey: 'Tên bộ sưu tập',
            type: 'text',
            placeholderKey: 'Nhập tên bộ sưu tập',
            required: true,
            gridSpan: 12,
            realTimeValidation: true,
        },
        {
            key: 'description',
            labelKey: 'Mô tả',
            type: 'textarea',
            placeholderKey: 'Nhập mô tả cho bộ sưu tập',
            gridSpan: 24,
            required: false,
        },
    ], []);

    const collectionValidationSchema = React.useMemo(() => ({
        collectionName: (value: any, t: any) => {
            if (!value?.trim()) {
                return t ? t('Tên bộ sưu tập là bắt buộc') : 'Tên bộ sưu tập là bắt buộc';
            }
            if (value.trim().length < 3) {
                return t ? t('Tên bộ sưu tập phải có ít nhất 3 ký tự') : 'Tên bộ sưu tập phải có ít nhất 3 ký tự';
            }
            if (value.trim().length > 100) {
                return t ? t('Tên bộ sưu tập không được vượt quá 100 ký tự') : 'Tên bộ sưu tập không được vượt quá 100 ký tự';
            }
            return null;
        },
        description: (value: any, t: any) => {
            if (value && value.trim().length > 1000) {
                return t ? t('Mô tả không được vượt quá 1000 ký tự') : 'Mô tả không được vượt quá 1000 ký tự';
            }
            return null;
        },
    }), [t]);

    const breadcrumbItems = [
        { label: 'Trang chủ', path: '/' },
        { label: 'Ngân hàng câu hỏi', path: '/admin' },
        { label: 'Quản lý bộ sưu tập', path: '/admin/collections' },
    ];

    // Adapter cho serviceGetById
    const adaptedGetServiceGetById = useCallback(async (id: string): Promise<ITestCollection> => {
        try {
            const collectionData = await getTestCollectionById(id);

            // Process the data if needed
            const processedCollectionData: ITestCollection = {
                ...collectionData,
                // Ensure all required fields are present
                collectionName: collectionData.collectionName || '',
                slug: collectionData.slug || '',
                description: collectionData.description || undefined,
                totalTests: collectionData.totalTests || undefined,
            };

            return processedCollectionData;
        } catch (error) {
            console.error("Adapter failed to fetch test collection:", error);
            throw error;
        }
    }, []);

    return (
        <FormTemplate<ITestCollection, CreateTestCollectionRequest, UpdateTestCollectionRequest>
            pageTitleKey="bộ sưu tập bài thi"
            breadcrumbItems={breadcrumbItems}
            formFields={collectionFormFields}
            serviceGetById={adaptedGetServiceGetById}
            serviceCreate={createTestCollection}
            serviceUpdate={updateTestCollection}
            validationSchema={collectionValidationSchema}
            redirectPath="/admin/content/question-bank/collections"
        />
    );
};

export default TestCollectionForm;