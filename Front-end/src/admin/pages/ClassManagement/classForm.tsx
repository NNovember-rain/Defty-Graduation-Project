import React from 'react';
import { useTranslation } from 'react-i18next';
import FormTemplate from '../../template/ManagementTemplate/FormTemplate';
import type { FormField } from '../../template/ManagementTemplate/FormTemplate';
import {
    createClass, // Import hàm createClass mới
    getClassById, // Import hàm getClassById mới
    updateClass, // Import hàm updateClass mới
    IClass, // Import interface IClass mới
    CreateClassRequest, // Import CreateClassRequest
    UpdateClassRequest, ApiResponse // Import UpdateClassRequest
} from '../../../shared/services/classManagementService.ts'; // Thay đổi import sang classService

const ClassForm: React.FC = () => {
    const { t } = useTranslation();

    // Định nghĩa các trường cho form tạo/cập nhật lớp học
    const classFormFields: FormField[] = React.useMemo(() => [
        {
            key: 'teacherId',
            labelKey: 'classForm.teacherIdLabel',
            type: 'number', // Kiểu số cho teacherId
            placeholderKey: 'classForm.teacherIdPlaceholder',
            required: true,
            gridSpan: 12, // Chia layout thành 2 cột cho mỗi hàng (24 / 2 = 12)
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
            gridSpan: 24, // Chiếm toàn bộ chiều rộng
        },
        {
            key: 'section',
            labelKey: 'classForm.sectionLabel',
            type: 'text',
            placeholderKey: 'classForm.sectionPlaceholder',
            gridSpan: 8, // Chia 3 cột cho hàng này (24 / 3 = 8)
        },
        {
            key: 'subject',
            labelKey: 'classForm.subjectLabel',
            type: 'text',
            placeholderKey: 'classForm.subjectPlaceholder',
            gridSpan: 8,
        },
        {
            key: 'room',
            labelKey: 'classForm.roomLabel',
            type: 'text',
            placeholderKey: 'classForm.roomPlaceholder',
            gridSpan: 8,
        },
    ], []);

    // Định nghĩa schema validation cho form lớp học
    const classValidationSchema = React.useMemo(() => ({
        teacherId: (value: number | undefined, t: (key: string) => string) => {
            if (value === undefined || value === null) return t('classForm.validation.teacherIdRequired');
            if (value <= 0) return t('classForm.validation.teacherIdPositive');
            return null;
        },
        name: (value: string, t: (key: string) => string) => {
            if (!value?.trim()) return t('classForm.validation.nameRequired');
            return null;
        },
        // Description, section, subject, room là tùy chọn, không cần validation ở đây trừ khi có ràng buộc cụ thể.
    }), []);

    // Định nghĩa các mục breadcrumb
    const breadcrumbItems = [
        { label: t('classPage.breadcrumb.home'), path: '/' },
        { label: t('classPage.breadcrumb.adminDashboard'), path: '/admin' },
        { label: t('classPage.breadcrumb.classManagement'), path: '/admin/class/list' }, // Đường dẫn đến danh sách lớp
    ];

    return (
        <FormTemplate<IClass, CreateClassRequest, UpdateClassRequest> // Cập nhật generic types
            pageTitleKey="classForm.title" // Khóa dịch cho tiêu đề trang
            breadcrumbItems={breadcrumbItems}
            formFields={classFormFields}
            serviceGetById={getClassById}
            serviceCreate={createClass} // Hàm service để tạo lớp mới
            serviceUpdate={updateClass} // Hàm service để cập nhật lớp
            validationSchema={classValidationSchema}
            redirectPath="/admin/class/list" // Đường dẫn chuyển hướng sau khi hoàn thành
        />
    );
};

export default ClassForm;