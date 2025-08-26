import React, {useCallback, useEffect, useMemo, useState} from "react";
import {useTranslation} from "react-i18next";
import {Spinner} from "react-bootstrap";
import {
    getAssignmentsByClassId,
    type GetAssignmentsOptions,
    type IAssignment
} from "../../../../../shared/services/assignmentService.ts";
import dayjs from "dayjs";
import {Button, Card, Col, List, Pagination, Row, Select, Space, Tooltip, Typography} from "antd";
import {IoCalendarOutline} from "react-icons/io5";
import {MdOutlineAssignment} from "react-icons/md";
import {AppstoreOutlined, UnorderedListOutlined} from "@ant-design/icons";
import {useNavigate} from "react-router-dom";

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

    const handleViewAssignmentDetails = useCallback((rowData: IAssignment) => {
        navigate(`/admin/content/assignments/update/${rowData.id}`);
    }, [navigate]);

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
            const formatted = (response.assignments || []).map((a) => {
                const classInfo = a.assignmentClasses?.find((ac: { classId: number; }) => ac.classId === classId);
                return {
                    ...a,
                    createdDate: a.createdDate ? dayjs(a.createdDate).toISOString() : "",
                    startDate: classInfo?.startDate ? dayjs(classInfo.startDate).toISOString() : null,
                    endDate: classInfo?.endDate ? dayjs(classInfo.endDate).toISOString() : null
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
    }, [fetchData]);

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

    if (loading) {
        return (
            <div style={{ padding: "2rem", display: "flex", justifyContent: "center" }}>
                <Spinner animation="border" />
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
                        </Space>
                    </div>
                </div>

                {view === "list" ? (
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
                                        <Col xs={24} sm={18}>
                                            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                                                <div style={{
                                                    width: 56,
                                                    height: 56,
                                                    borderRadius: 10,
                                                    background: "#fff7e6",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    color: "#fa8c16",
                                                    fontSize: 24
                                                }}>
                                                    <MdOutlineAssignment />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <Title level={5} style={{ margin: 0 }}>{a.title}</Title>
                                                    <Text type="secondary" style={{ display: "block"}}>
                                                        {a.typeUmlName || t("common.noType") || "No UML type"}
                                                    </Text>
                                                    <Text type="secondary" className="assignment-date" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                                        <IoCalendarOutline />
                                                        {a.startDate && a.endDate
                                                            ? `${dayjs(a.startDate).format("DD/MM/YYYY")} → ${dayjs(a.endDate).format("DD/MM/YYYY")}`
                                                            : "-"}
                                                    </Text>
                                                </div>
                                            </div>
                                        </Col>

                                        <Col xs={24} sm={6} style={{ textAlign: "right" }}>
                                            <Button color="primary" variant="filled" onClick={(e) => {
                                                e.stopPropagation();
                                                handleViewAssignmentDetails(a);
                                            }}>
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
                                    style={{
                                        borderRadius: 12,
                                        transition: "transform .12s ease, box-shadow .12s ease",
                                        height: "100%",
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "space-between"
                                    }}
                                    onClick={() => console.log("Open assignment", a.id)}
                                >
                                    <div>
                                        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
                                            <div style={{
                                                width: 44,
                                                height: 44,
                                                borderRadius: 10,
                                                background: "#fff7e6",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                color: "#fa8c16",
                                                fontSize: 20
                                            }}>
                                                <MdOutlineAssignment />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <Title level={5} style={{ margin: 0, lineHeight: 1.1 }}>{a.title}</Title>
                                                <Text type="secondary" style={{ display: "block"}}>
                                                    {a.typeUmlName || t("common.noType") || "No UML type"}
                                                </Text>
                                                <Text type="secondary" className="assignment-date" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                                    <IoCalendarOutline />
                                                    {a.startDate && a.endDate
                                                        ? `${dayjs(a.startDate).format("DD/MM/YYYY")} → ${dayjs(a.endDate).format("DD/MM/YYYY")}`
                                                        : "-"}
                                                </Text>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ marginTop: 8 }}>
                                        <Space style={{ width: "100%", justifyContent: "space-between" }}>
                                            <Button size="small" color="primary" variant="filled"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleViewAssignmentDetails(a);
                                                    }}>
                                                {t("classDetail.assignment.viewDetails") || "View"}
                                            </Button>
                                        </Space>
                                    </div>
                                </Card>
                            </List.Item>
                        )}
                    />
                )}

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
            </main>
        </div>
    );
};

export default AssignmentTab;
