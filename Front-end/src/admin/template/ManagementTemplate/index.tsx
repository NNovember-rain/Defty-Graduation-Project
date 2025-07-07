// admin-dashboard/components/ManagementTemplate.tsx
import React, { useState } from 'react';
import FilterOption, {type SearchField, type SortField} from './FilterOption';
import DataTable from './DataTable';
import Breadcrumb from './Breadcrumb'; // Import Breadcrumb component
import { FaEye, FaEyeSlash } from 'react-icons/fa'; // Import eye icons
import './ManagementTemplate.scss';
import { useTranslation } from 'react-i18next'; // Import useTranslation

interface Column {
    key: string;
    label: string;
    sortable?: boolean;
}

interface DataRow {
    [key: string]: any;
}

interface BreadcrumbItem {
    label: string;
    path?: string; // Optional path if it's a link
}

interface ManagementTemplateProps {
    pageTitle: string; // New prop for page title
    breadcrumbItems?: BreadcrumbItem[]; // Make breadcrumbItems optional

    // Props for FilterOption (updated)
    searchFields: SearchField[];
    sortFields: SortField[];
    onSearch: (filters: Record<string, string>) => void;
    onClear: () => void;

    // Props for DataTable (giữ nguyên)
    dataTableTitle?: string;
    columns: Column[];
    data: DataRow[];
    totalEntries: number;
    entriesPerPage: number;
    currentPage: number;
    onPageChange: (page: number) => void;
    onSort: (columnKey: string, sortOrder: 'asc' | 'desc') => void;
    currentSortColumn: string | null;
    currentSortOrder: 'asc' | 'desc' | null;
}

const ManagementTemplate: React.FC<ManagementTemplateProps> = ({
                                                                   pageTitle,
                                                                   breadcrumbItems = [], // Default to an empty array if not provided
                                                                   searchFields,
                                                                   sortFields,
                                                                   onSearch,
                                                                   onClear,
                                                                   dataTableTitle,
                                                                   columns,
                                                                   data,
                                                                   totalEntries,
                                                                   entriesPerPage,
                                                                   currentPage,
                                                                   onPageChange,
                                                                   onSort,
                                                                   currentSortColumn,
                                                                   currentSortOrder,
                                                               }) => {
    const { t } = useTranslation(); // Initialize useTranslation
    const [isFilterVisible, setIsFilterVisible] = useState(true);

    const toggleFilterVisibility = () => {
        setIsFilterVisible(prevState => !prevState);
    };

    return (
        <div className="management-template">
            {/* Header Section: Title, Filter Toggle, Breadcrumb */}
            <div className="management-template__header-container">
                <h1 className="management-template__page-title">{pageTitle}</h1>
                <button
                    className="management-template__filter-toggle"
                    onClick={toggleFilterVisibility}
                >
                    {isFilterVisible ? <FaEyeSlash className="react-icon" /> : <FaEye className="react-icon" />}
                    {isFilterVisible ? t('managementTemplate.hideFilters') : t('managementTemplate.showFilters')}
                </button>
                <div className="management-template__header-right">
                    <Breadcrumb items={breadcrumbItems} />
                </div>
            </div>

            {/* Filter/Search Section */}
            <div className={`${isFilterVisible ? '' : 'filter-options--hidden'}`}>
                <FilterOption
                    searchFields={searchFields}
                    sortFields={sortFields}
                    onSearch={onSearch}
                    onClear={onClear}
                />
            </div>


            {/* Data Table Section */}
            <DataTable
                title={dataTableTitle}
                columns={columns}
                data={data}
                totalEntries={totalEntries}
                entriesPerPage={entriesPerPage}
                currentPage={currentPage}
                onPageChange={onPageChange}
                onSort={onSort}
                currentSortColumn={currentSortColumn}
                currentSortOrder={currentSortOrder}
            />
        </div>
    );
};

export default ManagementTemplate;