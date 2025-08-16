import ManagementTemplate, {type ActionButton} from "../../template/ManagementTemplate";
import type {SearchField, SortField} from "../../template/ManagementTemplate/FilterOption.tsx";
import {useTranslation} from "react-i18next";
import React, {useCallback, useEffect, useMemo, useState} from "react";
import {useNavigate} from "react-router-dom";
import {FaEdit, FaToggleOff, FaToggleOn, FaTrash} from "react-icons/fa";
import dayjs from 'dayjs';
import {useNotification} from "../../../shared/notification/useNotification.ts";
import {
    deletePermission,
    getPermissions,
    type GetPermissionsOptions,
    type IPermission, togglePermissionActiveStatus
} from "../../../shared/services/permissionService.ts";

const Permission: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { message, modal } = useNotification();

    const [permissions, setPermissions] = useState<IPermission[]>([]);
    const [totalPermissions, setTotalPermissions] = React.useState(0);
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
            const options: GetPermissionsOptions = {
                page: currentPage,
                limit: entriesPerPage,
                sortBy: currentSortColumn || undefined,
                sortOrder: currentSortOrder || undefined,
                name: currentFilters.name || undefined
            };

            const response = await getPermissions(options);
            const formattedPermissions = (response.permissions || []).map(permission => ({
                ...permission,
                createdDate: permission.createdDate
                    ? dayjs(permission.createdDate).format('YYYY-MM-DD HH:mm:ss')
                    : '',
            }));

            // console.log("Fetched permissions:", formattedPermissions);
            setPermissions(formattedPermissions);
            setTotalPermissions(response.total || 0);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch permissions:", err);
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
            key: 'name',
            label: t('permissionPage.columns.name'),
            sortable: true
        },
        {
            key: 'description',
            label: t('permissionPage.columns.description'),
            sortable: true
        },
        {
            key: 'createdDate',
            label: t('permissionPage.columns.creationDate'),
            sortable: true
        },
    ], [t]);

    const searchFields: SearchField[] = useMemo(() => [
        {
            key: 'name',
            label: t('permissionPage.search.name'),
            type: 'text',
            placeholder: t('permissionPage.search.namePlaceholder'),
            gridSpan: 1
        },
        {
            key: 'globalSearch',
            label: t('permissionPage.search.global'),
            type: 'text',
            placeholder: t('permissionPage.search.globalPlaceholder'),
            gridSpan: 2
        },
    ], [t]);

    const sortFields: SortField[] = useMemo(() => [
        {
            key: 'sortOrder',
            label: t('permissionPage.sort.order'),
            options: [
                { value: 'asc', label: t('permissionPage.sort.ascending') },
                { value: 'desc', label: t('permissionPage.sort.descending') },
            ],
            gridSpan: 1
        },
        {
            key: 'orderBy',
            label: t('permissionPage.sort.by'),
            options: [
                { value: 'name', label: t('permissionPage.sort.name') },
                { value: 'creationDate', label: t('permissionPage.sort.creationDate') },
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

    const handleCreateNew = useCallback(() => {
        navigate("/admin/auth/permissions/create");
    }, [t]);

    const handleEditPermission = useCallback((rowData: IPermission) => {
        // console.log("Editing permission:", rowData);
        navigate(`/admin/auth/permissions/update/${rowData.id}`);
    }, [t]);

    const handleDeletePermission = useCallback(async (rowData: IPermission) => {
        if (!rowData.id) {
            console.error("Attempted to delete permission with no ID:", rowData);
            console.log(t('common.errorNoIdToDelete'));
            return;
        }
        modal.deleteConfirm(
            t('permissionPage.deleteTooltip'),
            async () => {
                try {
                    setLoading(true);
                    await deletePermission(rowData.id as number);
                    message.success(t('permissionPage.deleteSuccess'));
                    await fetchData();
                } catch (error) {
                    setError(t('common.errorDeletingData'));
                    console.error("Error deleting permission:", error);
                    message.error(t('common.errorDeletingData'));
                } finally {
                    setLoading(false);
                }
            },
            `${t('permissionPage.confirmDelete')} ${rowData.name || rowData.id}?`
        );
    }, [t, fetchData, modal, message]);

    const handleToggleActiveStatus = useCallback(async (rowData: IPermission) => {
        if (!rowData.id) return;
        const newStatus = !rowData.isActive;
        const confirmMessage = newStatus
            ? t('permissionPage.confirmActivate', { name: rowData.name })
            : t('permissionPage.confirmDeactivate', { name: rowData.name });

        // Đã sửa lỗi: truyền một đối tượng cấu hình duy nhất
        modal.confirm({
            title: t('permissionPage.confirmToggleTitle'),
            content: confirmMessage,
            onOk: async () => {
                try {
                    setLoading(true);
                    await togglePermissionActiveStatus(rowData.id as number, newStatus);
                    message.success(t('permissionPage.toggleSuccess', { status: newStatus ? t('common.active') : t('common.inactive') }));
                    await fetchData();
                } catch (error) {
                    console.log("Error toggling permission active status:", error);
                    setError(t('common.errorUpdatingData'));
                    message.error(t('common.errorUpdatingData'));
                } finally {
                    setLoading(false);
                }
            },
        });
    }, [t, fetchData, modal, message]);

    const permissionActions = React.useMemo(() => [
        {
            icon: (rowData: IPermission) => rowData.isActive ? <FaToggleOn fontSize={17} /> : <FaToggleOff fontSize={17} />,
            onClick: handleToggleActiveStatus,
            className: (rowData: IPermission) => rowData.isActive ? 'text-green-500 hover:text-green-700' : 'text-gray-500 hover:text-gray-700',
            tooltip: (rowData: IPermission) => rowData.isActive ? t('permissionPage.deactivateTooltip') : t('permissionPage.activateTooltip'),
            color: '#63782b'
        },
        {
            icon: <FaEdit />,
            onClick: handleEditPermission,
            className: 'text-blue-500 hover:text-blue-700',
            tooltip: t('permissionPage.editTooltip'),
            color: '#7600ff'
        },
        {
            icon: <FaTrash />,
            onClick: handleDeletePermission,
            className: 'text-red-500 hover:text-red-700 ml-2',
            tooltip: t('permissionPage.deleteTooltip'),
            color: 'red'
        },
    ], [handleEditPermission, handleDeletePermission, handleToggleActiveStatus, t]);

    if (loading && permissions.length === 0) {
        return <div>{t('common.loadingData')}</div>;
    }

    if (error) {
        return <div className="text-red-500">{error}</div>;
    }

    return (
        <ManagementTemplate
            pageTitle={t('permissionPage.title')}
            breadcrumbItems={[
                {label: t('common.breadcrumb.home'), path: '/'},
                {label: t('common.breadcrumb.adminDashboard'), path: '/admin'},
                {label: t('permissionPage.breadcrumb')},
            ]}
            searchFields={searchFields}
            sortFields={sortFields}
            onSearch={handleSearch}
            onClear={handleClear}
            columns={dataTableColumns}
            data={permissions}
            totalEntries={totalPermissions}
            entriesPerPage={entriesPerPage}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            onSort={handleTableSort}
            currentSortColumn={currentSortColumn}
            currentSortOrder={currentSortOrder}
            onCreateNew={handleCreateNew}
            onEntriesPerPageChange={handleEntriesPerPageChange}
            actions={permissionActions as ActionButton[]}
            initialFilters={currentFilters}
            initialSortBy={currentSortColumn}
            initialSortOrder={currentSortOrder}
        />
    );
};

export default Permission;
