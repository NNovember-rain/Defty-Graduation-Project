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
import {IoCalendarOutline, IoFileTrayFull, IoTimeOutline, IoCheckmarkCircleOutline} from "react-icons/io5";
import {MdOutlineAssignment, MdAssignmentTurnedIn} from "react-icons/md";
import {AppstoreOutlined, DownOutlined, UnorderedListOutlined} from "@ant-design/icons";
import {useNavigate} from "react-router-dom";
import AssignAssignmentModal from "./AssignAssignmentModal.tsx";
import AssignAssignmentModalTest from "./AssignAssignmentModalTest.tsx";

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs; // Đảm bảo Tabs có TabPane

interface AssignmentTabProps {
    classId: number;
}

type AssignmentType = "ASSIGNMENT" | "TEST";

interface AssignedModule {
    moduleId: number;
    moduleName: string;
    checkedTest: boolean;
    typeUmls: string[];
    startDate: string | null;
    endDate: string | null;
}

interface IAssignmentExtended extends IAssignment {
    id: string;
    type: AssignmentType;
    startDate: string | null;
    endDate: string | null;
    classInfoId: number;

    assignedModules: AssignedModule[];
    assignedUmlType: { name: string; } | null;
}

interface ProcessedAssignmentItem {
    key: string;
    assignmentId: string;
    assignmentTitle: string;
    assignmentCode: string;
    startDate: string | null;
    endDate: string | null;
    type: AssignmentType;

    moduleName: string;
    typeUmls: string[];
    isModuleTest: boolean;
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
        (rowData: ProcessedAssignmentItem) => {
            const originalId = rowData.assignmentId.split('-')[0];
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

            const data = response.assignments || [];

            const mappedAssignments: IAssignmentExtended[] = data.map((a: any, index: number) => {
                const hasTestModules = (a.modules || []).some((m: any) => m.checkedTest === true);
                const assignmentType: AssignmentType = hasTestModules ? "TEST" : "ASSIGNMENT";

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
                    assignedModules: a.modules || [],
                    assignedUmlType: null,
                    createdDate: "",
                } as unknown as IAssignmentExtended;
            });

            setAssignments(mappedAssignments);
            setTotal(mappedAssignments.length);

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

    const processedAssignments = useMemo(() => {
        const isFilteringTest = activeTab === 'test';

        // 🚀 BƯỚC 1: LÀM PHẲNG (FLATTEN) ASSIGNMENTS THÀNH CÁC ITEM CẤP MODULE
        const flattened = assignments.flatMap(a => {
            const relevantModules = a.assignedModules
                .filter(m => m.checkedTest === isFilteringTest); // Lọc theo tab hiện tại

            return relevantModules.map((m, mIndex) => {
                // Key cần là duy nhất: AssignmentID + ModuleID + Index (để phân biệt Type UML đã tách)
                return {
                    key: `${a.id}-${m.moduleId}-${mIndex}`,
                    assignmentId: a.id,
                    assignmentTitle: a.title,
                    assignmentCode: a.assignmentCode,
                    // Lấy startDate/endDate từ Module (m)
                    startDate: m.startDate,
                    endDate: m.endDate,
                    type: a.type,
                    moduleName: m.moduleName,
                    typeUmls: m.typeUmls,
                    isModuleTest: m.checkedTest,
                } as ProcessedAssignmentItem;
            });
        });

        let filtered = flattened;

        // 🚀 BƯỚC 2: SẮP XẾP DỮ LIỆU ĐÃ LÀM PHẲNG
        if (sortBy) {
            filtered.sort((a, b) => {
                // Sắp xếp theo ngày tạo (nếu có) hoặc tiêu đề
                let aVal: any;
                let bVal: any;

                // Mặc định, sắp xếp theo title vì ngày tạo không có trong ProcessedItem
                aVal = a.assignmentTitle ?? "";
                bVal = b.assignmentTitle ?? "";

                if (sortBy === 'createdDate') {
                    // Nếu cần sắp xếp theo ngày, bạn cần truyền createdDate vào ProcessedAssignmentItem hoặc sắp xếp Assignment trước.
                    // Hiện tại, ta sắp xếp theo tiêu đề
                    aVal = a.assignmentTitle ?? "";
                    bVal = b.assignmentTitle ?? "";
                }


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


    const renderAssignmentItem = (item: ProcessedAssignmentItem) => {
        // Thiết lập màu sắc dựa trên loại bài tập (isModuleTest)
        const isTest = item.isModuleTest;
        const primaryColor = isTest ? '#fa541c' : '#52c41a'; // Cam cho Test, Xanh lá cho Luyện tập
        const secondaryColor = isTest ? '#fff1f0' : '#f6ffed';
        const icon = isTest ? <IoTimeOutline /> : <MdAssignmentTurnedIn />;
        const typeText = isTest ? (t("classDetail.type.test") || "KIỂM TRA") : (t("classDetail.type.assignment") || "LUYỆN TẬP");

        const keyPrefix = item.key;

        return (
            <List.Item key={item.key} style={{ padding: 0 }}>
                <Card
                    hoverable
                    style={{
                        borderRadius: 12,
                        marginBottom: 16,
                        borderLeft: `5px solid ${primaryColor}`, // Thanh màu bên trái
                        boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                        transition: 'all 0.3s ease',
                    }}
                    bodyStyle={{ padding: '16px' }}
                >
                    <Row gutter={[16, 16]} align="top">
                        <Col xs={24} sm={24} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>

                            {/* Icon chính */}
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
                                {/* Tên Bài tập & Mã */}
                                <Text type="secondary" style={{ fontSize: '12px', display: 'block', color: '#8c8c8c' }}>
                                    {t("classDetail.assignment.code") || "Mã BT"}: {item.assignmentCode}
                                </Text>
                                <Title level={5} style={{ margin: '0 0 4px 0', lineHeight: 1.2, fontSize: '16px', color: '#262626' }}>
                                    {item.assignmentTitle}
                                </Title>

                                {/* Module & Type UML */}
                                <Space size={[8, 4]} wrap style={{ marginBottom: 8 }}>

                                    {/* Tag Module Name */}
                                    <Tag key={`${keyPrefix}-module-main`} color="blue" style={{ fontWeight: 500 }}>
                                        {t("classDetail.module") || "Module"}: {item.moduleName}
                                    </Tag>

                                    {/* Tag Type UMLs */}
                                    {item.typeUmls.map((name, index) => (
                                        <Tag key={`${keyPrefix}-uml-${name}-${index}`} color="geekblue" style={{ fontWeight: 500 }}>
                                            {name}
                                        </Tag>
                                    ))}

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
                                paddingTop: '10px'
                            }}
                        >

                            <Tooltip title={t("classDetail.view.assignmentInfo") || "Xem thông tin bài tập"}>
                                <Button
                                    icon={<MdOutlineAssignment />}
                                    type="text"
                                    shape="circle"
                                    style={{ color: '#1890ff' }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleViewAssignmentDetails(item);
                                    }}
                                />
                            </Tooltip>

                            {item.isModuleTest && (
                                <Tooltip title={t("classDetail.view.submissionDetails") || "Xem chi tiết bài nộp"}>
                                    <Button
                                        icon={<IoFileTrayFull />}
                                        type="text"
                                        shape="circle"
                                        style={{ color: primaryColor }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            goToAssignmentDetails(item.assignmentId);
                                        }}
                                    />
                                </Tooltip>
                            )}
                        </Col>
                    </Row>
                </Card>
            </List.Item>
        );
    };

    const countAssignments = (isTest: boolean) => {
        return assignments.flatMap(a =>
            a.assignedModules.filter(m => m.checkedTest === isTest)
        ).length;
    };

    const tabItems: TabsProps['items'] = [
        {
            key: 'test',
            label: t("classDetail.tabs.test") || `Bài Tập Kiểm Tra (${countAssignments(true)})`,
            children: (
                <List
                    itemLayout="vertical"
                    dataSource={processedAssignments}
                    renderItem={renderAssignmentItem}
                    locale={{emptyText: t("common.noTests") || "Chưa có bài tập kiểm tra nào."}}
                />
            ),
        },
        {
            key: 'assignment',
            label: t("classDetail.tabs.assignment") || `Bài Tập Luyện Tập (${countAssignments(false)})`,
            children: (
                <List
                    itemLayout="vertical"
                    dataSource={processedAssignments}
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