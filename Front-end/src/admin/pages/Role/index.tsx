import ManagementTemplate, {type ActionButton} from "../../template/ManagementTemplate";
import type {SearchField, SortField} from "../../template/ManagementTemplate/FilterOption.tsx";
import {useTranslation} from "react-i18next";
import React, {useCallback, useEffect, useMemo, useState} from "react";
import {getRoles, type GetRolesOptions, type IRole,} from "../../../shared/services/roleService.ts";
import {type IPrompt} from "../../../shared/services/promptService.ts";
import {useNavigate} from "react-router-dom";
import {FaEdit, FaTrash} from "react-icons/fa";
import dayjs from 'dayjs';

const Role: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [roles, setRoles] = useState<IRole[]>([]);
    const [totalRoles, setTotalRoles] = React.useState(0);
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
            const options: GetRolesOptions = {
                page: currentPage,
                limit: entriesPerPage,
                sortBy: currentSortColumn || undefined,
                sortOrder: currentSortOrder || undefined,
                name: currentFilters.name || undefined
            };

            const response = await getRoles(options);
            const formattedRoles = (response.roles || []).map(role => ({
                ...role,
                createdDate: role.createdDate
                    ? dayjs(role.createdDate).format('YYYY-MM-DD')
                    : '',
            }));

            setRoles(formattedRoles);
            setTotalRoles(response.total || 0);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch roles:", err);
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
            label: t('rolePage.columns.name'),
            sortable: true
        },
        {
            key: 'description',
            label: t('rolePage.columns.description'),
            sortable: true
        },
        {
            key: 'createdDate',
            label: t('rolePage.columns.creationDate'),
            sortable: true
        },
    ], [t]);

    const searchFields: SearchField[] = useMemo(() => [
        {
            key: 'name',
            label: t('rolePage.search.name'),
            type: 'text',
            placeholder: t('rolePage.search.namePlaceholder'),
            gridSpan: 1
        },
        {
            key: 'startDate',
            label: t('rolePage.search.startDate'),
            type: 'datetime',
            gridSpan: 1,
            format: 'YYYY-MM-DD HH:mm:ss' },
        {
            key: 'endDate',
            label: t('rolePage.search.endDate'),
            type: 'datetime',
            gridSpan: 1,
            format: 'YYYY-MM-DD HH:mm:ss'
        },
        {
            key: 'globalSearch',
            label: t('rolePage.search.global'),
            type: 'text',
            placeholder: t('rolePage.search.globalPlaceholder'),
            gridSpan: 2
        },
    ], [t]);

    const sortFields: SortField[] = useMemo(() => [
        {
            key: 'sortOrder',
            label: t('rolePage.sort.order'),
            options: [
                { value: 'asc', label: t('rolePage.sort.ascending') },
                { value: 'desc', label: t('rolePage.sort.descending') },
            ],
            gridSpan: 1
        },
        {
            key: 'orderBy',
            label: t('rolePage.sort.by'),
            options: [
                { value: 'name', label: t('rolePage.sort.name') },
                { value: 'creationDate', label: t('rolePage.sort.creationDate') },
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
        navigate("/admin/identity/roles/create");
    }, [t]);

    const handleEditRole = useCallback((rowData: IPrompt) => {
        navigate(`/admin/identity/roles/update/${rowData._id}`);
    }, [t]);

    const handleDeleteRole = useCallback(async (rowData: IRole) => {
        console.log("Deleting role:", rowData);
    }, [t, fetchData]);

    const roleActions = React.useMemo(() => [
        {
            icon: <FaEdit />,
            onClick: handleEditRole,
            className: 'text-blue-500 hover:text-blue-700',
            tooltip: t('promptPage.editTooltip'),
            color: '#7600ff'
        },
        {
            icon: <FaTrash />,
            onClick: handleDeleteRole,
            className: 'text-red-500 hover:text-red-700 ml-2',
            tooltip: t('promptPage.deleteTooltip'),
            color: 'red'
        },
    ], [handleEditRole, handleDeleteRole, t]);

    if (loading && roles.length === 0) {
        return <div>{t('common.loadingData')}</div>;
    }

    if (error) {
        return <div className="text-red-500">{error}</div>;
    }

    return (
        <ManagementTemplate
            pageTitle={t('rolePage.title')}
            breadcrumbItems={[
                {label: t('userPage.breadcrumb.home'), path: '/'},
                {label: t('userPage.breadcrumb.adminDashboard'), path: '/admin'},
                {label: t('rolePage.breadcrumb')},
            ]}
            searchFields={searchFields}
            sortFields={sortFields}
            onSearch={handleSearch}
            onClear={handleClear}
            columns={dataTableColumns}
            data={roles}
            totalEntries={totalRoles}
            entriesPerPage={entriesPerPage}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            onSort={handleTableSort}
            currentSortColumn={currentSortColumn}
            currentSortOrder={currentSortOrder}
            onCreateNew={handleCreateNew}
            onEntriesPerPageChange={handleEntriesPerPageChange}
            actions={roleActions as ActionButton[]}
            initialFilters={currentFilters}
            initialSortBy={currentSortColumn}
            initialSortOrder={currentSortOrder}
        />
    );
};

export default Role;
