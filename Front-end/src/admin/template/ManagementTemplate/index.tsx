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
    align?: 'left' | 'center' | 'right';
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
    // NEW: Thêm các props để truyền giá trị ban đầu cho FilterOption
    initialFilters: Record<string, string>;
    initialSortBy: string | null;
    initialSortOrder: 'asc' | 'desc' | null;


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
    onBulkDelete?: (ids: string[]) => void;

    // NEW: Add customActions prop
    customActions?: ReactNode; // Optional custom actions to render
}

const ManagementTemplate: React.FC<ManagementTemplateProps> = ({
                                                                   pageTitle,
                                                                   breadcrumbItems = [], // Default to empty array
                                                                   searchFields,
                                                                   sortFields,
                                                                   onSearch,
                                                                   onClear,
                                                                   initialFilters, // NEW: Destructure
                                                                   initialSortBy, // NEW: Destructure
                                                                   initialSortOrder, // NEW: Destructure
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
                                                                   onBulkDelete,
                                                                   customActions, // NEW: Destructure customActions prop
                                                               }) => {
    const [isFilterVisible, setIsFilterVisible] = useState(true);
    const [selectedRows, setSelectedRows] = useState<string[]>([]);
    const { t } = useTranslation(); // Initialize useTranslation

    const toggleFilterVisibility = () => {
        setIsFilterVisible(!isFilterVisible);
    };

    const handleSelectRow = (id: string, isSelected: boolean) => {
        setSelectedRows(prev =>
            isSelected ? [...prev, id] : prev.filter(rowId => rowId !== id)
        );
    };

    const handleSelectAllRows = (isSelected: boolean) => {
        if (isSelected) {
            const allIds = data.map(row => row.id ? row.id : row._id);
            setSelectedRows(allIds);
        } else {
            setSelectedRows([]);
        }
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
                    initialFilters={initialFilters} // NEW: Truyền prop này
                    initialSortBy={initialSortBy} // NEW: Truyền prop này
                    initialSortOrder={initialSortOrder} // NEW: Truyền prop này
                />
            </div>

            {/* Custom Actions Section - Moved here (after filters, before table) */}
            {customActions && (
                <div className="management-template__custom-actions">
                    {customActions}
                </div>
            )}

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
                actions={actions}
                onBulkDelete={onBulkDelete}
                selectedRows={selectedRows}
                onSelectRow={handleSelectRow}
                onSelectAll={handleSelectAllRows}
            />
        </div>
    );
};

export default ManagementTemplate;