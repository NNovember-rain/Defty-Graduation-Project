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
    Button,
    Card,
    Col,
    Dropdown,
    Empty,
    List,
    type MenuProps,
    message,
    Pagination,
    Popconfirm,
    Row,
    Select,
    Space,
    Tabs,
    type TabsProps,
    Tag,
    Tooltip,
    Typography
} from "antd";
import {IoCalendarOutline, IoCloseCircleOutline, IoFileTrayFull, IoTimeOutline} from "react-icons/io5";
import {MdAssignmentTurnedIn, MdOutlineAssignment} from "react-icons/md";
import {DownOutlined} from "@ant-design/icons";
import {useNavigate} from "react-router-dom";
import AssignAssignmentModal from "./AssignAssignmentModal.tsx";
import AssignAssignmentModalTest from "./AssignAssignmentModalTest.tsx";
import AssignQuizModal from "./AssignQuizModal.tsx";

const { Title, Text } = Typography;
const { Option } = Select;

interface AssignmentTabProps {
    classId: number;
}

type AssignmentType = "ASSIGNMENT" | "TEST" | "QUIZ";

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
    // Quiz specific fields
    testSetName?: string;
    collectionName?: string;
    totalQuestions?: number;
    createdDate: string;
}

const DEFAULT_PAGE_SIZE = 9;

const AssignmentTab: React.FC<AssignmentTabProps> = ({ classId }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
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

    const [activeTab, setActiveTab] = useState<string>('test');

    const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
    const [selectedModule, setSelectedModule] = useState<string | null>(null);
    const [selectedUmlType, setSelectedUmlType] = useState<string | null>(null);

    const [uniqueModules, setUniqueModules] = useState<string[]>([]);
    const [uniqueUmlTypes, setUniqueUmlTypes] = useState<string[]>([]);
    const [uniqueAssignments, setUniqueAssignments] = useState<{ id: string; title: string }[]>([]);

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
    }, []);

    const showTestAssignmentModal = useCallback(() => {
        setIsAssignmentModalVisibleTest(true);
    }, []);

    const showQuizAssignmentModal = useCallback(() => {
        setIsQuizModalVisible(true);
    }, []);

    const hideAssignmentModal = () => {
        setIsAssignmentModalVisible(false);
        setIsAssignmentModalVisibleTest(false);
        setIsQuizModalVisible(false);
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Existing assignment fetch logic...
            const options: GetAssignmentsOptions = {
                limit: 1000,
            };

            const response = await getAssignmentsByClassId(classId, options);
            const data = response.assignments || [];

            // Fetch quiz assignments
            const quizResponse = await getAllTestSetsByClassId(classId);
            const quizData = quizResponse.data || [];

            // Map quiz data vào format phù hợp
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
                    assignmentClassDetailId: quiz.id, // Sử dụng assignment id
                }],
                assignedUmlType: null,
                createdDate: quiz.createdDate || dayjs().toISOString(),
            } as IAssignmentExtended));

            // Merge assignments và quiz assignments
            const mappedAssignments: IAssignmentExtended[] = data.map((a: any, index: number) => {
                // Existing mapping logic...
                const assignmentType: AssignmentType = (a.assignmentClassDetailResponseList || []).some((m: any) => m.checkedTest === true) ? "TEST" : "ASSIGNMENT";

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
                    assignedUmlType: null,
                    createdDate: a.createdDate || dayjs().toISOString(),
                } as unknown as IAssignmentExtended;
            });

            // Combine both arrays
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

    }, [assignments, activeTab, page, size, sortBy, sortOrder, selectedAssignmentId, selectedModule, selectedUmlType]);

    const menuItems: MenuProps["items"] = [
        {
            key: "assign",
            label: t("classDetail.assignment.assignAssignment"),
            onClick: () => showAssignmentModal()
        },
        {
            key: "assignTest",
            label: t("classDetail.assignment.assignTest"),
            onClick: () => showTestAssignmentModal()
        },
        {
            key: "assignQuiz",
            label: t("classDetail.assignment.assignQuiz") || "Giao bài trắc nghiệm",
            onClick: () => showQuizAssignmentModal()
        }
    ];

    const onChangePage = (p: number, pageSize?: number) => {
        setPage(p);
        if (pageSize && pageSize !== size) {
            setSize(pageSize);
            setPage(1);
        }
    };

    const onSortChange = (value: string) => {
        const [field, order] = value.split("_");
        setSortBy(field);
        setSortOrder(order as "asc" | "desc");
        setPage(1);
    };

    const handleAssignmentFilterChange = (value: string | null) => {
        setSelectedAssignmentId(value);
        setSelectedModule(null);
        setSelectedUmlType(null);
        setPage(1);
    };

    const handleModuleFilterChange = (value: string | null) => {
        setSelectedModule(value);
        setPage(1);
    };

    const handleUmlTypeFilterChange = (value: string | null) => {
        setSelectedUmlType(value);
        setPage(1);
    };

    const availableModules = useMemo(() => {
        if (!selectedAssignmentId) {
            return uniqueModules;
        }

        const selectedAsg = assignments.find(a => a.id === selectedAssignmentId);
        if (!selectedAsg) return [];

        const moduleSet = new Set<string>();
        selectedAsg.assignedModules.forEach(m => moduleSet.add(m.moduleName));

        return Array.from(moduleSet).sort();
    }, [selectedAssignmentId, assignments, uniqueModules]);

    const availableUmlTypes = useMemo(() => {
        if (!selectedAssignmentId) {
            return uniqueUmlTypes;
        }

        const selectedAsg = assignments.find(a => a.id === selectedAssignmentId);
        if (!selectedAsg) return [];

        const umlSet = new Set<string>();
        selectedAsg.assignedModules.forEach(m => {
            m.typeUmls.forEach(uml => umlSet.add(uml));
        });

        return Array.from(umlSet).sort();
    }, [selectedAssignmentId, assignments, uniqueUmlTypes]);

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

            message.success({ content: t('common.unassignSuccess') || 'Hủy giao bài tập thành công!', key: 'unassign', duration: 2 });
            await new Promise(resolve => setTimeout(resolve, 1000));
            fetchData();
        } catch (error) {
            console.error("Unassign failed:", error);
            const errorMessage = error instanceof Error ? error.message : 'Xoá thất bại!';
            message.error({ content: errorMessage, key: 'unassign', duration: 3 });
        }
    };

    const renderAssignmentItem = (item: ProcessedAssignmentItem) => {
        const isQuiz = item.type === 'QUIZ';
        const isTest = item.isModuleTest;

        let primaryColor, secondaryColor, icon, typeText;

        if (isQuiz) {
            primaryColor = '#9254de'; // Tím cho Quiz
            secondaryColor = '#f9f0ff';
            icon = <MdOutlineAssignment />;
            typeText = "TRẮC NGHIỆM";
        } else if (isTest) {
            primaryColor = '#fa541c'; // Cam cho Test
            secondaryColor = '#fff1f0';
            icon = <IoTimeOutline />;
            typeText = t("classDetail.type.test") || "KIỂM TRA";
        } else {
            primaryColor = '#52c41a'; // Xanh lá cho Assignment
            secondaryColor = '#f6ffed';
            icon = <MdAssignmentTurnedIn />;
            typeText = t("classDetail.type.assignment") || "LUYỆN TẬP";
        }

        const keyPrefix = item.key;

        return (
            <List.Item key={item.key} style={{ padding: 0 }}>
                <Card
                    hoverable
                    style={{
                        borderRadius: 12,
                        marginBottom: 16,
                        borderLeft: `5px solid ${primaryColor}`,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                        transition: 'all 0.3s ease',
                    }}
                    bodyStyle={{ padding: '16px' }}
                >
                    <Row gutter={[16, 16]} align="top">
                        <Col xs={24} sm={24} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                            <div style={{
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                background: secondaryColor,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: primaryColor,
                                fontSize: 20,
                                flexShrink: 0,
                                marginTop: 4
                            }}>
                                {icon}
                            </div>

                            <div style={{ flex: 1 }}>
                                <Title level={5} style={{ margin: '0 0 4px 0', lineHeight: 1.2, fontSize: '16px', color: '#262626' }}>
                                    {item.assignmentTitle}
                                </Title>

                                <Space size={[8, 4]} wrap style={{ marginBottom: 8 }}>
                                    {isQuiz ? (
                                        <>
                                            {item.collectionName && (
                                                <Tag key={`${keyPrefix}-collection`} color="geekblue" style={{ fontWeight: 500 }}>
                                                    {item.collectionName}
                                                </Tag>
                                            )}

                                            {item.totalQuestions && (
                                                <Tag key={`${keyPrefix}-questions`} color="cyan" style={{ fontWeight: 500 }}>
                                                    {item.totalQuestions} câu hỏi
                                                </Tag>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <Tag key={`${keyPrefix}-module-main`} color="blue" style={{ fontWeight: 500 }}>
                                                Module: {item.moduleName}
                                            </Tag>

                                            {item.typeUmls?.map((name, index) => (
                                                <Tag
                                                    key={`${keyPrefix}-uml-${name}-${index}`}
                                                    color="geekblue"
                                                    style={{ fontWeight: 500 }}
                                                >
                                                    {name}
                                                </Tag>
                                            ))}
                                        </>
                                    )}
                                </Space>


                                <Space size={16}>
                                    <Text style={{ fontWeight: 600, color: primaryColor, fontSize: '12px' }}>
                                        [{typeText}]
                                    </Text>

                                    <Text type="secondary" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: '12px', color: '#595959' }}>
                                        <IoCalendarOutline />
                                        {item.startDate && item.endDate
                                            ? `${dayjs(item.startDate).format("DD/MM/YYYY")} → ${dayjs(item.endDate).format("DD/MM/YYYY")}`
                                            : t("classDetail.assignment.noDeadline") || "No Deadline"}
                                    </Text>
                                </Space>
                            </div>
                        </Col>

                        <Col
                            xs={24}
                            style={{
                                textAlign: "right",
                                display: "flex",
                                justifyContent: "flex-end",
                                alignItems: "center",
                                gap: 12,
                                borderTop: '1px solid #f0f0f0',
                                paddingTop: '8px'
                            }}
                        >
                            {!isQuiz && (
                                <Tooltip title={t("classDetail.view.assignmentInfo") || "Xem thông tin bài tập"}>
                                    <Button
                                        icon={<MdOutlineAssignment />}
                                        type="text"
                                        shape="circle"
                                        style={{ color: '#1890ff', fontSize: '18px' }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleViewAssignmentDetails(item);
                                        }}
                                    />
                                </Tooltip>
                            )}

                            {(isTest || isQuiz) && (
                                <Tooltip title={t("classDetail.view.submissionDetails") || "Xem chi tiết bài nộp"}>
                                    <Button
                                        icon={<IoFileTrayFull />}
                                        type="text"
                                        shape="circle"
                                        style={{ color: primaryColor, fontSize: '18px' }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            goToAssignmentDetails(item.assignmentId, item.assignmentClassDetailId);
                                        }}
                                    />
                                </Tooltip>
                            )}
                            <Popconfirm
                                title={t('common.confirm') || "Bạn có chắc chắn muốn hủy giao bài tập này?"}
                                onConfirm={() => handleUnassign(item.assignmentClassDetailId, isQuiz)}
                                okText={t('common.yes') || "Có"}
                                cancelText={t('common.no') || "Không"}
                                placement="topRight"
                            >
                                <Tooltip title={t("classDetail.unassign") || "Hủy giao bài tập"}>
                                    <Button
                                        icon={<IoCloseCircleOutline />}
                                        type="text"
                                        shape="circle"
                                        danger
                                        style={{ fontSize: '18px' }}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </Tooltip>
                            </Popconfirm>
                        </Col>
                    </Row>
                </Card>
            </List.Item>
        );
    };

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
            descriptionText = "Chưa có bài trắc nghiệm nào được giao.";
        } else if (type === 'test') {
            descriptionText = t("common.noData") || "Chưa có bài tập kiểm tra nào được giao.";
        } else {
            descriptionText = t("common.noData") || "Chưa có bài tập luyện tập nào được giao.";
        }

        return (
            <Empty
                description={
                    <Text type="secondary" style={{ color: '#8c8c8c' }}>
                        {descriptionText}
                    </Text>
                }
                image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
        );
    };

    const tabItems: TabsProps['items'] = [
        {
            key: 'test',
            label: t("classDetail.tabs.test") || `Bài Tập Kiểm Tra (${countAssignments('test')})`,
            children: (
                <List
                    itemLayout="vertical"
                    dataSource={processedAssignments}
                    renderItem={renderAssignmentItem}
                    locale={{ emptyText: renderEmptyContent('test') }}
                />
            ),
        },
        {
            key: 'assignment',
            label: t("classDetail.tabs.assignment") || `Bài Tập Luyện Tập (${countAssignments('assignment')})`,
            children: (
                <List
                    itemLayout="vertical"
                    dataSource={processedAssignments}
                    renderItem={renderAssignmentItem}
                    locale={{ emptyText: renderEmptyContent('assignment') }}
                />
            ),
        },
        {
            key: 'quiz',
            label: `Bài Trắc Nghiệm (${countAssignments('quiz')})`,
            children: (
                <List
                    itemLayout="vertical"
                    dataSource={processedAssignments}
                    renderItem={renderAssignmentItem}
                    locale={{ emptyText: renderEmptyContent('quiz') }}
                />
            ),
        }
    ];

    if (loading) {
        return (
            <div style={{ padding: "2rem", display: "flex", justifyContent: "center", alignItems: "center", gap: '8px' }}>
                <Spinner animation="border" />
                <Text>{t('common.loading') || 'Đang tải...'}</Text>
            </div>
        );
    }

    if (error) {
        return (
            <div
                style={{
                    padding: "1rem",
                    color: "#dc3545",
                    backgroundColor: "#f8d7da",
                    border: "1px solid #f5c6cb",
                    margin: "2rem"
                }}
            >
                {error}
            </div>
        );
    }

    return (
        <div style={{ padding: "2rem" }}>
            <main style={{ flex: 1 }}>
                <Row justify="space-between" align="middle" gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    <Col xs={24} sm={24} md={4} lg={3}>
                        <Title level={3} style={{ margin: 0 }}>
                            {t("classDetail.tabs.classwork") || "Classwork"}
                        </Title>
                    </Col>

                    <Col xs={24} sm={24} md={20} lg={21}>
                        <Space size={12} wrap style={{ width: '100%', justifyContent: 'flex-end' }}>
                            <Select
                                placeholder={t("classDetail.filter.assignmentTitle") || "Lọc theo Tên Bài tập"}
                                allowClear
                                showSearch
                                style={{ width: 280 }}
                                value={selectedAssignmentId}
                                onChange={handleAssignmentFilterChange}
                                filterOption={(input, option) =>
                                    (option?.children as string)?.toLowerCase().includes(input.toLowerCase())
                                }
                            >
                                {uniqueAssignments.map(assignment => (
                                    <Option key={assignment.id} value={assignment.id}>
                                        {assignment.title}
                                    </Option>
                                ))}
                            </Select>

                            <Select
                                placeholder={t("classDetail.filter.module") || "Module"}
                                allowClear
                                style={{ width: 280 }}
                                value={selectedModule}
                                onChange={handleModuleFilterChange}
                                disabled={!availableModules.length && !!selectedAssignmentId}
                            >
                                {availableModules.map(moduleName => (
                                    <Option key={moduleName} value={moduleName}>
                                        {moduleName}
                                    </Option>
                                ))}
                            </Select>

                            <Select
                                placeholder={t("classDetail.filter.umlType") || "Loại UML"}
                                allowClear
                                style={{ width: 150 }}
                                value={selectedUmlType}
                                onChange={handleUmlTypeFilterChange}
                                disabled={!availableUmlTypes.length && !!selectedAssignmentId}
                            >
                                {availableUmlTypes.map(typeName => (
                                    <Option key={typeName} value={typeName}>
                                        {typeName}
                                    </Option>
                                ))}
                            </Select>

                            <Dropdown menu={{ items: menuItems }} placement="bottomRight" trigger={["click"]}>
                                <Button type="primary">
                                    {t("classDetail.assignment.assign") || "Create/Assign"} <DownOutlined />
                                </Button>
                            </Dropdown>
                        </Space>
                    </Col>
                </Row>

                <div style={{justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <Tabs
                        defaultActiveKey="assignment"
                        activeKey={activeTab}
                        items={tabItems}
                        onChange={(key) => {
                            setActiveTab(key);
                            setPage(1);
                        }}
                    />
                </div>

                <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
                    {total > 0 && (
                        <Pagination
                            current={page}
                            pageSize={size}
                            total={total}
                            showSizeChanger
                            pageSizeOptions={["6", "9", "12", "18"]}
                            onChange={onChangePage}
                            onShowSizeChange={onChangePage}
                            showTotal={(total) =>
                                `${t("common.all") || "Tổng"} ${total} ${t("common.items") || "mục"}`
                            }
                        />
                    )}
                </div>

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