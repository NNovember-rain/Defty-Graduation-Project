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
    Typography,
    Tabs, // Thêm Tabs
    type TabsProps
} from "antd";
import {IoCalendarOutline} from "react-icons/io5";
import {MdOutlineAssignment} from "react-icons/md";
import {AppstoreOutlined, UnorderedListOutlined} from "@ant-design/icons";
import {useNavigate} from "react-router-dom";
// import SubmissionModal from "./SubmissionModal"; // Bỏ Modal
import "./AssignmentTabUser.scss";

const { Title, Text } = Typography;
const { Option } = Select;

interface AssignmentTabProps {
    classId: number;
}

type AssignmentType = "ASSIGNMENT" | "TEST";

// Cập nhật interface để làm phẳng và chứa thông tin loại bài tập
interface IAssignmentExtended extends IAssignment {
    id: string; // ID làm phẳng (assignmentId-classInfoId)
    originalId: number; // ID gốc của bài tập
    type: AssignmentType;
    startDate: string | null;
    endDate: string | null;
    classInfoId: number;
}


const DEFAULT_PAGE_SIZE = 9;

const AssignmentTabUser: React.FC<AssignmentTabProps> = ({ classId }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [assignments, setAssignments] = useState<IAssignmentExtended[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [page, setPage] = useState<number>(1);
    const [size, setSize] = useState<number>(DEFAULT_PAGE_SIZE);
    const [total, setTotal] = useState<number>(0);
    const [view, setView] = useState<"grid" | "list">("grid");
    const [sortBy, setSortBy] = useState<string | undefined>("createdDate");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc" | undefined>("desc");

    // Giữ nguyên activeTab
    const [activeTab, setActiveTab] = useState<string>('test');

    // BỎ CÁC STATE CỦA MODAL SUBMISSION
    // const [submissionModalVisible, setSubmissionModalVisible] = useState(false);
    // const [selectedAssignment, setSelectedAssignment] = useState<IAssignmentExtended | null>(null);

    // --- KHÔI PHỤC LOGIC GỐC handleViewAssignmentDetails ---
    const handleViewAssignmentDetails = useCallback(
        (rowData: IAssignmentExtended) => {
            // Xác định mode dựa trên type của bài tập
            const mode = rowData.type === 'TEST' ? 'test' : 'practice';
            // Sử dụng originalId và mode cho navigation
            const url = `/class/${classId}/problem/${rowData.originalId}`;
            navigate(url + `?mode=${mode}`);
        },
        [navigate, classId]
    );

    // BỎ CÁC HÀM CỦA MODAL SUBMISSION
    // const handleOpenSubmissionModal = useCallback((assignment: IAssignmentExtended) => {
    //     setSelectedAssignment(assignment);
    //     setSubmissionModalVisible(true);
    // }, []);

    // const handleCloseSubmissionModal = useCallback(() => {
    //     setSubmissionModalVisible(false);
    //     setSelectedAssignment(null);
    // }, []);
    // --- KẾT THÚC KHÔI PHỤC ---

    // Logic fetchData làm phẳng dữ liệu (giữ nguyên)
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
                    const isTest = classInfo.checkedTest === true;
                    const assignmentType: AssignmentType = isTest ? "TEST" : "ASSIGNMENT";

                    const startDate = classInfo.startDate ? dayjs(classInfo.startDate).toISOString() : null;
                    const endDate = classInfo.endDate ? dayjs(classInfo.endDate).toISOString() : null;

                    const uniqueId = `${a.id}-${classInfo.id}`;

                    combinedAssignments.push({
                        ...a,
                        id: uniqueId,
                        originalId: a.id, // Lưu ID gốc
                        classInfoId: classInfo.id,
                        type: assignmentType,
                        createdDate: a.createdDate ? dayjs(a.createdDate).toISOString() : "",
                        startDate: startDate,
                        endDate: endDate,
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

    // Logic phân loại và phân trang client-side (giữ nguyên)
    const filteredAssignments = useMemo(() => {
        let filtered = assignments;

        if (activeTab === 'assignment') {
            filtered = assignments.filter(a => a.type === "ASSIGNMENT");
        } else if (activeTab === 'test') {
            filtered = assignments.filter(a => a.type === "TEST");
        }

        const sorted = [...filtered].sort((a, b) => {
            let valA: any, valB: any;

            switch (sortBy) {
                case "startDate":
                case "endDate":
                case "createdDate":
                    valA = a[sortBy as keyof IAssignmentExtended] ? new Date(a[sortBy as keyof IAssignmentExtended] as string).getTime() : 0;
                    valB = b[sortBy as keyof IAssignmentExtended] ? new Date(b[sortBy as keyof IAssignmentExtended] as string).getTime() : 0;
                    break;
                case "title":
                default:
                    valA = a.title?.toLowerCase() || "";
                    valB = b.title?.toLowerCase() || "";
                    break;
            }

            if (valA < valB) return sortOrder === "asc" ? -1 : 1;
            if (valA > valB) return sortOrder === "asc" ? 1 : -1;
            return 0;
        });

        setTotal(sorted.length);

        const startIndex = (page - 1) * size;
        const endIndex = startIndex + size;

        return sorted.slice(startIndex, endIndex);

    }, [assignments, activeTab, page, size, sortBy, sortOrder]);


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

    // --- SỬA ĐỔI renderAssignmentCard ĐỂ ĐẢM BẢO NÚT BẤM CHÍNH XÁC ---
    const renderAssignmentCard = (a: IAssignmentExtended, isListView: boolean) => {
        const isTest = a.type === 'TEST';
        const titleLevel = isListView ? 5 : 5;
        const buttonSize = isListView ? undefined : 'small';

        const cardContent = (
            <>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "12px" }}>
                    <div className="assignment-icon" style={{ width: "36px", height: "36px", fontSize: "1.25rem" }}>
                        <MdOutlineAssignment />
                    </div>
                    <div style={{ flex: 1 }}>
                        <Title level={titleLevel} className="assignment-title" style={{ margin: 0 }}>
                            {a.title}
                        </Title>
                        <Text type="secondary" style={{ display: "block", color: "#aaa", fontSize: isListView ? 'inherit' : '0.85rem' }}>
                            [{isTest ? t("classDetail.type.test") || "KIỂM TRA" : t("classDetail.type.assignment") || "LUYỆN TẬP"}]
                        </Text>
                        <Text className="assignment-date" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: isListView ? 'inherit' : '0.85rem' }}>
                            <IoCalendarOutline />
                            {a.startDate && a.endDate
                                ? `${dayjs(a.startDate).format("DD/MM/YYYY")} → ${dayjs(a.endDate).format("DD/MM/YYYY")}`
                                : t("classDetail.assignment.noDeadline") || "No deadline"}
                        </Text>
                    </div>
                </div>

                <Space size={isListView ? 'middle' : 'small'}>
                    {/* NÚT HÀNH ĐỘNG 1: LUYỆN TẬP (Chỉ hiển thị ở tab Luyện tập) */}
                    {!isTest && (
                        <Button
                            size={buttonSize}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleViewAssignmentDetails(a); // Mode practice được xử lý trong handleViewAssignmentDetails
                            }}
                        >
                            {t("classDetail.assignment.practice") || "Luyện tập"}
                        </Button>
                    )}

                    {/* NÚT HÀNH ĐỘNG 2: TEST (Chỉ hiển thị ở tab Kiểm tra) */}
                    {isTest && (
                        <Button
                            size={buttonSize}
                            type="primary"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleViewAssignmentDetails(a); // Gọi hàm chuyển hướng, hàm này đã tự động thêm ?mode=test
                            }}
                        >
                            {t("classDetail.assignment.submit") || "Test"}
                        </Button>
                    )}
                </Space>
            </>
        );

        if (isListView) {
            return (
                <List.Item key={a.id}>
                    <Card style={{ marginBottom: "16px" }} hoverable className="assignment-card">
                        <Row gutter={[16, 16]} align="middle">
                            <Col xs={24} sm={24}>
                                {cardContent}
                            </Col>
                        </Row>
                    </Card>
                </List.Item>
            );
        }

        return (
            <List.Item key={a.id}>
                <Card hoverable className="assignment-card">
                    {cardContent}
                </Card>
            </List.Item>
        );
    };
    // --- KẾT THÚC SỬA ĐỔI renderAssignmentCard ---

    // Cấu hình Tabs (giữ nguyên)
    const tabItems: TabsProps['items'] = [
        {
            key: 'test',
            label: t("classDetail.tabs.test") || `Bài Tập Kiểm Tra (${assignments.filter(a => a.type === 'TEST').length})`,
            children: (
                <List
                    grid={{ gutter: 16, column: gridColumns }}
                    dataSource={filteredAssignments}
                    locale={{ emptyText: t("common.noData") || "No assignments" }}
                    renderItem={(a) => renderAssignmentCard(a, view === 'list')}
                />
            ),
        },
        {
            key: 'assignment',
            label: t("classDetail.tabs.assignment") || `Bài Tập Luyện Tập (${assignments.filter(a => a.type === 'ASSIGNMENT').length})`,
            children: (
                <List
                    grid={{ gutter: 16, column: gridColumns }}
                    dataSource={filteredAssignments}
                    locale={{ emptyText: t("common.noData") || "No assignments" }}
                    renderItem={(a) => renderAssignmentCard(a, view === 'list')}
                />
            ),
        },
    ];

    if (loading) {
        return (
            <div style={{ padding: '1rem', display: 'flex', justifyContent: 'center' }}>
                <Spinner animation="border" />
                <span style={{ marginLeft: '0.5rem' }}>
                    {t('assignmentForm.assignmentLoading')}
                </span>
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
            <main className="assignment-content">
                {/* Header controls (giữ nguyên) */}
                <div className="header-controls">
                    <Title level={3} style={{ margin: 0, color: "#fff" }}>
                        {t("classDetail.tabs.classwork") || "Classwork"}
                    </Title>

                    <Space>
                        <Select
                            value={`${sortBy}_${sortOrder}`}
                            onChange={onSortChange}
                            style={{ minWidth: 200 }}
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
                            <Option value="startDate_asc">
                                {t("assignmentPage.sort.startSoonest") || "Start date ↑"}
                            </Option>
                            <Option value="startDate_desc">
                                {t("assignmentPage.sort.startLatest") || "Start date ↓"}
                            </Option>
                            <Option value="endDate_asc">
                                {t("assignmentPage.sort.endSoonest") || "End date ↑"}
                            </Option>
                            <Option value="endDate_desc">
                                {t("assignmentPage.sort.endLatest") || "End date ↓"}
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

                {/* Tabs */}
                <Tabs
                    activeKey={activeTab}
                    items={tabItems}
                    onChange={(key) => {
                        setActiveTab(key);
                        setPage(1); // Reset page khi đổi tab
                    }}
                    className="assignment-tabs"
                />

                {/* Pagination (giữ nguyên) */}
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

            {/* BỎ MODAL SUBMISSION */}
            {/* {selectedAssignment && (
                <SubmissionModal
                    visible={submissionModalVisible}
                    onCancel={handleCloseSubmissionModal}
                    assignment={selectedAssignment}
                    classId={classId}
                />
            )} */}
        </div>
    );
};

export default AssignmentTabUser;