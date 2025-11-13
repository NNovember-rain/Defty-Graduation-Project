import React, {useEffect, useCallback} from "react";
import ManagementTemplate, { type ActionButton } from "../../template/ManagementTemplate";
import type { SearchField, SortField } from "../../template/ManagementTemplate/FilterOption.tsx";
import { useTranslation } from "react-i18next";
import { FaEdit, FaTrash, FaEye, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import dayjs from 'dayjs';

import {getClasses, deleteClass, type IClass, type GetClassesOptions, toggleClassStatus} from "../../../shared/services/classManagementService.ts";

import { getUsers, type IUser } from '../../../shared/services/userService.ts';
import { getActiveCourses, type ICourse } from '../../../shared/services/courseService.ts';

import { useNavigate } from "react-router-dom";
import { useNotification } from "../../../shared/notification/useNotification.ts";
import {getUsersByRole} from "../../../shared/services/authService.ts";

const ClassManagement: React.FC = () => {
    const { message, modal } = useNotification();
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [classes, setClasses] = React.useState<IClass[]>([]);
    const [totalClasses, setTotalClasses] = React.useState(0);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    const [teachers, setTeachers] = React.useState<IUser[]>([]);
    const [courses, setCourses] = React.useState<ICourse[]>([]);
    const [teachersLoaded, setTeachersLoaded] = React.useState(false);
    const [coursesLoaded, setCoursesLoaded] = React.useState(false);

    const [currentFilters, setCurrentFilters] = React.useState<Record<string, any>>({});
    const [currentPage, setCurrentPage] = React.useState(1);
    const [entriesPerPage, setEntriesPerPage] = React.useState(10);
    const [currentSortColumn, setCurrentSortColumn] = React.useState<string | null>(null);
    const [currentSortOrder, setCurrentSortOrder] = React.useState<'asc' | 'desc' | null>(null);

    // Hàm để lấy tên giáo viên từ ID
    const getTeacherName = useCallback((teacherId: number | string): string => {
        if (!teachersLoaded) return 'Loading...';

        const teacher = teachers.find(t => t.id === teacherId.toString() || t.id === teacherId);
        return teacher ? teacher.fullName : `Unknown (ID: ${teacherId})`;
    }, [teachers, teachersLoaded]);


    const getCourseName = useCallback((courseId: number | string): string => {
        if (!coursesLoaded) return "Loading...";
        if (!courseId) return "-";

        const course = courses.find(
            (c) => String(c.id).trim() === String(courseId).trim()
        );

        if (!course) {
            console.warn(`Không tìm thấy courseId=${courseId}`);
            return `Unknown (ID: ${courseId})`;
        }

        return course.courseName;
    }, [courses, coursesLoaded]);

    // Load teachers, assistants and courses
    useEffect(() => {
        const fetchTeachers = async () => {
            try {
                const teacherList = await getUsersByRole(3); // Role 3 = teacher
                setTeachers(teacherList);
                setTeachersLoaded(true);
            } catch (err) {
                console.error("Failed to fetch teachers:", err);
                setTeachersLoaded(true); // Set true để không hiển thị "Loading..." mãi
            }
        };

        const fetchCoursesData = async () => {
            try {
                const coursesData = await getActiveCourses();
                setCourses(coursesData);
                setCoursesLoaded(true);
            } catch (err) {
                console.error("Failed to fetch courses:", err);
                setCoursesLoaded(true);
            }
        };

        fetchTeachers();
        fetchCoursesData();
    }, []);

    const updateUrl = useCallback(() => {
        const params = new URLSearchParams();

        for (const key in currentFilters) {
            const value = currentFilters[key];
            if (value !== undefined && value !== null && value !== '') {
                if (Array.isArray(value) && value.length > 0) {
                    params.set(key, value.join(','));
                } else if (!Array.isArray(value)) {
                    params.set(key, String(value));
                }
            }
        }

        if (currentPage !== 1) {
            params.set('page', currentPage.toString());
        }
        if (entriesPerPage !== 10) {
            params.set('limit', entriesPerPage.toString());
        }
        if (currentSortColumn) {
            params.set('sortBy', currentSortColumn);
        }
        if (currentSortOrder) {
            params.set('sortOrder', currentSortOrder);
        }

        window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
    }, [currentFilters, currentPage, entriesPerPage, currentSortColumn, currentSortOrder]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);

        const filters: Record<string, any> = {};
        params.forEach((value, key) => {
            if (!['page', 'limit', 'sortBy', 'sortOrder'].includes(key)) {
                filters[key] = value;
            }
        });
        setCurrentFilters(filters);

        setCurrentPage(parseInt(params.get('page') || '1', 10));
        setEntriesPerPage(parseInt(params.get('limit') || '10', 10));
        setCurrentSortColumn(params.get('sortBy'));
        setCurrentSortOrder(params.get('sortOrder') as 'asc' | 'desc' || null);

        const handlePopState = () => {
            const newParams = new URLSearchParams(window.location.search);
            const newFilters: Record<string, any> = {};
            newParams.forEach((value, key) => {
                if (!['page', 'limit', 'sortBy', 'sortOrder'].includes(key)) {
                    newFilters[key] = value;
                }
            });
            setCurrentFilters(newFilters);
            setCurrentPage(parseInt(newParams.get('page') || '1', 10));
            setEntriesPerPage(parseInt(newParams.get('limit') || '10', 10));
            setCurrentSortColumn(newParams.get('sortBy'));
            setCurrentSortOrder(newParams.get('sortOrder') as 'asc' | 'desc' || null);
        };

        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, []);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const options: GetClassesOptions = {
                page: currentPage,
                limit: entriesPerPage,
                sortBy: currentSortColumn || undefined,
                sortOrder: currentSortOrder || undefined,
                className: currentFilters.className || undefined,
                teacherId: currentFilters.teacherId ? parseInt(currentFilters.teacherId, 10) : undefined,
                courseId: currentFilters.courseId ? parseInt(currentFilters.courseId, 10) : undefined, // Thêm courseId filter
                status: currentFilters.status !== '' && currentFilters.status !== undefined
                    ? parseInt(currentFilters.status, 10)
                    : undefined,
            };

            const result = await getClasses(options);

            if (result && result.content) {
                setClasses(result.content || []);
                setTotalClasses(result.totalElements || 0);
            } else {
                console.error('Unexpected API response structure:', result);
                setError(t('common.errorFetchingData'));
            }
        } catch (err: any) {
            console.error("Failed to fetch classes:", err);
            const errorMessage = err?.response?.data?.message || err?.message || t('common.errorFetchingData');
            setError(errorMessage);
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [currentPage, entriesPerPage, currentSortColumn, currentSortOrder, currentFilters, t, message]);

    useEffect(() => {
        fetchData();
    }, [currentPage, entriesPerPage, currentSortColumn, currentSortOrder, currentFilters]);

    useEffect(() => {
        updateUrl();
    }, [currentFilters, currentPage, entriesPerPage, currentSortColumn, currentSortOrder]);

    const dataTableColumns = React.useMemo(() => [
        {
            key: 'className',
            label: 'Tên lớp học',
            sortable: true
        },
        {
            key: 'courseId',
            label: 'Khóa học',
            sortable: true,
            render: (value: number | string) => getCourseName(value)
        },
        {
            key: 'teacherId',
            label: 'Giáo viên',
            sortable: true,
            render: (value: number | string) => getTeacherName(value)
        },
        {
            key: 'currentStudents',
            label: 'Số học viên',
            sortable: true
        },
        {
            key: 'createdDate',
            label: 'Ngày tạo',
            sortable: true,
            render: (value: string | Date) => {
                try {
                    return dayjs(value).format('YYYY-MM-DD HH:mm');
                } catch {
                    return value ? String(value) : '-';
                }
            }
        },
        {
            key: 'modifiedDate',
            label: 'Ngày chỉnh sửa',
            sortable: true,
            render: (value: string | Date) => {
                if (!value) return '-';
                try {
                    return dayjs(value).format('YYYY-MM-DD HH:mm');
                } catch {
                    return String(value);
                }
            }
        },
    ], [getTeacherName, getCourseName]);

    const searchFields: SearchField[] = React.useMemo(() => [
        {
            key: 'className',
            label: 'Tên lớp học',
            type: 'text',
            placeholder: 'Nhập tên lớp học',
            gridSpan: 1
        },
        {
            key: 'courseId',
            label: 'Khóa học',
            type: 'select',
            placeholder: 'Chọn khóa học',
            gridSpan: 1,
            searchable: true,
            showSearch: true,
            filterOption: true,
            options: [
                { value: '', label: t('common.all') },
                ...courses.map(course => ({
                    value: course.id.toString(),
                    label: course.courseName
                }))
            ]
        },
        {
            key: 'teacherId',
            label: 'Giáo viên',
            type: 'select',
            placeholder: 'Chọn giáo viên',
            gridSpan: 1,
            searchable: true,
            showSearch: true,
            filterOption: true,
            options: [
                { value: '', label: t('common.all') },
                ...teachers.map(teacher => ({
                    value: teacher.id,
                    label: teacher.fullName
                }))
            ]
        },
        {
            key: 'classType',
            label: 'Loại lớp',
            type: 'select',
            placeholder: 'Chọn loại lớp',
            gridSpan: 1,
            searchable: true,
            showSearch: true,
            filterOption: true,
            options: [
                { value: 'ONLINE', label: 'Trực tuyến' },
                { value: 'OFFLINE', label: 'Trực tiếp' },
                { value: 'ONEONONE', label: '1 kèm 1' }
            ]
        },
        {
            key: 'status',
            label: 'Trạng thái',
            type: 'select',
            placeholder: 'Chọn trạng thái',
            gridSpan: 1,
            options: [
                { value: '1', label: 'Hoạt động' },
                { value: '0', label: 'Ngừng hoạt động' }
            ]
        },
    ], [teachers, courses]);

    const sortFields: SortField[] = React.useMemo(() => [], []);

    const handleSearch = useCallback((filtersFromForm: Record<string, any>) => {
        setCurrentFilters(filtersFromForm);
        setCurrentPage(1);

        if (filtersFromForm.sortBy) {
            setCurrentSortColumn(filtersFromForm.sortBy);
        } else {
            setCurrentSortColumn(null);
        }
        if (filtersFromForm.sortOrder) {
            setCurrentSortOrder(filtersFromForm.sortOrder as 'asc' | 'desc');
        } else {
            setCurrentSortOrder(null);
        }
    }, []);

    const handleClear = useCallback(() => {
        setCurrentFilters({});
        setCurrentPage(1);
        setCurrentSortColumn(null);
        setCurrentSortOrder(null);
        setEntriesPerPage(10);
    }, []);

    const handlePageChange = useCallback((page: number) => {
        setCurrentPage(page);
    }, []);

    const handleEntriesPerPageChange = useCallback((entries: number) => {
        setEntriesPerPage(entries);
        setCurrentPage(1);
    }, []);

    const handleCreateNew = useCallback(() => {
        navigate("/admin/class/create");
    }, [navigate]);

    const handleViewClassDetails = useCallback((rowData: IClass) => {
        navigate(`/admin/class/view/${rowData.id}`);
    }, [navigate]);

    const handleEditClass = useCallback((rowData: IClass) => {
        navigate(`/admin/class/update/${rowData.id}`);
    }, [navigate]);

    const handleDeleteClass = useCallback(async (rowData: IClass) => {
        if (!rowData.id) {
            console.error("Attempted to delete class with no ID:", rowData);
            message.error(t('common.errorNoIdToDelete'));
            return;
        }

        modal.deleteConfirm(
            t('classPage.deleteTooltip'),
            async () => {
                try {
                    setLoading(true);
                    await deleteClass(rowData.id);
                    message.success(t('classPage.deleteSuccess'));
                    await fetchData();
                } catch (error: any) {
                    const errorMessage = error?.response?.data?.message || error?.message || t('common.errorDeletingData');
                    setError(errorMessage);
                    message.error(errorMessage);
                } finally {
                    setLoading(false);
                }
            },
            `${t('classPage.confirmDelete')} ${rowData.className || rowData.id}?`
        );
    }, [t, fetchData, modal, message]);

    const handleBulkDelete = useCallback(async (ids: string[]) => {
        if (ids.length === 0) return;

        const numericIds = ids.map(id => Number(id));

        modal.deleteConfirm(
            t('dataTable.bulkDeleteTitle'),
            async () => {
                try {
                    setLoading(true);
                    await deleteClass(numericIds);
                    message.success(t('dataTable.bulkDeleteSuccess', { count: numericIds.length }));
                    await fetchData();
                } catch (error: any) {
                    const errorMessage = error?.response?.data?.message || error?.message || t('common.errorDeletingData');
                    setError(errorMessage);
                    message.error(errorMessage);
                } finally {
                    setLoading(false);
                }
            },
            `${t('dataTable.confirmBulkDelete')} ${ids.length} ${t('dataTable.selectedItems')}`
        );
    }, [t, fetchData, modal, message]);

    const handleToggleActiveStatus = useCallback(async (rowData: IClass) => {
        if (!rowData.id) return;
        const newStatus = rowData.status === 1 ? 0 : 1;

        const confirmMessage = newStatus
            ? `Bạn có chắc chắn muốn kích hoạt lớp học "${rowData.className}" không?`
            : `Bạn có chắc chắn muốn ngưng hoạt động lớp học "${rowData.className}" không?`;

        modal.confirm({
            title: 'Xác nhận thay đổi trạng thái lớp học',
            content: confirmMessage,
            onOk: async () => {
                try {
                    setLoading(true);
                    await toggleClassStatus(rowData.id as number, newStatus);

                    message.success(`Cập nhật thành công, trạng thái: ${newStatus ? 'Đang hoạt động' : 'Ngưng hoạt động'}`);

                    await fetchData();
                } catch (error: any) {
                    console.error("Error toggling class active status:", error);
                    const errorMessage = error?.response?.data?.message || error?.message || "Có lỗi xảy ra khi cập nhật dữ liệu";
                    setError(errorMessage);
                    message.error(errorMessage);
                } finally {
                    setLoading(false);
                }
            },
        });

    }, [t, fetchData, modal, message]);

    const classActions = React.useMemo(() => [
        {
            icon: (rowData: IClass) => rowData.status ? <FaToggleOn fontSize={17} /> : <FaToggleOff fontSize={17} />,
            onClick: handleToggleActiveStatus,
            className: (rowData: IClass) => rowData.status ? 'text-green-500 hover:text-green-700' : 'text-gray-500 hover:text-gray-700',
            tooltip: (rowData: IClass) => rowData.status ? 'Ngưng hoạt động' : 'Kích hoạt',
            color: '#63782b'
        },
        {
            icon: <FaEye />,
            onClick: handleViewClassDetails,
            className: 'text-gray-600 hover:text-gray-900 ml-2',
            tooltip: t('classPage.viewDetailsTooltip'),
            color: '#6c757d'
        },
        {
            icon: <FaEdit />,
            onClick: handleEditClass,
            className: 'text-blue-500 hover:text-blue-700 ml-2',
            tooltip: t('classPage.editTooltip'),
            color: '#7600ff'
        },
        {
            icon: <FaTrash />,
            onClick: handleDeleteClass,
            className: 'text-red-500 hover:text-red-700 ml-2',
            tooltip: t('classPage.deleteTooltip'),
            color: '#f62626'
        },
    ], [handleEditClass, handleDeleteClass, handleViewClassDetails, handleToggleActiveStatus, t]);

    // Loading and error states
    if (loading && classes.length === 0) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-lg">{t('common.loadingData')}</div>
            </div>
        );
    }

    if (error && classes.length === 0) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-red-500 text-center">
                    <p className="text-lg font-semibold">{t('common.error')}</p>
                    <p className="mt-2">{error}</p>
                    <button
                        onClick={fetchData}
                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        {t('common.retry')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <ManagementTemplate
            pageTitle={t('classPage.title')}
            breadcrumbItems={[
                { label: t('classPage.breadcrumb.home'), path: '/' },
                { label: t('classPage.breadcrumb.adminDashboard'), path: '/admin' },
                { label: t('classPage.breadcrumb.classManagement') },
            ]}
            searchFields={searchFields}
            sortFields={sortFields}
            onSearch={handleSearch}
            onClear={handleClear}
            columns={dataTableColumns}
            data={classes}
            totalEntries={totalClasses}
            entriesPerPage={entriesPerPage}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            currentSortColumn={currentSortColumn}
            currentSortOrder={currentSortOrder}
            onCreateNew={handleCreateNew}
            onEntriesPerPageChange={handleEntriesPerPageChange}
            actions={classActions as ActionButton[]}
            initialFilters={currentFilters}
            initialSortBy={currentSortColumn}
            initialSortOrder={currentSortOrder}
            onBulkDelete={handleBulkDelete}
        />
    );
}

export default ClassManagement;