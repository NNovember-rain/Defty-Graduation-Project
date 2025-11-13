import ManagementTemplate, { type ActionButton } from "../../template/ManagementTemplate";
import type { SearchField, SortField } from "../../template/ManagementTemplate/FilterOption.tsx";
import { useTranslation } from "react-i18next";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    getAutoFeedbackJobs,
    uploadAutoFeedbackJob,
    deleteAutoFeedbackJob,
    type IAutoFeedbackJob,
    type GetAutoFeedbackJobsOptions
} from "../../../shared/services/autoFeedbackJobService";
import { getAutoFeedbackLLMJobDetail } from "../../../shared/services/autoFeedbackLLMEntryService";
import { useNotification } from "../../../shared/notification/useNotification";
import dayjs from 'dayjs';
import { Upload, Button } from "antd";
import { UploadOutlined, DownloadOutlined } from "@ant-design/icons";
import { FaEye, FaDownload, FaTrash } from "react-icons/fa";
import { ExcelGenerator } from "../../components/ExcelGenerator";
import { AutoFeedbackJobEntriesModal } from "./components/AutoFeedbackJobEntriesModal";
import './AutoFeedbackJob.scss';

const AutoFeedbackJob: React.FC = () => {
    const { t } = useTranslation();
    const { notification, modal, message } = useNotification();

    const [jobs, setJobs] = useState<IAutoFeedbackJob[]>([]);
    const [totalJobs, setTotalJobs] = useState(0);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Modal states
    const [entriesModalVisible, setEntriesModalVisible] = useState(false);
    const [selectedJob, setSelectedJob] = useState<IAutoFeedbackJob | null>(null);
    const [currentFilters, setCurrentFilters] = useState<Record<string, string>>({});
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [currentSortColumn, setCurrentSortColumn] = useState<string | null>('createdDate');
    const [currentSortOrder, setCurrentSortOrder] = useState<'asc' | 'desc' | null>('desc');

    const updateUrl = useCallback(() => {
        const params = new URLSearchParams();
        for (const key in currentFilters) {
            if (currentFilters[key]) {
                params.set(key, currentFilters[key]);
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
        const filters: Record<string, string> = {};
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
            const newFilters: Record<string, string> = {};
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

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const options: GetAutoFeedbackJobsOptions = {
                page: currentPage,
                size: entriesPerPage,
                sortBy: currentSortColumn || undefined,
                sortOrder: currentSortOrder || undefined,
                title: currentFilters.title || undefined,
                typeUml: currentFilters.typeUml as any || undefined,
                fromDate: currentFilters.fromDate || undefined,
                toDate: currentFilters.toDate || undefined,
            };

            const response = await getAutoFeedbackJobs(options);
            const formattedJobs = (response.jobs || []).map(job => ({
                ...job,
                createdDate: job.createdDate,
            }));

            setJobs(formattedJobs);
            setTotalJobs(response.total || 0);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch auto feedback jobs:", err);
            setError(t('common.errorFetchingData'));
            setLoading(false);
        }
    }, [currentPage, entriesPerPage, currentSortColumn, currentSortOrder, currentFilters, t]);

    useEffect(() => {
        fetchData();
        updateUrl();
    }, [fetchData, updateUrl, currentPage, entriesPerPage, currentSortColumn, currentSortOrder, currentFilters]);

    const handleUpload = async (file: File) => {
        setUploading(true);
        try {
            await uploadAutoFeedbackJob(file);
            notification.success(
                "Thành công",
                "File đã được upload và đang xử lý"
            );
            fetchData(); // Refresh list
        } catch (error) {
            console.error("Error uploading file:", error);
            notification.error("Lỗi", "Không thể upload file");
        } finally {
            setUploading(false);
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            // Tạo sample data
            const sampleData = ExcelGenerator.generateSampleData();
            
            // Generate Excel file
            await ExcelGenerator.generateAutoFeedbackJobTemplate(sampleData);
            
        } catch (error) {
            console.error("Error generating Excel template:", error);
            notification.error("Lỗi", "Không thể tạo template Excel");
        }
    };

    // Action handlers
    const handleView = useCallback((record: IAutoFeedbackJob) => {
        setSelectedJob(record);
        setEntriesModalVisible(true);
    }, []);

    const handleDownloadResult = useCallback(async (record: IAutoFeedbackJob) => {
        try {
            notification.info(
                t('autoFeedbackJobPage.download.started'), 
                t('autoFeedbackJobPage.download.preparingFile')
            );

            // Lấy thông tin chi tiết của job
            const jobDetail = await getAutoFeedbackLLMJobDetail(record.id);
            
            // Tạo và tải xuống file Excel với dữ liệu thực
            const fileName = `Auto_Feedback_Result_${jobDetail.title.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;
            await ExcelGenerator.downloadAutoFeedbackExcelWithData(fileName, jobDetail);
            
            notification.success(
                t('autoFeedbackJobPage.download.success'), 
                t('autoFeedbackJobPage.download.fileDownloaded')
            );
        } catch (error) {
            console.error('Error downloading result:', error);
            notification.error(
                t('autoFeedbackJobPage.download.error'), 
                t('autoFeedbackJobPage.download.failed')
            );
        }
    }, [notification, t]);

    const handleDeleteAutoFeedbackJob = useCallback(async (rowData: IAutoFeedbackJob) => {
        if (!rowData.id) {
            console.error("Attempted to delete auto feedback job with no ID:", rowData);
            message.error(t('common.errorNoIdToDelete'));
            return;
        }
        modal.deleteConfirm(
            t('autoFeedbackJobPage.actions.delete'),
            async () => {
                try {
                    setLoading(true);
                    await deleteAutoFeedbackJob(rowData.id);
                    message.success(t('autoFeedbackJobPage.delete.successMessage'));
                    await fetchData();
                } catch (error) {
                    setError(t('common.errorDeletingData'));
                    console.error("Error deleting auto feedback job:", error);
                    message.error(t('common.errorDeletingData'));
                } finally {
                    setLoading(false);
                }
            },
            t('autoFeedbackJobPage.delete.confirmContent', { title: rowData.title })
        );
    }, [t, fetchData, modal, message]);

    // Actions array for each row
    const autoFeedbackJobActions = [
        {
            icon: <FaEye />,
            onClick: handleView,
            className: '',
            tooltip: t("autoFeedbackJobPage.actions.view"),
            color: '#1890ff'
        },
        {
            icon: <FaDownload />,
            onClick: handleDownloadResult,
            className: '',
            tooltip: t("autoFeedbackJobPage.actions.downloadResult"),
            color: '#52c41a'
        },
        {
            icon: <FaTrash />,
            onClick: handleDeleteAutoFeedbackJob,
            className: '',
            tooltip: t("autoFeedbackJobPage.actions.delete"),
            color: '#ff4d4f'
        }
    ];

    const dataTableColumns = useMemo(() => [
        { key: 'title', label: t('autoFeedbackJobPage.columns.title'), sortable: true },
        { 
            key: 'typeUml', 
            label: t('autoFeedbackJobPage.columns.typeUml'), 
            sortable: true,
            render: (value: string) => value === 'CLASS' ? 'Class Diagram' : 'Use Case'
        },
        { 
            key: 'createdDate', 
            label: t('autoFeedbackJobPage.columns.createdDate'), 
            sortable: true, 
            render: (value) => value ? dayjs(value).format('DD/MM/YYYY HH:mm:ss') : '' 
        }
    ], [t]);

    const searchFields: SearchField[] = useMemo(() => [
        {
            key: 'title',
            label: t('autoFeedbackJobPage.search.title'),
            type: 'text',
            placeholder: t('autoFeedbackJobPage.search.titlePlaceholder'),
            gridSpan: 1
        },
        {
            key: 'typeUml',
            label: t('autoFeedbackJobPage.search.typeUml'),
            type: 'select',
            options: [
                { value: 'CLASS', label: 'Class Diagram' },
                { value: 'USE_CASE', label: 'Use Case' }
            ],
            gridSpan: 1
        },
        {
            key: 'fromDate',
            label: t('autoFeedbackJobPage.search.fromDate'),
            type: 'datetime',
            gridSpan: 1,
            format: 'YYYY-MM-DD'
        },
        {
            key: 'toDate',
            label: t('autoFeedbackJobPage.search.toDate'),
            type: 'datetime',
            gridSpan: 1,
            format: 'YYYY-MM-DD'
        },
    ], [t]);

    const sortFields: SortField[] = useMemo(() => [
        {
            key: 'sortOrder',
            label: t('autoFeedbackJobPage.sort.order'),
            options: [
                { value: 'asc', label: t('autoFeedbackJobPage.sort.ascending') },
                { value: 'desc', label: t('autoFeedbackJobPage.sort.descending') },
            ],
            gridSpan: 1
        },
        {
            key: 'orderBy',
            label: t('autoFeedbackJobPage.sort.by'),
            options: [
                { value: 'title', label: t('autoFeedbackJobPage.sort.title') },
                { value: 'typeUml', label: t('autoFeedbackJobPage.sort.typeUml') },
                { value: 'createdDate', label: t('autoFeedbackJobPage.sort.createdDate')},
            ],
            gridSpan: 1
        },
    ], [t]);

    const handleSearch = useCallback((filtersFromForm: Record<string, string>) => {
        setCurrentFilters(filtersFromForm);
        setCurrentPage(1);
        if (filtersFromForm.sortBy) {
            setCurrentSortColumn(filtersFromForm.sortBy);
        }
        if (filtersFromForm.sortOrder) {
            setCurrentSortOrder(filtersFromForm.sortOrder as 'asc' | 'desc');
        }
    }, []);

    const handleClear = useCallback(() => {
        setCurrentFilters({});
        setCurrentPage(1);
        setCurrentSortColumn('createdDate');
        setCurrentSortOrder('desc');
        setEntriesPerPage(10);
    }, []);

    const handlePageChange = useCallback((page: number) => {
        setCurrentPage(page);
    }, []);

    const handleTableSort = useCallback((columnKey: string, sortOrder: 'asc' | 'desc') => {
        setCurrentSortColumn(columnKey);
        setCurrentSortOrder(sortOrder);
    }, []);

    const handleEntriesPerPageChange = useCallback((entries: number) => {
        setEntriesPerPage(entries);
        setCurrentPage(1);
    }, []);

    if (loading && jobs.length === 0) {
        return <div>{t('common.loadingData')}</div>;
    }

    if (error) {
        return <div className="text-red-500">{error}</div>;
    }

    return (
        <div className="auto-feedback-job">
            <ManagementTemplate
                pageTitle={t('autoFeedbackJobPage.title')}
                breadcrumbItems={[
                    { label: t('common.breadcrumb.home'), path: '/' },
                    { label: t('common.breadcrumb.adminDashboard'), path: '/admin' },
                    { label: t('autoFeedbackJobPage.breadcrumb') },
                ]}
                searchFields={searchFields}
                sortFields={sortFields}
                onSearch={handleSearch}
                onClear={handleClear}
                columns={dataTableColumns}
                data={jobs}
                totalEntries={totalJobs}
                entriesPerPage={entriesPerPage}
                currentPage={currentPage}
                onPageChange={handlePageChange}
                onSort={handleTableSort}
                currentSortColumn={currentSortColumn}
                currentSortOrder={currentSortOrder}
                onEntriesPerPageChange={handleEntriesPerPageChange}
                initialFilters={currentFilters}
                initialSortBy={currentSortColumn}
                initialSortOrder={currentSortOrder}
                actions={autoFeedbackJobActions as ActionButton[]}
                customActions={
                    <div className="auto-feedback-job__upload-section" style={{ marginLeft: '12px' }}>
                        <Button
                            type="default"
                            icon={<DownloadOutlined />}
                            onClick={handleDownloadTemplate}
                            style={{ marginRight: 8 }}
                        >
                            {t('autoFeedbackJobPage.downloadTemplateButton')}
                        </Button>
                        <Upload
                            beforeUpload={(file) => {
                                handleUpload(file);
                                return false;
                            }}
                            accept=".xlsx,.xls"
                            showUploadList={false}
                        >
                            <Button
                                type="primary"
                                icon={<UploadOutlined />}
                                loading={uploading}
                                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', color: 'white' }}
                            >
                                {t('autoFeedbackJobPage.uploadButton')}
                            </Button>
                        </Upload>
                    </div>
                }
            />
            
            {/* Entries Modal */}
            <AutoFeedbackJobEntriesModal
                visible={entriesModalVisible}
                onClose={() => setEntriesModalVisible(false)}
                jobId={selectedJob?.id || 0}
                jobTitle={selectedJob?.title || ''}
            />
        </div>
    );
};

export default AutoFeedbackJob;
