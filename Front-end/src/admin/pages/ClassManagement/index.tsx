import React, { useEffect, useCallback } from "react";
import ManagementTemplate, { type ActionButton } from "../../template/ManagementTemplate";
import type { SearchField, SortField } from "../../template/ManagementTemplate/FilterOption.tsx";
import { useTranslation } from "react-i18next";
import {FaEdit, FaTrash, FaPlusSquare, FaBookOpen, FaEye, FaToggleOn, FaToggleOff} from 'react-icons/fa'; // Các icon phù hợp hơn

import {
    getClasses,
    deleteClass,
    createClass,
    IClass,
    GetClassesOptions,
    GetClassesResult, toggleClassStatus
} from "../../../shared/services/classManagementService.ts";

import { getUsersByRole, type IUser } from '../../../shared/services/authService.ts';

import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../../../shared/notification/useNotification.ts";
import {toggleUserActiveStatus} from "../../../shared/services/userService.ts";

const ClassManagement: React.FC = () => {
    const { message, modal } = useNotification();
    const { t } = useTranslation();
    const navigate = useNavigate();

    // Thay đổi state từ prompts thành classes
    const [classes, setClasses] = React.useState<IClass[]>([]);
    const [totalClasses, setTotalClasses] = React.useState(0);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    // Thêm state để lưu danh sách teachers
    const [teachers, setTeachers] = React.useState<IUser[]>([]);
    const [teachersLoaded, setTeachersLoaded] = React.useState(false);

    const [currentFilters, setCurrentFilters] = React.useState<Record<string, string>>({});
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

    // Effect để load danh sách teachers
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

        fetchTeachers();
    }, []);

    // Hàm tiện ích để cập nhật URL (giữ nguyên logic)
    const updateUrl = useCallback(() => {
        const params = new URLSearchParams();

        for (const key in currentFilters) {
            if (currentFilters[key]) {
                params.set(key, currentFilters[key]);
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

    // Logic đọc trạng thái từ URL khi component được tải (giữ nguyên logic)
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);

        const filters: Record<string, string> = {};
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
            const newFilters: Record<string, string> = {};
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

    // Logic tìm nạp dữ liệu (thay đổi gọi API)
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const options: GetClassesOptions = {
                page: currentPage,
                limit: entriesPerPage,
                sortBy: currentSortColumn || undefined,
                sortOrder: currentSortOrder || undefined,
                // Thay đổi các filter theo ClassDto
                name: currentFilters.name || undefined,
                teacherId: currentFilters.teacherId ? parseInt(currentFilters.teacherId, 10) : undefined,
                section: currentFilters.section || undefined,
                subject: currentFilters.subject || undefined,
                status:
                    currentFilters.status !== '' && currentFilters.status !== undefined
                        ? parseInt(currentFilters.status, 10)
                        : undefined
            };

            const result = await getClasses(options); // Gọi hàm getClasses mới
            console.log(result);

            setClasses(result.content); // Cập nhật state classes
            setTotalClasses(result.totalElements); // Cập nhật tổng số lớp
            setLoading(false);
        } catch (err: any) {
            console.error("Failed to fetch classes:", err);
            setError(err.message || t('common.errorFetchingData'));
            setLoading(false);
        }
    }, [currentPage, entriesPerPage, currentSortColumn, currentSortOrder, currentFilters, t]);

    // Effect để gọi fetchData và updateUrl khi các state liên quan thay đổi (giữ nguyên logic)
    useEffect(() => {
        fetchData();
        updateUrl();
    }, [fetchData, updateUrl]); // Đã tối ưu dependencies

    // Các cột cho bảng (thay đổi teacherId thành teacherName)
    const dataTableColumns = React.useMemo(() => [
        { key: 'name', label: t('classPage.dataTableColumns.name'), sortable: true },
        {
            key: 'teacherId',
            label: t('classPage.dataTableColumns.teacherName'), // Thay đổi label
            sortable: true,
            render: (value: number | string) => getTeacherName(value) // Render tên thay vì ID
        },
        { key: 'description', label: t('classPage.dataTableColumns.description'), sortable: true },
        // { key: 'section', label: t('classPage.dataTableColumns.section'), sortable: true },
        // { key: 'subject', label: t('classPage.dataTableColumns.subject'), sortable: true },
        // { key: 'room', label: t('classPage.dataTableColumns.room'), sortable: true },
        {
            key: 'createdDate',
            label: t('classPage.dataTableColumns.createdDate'),
            sortable: true,
            render: (value: string | Date) => dayjs(value).format('YYYY-MM-DD HH:mm:ss')
        },
        {
            key: 'modifiedDate',
            label: t('classPage.dataTableColumns.modifiedDate'),
            sortable: true,
            render: (value: string | Date) => value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '-'
        },
        // Thêm các cột khác nếu bạn muốn hiển thị createdBy, modifiedBy
    ], [t, getTeacherName]);

    // Các trường tìm kiếm (cập nhật teacher search field)
    const searchFields: SearchField[] = React.useMemo(() => [
        {
            key: 'name',
            label: t('classPage.searchFields.nameLabel'),
            type: 'text',
            placeholder: t('classPage.searchFields.namePlaceholder'),
            gridSpan: 1
        },
        {
            key: 'teacherId',
            label: t('classPage.searchFields.teacherNameLabel'), // Thay đổi label
            type: 'select', // Thay đổi từ text thành select
            placeholder: t('classPage.searchFields.teacherNamePlaceholder'), // Thay đổi placeholder
            gridSpan: 1,
            searchable: true, // Thêm thuộc tính này để enable search
            showSearch: true, // Alternative property name (tùy implementation)
            filterOption: true, // Enable filtering
            options: [
                { value: '', label: t('common.all') }, // Option "Tất cả"
                ...teachers.map(teacher => ({
                    value: teacher.id.toString(),
                    label: teacher.fullName
                }))
            ]
        },
        {
            key: 'status',
            label: t('classPage.searchFields.statusLabel'), // Nhãn cho field Status
            type: 'select',
            placeholder: t('classPage.searchFields.statusPlaceholder'),
            gridSpan: 1,
            searchable: true,
            showSearch: true,
            filterOption: true,
            options: [
                { value: '', label: t('common.all') },
                { value: 1, label: t('common.active') },
                { value: 0, label: t('common.inactive') }
            ]
        },
        // { key: 'section', label: t('classPage.searchFields.sectionLabel'), type: 'text', placeholder: t('classPage.searchFields.sectionPlaceholder'), gridSpan: 1 },
        // { key: 'subject', label: t('classPage.searchFields.subjectLabel'), type: 'text', placeholder: t('classPage.searchFields.subjectPlaceholder'), gridSpan: 1 }
        // Bạn có thể thêm các trường tìm kiếm khác nếu cần
    ], [t, teachers]);

    // Các trường sắp xếp (giữ nguyên)
    const sortFields: SortField[] = React.useMemo(() => [
        {
            key: 'sortOrder',
            label: t('classPage.sortFields.sortOrderLabel'),
            options: [
                { value: 'asc', label: t('classPage.sortFields.ascending') },
                { value: 'desc', label: t('classPage.sortFields.descending') },
            ],
            gridSpan: 1
        },
        {
            key: 'sortBy',
            label: t('classPage.sortFields.sortByLabel'),
            options: [
                { value: 'name', label: t('classPage.sortFields.name') },
                { value: 'createdDate', label: t('classPage.sortFields.createdDate') },
                { value: 'modifiedDate', label: t('classPage.sortFields.modifiedDate') },
                // Thêm các cột khác có thể sắp xếp
            ],
            gridSpan: 1
        },
    ], [t]);

    // Các hàm xử lý sự kiện (giữ nguyên logic, thay đổi tên hàm và đối tượng)
    const handleSearch = useCallback((filtersFromForm: Record<string, string>) => {
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

    const handleTableSort = useCallback((columnKey: string, sortOrder: 'asc' | 'desc') => {
        setCurrentSortColumn(columnKey);
        setCurrentSortOrder(sortOrder);
    }, []);

    const handleEntriesPerPageChange = useCallback((entries: number) => {
        setEntriesPerPage(entries);
        setCurrentPage(1);
    }, []);

    const handleCreateNew = useCallback(() => {
        navigate("/admin/class/create"); // Đường dẫn đến trang tạo lớp mới
    }, [navigate]);

    const handleViewClassDetails = useCallback((rowData: IClass) => {
        // Chuyển hướng đến đường dẫn chi tiết của lớp học, ví dụ: /admin/class/view/123
        navigate(`/admin/class/view/${rowData.id}`);
    }, [navigate]);

    const handleEditClass = useCallback((rowData: IClass) => {
        navigate(`/admin/class/update/${rowData.id}`); // Đường dẫn đến trang cập nhật lớp
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
                    setError(error.message || t('common.errorDeletingData'));
                    message.error(error.message || t('common.errorDeletingData'));
                } finally {
                    setLoading(false);
                }
            },
            `${t('classPage.confirmDelete')} ${rowData.name || rowData.id}?`
        );
    }, [t, fetchData, modal, message]);

    const handleBulkDelete = useCallback(async (ids: number[]) => {
        if (ids.length === 0) return;

        modal.deleteConfirm(
            t('dataTable.bulkDeleteTitle'),
            async () => {
                try {
                    setLoading(true);
                    await deleteClass(ids);
                    message.success(t('dataTable.bulkDeleteSuccess', { count: ids.length }));
                    await fetchData();
                } catch (error: any) {
                    setError(error.message || t('common.errorDeletingData'));
                    message.error(error.message || t('common.errorDeletingData'));
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
            ? t('classPage.confirmActivate', { name: rowData.name })
            : t('classPage.confirmDeactivate', { name: rowData.name });

        modal.confirm({
            title: t('classPage.confirmToggleTitle'),
            content: confirmMessage,
            onOk: async () => {
                try {
                    setLoading(true);
                    await toggleClassStatus(rowData.id as number, newStatus);
                    message.success(t('classPage.toggleSuccess', { status: newStatus ? t('common.active') : t('common.inactive') }));
                    await fetchData();
                } catch (error) {
                    console.log("Error toggling user active status:", error);
                    setError(t('common.errorUpdatingData'));
                    message.error(t('common.errorUpdatingData'));
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
            tooltip: (rowData: IClass) => rowData.status ? t('classPage.deactivateTooltip') : t('classPage.activateTooltip'),
            color: '#63782b'
        },
        {
            // Nút "Xem chi tiết" sử dụng icon con mắt
            icon: <FaEye />, // Thay FaBookOpen bằng FaEye
            onClick: handleViewClassDetails,
            className: 'text-gray-600 hover:text-gray-900 ml-2',
            tooltip: t('classPage.viewDetailsTooltip'),
            color: '#6c757d'
        },
        // Bỏ FaToggleOn/FaToggleOff nếu không có isActive status
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
    ], [handleEditClass, handleDeleteClass, handleViewClassDetails, t]);

    if (loading && classes.length === 0) {
        return <div>{t('common.loadingData')}</div>;
    }

    if (error) {
        return <div className="text-red-500">{error}</div>;
    }

    return (
        <ManagementTemplate
            pageTitle={t('classPage.title')} // Thay đổi tiêu đề trang
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
            data={classes} // Truyền dữ liệu lớp học
            totalEntries={totalClasses} // Truyền tổng số lớp học
            entriesPerPage={entriesPerPage}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            onSort={handleTableSort}
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

// import React, { useEffect, useCallback } from "react";
// import ManagementTemplate, { type ActionButton } from "../../template/ManagementTemplate";
// import type { SearchField, SortField } from "../../template/ManagementTemplate/FilterOption.tsx";
// import { useTranslation } from "react-i18next";
// import {FaEdit, FaTrash, FaPlusSquare, FaBookOpen, FaEye} from 'react-icons/fa'; // Các icon phù hợp hơn
//
// import {
//     getClasses,
//     deleteClass,
//     createClass, // Nếu bạn muốn thêm tính năng tạo lớp trực tiếp từ đây
//     IClass, // Import interface IClass mới
//     GetClassesOptions,
//     GetClassesResult
// } from "../../../shared/services/classManagementService.ts"; // Thay đổi import sang classService
// import dayjs from "dayjs";
// import { useNavigate } from "react-router-dom";
// import { useNotification } from "../../../shared/notification/useNotification.ts";
//
// const ClassManagement: React.FC = () => {
//     const { message, modal } = useNotification();
//     const { t } = useTranslation();
//     const navigate = useNavigate();
//
//     // Thay đổi state từ prompts thành classes
//     const [classes, setClasses] = React.useState<IClass[]>([]);
//     const [totalClasses, setTotalClasses] = React.useState(0);
//     const [loading, setLoading] = React.useState(true);
//     const [error, setError] = React.useState<string | null>(null);
//
//     const [currentFilters, setCurrentFilters] = React.useState<Record<string, string>>({});
//     const [currentPage, setCurrentPage] = React.useState(1);
//     const [entriesPerPage, setEntriesPerPage] = React.useState(10);
//     const [currentSortColumn, setCurrentSortColumn] = React.useState<string | null>(null);
//     const [currentSortOrder, setCurrentSortOrder] = React.useState<'asc' | 'desc' | null>(null);
//
//     // Hàm tiện ích để cập nhật URL (giữ nguyên logic)
//     const updateUrl = useCallback(() => {
//         const params = new URLSearchParams();
//
//         for (const key in currentFilters) {
//             if (currentFilters[key]) {
//                 params.set(key, currentFilters[key]);
//             }
//         }
//
//         if (currentPage !== 1) {
//             params.set('page', currentPage.toString());
//         }
//         if (entriesPerPage !== 10) {
//             params.set('limit', entriesPerPage.toString());
//         }
//         if (currentSortColumn) {
//             params.set('sortBy', currentSortColumn);
//         }
//         if (currentSortOrder) {
//             params.set('sortOrder', currentSortOrder);
//         }
//
//         window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
//     }, [currentFilters, currentPage, entriesPerPage, currentSortColumn, currentSortOrder]);
//
//     // Logic đọc trạng thái từ URL khi component được tải (giữ nguyên logic)
//     useEffect(() => {
//         const params = new URLSearchParams(window.location.search);
//
//         const filters: Record<string, string> = {};
//         params.forEach((value, key) => {
//             if (!['page', 'limit', 'sortBy', 'sortOrder'].includes(key)) {
//                 filters[key] = value;
//             }
//         });
//         setCurrentFilters(filters);
//
//         setCurrentPage(parseInt(params.get('page') || '1', 10));
//         setEntriesPerPage(parseInt(params.get('limit') || '10', 10));
//         setCurrentSortColumn(params.get('sortBy'));
//         setCurrentSortOrder(params.get('sortOrder') as 'asc' | 'desc' || null);
//
//         const handlePopState = () => {
//             const newParams = new URLSearchParams(window.location.search);
//             const newFilters: Record<string, string> = {};
//             newParams.forEach((value, key) => {
//                 if (!['page', 'limit', 'sortBy', 'sortOrder'].includes(key)) {
//                     newFilters[key] = value;
//                 }
//             });
//             setCurrentFilters(newFilters);
//             setCurrentPage(parseInt(newParams.get('page') || '1', 10));
//             setEntriesPerPage(parseInt(newParams.get('limit') || '10', 10));
//             setCurrentSortColumn(newParams.get('sortBy'));
//             setCurrentSortOrder(newParams.get('sortOrder') as 'asc' | 'desc' || null);
//         };
//
//         window.addEventListener('popstate', handlePopState);
//
//         return () => {
//             window.removeEventListener('popstate', handlePopState);
//         };
//     }, []);
//
//     // Logic tìm nạp dữ liệu (thay đổi gọi API)
//     const fetchData = useCallback(async () => {
//         setLoading(true);
//         setError(null);
//         try {
//             const options: GetClassesOptions = {
//                 page: currentPage,
//                 limit: entriesPerPage,
//                 sortBy: currentSortColumn || undefined,
//                 sortOrder: currentSortOrder || undefined,
//                 // Thay đổi các filter theo ClassDto
//                 name: currentFilters.name || undefined,
//                 teacherId: currentFilters.teacherId ? parseInt(currentFilters.teacherId, 10) : undefined,
//                 section: currentFilters.section || undefined,
//                 subject: currentFilters.subject || undefined
//             };
//
//             const result = await getClasses(options); // Gọi hàm getClasses mới
//             console.log(result);
//
//             setClasses(result.content); // Cập nhật state classes
//             setTotalClasses(result.totalElements); // Cập nhật tổng số lớp
//             setLoading(false);
//         } catch (err: any) {
//             console.error("Failed to fetch classes:", err);
//             setError(err.message || t('common.errorFetchingData'));
//             setLoading(false);
//         }
//     }, [currentPage, entriesPerPage, currentSortColumn, currentSortOrder, currentFilters, t]);
//
//     // Effect để gọi fetchData và updateUrl khi các state liên quan thay đổi (giữ nguyên logic)
//     useEffect(() => {
//         fetchData();
//         updateUrl();
//     }, [fetchData, updateUrl]); // Đã tối ưu dependencies
//
//     // Các cột cho bảng (thay đổi theo ClassDto)
//     const dataTableColumns = React.useMemo(() => [
//         { key: 'name', label: t('classPage.dataTableColumns.name'), sortable: true },
//         { key: 'teacherId', label: t('classPage.dataTableColumns.teacherId'), sortable: true },
//         { key: 'description', label: t('classPage.dataTableColumns.description'), sortable: true },
//         // { key: 'section', label: t('classPage.dataTableColumns.section'), sortable: true },
//         // { key: 'subject', label: t('classPage.dataTableColumns.subject'), sortable: true },
//         // { key: 'room', label: t('classPage.dataTableColumns.room'), sortable: true },
//         {
//             key: 'createdDate',
//             label: t('classPage.dataTableColumns.createdDate'),
//             sortable: true,
//             render: (value: string | Date) => dayjs(value).format('YYYY-MM-DD HH:mm:ss')
//         },
//         {
//             key: 'modifiedDate',
//             label: t('classPage.dataTableColumns.modifiedDate'),
//             sortable: true,
//             render: (value: string | Date) => value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '-'
//         },
//         // Thêm các cột khác nếu bạn muốn hiển thị createdBy, modifiedBy
//     ], [t]);
//
//     // Các trường tìm kiếm (thay đổi theo ClassDto)
//     const searchFields: SearchField[] = React.useMemo(() => [
//         { key: 'name', label: t('classPage.searchFields.nameLabel'), type: 'text', placeholder: t('classPage.searchFields.namePlaceholder'), gridSpan: 1 },
//         { key: 'teacherId', label: t('classPage.searchFields.teacherIdLabel'), type: 'text', placeholder: t('classPage.searchFields.teacherIdPlaceholder'), gridSpan: 1 },
//         // { key: 'section', label: t('classPage.searchFields.sectionLabel'), type: 'text', placeholder: t('classPage.searchFields.sectionPlaceholder'), gridSpan: 1 },
//         // { key: 'subject', label: t('classPage.searchFields.subjectLabel'), type: 'text', placeholder: t('classPage.searchFields.subjectPlaceholder'), gridSpan: 1 }
//         // Bạn có thể thêm các trường tìm kiếm khác nếu cần
//     ], [t]);
//
//     // Các trường sắp xếp (thay đổi theo ClassDto)
//     const sortFields: SortField[] = React.useMemo(() => [
//         {
//             key: 'sortOrder',
//             label: t('classPage.sortFields.sortOrderLabel'),
//             options: [
//                 { value: 'asc', label: t('classPage.sortFields.ascending') },
//                 { value: 'desc', label: t('classPage.sortFields.descending') },
//             ],
//             gridSpan: 1
//         },
//         {
//             key: 'sortBy',
//             label: t('classPage.sortFields.sortByLabel'),
//             options: [
//                 { value: 'name', label: t('classPage.sortFields.name') },
//                 { value: 'createdDate', label: t('classPage.sortFields.createdDate') },
//                 { value: 'modifiedDate', label: t('classPage.sortFields.modifiedDate') },
//                 // Thêm các cột khác có thể sắp xếp
//             ],
//             gridSpan: 1
//         },
//     ], [t]);
//
//     // Các hàm xử lý sự kiện (giữ nguyên logic, thay đổi tên hàm và đối tượng)
//     const handleSearch = useCallback((filtersFromForm: Record<string, string>) => {
//         setCurrentFilters(filtersFromForm);
//         setCurrentPage(1);
//
//         if (filtersFromForm.sortBy) {
//             setCurrentSortColumn(filtersFromForm.sortBy);
//         } else {
//             setCurrentSortColumn(null);
//         }
//         if (filtersFromForm.sortOrder) {
//             setCurrentSortOrder(filtersFromForm.sortOrder as 'asc' | 'desc');
//         } else {
//             setCurrentSortOrder(null);
//         }
//     }, []);
//
//     const handleClear = useCallback(() => {
//         setCurrentFilters({});
//         setCurrentPage(1);
//         setCurrentSortColumn(null);
//         setCurrentSortOrder(null);
//         setEntriesPerPage(10);
//     }, []);
//
//     const handlePageChange = useCallback((page: number) => {
//         setCurrentPage(page);
//     }, []);
//
//     const handleTableSort = useCallback((columnKey: string, sortOrder: 'asc' | 'desc') => {
//         setCurrentSortColumn(columnKey);
//         setCurrentSortOrder(sortOrder);
//     }, []);
//
//     const handleEntriesPerPageChange = useCallback((entries: number) => {
//         setEntriesPerPage(entries);
//         setCurrentPage(1);
//     }, []);
//
//     const handleCreateNew = useCallback(() => {
//         navigate("/admin/class/create"); // Đường dẫn đến trang tạo lớp mới
//     }, [navigate]);
//
//     const handleViewClassDetails = useCallback((rowData: IClass) => {
//         // Chuyển hướng đến đường dẫn chi tiết của lớp học, ví dụ: /admin/class/view/123
//         navigate(`/admin/class/view/${rowData.id}`);
//     }, [navigate]);
//
//     const handleEditClass = useCallback((rowData: IClass) => {
//         navigate(`/admin/class/update/${rowData.id}`); // Đường dẫn đến trang cập nhật lớp
//     }, [navigate]);
//
//     const handleDeleteClass = useCallback(async (rowData: IClass) => {
//         if (!rowData.id) {
//             console.error("Attempted to delete class with no ID:", rowData);
//             message.error(t('common.errorNoIdToDelete'));
//             return;
//         }
//
//         // Tạm thời hardcode teacherId nếu backend của bạn vẫn cần nó ở đây
//         // Nhưng nếu backend chỉ dùng @DeleteMapping("/{ids}") và kiểm tra quyền từ JWT,
//         // thì bạn không cần teacherId ở đây nữa.
//         // const currentTeacherId = 1; // <--- XÓA NẾU BACKEND KIỂM TRA TỪ JWT
//
//         modal.deleteConfirm(
//             t('classPage.deleteTooltip'),
//             async () => {
//                 try {
//                     setLoading(true);
//                     // GỌI HÀM deleteClass VỚI MỘT ID ĐƠN LẺ
//                     // Nếu backend vẫn cần teacherId qua query param, bạn sẽ cần truyền nó vào đây
//                     await deleteClass(rowData.id /*, currentTeacherId */);
//                     message.success(t('classPage.deleteSuccess'));
//                     await fetchData();
//                 } catch (error: any) {
//                     setError(error.message || t('common.errorDeletingData'));
//                     message.error(error.message || t('common.errorDeletingData'));
//                 } finally {
//                     setLoading(false);
//                 }
//             },
//             `${t('classPage.confirmDelete')} ${rowData.name || rowData.id}?`
//         );
//     }, [t, fetchData, modal, message]);
//
//
//     const handleBulkDelete = useCallback(async (ids: number[]) => {
//         if (ids.length === 0) return;
//
//         // Tạm thời hardcode teacherId nếu backend của bạn vẫn cần nó ở đây
//         // const currentTeacherId = 1; // <--- XÓA NẾU BACKEND KIỂM TRA TỪ JWT
//
//         modal.deleteConfirm(
//             t('dataTable.bulkDeleteTitle'),
//             async () => {
//                 try {
//                     setLoading(true);
//                     // GỌI HÀM deleteClass VỚI MỘT MẢNG CÁC ID
//                     // Nếu backend vẫn cần teacherId qua query param, bạn sẽ cần truyền nó vào đây
//                     await deleteClass(ids /*, currentTeacherId */);
//                     message.success(t('dataTable.bulkDeleteSuccess', { count: ids.length }));
//                     await fetchData();
//                 } catch (error: any) {
//                     setError(error.message || t('common.errorDeletingData'));
//                     message.error(error.message || t('common.errorDeletingData'));
//                 } finally {
//                     setLoading(false);
//                 }
//             },
//             `${t('dataTable.confirmBulkDelete')} ${ids.length} ${t('dataTable.selectedItems')}`
//         );
//     }, [t, fetchData, modal, message]);
//
//     // Bỏ hàm togglePromptActiveStatus vì lớp học không có trạng thái active/inactive như prompt
//     // Nếu lớp học có trường status riêng, bạn có thể tạo hàm tương tự.
//
//     const classActions = React.useMemo(() => [
//         {
//             // Nút "Xem chi tiết" sử dụng icon con mắt
//             icon: <FaEye />, // Thay FaBookOpen bằng FaEye
//             onClick: handleViewClassDetails,
//             className: 'text-gray-600 hover:text-gray-900 ml-2',
//             tooltip: t('classPage.viewDetailsTooltip'),
//             color: '#6c757d'
//         },
//         // Bỏ FaToggleOn/FaToggleOff nếu không có isActive status
//         {
//             icon: <FaEdit />,
//             onClick: handleEditClass,
//             className: 'text-blue-500 hover:text-blue-700 ml-2',
//             tooltip: t('classPage.editTooltip'),
//             color: '#7600ff'
//         },
//         {
//             icon: <FaTrash />,
//             onClick: handleDeleteClass,
//             className: 'text-red-500 hover:text-red-700 ml-2',
//             tooltip: t('classPage.deleteTooltip'),
//             color: '#f62626'
//         },
//     ], [handleEditClass, handleDeleteClass, handleViewClassDetails, t]);
//
//     if (loading && classes.length === 0) {
//         return <div>{t('common.loadingData')}</div>;
//     }
//
//     if (error) {
//         return <div className="text-red-500">{error}</div>;
//     }
//
//     return (
//         <ManagementTemplate
//             pageTitle={t('classPage.title')} // Thay đổi tiêu đề trang
//             breadcrumbItems={[
//                 { label: t('classPage.breadcrumb.home'), path: '/' },
//                 { label: t('classPage.breadcrumb.adminDashboard'), path: '/admin' },
//                 { label: t('classPage.breadcrumb.classManagement') }, // Thay đổi breadcrumb
//             ]}
//             searchFields={searchFields}
//             sortFields={sortFields}
//             onSearch={handleSearch}
//             onClear={handleClear}
//             columns={dataTableColumns}
//             data={classes} // Truyền dữ liệu lớp học
//             totalEntries={totalClasses} // Truyền tổng số lớp học
//             entriesPerPage={entriesPerPage}
//             currentPage={currentPage}
//             onPageChange={handlePageChange}
//             onSort={handleTableSort}
//             currentSortColumn={currentSortColumn}
//             currentSortOrder={currentSortOrder}
//             onCreateNew={handleCreateNew}
//             onEntriesPerPageChange={handleEntriesPerPageChange}
//             actions={classActions as ActionButton[]}
//             initialFilters={currentFilters}
//             initialSortBy={currentSortColumn}
//             initialSortOrder={currentSortOrder}
//             onBulkDelete={handleBulkDelete}
//         />
//     );
// }
//
// export default ClassManagement;