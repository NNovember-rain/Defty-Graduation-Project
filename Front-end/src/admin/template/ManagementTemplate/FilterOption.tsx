import React, { useEffect, useState } from 'react';
import AntdDatePicker from '../../components/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { useTranslation } from 'react-i18next';
import { Select } from "antd";

// --- Search field type ---
export interface SearchField {
    key: string;
    label: string;
    type: 'text' | 'number' | 'select' | 'multiselect' | 'datetime' | 'searchableSelect';
    placeholder?: string;
    options?: { value: string; label: string }[];
    gridSpan?: number;
    format?: string;
    customRender?: (value: string, onChange: (value: string) => void) => React.ReactNode;
}

// --- Sort field type ---
export interface SortField {
    key: string;
    label: string;
    options: { value: string; label: string }[];
    gridSpan?: number;
}

interface FilterOptionProps {
    searchFields: SearchField[];
    sortFields: SortField[];
    onSearch: (filters: Record<string, string>) => void;
    onClear: () => void;

    initialFilters: Record<string, string>;
    initialSortBy: string | null;
    initialSortOrder: 'asc' | 'desc' | null;
}

const FilterOption: React.FC<FilterOptionProps> = ({
                                                       searchFields,
                                                       sortFields,
                                                       onSearch,
                                                       onClear,
                                                       initialFilters,
                                                       initialSortBy,
                                                       initialSortOrder,
                                                   }) => {

    const { t } = useTranslation();

    const [filters, setFilters] = useState<Record<string, string>>({});

    // Khởi tạo filter từ URL params
    useEffect(() => {
        const newFilters: Record<string, string> = {};

        searchFields.forEach(field => {
            newFilters[field.key] = initialFilters[field.key] || '';
        });

        sortFields.forEach(field => {
            if (field.key === 'sortBy' && initialSortBy) {
                newFilters[field.key] = initialSortBy;
            } else if (field.key === 'sortOrder' && initialSortOrder) {
                newFilters[field.key] = initialSortOrder;
            } else {
                newFilters[field.key] = initialFilters[field.key] || field.options[0]?.value || '';
            }
        });

        setFilters(newFilters);
    }, [initialFilters, initialSortBy, initialSortOrder, searchFields, sortFields]);

    const handleChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleDateChange = (key: string, _date: Dayjs | null, dateString: string | string[]) => {
        const finalDate = Array.isArray(dateString) ? dateString[0] : dateString;
        handleChange(key, finalDate || '');
    };

    const handleSearchClick = () => {
        const finalFilters = { ...filters };
        if (filters.sortBy) finalFilters.sortBy = filters.sortBy;
        if (filters.sortOrder) finalFilters.sortOrder = filters.sortOrder;

        onSearch(finalFilters);
    };

    const handleClearClick = () => {
        const cleared: Record<string, string> = {};

        searchFields.forEach(f => cleared[f.key] = '');
        sortFields.forEach(f => cleared[f.key] = f.options[0]?.value || '');

        setFilters(cleared);
        onClear();
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
        if (e.key === 'Enter') handleSearchClick();
    };

    return (
        <div className="filter-options">
            <div className="filter-options__grid">

                {/* Search Fields */}
                {searchFields.map(field => (
                    <div
                        key={field.key}
                        className={`filter-options__form-group ${field.gridSpan ? `filter-options__col-span-${field.gridSpan}` : ''}`}
                    >
                        <label htmlFor={field.key} className="filter-options__form-group__label">
                            {field.label}:
                        </label>

                        {/* TEXT */}
                        {field.type === 'text' && (
                            <input
                                type="text"
                                id={field.key}
                                className="filter-options__form-group__input"
                                placeholder={field.placeholder}
                                value={filters[field.key] || ''}
                                onChange={(e) => handleChange(field.key, e.target.value)}
                                onKeyPress={handleKeyPress}
                            />
                        )}

                        {/* NUMBER */}
                        {field.type === 'number' && (
                            <input
                                type="number"
                                id={field.key}
                                className="filter-options__form-group__input"
                                placeholder={field.placeholder}
                                value={filters[field.key] || ''}
                                onChange={(e) => handleChange(field.key, e.target.value)}
                                onKeyPress={handleKeyPress}
                            />
                        )}

                        {/* SELECT */}
                        {field.type === 'select' && (
                            <select
                                id={field.key}
                                className="filter-options__form-group__select"
                                value={filters[field.key] || ''}
                                onChange={(e) => handleChange(field.key, e.target.value)}
                                onKeyPress={handleKeyPress}
                                style={{ padding: "10px 12px" }}
                            >
                                {field.options?.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        )}

                        {/* MULTISELECT */}
                        {field.type === "multiselect" && (
                            <Select
                                mode="multiple"
                                allowClear
                                showSearch
                                id={field.key}
                                placeholder={field.placeholder}
                                value={filters[field.key] ? filters[field.key].split(",") : []}
                                onChange={(values) => handleChange(field.key, values.join(","))}
                                filterOption={(input, option) =>
                                    (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                                }
                                options={field.options?.map(opt => ({
                                    label: opt.label,
                                    value: opt.value,
                                }))}
                                className="
                                    w-full
                                    h-[40px]
                                    [&_.ant-select-selector]:!rounded-[4px]
                                    [&_.ant-select-selector]:!py-1.5
                                    [&_.ant-select-selector]:!px-2
                                    [&_.ant-select-selector]:!flex-nowrap
                                    [&_.ant-select-selector]:!overflow-x-auto
                                    [&_.ant-select-selector]:!overflow-y-hidden
                                    [&_.ant-select-selector]:!whitespace-nowrap
                                    [&_.ant-select-selection-overflow]:!flex-nowrap
                                    [&_.ant-select-selection-overflow]:!overflow-x-auto
                                    [&_.ant-select-selection-overflow]:scrollbar-thin
                                "
                            />
                        )}

                        {/* DATETIME */}
                        {field.type === 'datetime' && (
                            <AntdDatePicker
                                id={field.key}
                                showTime={{ defaultValue: dayjs('00:00:00', 'HH:mm:ss') }}
                                format={field.format || 'YYYY-MM-DD HH:mm:ss'}
                                value={
                                    filters[field.key]
                                        ? dayjs(filters[field.key], field.format || 'YYYY-MM-DD HH:mm:ss')
                                        : null
                                }
                                onChange={(date, dateStr) => handleDateChange(field.key, date, dateStr)}
                                className="filter-options__form-group__date-picker"
                                style={{ width: '100%', padding: '8px 12px', borderRadius: 3 }}
                                placeholder={field.placeholder}
                            />
                        )}

                        {/* SEARCHABLE SELECT (CUSTOM) */}
                        {field.type === "searchableSelect" && field.customRender && (
                            field.customRender(
                                filters[field.key] || '',
                                (value) => handleChange(field.key, value)
                            )
                        )}
                    </div>
                ))}

                {/* Sort Fields */}
                {sortFields.map(field => (
                    <div
                        key={field.key}
                        className={`filter-options__form-group ${field.gridSpan ? `filter-options__col-span-${field.gridSpan}` : ''}`}
                    >
                        <label htmlFor={field.key} className="filter-options__form-group__label">
                            {field.label}:
                        </label>

                        <select
                            id={field.key}
                            className="filter-options__form-group__select"
                            value={filters[field.key] || ''}
                            onChange={(e) => handleChange(field.key, e.target.value)}
                            onKeyPress={handleKeyPress}
                            style={{ padding: "10px 12px" }}
                        >
                            {field.options.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                ))}

                {/* Buttons */}
                <div className="filter-options__actions">
                    <button
                        className="filter-options__button filter-options__button--secondary"
                        onClick={handleClearClick}
                        type="button"
                    >
                        {t('common.clear')}
                    </button>

                    <button
                        className="filter-options__button filter-options__button--primary"
                        onClick={handleSearchClick}
                        type="button"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                        </svg>
                        {t('common.search')}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default FilterOption;
