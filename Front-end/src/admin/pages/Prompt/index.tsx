import React, { useEffect, useCallback } from "react";
import ManagementTemplate, { type ActionButton } from "../../template/ManagementTemplate";
import type { SearchField, SortField } from "../../template/ManagementTemplate/FilterOption.tsx";
import { useTranslation } from "react-i18next";
import { FaEdit, FaTrash } from 'react-icons/fa';
import {
    getPrompts,
    deletePrompt,
    type IPrompt,
    type GetPromptsOptions
} from "../../../shared/services/promptService";
import dayjs from "dayjs"; // NEW: Import dayjs

const Prompt: React.FC = () => {
    const { t } = useTranslation();

    const [prompts, setPrompts] = React.useState<IPrompt[]>([]);
    const [totalPrompts, setTotalPrompts] = React.useState(0);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    const [currentFilters, setCurrentFilters] = React.useState<Record<string, string>>({});
    const [currentPage, setCurrentPage] = React.useState(1);
    const [entriesPerPage, setEntriesPerPage] = React.useState(10);
    const [currentSortColumn, setCurrentSortColumn] = React.useState<string | null>(null);
    const [currentSortOrder, setCurrentSortOrder] = React.useState<'asc' | 'desc' | null>(null);

    // Hàm tiện ích để cập nhật URL
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
            const options: GetPromptsOptions = {
                page: currentPage,
                limit: entriesPerPage,
                sortBy: currentSortColumn || undefined,
                sortOrder: currentSortOrder || undefined,
                name: currentFilters.name || undefined
            };

            const result = await getPrompts(options);
            setPrompts(result.prompts);
            setTotalPrompts(result.total);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch prompts:", err);
            setError(t('common.errorFetchingData'));
            setLoading(false);
        }
    }, [currentPage, entriesPerPage, currentSortColumn, currentSortOrder, currentFilters, t]);

    // Effect để gọi fetchData và updateUrl khi các state liên quan thay đổi
    useEffect(() => {
        fetchData();
        updateUrl();
    }, [fetchData, updateUrl, currentPage, entriesPerPage, currentSortColumn, currentSortOrder, currentFilters]);

    const dataTableColumns = React.useMemo(() => [
        { key: 'name', label: t('promptPage.dataTableColumns.name'), sortable: true },
        { key: 'description', label: t('promptPage.dataTableColumns.description'), sortable: true },
        { key: 'templateString', label: t('promptPage.dataTableColumns.templateString'), sortable: true },
        { key: 'type', label: t('promptPage.dataTableColumns.type'), sortable: true },
        { key: 'version', label: t('promptPage.dataTableColumns.version'), sortable: true },
        {
            key: 'createdAt',
            label: t('promptPage.dataTableColumns.createdAt'),
            sortable: true,
            render: (value: string | Date) => dayjs(value).format('YYYY-MM-DD HH:mm:ss') // NEW: Format ngày giờ
        },
        {
            key: 'updatedAt',
            label: t('promptPage.dataTableColumns.updatedAt'),
            sortable: true,
            render: (value: string | Date) => dayjs(value).format('YYYY-MM-DD HH:mm:ss') // NEW: Format ngày giờ
        },
    ], [t]);

    const searchFields: SearchField[] = React.useMemo(() => [
        { key: 'name', label: t('promptPage.searchFields.nameLabel'), type: 'text', placeholder: t('promptPage.searchFields.namePlaceholder'), gridSpan: 1 },
    ], [t]);

    const sortFields: SortField[] = React.useMemo(() => [
        {
            key: 'sortOrder',
            label: t('promptPage.sortFields.sortOrderLabel'),
            options: [
                { value: 'asc', label: t('promptPage.sortFields.ascending') },
                { value: 'desc', label: t('promptPage.sortFields.descending') },
            ],
            gridSpan: 1
        },
        {
            key: 'sortBy',
            label: t('promptPage.sortFields.sortByLabel'),
            options: [
                { value: 'name', label: t('promptPage.sortFields.name') },
                { value: 'createdAt', label: t('promptPage.sortFields.createdAt') },
                { value: 'updatedAt', label: t('promptPage.sortFields.updatedAt') },
            ],
            gridSpan: 1
        },
    ], [t]);

    const handleSearch = useCallback((filtersFromForm: Record<string, string>) => {
        setCurrentFilters(filtersFromForm);
        setCurrentPage(1); // Reset về trang đầu tiên khi tìm kiếm mới

        // Cập nhật sắp xếp từ form
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
        setEntriesPerPage(10); // Reset về mặc định
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
        setCurrentPage(1); // Reset về trang đầu tiên khi thay đổi số mục trên trang
    }, []);

    const handleCreateNew = useCallback(() => {
        console.log(t('promptPage.createNewAction'));
    }, [t]);

    const handleEditPrompt = useCallback((rowData: IPrompt) => {
        console.log(`${t('promptPage.editAction')} Prompt ID: ${rowData._id}`);
    }, [t]);

    const handleDeletePrompt = useCallback(async (rowData: IPrompt) => {
        if (!rowData._id) {
            console.error("Attempted to delete prompt with no ID:", rowData);
            console.log(t('common.errorNoIdToDelete'));
            return;
        }

        if (window.confirm(`${t('promptPage.confirmDelete')} ${rowData.name || rowData._id}?`)) {
            try {
                setLoading(true);
                await deletePrompt(rowData._id);
                console.log(t('promptPage.deleteSuccess'));
                await fetchData();
            } catch (err) {
                console.error("Failed to delete prompt:", err);
                setError(t('common.errorDeletingData'));
                setLoading(false);
            }
        }
    }, [t, fetchData]);

    const promptActions = React.useMemo(() => [
        {
            icon: <FaEdit />,
            onClick: handleEditPrompt,
            className: 'text-blue-500 hover:text-blue-700',
            tooltip: t('promptPage.editTooltip'),
            color: '#7600ff'
        },
        {
            icon: <FaTrash />,
            onClick: handleDeletePrompt,
            className: 'text-red-500 hover:text-red-700 ml-2',
            tooltip: t('promptPage.deleteTooltip'),
            color: 'red'
        },
    ], [handleEditPrompt, handleDeletePrompt, t]);

    if (loading && prompts.length === 0) {
        return <div>{t('common.loadingData')}</div>;
    }

    if (error) {
        return <div className="text-red-500">{error}</div>;
    }

    return (
        <ManagementTemplate
            pageTitle={t('promptPage.title')}
            breadcrumbItems={[
                { label: t('promptPage.breadcrumb.home'), path: '/' },
                { label: t('promptPage.breadcrumb.adminDashboard'), path: '/admin' },
                { label: t('promptPage.breadcrumb.promptManagement') },
            ]}
            searchFields={searchFields}
            sortFields={sortFields}
            onSearch={handleSearch}
            onClear={handleClear}
            columns={dataTableColumns}
            data={prompts}
            totalEntries={totalPrompts}
            entriesPerPage={entriesPerPage}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            onSort={handleTableSort}
            currentSortColumn={currentSortColumn}
            currentSortOrder={currentSortOrder}
            onCreateNew={handleCreateNew}
            onEntriesPerPageChange={handleEntriesPerPageChange}
            actions={promptActions as ActionButton[]}
            initialFilters={currentFilters}
            initialSortBy={currentSortColumn}
            initialSortOrder={currentSortOrder}
        />
    );
}

export default Prompt;