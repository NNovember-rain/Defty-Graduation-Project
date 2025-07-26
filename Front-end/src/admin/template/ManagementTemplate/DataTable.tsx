// admin-dashboard/components/DataTable.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { MdDelete } from "react-icons/md";
import type {ReactNode} from 'react';

// Cập nhật interface để hỗ trợ icon và tooltip động
interface ActionButton {
    icon: ReactNode | ((rowData: DataRow) => ReactNode);
    onClick: (rowData: any) => void;
    className?: string | ((rowData: DataRow) => string);
    tooltip?: string | ((rowData: DataRow) => string);
    color?: string | ((rowData: DataRow) => string);
}

interface Column {
    key: string;
    label: string;
    sortable?: boolean;
    align?: 'left' | 'center' | 'right';
    render?: (value: any, row: DataRow) => ReactNode;
}

interface DataRow {
    [key: string]: any;
}

interface DataTableProps {
    title?: string;
    columns: Column[];
    data: DataRow[];
    totalEntries: number;
    entriesPerPage: number;
    currentPage: number;
    onPageChange: (page: number) => void;
    onSort: (columnKey: string, sortOrder: 'asc' | 'desc') => void;
    currentSortColumn: string | null;
    currentSortOrder: 'asc' | 'desc' | null;
    onEntriesPerPageChange: (entries: number) => void;
    actions?: ActionButton[];
    onBulkDelete?: (ids: string[]) => void;
    selectedRows?: string[];
    onSelectRow?: (id: string, isSelected: boolean) => void;
    onSelectAll?: (isSelected: boolean) => void;
}

const DataTable: React.FC<DataTableProps> = ({
                                                 title,
                                                 columns,
                                                 data,
                                                 totalEntries,
                                                 entriesPerPage,
                                                 currentPage,
                                                 onPageChange,
                                                 onSort,
                                                 currentSortColumn,
                                                 currentSortOrder,
                                                 onEntriesPerPageChange,
                                                 actions,
                                                 onBulkDelete,
                                                 selectedRows = [],
                                                 onSelectRow,
                                                 onSelectAll
                                             }) => {
    const { t } = useTranslation();
    const totalPages = Math.ceil(totalEntries / entriesPerPage);
    const startEntry = (currentPage - 1) * entriesPerPage;
    const isAllSelected = onSelectAll && data.length > 0 && data.every(row => selectedRows.includes(row.id ? row.id : row._id));

    const getPaginationPages = () => {
        const pages: (number | string)[] = [];
        const maxPagesToShow = 5;
        const boundaryPages = 2;

        if (totalPages <= maxPagesToShow) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            for (let i = 1; i <= boundaryPages; i++) {
                pages.push(i);
            }

            if (currentPage > boundaryPages + 1) {
                pages.push('...');
            }

            const startMiddle = Math.max(boundaryPages + 1, currentPage - Math.floor((maxPagesToShow - boundaryPages * 2 - 1) / 2));
            const endMiddle = Math.min(totalPages - boundaryPages, currentPage + Math.ceil((maxPagesToShow - boundaryPages * 2 - 1) / 2));

            for (let i = startMiddle; i <= endMiddle; i++) {
                if (i > boundaryPages && i < totalPages - boundaryPages + 1) {
                    pages.push(i);
                }
            }

            if (currentPage < totalPages - boundaryPages) {
                if (pages[pages.length - 1] !== '...') {
                    pages.push('...');
                }
            }

            for (let i = totalPages - boundaryPages + 1; i <= totalPages; i++) {
                if (!pages.includes(i)) {
                    pages.push(i);
                }
            }
            const finalPages: (number | string)[] = [];
            for (let i = 0; i < pages.length; i++) {
                if (pages[i] === '...' && finalPages[finalPages.length - 1] === '...') {
                    continue;
                }
                finalPages.push(pages[i]);
            }
            return finalPages;
        }

        return pages;
    };


    const handleSortClick = (columnKey: string, sortable?: boolean) => {
        if (!sortable) return;

        let newSortOrder: 'asc' | 'desc';
        if (currentSortColumn === columnKey) {
            newSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            newSortOrder = 'asc'; // Default to asc when changing column
        }
        onSort(columnKey, newSortOrder);
    };

    // Handle change in entries per page select
    const handleEntriesPerPageSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        onEntriesPerPageChange(Number(event.target.value));
    };

    return (
        <div className="data-table-section">
            <div className="data-table-section__toolbar">
                {title && (
                    <h2 className="data-table-section__title">{title}</h2>
                )}
                {onBulkDelete && selectedRows.length > 0 && (
                    <button
                        className="data-table-section__bulk-delete-button"
                        onClick={() => onBulkDelete(selectedRows)}
                    >
                        <MdDelete />
                        {t('dataTable.deleteSelected', { count: selectedRows.length })}
                    </button>
                )}
            </div>
            <table className="data-table">
                <thead className="data-table__header">
                <tr>
                    {onBulkDelete && (
                        <th className="data-table__header-cell data-table__header-cell--checkbox">
                            <input
                                type="checkbox"
                                checked={isAllSelected}
                                onChange={e => onSelectAll?.(e.target.checked)}
                            />
                        </th>
                    )}
                    <th className="data-table__header-cell data-table__header-cell--serial-number">{t('dataTable.order')}</th>
                    {columns.map((col) => (
                        <th
                            key={col.key}
                            className={`data-table__header-cell ${col.sortable ? 'data-table__header-cell--sortable' : ''}`}
                            onClick={() => handleSortClick(col.key, col.sortable)}
                        >
                            {col.label}
                            {col.sortable && currentSortColumn === col.key && (
                                <span className={`sort-icon sort-icon--${currentSortOrder}`}></span>
                            )}
                            {col.sortable && currentSortColumn !== col.key && (
                                <span className="sort-icon sort-icon--neutral"></span>
                            )}
                        </th>
                    ))}
                    {actions && actions.length > 0 && (
                        <th className="data-table__header-cell data-table__header-cell--actions">
                            {t('dataTable.actions')}
                        </th>
                    )}
                </tr>
                </thead>
                <tbody>
                {data.map((row, rowIndex) => (
                    <tr key={row.id || row._id || rowIndex} className="data-table__row">
                        {onBulkDelete && (
                            <td className="data-table__cell data-table__cell--checkbox">
                                <input
                                    type="checkbox"
                                    checked={selectedRows.includes(row.id ? row.id : row._id)}
                                    onChange={e => onSelectRow?.(row.id ? row.id : row._id, e.target.checked)}
                                />
                            </td>
                        )}
                        <td className="data-table__cell data-table__cell--serial-number">
                            {startEntry + rowIndex + 1}
                        </td>
                        {columns.map((col) => (
                            <td key={col.key} className="data-table__cell">
                                {col.render ? col.render(row[col.key], row) : row[col.key]}
                            </td>
                        ))}
                        {actions && actions.length > 0 && (
                            <td className="data-table__cell data-table__cell--actions">
                                <div className="data-table__actions-container">
                                    {actions.map((action, actionIndex) => {
                                        // Kiểm tra nếu prop là hàm, gọi hàm với dữ liệu hàng
                                        const icon = typeof action.icon === 'function' ? action.icon(row) : action.icon;
                                        const tooltip = typeof action.tooltip === 'function' ? action.tooltip(row) : action.tooltip;
                                        const className = typeof action.className === 'function' ? action.className(row) : action.className;
                                        const color = typeof action.color === 'function' ? action.color(row) : action.color;

                                        return (
                                            <button
                                                key={actionIndex}
                                                className={`data-table__action-button ${className || ''}`}
                                                onClick={() => action.onClick(row)}
                                                title={tooltip || ''}
                                                style={{ color: color, cursor: "pointer" }}
                                            >
                                                {icon}
                                            </button>
                                        );
                                    })}
                                </div>
                            </td>
                        )}
                    </tr>
                ))}
                </tbody>
                <tfoot className="data-table__footer-copy">
                </tfoot>
            </table>

            <div className="data-table-section__footer">
                <div className="data-table-section__entries-per-page">
                    <label htmlFor="entries-per-page-select">{t('dataTable.show')}: </label>
                    <select
                        id="entries-per-page-select"
                        value={entriesPerPage}
                        onChange={handleEntriesPerPageSelectChange}
                        className="data-table-section__entries-select"
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                    <span> {t('dataTable.entries')}</span>
                </div>
                <ul className="pagination">
                    <li className={`pagination__item ${currentPage === 1 ? 'pagination__item--disabled' : ''}`}>
                        <a
                            href="#"
                            className="pagination__link"
                            onClick={(e) => { e.preventDefault(); if (currentPage > 1) onPageChange(currentPage - 1); }}
                        >
                            {t('dataTable.previous')}
                        </a>
                    </li>
                    {getPaginationPages().map((page, index) => (
                        <li key={index} className="pagination__item">
                            {page === '...' ? (
                                <span className="pagination__dots">...</span>
                            ) : (
                                <a
                                    href="#"
                                    className={`pagination__link ${currentPage === page ? 'pagination__link--active' : ''}`}
                                    onClick={(e) => { e.preventDefault(); onPageChange(page as number); }}
                                >
                                    {page}
                                </a>
                            )}
                        </li>
                    ))}
                    <li className={`pagination__item ${currentPage === totalPages ? 'pagination__item--disabled' : ''}`}>
                        <a
                            href="#"
                            className="pagination__link"
                            onClick={(e) => { e.preventDefault(); if (currentPage < totalPages) onPageChange(currentPage + 1); }}
                        >
                            {t('dataTable.next')}
                        </a>
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default DataTable;