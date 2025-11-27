import ManagementTemplate, {type ActionButton} from "../../template/ManagementTemplate";
import type {SearchField, SortField} from "../../template/ManagementTemplate/FilterOption.tsx";
import {useTranslation} from "react-i18next";
import React, {useCallback, useEffect, useMemo, useState} from "react";
import {useNavigate} from "react-router-dom";
import {FaEdit, FaToggleOff, FaToggleOn, FaTrash} from "react-icons/fa";
import {
    deleteUser,
    getUsers,
    type GetUsersOptions,
    type IUser,
    toggleUserActiveStatus
} from "../../../shared/services/userService.ts";
import {useNotification} from "../../../shared/notification/useNotification.ts";
import dayjs from "dayjs";

const User: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [users, setUsers] = useState<IUser[]>([]);
    const { message, modal } = useNotification();
    const [totalUsers, setTotalUsers] = React.useState(0);
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
            const options: GetUsersOptions = {
                page: currentPage,
                limit: entriesPerPage,
                sortBy: currentSortColumn || undefined,
                sortOrder: currentSortOrder || undefined,
                username: currentFilters.username || undefined,
                email: currentFilters.email || undefined,
            };

            const response = await getUsers(options);
            const formattedUsers = (response.users || []).map(user => ({
                ...user,
                createdDate: user.createdDate
                    ? dayjs(user.createdDate).format('YYYY-MM-DD HH:mm:ss')
                    : '',
            }));
            // console.log("Fetched users:", response);
            setUsers(formattedUsers);
            setTotalUsers(response.total || 0);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch users:", err);
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
            key: 'fullName',
            label: t('userPage.columns.name'),
            sortable: false,
        },
        {
            key: 'username',
            label: t('userPage.columns.username'),
            sortable: true
        },
        {
            key: 'dob',
            label: t('userPage.columns.dob'),
            sortable: true
        },
        {
            key: 'email',
            label: t('userPage.columns.email'),
            sortable: true
        },
        {
            key: 'userCode',
            label: t('userPage.columns.userCode'),
            sortable: true
        },
        {
            key: 'roles',
            label: t('userPage.columns.roles'),
            sortable: false,
            render: (_value: any, row: any) => row.roles?.map((r: any) => r.name).join(', ')
        },
        {
            key: 'createdDate',
            label: t('userPage.columns.creationDate'),
            sortable: true
        },
    ], [t]);

    const searchFields: SearchField[] = useMemo(() => [
        {
            key: 'username',
            label: t('userPage.search.username'),
            type: 'text',
            placeholder: t('userPage.search.namePlaceholder'),
            gridSpan: 1
        },
        {
            key: 'globalSearch',
            label: t('userPage.search.global'),
            type: 'text',
            placeholder: t('userPage.search.globalPlaceholder'),
            gridSpan: 2
        },
    ], [t]);

    const sortFields: SortField[] = useMemo(() => [
        {
            key: 'sortOrder',
            label: t('userPage.sort.order'),
            options: [
                { value: 'asc', label: t('userPage.sort.ascending') },
                { value: 'desc', label: t('userPage.sort.descending') },
            ],
            gridSpan: 1
        },
        {
            key: 'orderBy',
            label: t('userPage.sort.by'),
            options: [
                { value: 'name', label: t('userPage.sort.name') },
                { value: 'creationDate', label: t('userPage.sort.creationDate') },
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
        navigate("/admin/users/create");
    }, [t]);

    const handleEditUser = useCallback((rowData: IUser) => {
        navigate(`/admin/users/update/${rowData.id}`);
    }, [t]);

    const handleDeleteUser = useCallback(async (rowData: IUser) => {
        if (!rowData.id) {
            console.error("Attempted to delete user with no ID:", rowData);
            console.log(t('common.errorNoIdToDelete'));
            return;
        }
        modal.deleteConfirm(
            t('common.confirm'),
            async () => {
                try {
                    setLoading(true);
                    await deleteUser(rowData.id as number);
                    message.success(t('common.deleteSuccess'));
                    await fetchData();
                } catch (error) {
                    setError(t('common.errorDeletingData'));
                    console.error("Error deleting user:", error);
                    message.error(t('common.errorDeletingData'));
                } finally {
                    setLoading(false);
                }
            },
            `${t('common.confirmDeleteContent')} ${rowData.username || rowData.id}?`
        );
    }, [t, fetchData, modal, message]);

    const handleToggleActiveStatus = useCallback(async (rowData: IUser) => {
        if (!rowData.id) return;
        const newStatus = !rowData.isActive;
        const confirmMessage = newStatus
            ? t('userPage.confirmActivate', { name: rowData.username })
            : t('userPage.confirmDeactivate', { name: rowData.username });

        // Đã sửa lỗi: truyền một đối tượng cấu hình duy nhất
        modal.confirm({
            title: t('userPage.confirmToggleTitle'),
            content: confirmMessage,
            onOk: async () => {
                try {
                    setLoading(true);
                    await toggleUserActiveStatus(rowData.id as number, newStatus);
                    message.success(t('userPage.toggleSuccess', { status: newStatus ? t('common.active') : t('common.inactive') }));
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


    const userActions = React.useMemo(() => [
        {
            icon: (rowData: IUser) => rowData.isActive ? <FaToggleOn fontSize={17} /> : <FaToggleOff fontSize={17} />,
            onClick: handleToggleActiveStatus,
            className: (rowData: IUser) => rowData.isActive ? 'text-green-500 hover:text-green-700' : 'text-gray-500 hover:text-gray-700',
            tooltip: (rowData: IUser) => rowData.isActive ? t('userPage.deactivateTooltip') : t('userPage.activateTooltip'),
            color: '#63782b'
        },
        {
            icon: <FaEdit />,
            onClick: handleEditUser,
            className: 'text-blue-500 hover:text-blue-700',
            tooltip: t('userPage.editTooltip'),
            color: '#7600ff'
        },
        {
            icon: <FaTrash />,
            onClick: handleDeleteUser,
            className: 'text-red-500 hover:text-red-700 ml-2',
            tooltip: t('userPage.deleteTooltip'),
            color: 'red'
        },
    ], [handleEditUser, handleDeleteUser, handleToggleActiveStatus, t]);

    if (loading && users.length === 0) {
        return <div>{t('common.loadingData')}</div>;
    }

    if (error) {
        return <div className="text-red-500">{error}</div>;
    }

    return (
        <ManagementTemplate
            pageTitle={t('userPage.title')}
            breadcrumbItems={[
                {label: t('common.breadcrumb.home'), path: '/'},
                {label: t('common.breadcrumb.adminDashboard'), path: '/admin'},
                {label: t('userPage.breadcrumb')},
            ]}
            searchFields={searchFields}
            sortFields={sortFields}
            onSearch={handleSearch}
            onClear={handleClear}
            columns={dataTableColumns}
            data={users}
            totalEntries={totalUsers}
            entriesPerPage={entriesPerPage}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            onSort={handleTableSort}
            currentSortColumn={currentSortColumn}
            currentSortOrder={currentSortOrder}
            onCreateNew={handleCreateNew}
            onEntriesPerPageChange={handleEntriesPerPageChange}
            actions={userActions as ActionButton[]}
            initialFilters={currentFilters}
            initialSortBy={currentSortColumn}
            initialSortOrder={currentSortOrder}
        />
    );
};

export default User;
