import React, { useCallback, useState, useEffect } from "react";
import ManagementTemplate, { type ActionButton } from "../../../template/ManagementTemplate";
import type { SearchField } from "../../../template/ManagementTemplate/FilterOption";
import { useTranslation } from "react-i18next";
import { FaEdit, FaTrash, FaEye, FaToggleOn, FaToggleOff, FaGlobe, FaLock } from 'react-icons/fa';
import { useNavigate } from "react-router-dom";
import { useNotification } from "../../../../shared/notification/useNotification";
import dayjs from 'dayjs';
import {
    getTestSets,
    deleteTestSet,
    toggleTestSetStatus,
    type ITestSet,
    type GetTestSetsOptions,
    toggleTestSetPublic
} from "../../../../shared/services/questionBankService/testSetService.ts";
import { getAllActiveTestCollections } from "../../../../shared/services/questionBankService/testCollectionService.ts";
import TestSetQuestionsModal from "./TestSetQuestionsModal";
const TestSetManagement: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { message, modal } = useNotification();

    const [testSets, setTestSets] = useState<ITestSet[]>([]);
    const [totalSets, setTotalSets] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [collections, setCollections] = useState<any[]>([]);

    const [currentFilters, setCurrentFilters] = useState<Record<string, any>>({});
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [currentSortColumn, setCurrentSortColumn] = useState<string | null>(null);
    const [currentSortOrder, setCurrentSortOrder] = useState<'asc' | 'desc' | null>(null);
    const [isQuestionsModalOpen, setIsQuestionsModalOpen] = useState(false);
    const [selectedTestSetForQuestions, setSelectedTestSetForQuestions] = useState<ITestSet | null>(null);
    // Fetch collections for filter
    useEffect(() => {
        const fetchCollections = async () => {
            try {
                const result = await getAllActiveTestCollections();
                if (result.data) {
                    setCollections(result.data.map((collection: any) => ({
                        value: collection.id,
                        label: collection.collectionName
                    })));
                }
            } catch (error) {
                console.error("Failed to fetch collections:", error);
            }
        };
        fetchCollections();
    }, []);

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
            const options: GetTestSetsOptions = {
                page: currentPage,
                limit: entriesPerPage,
                sortBy: currentSortColumn || undefined,
                sortOrder: currentSortOrder || undefined,
                testName: currentFilters.testName || undefined,
                slug: currentFilters.slug || undefined,
                collectionId: currentFilters.collectionId || undefined,
                status: currentFilters.status !== '' && currentFilters.status !== undefined
                    ? parseInt(currentFilters.status, 10)
                    : undefined,
            };

            const result = await getTestSets(options);

            if (result && result.content) {
                setTestSets(result.content || []);
                setTotalSets(result.totalElements || 0);
            } else {
                console.error('Unexpected API response structure:', result);
                setError(t('common.errorFetchingData'));
            }
        } catch (err: any) {
            console.error("Failed to fetch test sets:", err);
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
            key: "testName",
            label: "Tên bài test",
            sortable: true
        },
        {
            key: "testNumber",
            label: "Số thứ tự",
            sortable: true,
            render: (value: number) => {
                return value || 0;
            }
        },
        {
            key: "collectionName",
            label: "Bộ sưu tập",
            sortable: false,
            render: (value: string) => {
                return value || '-';
            }
        },
        {
            key: "totalQuestions",
            label: "Tổng số câu hỏi",
            sortable: true,
            render: (value: number) => {
                return value || 0;
            }
        },
        {
            key: "slug",
            label: "Đường dẫn",
            sortable: true
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
            key: "testName",
            label: "Tên bài test",
            type: "text",
            placeholder: "Nhập tên bài test",
            gridSpan: 1
        },
        {
            key: "collectionId",
            label: "Bộ sưu tập",
            type: "select",
            placeholder: "Chọn bộ sưu tập",
            gridSpan: 1,
            options: collections
        },
        {
            key: "slug",
            label: "Đường dẫn",
            type: "text",
            placeholder: "Nhập đường dẫn",
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
        navigate("/admin/content/question-bank/test-sets/create");
    }, [navigate]);
    const handleViewTestSetDetails = useCallback((rowData: ITestSet) => {
        navigate(`/admin/content/question-bank/test-sets/view/${rowData.id}`);
    }, [navigate]);
    const handleQuickViewQuestions = useCallback((rowData: ITestSet) => {
        setSelectedTestSetForQuestions(rowData);
        setIsQuestionsModalOpen(true);
    }, []);

    const handleCloseQuestionsModal = useCallback(() => {
        setIsQuestionsModalOpen(false);
        setSelectedTestSetForQuestions(null);
    }, []);

    const handleEditTestSet = useCallback((rowData: ITestSet) => {
        navigate(`/admin/content/question-bank/test-sets/update/${rowData.id}`);
    }, [navigate]);

    const handleDeleteTestSet = useCallback(async (rowData: ITestSet) => {
        if (!rowData.id) {
            console.error("Attempted to delete test set with no ID:", rowData);
            message.error("Không thể xóa: thiếu ID");
            return;
        }

        modal.deleteConfirm(
            "Xóa bài test",
            async () => {
                try {
                    setLoading(true);
                    await deleteTestSet(rowData.id);
                    message.success("Xóa bài test thành công");
                    await fetchData();
                } catch (error: any) {
                    const errorMessage = error?.response?.data?.message || error?.message || "Có lỗi xảy ra khi xóa dữ liệu";
                    setError(errorMessage);
                    message.error(errorMessage);
                } finally {
                    setLoading(false);
                }
            },
            `Bạn có chắc chắn muốn xóa bài test "${rowData.testName}" không?`
        );
    }, [modal, message, fetchData]);

    const handleToggleActiveStatus = useCallback(async (rowData: ITestSet) => {
        if (!rowData.id) return;

        const confirmMessage = rowData.status === 1
            ? `Bạn có chắc chắn muốn ngưng hoạt động bài test "${rowData.testName}" không?`
            : `Bạn có chắc chắn muốn kích hoạt bài test "${rowData.testName}" không?`;

        modal.confirm({
            title: 'Xác nhận thay đổi trạng thái',
            content: confirmMessage,
            onOk: async () => {
                try {
                    setLoading(true);
                    await toggleTestSetStatus(rowData.id);
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

    const handleTogglePublicStatus = useCallback(async (rowData: ITestSet) => {
        if (!rowData.id) return;

        const confirmMessage = rowData.isPublic
            ? `Bạn có chắc chắn muốn chuyển bài test "${rowData.testName}" sang chế độ riêng tư không?`
            : `Bạn có chắc chắn muốn công khai bài test "${rowData.testName}" cho mọi người không?`;

        modal.confirm({
            title: 'Xác nhận thay đổi trạng thái công khai',
            content: confirmMessage,
            onOk: async () => {
                try {
                    setLoading(true);
                    await toggleTestSetPublic(rowData.id);
                    message.success(
                        `Cập nhật thành công, trạng thái: ${rowData.isPublic ? 'Riêng tư' : 'Công khai'}`
                    );
                    await fetchData();
                } catch (error: any) {
                    const errorMessage =
                        error?.response?.data?.message ||
                        error?.message ||
                        "Có lỗi xảy ra khi cập nhật trạng thái công khai";
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
                    await deleteTestSet(ids);
                    message.success(`Đã xóa thành công ${ids.length} bài test`);
                    await fetchData();
                } catch (error: any) {
                    const errorMessage = error?.response?.data?.message || error?.message || "Có lỗi xảy ra khi xóa dữ liệu";
                    setError(errorMessage);
                    message.error(errorMessage);
                } finally {
                    setLoading(false);
                }
            },
            `Bạn có chắc chắn muốn xóa ${ids.length} bài test đã chọn không?`
        );
    }, [modal, message, fetchData]);

    // Action buttons configuration

    const testSetActions = React.useMemo(() => [
        {
            icon: (rowData: ITestSet) => rowData.status ? <FaToggleOn fontSize={17} /> : <FaToggleOff fontSize={17} />,
            onClick: handleToggleActiveStatus,
            className: (rowData: ITestSet) => rowData.status ? 'text-green-500 hover:text-green-700' : 'text-gray-500 hover:text-gray-700',
            tooltip: (rowData: ITestSet) => rowData.status ? 'Ngưng hoạt động' : 'Kích hoạt',
            color: '#63782b'
        },
        {
            icon: (rowData: ITestSet) =>
                rowData.isPublic ? <FaGlobe fontSize={15} /> : <FaLock fontSize={13} />,
            onClick: handleTogglePublicStatus,
            className: (rowData: ITestSet) =>
                rowData.isPublic
                    ? 'text-sky-500 hover:text-sky-600 ml-2'
                    : 'text-gray-400 hover:text-gray-500 ml-2',
            tooltip: (rowData: ITestSet) =>
                rowData.isPublic ? 'Bộ đề công khai' : 'Bộ đề riêng tư',
            color: '#0ea5e9'
        },
        {
            icon: <FaEye />,
            onClick: handleQuickViewQuestions,
            className: 'text-gray-600 hover:text-gray-900 ml-2',
            tooltip: "Xem nhanh câu hỏi",
            color: '#6c757d'
        },
        {
            icon: <FaEdit />,
            onClick: handleEditTestSet,
            className: 'text-blue-500 hover:text-blue-700 ml-2',
            tooltip: "Chỉnh sửa",
            color: '#7600ff'
        },
        {
            icon: <FaTrash />,
            onClick: handleDeleteTestSet,
            className: 'text-red-500 hover:text-red-700 ml-2',
            tooltip: "Xóa",
            color: '#f62626'
        },
    ], [handleEditTestSet, handleDeleteTestSet, handleToggleActiveStatus, handleQuickViewQuestions, handleViewTestSetDetails]);

    // Loading and error states
    if (loading && testSets.length === 0) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-lg">{t('common.loadingData')}</div>
            </div>
        );
    }

    if (error && testSets.length === 0) {
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
        <>
            <ManagementTemplate
                pageTitle={t("testSetPage.title", "Quản lý Bài thi")}
                breadcrumbItems={[
                    { label: t("common.home", "Trang chủ"), path: "/" },
                    { label: "Ngân hàng câu hỏi" },
                    { label: "Bài thi" },
                ]}
                searchFields={searchFields}
                sortFields={[]}
                onSearch={handleSearch}
                onClear={handleClear}
                initialFilters={currentFilters}
                initialSortBy={currentSortColumn}
                initialSortOrder={currentSortOrder}
                columns={dataTableColumns}
                data={testSets}
                totalEntries={totalSets}
                entriesPerPage={entriesPerPage}
                currentPage={currentPage}
                onPageChange={handlePageChange}
                currentSortColumn={currentSortColumn}
                currentSortOrder={currentSortOrder}
                onEntriesPerPageChange={handleEntriesPerPageChange}
                onCreateNew={handleCreateNew}
                actions={testSetActions as ActionButton[]}
                onBulkDelete={handleBulkDelete}
            />

            {/* Modal xem nhanh câu hỏi */}
            <TestSetQuestionsModal
                isOpen={isQuestionsModalOpen}
                testSet={selectedTestSetForQuestions}
                onClose={handleCloseQuestionsModal}
            />
        </>
    );
};

export default TestSetManagement;