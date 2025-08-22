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
    List,
    Pagination,
    Row,
    Select,
    Space,
    Tooltip,
    Typography
} from "antd";
import {IoCalendarOutline} from "react-icons/io5";
import {MdOutlineAssignment} from "react-icons/md";
import {AppstoreOutlined, UnorderedListOutlined} from "@ant-design/icons";
import {useNavigate} from "react-router-dom";

// Import SCSS file
import "./AssignmentTabUser.scss";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface AssignmentTabProps {
    classId: number;
}

const DEFAULT_PAGE_SIZE = 9;

const AssignmentTabUser: React.FC<AssignmentTabProps> = ({ classId }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [assignments, setAssignments] = useState<IAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [page, setPage] = useState<number>(1);
    const [size, setSize] = useState<number>(DEFAULT_PAGE_SIZE);
    const [total, setTotal] = useState<number>(0);
    const [view, setView] = useState<"grid" | "list">("grid");
    const [sortBy, setSortBy] = useState<string | undefined>("createdDate");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc" | undefined>("desc");

    const handleViewAssignmentDetails = useCallback(
        (rowData: IAssignment) => {
            navigate(`/class/${classId}/problem/${rowData.id}`);
        },
        [navigate, classId]
    );

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
            const formatted = (response.assignments || []).map((a) => ({
                ...a,
                createdDate: a.createdDate ? dayjs(a.createdDate).toISOString() : ""
            }));
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
    }, [fetchData]);

    const gridColumns = useMemo(() => {
        if (view === "list") return 1;
        return 3;
    }, [view]);

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

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <Spinner animation="border" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 text-red-600 bg-red-100 border border-red-300 rounded-md">
                {error}
            </div>
        );
    }

    return (
        <div className="assignment-tab-container">
            {/* Sidebar */}
            <aside className="sidebar">
                <Card className="mb-4">
                    <Title level={5} style={{ marginBottom: 4, color: "#aaa" }}>
                        {t("classDetail.classCode") || "Class code"}
                    </Title>
                    <Text style={{ fontSize: "1.3rem", fontWeight: 700, color: "#1890ff" }}>
                        drbaoiun
                    </Text>
                </Card>

                <Card>
                    <Title level={5} style={{ marginBottom: 8, color: "#aaa" }}>
                        {t("classDetail.upcoming") || "Upcoming"}
                    </Title>
                    <Paragraph type="secondary" style={{ margin: 0, color: "#888" }}>
                        {t("classDetail.noUpcomingWork") || "No upcoming work"}
                    </Paragraph>
                </Card>
            </aside>

            {/* Main */}
            <main className="main-content">
                {/* Header controls */}
                <div className="header-controls">
                    <Title level={3} style={{ margin: 0, color: "#fff" }}>
                        {t("classDetail.tabs.classwork") || "Classwork"}
                    </Title>

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
                    </Space>
                </div>

                {/* List / Grid */}
                {view === "list" ? (
                    <List
                        itemLayout="vertical"
                        dataSource={assignments}
                        renderItem={(a) => (
                            <List.Item key={a.id}>
                                <Card
                                    style={{ marginBottom: "16px" }}
                                    hoverable
                                    className="assignment-card"
                                >
                                    <Row gutter={[16, 16]} align="middle">
                                        <Col xs={24} sm={18}>
                                            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                                                <div className="assignment-icon">
                                                    <MdOutlineAssignment />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <Title level={5} className="assignment-title">
                                                        {a.title}
                                                    </Title>
                                                    <Text className="assignment-date">
                                                        <IoCalendarOutline />{" "}
                                                        {a.createdDate
                                                            ? dayjs(a.createdDate).format("DD/MM/YYYY HH:mm")
                                                            : "-"}
                                                    </Text>
                                                </div>
                                            </div>
                                        </Col>

                                        <Col xs={24} sm={6} style={{ textAlign: "right" }}>
                                            <Button
                                                type="primary"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleViewAssignmentDetails(a);
                                                }}
                                            >
                                                {t("classDetail.assignment.viewDetails") || "View"}
                                            </Button>
                                        </Col>
                                    </Row>
                                </Card>
                            </List.Item>
                        )}
                        locale={{ emptyText: t("common.noData") || "No assignments" }}
                    />
                ) : (
                    <List
                        grid={{ gutter: 16, column: gridColumns }}
                        dataSource={assignments}
                        locale={{ emptyText: t("common.noData") || "No assignments" }}
                        renderItem={(a) => (
                            <List.Item key={a.id}>
                                <Card
                                    hoverable
                                    className="assignment-card"
                                    onClick={() => handleViewAssignmentDetails(a)}
                                >
                                    <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "12px" }}>
                                        <div className="assignment-icon" style={{ width: "36px", height: "36px", fontSize: "1.25rem" }}>
                                            <MdOutlineAssignment />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <Title level={5} className="assignment-title">
                                                {a.title}
                                            </Title>
                                            <Text className="assignment-date">
                                                <IoCalendarOutline />{" "}
                                                {a.createdDate
                                                    ? dayjs(a.createdDate).format("DD/MM/YYYY")
                                                    : "-"}
                                            </Text>
                                        </div>
                                    </div>
                                    <Button
                                        size="small"
                                        type="primary"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleViewAssignmentDetails(a);
                                        }}
                                    >
                                        {t("classDetail.assignment.viewDetails") || "View"}
                                    </Button>
                                </Card>
                            </List.Item>
                        )}
                    />
                )}

                {/* Pagination */}
                <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end" }}>
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
            </main>
        </div>
    );
};

export default AssignmentTabUser;