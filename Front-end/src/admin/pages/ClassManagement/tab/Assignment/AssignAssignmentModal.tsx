import {Button, Col, DatePicker, Form, Input, message, Modal, Row, Spin, Table} from "antd";
import React, {useCallback, useEffect, useState} from "react";
import type {ColumnsType} from "antd/es/table";
import {assignAssignment, getAssignments} from "../../../../../shared/services/assignmentService.ts";
import {useTranslation} from "react-i18next";

const {RangePicker} = DatePicker;

interface Assignment {
    id: number;
    title: string;
    typeUmlName?: string;
    startDate?: string | null;
    endDate?: string | null;
}

interface AssignAssignmentModalProps {
    visible: boolean,
    onClose: () => void,
    classIds: number[],
    onAssigned?: () => void,
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
    const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [messageApi, contextHolder] = message.useMessage();

    const columns: ColumnsType<Assignment> = [
        {title: "Title", dataIndex: "title", key: "title"},
        {title: "Type", dataIndex: "typeUmlName", key: "typeUmlName", render: (text) => text || "-"},
    ];

    const fetchAssignmentsForModal = useCallback(async (page: number, limit: number) => {
        setLoading(true);
        try {
            const params = {page, limit, status: 1};
            const response = await getAssignments(params);
            const assignmentData = Array.isArray(response) ? response : (response.assignments || []);
            const total = response.total || assignmentData.length;
            setAssignments(assignmentData);
            setTotalItems(total);
        } catch (error) {
            console.error('Failed to load assignments:', error);
            messageApi.error('Failed to load assignments');
        } finally {
            setLoading(false);
        }
    }, [messageApi]);

    useEffect(() => {
        if (visible) {
            fetchAssignmentsForModal(currentPage, pageSize);
            setSelectedRowKeys([]);
            form.resetFields();
        }
    }, [visible, currentPage, pageSize, searchTerm, fetchAssignmentsForModal, form]);

    const handleAssign = async () => {
        try {
            const values = await form.validateFields();
            setAssignLoading(true);

            const dateRange = values.dateRange || [];
            const startDate = dateRange.length > 0 ? dateRange[0].toISOString() : null;
            const endDate = dateRange.length > 1 ? dateRange[1].toISOString() : null;

            await assignAssignment({
                assignmentIds: selectedRowKeys as number[],
                classIds,
                startDate,
                endDate,
            });

            messageApi.success(t('apiMessages.assignSuccess'));
            onAssigned?.();
            onClose();
        } catch (error) {
            console.error(error);
            messageApi.error("Failed to assign assignment");
        } finally {
            setAssignLoading(false);
        }
    };

    const onSearch = (value: string) => {
        setSearchTerm(value);
        setCurrentPage(1);
    };

    const onSelectChange = (selectedKeys: React.Key[]) => {
        setSelectedRowKeys(selectedKeys as number[]);
    };

    const rowSelection = {
        selectedRowKeys,
        onChange: onSelectChange,
    };

    const handleTableChange = (pagination: any) => {
        setCurrentPage(pagination.current);
        setPageSize(pagination.pageSize);
    };

    return (
        <>
            {contextHolder}
            <Modal
                title="Assign Assignment"
                open={visible}
                onCancel={onClose}
                footer={[
                    <Button key="close" onClick={onClose}>Close</Button>,
                    <Button
                        key="assign"
                        type="primary"
                        onClick={handleAssign}
                        disabled={selectedRowKeys.length === 0}
                        loading={assignLoading}
                    >
                        Assign
                    </Button>
                ]}
                width={700}
            >
                <Spin spinning={assignLoading} tip="Assigning..."> {}
                    <Form form={form} layout="vertical">
                        <Row gutter={12} style={{marginBottom: 16}}>
                            <Col span={12}>
                                <Input.Search
                                    placeholder="Search assignments..."
                                    allowClear
                                    enterButton="Search"
                                    size="middle"
                                    onSearch={onSearch}
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
                                                if (end.isAfter(start)) return Promise.resolve();
                                                return Promise.reject(new Error('End date must be after start date!'));
                                            }
                                        })
                                    ]}
                                >
                                    <RangePicker
                                        style={{width: '100%'}}
                                        format="YYYY-MM-DD"
                                        placeholder={['Start Date', 'End Date']}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Form>

                    <Spin spinning={loading} tip="Loading assignments...">
                        <Table
                            dataSource={assignments}
                            columns={columns}
                            rowKey="id"
                            pagination={{
                                current: currentPage,
                                pageSize,
                                total: totalItems,
                                showSizeChanger: true,
                                pageSizeOptions: ['5', '10', '20', '50'],
                            }}
                            rowSelection={rowSelection}
                            onChange={handleTableChange}
                        />
                    </Spin>
                </Spin>
            </Modal>
        </>
    );
};

export default AssignAssignmentModal;
