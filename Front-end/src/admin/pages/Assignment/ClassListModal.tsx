import React, {useCallback, useEffect, useState} from 'react';
import {Button, Col, DatePicker, Form, Input, message, Modal, Row, Spin, Table} from 'antd';
import {getClasses, type IClass} from "../../../shared/services/classManagementService.ts";
import {assignAssignment} from "../../../shared/services/assignmentService.ts";
import {useTranslation} from "react-i18next";

const { RangePicker } = DatePicker;

interface ClassListModalProps {
    visible: boolean;
    onClose: () => void;
    assignmentIds: number[];
    onAssigned?: () => void;
}

const ClassListModal: React.FC<ClassListModalProps> = ({ visible, onClose, assignmentIds, onAssigned }) => {
    const { t } = useTranslation();
    const [form] = Form.useForm();
    const [messageApi, contextHolder] = message.useMessage();

    const [classes, setClasses] = useState<IClass[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [totalItems, setTotalItems] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

    const fetchClasses = useCallback(async (page: number, limit: number) => {
        setLoading(true);
        try {
            const params = { page, limit, status: 1 };
            const response = await getClasses(params);
            const classesData = Array.isArray(response) ? response : (response.content || []);
            const total = response.totalElements || classesData.length;
            setClasses(classesData);
            setTotalItems(total);
        } catch (error) {
            console.error('Failed to load classes:', error);
            message.error('Failed to load classes');
        } finally {
            setLoading(false);
        }
    }, []);


    useEffect(() => {
        if (visible) {
            fetchClasses(currentPage, pageSize);
            setSelectedRowKeys([]);
            form.resetFields();
        }
    }, [visible, currentPage, pageSize, searchTerm, fetchClasses, form]);

    const handleAssign = async () => {
        try {
            const values = await form.validateFields();
            await assignAssignment({
                classIds: selectedRowKeys as number[],
                assignmentIds,
                startDate: values.dateRange[0].toISOString(),
                endDate: values.dateRange[1].toISOString(),
            });

            messageApi.success(t('apiMessages.assignSuccess'));
            onAssigned?.();
            onClose();
        } catch (error) {
            console.error(error);
            message.error("Failed to assign assignment");
        }
    };

    const columns = [
        {
            title: 'STT',
            key: 'stt',
            render: (_: any, __: any, index: number) => (currentPage - 1) * pageSize + index + 1,
        },
        {
            title: 'Class Name',
            dataIndex: 'name',
            key: 'name',
        },
    ];

    const onSearch = (value: string) => {
        setSearchTerm(value);
        setCurrentPage(1);
    };

    const onSelectChange = (selectedKeys: React.Key[]) => {
        setSelectedRowKeys(selectedKeys);
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
                title={t('assignment.classList')}
                open={visible}
                onCancel={onClose}
                footer={[
                    <Button key="close" onClick={onClose}>
                        Close
                    </Button>,
                    <Button
                        key="assign"
                        type="primary"
                        onClick={handleAssign}
                        disabled={selectedRowKeys.length === 0}
                    >
                        Assign
                    </Button>,
                ]}
                width={600}
            >
                <Form form={form} layout="vertical">
                    <Row gutter={12} style={{ marginBottom: 16 }}>
                        <Col span={12}>
                            <Input.Search
                                placeholder="Search ..."
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
                                    { required: true, message: 'Please select start and end date!' },
                                    () => ({
                                        validator(_, value) {
                                            if (!value || value.length < 2) {
                                                return Promise.resolve();
                                            }
                                            const [start, end] = value;
                                            if (end.isAfter(start)) {
                                                return Promise.resolve();
                                            }
                                            return Promise.reject(
                                                new Error('End date must be after start date!')
                                            );
                                        }
                                    })
                                ]}
                            >
                                <RangePicker
                                    style={{ width: '100%' }}
                                    format="YYYY-MM-DD"
                                    placeholder={['Start Date', 'End Date']}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>


                <Spin spinning={loading}>
                    <Table
                        dataSource={classes}
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
            </Modal>
        </>
    );
};

export default ClassListModal;
