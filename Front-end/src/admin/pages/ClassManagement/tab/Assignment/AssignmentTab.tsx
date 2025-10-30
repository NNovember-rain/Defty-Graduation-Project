import React, {useCallback, useEffect, useMemo, useState} from "react";
import {useTranslation} from "react-i18next";
import {Spinner} from "react-bootstrap";
import {
    getAssignmentsByClassId,
    type GetAssignmentsOptions,
    type IAssignment
} from "../../../../../shared/services/assignmentService.ts";
import dayjs from "dayjs";
import {
    Button,
    Card,
    Col,
    Dropdown,
    List,
    type MenuProps,
    Pagination,
    Row,
    Select,
    Space,
    Tabs,
    type TabsProps,
    Tooltip,
    Typography,
    Tag
} from "antd";
import {IoCalendarOutline, IoFileTrayFull} from "react-icons/io5";
import {MdOutlineAssignment} from "react-icons/md";
import {AppstoreOutlined, DownOutlined, UnorderedListOutlined} from "@ant-design/icons";
import {useNavigate} from "react-router-dom";
import AssignAssignmentModal from "./AssignAssignmentModal.tsx";
import AssignAssignmentModalTest from "./AssignAssignmentModalTest.tsx";

const { Title, Text } = Typography;
const { Option } = Select;

interface AssignmentTabProps {
    classId: number;
}

type AssignmentType = "ASSIGNMENT" | "TEST";

interface IAssignmentExtended extends IAssignment {
    id: string;
    type: AssignmentType;
    startDate: string | null;
    endDate: string | null;
    classInfoId: number;

    assignedModules: any[];
    assignedUmlType: { name: string; } | null;
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
    const [view, setView] = useState<"grid" | "list">("list");
    const [sortBy, setSortBy] = useState<string | undefined>("createdDate");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc" | undefined>("desc");
    const [isAssignmentModalVisible, setIsAssignmentModalVisible] = useState(false);
    const [isAssignmentModalVisibleTest, setIsAssignmentModalVisibleTest] = useState(false);

    const [activeTab, setActiveTab] = useState<string>('test');

    const goToAssignmentDetails = (assignmentId: string) => {
        const originalId = assignmentId.split('-')[0];
        navigate(`/admin/class/${classId}/assignment/${originalId}/detail`);
    };

    const handleViewAssignmentDetails = useCallback(
        (rowData: IAssignmentExtended) => {
            const originalId = rowData.id.split('-')[0];
            navigate(`/admin/content/assignments/update/${originalId}`);
        },
        [navigate]
    );

    const showAssignmentModal = useCallback(() => {
        setIsAssignmentModalVisible(true);
    }, []);

    const showQuizAssignmentModal = useCallback(() => {
        setIsAssignmentModalVisibleTest(true);
    }, []);

    const hideAssignmentModal = () => {
        setIsAssignmentModalVisible(false);
        setIsAssignmentModalVisibleTest(false);
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const options: GetAssignmentsOptions = {
                limit: 1000,
                sortBy,
                sortOrder
            };

            const response = await getAssignmentsByClassId(classId, options);

            const combinedAssignments: IAssignmentExtended[] = [];

            (response.assignments || []).forEach((a: IAssignment) => {
                const classInfosForCurrentClass = a.assignmentClasses?.filter(
                    (ac: any) => ac.classId === classId
                ) || [];

                if (classInfosForCurrentClass.length === 0) {
                    return;
                }

                classInfosForCurrentClass.forEach((classInfo: any) => {
                    const isTest = classInfo.checkedTest;
                    const assignmentType: AssignmentType = isTest ? "TEST" : "ASSIGNMENT";

                    const startDate = classInfo.startDate ? dayjs(classInfo.startDate).toISOString() : null;
                    const endDate = classInfo.endDate ? dayjs(classInfo.endDate).toISOString() : null;

                    const uniqueId = `${a.id}-${classInfo.id}`;

                    combinedAssignments.push({
                        ...a,
                        id: uniqueId,
                        classInfoId: classInfo.id,
                        type: assignmentType,
                        createdDate: a.createdDate ? dayjs(a.createdDate).toISOString() : "",
                        startDate: startDate,
                        endDate: endDate,

                        assignedModules: classInfo.moduleResponses || [],
                        assignedUmlType: classInfo.typeUmlResponse || null,

                    } as IAssignmentExtended);
                });
            });

            setAssignments(combinedAssignments);
        } catch (err) {
            console.error("Failed to fetch assignments:", err);
            setError(t("common.errorFetchingData") || "Lỗi khi lấy dữ liệu");
        } finally {
            setLoading(false);
        }
    }, [classId, sortBy, sortOrder, t]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredAssignments = useMemo(() => {
        let filtered = assignments;

        if (activeTab === 'assignment') {
            filtered = assignments.filter(a => a.type === "ASSIGNMENT");
        } else if (activeTab === 'test') {
            filtered = assignments.filter(a => a.type === "TEST");
        }

        if (sortBy) {
            filtered.sort((a, b) => {
                const aVal = a[sortBy as keyof IAssignmentExtended] ?? "";
                const bVal = b[sortBy as keyof IAssignmentExtended] ?? "";

                if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
                return 0;
            });
        }

        setTotal(filtered.length);

        const startIndex = (page - 1) * size;
        const endIndex = startIndex + size;

        return filtered.slice(startIndex, endIndex);

    }, [assignments, activeTab, page, size, sortBy, sortOrder]);

    const menuItems: MenuProps["items"] = [
        {
            key: "create",
            label: t("classDetail.assignment.createNew") || "Create New",
            onClick: () => navigate(`/admin/content/assignments/create?classId=${classId}`)
        },
        {
            key: "assign",
            label: t("classDetail.assignment.assign") || "Assign Assignment (Luyện tập)",
            onClick: () => showAssignmentModal()
        },
        {
            key: "assignTest",
            label: t("classDetail.assignment.assignTest") || "Assign Test (Kiểm tra)",
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

    const onToggleView = (v: "grid" | "list") => {
        setView(v);
    };

    const onSortChange = (value: string) => {
        const [field, order] = value.split("_");
        setSortBy(field);
        setSortOrder(order as "asc" | "desc");
        setPage(1);
    };


    const renderAssignmentItem = (a: IAssignmentExtended) => {
        const moduleNames = (a.assignedModules || []).map((m: any) => m.moduleName).filter(Boolean);
        const umlTypeName = a.assignedUmlType?.name;

        const iconColor = "#fa8c16";
        const iconBackground = "#fff7e6";
        const typeTextColor = "#fa8c16";
        const umlTagColor = "orange";

        return (
            <List.Item key={a.id} style={{ padding: 0 }}>
                <Card
                    hoverable
                    style={{
                        borderRadius: 12,
                        marginBottom: 12,
                        boxShadow: "0 6px 18px rgba(0,0,0,0.04)"
                    }}
                >
                    <Row gutter={[16, 16]} align="middle">
                        <Col xs={24} sm={21}>
                            <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                                <div style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 10,
                                    background: iconBackground,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: iconColor,
                                    fontSize: 22,
                                    flexShrink: 0
                                }}>
                                    <MdOutlineAssignment />
                                </div>

                                <div style={{ flex: 1 }}>
                                    <Title level={5} style={{ margin: 0, lineHeight: 1.2, fontSize: '18px' }}>
                                        {a.title}
                                    </Title>

                                    {a.type === 'TEST' && (moduleNames.length > 0 || umlTypeName) && (
                                        <Space size={[0, 8]} wrap style={{ marginBottom: 8, marginTop: 4 }}>
                                            {umlTypeName && (
                                                <Tag color={umlTagColor}>
                                                    {t("classDetail.umlType") || "UML Type"}: {umlTypeName}
                                                </Tag>
                                            )}

                                            {moduleNames.map((name, index) => (
                                                <Tag key={index} color={umlTagColor}>
                                                    {t("classDetail.module") || "Module"}: {name}
                                                </Tag>
                                            ))}
                                        </Space>
                                    )}
                                    {a.type !== 'TEST' && (moduleNames.length > 0 || umlTypeName) && (
                                        <Space size={[0, 8]} wrap style={{ marginBottom: 8, marginTop: 4 }}>
                                            {moduleNames.map((name, index) => (
                                                <Tag key={index} color={umlTagColor}>
                                                    {t("classDetail.module") || "Module"}: {name}
                                                </Tag>
                                            ))}
                                        </Space>
                                    )}

                                    <Space size={16}>
                                        {/* Hiển thị loại bài tập */}
                                        <Text type="secondary" style={{ fontWeight: 600, color: typeTextColor }}> {/* SỬ DỤNG MÀU CHUẨN */}
                                            [{a.type === 'TEST' ? t("classDetail.type.test") || "KIỂM TRA" : t("classDetail.type.assignment") || "LUYỆN TẬP"}]
                                        </Text>

                                        {/* Ngày tháng */}
                                        <Text type="secondary" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: '13px' }}>
                                            <IoCalendarOutline style={{ color: '#595959' }} />
                                            {a.startDate && a.endDate
                                                ? `${dayjs(a.startDate).format("DD/MM/YYYY")} → ${dayjs(a.endDate).format("DD/MM/YYYY")}`
                                                : t("classDetail.assignment.noDeadline") || "No Deadline"}
                                        </Text>
                                    </Space>
                                </div>
                            </div>
                        </Col>
                        <Col
                            xs={24}
                            sm={3}
                            style={{
                                textAlign: "center",
                                display: "flex",
                                flexDirection: "row",
                                justifyContent: "flex-end",
                                alignItems: "center",
                                gap: 12,
                            }}
                        >
                            {/* Icon Xem thông tin bài tập (Chi tiết) - Luôn hiển thị */}
                            <Tooltip title={t("classDetail.view.assignmentInfo") || "Xem thông tin bài tập"}>
                                <span
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleViewAssignmentDetails(a);
                                    }}
                                    style={{
                                        cursor: "pointer",
                                        fontSize: "20px",
                                        color: "#1677ff",
                                        backgroundColor: "rgba(22, 119, 255, 0.1)",
                                        padding: "8px",
                                        borderRadius: "50%",
                                        display: "flex",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        transition: "all 0.25s ease",
                                    }}
                                >
                                    <MdOutlineAssignment />
                                </span>
                            </Tooltip>

                            {/* Icon Xem danh sách bài nộp - CHỈ HIỂN THỊ KHI LÀ TEST */}
                            {a.type === 'TEST' && (
                                <Tooltip title={t("classDetail.view.submissionDetails") || "Xem chi tiết bài nộp"}>
                                    <span
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            goToAssignmentDetails(a.id);
                                        }}
                                        style={{
                                            cursor: "pointer",
                                            fontSize: "20px",
                                            color: "#1890ff",
                                            backgroundColor: "rgba(24, 144, 255, 0.1)",
                                            padding: "8px",
                                            borderRadius: "50%",
                                            display: "flex",
                                            justifyContent: "center",
                                            alignItems: "center",
                                            transition: "all 0.25s ease",
                                        }}
                                    >
                                        <IoFileTrayFull />
                                    </span>
                                </Tooltip>
                            )}
                        </Col>
                    </Row>
                </Card>
            </List.Item>
        );
    };

    const tabItems: TabsProps['items'] = [
        {
            key: 'test',
            label: t("classDetail.tabs.test") || `Bài Tập Kiểm Tra (${assignments.filter(a => a.type === 'TEST').length})`,
            children: (
                <List
                    itemLayout="vertical"
                    dataSource={filteredAssignments}
                    renderItem={renderAssignmentItem}
                    locale={{emptyText: t("common.noTests") || "Chưa có bài tập kiểm tra nào."}}
                />
            ),
        },
        {
            key: 'assignment',
            label: t("classDetail.tabs.assignment") || `Bài Tập Luyện Tập (${assignments.filter(a => a.type === 'ASSIGNMENT').length})`,
            children: (
                <List
                    itemLayout="vertical"
                    dataSource={filteredAssignments}
                    renderItem={renderAssignmentItem}
                    locale={{emptyText: t("common.noAssignments") || "Chưa có bài tập luyện tập nào."}}
                />
            ),
        },
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <div>
                        <Title level={3} style={{ margin: 0 }}>
                            {t("classDetail.tabs.classwork") || "Classwork"}
                        </Title>
                    </div>

                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <Space>
                            <Select
                                value={`${sortBy}_${sortOrder}`}
                                onChange={onSortChange}
                                style={{ minWidth: 180 }}
                            >
                                <Option value="createdDate_desc">
                                    {t("classDetail.sort.newest") || "Newest"}
                                </Option>
                                <Option value="createdDate_asc">
                                    {t("classDetail.sort.oldest") || "Oldest"}
                                </Option>
                                <Option value="title_asc">
                                    {t("classDetail.sort.titleAsc") || "Title A→Z"}
                                </Option>
                                <Option value="title_desc">
                                    {t("classDetail.sort.titleDesc") || "Title Z→A"}
                                </Option>
                            </Select>

                            <Tooltip title={t("classDetail.view.list") || "List"}>
                                <Button
                                    type={view === "list" ? "primary" : "default"}
                                    icon={<UnorderedListOutlined />}
                                    onClick={() => onToggleView("list")}
                                />
                            </Tooltip>

                            <Tooltip title={t("classDetail.view.grid") || "Grid"}>
                                <Button
                                    type={view === "grid" ? "primary" : "default"}
                                    icon={<AppstoreOutlined />}
                                    onClick={() => onToggleView("grid")}
                                />
                            </Tooltip>

                            <Dropdown menu={{ items: menuItems }} placement="bottomRight" trigger={["click"]}>
                                <Button type="primary">
                                    {t("classDetail.assignment.create") || "Create/Assign"} <DownOutlined />
                                </Button>
                            </Dropdown>
                        </Space>
                    </div>
                </div>

                <Tabs
                    defaultActiveKey="assignment"
                    activeKey={activeTab}
                    items={tabItems}
                    onChange={(key) => {
                        setActiveTab(key);
                        setPage(1);
                    }}
                    style={{ marginBottom: 16 }}
                />

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
                                `${t("common.all") || "Tổng"} ${total} ${total > 1 ? t("common.items") || "mục" : t("common.item") || "mục"}`
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
            </main>
        </div>
    );
};

export default AssignmentTab;