import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
    createTestSet,
    getTestSetById,
    updateTestSet,
    type ITestSet,
    type CreateTestSetRequest,
    type UpdateTestSetRequest,
} from '../../../../shared/services/questionBankService/testSetService.ts';
import { getAllActiveTestCollections } from '../../../../shared/services/questionBankService/testCollectionService.ts';

import FormTemplate, { type FormField } from '../../../template/ManagementTemplate/FormTemplate.tsx';

const TestSetForm: React.FC = () => {
    const { t } = useTranslation();
    const [collections, setCollections] = React.useState<Array<{ value: string; label: string }>>([]);
    const [directionSets, setDirectionSets] = React.useState<Array<{ value: string; label: string }>>([]);

    // Fetch collections and direction sets for select fields
    React.useEffect(() => {
        const fetchCollections = async () => {
            try {
                const result = await getAllActiveTestCollections();
                if (result.data) {
                    setCollections(result.data.map((collection: any) => ({
                        value: collection.id,
                        label: collection.collectionName
                    })));
                }
            } catch (error) {
                console.error("Failed to fetch collections:", error);
            }
        };

        fetchCollections();
    }, []);

    const testSetFormFields: FormField[] = React.useMemo(() => [
        {
            key: 'testName',
            labelKey: 'Tên bài test',
            type: 'text',
            placeholderKey: 'Nhập tên bài test',
            required: true,
            gridSpan: 12,
            realTimeValidation: true,
        },
        {
            key: 'testNumber',
            labelKey: 'Số thứ tự',
            type: 'number',
            placeholderKey: 'Nhập số thứ tự',
            required: false,
            gridSpan: 12,
            min: 0,
        },
        {
            key: 'collectionId',
            labelKey: 'Bộ sưu tập',
            type: 'select',
            placeholderKey: 'Chọn bộ sưu tập',
            // required: true,
            gridSpan: 12,
            options: collections,
        },
        {
            key: 'description',
            labelKey: 'Mô tả',
            type: 'textarea',
            placeholderKey: 'Nhập mô tả cho bài test',
            gridSpan: 24,
            required: false,
        },
    ], [collections, directionSets]);

    const testSetValidationSchema = React.useMemo(() => ({
        testName: (value: any, t: any) => {
            if (!value?.trim()) {
                return t ? t('Tên bài test là bắt buộc') : 'Tên bài test là bắt buộc';
            }
            if (value.trim().length < 3) {
                return t ? t('Tên bài test phải có ít nhất 3 ký tự') : 'Tên bài test phải có ít nhất 3 ký tự';
            }
            if (value.trim().length > 100) {
                return t ? t('Tên bài test không được vượt quá 100 ký tự') : 'Tên bài test không được vượt quá 100 ký tự';
            }
            return null;
        },
        testNumber: (value: any, t: any) => {
            if (value && (isNaN(value) || value < 1)) {
                return t ? t('Số thứ tự phải là số nguyên dương') : 'Số thứ tự phải là số nguyên dương';
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
        { label: 'Ngân hàng câu hỏi', path: '/admin/question-bank' },
        { label: 'Quản lý bài thi', path: '/admin/question-bank/test-sets' },
    ];

    // Adapter cho serviceGetById
    const adaptedGetServiceGetById = useCallback(async (id: string): Promise<ITestSet> => {
        try {
            const testSetData = await getTestSetById(id);

            // Process the data if needed
            const processedTestSetData: ITestSet = {
                ...testSetData,
                // Ensure all required fields are present
                testName: testSetData.testName || '',
                collectionId: testSetData.collectionId || '',
                testNumber: testSetData.testNumber || undefined,
                description: testSetData.description || undefined,
                totalQuestions: testSetData.totalQuestions || undefined,
            };

            return processedTestSetData;
        } catch (error) {
            console.error("Adapter failed to fetch test set:", error);
            throw error;
        }
    }, []);

    return (
        <FormTemplate<ITestSet, CreateTestSetRequest, UpdateTestSetRequest>
            pageTitleKey="bài thi"
            breadcrumbItems={breadcrumbItems}
            formFields={testSetFormFields}
            serviceGetById={adaptedGetServiceGetById}
            serviceCreate={createTestSet}
            serviceUpdate={updateTestSet}
            validationSchema={testSetValidationSchema}
            redirectPath="/admin/content/question-bank/test-sets"
        />
    );
};

export default TestSetForm;