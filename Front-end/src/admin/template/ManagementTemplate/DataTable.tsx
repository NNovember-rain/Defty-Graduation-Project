// DataTable.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';

// NEW: Import ReactNode for action buttons
// NEW: Import ReactNode for action buttons
import type {ReactNode} from 'react';

interface Column {
    key: string;
    label: string;
    sortable?: boolean;
}

interface DataRow {
    [key: string]: any;
}

// NEW: Define ActionButton interface
interface ActionButton {
    icon: ReactNode; // ReactNode to allow any React element (like an icon component)
    onClick: (rowData: any) => void;
    className?: string;
    tooltip?: string; // Optional tooltip for the button,
    color?: string;
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
    // NEW: Add onAction prop, which is an array of ActionButton
    actions?: ActionButton[];
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
                                                 actions, // NEW: Destructure actions prop
                                             }) => {
    const { t } = useTranslation();
    const totalPages = Math.ceil(totalEntries / entriesPerPage);

    const getPaginationPages = () => {
        const pages: (number | string)[] = []; // Allow number or string for '...'
        const maxPagesToShow = 5; // Maximum number of page numbers to show (e.g., 1 2 ... 7 8 9 10)
        const boundaryPages = 2; // Number of pages to show at the start and end (e.g., 1 2 ... 9 10)

        if (totalPages <= maxPagesToShow) {
            // If total pages are less than or equal to maxPagesToShow, show all pages
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Always show the first few pages
            for (let i = 1; i <= boundaryPages; i++) {
                pages.push(i);
            }

            // Determine if '...' is needed at the start
            if (currentPage > boundaryPages + 1) {
                pages.push('...');
            }

            // Show pages around the current page
            const startMiddle = Math.max(boundaryPages + 1, currentPage - Math.floor((maxPagesToShow - boundaryPages * 2 - 1) / 2));
            const endMiddle = Math.min(totalPages - boundaryPages, currentPage + Math.ceil((maxPagesToShow - boundaryPages * 2 - 1) / 2));

            for (let i = startMiddle; i <= endMiddle; i++) {
                if (i > boundaryPages && i < totalPages - boundaryPages + 1) { // Ensure not to duplicate boundary pages
                    pages.push(i);
                }
            }


            // Determine if '...' is needed at the end
            if (currentPage < totalPages - boundaryPages) {
                if (pages[pages.length - 1] !== '...') { // Avoid consecutive '...'
                    pages.push('...');
                }
            }


            // Always show the last few pages
            for (let i = totalPages - boundaryPages + 1; i <= totalPages; i++) {
                if (!pages.includes(i)) { // Prevent duplicating if already added
                    pages.push(i);
                }
            }
            // Ensure no duplicate '...' if currentPage is very close to totalPages
            if (pages.length > 1 && pages[pages.length - 2] === '...' && pages[pages.length - 1] === '...') {
                pages.pop(); // Remove the last '...' if it's a duplicate
            }

            // Final check to remove consecutive '...'
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
            {title && (
                <h2 className="data-table-section__title">{title}</h2>
            )}
            <table className="data-table">
                <thead className="data-table__header">
                <tr>
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
                    {/* NEW: Add Action header if actions are provided */}
                    {actions && actions.length > 0 && (
                        <th className="data-table__header-cell data-table__header-cell--actions">
                            {t('dataTable.actions')} {/* Translate 'Actions' */}
                        </th>
                    )}
                </tr>
                </thead>
                <tbody>
                {data.map((row, rowIndex) => (
                    <tr key={rowIndex} className="data-table__row">
                        {columns.map((col) => (
                            <td key={col.key} className="data-table__cell">
                                {row[col.key]}
                            </td>
                        ))}
                        {/* NEW: Render Action buttons if actions are provided */}
                        {actions && actions.length > 0 && (
                            <td className="data-table__cell data-table__cell--actions">
                                <div className="data-table__actions-container">
                                    {actions.map((action, actionIndex) => (
                                        <button
                                            key={actionIndex}
                                            className={`data-table__action-button ${action.className || ''}`}
                                            onClick={() => action.onClick(row)}
                                            title={action.tooltip || ''}
                                            style={{color: action.color, cursor: "pointer"}}
                                        >
                                            {action.icon}
                                        </button>
                                    ))}
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