import ManagementTemplate, {type ActionButton} from "../../template/ManagementTemplate";
import type {SearchField, SortField} from "../../template/ManagementTemplate/FilterOption.tsx";
import {useTranslation} from "react-i18next";
import React, {useCallback, useEffect, useMemo, useState} from "react";
import {useNavigate} from "react-router-dom";
import {FaEdit, FaToggleOff, FaToggleOn, FaTrash} from "react-icons/fa";
import dayjs from 'dayjs';
import {useNotification} from "../../../shared/notification/useNotification.ts";
import {
    deleteAssignment,
    getAssignments,
    type GetAssignmentsOptions,
    type IAssignment, toggleAssignmentActiveStatus
} from "../../../shared/services/assignmentService.ts";

const Assignment: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { message, modal } = useNotification();

    const [assignments, setAssignments] = useState<IAssignment[]>([]);
    const [totalAssignments, setTotalAssignments] = React.useState(0);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    const [currentFilters, setCurrentFilters] = React.useState<Record<string, string>>({});
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [currentSortColumn, setCurrentSortColumn] = useState<string | null>(null);
    const [currentSortOrder, setCurrentSortOrder] = useState<'asc' | 'desc' | null>(null);


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
        if (entriesPerPage !== 10) { // Giả sử 10 là giá trị mặc định ban đầu
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


    // Logic đọc trạng thái từ URL khi component được tải
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

    // Logic tìm nạp dữ liệu
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const options: GetAssignmentsOptions = {
                page: currentPage,
                limit: entriesPerPage,
                sortBy: currentSortColumn || undefined,
                sortOrder: currentSortOrder || undefined,
                name: currentFilters.name || undefined
            };

            const response = await getAssignments(options);
            const formattedAssignments = (response.assignments || []).map(assignment => ({
                ...assignment,
                createdDate: assignment.createdDate
                    ? dayjs(assignment.createdDate).format('YYYY-MM-DD HH:mm:ss')
                    : '',
            }));

            console.log("Fetched assignments:", formattedAssignments);
            setAssignments(formattedAssignments);
            setTotalAssignments(response.total || 0);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch assignments:", err);
            setError(t('common.errorFetchingData'));
            setLoading(false);
        }
    }, [currentPage, entriesPerPage, currentSortColumn, currentSortOrder, currentFilters, t]);

    useEffect(() => {
        fetchData();
        updateUrl();
    }, [fetchData, updateUrl, currentPage, entriesPerPage, currentSortColumn, currentSortOrder, currentFilters]);

    const dataTableColumns = useMemo(() => [
        {
            key: 'title',
            label: t('assignmentPage.columns.name'),
            sortable: true
        },
        {
            key: 'description',
            label: t('assignmentPage.columns.description'),
            sortable: true
        },
        {
            key: 'typeUmlName',
            label: t('assignmentPage.columns.description'),
            sortable: true
        },
        {
            key: 'createdDate',
            label: t('assignmentPage.columns.creationDate'),
            sortable: true
        },
    ], [t]);

    const searchFields: SearchField[] = useMemo(() => [
        {
            key: 'title',
            label: t('assignmentPage.search.name'),
            type: 'text',
            placeholder: t('assignmentPage.search.namePlaceholder'),
            gridSpan: 1
        },
        {
            key: 'startDate',
            label: t('assignmentPage.search.startDate'),
            type: 'datetime',
            gridSpan: 1,
            format: 'YYYY-MM-DD HH:mm:ss' },
        {
            key: 'endDate',
            label: t('assignmentPage.search.endDate'),
            type: 'datetime',
            gridSpan: 1,
            format: 'YYYY-MM-DD HH:mm:ss'
        },
        {
            key: 'globalSearch',
            label: t('assignmentPage.search.global'),
            type: 'text',
            placeholder: t('assignmentPage.search.globalPlaceholder'),
            gridSpan: 2
        },
    ], [t]);

    const sortFields: SortField[] = useMemo(() => [
        {
            key: 'sortOrder',
            label: t('assignmentPage.sort.order'),
            options: [
                { value: 'asc', label: t('assignmentPage.sort.ascending') },
                { value: 'desc', label: t('assignmentPage.sort.descending') },
            ],
            gridSpan: 1
        },
        {
            key: 'orderBy',
            label: t('assignmentPage.sort.by'),
            options: [
                { value: 'name', label: t('assignmentPage.sort.name') },
                { value: 'creationDate', label: t('assignmentPage.sort.creationDate') },
            ],
            gridSpan: 1
        },
    ], [t]);

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


    const handleEditAssignment = useCallback((rowData: IAssignment) => {
        // console.log("Editing assignment:", rowData);
        navigate(`/admin/content/assignments/update/${rowData.id}`);
    }, [t]);

    const handleDeleteAssignment = useCallback(async (rowData: IAssignment) => {
        if (!rowData.id) {
            console.error("Attempted to delete assignment with no ID:", rowData);
            console.log(t('common.errorNoIdToDelete'));
            return;
        }
        modal.deleteConfirm(
            t('assignmentPage.deleteTooltip'),
            async () => {
                try {
                    setLoading(true);
                    await deleteAssignment(rowData.id as number);
                    message.success(t('assignmentPage.deleteSuccess'));
                    await fetchData();
                } catch (error) {
                    setError(t('common.errorDeletingData'));
                    console.error("Error deleting assignment:", error);
                    message.error(t('common.errorDeletingData'));
                } finally {
                    setLoading(false);
                }
            },
            `${t('assignmentPage.confirmDelete')} ${rowData.name || rowData.id}?`
        );
    }, [t, fetchData, modal, message]);

    const handleToggleActiveStatus = useCallback(async (rowData: IAssignment) => {
        if (!rowData.id) return;
        const newStatus = !rowData.isActive;
        const confirmMessage = newStatus
            ? t('assignmentPage.confirmActivate', { name: rowData.name })
            : t('assignmentPage.confirmDeactivate', { name: rowData.name });

        // Đã sửa lỗi: truyền một đối tượng cấu hình duy nhất
        modal.confirm({
            title: t('assignmentPage.confirmToggleTitle'),
            content: confirmMessage,
            onOk: async () => {
                try {
                    setLoading(true);
                    await toggleAssignmentActiveStatus(rowData.id as number, newStatus);
                    message.success(t('assignmentPage.toggleSuccess', { status: newStatus ? t('common.active') : t('common.inactive') }));
                    await fetchData();
                } catch (error) {
                    console.log("Error toggling assignment active status:", error);
                    setError(t('common.errorUpdatingData'));
                    message.error(t('common.errorUpdatingData'));
                } finally {
                    setLoading(false);
                }
            },
        });
    }, [t, fetchData, modal, message]);

    const assignmentActions = React.useMemo(() => [
        {
            icon: (rowData: IAssignment) => rowData.isActive ? <FaToggleOn fontSize={17} /> : <FaToggleOff fontSize={17} />,
            onClick: handleToggleActiveStatus,
            className: (rowData: IAssignment) => rowData.isActive ? 'text-green-500 hover:text-green-700' : 'text-gray-500 hover:text-gray-700',
            tooltip: (rowData: IAssignment) => rowData.isActive ? t('assignmentPage.deactivateTooltip') : t('assignmentPage.activateTooltip'),
            color: '#63782b'
        },
        {
            icon: <FaEdit />,
            onClick: handleEditAssignment,
            className: 'text-blue-500 hover:text-blue-700',
            tooltip: t('assignmentPage.editTooltip'),
            color: '#7600ff'
        },
        {
            icon: <FaTrash />,
            onClick: handleDeleteAssignment,
            className: 'text-red-500 hover:text-red-700 ml-2',
            tooltip: t('assignmentPage.deleteTooltip'),
            color: 'red'
        },
    ], [handleEditAssignment, handleDeleteAssignment, handleToggleActiveStatus, t]);

    if (loading && assignments.length === 0) {
        return <div>{t('common.loadingData')}</div>;
    }

    if (error) {
        return <div className="text-red-500">{error}</div>;
    }

    return (
        <ManagementTemplate
            pageTitle={t('assignmentPage.title')}
            breadcrumbItems={[
                {label: t('common.breadcrumb.home'), path: '/'},
                {label: t('common.breadcrumb.adminDashboard'), path: '/admin'},
                {label: t('assignmentPage.breadcrumb')},
            ]}
            searchFields={searchFields}
            sortFields={sortFields}
            onSearch={handleSearch}
            onClear={handleClear}
            columns={dataTableColumns}
            data={assignments}
            totalEntries={totalAssignments}
            entriesPerPage={entriesPerPage}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            onSort={handleTableSort}
            currentSortColumn={currentSortColumn}
            currentSortOrder={currentSortOrder}
            onEntriesPerPageChange={handleEntriesPerPageChange}
            actions={assignmentActions as ActionButton[]}
            initialFilters={currentFilters}
            initialSortBy={currentSortColumn}
            initialSortOrder={currentSortOrder}
        />
    );
};

export default Assignment;
