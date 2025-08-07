import React, {useState, useEffect, useCallback} from 'react';
import { useTranslation } from 'react-i18next';
import FormTemplate from '../../template/ManagementTemplate/FormtemplateCustom.tsx';
import type { FormField } from '../../template/ManagementTemplate/FormtemplateCustom';
import {
    createClass,
    getClassById,
    updateClass,
    IClass,
    CreateClassRequest,
    UpdateClassRequest,
} from '../../../shared/services/classManagementService.ts';

// Import service mới để lấy danh sách giáo viên
import { getUsersByRole, type IUser } from '../../../shared/services/authService.ts';

const ClassForm: React.FC = () => {
    const { t } = useTranslation();

    const [teachers, setTeachers] = useState<IUser[]>([]);
    const [loadingTeachers, setLoadingTeachers] = useState(false);
    const [teachersError, setTeachersError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTeachers = async () => {
            setLoadingTeachers(true);
            try {
                const teacherList = await getUsersByRole(3);
                setTeachers(teacherList);
            } catch (err: any) {
                console.error("Failed to fetch teachers:", err);
                setTeachersError(t('classForm.fetchTeachersError', { message: err.message || '' }));
            } finally {
                setLoadingTeachers(false);
            }
        };

        fetchTeachers();
    }, [t]);

    const classFormFields: FormField[] = React.useMemo(() => [
        {
            key: 'teacherId',
            labelKey: 'classForm.teacherLabel',
            type: 'select',
            placeholderKey: 'classForm.teacherPlaceholder',
            required: true,
            gridSpan: 12,
            options: teachers.map(teacher => ({
                value: teacher.id, // Đảm bảo này là number
                label: teacher.fullName,
            })),
            loading: loadingTeachers,
            error: teachersError,
            disabled: loadingTeachers,
        },
        {
            key: 'name',
            labelKey: 'classForm.nameLabel',
            type: 'text',
            placeholderKey: 'classForm.namePlaceholder',
            required: true,
            gridSpan: 12,
        },
        {
            key: 'description',
            labelKey: 'classForm.descriptionLabel',
            type: 'textarea',
            placeholderKey: 'classForm.descriptionPlaceholder',
            gridSpan: 24,
        },
    ], [teachers, loadingTeachers, teachersError, t]);

    const classValidationSchema = React.useMemo(() => ({
        teacherId: (value, t) => {
            if (value === undefined || value === null || value <= 0) {
                return t('classForm.validation.teacherRequired');
            }
            return null;
        },
        name: (value, t) => {
            if (!value?.trim()) {
                return t('classForm.validation.nameRequired');
            }
            return null;
        }
    }), []);

    const breadcrumbItems = [
        { label: t('classPage.breadcrumb.home'), path: '/' },
        { label: t('classPage.breadcrumb.adminDashboard'), path: '/admin' },
        { label: t('classPage.breadcrumb.classManagement'), path: '/admin/class/list' },
    ];

    // Hàm adapter - QUAN TRỌNG: Đảm bảo trả về đúng kiểu dữ liệu
    const adaptedGetServiceGetById = useCallback(async (id: string | number): Promise<IClass> => {
        try {
            const apiResponse = await getClassById(id);

            console.log("Full API Response:", apiResponse); // Debug log

            // Xử lý các trường hợp khác nhau của API response structure
            let classData;

            if (apiResponse.data) {
                // Trường hợp 1: { status: 200, data: {...} }
                classData = apiResponse.data;
            } else if (apiResponse.status === 200) {
                // Trường hợp 2: response chính là data
                classData = apiResponse;
            } else {
                // Trường hợp 3: response trực tiếp là object class
                classData = apiResponse;
            }

            if (classData && classData.id) {
                // Đảm bảo teacherId là number (quan trọng cho việc match với options)
                const processedClassData = {
                    ...classData,
                    teacherId: Number(classData.teacherId) // Convert về number
                };

                console.log("Processed class data:", processedClassData); // Debug log
                console.log("Available teachers:", teachers.map(t => ({ id: t.id, name: t.fullName }))); // Debug log

                return processedClassData;
            } else {
                const errorMessage = apiResponse.message || "No class data found.";
                throw new Error(errorMessage);
            }
        } catch (error) {
            console.error("Adapter failed to fetch class:", error);
            throw error;
        }
    }, [teachers]);

    return (
        <FormTemplate<IClass, CreateClassRequest, UpdateClassRequest>
            pageTitleKey="classForm.title"
            breadcrumbItems={breadcrumbItems}
            formFields={classFormFields}
            serviceGetById={adaptedGetServiceGetById}
            serviceCreate={createClass}
            serviceUpdate={updateClass}
            validationSchema={classValidationSchema}
            redirectPath="/admin/class/list"
        />
    );
};

export default ClassForm;