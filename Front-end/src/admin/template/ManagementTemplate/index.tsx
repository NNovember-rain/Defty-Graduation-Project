// admin-dashboard/components/ManagementTemplate.tsx
import React, { useState } from 'react';
import FilterOption, {type SearchField, type SortField} from './FilterOption';
import DataTable from './DataTable';
import Breadcrumb from './Breadcrumb'; // Import Breadcrumb component
import { FaEye, FaEyeSlash } from 'react-icons/fa'; // Import eye icons
import './ManagementTemplate.scss';
import { useTranslation } from 'react-i18next'; // Import useTranslation
import { IoMdAddCircle } from "react-icons/io";
import type {ReactNode} from 'react';

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

// NEW: Define ActionButton interface (same as in DataTable)
export interface ActionButton {
    icon: ReactNode; // ReactNode to allow any React element (like an icon component)
    onClick: (rowData: DataRow) => void;
    className?: string;
    tooltip?: string; // Optional tooltip for the button,
    color: string
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
    onCreateNew?: () => void; // Optional prop for the "Create New" button
    onEntriesPerPageChange: (entries: number) => void; // NEW: Thêm prop này

    // NEW: Add actions prop
    actions?: ActionButton[]; // Optional array of action buttons
}

const ManagementTemplate: React.FC<ManagementTemplateProps> = ({
                                                                   pageTitle,
                                                                   breadcrumbItems = [], // Default to empty array
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
                                                                   onCreateNew, // Destructure onCreateNew
                                                                   onEntriesPerPageChange, // NEW: Destructure prop này
                                                                   actions, // NEW: Destructure actions prop
                                                               }) => {
    const [isFilterVisible, setIsFilterVisible] = useState(true);
    const { t } = useTranslation(); // Initialize useTranslation

    const toggleFilterVisibility = () => {
        setIsFilterVisible(!isFilterVisible);
    };

    return (
        <div className="management-template">
            {/* Header Section */}
            <div className="management-template__header-container">
                <div className="management-template__left">
                    <h1 className="management-template__page-title">{pageTitle}</h1>
                    {onCreateNew && ( // Render button only if onCreateNew prop is provided
                        <button
                            className="management-template__create-button"
                            onClick={onCreateNew}
                        >
                            <IoMdAddCircle className="react-icon" />
                            {t('managementTemplate.createNew')}
                        </button>
                    )}
                </div>
                <div className="management-template__right">
                    <button
                        className="management-template__filter-toggle"
                        onClick={toggleFilterVisibility}
                    >
                        {isFilterVisible ? <FaEyeSlash className="react-icon" /> : <FaEye className="react-icon" />}
                        {isFilterVisible ? t('managementTemplate.hideFilters') : t('managementTemplate.showFilters')}
                    </button>
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
                onEntriesPerPageChange={onEntriesPerPageChange} // NEW: Truyền prop này
                actions={actions} // NEW: Pass actions to DataTable
            />
        </div>
    );
};

export default ManagementTemplate;