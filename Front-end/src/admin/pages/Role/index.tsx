import ManagementTemplate, { type ActionButton } from "../../template/ManagementTemplate";
import type { SearchField, SortField } from "../../template/ManagementTemplate/FilterOption.tsx";
import moment from "moment";
import { useTranslation } from "react-i18next";
import { FaEdit, FaTrash } from "react-icons/fa";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {getRoles} from "../../../shared/services/roleService.ts";

interface RoleData {
    id: number;
    name: string;
    description: string;
    creationDate: string;
}

const Role: React.FC = () => {
    const { t } = useTranslation();

    const [roles, setRoles] = useState<RoleData[]>([]);
    const [filteredData, setFilteredData] = useState<RoleData[]>([]);
    const [currentFilters, setCurrentFilters] = useState<Record<string, string>>({});
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [currentSortColumn, setCurrentSortColumn] = useState<string | null>(null);
    const [currentSortOrder, setCurrentSortOrder] = useState<'asc' | 'desc' | null>(null);

    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const response = await getRoles();
                const data = await response.json();
                console.log("Fetched roles:", data);
                setRoles(data.result.content || []);
                setFilteredData(data.content || []);
            } catch (error) {
                console.error("Failed to fetch roles", error);
            }
        };
        fetchRoles();
    }, []);

    const dataTableColumns = useMemo(() => [
        { key: 'name', label: t('rolePage.columns.name'), sortable: true, align: 'center' },
        { key: 'description', label: t('rolePage.columns.description'), sortable: true, align: 'center' },
        { key: 'creationDate', label: t('rolePage.columns.creationDate'), sortable: true, align: 'center' },
    ], [t]);

    const searchFields: SearchField[] = useMemo(() => [
        { key: 'name', label: t('rolePage.search.name'), type: 'text', placeholder: t('rolePage.search.namePlaceholder'), gridSpan: 1 },
        { key: 'startDate', label: t('rolePage.search.startDate'), type: 'datetime', gridSpan: 1, format: 'YYYY-MM-DD HH:mm:ss' },
        { key: 'endDate', label: t('rolePage.search.endDate'), type: 'datetime', gridSpan: 1, format: 'YYYY-MM-DD HH:mm:ss' },
        { key: 'globalSearch', label: t('rolePage.search.global'), type: 'text', placeholder: t('rolePage.search.globalPlaceholder'), gridSpan: 2 },
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

    useEffect(() => {
        let tempData = [...roles];
        Object.keys(currentFilters).forEach(key => {
            const value = currentFilters[key];
            if (value && key !== 'sortOrder' && key !== 'orderBy') {
                if (key === 'globalSearch') {
                    const lower = value.toLowerCase();
                    tempData = tempData.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(lower)));
                } else if (key === 'startDate' || key === 'endDate') {
                    const filterDate = moment(value);
                    if (!filterDate.isValid()) return;
                    tempData = tempData.filter(r => {
                        const rowDate = moment(r.creationDate);
                        if (!rowDate.isValid()) return false;
                        if (key === 'startDate') return rowDate.isSameOrAfter(filterDate);
                        if (key === 'endDate') return rowDate.isSameOrBefore(filterDate);
                        return true;
                    });
                } else {
                    tempData = tempData.filter(r => String(r[key as keyof RoleData]).toLowerCase().includes(value.toLowerCase()));
                }
            }
        });

        const orderBy = currentFilters['orderBy'] || currentSortColumn;
        const sortOrder = currentFilters['sortOrder'] === 'desc' ? 'desc' : 'asc';
        if (orderBy) {
            tempData.sort((a, b) => {
                const aVal = a[orderBy as keyof RoleData];
                const bVal = b[orderBy as keyof RoleData];
                if (orderBy === 'creationDate') {
                    return sortOrder === 'asc' ? moment(aVal).valueOf() - moment(bVal).valueOf() : moment(bVal).valueOf() - moment(aVal).valueOf();
                }
                return String(aVal).localeCompare(String(bVal)) * (sortOrder === 'asc' ? 1 : -1);
            });
        }
        setFilteredData(tempData);
        setCurrentPage(1);
    }, [currentFilters, roles, currentSortColumn, currentSortOrder]);

    const handleSearch = useCallback((filters: Record<string, string>) => setCurrentFilters(filters), []);
    const handleClear = useCallback(() => {
        setCurrentFilters({});
        setCurrentPage(1);
        setCurrentSortColumn(null);
        setCurrentSortOrder(null);
        setEntriesPerPage(10);
    }, []);
    const handlePageChange = useCallback((page: number) => setCurrentPage(page), []);
    const handleTableSort = useCallback((key: string, order: 'asc' | 'desc') => {
        setCurrentSortColumn(key);
        setCurrentSortOrder(order);
        setCurrentFilters(prev => ({ ...prev, orderBy: key, sortOrder: order }));
    }, []);
    const handleEntriesPerPageChange = useCallback((n: number) => {
        setEntriesPerPage(n);
        setCurrentPage(1);
    }, []);
    const handleCreateNew = useCallback(() => alert(t('rolePage.createNew')), [t]);
    const handleEdit = useCallback((r: RoleData) => alert(`${t('rolePage.edit')} ${r.id}`), [t]);
    const handleDelete = useCallback((r: RoleData) => window.confirm(`${t('rolePage.confirmDelete')} ${r.id}`) && alert(`${t('rolePage.delete')} ${r.id}`), [t]);

    const actions = useMemo<ActionButton[]>(() => [
        { icon: <FaEdit />, onClick: handleEdit, tooltip: t('rolePage.editTooltip'), color: 'blue' },
        { icon: <FaTrash />, onClick: handleDelete, tooltip: t('rolePage.deleteTooltip'), color: 'red' },
    ], [handleEdit, handleDelete, t]);

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * entriesPerPage;
        return filteredData.slice(start, start + entriesPerPage).map(role => ({
            ...role,
            creationDate: moment(role.creationDate).isValid()
                ? moment(role.creationDate).format('YYYY-MM-DD')
                : 'N/A',

        }));
    }, [filteredData, currentPage, entriesPerPage]);


    return (
        <ManagementTemplate
            pageTitle={t('rolePage.title')}
            breadcrumbItems={[
                { label: t('userPage.breadcrumb.home'), path: '/' },
                { label: t('userPage.breadcrumb.adminDashboard'), path: '/admin' },
                { label: t('rolePage.breadcrumb') },
            ]}
            searchFields={searchFields}
            sortFields={sortFields}
            onSearch={handleSearch}
            onClear={handleClear}
            columns={dataTableColumns}
            data={paginatedData}
            totalEntries={filteredData.length}
            entriesPerPage={entriesPerPage}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            onSort={handleTableSort}
            currentSortColumn={currentSortColumn}
            currentSortOrder={currentSortOrder}
            onCreateNew={handleCreateNew}
            onEntriesPerPageChange={handleEntriesPerPageChange}
            actions={actions}
        />
    );
};

export default Role;
