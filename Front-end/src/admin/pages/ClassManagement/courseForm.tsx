import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    createCourse,
    getCourseById,
    updateCourse,
    type ICourse,
    type CreateCourseRequest,
    type UpdateCourseRequest
} from '../../../shared/services/courseService.ts';
import FormTemplate, { type FormField } from '../../template/ManagementTemplate/FormTemplate.tsx';

const CourseForm: React.FC = () => {
    const { t } = useTranslation();

    const courseFormFields: FormField[] = React.useMemo(() => [
        {
            key: 'courseName',
            labelKey: 'Tên khóa học',
            type: 'text',
            placeholderKey: 'Nhập tên khóa học',
            required: true,
            gridSpan: 12,
            realTimeValidation: true,
        },
        // {
        //     key: 'color',
        //     labelKey: 'Màu sắc (Mã Hex)',
        //     type: 'text',
        //     placeholderKey: 'Ví dụ: #FF5733',
        //     required: false,
        //     gridSpan: 4,
        //     realTimeValidation: true,
        // },
        {
            key: 'description',
            labelKey: 'Mô tả',
            type: 'textarea',
            placeholderKey: 'Nhập mô tả khóa học',
            gridSpan: 24,
        },
    ], []);

    const courseValidationSchema = React.useMemo(() => ({
        courseName: (value: any, t: any) => {
            if (!value?.trim()) return 'Tên khóa học là bắt buộc';
            if (value.trim().length < 3) return 'Tên khóa học phải có ít nhất 3 ký tự';
            if (value.trim().length > 100) return 'Tên khóa học không được vượt quá 100 ký tự';
            return null;
        },
        description: (value: any, t: any) => {
            if (value && value.trim().length > 500) return 'Mô tả không được vượt quá 500 ký tự';
            return null;
        },
        color: (value: any, t: any) => {
            if (!value || !value.trim()) return null;
            const hexColorRegex = /^#([0-9A-F]{3}|[0-9A-F]{6})$/i;
            const trimmedValue = value.trim();
            if (!hexColorRegex.test(trimmedValue))
                return 'Màu sắc phải là mã hex hợp lệ. Ví dụ: #FF5733 (6 ký tự) hoặc #F53 (3 ký tự)';
            return null;
        },
    }), []);

    const breadcrumbItems = [
        { label: 'Home', path: '/' },
        { label: 'Admin Dashboard', path: '/admin' },
        { label: 'Course Management', path: '/admin/course' },
    ];


    return (
        <FormTemplate<ICourse>
            pageTitleKey="khóa học"
            breadcrumbItems={breadcrumbItems}
            formFields={courseFormFields}
            serviceCreate={createCourse}
            serviceUpdate={updateCourse}
            validationSchema={courseValidationSchema}
            redirectPath="/admin/course"
        />
    );
};

export default CourseForm;
