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

const { Title, Text } = Typography;
const { Option } = Select;



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
    assignmentClassDetailId: number;
}

interface IAssignmentExtended extends IAssignment {
    id: string;
    type: AssignmentType;
    startDate: string | null;
    endDate: string | null;
    classInfoId: number;

    assignedModules: AssignedModule[];
    assignedUmlType: { name: string; } | null;
    createdDate: string;
}

interface ProcessedAssignmentItem {
    key: string;
    assignmentId: string;
    assignmentTitle: string;
    assignmentCode: string;
    startDate: string | null;
    endDate: string | null;
    type: AssignmentType;
    assignmentClassDetailId: number; // 🔥 SỬA: Đảm bảo có ID chi tiết
    moduleName: string;
    typeUmls: string[];
    isModuleTest: boolean;
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

    const [activeTab, setActiveTab] = useState<string>('test'); // Đổi mặc định sang Luyện tập

    const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
    const [selectedModule, setSelectedModule] = useState<string | null>(null);
    const [selectedUmlType, setSelectedUmlType] = useState<string | null>(null);

    const [uniqueModules, setUniqueModules] = useState<string[]>([]);
    const [uniqueUmlTypes, setUniqueUmlTypes] = useState<string[]>([]);
    const [uniqueAssignments, setUniqueAssignments] = useState<{ id: string; title: string }[]>([]);


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
            };

            const response = await getAssignmentsByClassId(classId, options);
            console.log("Fetched assignments:", response);

            const data = response.assignments || [];

            const mappedAssignments: IAssignmentExtended[] = data.map((a: any, index: number) => {
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
                    // 🔥 Mapped assignedModules phải đảm bảo có assignmentClassDetailId
                    assignedModules: (a.assignmentClassDetailResponseList || []).map((m: any) => ({
                        ...m,
                        assignmentClassDetailId: m.assignmentClassDetailId,
                    })) as AssignedModule[],
                    assignedUmlType: null,
                    createdDate: a.createdDate || dayjs().toISOString(),
                } as unknown as IAssignmentExtended;
            });

            setAssignments(mappedAssignments);
            collectUniqueFilters(mappedAssignments);

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
        const isFilteringTest = activeTab === 'test';
        let flattened: ProcessedAssignmentItem[] = assignments.flatMap(a => {
            if (selectedAssignmentId && a.id !== selectedAssignmentId) {
                return [];
            }

            const relevantModules = a.assignedModules
                .filter(m => m.checkedTest === isFilteringTest);

            return relevantModules.map((m, mIndex) => {
                return {
                    key: `${a.id}-${m.moduleId}-${mIndex}`,
                    assignmentId: a.id,
                    assignmentTitle: a.title,
                    assignmentCode: a.assignmentCode,
                    startDate: m.startDate,
                    endDate: m.endDate,
                    type: a.type,
                    assignmentClassDetailId: m.assignmentClassDetailId, // 🔥 CẬP NHẬT: Lấy ID chi tiết
                    moduleName: m.moduleName,
                    typeUmls: m.typeUmls,
                    isModuleTest: m.checkedTest,
                    createdDate: a.createdDate
                } as ProcessedAssignmentItem;
            });
        });


        // 2. LỌC THEO TIÊU CHÍ (Filter Module & UML Type)
        let filtered = flattened.filter(item => {
            const matchesModule = selectedModule === null || selectedModule === '' ||
                item.moduleName === selectedModule;

            const matchesUmlType = selectedUmlType === null || selectedUmlType === '' ||
                item.typeUmls.includes(selectedUmlType);

            return matchesModule && matchesUmlType;
        });


        // 3. SẮP XẾP (Sort)
        if (sortBy) {
            filtered.sort((a, b) => {
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

        setTotal(filtered.length);

        const startIndex = (page - 1) * size;
        const endIndex = startIndex + size;

        if (startIndex >= filtered.length && filtered.length > 0) {
            setPage(1);
            return filtered.slice(0, size);
        }

        return filtered.slice(startIndex, endIndex);

    }, [assignments, activeTab, page, size, sortBy, sortOrder, selectedAssignmentId, selectedModule, selectedUmlType]);


    const menuItems: MenuProps["items"] = [
        {
            key: "assign",
            label: t("classDetail.assignment.assignAssignment") || "Assign Assignment (Luyện tập)",
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

    // Đã loại bỏ onToggleView vì nó không được sử dụng trong giao diện mới

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

    const handleUnassign = async (assignmentClassDetailId: number) => {
        try {
            message.loading({ content: t('common.unassigning') || 'Đang hủy giao...', key: 'unassign' });
            await unassignAssignment(assignmentClassDetailId);
            message.success({ content: t('common.unassignSuccess') || 'Hủy giao bài tập thành công!', key: 'unassign', duration: 2 });
            await new Promise(resolve => setTimeout(resolve, 1000));
            fetchData();
        } catch (error) {
            console.error("Unassign failed:", error);
            message.error({ content: t('common.unassignFailed') || "Xoá thất bại!", key: 'unassign', duration: 3 });
        }
    };


    const renderAssignmentItem = (item: ProcessedAssignmentItem) => {
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
                                paddingTop: '8px'
                            }}
                        >

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

                            {item.isModuleTest && (
                                <Tooltip title={t("classDetail.view.submissionDetails") || "Xem chi tiết bài nộp"}>
                                    <Button
                                        icon={<IoFileTrayFull />}
                                        type="text"
                                        shape="circle"
                                        style={{ color: primaryColor, fontSize: '18px' }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            goToAssignmentDetails(item.assignmentId);
                                        }}
                                    />
                                </Tooltip>
                            )}
                            <Popconfirm
                                title={t('common.confirm') || "Bạn có chắc chắn muốn hủy giao bài tập này?"}
                                onConfirm={() => handleUnassign(item.assignmentClassDetailId)}
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

    const countAssignments = (isTest: boolean) => {
        const assignmentsToCount = selectedAssignmentId
            ? assignments.filter(a => a.id === selectedAssignmentId)
            : assignments;

        return assignmentsToCount.flatMap(a =>
            a.assignedModules.filter(m => m.checkedTest === isTest)
        ).length;
    };

    const renderEmptyContent = (isTest: boolean) => {
        const descriptionText = isTest
            ? t("common.noData") || "Chưa có bài tập kiểm tra nào được giao."
            : t("common.noData") || "Chưa có bài tập luyện tập nào được giao.";

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
            label: t("classDetail.tabs.test") || `Bài Tập Kiểm Tra (${countAssignments(true)})`,
            children: (
                <List
                    itemLayout="vertical"
                    dataSource={processedAssignments}
                    renderItem={renderAssignmentItem}
                    locale={{ emptyText: renderEmptyContent(true) }}
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
                    locale={{ emptyText: renderEmptyContent(false) }}
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

                <Row justify="space-between" align="middle" gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    <Col xs={24} sm={24} md={4} lg={3}>
                        <Title level={3} style={{ margin: 0 }}>
                            {t("classDetail.tabs.classwork") || "Classwork"}
                        </Title>
                    </Col>

                    {/* Cột Điều khiển: Chứa các Select và Nút Gán */}
                    <Col xs={24} sm={24} md={20} lg={21}>
                        <Space size={12} wrap style={{ width: '100%', justifyContent: 'flex-end' }}>

                            <Select
                                placeholder={t("classDetail.filter.assignmentTitle") || "Lọc theo Tên Bài tập"}
                                allowClear
                                showSearch
                                style={{ width: 280 }} // Thu nhỏ
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
                                style={{ width: 280 }} // Thu nhỏ
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
                                style={{ width: 150 }} // Thu nhỏ
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
            </main>
        </div>
    );
};

export default AssignmentTab;