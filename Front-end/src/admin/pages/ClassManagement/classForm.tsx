import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {createClass, getClassById, updateClass, type IClass, type CreateClassRequest, type UpdateClassRequest,}
    from '../../../shared/services/classManagementService.ts';
import { getActiveCourses, type ICourse } from '../../../shared/services/courseService.ts';
import FormTemplate, { type FormField } from '../../template/ManagementTemplate/FormTemplate.tsx';
import { getUsersByRole, type IUser } from '../../../shared/services/authService.ts';

const ClassForm: React.FC = () => {
    const { t } = useTranslation();

    const [teachers, setTeachers] = useState<IUser[]>([]);
    const [courses, setCourses] = useState<ICourse[]>([]);

    const [loadingTeachers, setLoadingTeachers] = useState(false);
    const [loadingCourses, setLoadingCourses] = useState(false);

    const [teachersError, setTeachersError] = useState<string | null>(null);
    const [coursesError, setCoursesError] = useState<string | null>(null);

    // Fetch teachers
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


    // Fetch courses
    useEffect(() => {
        const fetchCourses = async () => {
            setLoadingCourses(true);
            try {
                const courses = await getActiveCourses();
                setCourses(courses);
            } catch (err) {
                console.error("Failed to fetch courses:", err);
                setCoursesError("Failed to load courses");
            } finally {
                setLoadingCourses(false);
            }
        };

        fetchCourses();
    }, []);

    const classFormFields: FormField[] = React.useMemo(() => [
        {
            key: 'className',
            labelKey: 'Tên lớp học',
            type: 'text',
            placeholderKey: 'Nhập tên lớp học',
            required: true,
            gridSpan: 12,
            realTimeValidation: true,
        },
        {
            key: 'courseId',
            labelKey: 'Khóa học',
            type: 'select',
            placeholderKey: 'Chọn khóa học',
            // required: true,
            gridSpan: 12,
            options: courses.map(course => ({
                value: String(course.id),
                label: course.courseName,
            })),
            loading: loadingCourses,
            error: coursesError,
            disabled: loadingCourses,
        },
        {
            key: 'teacherId',
            labelKey: 'Giáo viên',
            type: 'select',
            placeholderKey: 'Chọn giáo viên',
            required: true,
            gridSpan: 12,
            options: teachers.map(teacher => ({
                value: String(teacher.id),
                label: `${teacher.fullName}`,
            })),
            loading: loadingTeachers,
            error: teachersError,
            disabled: loadingTeachers,
        },
        {
            key: 'description',
            labelKey: 'Mô tả',
            type: 'textEditor',
            placeholderKey: 'Nhập mô tả lớp học',
            gridSpan: 24,
            textEditorConfig: {
                height: 300,
                enableImages: false,
                enableVideos: false,
            },
        },
    ], [teachers, courses, loadingTeachers, loadingCourses, teachersError, coursesError]);

    const classValidationSchema = React.useMemo(() => ({
        // courseId: (value: any, t: any) => {
        //     if (!value || value === '') {
        //         return t ? t('Khóa học là bắt buộc') : 'Khóa học là bắt buộc';
        //     }
        //     return null;
        // },
        teacherId: (value: any, t: any) => {
            if (!value || value === '') {
                return t ? t('Giáo viên là bắt buộc') : 'Giáo viên là bắt buộc';
            }
            return null;
        },
        className: (value: any, t: any) => {
            if (!value?.trim()) {
                return t ? t('Tên lớp học là bắt buộc') : 'Tên lớp học là bắt buộc';
            }
            if (value.trim().length < 3) {
                return t ? t('Tên lớp học phải có ít nhất 3 ký tự') : 'Tên lớp học phải có ít nhất 3 ký tự';
            }
            if (value.trim().length > 20) {
                return t ? t('Tên lớp học không được vượt quá 20 ký tự') : 'Tên lớp học không được vượt quá 20 ký tự';
            }
            return null;
        },
        // classType: (value: any, t: any) => {
        //     if (!value || value === '') {
        //         return t ? t('Loại lớp học là bắt buộc') : 'Loại lớp học là bắt buộc';
        //     }
        //     return null;
        // },
    }), [t]);

    const breadcrumbItems = [
        { label: 'Home', path: '/' },
        { label: 'Admin Dashboard', path: '/admin' },
        { label: 'Class Management', path: '/admin/class'},
    ];

    // Utility function để format date
    const formatDateForInput = useCallback((dateValue: string | Date | null): string => {
        if (!dateValue) return '';

        try {
            const date = new Date(dateValue);
            if (isNaN(date.getTime())) return '';

            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');

            return `${year}-${month}-${day}`;
        } catch (error) {
            console.error('Error formatting date:', error);
            return '';
        }
    }, []);

    // Adapter cho serviceGetById
    const adaptedGetServiceGetById = useCallback(async (id: number): Promise<IClass> => {
        try {
            const classData = await getClassById(id);

            const processedClassData: IClass = {
                ...classData,
                teacherId: classData.teacherId,
                courseId: classData.courseId,
                startDate: formatDateForInput(classData.startDate),
                endDate: formatDateForInput(classData.endDate),
            };

            return processedClassData;
        } catch (error) {
            console.error("Adapter failed to fetch class:", error);
            throw error;
        }
    }, [teachers, courses, formatDateForInput]);

    return (
        <FormTemplate<IClass, CreateClassRequest, UpdateClassRequest>
            pageTitleKey="lớp học"
            breadcrumbItems={breadcrumbItems}
            formFields={classFormFields}
            serviceGetById={adaptedGetServiceGetById}
            serviceCreate={createClass}
            serviceUpdate={updateClass}
            validationSchema={classValidationSchema}
            redirectPath="/admin/class/view/:id"
        />
    );
};

export default ClassForm;