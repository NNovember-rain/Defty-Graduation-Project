import {Button, Col, DatePicker, Form, Input, message, Modal, Row, Spin, Table} from "antd";
import type {Key} from "react";
import React, {useCallback, useEffect, useState} from "react";
import type {ColumnsType} from "antd/es/table";
import {assignAssignment, getAssignments} from "../../../../../shared/services/assignmentService.ts";
import {useTranslation} from "react-i18next";
import {useParams} from "react-router-dom";

const {RangePicker} = DatePicker;

interface Module {
    id: number;
    moduleName: string;
    key?: number; // Thêm key cho Module để sử dụng trong Table con
}

interface Assignment {
    id: number;
    title: string;
    modules?: Module[];
    key?: string;
}

interface AssignAssignmentModalProps {
    visible: boolean;
    onClose: () => void;
    classIds: number[];
    onAssigned?: () => void;
}

interface ClassDetailParams {
    id: string;
}

const AssignAssignmentModal: React.FC<AssignAssignmentModalProps> = ({
                                                                         visible,
                                                                         onClose,
                                                                         classIds,
                                                                         onAssigned,
                                                                     }) => {
    const {t} = useTranslation();
    const [form] = Form.useForm();
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(false);
    const [assignLoading, setAssignLoading] = useState(false);
    const [totalItems, setTotalItems] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);
    const [selectedAssignments, setSelectedAssignments] = useState<number[]>([]);
    // THÊM: State quản lý các hàng (assignment) đang mở rộng
    const [expandedRowKeys, setExpandedRowKeys] = useState<Key[]>([]);
    const [selectedModules, setSelectedModules] = useState<Record<number, number[]>>({});
    const [messageApi, contextHolder] = message.useMessage();

    const columns: ColumnsType<Assignment> = [
        {title: t("Title"), dataIndex: "title", key: "title"},
    ];

    const moduleColumns: ColumnsType<Module> = [
        {title: t("Module Name"), dataIndex: "moduleName", key: "moduleName"},
    ];

    const { id } = useParams<ClassDetailParams>();

    const classId = Number(id);

    const fetchAssignmentsForModal = useCallback(async (page: number, limit: number) => {
        setLoading(true);
        try {
            const params = {page, limit, status: 1};
            const response = await getAssignments(params);
            const assignmentData = Array.isArray(response)
                ? response
                : response.assignments || [];
            const total = response.total || assignmentData.length;
            const dataWithKeys = assignmentData.map((item: any) => ({
                ...item,
                key: item.id,
                modules: item.modules?.map((mod: Module) => ({
                    ...mod,
                    key: mod.id
                })) || []
            }));

            setAssignments(dataWithKeys);
            setTotalItems(total);
        } catch (error) {
            console.error("Failed to load assignments:", error);
            messageApi.error(t("apiMessages.loadAssignmentsFailed"));
        } finally {
            setLoading(false);
        }
    }, [messageApi, t]);

    useEffect(() => {
        if (visible) {
            fetchAssignmentsForModal(currentPage, pageSize);
            setSelectedAssignments([]);
            setSelectedModules({});
            setExpandedRowKeys([]); // Reset expanded rows
            form.resetFields();
        }
    }, [visible, currentPage, pageSize, fetchAssignmentsForModal, form]);

    const handleAssign = async () => {
        try {
            const values = await form.validateFields();
            setAssignLoading(true);

            const dateRange = values.dateRange || [];
            const startDate = dateRange[0]?.toISOString() || null;
            const endDate = dateRange[1]?.toISOString() || null;
            const checkedTest = values.checkedTest || false;

            if (selectedAssignments.length === 0) {
                messageApi.warning(t("validation.selectAssignmentRequired") || "Vui lòng chọn ít nhất một Bài tập để giao.");
                setAssignLoading(false);
                return;
            }

            // Logic BẮT BUỘC chọn Module cho các Assignment đã chọn
            for (const assignmentId of selectedAssignments) {
                const moduleIds = selectedModules[assignmentId];
                if (!moduleIds || moduleIds.length === 0) {
                    const assignment = assignments.find(a => a.id === assignmentId);
                    const assignmentTitle = assignment ? assignment.title : assignmentId;

                    messageApi.warning(
                        t("validation.moduleSelectionRequired") || `Bài tập "${assignmentTitle}" phải có ít nhất một Module được chọn.`
                    );
                    setAssignLoading(false);
                    return;
                }
            }


            const assignmentsPayload = selectedAssignments.map((assignmentId) => {
                const moduleIds = selectedModules[assignmentId] || [];
                return {
                    assignmentId,
                    modules: moduleIds.map((id) => ({moduleId: id})),
                    startDate,
                    endDate,
                    checkedTest,
                };
            });

            const payload = {
                classIds,
                assignments: assignmentsPayload,
            };

            console.log("Sending payload:", payload);
            await assignAssignment(payload);

            messageApi.success(t("apiMessages.assignSuccess"));
            onAssigned?.();
            onClose();
        } catch (error) {
            console.error(error);
            if (error && (error as any).errorFields) {
            } else {
                messageApi.error(t("Failed to assign assignment"));
            }
        } finally {
            setAssignLoading(false);
        }
    };

    const expandedRowRender = (record: Assignment) => {
        const modulesWithKeys: Module[] = record.modules || []; // Đã gán key trong fetchAssignmentsForModal

        const selectedModuleIds = selectedModules[record.id] || [];

        return (
            <Table
                columns={moduleColumns}
                dataSource={modulesWithKeys}
                pagination={false}
                rowKey={(record) => record.id.toString()}
                rowSelection={{
                    selectedRowKeys: selectedModuleIds,
                    onChange: (selectedKeys) => {
                        setSelectedModules((prev) => ({
                            ...prev,
                            [record.id]: selectedKeys as number[],
                        }));
                    },
                }}
                size="small"
                style={{margin: "10px 0", backgroundColor: "#fafafa"}}
            />
        );
    };

    const rowSelection = {
        selectedRowKeys: selectedAssignments,
        onChange: (selectedKeys: Key[], selectedRows: Assignment[]) => {
            setSelectedAssignments(selectedKeys as number[]);

            // THAY ĐỔI: Mở rộng/thu gọn hàng ngay khi chọn/bỏ chọn
            setExpandedRowKeys(selectedKeys);

            // Khởi tạo selectedModules cho Assignment mới được chọn nếu chưa có
            selectedKeys.forEach((key) => {
                const assignmentId = key as number;
                if (!selectedModules[assignmentId]) {
                    setSelectedModules(prev => ({
                        ...prev,
                        [assignmentId]: []
                    }));
                }
            });

            // Xóa state modules của các assignment vừa bị bỏ chọn
            const deselectedKeys = selectedAssignments.filter(id => !selectedKeys.includes(id));
            if (deselectedKeys.length > 0) {
                setSelectedModules(prev => {
                    const newState = {...prev};
                    deselectedKeys.forEach(id => delete newState[id]);
                    return newState;
                });
            }
        },
    };

    const handleTableChange = (pagination: any) => {
        setCurrentPage(pagination.current);
        setPageSize(pagination.pageSize);
    };

    return (
        <>
            {contextHolder}
            <Modal
                title={t("Assign Assignment")}
                open={visible}
                onCancel={onClose}
                footer={[
                    <Button key="close" onClick={onClose}>
                        {t("Close")}
                    </Button>,
                    <Button
                        key="assign"
                        type="primary"
                        onClick={handleAssign}
                        disabled={selectedAssignments.length === 0}
                        loading={assignLoading}
                    >
                        {t("Assign")}
                    </Button>,
                ]}
                width={800}
            >
                <Spin spinning={assignLoading} tip={t("Assigning...")}>
                    <Form form={form} layout="vertical">
                        <Row gutter={12} style={{marginBottom: 16}}>
                            <Col span={12}>
                                <Input.Search
                                    placeholder={t("Search assignments...")}
                                    allowClear
                                    enterButton={t("Search")}
                                    size="middle"
                                    onSearch={(value) => console.log(value)}
                                />
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="dateRange"
                                    rules={[
                                        () => ({
                                            validator(_, value) {
                                                if (!value || value.length < 2) return Promise.resolve();
                                                const [start, end] = value;
                                                // Chỉ kiểm tra khi cả hai ngày đều có giá trị
                                                if (start && end && end.isAfter(start, 'day')) return Promise.resolve();

                                                // Nếu người dùng chọn cùng 1 ngày, vẫn cho phép
                                                if (start && end && end.isSame(start, 'day')) return Promise.resolve();

                                                return Promise.reject(
                                                    new Error(t("End date must be after or same as start date!"))
                                                );
                                            },
                                        }),
                                    ]}
                                >
                                    <RangePicker
                                        style={{width: "100%"}}
                                        format="YYYY-MM-DD"
                                        placeholder={[t("Start Date"), t("End Date")]}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Form>

                    <Spin spinning={loading} tip={t("Loading assignments...")}>
                        <Table
                            dataSource={assignments}
                            columns={columns}
                            rowKey={(record) => record.id}
                            pagination={{
                                current: currentPage,
                                pageSize,
                                total: totalItems,
                                showSizeChanger: true,
                                pageSizeOptions: ["5", "10", "20", "50"],
                            }}
                            rowSelection={rowSelection}
                            onChange={handleTableChange}
                            expandedRowRender={expandedRowRender}
                            // THÊM: Sử dụng state expandedRowKeys để mở rộng hàng
                            expandedRowKeys={expandedRowKeys}
                            onExpand={(expanded, record) => {
                                // Ngăn không cho thu gọn nếu Assignment đang được chọn
                                if (selectedAssignments.includes(record.id)) {
                                    // Nếu đang chọn và cố gắng thu gọn, giữ nguyên
                                    if (!expanded) return;
                                }

                                // Cập nhật expandedRowKeys
                                setExpandedRowKeys(prev =>
                                    expanded
                                        ? [...prev, record.id]
                                        : prev.filter(key => key !== record.id)
                                );
                            }}
                        />
                    </Spin>
                </Spin>
            </Modal>
        </>
    );
};

export default AssignAssignmentModal;