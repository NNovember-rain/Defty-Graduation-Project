import React, {useCallback, useEffect, useMemo, useState} from "react";
import {useTranslation} from "react-i18next";
import {Spinner} from "react-bootstrap";
import {
    getAssignmentsByClassId,
    type GetAssignmentsOptions,
    type IAssignment,
    unassignAssignment,
} from "../../../../../shared/services/assignmentService.ts";
import dayjs from "dayjs";
import { getAllTestSetsByClassId, removeTestSetFromClass } from "../../../../../shared/services/classTestSetService.ts";
import {
    message,
    Pagination,
    Popconfirm,
} from "antd"; // Giữ lại message, Pagination, Popconfirm từ antd
import {IoCalendarOutline, IoCloseCircleOutline, IoFileTrayFull, IoTimeOutline, IoSearch} from "react-icons/io5";
import {MdAssignmentTurnedIn, MdOutlineAssignment} from "react-icons/md";
import {DownOutlined} from "@ant-design/icons";
import {useNavigate, useSearchParams} from "react-router-dom";

import AssignAssignmentModal from "./AssignAssignmentModal.tsx";
import AssignAssignmentModalTest from "./AssignAssignmentModalTest.tsx";
import AssignQuizModal from "./AssignQuizModal.tsx";

interface AssignmentTabProps {
    classId: number;
}

type AssignmentType = "ASSIGNMENT" |
    "TEST" | "QUIZ";

interface AssignedModule {
    moduleId: number;
    moduleName: string;
    checkedTest: boolean;
    typeUmls: string[];
    startDate: string | null;
    endDate: string | null;
    assignmentClassDetailId: number;
}

interface AssignedQuiz {
    quizId: number;
    quizTitle: string;
    testSetId: number;
    testSetName: string;
    collectionName?: string;
    totalQuestions: number;
    startDate: string | null;
    endDate: string | null;
    assignmentClassDetailId: number;
}

interface IAssignmentExtended extends IAssignment {
    id: string;
    type: AssignmentType;
    startDate: string | null;
    endDate: string | null;
    classInfoId: number;
    assignedModules: AssignedModule[];
    assignedQuizzes?: AssignedQuiz[];
    assignedUmlType: { name: string; } | null;
    createdDate: string;
}

interface ProcessedAssignmentItem {
    key: string;
    assignmentId: string;
    assignmentTitle: string;
    assignmentCode?: string;
    startDate: string | null;
    endDate: string | null;
    type: AssignmentType;
    assignmentClassDetailId: number;
    moduleName?: string;
    typeUmls?: string[];
    isModuleTest?: boolean;
    testSetName?: string;
    collectionName?: string;
    totalQuestions?: number;
    createdDate: string;
}

const DEFAULT_PAGE_SIZE = 5; // Sử dụng DEFAULT_PAGE_SIZE từ tmp2.txt [cite: 228] (tmp1 là 9 [cite: 15])
const ASSIGNMENT_TAB_PARAM = 'classworkTab';

const AssignmentTab: React.FC<AssignmentTabProps> = ({ classId }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // State definitions
    const [assignments, setAssignments] = useState<IAssignmentExtended[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [page, setPage] = useState<number>(1);
    const [size, setSize] = useState<number>(DEFAULT_PAGE_SIZE);
    const [total, setTotal] = useState<number>(0);
    const [sortBy, setSortBy] = useState<string | undefined>("createdDate");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc" | undefined>("desc");
    const [isAssignmentModalVisible, setIsAssignmentModalVisible] = useState(false);
    const [isAssignmentModalVisibleTest, setIsAssignmentModalVisibleTest] = useState(false);
    const [isQuizModalVisible, setIsQuizModalVisible] = useState(false);

    // Tab logic from tmp2.txt
    const initialTab = searchParams.get(ASSIGNMENT_TAB_PARAM);
    const validTabs = ['test', 'assignment', 'quiz'];
    const defaultActiveTab = validTabs.includes(initialTab || '') ? initialTab! : 'test';
    const [activeTab, setActiveTab] = useState<string>(defaultActiveTab);

    const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
    const [selectedModule, setSelectedModule] = useState<string | null>(null);
    const [selectedUmlType, setSelectedUmlType] = useState<string | null>(null);

    const [uniqueModules, setUniqueModules] = useState<string[]>([]);
    const [uniqueUmlTypes, setUniqueUmlTypes] = useState<string[]>([]);
    const [uniqueAssignments, setUniqueAssignments] = useState<{ id: string; title: string }[]>([]);

    // Dropdown/Filter state from tmp2.txt
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

    // --- Navigation and Modals ---
    const goToAssignmentDetails = (assignmentId: string, assignmentClassDetailId: number) => {
        const originalId = assignmentId.split('-')[0];
        navigate(`/admin/class/${classId}/assignment/${originalId}/detail?assignmentClassDetailId=${assignmentClassDetailId}`);
    };

    const handleViewAssignmentDetails = useCallback(
        (rowData: ProcessedAssignmentItem) => {
            const originalId = rowData.assignmentId.split('-')[0];
            const detailId = rowData.assignmentClassDetailId;
            if (detailId) {
                navigate(`/admin/content/assignments/${originalId}/assignmentClassDetail/${detailId}`);
            } else {
                message.error(t('common.missingDetailId') || "Không tìm thấy ID chi tiết bài tập.");
            }
        },
        [navigate, t]
    );

    const showAssignmentModal = useCallback(() => {
        setIsAssignmentModalVisible(true);
        setIsDropdownOpen(false); // Thêm đóng dropdown từ tmp2.txt
    }, []);
    const showTestAssignmentModal = useCallback(() => {
        setIsAssignmentModalVisibleTest(true);
        setIsDropdownOpen(false); // Thêm đóng dropdown từ tmp2.txt
    }, []);
    const showQuizAssignmentModal = useCallback(() => {
        setIsQuizModalVisible(true);
        setIsDropdownOpen(false); // Thêm đóng dropdown từ tmp2.txt
    }, []);

    const hideAssignmentModal = () => {
        setIsAssignmentModalVisible(false);
        setIsAssignmentModalVisibleTest(false);
        setIsQuizModalVisible(false);
    };

    // --- Data Fetching and Mapping ---
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const options: GetAssignmentsOptions = { limit: 1000 };
            const response = await getAssignmentsByClassId(classId, options);
            const data = response.assignments || [];

            const quizResponse = await getAllTestSetsByClassId(classId);
            const quizData = quizResponse.data || [];

            const quizAssignments = quizData.map((quiz) => ({
                id: `quiz-${quiz.id}`,
                type: 'QUIZ' as AssignmentType,
                classInfoId: classId,
                assignmentCode: undefined,
                title: quiz.testSetName,
                description: '',
                startDate: quiz.startDate,
                endDate: quiz.endDate,
                checkedTest: false,
                assignedModules: [],
                assignedQuizzes: [{
                    quizId: quiz.id,
                    quizTitle: quiz.testSetName,
                    testSetId: quiz.testSetId,
                    testSetName: quiz.testSetName,
                    collectionName: quiz.collectionName,
                    totalQuestions: quiz.totalQuestions,
                    startDate: quiz.startDate,
                    endDate: quiz.endDate,
                    assignmentClassDetailId: quiz.id,
                }],
                assignedUmlType: null,
                createdDate: quiz.createdDate || dayjs().toISOString(),
            } as IAssignmentExtended));

            // Logic mapping assignments từ tmp2.txt (có thêm assignedQuizzes vào IAssignmentExtended)
            const mappedAssignments: IAssignmentExtended[] = data.map((a: any, index: number) => {
                const assignmentType: AssignmentType = (a.assignmentClassDetailResponseList || []).some((m: any) => m.checkedTest === true) ? "TEST" : "ASSIGNMENT";
                const assignedQuizzes = a.assignedQuizzes || []; // Lấy assignedQuizzes từ tmp2.txt

                return {
                    id: String(a.assignmentId ?? index),
                    type: assignmentType,
                    classInfoId: classId,
                    assignmentCode: a.assignmentCode,
                    title: a.assignmentTitle,
                    description: a.assignmentDescription,
                    startDate: a.startDate ? dayjs(a.startDate).toISOString() : null,
                    endDate: a.endDate ? dayjs(a.endDate).toISOString() : null,
                    checkedTest: a.checkedTest,
                    assignedModules: (a.assignmentClassDetailResponseList || []).map((m: any) => ({
                        ...m,
                        assignmentClassDetailId: m.assignmentClassDetailId,
                    })) as AssignedModule[],
                    assignedQuizzes: assignedQuizzes.map((q: any) => ({ // Map assignedQuizzes
                        ...q,
                        assignmentClassDetailId: q.assignmentClassDetailId,
                    })) as AssignedQuiz[],
                    assignedUmlType: null,
                    createdDate: a.createdDate || dayjs().toISOString(),
                } as unknown as IAssignmentExtended;
            });

            const allAssignments = [...mappedAssignments, ...quizAssignments];

            setAssignments(allAssignments);
            collectUniqueFilters(allAssignments);

        } catch (err) {
            console.error("Failed to fetch assignments:", err);
            setError(t("common.errorFetchingData") || "Lỗi khi lấy dữ liệu");
        } finally {
            setLoading(false);
        }
    }, [classId, t]);

    const collectUniqueFilters = (data: IAssignmentExtended[]) => {
        const moduleSet = new Set<string>();
        const umlTypeSet = new Set<string>();
        const assignmentMap = new Map<string, string>();
        data.forEach(a => {
            assignmentMap.set(a.id, a.title);
            a.assignedModules.forEach(m => {
                moduleSet.add(m.moduleName);
                m.typeUmls.forEach(uml => umlTypeSet.add(uml));
            });
        });
        setUniqueModules(Array.from(moduleSet).sort());
        setUniqueUmlTypes(Array.from(umlTypeSet).sort());
        setUniqueAssignments(Array.from(assignmentMap.entries())
            .map(([id, title]) => ({ id, title }))
            .sort((a, b) => a.title.localeCompare(b.title))
        );
    };

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- Tab Change Logic from tmp2.txt (có cập nhật URL) ---
    const handleTabChange = (key: string) => {
        setActiveTab(key);
        setPage(1);
        setSelectedAssignmentId(null);
        setSelectedModule(null);
        setSelectedUmlType(null);
        const newSearchParams = new URLSearchParams(searchParams);
        if (key !== 'test') { // 'test' là tab mặc định, không cần lưu vào URL
            newSearchParams.set(ASSIGNMENT_TAB_PARAM, key);
        } else {
            newSearchParams.delete(ASSIGNMENT_TAB_PARAM);
        }
        setSearchParams(newSearchParams, { replace: true });
    };

    // --- Assignment Processing ---
    const processedAssignments = useMemo(() => {
        let flattened: ProcessedAssignmentItem[] = [];

        if (activeTab === 'quiz') {
            // Xử lý quiz items
            flattened = assignments.flatMap(a => {
                if (selectedAssignmentId && a.id !== selectedAssignmentId) {
                    return [];
                }

                const quizzes = a.assignedQuizzes || [];
                return quizzes.map((q, qIndex) => ({
                    key: `${a.id}-quiz-${q.quizId}-${qIndex}`,
                    assignmentId: a.id,
                    assignmentTitle: q.quizTitle || a.title,
                    startDate: q.startDate,
                    endDate: q.endDate,
                    type: 'QUIZ' as AssignmentType,
                    assignmentClassDetailId: q.assignmentClassDetailId,
                    testSetName: q.testSetName,
                    collectionName: q.collectionName,
                    totalQuestions: q.totalQuestions,
                    createdDate: a.createdDate
                } as ProcessedAssignmentItem));
            });
        } else {
            // Xử lý assignment và test items
            const isFilteringTest = activeTab === 'test';
            flattened = assignments.flatMap(a => {
                if (selectedAssignmentId && a.id !== selectedAssignmentId) {
                    return [];
                }

                const relevantModules = a.assignedModules
                    .filter(m => m.checkedTest === isFilteringTest);

                return relevantModules.map((m, mIndex) => ({
                    key: `${a.id}-${m.moduleId}-${mIndex}`,
                    assignmentId: a.id,
                    assignmentTitle: a.title,
                    assignmentCode: a.assignmentCode,
                    startDate: m.startDate,
                    endDate: m.endDate,
                    type: a.type,
                    assignmentClassDetailId: m.assignmentClassDetailId,
                    moduleName: m.moduleName,
                    typeUmls: m.typeUmls,
                    isModuleTest: m.checkedTest,
                    createdDate: a.createdDate
                } as ProcessedAssignmentItem));
            });
        }

        // Lọc theo module và UML type (chỉ áp dụng cho assignment/test)
        if (activeTab !== 'quiz') {
            flattened = flattened.filter(item => {
                const matchesModule = selectedModule === null || selectedModule === '' ||
                    item.moduleName === selectedModule;

                const matchesUmlType = selectedUmlType === null || selectedUmlType === '' ||
                    (item.typeUmls && item.typeUmls.includes(selectedUmlType));

                return matchesModule && matchesUmlType;
            });
        } else {
            // Lọc theo assignment/quiz name cho tab Quiz
            flattened = flattened.filter(item => selectedAssignmentId === null || item.assignmentId === selectedAssignmentId);
        }

        // Sắp xếp
        if (sortBy) {
            flattened.sort((a, b) => {
                let aVal: any;
                let bVal: any;
                let compareResult = 0;

                switch (sortBy) {
                    case 'title':
                        aVal = a.assignmentTitle ?? "";
                        bVal = b.assignmentTitle ?? "";
                        break;
                    case 'createdDate':
                        aVal = dayjs(a.createdDate).valueOf();
                        bVal = dayjs(b.createdDate).valueOf();
                        break;
                    default:
                        aVal = 0; bVal = 0;
                }

                if (aVal < bVal) compareResult = -1;
                if (aVal > bVal) compareResult = 1;

                return sortOrder === 'asc' ? compareResult : -compareResult;
            });
        }

        setTotal(flattened.length);

        const startIndex = (page - 1) * size;
        const endIndex = startIndex + size;

        if (startIndex >= flattened.length && flattened.length > 0) {
            setPage(1);
            return flattened.slice(0, size);
        }

        return flattened.slice(startIndex, endIndex);
    }, [assignments, activeTab, page, size, sortBy, sortOrder, selectedAssignmentId, selectedModule, selectedUmlType, searchParams]);

    // --- Pagination and Filter Handlers ---

    const onChangePage = (p: number, pageSize?: number) => {
        setPage(p);
        if (pageSize && pageSize !== size) {
            setSize(pageSize);
            setPage(1);
        }
    };

    // Chuyển đổi event handler của select từ antd sang HTML <select> của Tailwind (tmp2.txt)
    const handleAssignmentFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const value = event.target.value === "" ? null : event.target.value;
        setSelectedAssignmentId(value);
        if (activeTab === 'quiz') { // Thêm logic reset module/uml cho tab quiz từ tmp2.txt
            setSelectedModule(null);
            setSelectedUmlType(null);
        }
        setPage(1);
    };

    const handleModuleFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const value = event.target.value === "" ? null : event.target.value;
        setSelectedModule(value);
        setPage(1);
    };

    const handleUmlTypeFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const value = event.target.value === "" ? null : event.target.value;
        setSelectedUmlType(value);
        setPage(1);
    };

    // --- Available Filters Memo ---
    const availableModules = useMemo(() => {
        if (activeTab === 'quiz' || !selectedAssignmentId) { // Logic filter cho module từ tmp2.txt
            return uniqueModules;
        }

        const selectedAsg = assignments.find(a => a.id === selectedAssignmentId);
        if (!selectedAsg) return [];

        const isFilteringTest = activeTab === 'test';
        const moduleSet = new Set<string>();
        selectedAsg.assignedModules
            .filter(m => m.checkedTest === isFilteringTest)
            .forEach(m => moduleSet.add(m.moduleName));

        return Array.from(moduleSet).sort();
    }, [selectedAssignmentId, assignments, uniqueModules, activeTab]);

    const availableUmlTypes = useMemo(() => {
        if (activeTab === 'quiz' || !selectedAssignmentId) { // Logic filter cho uml từ tmp2.txt
            return uniqueUmlTypes;
        }

        const selectedAsg = assignments.find(a => a.id === selectedAssignmentId);
        if (!selectedAsg) return [];

        const isFilteringTest = activeTab === 'test';
        const umlSet = new Set<string>();
        selectedAsg.assignedModules
            .filter(m => m.checkedTest === isFilteringTest)
            .forEach(m => {
                m.typeUmls.forEach(uml => umlSet.add(uml));
            });

        return Array.from(umlSet).sort();
    }, [selectedAssignmentId, assignments, uniqueUmlTypes, activeTab]);

    // --- Unassign Logic ---
    const handleUnassign = async (assignmentClassDetailId: number, isQuiz: boolean = false) => {
        try {
            message.loading({ content: t('common.unassigning') || 'Đang hủy giao...', key: 'unassign' });
            if (isQuiz) {
                // Tìm quiz assignment để lấy testSetId
                const quizAssignment = assignments.find(a =>
                    a.assignedQuizzes?.some(q => q.assignmentClassDetailId === assignmentClassDetailId)
                );
                if (quizAssignment && quizAssignment.assignedQuizzes) {
                    const quiz = quizAssignment.assignedQuizzes.find(q =>
                        q.assignmentClassDetailId === assignmentClassDetailId
                    );
                    if (quiz) {
                        await removeTestSetFromClass(classId, quiz.testSetId);
                    }
                }
            } else {
                await unassignAssignment(assignmentClassDetailId);
            }

            message.success({ content: t('common.unassignSuccess') || 'Hủy giao thành công!', key: 'unassign', duration: 2 });
            await new Promise(resolve => setTimeout(resolve, 1000));
            fetchData();
        } catch (error) {
            console.error("Unassign failed:", error);
            const errorMessage = error instanceof Error ? error.message : 'Xoá thất bại!';
            message.error({ content: errorMessage, key: 'unassign', duration: 3 });
        }
    };

    // --- Render Item (Sử dụng Tailwind CSS từ tmp2.txt) ---
    const renderAssignmentItem = (item: ProcessedAssignmentItem) => {
        const isQuiz = item.type === 'QUIZ';
        const isTest = item.isModuleTest;

        let primaryColor, secondaryColor, icon, typeText;

        if (isQuiz) {
            primaryColor = '#9254de';
            secondaryColor = '#f9f0ff';
            icon = <MdOutlineAssignment className="text-lg"/>;
            typeText = "TRẮC NGHIỆM";
        } else if (isTest) {
            primaryColor = '#fa541c';
            secondaryColor = '#fff1f0';
            icon = <IoTimeOutline className="text-lg"/>;
            typeText = t("classDetail.type.test") || "KIỂM TRA";
        } else {
            primaryColor = '#52c41a';
            secondaryColor = '#f6ffed';
            icon = <MdAssignmentTurnedIn className="text-lg"/>;
            typeText = t("classDetail.type.assignment") || "LUYỆN TẬP";
        }

        const keyPrefix = item.key;
        return (
            <li key={item.key} className="p-0 mb-3 list-none">
                <div
                    className="relative p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 ease-in-out"
                    style={{ borderLeft: `4px solid ${primaryColor}` }}
                >
                    <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 flex gap-3 items-start min-w-0">
                            <div
                                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-base"
                                style={{ backgroundColor: secondaryColor, color: primaryColor, marginTop: '2px' }}
                            >
                                {icon}
                            </div>

                            <div className="flex-1 min-w-0">
                                <h5 className="text-sm font-semibold text-gray-800 m-0 mb-0.5 leading-snug truncate">
                                    {item.assignmentTitle}
                                </h5>

                                <div className="flex flex-wrap gap-1.5 mb-1.5 text-xs">
                                    <span className="font-semibold text-xs" style={{ color: primaryColor }}>
                                        [{typeText}]
                                    </span>

                                    {!isQuiz && (
                                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                                            {item.moduleName}
                                        </span>
                                    )}

                                    {isQuiz ?
                                        (
                                            <>
                                                {item.collectionName && (
                                                    <span className="px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: '#e6f7ff', color: '#1890ff' }}>
                                                        {item.collectionName}
                                                    </span>
                                                )}
                                            </>
                                        ) : (
                                            item.typeUmls?.map((name, index) => (
                                                <span
                                                    key={`${keyPrefix}-uml-${name}-${index}`}
                                                    className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium"
                                                >
                                                    {name}
                                                </span>
                                            ))
                                        )}
                                </div>

                                {/* Deadline */}
                                <span className="flex items-center gap-1 text-xs text-gray-500">
                                    <IoCalendarOutline className="text-sm" />
                                    {item.startDate && item.endDate
                                        ? `${dayjs(item.startDate).format("DD/MM")} → ${dayjs(item.endDate).format("DD/MM/YYYY")}`
                                        : t("classDetail.assignment.noDeadline") || "No Deadline"}
                                </span>
                            </div>
                        </div>

                        {/* RIGHT: Actions */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                            {!isQuiz && (
                                <button
                                    title={t("classDetail.view.assignmentInfo") || "Xem thông tin"}
                                    className="p-1 rounded-full text-blue-500 hover:bg-blue-50 transition-colors duration-200"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleViewAssignmentDetails(item);
                                    }}
                                >
                                    <MdOutlineAssignment className="text-base" />
                                </button>
                            )}

                            {(isTest || isQuiz) && (
                                <button
                                    title={t("classDetail.view.submissionDetails") || "Xem chi tiết nộp bài"}
                                    className="p-1 rounded-full hover:opacity-80 transition-opacity duration-200"
                                    style={{ color: primaryColor }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        goToAssignmentDetails(item.assignmentId, item.assignmentClassDetailId);
                                    }}
                                >
                                    <IoFileTrayFull className="text-base" />
                                </button>
                            )}

                            <Popconfirm
                                title={t('common.confirm') || "Bạn có chắc chắn muốn hủy giao mục này?"}
                                onConfirm={() => handleUnassign(item.assignmentClassDetailId, isQuiz)}
                                okText={t('common.yes') || "Có"}
                                cancelText={t('common.no') || "Không"}
                                placement="topRight"
                            >
                                <button
                                    title={t("classDetail.unassign") || "Hủy giao"}
                                    className="p-1 rounded-full text-red-500 hover:bg-red-50 transition-colors duration-200"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <IoCloseCircleOutline className="text-base" />
                                </button>
                            </Popconfirm>
                        </div>
                    </div>
                </div>
            </li>
        );
    };

    // --- Helper Functions ---
    const countAssignments = (type: 'test' | 'assignment' | 'quiz') => {
        const assignmentsToCount = selectedAssignmentId
            ? assignments.filter(a => a.id === selectedAssignmentId)
            : assignments;
        if (type === 'quiz') {
            return assignmentsToCount.reduce((count, a) =>
                count + (a.assignedQuizzes?.length || 0), 0
            );
        }

        const isTest = type === 'test';
        return assignmentsToCount.flatMap(a =>
            a.assignedModules.filter(m => m.checkedTest === isTest)
        ).length;
    };

    const renderEmptyContent = (type: 'test' | 'assignment' | 'quiz') => {
        let descriptionText;
        if (type === 'quiz') {
            descriptionText = t("common.noData") || "Chưa có trắc nghiệm nào được giao.";
        } else if (type === 'test') {
            descriptionText = t("common.noData") || "Chưa có kiểm tra nào được giao.";
        } else {
            descriptionText = t("common.noData") || "Chưa có luyện tập nào được giao.";
        }

        // Sử dụng giao diện Empty của tmp2.txt (dựa trên Tailwind CSS)
        return (
            <div className="flex flex-col items-center justify-center p-10 bg-gray-50 rounded-lg border border-gray-200">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-gray-400 mb-4"
                >
                    <path d="M12 2v6h6" />
                    <path d="M18 22H6c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h8l4 4v14c0 1.1-.9 2-2 2z" />
                    <line x1="8" y1="18" x2="16" y2="18" />
                    <line x1="8" y1="14" x2="16" y2="14" />
                    <line x1="8" y1="10" x2="12" y2="10" />
                </svg>
                <p className="text-gray-500 text-base">
                    {descriptionText}
                </p>
            </div>
        );
    };

    const renderTabContent = (type: 'test' | 'assignment' | 'quiz') => {
        const data = processedAssignments;
        if (data.length === 0) {
            return renderEmptyContent(type);
        }

        return (
            <ul className="grid grid-cols-1 gap-3">
                {data.map(item => renderAssignmentItem(item))}
            </ul>
        );
    };


    // --- Loading and Error States ---
    if (loading) {
        return (
            <div className="p-8 flex justify-center items-center gap-2">
                <Spinner animation="border" />
                <span className="text-gray-700">{t('common.loading') || 'Đang tải...'}</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 mx-8 bg-red-100 border border-red-400 text-red-700" role="alert">
                {error}
            </div>
        );
    }

    // --- Main Component Render (Sử dụng cấu trúc Tailwind CSS từ tmp2.txt) ---

    const tabLabels = [
        { key: 'test', label: t("classDetail.tabs.test") || `Bài Tập Kiểm Tra (${countAssignments('test')})`, content: renderTabContent('test') },
        { key: 'assignment', label: t("classDetail.tabs.assignment") || `Bài Tập Luyện Tập (${countAssignments('assignment')})`, content: renderTabContent('assignment') },
        { key: 'quiz', label: `Bài Trắc Nghiệm (${countAssignments('quiz')})`, content: renderTabContent('quiz') },
    ];

    return (
        <div className="p-6">
            <main className="flex-1">
                <div className="mb-4">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-end">
                        {/* Tabs Navigation (Tailwind) */}
                        <div className="border-b border-gray-200 flex-1 min-w-0 mb-4 md:mb-0 order-2 md:order-1">
                            <nav className="flex space-x-4" aria-label="Tabs">
                                {tabLabels.map(tab => (
                                    <button
                                        key={tab.key}
                                        onClick={() => handleTabChange(tab.key)}
                                        className={`
                                            py-2 px-1 text-sm font-medium transition-colors duration-200 ease-in-out whitespace-nowrap
                                            ${activeTab === tab.key
                                            ? 'border-b-2 border-blue-600 text-blue-600'
                                            : 'text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300'
                                        }
                                        `}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </nav>
                        </div>

                        {/* Filter and Create/Assign Buttons (Tailwind) */}
                        <div className="flex items-center gap-3 order-1 md:order-2 flex-shrink-0">
                            {/* Filter Button */}
                            <button
                                className={`flex items-center gap-1 font-semibold py-2 px-3 rounded-md transition duration-150 text-sm border ${isFilterDropdownOpen ? 'bg-gray-100 text-blue-600 border-blue-300' : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'}`}
                                onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                                title={"Bộ lọc"}
                            >
                                <IoSearch className="text-base" />
                                {"Bộ lọc"}
                            </button>

                            {/* Create/Assign Dropdown */}
                            <div className="relative">
                                <button
                                    className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 transition duration-150 flex items-center gap-2 text-sm"
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                >
                                    {t("classDetail.assignment.assign") || "Create/Assign"} <DownOutlined className="text-xs" />
                                </button>

                                {isDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-20 ring-1 ring-black ring-opacity-5 focus:outline-none">
                                        <div className="py-1">
                                            <button
                                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                onClick={showAssignmentModal}
                                            >
                                                {t("classDetail.assignment.assignAssignment")}
                                            </button>
                                            <button
                                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                onClick={showTestAssignmentModal}
                                            >
                                                {t("classDetail.assignment.assignTest")}
                                            </button>
                                            <button
                                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                onClick={showQuizAssignmentModal}
                                            >
                                                {t("classDetail.assignment.assignQuiz") || "Giao trắc nghiệm"}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter Dropdown Content (Tailwind) */}
                <div
                    className={`transition-all duration-300 ease-in-out overflow-hidden mb-4 ${isFilterDropdownOpen ? 'max-h-96 opacity-100 pt-4' : 'max-h-0 opacity-0'}`}
                >
                    <div className="flex flex-wrap items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        {/* Select Assignment Title */}
                        <select
                            className="w-full md:w-64 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                            value={selectedAssignmentId || ""}
                            onChange={handleAssignmentFilterChange}
                        >
                            <option value="">{t("classDetail.filter.assignmentTitle") || "Lọc theo Tên Assignment"}</option>
                            {uniqueAssignments.map(assignment => (
                                <option key={assignment.id} value={assignment.id}>
                                    {assignment.title}
                                </option>
                            ))}
                        </select>

                        {/* Module and UML Type Filters (Only for Assignment/Test tabs) */}
                        {(activeTab === 'test' || activeTab === 'assignment') && (
                            <>
                                {/* Select Module */}
                                <select
                                    className="w-full md:w-64 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm disabled:bg-gray-100"
                                    value={selectedModule || ""}
                                    onChange={handleModuleFilterChange}
                                    disabled={!availableModules.length && !!selectedAssignmentId}
                                >
                                    <option value="">{t("classDetail.filter.module") || "Lọc theo Module"}</option>
                                    {availableModules.map(moduleName => (
                                        <option key={moduleName} value={moduleName}>
                                            {moduleName}
                                        </option>
                                    ))}
                                </select>

                                {/* Select UML Type */}
                                <select
                                    className="w-full md:w-36 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm disabled:bg-gray-100"
                                    value={selectedUmlType || ""}
                                    onChange={handleUmlTypeFilterChange}
                                    disabled={!availableUmlTypes.length && !!selectedAssignmentId}
                                >
                                    <option value="">{t("classDetail.filter.umlType") || "Loại UML"}</option>
                                    {availableUmlTypes.map(typeName => (
                                        <option key={typeName} value={typeName}>
                                            {typeName}
                                        </option>
                                    ))}
                                </select>
                            </>
                        )}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="mt-4">
                    {tabLabels.find(t => t.key === activeTab)?.content}
                </div>

                {/* Pagination */}
                <div className="mt-4 flex justify-end">
                    {total > 0 && (
                        <Pagination
                            current={page}
                            pageSize={size}
                            total={total}
                            showSizeChanger
                            pageSizeOptions={["5", "10", "15", "20"]} // Thay đổi pageSizeOptions theo tmp2.txt
                            onChange={onChangePage}
                            onShowSizeChange={onChangePage}
                            showTotal={(total) =>
                                `${t("common.all") || "Tổng"} ${total} ${t("common.items") || "mục"}`
                            }
                        />
                    )}
                </div>

                {/* Modals */}
                <AssignAssignmentModal
                    visible={isAssignmentModalVisible}
                    onClose={hideAssignmentModal}
                    classIds={[classId]}
                    onAssigned={fetchData}
                />
                <AssignAssignmentModalTest
                    visible={isAssignmentModalVisibleTest}
                    onClose={hideAssignmentModal}
                    classIds={[classId]}
                    onAssigned={fetchData}
                />
                <AssignQuizModal
                    visible={isQuizModalVisible}
                    onClose={hideAssignmentModal}
                    classIds={[classId]}
                    onAssigned={fetchData}
                />
            </main>
        </div>
    );
};

export default AssignmentTab;