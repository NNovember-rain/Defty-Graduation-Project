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
    Tooltip,
    Typography
} from "antd";
import {IoCalendarOutline, IoFileTrayFull} from "react-icons/io5";
import {MdOutlineAssignment} from "react-icons/md";
import {AppstoreOutlined, DownOutlined, UnorderedListOutlined} from "@ant-design/icons";
import {useNavigate} from "react-router-dom";
// Đảm bảo các modal này được import đúng
import AssignAssignmentModal from "./AssignAssignmentModal.tsx";
import AssignAssignmentModalTest from "./AssignAssignmentModalTest.tsx";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface AssignmentTabProps {
    classId: number;
}

const DEFAULT_PAGE_SIZE = 9;

const AssignmentTab: React.FC<AssignmentTabProps> = ({ classId }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [assignments, setAssignments] = useState<IAssignment[]>([]);
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

    const goToAssignmentDetails = (assignmentId: number) => {
        navigate(`/admin/class/${classId}/assignment/${assignmentId}/detail`);
    };

    const handleViewAssignmentDetails = useCallback(
        (rowData: IAssignment) => {
            navigate(`/admin/content/assignments/update/${rowData.id}`);
        },
        [navigate]
    );

    // Dropdown menu
    const menuItems: MenuProps["items"] = [
        {
            key: "create",
            label: t("classDetail.assignment.createNew") || "Create New",
            onClick: () => navigate(`/admin/content/assignments/create?classId=${classId}`)
        },
        {
            key: "assign",
            label: t("classDetail.assignment.assign") || "Assign Assignment",
            onClick: () => showAssignmentModal()
        },
        {
            key: "assignTest",
            label: t("classDetail.assignment.assignTest") || "Assign Test",
            onClick: () => showQuizAssignmentModal()
        }
    ];

    const showAssignmentModal = React.useCallback(() => {
        setIsAssignmentModalVisible(true);
    }, []);

    const showQuizAssignmentModal = React.useCallback(() => {
        setIsAssignmentModalVisibleTest(true);
    }, []);

    const hideAssignmentModal = () => {
        setIsAssignmentModalVisible(false);
        setIsAssignmentModalVisibleTest(false);
    };

    // Hàm fetch data đã được bao bọc trong useCallback
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const options: GetAssignmentsOptions = {
                page,
                limit: size,
                sortBy,
                sortOrder
            };

            const response = await getAssignmentsByClassId(classId, options);
            console.log("Fetched assignments:", response);

            const formatted = (response.assignments || []).map((a: IAssignment) => {
                const classInfos = a.assignmentClasses?.filter((ac: { classId: number }) => ac.classId === classId) || [];
                // const allAssignedModules = classInfos.flatMap(ci => ci.moduleResponses || []); // Comment out or remove if not used

                let classInfoForDates = classInfos.find(
                    (ci) => ci.startDate && ci.endDate
                ) || classInfos[0];
                if (classInfos.length === 0) {
                    classInfoForDates = null;
                }

                return {
                    ...a,
                    createdDate: a.createdDate ? dayjs(a.createdDate).toISOString() : "",
                    startDate: classInfoForDates?.startDate ? dayjs(classInfoForDates.startDate).toISOString() : null,
                    endDate: classInfoForDates?.endDate ? dayjs(classInfoForDates.endDate).toISOString() : null,
                    // modules: allAssignedModules, // Giữ nguyên modules nếu cần
                };
            });

            setAssignments(formatted);
            setTotal(response.total || 0);
        } catch (err) {
            console.error("Failed to fetch assignments:", err);
            setError(t("common.errorFetchingData") || "Lỗi khi lấy dữ liệu");
        } finally {
            setLoading(false);
        }
    }, [classId, page, size, sortBy, sortOrder, t]);

    useEffect(() => {
        fetchData();
    }, [fetchData]); // Dependencies là fetchData (useCallback)


    // Dropdown và logic hiển thị (Giữ nguyên)
    const gridColumns = useMemo(() => {
        if (view === "list") return 1;
        if (size <= 4) return 3;
        if (size <= 8) return 3;
        return 3;
    }, [view, size]);

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

    // --- HIỂN THỊ LOADING KHI FETCH DATA ---
    if (loading) {
        return (
            <div style={{ padding: "2rem", display: "flex", justifyContent: "center" }}>
                <Spinner animation="border" />
                <Text>{t('common.loading') || 'Đang tải...'}</Text>
            </div>
        );
    }
    // --- END LOADING FETCH DATA ---


    if (error) {
        return (
            <div
                style={{
                    padding: "1rem",
                    color: "#dc3545",
                    backgroundColor: "#f8d7da",
                    border: "1px solid #f5c6cb"
                }}
            >
                {error}
            </div>
        );
    }

    return (
        <div style={{ display: "flex", gap: "2rem", padding: "2rem", alignItems: "flex-start" }}>
            <aside
                style={{
                    width: 300,
                    flexShrink: 0,
                    position: "sticky",
                    top: 24,
                    alignSelf: "flex-start"
                }}
            >
                <Card
                    style={{
                        borderRadius: 12,
                        marginBottom: 16,
                        boxShadow: "0 6px 18px rgba(0,0,0,0.04)"
                    }}
                >
                    <Title level={5} style={{ marginBottom: 4 }}>
                        {t("classDetail.classCode") || "Class code"}
                    </Title>
                    <Text style={{ fontSize: "1.3rem", fontWeight: 700, color: "#1890ff" }}>
                        drbaoiun
                    </Text>
                </Card>

                <Card
                    style={{
                        borderRadius: 12,
                        boxShadow: "0 6px 18px rgba(0,0,0,0.04)"
                    }}
                >
                    <Title level={5} style={{ marginBottom: 8 }}>
                        {t("classDetail.upcoming") || "Upcoming"}
                    </Title>
                    <Paragraph type="secondary" style={{ margin: 0 }}>
                        {t("classDetail.noUpcomingWork") || "No upcoming work"}
                    </Paragraph>
                </Card>
            </aside>

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

                            {/* Dropdown Create / Assign */}
                            <Dropdown menu={{ items: menuItems }} placement="bottomRight" trigger={["click"]}>
                                <Button type="primary">
                                    {t("classDetail.assignment.create") || "Create Assignment"} <DownOutlined />
                                </Button>
                            </Dropdown>
                        </Space>
                    </div>
                </div>

                {/* List View - Đã chỉnh sửa để hiển thị Modules */}
                <List
                    itemLayout="vertical"
                    dataSource={assignments}
                    renderItem={(a) => (
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

                                            {/* Icon lớn bên trái (48x48) - Vẫn giữ để làm điểm nhấn */}
                                            <div style={{
                                                width: 48,
                                                height: 48,
                                                borderRadius: 10,
                                                background: "#fff7e6",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                color: "#fa8c16",
                                                fontSize: 22,
                                                flexShrink: 0
                                            }}>
                                                <MdOutlineAssignment />
                                            </div>

                                            <div style={{ flex: 1 }}>
                                                <Title level={5} style={{ margin: 0, lineHeight: 1.2, fontSize: '18px' }}>
                                                    {a.title}
                                                </Title>

                                                <Space size={16}>
                                                    <Text type="secondary" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: '13px' }}>
                                                        <IoCalendarOutline style={{ color: '#595959' }} />
                                                        {a.startDate && a.endDate
                                                            ? `${dayjs(a.startDate).format("DD/MM/YYYY")} → ${dayjs(a.endDate).format("DD/MM/YYYY")}`
                                                            : t("classDetail.assignment.noDeadline") || "No Deadline"}
                                                    </Text>

                                                    {a.modules && a.modules.length > 0 && (
                                                        <Tooltip title={t("classDetail.assignment.moduleRequired") || "Modules Required"}>
                                                            <span style={{
                                                                color: '#fa8c16',
                                                                fontSize: 16,
                                                                display: 'flex',
                                                                alignItems: 'center'
                                                            }}>
                                                            </span>
                                                        </Tooltip>
                                                    )}
                                                </Space>
                                            </div>
                                        </div>
                                    </Col>
                                    <Col
                                        xs={28}
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
                                        <Tooltip title="Xem thông tin bài tập">
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
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = "rgba(22, 119, 255, 0.2)";
                                                    e.currentTarget.style.color = "#0958d9";
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = "rgba(22, 119, 255, 0.1)";
                                                    e.currentTarget.style.color = "#1677ff";
                                                }}
                                            >
                                                <MdOutlineAssignment />
                                            </span>
                                        </Tooltip>

                                        {/* Icon xem danh sách bài nộp */}
                                        <Tooltip title="Xem chi tiết bài nộp">
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
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = "rgba(24, 144, 255, 0.2)";
                                                    e.currentTarget.style.color = "#0958d9";
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = "rgba(24, 144, 255, 0.1)";
                                                    e.currentTarget.style.color = "#1890ff";
                                                }}
                                            >
                                                <IoFileTrayFull />
                                            </span>
                                        </Tooltip>
                                    </Col>
                                </Row>
                            </Card>
                        </List.Item>
                    )}
                    locale={{emptyText: t("common.noData") || "No assignments"}}
                />


                {/* Pagination */}
                <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
                    <Pagination
                        current={page}
                        pageSize={size}
                        total={total}
                        showSizeChanger
                        pageSizeOptions={["6", "9", "12", "18"]}
                        onChange={onChangePage}
                        onShowSizeChange={onChangePage}
                        showTotal={(total) =>
                            `${total} ${total > 1 ? "items" : "item"}`
                        }
                    />
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