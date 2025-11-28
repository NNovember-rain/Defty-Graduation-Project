
import React, { useCallback, useState, useEffect } from "react";
import ManagementTemplate, { type ActionButton } from "../../../template/ManagementTemplate";
import type { SearchField } from "../../../template/ManagementTemplate/FilterOption";
import { useTranslation } from "react-i18next";
import { FaEdit, FaTrash, FaEye, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import { useNavigate } from "react-router-dom";
import { useNotification } from "../../../../shared/notification/useNotification";
import dayjs from 'dayjs';
import {
    getQuestionTags,
    deleteQuestionTag,
    toggleQuestionTagStatus,
    type IQuestionTag,
    type GetQuestionTagsOptions
} from "../../../../shared/services/questionBankService/questionTagService.ts";

const QuestionTagManagement: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { message, modal } = useNotification();

    const [questionTags, setQuestionTags] = useState<IQuestionTag[]>([]);
    const [totalTags, setTotalTags] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [currentFilters, setCurrentFilters] = useState<Record<string, any>>({});
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [currentSortColumn, setCurrentSortColumn] = useState<string | null>(null);
    const [currentSortOrder, setCurrentSortOrder] = useState<'asc' | 'desc' | null>(null);

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
            const options: GetQuestionTagsOptions = {
                page: currentPage,
                limit: entriesPerPage,
                sortBy: currentSortColumn || undefined,
                sortOrder: currentSortOrder || undefined,
                tagName: currentFilters.tagName || undefined,
                tagCategory: currentFilters.tagCategory || undefined,
                status: currentFilters.status !== '' && currentFilters.status !== undefined
                    ? parseInt(currentFilters.status, 10)
                    : undefined,
            };

            const result = await getQuestionTags(options);

            if (result && result.content) {
                setQuestionTags(result.content || []);
                setTotalTags(result.totalElements || 0);
            } else {
                console.error('Unexpected API response structure:', result);
                setError(t('common.errorFetchingData'));
            }
        } catch (err: any) {
            console.error("Failed to fetch question tags:", err);
            const errorMessage = err?.response?.data?.message || err?.message || t('common.errorFetchingData');
            setError(errorMessage);
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [currentPage, entriesPerPage, currentSortColumn, currentSortOrder, currentFilters, t, message]);

    useEffect(() => {
        fetchData();
    }, [currentPage, entriesPerPage, currentSortColumn, currentSortOrder, currentFilters]);

    useEffect(() => {
        updateUrl();
    }, [currentFilters, currentPage, entriesPerPage, currentSortColumn, currentSortOrder]);

    const dataTableColumns = React.useMemo(() => [
        {
            key: "tagName",
            label: "Tên thẻ",
            sortable: true
        },
        // {
        //     key: "tagCategory",
        //     label: "Danh mục",
        //     sortable: true,
        //     render: (value: string) => {
        //         const categoryMap: Record<string, string> = {
        //             'SUBJECT': 'Môn học',
        //             'DIFFICULTY': 'Độ khó',
        //             'TOPIC': 'Chủ đề',
        //             'SKILL': 'Kỹ năng',
        //             'OTHER': 'Khác'
        //         };
        //         return categoryMap[value] || value || '-';
        //     }
        // },
        {
            key: "description",
            label: "Mô tả",
            sortable: false,
            render: (value: string) => {
                if (!value) return '-';
                return value.length > 50 ? `${value.substring(0, 50)}...` : value;
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

    const searchFields: SearchField[] = [
        {
            key: "tagName",
            label: "Tên thẻ",
            type: "text",
            placeholder: "Nhập tên thẻ câu hỏi",
            gridSpan: 1
        },
        // {
        //     key: 'tagCategory',
        //     label: 'Danh mục thẻ',
        //     type: 'select',
        //     placeholder: 'Chọn danh mục thẻ',
        //     gridSpan: 1,
        //     searchable: true,
        //     showSearch: true,
        //     filterOption: true,
        //     options: [
        //         { value: 'SUBJECT', label: 'Môn học' },
        //         { value: 'DIFFICULTY', label: 'Độ khó' },
        //         { value: 'TOPIC', label: 'Chủ đề' },
        //         { value: 'SKILL', label: 'Kỹ năng' },
        //         { value: 'OTHER', label: 'Khác' },
        //     ]
        // },
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
    ];

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

    // Action handlers
    const handleCreateNew = useCallback(() => {
        navigate("/admin/question-bank/tags/create");
    }, [navigate]);

    const handleViewTagDetails = useCallback((rowData: IQuestionTag) => {
        navigate(`/admin/question-bank/tags/view/${rowData.id}`);
    }, [navigate]);

    const handleEditTag = useCallback((rowData: IQuestionTag) => {
        navigate(`/admin/question-bank/tags/update/${rowData.id}`);
    }, [navigate]);

    const handleDeleteTag = useCallback(async (rowData: IQuestionTag) => {
        if (!rowData.id) {
            console.error("Attempted to delete tag with no ID:", rowData);
            message.error("Không thể xóa: thiếu ID");
            return;
        }

        modal.deleteConfirm(
            "Xóa thẻ câu hỏi",
            async () => {
                try {
                    setLoading(true);
                    await deleteQuestionTag(rowData.id);
                    message.success("Xóa thẻ câu hỏi thành công");
                    await fetchData();
                } catch (error: any) {
                    const errorMessage = error?.response?.data?.message || error?.message || "Có lỗi xảy ra khi xóa dữ liệu";
                    setError(errorMessage);
                    message.error(errorMessage);
                } finally {
                    setLoading(false);
                }
            },
            `Bạn có chắc chắn muốn xóa thẻ "${rowData.tagName}" không?`
        );
    }, [modal, message, fetchData]);

    const handleToggleActiveStatus = useCallback(async (rowData: IQuestionTag) => {
        if (!rowData.id) return;

        const confirmMessage = rowData.status === 1
            ? `Bạn có chắc chắn muốn ngưng hoạt động thẻ "${rowData.tagName}" không?`
            : `Bạn có chắc chắn muốn kích hoạt thẻ "${rowData.tagName}" không?`;

        modal.confirm({
            title: 'Xác nhận thay đổi trạng thái',
            content: confirmMessage,
            onOk: async () => {
                try {
                    setLoading(true);
                    await toggleQuestionTagStatus(rowData.id);
                    message.success(`Cập nhật thành công, trạng thái: ${rowData.status === 1 ? 'Ngưng hoạt động' : 'Đang hoạt động'}`);
                    await fetchData();
                } catch (error: any) {
                    const errorMessage = error?.response?.data?.message || error?.message || "Có lỗi xảy ra khi cập nhật dữ liệu";
                    setError(errorMessage);
                    message.error(errorMessage);
                } finally {
                    setLoading(false);
                }
            },
        });
    }, [modal, message, fetchData]);

    const handleBulkDelete = useCallback(async (ids: string[]) => {
        if (ids.length === 0) return;

        modal.deleteConfirm(
            "Xóa hàng loạt",
            async () => {
                try {
                    setLoading(true);
                    await deleteQuestionTag(ids);
                    message.success(`Đã xóa thành công ${ids.length} thẻ câu hỏi`);
                    await fetchData();
                } catch (error: any) {
                    const errorMessage = error?.response?.data?.message || error?.message || "Có lỗi xảy ra khi xóa dữ liệu";
                    setError(errorMessage);
                    message.error(errorMessage);
                } finally {
                    setLoading(false);
                }
            },
            `Bạn có chắc chắn muốn xóa ${ids.length} thẻ đã chọn không?`
        );
    }, [modal, message, fetchData]);

    // Action buttons configuration
    const questionTagActions = React.useMemo(() => [
        {
            icon: (rowData: IQuestionTag) => rowData.status ? <FaToggleOn fontSize={17} /> : <FaToggleOff fontSize={17} />,
            onClick: handleToggleActiveStatus,
            className: (rowData: IQuestionTag) => rowData.status ? 'text-green-500 hover:text-green-700' : 'text-gray-500 hover:text-gray-700',
            tooltip: (rowData: IQuestionTag) => rowData.status ? 'Ngưng hoạt động' : 'Kích hoạt',
            color: '#63782b'
        },
        {
            icon: <FaEye />,
            onClick: handleViewTagDetails,
            className: 'text-gray-600 hover:text-gray-900 ml-2',
            tooltip: "Xem chi tiết",
            color: '#6c757d'
        },
        {
            icon: <FaEdit />,
            onClick: handleEditTag,
            className: 'text-blue-500 hover:text-blue-700 ml-2',
            tooltip: "Chỉnh sửa",
            color: '#7600ff'
        },
        {
            icon: <FaTrash />,
            onClick: handleDeleteTag,
            className: 'text-red-500 hover:text-red-700 ml-2',
            tooltip: "Xóa",
            color: '#f62626'
        },
    ], [handleEditTag, handleDeleteTag, handleViewTagDetails, handleToggleActiveStatus]);

    // Loading and error states
    if (loading && questionTags.length === 0) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-lg">{t('common.loadingData')}</div>
            </div>
        );
    }

    if (error && questionTags.length === 0) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-red-500 text-center">
                    <p className="text-lg font-semibold">{t('common.error')}</p>
                    <p className="mt-2">{error}</p>
                    <button
                        onClick={fetchData}
                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        {t('common.retry')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <ManagementTemplate
            pageTitle={t("questionTagPage.title", "Quản lý Thẻ câu hỏi")}
            breadcrumbItems={[
                { label: t("common.home", "Trang chủ"), path: "/" },
                { label: "Ngân hàng câu hỏi" },
                { label: "Thẻ câu hỏi" },
            ]}
            searchFields={searchFields}
            sortFields={[]}
            onSearch={handleSearch}
            onClear={handleClear}
            initialFilters={currentFilters}
            initialSortBy={currentSortColumn}
            initialSortOrder={currentSortOrder}
            columns={dataTableColumns}
            data={questionTags}
            totalEntries={totalTags}
            entriesPerPage={entriesPerPage}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            currentSortColumn={currentSortColumn}
            currentSortOrder={currentSortOrder}
            onEntriesPerPageChange={handleEntriesPerPageChange}
            onCreateNew={handleCreateNew}
            actions={questionTagActions as ActionButton[]}
            onBulkDelete={handleBulkDelete}
        />
    );
};

export default QuestionTagManagement;