import React, {useCallback, useEffect, useMemo, useState} from "react";
import {useTranslation} from "react-i18next";
import {Spinner} from "react-bootstrap";
import {
    getAssignmentsByClassId,
    type GetAssignmentsOptions,
    type IAssignment
} from "../../../../../shared/services/assignmentService.ts";
import dayjs from "dayjs";
import {Button, Card, List, Pagination, Tabs, type TabsProps, Tag, Typography, Empty} from "antd";
import {IoCalendarOutline} from "react-icons/io5";
import {MdOutlineAssignment} from "react-icons/md";
import {useNavigate} from "react-router-dom";
import "./AssignmentTabUser.scss";

const { Title, Text } = Typography;

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
    originalId: number;
    type: AssignmentType;
    startDate: string | null;
    endDate: string | null;
    classInfoId: number;
    assignmentClassId: number;
    assignmentClassDetailResponseList: AssignedModule[];
}

interface ProcessedAssignmentItem {
    key: string;
    assignmentId: number;
    assignmentClassDetailId: number;
    assignmentClassId: number;
    assignmentTitle: string;
    assignmentCode: string;
    startDate: string | null;
    endDate: string | null;
    isModuleTest: boolean;
    displayModuleId: number;
    displayModuleName: string;
    displayTypeUmls: string[];
}

const DEFAULT_PAGE_SIZE = 5;

const AssignmentTabUser: React.FC<AssignmentTabProps> = ({ classId }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [assignments, setAssignments] = useState<IAssignmentExtended[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [page, setPage] = useState<number>(1);
    const [size, setSize] = useState<number>(DEFAULT_PAGE_SIZE);
    const [total, setTotal] = useState<number>(0);
    const [view] = useState<"grid" | "list">("list");

    const [sortBy] = useState<string | undefined>("createdDate");
    const [sortOrder] = useState<"asc" | "desc" | undefined>("desc");

    const [activeTab, setActiveTab] = useState<string>('test');

    const handleViewAssignmentDetails = useCallback(
        (rowData: ProcessedAssignmentItem) => {
            const mode = rowData.isModuleTest ? 'test' : 'practice';
            const idToUse = rowData.isModuleTest
                ? rowData.assignmentClassDetailId
                : rowData.assignmentClassId;

            const url = `/class/${classId}/problem/${idToUse}`;

            let queryParams = `?mode=${mode}`;
            queryParams += `&assignmentClassId=${rowData.assignmentClassDetailId}`;

            navigate(url + queryParams);
        },
        [navigate, classId]
    );


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
            // console.log("Fetched assignments:", response);

            const finalAssignments: IAssignmentExtended[] = [];

            (response.assignments || []).forEach((a: any) => {
                const modules: AssignedModule[] = (a.assignmentClassDetailResponseList || []).map((m: any) => ({
                    ...m,
                    assignmentClassDetailId: m.assignmentClassDetailId || 0,
                }));

                const hasTestModules = modules.some((m: any) => m.checkedTest === true);
                const assignmentType: AssignmentType = hasTestModules ? "TEST" : "ASSIGNMENT";

                const allDates = modules
                    .map((m: any) => ({ start: m.startDate, end: m.endDate }))
                    .filter((d: any) => d.start || d.end);

                let displayStartDate: string | null = null;
                let displayEndDate: string | null = null;

                if (allDates.length > 0) {
                    const validStartDates = allDates.map((d: any) => d.start).filter(Boolean).map((d: string) => dayjs(d).valueOf());
                    const validEndDates = allDates.map((d: any) => d.end).filter(Boolean).map((d: string) => dayjs(d).valueOf());

                    if (validStartDates.length > 0) {
                        displayStartDate = dayjs(Math.min(...validStartDates)).toISOString();
                    }
                    if (validEndDates.length > 0) {
                        displayEndDate = dayjs(Math.max(...validEndDates)).toISOString();
                    }
                }

                finalAssignments.push({
                    ...a,
                    id: String(a.assignmentId),
                    originalId: a.assignmentId,
                    classInfoId: classId,
                    type: assignmentType,
                    createdDate: a.createdDate ? dayjs(a.createdDate).toISOString() : "",
                    startDate: displayStartDate,
                    endDate: displayEndDate,
                    assignmentClassId: a.assignmentClassId,
                    assignmentClassDetailResponseList: modules, // Sử dụng tên trường đã sửa
                } as IAssignmentExtended);
            });

            setAssignments(finalAssignments);

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

    const applySortingAndPagination = useCallback((
        data: ProcessedAssignmentItem[],
        sortField: string | undefined,
        sortOrder: "asc" | "desc" | undefined,
        page: number,
        size: number,
        setTotal: (total: number) => void
    ) => {
        // ... (Giữ nguyên logic sắp xếp và phân trang)
        const sorted = [...data].sort((a, b) => {
            let valA: any, valB: any;
            let comparison = 0;

            if (sortField === "endDate") {
                valA = a.endDate ? dayjs(a.endDate).valueOf() : (sortOrder === "asc" ? Infinity : -Infinity);
                valB = b.endDate ? dayjs(b.endDate).valueOf() : (sortOrder === "asc" ? Infinity : -Infinity);
                comparison = valA - valB;
            }
            else if (sortField === "startDate") {
                valA = a.startDate ? dayjs(a.startDate).valueOf() : (sortOrder === "asc" ? Infinity : -Infinity);
                valB = b.startDate ? dayjs(b.startDate).valueOf() : (sortOrder === "asc" ? Infinity : -Infinity);
                comparison = valA - valB;
            }
            else {
                valA = a.assignmentTitle?.toLowerCase() || "";
                valB = b.assignmentTitle?.toLowerCase() || "";

                if (valA < valB) comparison = -1;
                else if (valA > valB) comparison = 1;
                else comparison = 0;
            }

            return sortOrder === "asc" ? comparison : -comparison;
        });

        setTotal(sorted.length);

        const startIndex = (page - 1) * size;
        const endIndex = startIndex + size;

        return sorted.slice(startIndex, endIndex);

    }, []); // Đã bỏ page, size khỏi dependencies vì chúng được truyền vào


    const processedAssignments = useMemo(() => {
        const isFilteringTest = activeTab === 'test';

        if (isFilteringTest) {
            const flattened: ProcessedAssignmentItem[] = assignments.flatMap(a => {
                const relevantModules = a.assignmentClassDetailResponseList
                    .filter(m => m.checkedTest === true);

                return relevantModules.flatMap(m => {
                    const baseItem: ProcessedAssignmentItem = {
                        key: '',
                        assignmentId: a.originalId,
                        assignmentClassDetailId: m.assignmentClassDetailId,
                        assignmentClassId: a.assignmentClassId,
                        assignmentTitle: a.assignmentTitle,
                        assignmentCode: a.assignmentCode,
                        startDate: m.startDate,
                        endDate: m.endDate,
                        isModuleTest: true,
                        displayModuleId: m.moduleId,
                        displayModuleName: m.moduleName,
                        displayTypeUmls: [],
                    };

                    return m.typeUmls.map((typeUml, typeIndex) => ({
                        ...baseItem,
                        key: `${a.id}-${m.moduleId}-${typeUml}-${typeIndex}`,
                        displayTypeUmls: [typeUml],
                    }));
                });
            });
            // Áp dụng sắp xếp và phân trang, setTotal được gọi bên trong
            return applySortingAndPagination(flattened, sortBy, sortOrder, page, size, setTotal);

        } else {
            const assignmentMap = new Map<number, ProcessedAssignmentItem>();

            assignments.forEach(a => {
                const practiceModules = a.assignmentClassDetailResponseList.filter(m => m.checkedTest === false);

                if (practiceModules.length > 0) {
                    const allPracticeUmls = Array.from(new Set(practiceModules.flatMap(m => m.typeUmls)));

                    let displayStartDate: string | null = null;
                    let displayEndDate: string | null = null;

                    const allDates = practiceModules
                        .map(m => ({ start: m.startDate, end: m.endDate }))
                        .filter(d => d.start || d.end);

                    if (allDates.length > 0) {
                        const validStartDates = allDates.map(d => d.start).filter(Boolean).map(d => dayjs(d!).valueOf());
                        const validEndDates = allDates.map(d => d.end).filter(Boolean).map(d => dayjs(d!).valueOf());

                        if (validStartDates.length > 0) {
                            displayStartDate = dayjs(Math.min(...validStartDates)).toISOString();
                        }
                        if (validEndDates.length > 0) {
                            displayEndDate = dayjs(Math.max(...validEndDates)).toISOString();
                        }
                    }

                    const firstModule = practiceModules[0];
                    const detailId = firstModule.assignmentClassDetailId;

                    const practiceItem: ProcessedAssignmentItem = {
                        key: `${a.id}-practice-group`,
                        assignmentId: a.originalId,
                        assignmentTitle: a.assignmentTitle,
                        assignmentCode: a.assignmentCode,
                        assignmentClassId: a.assignmentClassId,
                        assignmentClassDetailId: detailId,
                        startDate: displayStartDate,
                        endDate: displayEndDate,
                        isModuleTest: false,
                        displayModuleId: a.originalId,
                        displayModuleName: a.assignmentTitle,
                        displayTypeUmls: allPracticeUmls,
                    };

                    assignmentMap.set(a.originalId, practiceItem);
                }
            });

            const flattened = Array.from(assignmentMap.values());
            // Áp dụng sắp xếp và phân trang, setTotal được gọi bên trong
            return applySortingAndPagination(flattened, sortBy, sortOrder, page, size, setTotal);
        }

    }, [assignments, activeTab, page, size, sortBy, sortOrder, applySortingAndPagination]);


    const onChangePage = (p: number, pageSize?: number) => {
        setPage(p);
        if (pageSize && pageSize !== size) {
            setSize(pageSize);
            setPage(1);
        }
    };

    const renderAssignmentCard = (item: ProcessedAssignmentItem, isListView: boolean) => {
        // ... (Giữ nguyên hàm renderAssignmentCard)
        const isTest = item.isModuleTest;
        const hasNoDeadline = !item.startDate && !item.endDate;

        const statusClass = 'status-default';

        const cardClassName = `assignment-card ${isTest ? 'is-test' : 'is-practice'} ${statusClass} ${isListView ? 'is-list-view' : 'is-grid-view'}`;
        const buttonText = isTest ? (t("classDetail.assignment.submit") || "Nộp bài") : (t("classDetail.assignment.practice") || "Luyện tập");


        const cardContent = (
            <div className="card-content-wrapper">
                <div className={`status-bar-strip ${statusClass}`} />

                <div className="card-header">
                    <div className="assignment-icon">
                        <MdOutlineAssignment />
                    </div>
                    <div className="assignment-info">
                        <Title level={5} className="assignment-title">
                            {item.assignmentTitle}
                        </Title>
                        <Text className="assignment-type-tag" type="secondary">
                            {isTest ? (
                                `[Module - ${item.displayModuleName}]`
                            ) : (
                                `[${t("classDetail.type.assignment") || "LUYỆN TẬP"}]`
                            )}
                        </Text>
                    </div>
                </div>

                <div className="card-body">
                    <div className="uml-info">
                        {item.isModuleTest && (
                            <div className="uml-tags">
                                {item.displayTypeUmls.map((name, index) => (
                                    <Tag key={`${item.key}-uml-${name}-${index}`} className="uml-tag">
                                        {name}
                                    </Tag>
                                ))}
                            </div>
                        )}

                        <div className="assignment-dates-list">
                            <Text type="secondary" className="date-item date-range">
                                <IoCalendarOutline />
                                <span className="date-range-value">
                                    {hasNoDeadline ? (
                                        t("classDetail.assignment.noDeadline") || "Không có deadline"
                                    ) : (
                                        <>
                                            {item.startDate ? dayjs(item.startDate).format("DD/MM/YYYY") : '—'}
                                            {' → '}
                                            {item.endDate ? dayjs(item.endDate).format("DD/MM/YYYY") : '—'}
                                        </>
                                    )}
                                </span>
                            </Text>
                        </div>
                    </div>
                </div>

                <div className="card-footer">
                    <Button
                        className="action-button"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleViewAssignmentDetails(item);
                        }}
                    >
                        {buttonText}
                    </Button>
                </div>
            </div>
        );

        return (
            <List.Item key={item.key} className={view === 'list' ? 'full-width' : ''}>
                <Card hoverable className={cardClassName}>
                    {cardContent}
                </Card>
            </List.Item>
        );
    };

    const renderTabContent = (items: ProcessedAssignmentItem[], isTestTab: boolean) => {
        if (items.length === 0 && !loading) {
            const descriptionText = isTestTab
                ? t("assignmentPage.noAssignments") || "Chưa có bài tập kiểm tra nào được giao."
                : t("assignmentPage.noAssignments") || "Chưa có bài tập luyện tập nào được giao."

            return (
                <div style={{ padding: '50px 0' }}>
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                            <Text style={{color: '#aaa',}}>
                                {descriptionText}
                            </Text>
                        }
                    />
                </div>
            );
        }

        return (
            <List
                grid={view === 'grid' ? { gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 3, xxl: 4 } : undefined}
                dataSource={items}
                renderItem={(a) => renderAssignmentCard(a, view === 'list')}
                // Đã loại bỏ locale={{ emptyText: ... }} vì chúng ta dùng component Empty ở ngoài
            />
        );
    };

    // Tính toán tổng số lượng bài tập kiểm tra và luyện tập TỪ DỮ LIỆU GỐC (chưa phân trang/lọc)
    const testCount = assignments.flatMap(a => a.assignmentClassDetailResponseList.filter(m => m.checkedTest)).flatMap(m => m.typeUmls).length;
    const assignmentCount = assignments.flatMap(a => a.assignmentClassDetailResponseList.filter(m => !m.checkedTest)).length;

    const tabItems: TabsProps['items'] = [
        {
            key: 'test',
            label: t("classDetail.tabs.test") || `Bài Tập Kiểm Tra (${testCount})`,
            children: renderTabContent(processedAssignments, true),
        },
        {
            key: 'assignment',
            label: t("classDetail.tabs.assignment") || `Bài Tập Luyện Tập (${assignmentCount})`,
            children: renderTabContent(processedAssignments, false),
        },
    ];

    if (loading) {
        return (
            <div style={{ padding: "2rem", display: "flex", justifyContent: "center", alignItems: "center", gap: '8px' }}>
                <Spinner animation="border" />
                <Text style={{ color: 'white' }}>
                    {t('common.loading') || 'Đang tải bài tập...'}
                </Text>
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

    const showPagination = processedAssignments.length > 0;

    return (
        <div className="assignment-tab-container">
            <main className="assignment-content">


                <Tabs
                    activeKey={activeTab}
                    items={tabItems}
                    onChange={(key) => {
                        setActiveTab(key);
                        setPage(1);
                    }}
                    className="assignment-tabs"
                />

                {/* Chỉ hiển thị Pagination nếu có dữ liệu */}
                {showPagination && (
                    <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end" }}>
                        <Pagination
                            current={page}
                            pageSize={size}
                            total={total}
                            showSizeChanger
                            pageSizeOptions={["5", "10", "15", "20"]}
                            onChange={onChangePage}
                            onShowSizeChange={onChangePage}
                            showTotal={(total) =>
                                `${t("common.total") || "Tổng"} ${total} ${total > 1 ? t("common.items") || "mục" : t("common.item") || "mục"}`
                            }
                        />
                    </div>
                )}
            </main>
        </div>
    );
};

export default AssignmentTabUser;