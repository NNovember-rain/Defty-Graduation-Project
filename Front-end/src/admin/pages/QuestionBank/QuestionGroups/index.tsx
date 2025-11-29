import React, {useCallback, useEffect, useMemo, useState} from "react";
import ManagementTemplate, {type ActionButton} from "../../../template/ManagementTemplate";
import type {SearchField, SortField} from "../../../template/ManagementTemplate/FilterOption";
import {useTranslation} from "react-i18next";
import QuestionGroupFormModal from "./questionGroupFormModal";
import QuestionGroupDetailModal from "./questionGroupDetailModal";
import {
    createQuestionGroupBulk,
    deleteQuestionGroup,
    DifficultyLevel,
    getDifficultyText,
    getQuestionGroups,
    type GetQuestionGroupsOptions,
    getStatusText,
    getToeicPartText,
    type QuestionGroupBulkRequest,
    type QuestionGroupResponse,
    Status,
    ToeicPart,
    toggleQuestionGroupStatus,
    updateQuestionGroupBulk
} from "../../../../shared/services/questionBankService/questionGroupService";
import {FaEdit, FaEye, FaToggleOff, FaToggleOn, FaTrash} from "react-icons/fa";
import {Tag} from "antd";
import {useNotification} from "../../../../shared/notification/useNotification";
import {getQuestionTags, type IQuestionTag} from "../../../../shared/services/questionBankService/questionTagService";
import {getQuestionGroupOrders, getTestSets, type ITestSet} from "../../../../shared/services/questionBankService/testSetService";
import dayjs from "dayjs";

type ViewType = 'Management' | 'TestModal' | 'AddToTestModal';

interface QuestionGroupManagementProps {
    viewType?: ViewType;
    testSetId?: string;
    onSelectedChange?: (selectedIds: string[]) => void;
    onOrderChange?: (orderMap: Record<string, number>) => void;
    updateSelectedIds?: string[];
    onReloadRef?: (reloadFn: () => Promise<void>) => void;
}

const QuestionGroupManagement: React.FC<QuestionGroupManagementProps> = ({
                                                                             viewType = 'Management',
                                                                             testSetId,
                                                                             onSelectedChange,
                                                                             onOrderChange,
                                                                             updateSelectedIds,
                                                                             onReloadRef
                                                                         }) => {
    const { t } = useTranslation();
    const { message, modal } = useNotification();

    const [orderMap, setOrderMap] = useState<Record<string, number>>({});
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [allTags, setAllTags] = useState<IQuestionTag[]>([]);
    const [allTestSets, setAllTestSets] = useState<ITestSet[]>([]);
    const [questionGroups, setQuestionGroups] = useState<QuestionGroupResponse[]>([]);
    const [totalQuestionGroups, setTotalQuestionGroups] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [formMode, setFormMode] = useState<"create" | "edit">("create");
    const [selectedGroup, setSelectedGroup] = useState<QuestionGroupResponse | undefined>(undefined);

    // State initialization from URL
    const [currentFilters, setCurrentFilters] = useState<Record<string, string>>(() => {
        const params = new URLSearchParams(window.location.search);
        const filters: Record<string, string> = {};
        params.forEach((value, key) => {
            if (!['page', 'limit', 'sortBy', 'sortOrder'].includes(key)) {
                filters[key] = value;
            }
        });
        return filters;
    });

    const [currentPage, setCurrentPage] = useState(() => {
        if (viewType !== 'Management') return 1;
        const params = new URLSearchParams(window.location.search);
        return parseInt(params.get('page') || '1', 10);
    });

    const [entriesPerPage, setEntriesPerPage] = useState(() => {
        const params = new URLSearchParams(window.location.search);
        return parseInt(params.get('limit') || '10', 10);
    });

    const [currentSortColumn, setCurrentSortColumn] = useState<string | null>(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get('sortBy');
    });

    const [currentSortOrder, setCurrentSortOrder] = useState<'asc' | 'desc' | null>(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get('sortOrder') as 'asc' | 'desc' || null;
    });

    const updateUrl = useCallback(() => {
        const params = new URLSearchParams();

        // Add filters to URL
        for (const key in currentFilters) {
            if (currentFilters[key]) {
                params.set(key, currentFilters[key]);
            }
        }

        // Add pagination and sorting to URL
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

        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.pushState({}, '', newUrl);
    }, [
        currentPage,
        entriesPerPage,
        currentSortColumn,
        currentSortOrder,
        currentFilters,
        viewType,
        testSetId
    ]);

    // Setup popstate listener once
    useEffect(() => {
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

    // ✅ Nếu là TestModal, load danh sách order hiện tại trong test set
    useEffect(() => {
        const fetchOrders = async () => {
            if (viewType === "TestModal" && testSetId && questionGroups.length > 0) {
                try {
                    const orders = await getQuestionGroupOrders(testSetId);
                    const map: Record<string, number> = {};
                    orders.forEach(o => {
                        map[o.questionGroupId] = o.questionPartOrder ?? 0;
                    });
                    setOrderMap(map);

                    // ✅ Sort ngay sau khi load order từ API
                    setQuestionGroups(prev => {
                        return prev.map(qg => ({
                            ...qg,
                            questionPartOrder: map[qg.id ?? ""] ?? qg.questionPartOrder ?? 0
                        })).sort((a, b) => {
                            const orderA = map[a.id ?? ""] ?? a.questionPartOrder ?? 0;
                            const orderB = map[b.id ?? ""] ?? b.questionPartOrder ?? 0;
                            return orderA - orderB;
                        });
                    });

                    onOrderChange?.(map);
                } catch (err) {
                    console.error("Không thể tải order nhóm câu hỏi:", err);
                }
            }
        };
        fetchOrders();
    }, [viewType, testSetId, questionGroups.length]);

    // ✅ Khi cả orderMap và questionGroups đều sẵn sàng → cập nhật lại value hiển thị
    useEffect(() => {
        if (viewType === "TestModal" && Object.keys(orderMap).length > 0 && questionGroups.length > 0) {
            setQuestionGroups(prev => {
                return prev.map(qg => ({
                    ...qg,
                    questionPartOrder: orderMap[qg.id ?? ""] ?? qg.questionPartOrder ?? 0
                }));
            });
        }
    }, [orderMap, questionGroups.length, viewType]);

    const handleOrderChange = (id: string, value: string) => {
        const num = Number(value);
        setOrderMap(prev => ({
            ...prev,
            [id]: isNaN(num) ? 0 : num
        }));
    };

    useEffect(() => {
        onOrderChange?.(orderMap);
    }, [orderMap, onOrderChange]);

    const handleSelectedChange = useCallback((ids: string[]) => {
        setSelectedIds(ids);
        onSelectedChange?.(ids);
    }, [onSelectedChange]);

    useEffect(() => {
        handleSelectedChange(updateSelectedIds as string[]);
    }, [updateSelectedIds]);

    const fetchAllTags = useCallback(async () => {
        try {
            const response = await getQuestionTags({ page: 1, limit: 999, status: 1 });
            setAllTags(response.content || []);
        } catch (err) {
            console.error("Lỗi khi tải danh sách tag:", err);
            message.error("Không thể tải danh sách tag.");
        }
    }, []);

    const fetchAllTestSets = useCallback(async () => {
        try {
            const response = await getTestSets({page: 1, limit: 999, status: 1});
            setAllTestSets(response.content || []);
        } catch (err) {
            console.error("Lỗi khi tải danh sách testset:", err);
            message.error("Không thể tải danh sách đề thi.");
        }
    }, []);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const baseOptions: GetQuestionGroupsOptions = {
                page: currentPage,
                limit: viewType === 'TestModal' ? 999 : entriesPerPage,
                status: testSetId && viewType !== 'Management'
                    ? Status.ACTIVE
                    : currentFilters.status ? currentFilters.status as Status : undefined,
                source: currentFilters.source ? currentFilters.source : undefined,
                // Logic cho testSetIds và excludeTestSetIds
                testSetIds: testSetId && viewType === 'TestModal'
                    ? [testSetId]
                    : currentFilters.testSetIds
                        ? currentFilters.testSetIds.split(',').map(id => id.trim())
                        : undefined,
                excludeTestSetIds: testSetId && viewType === 'AddToTestModal'
                    ? [testSetId]
                    : undefined,
                tagIds: currentFilters.tagIds
                    ? currentFilters.tagIds.split(',').map(id => id.trim())
                    : undefined,
                questionPart: currentFilters.questionPart || undefined,
                difficulty: currentFilters.difficulty || undefined
            };

            // ⚙️ Mặc định sort theo createdDate ASC nếu là TestModal
            const sortOptions =
                viewType === 'TestModal'
                    ? { sortBy: 'createdDate', sortOrder: 'asc' as const }
                    : currentSortColumn && currentSortOrder
                        ? { sortBy: currentSortColumn, sortOrder: currentSortOrder }
                        : {};

            const options: GetQuestionGroupsOptions = {
                ...baseOptions,
                ...sortOptions,
            };

            const response = await getQuestionGroups(options);

            let sortedQuestionGroups = response.questionGroups.map(group => ({
                ...group,
                files: group.files?.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)) || [],
                questions: group.questions
                    ?.sort((a, b) => a.questionNumber - b.questionNumber)
                    .map(question => ({
                        ...question,
                        answers: question.answers?.sort((a, b) => a.answerOrder - b.answerOrder)
                    })) || []
            }));

            // ✅ Sort theo questionPartOrder từ API (chỉ lần đầu)
            if (viewType === 'TestModal') {
                sortedQuestionGroups = sortedQuestionGroups.sort((a, b) => {
                    const orderA = orderMap[a.id as string] ?? 0;
                    const orderB = orderMap[b.id as string] ?? 0;
                    return orderA - orderB;
                });
            }

            setQuestionGroups(sortedQuestionGroups);
            setTotalQuestionGroups(response.total || 0);
        } catch (err) {
            console.error("Lỗi khi tải dữ liệu nhóm câu hỏi:", err);
            setError("Lỗi khi tải dữ liệu.");
        } finally {
            setLoading(false);
        }
    }, [
        currentPage,
        entriesPerPage,
        currentSortColumn,
        currentSortOrder,
        currentFilters,
        viewType,
        testSetId
    ]);

    useEffect(() => {
        fetchAllTags();
        fetchAllTestSets();
    }, [fetchAllTags, fetchAllTestSets]);

    // Fetch data when dependencies change
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (onReloadRef) {
            onReloadRef(fetchData);
        }
    }, [onReloadRef, fetchData]);

    // Update URL when state changes
    // ✅ Chỉ cập nhật URL khi ở viewType === 'Management'
    useEffect(() => {
        if (viewType === 'Management') {
            if (questionGroups.length > 0 || currentPage > 1 || Object.keys(currentFilters).length > 0) {
                updateUrl();
            }
        }
    }, [
        viewType,
        questionGroups.length,
        currentPage,
        entriesPerPage,
        currentSortColumn,
        currentSortOrder,
        currentFilters,
        updateUrl
    ]);

    const dataTableColumns = useMemo(() => {
        const baseColumns = [
            // {
            //     key: "questionPart",
            //     label: "Phần thi",
            //     sortable: true,
            //     render: (value: ToeicPart) => (
            //         <Tag color="blue">{getToeicPartText(value)}</Tag>
            //     )
            // },
            {
                key: "difficulty",
                label: "Độ khó",
                sortable: true,
                render: (value: DifficultyLevel) => (
                    <Tag color={
                        value === DifficultyLevel.EASY ? 'green' :
                            value === DifficultyLevel.MEDIUM ? 'orange' : 'red'
                    }>
                        {getDifficultyText(value)}
                    </Tag>
                )
            },
            {
                key: "questions",
                label: "Số câu hỏi",
                sortable: false,
                render: (_value: any, row: QuestionGroupResponse) => (
                    <span className="font-medium">{row.questions?.length || 0}</span>
                )
            },
            // {
            //     key: "requiredAudio",
            //     label: "Audio",
            //     sortable: false,
            //     render: (_value: any, row: QuestionGroupResponse) => {
            //         const audioCount = row.files?.filter(f => f.type === "AUDIO").length || 0;
            //         return (
            //             <Tag color={audioCount > 0 ? 'green' : 'default'}>
            //                 {audioCount > 0 ? 'Có' : 'Không'}
            //             </Tag>
            //         );
            //     }
            // },
            {
                key: "requiredImage",
                label: "Hình ảnh",
                sortable: false,
                render: (_value: any, row: QuestionGroupResponse) => {
                    const imageCount = row.files?.filter(f => f.type === "IMAGE").length || 0;
                    return (
                        <Tag color={imageCount > 0 ? 'green' : 'default'}>
                            {imageCount > 0 ? `${imageCount} ảnh` : 'Không'}
                        </Tag>
                    );
                }
            },
            {
                key: "tags",
                label: "Thẻ câu hỏi",
                sortable: false,
                render: (_value: any, row: QuestionGroupResponse) => {
                    const tags = row.tags || [];
                    const visibleTags = tags.slice(0, 3);
                    const remainingCount = tags.length - visibleTags.length;

                    return tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-[250px] items-center">
                            {visibleTags.map((tag) => (
                                <Tag
                                    key={tag.id}
                                    color="purple"
                                    className="whitespace-nowrap px-[6px] py-[2px] text-[13px]"
                                >
                                    {tag.tagName}
                                </Tag>
                            ))}
                            {remainingCount > 0 && (
                                <span
                                    className="text-gray-500 text-[13px] font-medium"
                                    title={tags.slice(3).map((t) => t.tagName).join(", ")}
                                >
                                +{remainingCount}
                            </span>
                            )}
                        </div>
                    ) : (
                        <span className="text-gray-400">Không có</span>
                    );
                },
            },
            {
                key: "notes",
                label: "Ghi chú",
                sortable: false,
                render: (value: string) => {
                    if (!value) return "-";
                    return (
                        <div
                            className="max-w-xs line-clamp-2 text-gray-700 prose prose-sm"
                            title={value.replace(/<[^>]+>/g, "")}
                            dangerouslySetInnerHTML={{ __html: value }}
                        />
                    );
                }
            },
            {
                key: "source",
                label: "Nguồn",
                sortable: false,
                render: (_value: any, row: QuestionGroupResponse) => {
                    const sourceConfig = {
                        'MANUAL': { color: 'blue', text: 'Thủ công' },
                        'PDF_UPLOAD': { color: 'purple', text: 'Từ PDF' },
                    };

                    const config = sourceConfig[row.source as keyof typeof sourceConfig] || { color: 'default', text: 'Không xác định' };

                    return (
                        <Tag color={config.color}>
                            {config.text}
                        </Tag>
                    );
                }
            },
            {
                key: 'createdDate',
                label: 'Ngày tạo',
                sortable: true,
                render: (value: string | Date) => {
                    if (!value) return '-';
                    try {
                        return dayjs(value).format('YYYY-MM-DD HH:mm');
                    } catch {
                        return String(value);
                    }
                }
            }
        ];

        if (viewType === 'TestModal') {
            return [
                {
                    key: "order",
                    label: "Thứ tự",
                    sortable: false,
                    render: (_value: any, row: QuestionGroupResponse) => {
                        const isSelected = selectedIds.includes(row.id as string);
                        return (
                            <input
                                type="number"
                                min={1}
                                value={orderMap[row.id as string] ?? ""}
                                onChange={(e) => handleOrderChange(row.id as string, e.target.value)}
                                disabled={!isSelected}
                                className={`w-16 border rounded-md text-center transition-all duration-100
                                ${isSelected
                                    ? "border-gray-300 focus:ring focus:ring-blue-200"
                                    : "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"}`}
                                placeholder="#"
                            />
                        );
                    },
                },
                ...baseColumns
            ];
        } else if (viewType === 'AddToTestModal') {
            return [
                {
                    key: "order",
                    label: "Thứ tự",
                    sortable: false,
                    render: (_value: any, row: QuestionGroupResponse) => {
                        const isSelected = selectedIds.includes(row.id as string);
                        return (
                            <input
                                type="number"
                                min={1}
                                value={orderMap[row.id as string] ?? ""}
                                onChange={(e) => handleOrderChange(row.id as string, e.target.value)}
                                disabled={!isSelected}
                                className={`w-16 border rounded-md text-center transition-all duration-100
                        ${isSelected
                                    ? "border-gray-300 focus:ring focus:ring-blue-200"
                                    : "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"}`}
                                placeholder="#"
                            />
                        );
                    },
                },
                ...baseColumns
            ];
        }

        return baseColumns;
    }, [selectedIds, viewType, orderMap]);
    /** Search fields */
    const searchFields: SearchField[] = useMemo(() => {
        // --- Các filter cơ bản (luôn có) ---
        const baseFields: SearchField[] = [
            {
                key: "tagIds",
                label: "Tags",
                type: "multiselect",
                options: allTags.map(tag => ({
                    value: tag.id,
                    label: tag.tagName,
                })),
                placeholder: "Chọn thẻ câu hỏi",
                gridSpan: 2,
            },
            // {
            //     key: "questionPart",
            //     label: "Phần thi",
            //     type: "select",
            //     options: [
            //         { value: ToeicPart.PART_1, label: getToeicPartText(ToeicPart.PART_1) },
            //         { value: ToeicPart.PART_2, label: getToeicPartText(ToeicPart.PART_2) },
            //         { value: ToeicPart.PART_3, label: getToeicPartText(ToeicPart.PART_3) },
            //         { value: ToeicPart.PART_4, label: getToeicPartText(ToeicPart.PART_4) },
            //         { value: ToeicPart.PART_5, label: getToeicPartText(ToeicPart.PART_5) },
            //         { value: ToeicPart.PART_6, label: getToeicPartText(ToeicPart.PART_6) },
            //         { value: ToeicPart.PART_7, label: getToeicPartText(ToeicPart.PART_7) },
            //     ],
            //     placeholder: "Chọn phần thi",
            //     gridSpan: 1,
            // },
            {
                key: "difficulty",
                label: "Độ khó",
                type: "select",
                options: [
                    { value: DifficultyLevel.EASY, label: getDifficultyText(DifficultyLevel.EASY) },
                    { value: DifficultyLevel.MEDIUM, label: getDifficultyText(DifficultyLevel.MEDIUM) },
                    { value: DifficultyLevel.HARD, label: getDifficultyText(DifficultyLevel.HARD) },
                ],
                placeholder: "Chọn độ khó",
                gridSpan: 1,
            },
            {
                key: "source",
                label: "Nguồn",
                type: "select",
                options: [
                    { value: "MANUAL", label: "Thủ công" },
                    { value: "PDF_UPLOAD", label: "Từ PDF" },
                ],
                placeholder: "Chọn nguồn",
                gridSpan: 1,
            },
        ];

        // ✅ Nếu là chế độ quản lý, thêm filter "Đề" và "Trạng thái"
        if (viewType === "Management" || viewType === "AddToTestModal") {
            baseFields.unshift({
                key: "testSetIds",
                label: "Đề",
                type: "multiselect",
                options: allTestSets.map(testSet => ({
                    value: testSet.id,
                    label: testSet.testName,
                })),
                placeholder: "Chọn đề",
                gridSpan: 2,
            });
        }

        if (viewType === 'Management') {
            baseFields.push({
                key: "status",
                label: "Trạng thái",
                type: "select",
                options: [
                    { value: Status.ACTIVE.toString(), label: getStatusText(Status.ACTIVE) },
                    { value: Status.INACTIVE.toString(), label: getStatusText(Status.INACTIVE) },
                ],
                placeholder: "Chọn trạng thái",
                gridSpan: 1,
            });
        }

        return baseFields;
    }, [allTags, allTestSets, viewType]);

    const sortFields: SortField[] = useMemo(() => [
        {
            key: 'sortBy',
            label: "Sắp xếp theo",
            options: [
                { value: '', label: "" },
                { value: 'createdDate', label: "Ngày tạo" },
            ],
            gridSpan: 1
        },
        {
            key: 'sortOrder',
            label: "Thứ tự",
            options: [
                { value: '', label: "" },
                { value: 'asc', label: "Tăng dần" },
                { value: 'desc', label: "Giảm dần" },
            ],
            gridSpan: 1
        },
    ], []);

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

    const handleEntriesPerPageChange = useCallback((entries: number) => {
        setEntriesPerPage(entries);
        setCurrentPage(1);
    }, []);

    const handleCreateNew = useCallback(() => {
        setFormMode("create");
        setSelectedGroup(undefined);
        setIsFormModalOpen(true);
    }, []);

    const handleEdit = useCallback((rowData: QuestionGroupResponse) => {
        setFormMode("edit");
        setSelectedGroup(rowData);
        setIsFormModalOpen(true);
    }, []);

    const handleViewDetails = useCallback((rowData: QuestionGroupResponse) => {
        setSelectedGroup(rowData);
        setIsDetailModalOpen(true);
    }, []);

    const handleToggleStatus = useCallback(async (rowData: QuestionGroupResponse) => {
        if (!rowData.id) return;
        const newStatus = rowData.status === 1 ? Status.INACTIVE : Status.ACTIVE;
        const confirmMessage = newStatus === Status.ACTIVE
            ? `Bạn có chắc chắn muốn kích hoạt nhóm câu hỏi này?`
            : `Bạn có chắc chắn muốn vô hiệu hóa nhóm câu hỏi này?`;

        modal.confirm({
            title: 'Thay đổi trạng thái',
            content: confirmMessage,
            onOk: async () => {
                try {
                    setLoading(true);
                    await toggleQuestionGroupStatus(rowData.id!);
                    message.success(`Đã ${newStatus === Status.ACTIVE ? 'kích hoạt' : 'vô hiệu hóa'} nhóm câu hỏi thành công.`);
                    await fetchData();
                } catch (error: any) {
                    if (error.status === 403) {
                        message.error("Bạn không có đủ quyền để thực hiện thao tác này.");
                    } else {
                        setError("Lỗi khi cập nhật dữ liệu.");
                        message.error("Lỗi khi cập nhật dữ liệu.");
                    }
                } finally {
                    setLoading(false);
                }
            },
        });
    }, [fetchData, modal, message]);

    const handleDelete = useCallback(async (rowData: QuestionGroupResponse) => {
        if (!rowData.id) {
            console.error("Attempted to delete question group with no ID:", rowData);
            return;
        }
        modal.deleteConfirm(
            'Xóa nhóm câu hỏi',
            async () => {
                try {
                    setLoading(true);
                    await deleteQuestionGroup(rowData.id!);
                    message.success('Đã xóa nhóm câu hỏi thành công.');
                    await fetchData();
                } catch (error: any) {
                    if (error.status === 403) {
                        message.error("Bạn không có đủ quyền để thực hiện thao tác này.");
                    } else {
                        setError("Lỗi khi xóa dữ liệu.");
                        message.error("Lỗi khi xóa dữ liệu.");
                    }
                } finally {
                    setLoading(false);
                }
            },
            `Bạn có chắc chắn muốn xóa nhóm câu hỏi này? Hành động này không thể hoàn tác.`
        );
    }, [fetchData, modal, message]);

    const handleSaveGroup = useCallback(async (data: QuestionGroupBulkRequest, uploadedFiles?: File[]) => {
        try {
            setLoading(true);

            const bulkData: QuestionGroupBulkRequest = {
                id: null,
                questionGroup: {
                    id: data.id || null,
                    questionPart: data.questionGroup.questionPart,
                    questionPartOrder: data.questionGroup.questionPartOrder,
                    audioTranscript: data.questionGroup.audioTranscript,
                    explanation: data.questionGroup.explanation,
                    passageText: data.questionGroup.passageText,
                    difficulty: data.questionGroup.difficulty,
                    notes: data.questionGroup.notes,
                    requiredImage: data.questionGroup.requiredImage,
                    requiredAudio: data.questionGroup.requiredAudio,
                },
                questions: data.questions?.map((q, questionIndex) => ({
                    id: q.id || null,
                    questionNumber: questionIndex + 1,
                    questionText: q.questionText,
                    difficulty: q.difficulty,
                    answers: q.answers?.map((a, answerIndex) => ({
                        id: a.id || null,
                        content: a.content,
                        answerOrder: answerIndex + 1,
                        isCorrect: a.isCorrect,
                    })) || [],
                    tagIds: q.tagIds || []
                })) || [],
                files: data.files?.map((f, fileIndex) => ({
                    id: f.id || null,
                    type: f.type,
                    displayOrder: fileIndex + 1,
                })) || [],
            };

            if (formMode === "edit") {
                await updateQuestionGroupBulk(data.id!, bulkData, uploadedFiles);
                message.success('Cập nhật nhóm câu hỏi thành công.');
            } else {
                await createQuestionGroupBulk(bulkData, uploadedFiles);
                message.success('Tạo nhóm câu hỏi thành công.');
            }

            setIsFormModalOpen(false);
            await fetchData();
        } catch (error) {
            console.error("Error saving question group:", error);
            message.error("Lỗi khi lưu nhóm câu hỏi.");
        } finally {
            setLoading(false);
        }
    }, [formMode, fetchData, message]);

    const questionGroupActions = useMemo(() => [
        {
            icon: <FaEye />,
            onClick: handleViewDetails,
            className: "text-gray-600 hover:text-gray-900 mr-2",
            tooltip: "Xem chi tiết",
            color: "#63782b",
        },
        ...(viewType === "Management"
            ? [
                {
                    icon: (rowData: QuestionGroupResponse) =>
                        rowData.status === 1 ? <FaToggleOn fontSize={17} /> : <FaToggleOff fontSize={17} />,
                    onClick: handleToggleStatus,
                    className: (rowData: QuestionGroupResponse) =>
                        rowData.status === 1
                            ? "text-green-500 hover:text-green-700 mr-2"
                            : "text-gray-500 hover:text-gray-700 mr-2",
                    tooltip: (rowData: QuestionGroupResponse) =>
                        rowData.status === 1 ? "Vô hiệu hóa" : "Kích hoạt",
                    color: "#63782b",
                },
            ]
            : []),
        {
            icon: <FaEdit />,
            onClick: handleEdit,
            className: "text-blue-500 hover:text-blue-700 mr-2",
            tooltip: "Chỉnh sửa",
            color: "#7600ff",
        },
        ...(viewType === "Management"
            ? [
                {
                    icon: <FaTrash />,
                    onClick: handleDelete,
                    className: "text-red-500 hover:text-red-700",
                    tooltip: "Xóa",
                    color: "red",
                },
            ]
            : []),
    ], [viewType, handleViewDetails, handleToggleStatus, handleEdit, handleDelete]);

    if (loading && questionGroups.length === 0) {
        return <div>Đang tải dữ liệu...</div>;
    }

    if (error) {
        return <div className="text-red-500">{error}</div>;
    }

    return (
        <>
            <ManagementTemplate
                pageTitle={viewType !== 'Management' ? "" : t("questionGroupPage.title", "Quản lý Nhóm câu hỏi")}
                breadcrumbItems={viewType !== 'Management' ? [] : [
                    { label: 'Trang tổng quan', path: "/admin" },
                    { label: "Quản lý Nhóm câu hỏi" },
                ]}
                searchFields={searchFields}
                sortFields={sortFields}
                onSearch={handleSearch}
                onClear={handleClear}
                initialFilters={currentFilters}
                initialSortBy={currentSortColumn}
                initialSortOrder={currentSortOrder}
                columns={dataTableColumns}
                onCreateNew={viewType === 'Management' ? handleCreateNew : undefined}
                data={questionGroups}
                totalEntries={totalQuestionGroups}
                entriesPerPage={entriesPerPage}
                currentPage={currentPage}
                onPageChange={handlePageChange}
                currentSortColumn={currentSortColumn}
                currentSortOrder={currentSortOrder}
                onEntriesPerPageChange={handleEntriesPerPageChange}
                actions={questionGroupActions as ActionButton[]}
                showPagination={viewType !== 'TestModal'}
                enableRowSelection={viewType !== "Management"}
                onSelectedChange={handleSelectedChange}
                selectedRows={selectedIds}
                disableSequence={viewType !== 'Management'}
            />

            <QuestionGroupFormModal
                isOpen={isFormModalOpen}
                mode={formMode}
                allQuestionTags={allTags}
                initialData={selectedGroup}
                onClose={() => setIsFormModalOpen(false)}
                onSave={handleSaveGroup}
            />

            <QuestionGroupDetailModal
                isOpen={isDetailModalOpen}
                // @ts-ignore
                data={selectedGroup}
                onClose={() => setIsDetailModalOpen(false)}
            />
        </>
    );
};

export default QuestionGroupManagement;