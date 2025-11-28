import React, { useCallback, useState, useEffect } from "react";
import ManagementTemplate, { type ActionButton } from "../../../template/ManagementTemplate";
import type { SearchField } from "../../../template/ManagementTemplate/FilterOption";
import { useTranslation } from "react-i18next";
import { FaEye, FaTrash, FaTimes } from 'react-icons/fa';
import { useNavigate } from "react-router-dom";
import { useNotification } from "../../../../shared/notification/useNotification";
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import UploadDetailModal from "./uploadDetailModal";
import {
    getFileProcessings,
    deleteProcessings,
    cancelProcessing,
    type GetFileProcessingsOptions
} from "../../../../shared/services/questionBankService/fileProcessingService";
import { getAllActiveTestSets } from "../../../../shared/services/questionBankService/testSetService";

dayjs.extend(duration);
dayjs.extend(relativeTime);
dayjs.locale('vi');

// Types - Cập nhật theo response backend
interface IUploadProcess {
    id: string;
    testSetId: string;
    testSetName?: string;
    partType: 'LC' | 'RC';
    totalQuestionsFound?: number;
    questionsInserted?: number;
    questionsDuplicated?: number;
    questionsFailed?: number;
    existingQuestionsCount?: number;
    errorMessage?: string
    manuallyResolved?: boolean;
    status: number; // -1: DELETED, 0: CANCELED, 1: COMPLETED, 2: PROCESSING, 3: PENDING, 4: FAILED
    createdDate: string;
    modifiedDate: string;
    createdBy: string | null;
    modifiedBy: string | null;
}

const UploadProcessManagement: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { message, modal } = useNotification();

    const [uploadProcesses, setUploadProcesses] = useState<IUploadProcess[]>([]);
    const [totalProcesses, setTotalProcesses] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [currentFilters, setCurrentFilters] = useState<Record<string, any>>({});
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [currentSortColumn, setCurrentSortColumn] = useState<string | null>('createdDate');
    const [currentSortOrder, setCurrentSortOrder] = useState<'asc' | 'desc' | null>('desc');

    const [selectedUpload, setSelectedUpload] = useState<IUploadProcess | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [testSetOptions, setTestSetOptions] = useState<Array<{ value: string; label: string }>>([]);
    const [loadingTestSets, setLoadingTestSets] = useState(false);

    const fetchData = useCallback(async (overrideOptions?: Partial<GetFileProcessingsOptions & { filters?: Record<string, any> }>) => {
        setLoading(true);
        setError(null);
        try {
            const filters = overrideOptions?.filters || currentFilters;
            const page = overrideOptions?.page ?? currentPage;
            const limit = overrideOptions?.limit ?? entriesPerPage;
            const sortBy = overrideOptions?.sortBy ?? currentSortColumn;
            const sortOrder = overrideOptions?.sortOrder ?? currentSortOrder;

            const options: GetFileProcessingsOptions = {
                page,
                limit,
                sortBy: sortBy || undefined,
                sortOrder: sortOrder || undefined,
                testSetId: filters.testSetId || undefined,
                partType: filters.partType || undefined,
                status: filters.status ? String(filters.status) : undefined,
            };

            const result = await getFileProcessings(options);

            if (result && result.content) {
                // Map IFileProcessing sang IUploadProcess
                const mappedData: IUploadProcess[] = result.content.map(item => ({
                    id: item.id,
                    testSetId: item.testSetId,
                    testSetName: item.testSetName,
                    partType: item.partType as 'LC' | 'RC',
                    totalQuestionsFound: item.totalQuestionsFound,
                    questionsInserted: item.questionsInserted,
                    questionsDuplicated: item.questionsDuplicated,
                    questionsFailed: item.questionsFailed,
                    existingQuestionsCount: item.existingQuestionsCount,
                    manuallyResolved: item.manuallyResolved,
                    errorMessage: item.errorMessage,
                    status: item.status,
                    createdDate: item.createdDate || '',
                    modifiedDate: item.modifiedDate || '',
                    createdBy: item.createdBy,
                    modifiedBy: item.modifiedBy,
                }));

                setUploadProcesses(mappedData);
                setTotalProcesses(result.totalElements || 0);
            } else {
                console.error('Unexpected API response structure:', result);
                setError(t('common.errorFetchingData'));
            }
        } catch (err: any) {
            console.error("Failed to fetch upload processes:", err);
            const errorMessage = err?.message || t('common.errorFetchingData');
            setError(errorMessage);
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [currentPage, entriesPerPage, currentSortColumn, currentSortOrder, currentFilters, t, message]);

    // Load test sets for filter
    const fetchTestSets = useCallback(async () => {
        setLoadingTestSets(true);
        try {
            const result = await getAllActiveTestSets();

            if (result.status === 200 && result.data) {
                const testSets = result.data.map(item => ({
                    value: item.id,
                    label: `${item.testName}`
                    // label: `${item.testName}${item.testNumber ? ` (Test ${item.testNumber})` : ''}`
                }));

                setTestSetOptions(testSets);
            }
        } catch (err: any) {
            console.error("Failed to fetch test sets:", err);
            message.error("Không thể tải danh sách test set");
        } finally {
            setLoadingTestSets(false);
        }
    }, [message]);

    // Load test sets on mount - CHỈ GỌI 1 LẦN
    useEffect(() => {
        fetchTestSets();
    }, []); // Empty dependency array - chỉ chạy khi mount

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

    // Load initial URL params
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
        setCurrentSortColumn(params.get('sortBy') || 'createdDate');
        setCurrentSortOrder(params.get('sortOrder') as 'asc' | 'desc' || 'desc');

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
            setCurrentSortColumn(newParams.get('sortBy') || 'createdDate');
            setCurrentSortOrder(newParams.get('sortOrder') as 'asc' | 'desc' || 'desc');
        };

        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, []);

    useEffect(() => {
        fetchData();
    }, [currentPage, entriesPerPage, currentSortColumn, currentSortOrder]);

    useEffect(() => {
        updateUrl();
    }, [currentFilters, currentPage, entriesPerPage, currentSortColumn, currentSortOrder]);

    // Helper functions
    const getStatusBadge = (status: number) => {
        const badges = {
            '-1': { text: 'Đã xóa', color: 'bg-gray-100 text-gray-800' },
            '0': { text: 'Đã hủy', color: 'bg-gray-100 text-gray-800' },
            '1': { text: 'Hoàn thành', color: 'bg-green-100 text-green-800' },
            '2': { text: 'Đang xử lý', color: 'bg-blue-100 text-blue-800' },
            '3': { text: 'Đang chờ', color: 'bg-yellow-100 text-yellow-800' },
            '4': { text: 'Thất bại', color: 'bg-red-100 text-red-800' },
        };
        const badge = badges[String(status) as keyof typeof badges] || { text: 'Không rõ', color: 'bg-gray-100 text-gray-800' };
        return <span className={`px-2 py-1 rounded text-xs font-medium ${badge.color}`}>{badge.text}</span>;
    };

    const getProcessingTime = (process: IUploadProcess): string => {
        if (!process.createdDate) return '-';

        const start = dayjs(process.createdDate);
        const end = process.status === 1 ? dayjs(process.modifiedDate) : dayjs();
        const diff = end.diff(start, 'second');

        if (diff < 60) return `${diff}s`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ${diff % 60}s`;
        return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`;
    };

    const dataTableColumns = React.useMemo(() => [
        {
            key: "testSetName",
            label: "Đề thi",
            sortable: false,
            render: (value: string, row: IUploadProcess) => (
                <div className="flex flex-col">
                    <span className="text-sm font-medium">{value || row.testSetId}</span>
                </div>
            )
        },
        {
            key: "partType",
            label: "Phần thi",
            sortable: false,
            render: (value: string) => (
                <span className="px-2 py-1 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                    {value}
                </span>
            )
        },
        {
            key: "status",
            label: "Trạng thái",
            sortable: true,
            render: (value: number) => getStatusBadge(value)
        },
        {
            key: "progress",
            label: "Kết quả",
            sortable: false,
            render: (_: any, row: IUploadProcess) => {
                if (row.status === 1) { // COMPLETED
                    return (
                        <div className="flex flex-col text-sm">
                            {row.questionsInserted !== null && row.questionsInserted !== undefined && (
                                <span className="text-green-600 font-medium">✓ {row.questionsInserted} câu hoàn thành</span>
                            )}
                            {/*{row.questionsDuplicated && row.questionsDuplicated > 0 && (*/}
                            {/*    <span className="text-yellow-600 text-xs">⚠ {row.questionsDuplicated} trùng</span>*/}
                            {/*)}*/}
                            {row.questionsFailed !== null && row.questionsFailed !== undefined && row.questionsFailed > 0 && (
                                <span className="text-red-600 text-xs">☓ {row.questionsFailed} lỗi</span>
                            )}
                        </div>
                    );
                }
                if (row.status === 4) { // FAILED
                    return <span className="text-red-600 text-sm">☓ Thất bại</span>;
                }
                if (row.status === 2) { // PROCESSING
                    return <span className="text-blue-600 text-sm">⏳ Đang xử lý...</span>;
                }
                if (row.status === 3) { // PENDING
                    return <span className="text-yellow-600 text-sm">⏳ Chờ xử lý...</span>;
                }
                return <span className="text-gray-400 text-sm">-</span>;
            }
        },
        {
            key: "manuallyResolved",
            label: "Xử lý thủ công",
            render: (_: any, row: IUploadProcess) => {
                if (row.status === 1 && row.manuallyResolved !== null) {
                    return row.manuallyResolved ? (
                        <span className="text-green-600 font-medium">✓ Đã xử lý</span>
                    ) : (
                        <span className="text-yellow-600 font-medium">Chưa xử lý</span>
                    );
                }
                return <span className="text-gray-400">-</span>;
            }
        },
        {
            key: "createdDate",
            label: "Ngày tạo",
            sortable: true,
            render: (value: string, row: IUploadProcess) => (
                <div className="flex flex-col text-xs">
                    <span>{dayjs(value).format('DD/MM/YYYY HH:mm')}</span>
                    {row.status === 1 && (
                        <span className="text-green-600">⏱ {getProcessingTime(row)}</span>
                    )}
                </div>
            )
        },
    ], []);

    // Search fields
    const searchFields: SearchField[] = [
        {
            key: "testSetId",
            label: "Test Set",
            type: "select",
            placeholder: "Chọn Test Set",
            gridSpan: 1,
            options: testSetOptions,
            loading: loadingTestSets
        },
        {
            key: "status",
            label: "Trạng thái",
            type: "select",
            placeholder: "Chọn trạng thái",
            gridSpan: 1,
            options: [
                { value: '3', label: 'Đang chờ' },
                { value: '2', label: 'Đang xử lý' },
                { value: '1', label: 'Hoàn thành' },
                { value: '4', label: 'Thất bại' },
                { value: '0', label: 'Đã hủy' },
            ]
        },
        {
            key: "partType",
            label: "Loại phần thi",
            type: "select",
            placeholder: "Chọn loại",
            gridSpan: 1,
            options: [
                { value: 'LC', label: 'LC' },
                { value: 'RC', label: 'RC' }
            ]
        },
    ];

    const handleSearch = useCallback((filtersFromForm: Record<string, any>) => {
        setCurrentFilters(filtersFromForm);
        setCurrentPage(1);

        if (filtersFromForm.sortBy) {
            setCurrentSortColumn(filtersFromForm.sortBy);
        }
        if (filtersFromForm.sortOrder) {
            setCurrentSortOrder(filtersFromForm.sortOrder as 'asc' | 'desc');
        }

        // Gọi fetchData với filters mới ngay lập tức
        fetchData({
            filters: filtersFromForm,
            page: 1,
            sortBy: filtersFromForm.sortBy || currentSortColumn,
            sortOrder: filtersFromForm.sortOrder || currentSortOrder
        });
    }, [fetchData, currentSortColumn, currentSortOrder]);

    const handleClear = useCallback(() => {
        setCurrentFilters({});
        setCurrentPage(1);
        setCurrentSortColumn('createdDate');
        setCurrentSortOrder('desc');
        setEntriesPerPage(10);

        // Gọi fetchData với giá trị mặc định
        fetchData({
            filters: {},
            page: 1,
            limit: 10,
            sortBy: 'createdDate',
            sortOrder: 'desc'
        });
    }, [fetchData]);

    const handlePageChange = useCallback((page: number) => {
        setCurrentPage(page);
        fetchData({ page });
    }, [fetchData]);

    const handleEntriesPerPageChange = useCallback((entries: number) => {
        setEntriesPerPage(entries);
        setCurrentPage(1);
        fetchData({ limit: entries, page: 1 });
    }, [fetchData]);

    const handleCreateNew = useCallback(() => {
        navigate("/admin/question-bank/testset-processes/upload");
    }, [navigate]);

    const handleViewDetails = useCallback(async (rowData: IUploadProcess) => {
        setSelectedUpload(rowData);
        setShowDetailModal(true);
    }, []);

    const handleDelete = useCallback(async (rowData: IUploadProcess) => {
        if (!rowData.id) return;

        // Nếu đang xử lý thì hủy tiến trình trước, sau đó xóa
        const isProcessing = [2, 3].includes(rowData.status); // PROCESSING, PENDING

        const title = isProcessing ? "Dừng và xóa tiến trình" : "Xóa tiến trình upload";
        const content = isProcessing
            ? `Tiến trình "${rowData.testSetName || rowData.testSetId}" đang xử lý. Bạn có chắc chắn muốn dừng và xóa tiến trình này không?`
            : `Bạn có chắc chắn muốn xóa tiến trình upload "${rowData.testSetName || rowData.testSetId}" không?`;

        modal.deleteConfirm(
            title,
            async () => {
                try {
                    setLoading(true);

                    // Nếu đang xử lý thì hủy trước
                    if (isProcessing) {
                        await cancelProcessing(rowData.id);
                    }

                    // Sau đó xóa
                    await deleteProcessings(rowData.id);
                    message.success(isProcessing ? "Đã dừng và xóa tiến trình thành công" : "Xóa tiến trình thành công");
                    await fetchData();
                } catch (error: any) {
                    const errorMessage = error?.message || "Có lỗi xảy ra khi xóa";
                    setError(errorMessage);
                    message.error(errorMessage);
                } finally {
                    setLoading(false);
                }
            },
            content
        );
    }, [modal, message, fetchData]);

    const handleCancel = useCallback(async (rowData: IUploadProcess) => {
        if (!rowData.id) return;

        modal.confirm({
            title: 'Xác nhận hủy tiến trình',
            content: `Bạn có chắc chắn muốn hủy tiến trình upload "${rowData.testSetName || rowData.testSetId}" không?`,
            onOk: async () => {
                try {
                    setLoading(true);
                    await cancelProcessing(rowData.id);
                    message.success("Đã hủy tiến trình thành công");
                    await fetchData();
                } catch (error: any) {
                    const errorMessage = error?.message || "Có lỗi xảy ra khi hủy";
                    setError(errorMessage);
                    message.error(errorMessage);
                } finally {
                    setLoading(false);
                }
            },
        });
    }, [modal, message, fetchData]);

    const uploadProcessActions = React.useMemo(() => [
        {
            icon: <FaEye />,
            onClick: handleViewDetails,
            className: 'text-gray-600 hover:text-gray-900',
            tooltip: "Xem chi tiết",
            color: '#6c757d',
        },
        {
            icon: <FaTrash />,
            onClick: handleDelete,
            className: 'text-red-500 hover:text-red-700 ml-2',
            tooltip: "Xóa",
            color: '#f62626',
        },
        {
            icon: <FaTimes />,
            onClick: handleCancel,
            className: (rowData: IUploadProcess) =>
                [2, 3].includes(rowData.status)
                    ? 'text-orange-500 hover:text-orange-700 ml-2'
                    : 'hidden',
            tooltip: "Dừng tiến trình",
            color: '#fd7e14',
        },
    ], [handleViewDetails, handleDelete, handleCancel]);

    if (loading && uploadProcesses.length === 0) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-lg">{t('common.loadingData')}</div>
            </div>
        );
    }

    if (error && uploadProcesses.length === 0) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-red-500 text-center">
                    <p className="text-lg font-semibold">{t('common.error')}</p>
                    <p className="mt-2">{error}</p>
                    <button
                        onClick={() => fetchData()}
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
                pageTitle="Quản lý Upload Đề thi"
                breadcrumbItems={[
                    { label: t("common.home", "Trang chủ"), path: "/" },
                    { label: "Ngân hàng câu hỏi" },
                    { label: "Lịch sử tải lên" },
                ]}
                searchFields={searchFields}
                sortFields={[]}
                onSearch={handleSearch}
                onClear={handleClear}
                initialFilters={currentFilters}
                initialSortBy={currentSortColumn}
                initialSortOrder={currentSortOrder}
                columns={dataTableColumns}
                data={uploadProcesses}
                totalEntries={totalProcesses}
                entriesPerPage={entriesPerPage}
                currentPage={currentPage}
                onPageChange={handlePageChange}
                currentSortColumn={currentSortColumn}
                currentSortOrder={currentSortOrder}
                onEntriesPerPageChange={handleEntriesPerPageChange}
                onCreateNew={handleCreateNew}
                actions={uploadProcessActions as unknown as ActionButton[]}
            />

            <UploadDetailModal
                isOpen={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                uploadData={selectedUpload}
                onRefresh={fetchData}
            />
        </>
    );
};

export default UploadProcessManagement;