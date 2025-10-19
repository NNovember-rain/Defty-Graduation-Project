import ManagementTemplate, { type ActionButton } from "../../template/ManagementTemplate";
import type { SearchField, SortField } from "../../template/ManagementTemplate/FilterOption.tsx";
import { useTranslation } from "react-i18next";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { getSubmissions, type GetSubmissionsOptions, type ISubmission } from "../../../shared/services/submissionService.ts";
import { useNavigate } from "react-router-dom";
import { FaEye } from "react-icons/fa";
import dayjs from 'dayjs';
import './SubmissionList.scss';

const Submission: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [submissions, setSubmissions] = useState<ISubmission[]>([]);
    const [totalSubmissions, setTotalSubmissions] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentFilters, setCurrentFilters] = useState<Record<string, string>>({});
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [currentSortColumn, setCurrentSortColumn] = useState<string | null>(null);
    const [currentSortOrder, setCurrentSortOrder] = useState<'asc' | 'desc' | null>(null);

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
        setCurrentSortColumn(params.get('sortBy'));
        setCurrentSortOrder(params.get('sortOrder') as 'asc' | 'desc' || null);

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
            const options: GetSubmissionsOptions = {
                page: currentPage,
                limit: entriesPerPage,
                sortBy: currentSortColumn || undefined,
                sortOrder: currentSortOrder || undefined,
                studentName: currentFilters.studentName || undefined,
                studentCode: currentFilters.studentCode || undefined,
                assignmentTitle: currentFilters.assignmentTitle || undefined,
                classCode: currentFilters.classCode || undefined,
                submissionStatus: currentFilters.submissionStatus as 'SUBMITTED' | 'PROCESSING' | 'COMPLETED' | 'REVIEWED' | 'FAILED' || undefined,
                fromDate: currentFilters.fromDate || undefined,
                toDate: currentFilters.toDate || undefined,
            };

            const response = await getSubmissions(options);
            const formattedSubmissions = (response.submissions || []).map(submission => ({
                ...submission,
                // Keep original createdDate (no truncation) for precise time rendering
                createdDate: submission.createdDate,
            }));

            setSubmissions(formattedSubmissions);
            setTotalSubmissions(response.total || 0);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch submissions:", err);
            setError(t('common.errorFetchingData'));
            setLoading(false);
        }
    }, [currentPage, entriesPerPage, currentSortColumn, currentSortOrder, currentFilters, t]);

    useEffect(() => {
        fetchData();
        updateUrl();
    }, [fetchData, updateUrl, currentPage, entriesPerPage, currentSortColumn, currentSortOrder, currentFilters]);

    const dataTableColumns = useMemo(() => [
        { key: 'studentName', label: t('submissionPage.columns.studentName'), sortable: true },
        { key: 'studentCode', label: t('submissionPage.columns.studentCode'), sortable: true },
        { key: 'assignmentTitle', label: t('submissionPage.columns.assignmentTitle'), sortable: true },
        { key: 'classCode', label: t('submissionPage.columns.classCode'), sortable: true },
        { key: 'createdDate', label: t('submissionPage.columns.createdDate'), sortable: true, render: (value) => value ? dayjs(value).format('DD/MM/YYYY HH:mm:ss') : '' }
    ], [t]);

    const searchFields: SearchField[] = useMemo(() => [
        {
            key: 'studentName',
            label: t('submissionPage.search.studentName'),
            type: 'text',
            placeholder: t('submissionPage.search.studentNamePlaceholder'),
            gridSpan: 1
        },
        {
            key: 'studentCode',
            label: t('submissionPage.search.studentCode'),
            type: 'text',
            placeholder: t('submissionPage.search.studentCodePlaceholder'),
            gridSpan: 1
        },
        {
            key: 'assignmentTitle',
            label: t('submissionPage.search.assignmentTitle'),
            type: 'text',
            placeholder: t('submissionPage.search.assignmentTitlePlaceholder'),
            gridSpan: 1
        },
        {
            key: 'classCode',
            label: t('submissionPage.search.classCode'),
            type: 'text',
            placeholder: t('submissionPage.search.classCodePlaceholder'),
            gridSpan: 1
        },
        {
            key: 'fromDate',
            label: t('submissionPage.search.fromDate'),
            type: 'datetime',
            gridSpan: 1,
            format: 'YYYY-MM-DD'
        },
        {
            key: 'toDate',
            label: t('submissionPage.search.toDate'),
            type: 'datetime',
            gridSpan: 1,
            format: 'YYYY-MM-DD'
        },
    ], [t]);

    const sortFields: SortField[] = useMemo(() => [
        {
            key: 'sortOrder',
            label: t('submissionPage.sort.order'),
            options: [
                { value: 'asc', label: t('submissionPage.sort.ascending') },
                { value: 'desc', label: t('submissionPage.sort.descending') },
            ],
            gridSpan: 1
        },
        {
            key: 'orderBy',
            label: t('submissionPage.sort.by'),
            options: [
                { value: 'studentName', label: t('submissionPage.sort.studentName') },
                { value: 'studentCode', label: t('submissionPage.sort.studentCode') },
                { value: 'assignmentTitle', label: t('submissionPage.sort.assignmentTitle') },
                { value: 'classCode', label: t('submissionPage.sort.classCode') },
                { value: 'createdDate', label: t('submissionPage.sort.createdDate') },
                { value: 'submissionStatus', label: t('submissionPage.sort.submissionStatus') },
            ],
            gridSpan: 1
        },
    ], [t]);

    const handleSearch = useCallback((filtersFromForm: Record<string, string>) => {
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

    const handleTableSort = useCallback((columnKey: string, sortOrder: 'asc' | 'desc') => {
        setCurrentSortColumn(columnKey);
        setCurrentSortOrder(sortOrder);
    }, []);

    const handleEntriesPerPageChange = useCallback((entries: number) => {
        setEntriesPerPage(entries);
        setCurrentPage(1);
    }, []);

    const handleViewSubmission = useCallback((rowData: ISubmission) => {
        navigate(`/admin/submissions/detail/${rowData.id}`);
    }, [navigate]);

    const submissionActions = useMemo(() => [
        {
            icon: <FaEye />,
            onClick: handleViewSubmission,
            className: 'text-blue-500 hover:text-blue-700',
            tooltip: t('submissionPage.viewTooltip'),
            color: '#3b82f6'
        }
    ], [handleViewSubmission, t]);

    if (loading && submissions.length === 0) {
        return <div>{t('common.loadingData')}</div>;
    }

    if (error) {
        return <div className="text-red-500">{error}</div>;
    }

    return (
        <ManagementTemplate
            pageTitle={t('submissionPage.title')}
            breadcrumbItems={[
                { label: t('common.breadcrumb.home'), path: '/' },
                { label: t('common.breadcrumb.adminDashboard'), path: '/admin' },
                { label: t('submissionPage.breadcrumb') },
            ]}
            searchFields={searchFields}
            sortFields={sortFields}
            onSearch={handleSearch}
            onClear={handleClear}
            columns={dataTableColumns}
            data={submissions}
            totalEntries={totalSubmissions}
            entriesPerPage={entriesPerPage}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            onSort={handleTableSort}
            currentSortColumn={currentSortColumn}
            currentSortOrder={currentSortOrder}
            onEntriesPerPageChange={handleEntriesPerPageChange}
            actions={submissionActions as ActionButton[]}
            initialFilters={currentFilters}
            initialSortBy={currentSortColumn}
            initialSortOrder={currentSortOrder}
        />
    );
};

export default Submission;
