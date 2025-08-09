import React, { useEffect, useState } from 'react'; // Import useEffect and useState
import AntdDatePicker from '../../components/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { useTranslation } from 'react-i18next'; // Import useTranslation

// --- Định nghĩa kiểu cho trường tìm kiếm ---
export interface SearchField {
    key: string;
    label: string;
    type: 'text' | 'number' | 'select' | 'datetime'; // Thêm 'number' vào kiểu union
    placeholder?: string;
    options?: { value: string; label: string }[];
    gridSpan?: number;
    format?: string;
}

// --- Định nghĩa kiểu cho trường sắp xếp ---
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
    // NEW: Thêm các props để nhận giá trị ban đầu
    initialFilters: Record<string, string>;
    initialSortBy: string | null;
    initialSortOrder: 'asc' | 'desc' | null;
}

const FilterOption: React.FC<FilterOptionProps> = ({
                                                       searchFields,
                                                       sortFields,
                                                       onSearch,
                                                       onClear,
                                                       initialFilters, // NEW: Destructure
                                                       initialSortBy, // NEW: Destructure
                                                       initialSortOrder, // NEW: Destructure
                                                   }) => {
    const { t } = useTranslation(); // Initialize useTranslation

    // State để lưu trữ giá trị của các trường lọc
    const [filters, setFilters] = useState<Record<string, string>>({});

    // Effect để cập nhật state `filters` khi các props `initial` thay đổi
    useEffect(() => {
        const newFilters: Record<string, string> = {};

        // Khởi tạo từ searchFields và initialFilters
        searchFields.forEach(field => {
            newFilters[field.key] = initialFilters[field.key] || '';
        });

        // Khởi tạo từ sortFields và initialSortBy/initialSortOrder
        sortFields.forEach(field => {
            if (field.key === 'sortBy' && initialSortBy) {
                newFilters[field.key] = initialSortBy;
            } else if (field.key === 'sortOrder' && initialSortOrder) {
                newFilters[field.key] = initialSortOrder;
            } else {
                // Đặt giá trị mặc định nếu không có trong URL
                newFilters[field.key] = initialFilters[field.key] || field.options[0]?.value || '';
            }
        });

        setFilters(newFilters);
    }, [initialFilters, initialSortBy, initialSortOrder, searchFields, sortFields]);


    const handleChange = (key: string, value: string) => {
        setFilters(prevFilters => ({
            ...prevFilters,
            [key]: value
        }));
    };

    // Handler cho Ant Design DatePicker với type safety
    const handleDateChange = (key: string, _date: Dayjs | null, dateString: string | string[]) => {
        const finalDateString = Array.isArray(dateString) ? dateString[0] : dateString;
        handleChange(key, finalDateString || '');
    };

    const handleSearchClick = () => {
        // Khi tìm kiếm, chúng ta cần gửi cả sortBy và sortOrder trong object filters
        const filtersToSend = { ...filters };
        if (filters.sortBy) {
            filtersToSend.sortBy = filters.sortBy;
        }
        if (filters.sortOrder) {
            filtersToSend.sortOrder = filters.sortOrder;
        }
        onSearch(filtersToSend);
    };

    const handleClearClick = () => {
        // Tạo lại trạng thái ban đầu rỗng cho tất cả các trường
        const clearedFilters: Record<string, string> = {};
        searchFields.forEach(field => {
            clearedFilters[field.key] = '';
        });
        sortFields.forEach(field => {
            // Đặt lại giá trị mặc định cho các trường sắp xếp nếu có
            clearedFilters[field.key] = field.options[0]?.value || '';
        });
        setFilters(clearedFilters);
        onClear(); // Gọi hàm onClear từ parent để reset URL
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
        if (e.key === 'Enter') {
            handleSearchClick();
        }
    };

    return (
        <div className="filter-options">
            <div className="filter-options__grid">
                {/* Render Search Fields */}
                {searchFields.map((field) => (
                    <div
                        key={field.key}
                        className={`filter-options__form-group ${
                            field.gridSpan ? `filter-options__col-span-${field.gridSpan}` : ''
                        }`}
                    >
                        <label htmlFor={field.key} className="filter-options__form-group__label">
                            {field.label}:
                        </label>

                        {field.type === 'text' && (
                            <input
                                type="text"
                                id={field.key}
                                className="filter-options__form-group__input"
                                placeholder={field.placeholder}
                                value={filters[field.key] || ''} // Đảm bảo hiển thị giá trị từ state
                                onChange={(e) => handleChange(field.key, e.target.value)}
                                onKeyPress={handleKeyPress}
                            />
                        )}

                        {field.type === 'select' && (
                            <select
                                id={field.key}
                                className="filter-options__form-group__select"
                                value={filters[field.key] || ''} // Đảm bảo hiển thị giá trị từ state
                                onChange={(e) => handleChange(field.key, e.target.value)}
                                onKeyPress={handleKeyPress}
                                style={{padding: '10px 12px'}}
                            >
                                {field.options?.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        )}

                        {field.type === 'datetime' && (
                            <AntdDatePicker
                                id={field.key}
                                showTime={{
                                    defaultValue: dayjs('00:00:00', 'HH:mm:ss')
                                }}
                                format={field.format || 'YYYY-MM-DD HH:mm:ss'}
                                value={
                                    filters[field.key]
                                        ? dayjs(filters[field.key], field.format || 'YYYY-MM-DD HH:mm:ss')
                                        : null
                                }
                                onChange={(date, dateString) => handleDateChange(field.key, date, dateString)}
                                className="filter-options__form-group__date-picker"
                                style={{ width: '100%', padding: '8px 12px',  borderRadius: 3}}
                                placeholder={field.placeholder}
                            />
                        )}

                        {field.type === 'number' && (
                            <input
                                type="number"
                                id={field.key}
                                className="filter-options__form-group__input"
                                placeholder={field.placeholder}
                                value={filters[field.key] || ''} // Đảm bảo hiển thị giá trị từ state
                                onChange={(e) => handleChange(field.key, e.target.value)}
                                onKeyPress={handleKeyPress}
                            />
                        )}

                    </div>
                ))}

                {/* Render Sort Fields */}
                {sortFields.map((field) => (
                    <div
                        key={field.key}
                        className={`filter-options__form-group ${
                            field.gridSpan ? `filter-options__col-span-${field.gridSpan}` : ''
                        }`}
                    >
                        <label htmlFor={field.key} className="filter-options__form-group__label">
                            {field.label}:
                        </label>
                        <select
                            id={field.key}
                            className="filter-options__form-group__select"
                            value={filters[field.key] || ''} // Đảm bảo hiển thị giá trị từ state
                            onChange={(e) => handleChange(field.key, e.target.value)}
                            onKeyPress={handleKeyPress}
                            style={{padding: '10px 12px'}}
                        >
                            {field.options.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                ))}

                {/* Action Buttons */}
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
