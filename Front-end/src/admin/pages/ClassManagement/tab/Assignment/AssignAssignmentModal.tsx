import {Button, Col, DatePicker, Form, Input, message, Modal, Row, Spin, Table} from "antd";
import type {Key} from "react";
import React, {useCallback, useEffect, useState} from "react";
import type {ColumnsType} from "antd/es/table";
import {assignAssignment, getAssignments} from "../../../../../shared/services/assignmentService.ts";
import {useTranslation} from "react-i18next";

const {RangePicker} = DatePicker;

interface Module {
    id: number;
    moduleName: string;
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
    const [selectedModules, setSelectedModules] = useState<Record<number, number[]>>({});
    const [messageApi, contextHolder] = message.useMessage();

    const columns: ColumnsType<Assignment> = [
        {title: t("Title"), dataIndex: "title", key: "title"},
    ];

    const moduleColumns: ColumnsType<Module> = [
        {title: t("Module Name"), dataIndex: "moduleName", key: "moduleName"},
    ];

    // Fetch danh sách bài tập
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
                key: `assignment_${item.id}`,
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
        const modulesWithKeys: Module[] = record.modules?.map((mod) => ({
            ...mod,
            key: mod.id,
        })) || [];

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
        onChange: (selectedKeys: Key[]) => {
            setSelectedAssignments(selectedKeys as number[]);
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
                                                if (start && end && end.isAfter(start)) return Promise.resolve();
                                                return Promise.reject(
                                                    new Error(t("End date must be after start date!"))
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
                        />
                    </Spin>
                </Spin>
            </Modal>
        </>
    );
};

export default AssignAssignmentModal;
