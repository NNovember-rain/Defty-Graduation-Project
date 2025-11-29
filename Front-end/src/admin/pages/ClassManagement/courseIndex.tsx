import React, { useEffect, useCallback } from "react";
import ManagementTemplate, { type ActionButton } from "../../template/ManagementTemplate";
import type { SearchField, SortField } from "../../template/ManagementTemplate/FilterOption.tsx";
import { useTranslation } from "react-i18next";
import { FaEdit, FaTrash, FaEye, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import dayjs from 'dayjs';

import {
    getCourses,
    deleteCourse,
    type ICourse,
    type GetCoursesOptions,
    toggleCourseStatus
} from "../../../shared/services/courseService.ts";

import { useNavigate } from "react-router-dom";
import { useNotification } from "../../../shared/notification/useNotification.ts";

const CourseLvManagement: React.FC = () => {
    const { message, modal } = useNotification();
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [courses, setCourses] = React.useState<ICourse[]>([]);
    const [totalCourses, setTotalCourses] = React.useState(0);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    const [currentFilters, setCurrentFilters] = React.useState<Record<string, any>>({});
    const [currentPage, setCurrentPage] = React.useState(1);
    const [entriesPerPage, setEntriesPerPage] = React.useState(10);
    const [currentSortColumn, setCurrentSortColumn] = React.useState<string | null>(null);
    const [currentSortOrder, setCurrentSortOrder] = React.useState<'asc' | 'desc' | null>(null);

    const updateUrl = useCallback(() => {
        const params = new URLSearchParams();

        for (const key in currentFilters) {
            const value = currentFilters[key];
            if (value !== undefined && value !== null && value !== '') {
                if (Array.isArray(value) && value.length > 0) {
                    params.set(key, value.join(','));
                } else if (!Array.isArray(value)) {
                    params.set(key, String(value));
                }
            }
        }

        if (currentPage !== 1) {
            params.set('page', currentPage.toString());
        }
        if (entriesPerPage !== 10) {
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

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);

        const filters: Record<string, any> = {};
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
            const newFilters: Record<string, any> = {};
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

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const options: GetCoursesOptions = {
                page: currentPage,
                limit: entriesPerPage,
                sortBy: currentSortColumn || undefined,
                sortOrder: currentSortOrder || undefined,
                courseName: currentFilters.courseName || undefined,
                status: currentFilters.status !== '' && currentFilters.status !== undefined
                    ? parseInt(currentFilters.status, 10)
                    : undefined,
            };

            const result = await getCourses(options);

            if (result && result.content) {
                setCourses(result.content || []);
                setTotalCourses(result.totalElements || 0);
            } else {
                console.error('Unexpected API response structure:', result);
                setError('Có lỗi khi tải dữ liệu');
            }
        } catch (err: any) {
            console.error("Failed to fetch courses:", err);
            const errorMessage = err?.response?.data?.message || err?.message || 'Có lỗi khi tải dữ liệu';
            setError(errorMessage);
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [currentPage, entriesPerPage, currentSortColumn, currentSortOrder, currentFilters, message]);

    useEffect(() => {
        fetchData();
    }, [currentPage, entriesPerPage, currentSortColumn, currentSortOrder, currentFilters]);

    useEffect(() => {
        updateUrl();
    }, [currentFilters, currentPage, entriesPerPage, currentSortColumn, currentSortOrder]);

    const dataTableColumns = React.useMemo(() => [
        {
            key: 'courseName',
            label: 'Tên khóa học',
            sortable: true
        },
        {
            key: 'description',
            label: 'Mô tả',
            sortable: false,
            render: (value: string) => {
                if (!value) return '-';
                return value.length > 100 ? `${value.substring(0, 100)}...` : value;
            }
        },
        {
            key: 'color',
            label: 'Màu sắc chủ đạo',
            sortable: false,
            render: (value: string) => {
                if (!value) return '-';

                const hexColorRegex = /^#([0-9A-F]{3}|[0-9A-F]{6})$/i;
                const isValidHex = hexColorRegex.test(value);

                return (
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '6px 12px',
                        backgroundColor: 'rgba(0, 0, 0, 0.02)',
                        borderRadius: '8px',
                        border: '1px solid rgba(0, 0, 0, 0.06)'
                    }}>
                        <div
                            style={{
                                backgroundColor: isValidHex ? value : '#cccccc',
                                width: '32px',
                                height: '32px',
                                minWidth: '32px',
                                minHeight: '32px',
                                borderRadius: '6px',
                                flexShrink: 0,
                                display: 'block',
                                border: '2px solid rgba(255, 255, 255, 0.9)',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15), inset 0 0 0 1px rgba(0, 0, 0, 0.1)',
                                transition: 'transform 0.2s ease',
                                cursor: 'pointer'
                            }}
                            title={isValidHex ? value : 'Màu không hợp lệ'}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.15)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                            }}
                        />
                        <span style={{
                            fontSize: '13px',
                            fontFamily: 'Monaco, Consolas, monospace',
                            color: '#4b5563',
                            fontWeight: '500',
                            letterSpacing: '0.3px'
                        }}>
                            {isValidHex ? value.toUpperCase() : 'N/A'}
                        </span>
                    </div>
                );
            }
        },
        {
            key: 'createdDate',
            label: 'Ngày tạo',
            sortable: true,
            render: (value: string | Date) => {
                try {
                    return dayjs(value).format('YYYY-MM-DD HH:mm');
                } catch {
                    return value ? String(value) : '-';
                }
            }
        },
        {
            key: 'modifiedDate',
            label: 'Ngày chỉnh sửa',
            sortable: true,
            render: (value: string | Date) => {
                if (!value) return '-';
                try {
                    return dayjs(value).format('YYYY-MM-DD HH:mm');
                } catch {
                    return String(value);
                }
            }
        },
    ], []);

    const searchFields: SearchField[] = React.useMemo(() => [
        {
            key: 'courseName',
            label: 'Tên khóa học',
            type: 'text',
            placeholder: 'Nhập tên khóa học',
            gridSpan: 1
        },
        {
            key: 'status',
            label: 'Trạng thái',
            type: 'select',
            placeholder: 'Chọn trạng thái',
            gridSpan: 1,
            options: [
                { value: '1', label: 'Hoạt động' },
                { value: '0', label: 'Ngừng hoạt động' }
            ]
        },
    ], []);

    const sortFields: SortField[] = React.useMemo(() => [], []);

    const handleSearch = useCallback((filtersFromForm: Record<string, any>) => {
        setCurrentFilters(filtersFromForm);
        setCurrentPage(1);

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
        setEntriesPerPage(10);
    }, []);

    const handlePageChange = useCallback((page: number) => {
        setCurrentPage(page);
    }, []);

    const handleEntriesPerPageChange = useCallback((entries: number) => {
        setEntriesPerPage(entries);
        setCurrentPage(1);
    }, []);

    const handleCreateNew = useCallback(() => {
        navigate("/admin/course/create");
    }, [navigate]);

    const handleEditCourse = useCallback((rowData: ICourse) => {
        navigate(`/admin/course/update/${rowData.id}`);
    }, [navigate]);

    const handleDeleteCourse = useCallback(async (rowData: ICourse) => {
        if (!rowData.id) {
            console.error("Attempted to delete course with no ID:", rowData);
            message.error('Không thể xóa khóa học');
            return;
        }

        modal.deleteConfirm(
            'Xóa khóa học',
            async () => {
                try {
                    setLoading(true);
                    await deleteCourse(rowData.id);
                    message.success('Xóa khóa học thành công');
                    await fetchData();
                } catch (error: any) {
                    const errorMessage = error?.response?.data?.message || error?.message || 'Có lỗi khi xóa dữ liệu';
                    setError(errorMessage);
                    message.error(errorMessage);
                } finally {
                    setLoading(false);
                }
            },
            `Bạn có chắc chắn muốn xóa khóa học "${rowData.courseName}" không?`
        );
    }, [fetchData, modal, message]);

    const handleBulkDelete = useCallback(async (ids: string[]) => {
        if (ids.length === 0) return;

        const numericIds = ids.map(id => Number(id));

        modal.deleteConfirm(
            'Xóa nhiều khóa học',
            async () => {
                try {
                    setLoading(true);
                    await deleteCourse(numericIds);
                    message.success(`Xóa thành công ${numericIds.length} khóa học`);
                    await fetchData();
                } catch (error: any) {
                    const errorMessage = error?.response?.data?.message || error?.message || 'Có lỗi khi xóa dữ liệu';
                    setError(errorMessage);
                    message.error(errorMessage);
                } finally {
                    setLoading(false);
                }
            },
            `Bạn có chắc chắn muốn xóa ${ids.length} khóa học đã chọn không?`
        );
    }, [fetchData, modal, message]);

    const handleToggleActiveStatus = useCallback(async (rowData: ICourse) => {
        if (!rowData.id) return;
        const newStatus = rowData.status === 1 ? 0 : 1;

        const confirmMessage = newStatus
            ? `Bạn có chắc chắn muốn kích hoạt khóa học "${rowData.courseName}" không?`
            : `Bạn có chắc chắn muốn ngưng hoạt động khóa học "${rowData.courseName}" không?`;

        modal.confirm({
            title: 'Xác nhận thay đổi trạng thái khóa học',
            content: confirmMessage,
            onOk: async () => {
                try {
                    setLoading(true);
                    await toggleCourseStatus(rowData.id as number, newStatus);

                    message.success(`Cập nhật thành công, trạng thái: ${newStatus ? 'Đang hoạt động' : 'Ngưng hoạt động'}`);

                    await fetchData();
                } catch (error: any) {
                    console.error("Error toggling course status:", error);
                    const errorMessage = error?.response?.data?.message || error?.message || "Có lỗi xảy ra khi cập nhật dữ liệu";
                    setError(errorMessage);
                    message.error(errorMessage);
                } finally {
                    setLoading(false);
                }
            },
        });
    }, [fetchData, modal, message]);

    const courseActions = React.useMemo(() => [
        {
            icon: (rowData: ICourse) => rowData.status ? <FaToggleOn fontSize={17} /> : <FaToggleOff fontSize={17} />,
            onClick: handleToggleActiveStatus,
            className: (rowData: ICourse) => rowData.status ? 'text-green-500 hover:text-green-700' : 'text-gray-500 hover:text-gray-700',
            tooltip: (rowData: ICourse) => rowData.status ? 'Ngưng hoạt động' : 'Kích hoạt',
            color: '#63782b'
        },
        {
            icon: <FaEdit />,
            onClick: handleEditCourse,
            className: 'text-blue-500 hover:text-blue-700 ml-2',
            tooltip: 'Chỉnh sửa',
            color: '#7600ff'
        },
        {
            icon: <FaTrash />,
            onClick: handleDeleteCourse,
            className: 'text-red-500 hover:text-red-700 ml-2',
            tooltip: 'Xóa',
            color: '#f62626'
        },
    ], [handleEditCourse, handleDeleteCourse, handleToggleActiveStatus]);

    // Loading and error states
    if (loading && courses.length === 0) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-lg">Đang tải dữ liệu...</div>
            </div>
        );
    }

    if (error && courses.length === 0) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-red-500 text-center">
                    <p className="text-lg font-semibold">Có lỗi xảy ra</p>
                    <p className="mt-2">{error}</p>
                    <button
                        onClick={fetchData}
                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <ManagementTemplate
            pageTitle="Quản lý khóa học"
            breadcrumbItems={[
                { label: 'Trang chủ', path: '/' },
                { label: 'Quản trị viên', path: '/admin' },
                { label: 'Quản lý khóa học' },
            ]}
            searchFields={searchFields}
            sortFields={sortFields}
            onSearch={handleSearch}
            onClear={handleClear}
            columns={dataTableColumns}
            data={courses}
            totalEntries={totalCourses}
            entriesPerPage={entriesPerPage}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            currentSortColumn={currentSortColumn}
            currentSortOrder={currentSortOrder}
            onCreateNew={handleCreateNew}
            onEntriesPerPageChange={handleEntriesPerPageChange}
            actions={courseActions as ActionButton[]}
            initialFilters={currentFilters}
            initialSortBy={currentSortColumn}
            initialSortOrder={currentSortOrder}
            onBulkDelete={handleBulkDelete}
        />
    );
}

export default CourseLvManagement;