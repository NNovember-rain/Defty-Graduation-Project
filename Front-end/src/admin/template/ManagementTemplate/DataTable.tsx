import React from 'react';
import { useTranslation } from 'react-i18next'; // Import useTranslation

interface Column {
    key: string;
    label: string;
    sortable?: boolean;
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
                                             }) => {
    const { t } = useTranslation(); // Initialize useTranslation
    const totalPages = Math.ceil(totalEntries / entriesPerPage);

    const getPaginationPages = () => {
        const pages = [];
        const maxPagesToShow = 5; // e.g., 1 2 3 4 5
        let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
        let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

        if (endPage - startPage + 1 < maxPagesToShow) {
            startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
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
                                // Optional: show a neutral sort icon for sortable but not current
                                <span className="sort-icon"></span>
                            )}
                        </th>
                    ))}
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
                    </tr>
                ))}
                </tbody>
                <tfoot className="data-table__footer-copy">
                </tfoot>
            </table>

            <div className="data-table-section__footer">
                <div className="data-table-section__entry-info">
                    {t('dataTable.showingEntries', {
                        start: (currentPage - 1) * entriesPerPage + 1,
                        end: Math.min(currentPage * entriesPerPage, totalEntries),
                        total: totalEntries
                    })}
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
                    {getPaginationPages().map((page) => (
                        <li key={page} className="pagination__item">
                            <a
                                href="#"
                                className={`pagination__link ${currentPage === page ? 'pagination__link--active' : ''}`}
                                onClick={(e) => { e.preventDefault(); onPageChange(page); }}
                            >
                                {page}
                            </a>
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