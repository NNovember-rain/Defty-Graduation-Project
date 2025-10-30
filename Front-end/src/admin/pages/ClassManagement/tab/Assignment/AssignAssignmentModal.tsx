import {Button, Col, DatePicker, Form, Input, message, Modal, Row, Spin, Table} from "antd";
import React, {useCallback, useEffect, useState} from "react";
import type {ColumnsType} from "antd/es/table";
import {assignAssignment, getAssignments} from "../../../../../shared/services/assignmentService.ts";
import {useTranslation} from "react-i18next";
import type { Key } from "react";

const {RangePicker} = DatePicker;

interface Module {
    id: number;
    moduleName: string;
}

interface Assignment {
    id: number;
    title: string;
    typeUmlName?: string;
    startDate?: string | null;
    endDate?: string | null;
    modules?: Module[];
    key?: string;
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
    const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [messageApi, contextHolder] = message.useMessage();


    const columns: ColumnsType<Assignment> = [
        {title: t("Title"), dataIndex: "title", key: "title"},
    ];

    const moduleColumns: ColumnsType<Module> = [
        {title: t("Module Name"), dataIndex: "moduleName", key: "moduleName"},
    ];

    const fetchAssignmentsForModal = useCallback(async (page: number, limit: number) => {
        setLoading(true);
        try {
            const params = {page, limit, status: 1};
            const response = await getAssignments(params);
            const assignmentData = Array.isArray(response) ? response : (response.assignments || []);
            const total = response.total || assignmentData.length;

            const dataWithKeys: Assignment[] = assignmentData.map((item: any) => ({
                ...item,
                key: `assignment_${item.id}`,
            }));

            setAssignments(dataWithKeys);
            setTotalItems(total);
        } catch (error) {
            console.error('Failed to load assignments:', error);
            messageApi.error(t('apiMessages.loadAssignmentsFailed'));
        } finally {
            setLoading(false);
        }
    }, [messageApi, t]);

    useEffect(() => {
        if (visible) {
            fetchAssignmentsForModal(currentPage, pageSize);
            setSelectedRowKeys([]); // Reset selection
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
            const checkTest = false

            const assignmentIds: number[] = selectedRowKeys
                .filter(key => key.startsWith('assignment_'))
                .map(key => Number(key.split('_')[1]));

            const moduleIds: number[] = selectedRowKeys
                .filter(key => key.startsWith('module_'))
                .map(key => Number(key.split('_')[1]));

            await assignAssignment({
                assignmentIds,
                moduleIds,
                classIds,
                startDate,
                endDate,
                checkTest
            });

            messageApi.success(t('apiMessages.assignSuccess'));
            onAssigned?.();
            onClose();
        } catch (error) {
            console.error(error);
            messageApi.error(t("Failed to assign assignment"));
        } finally {
            setAssignLoading(false);
        }
    };

    const expandedRowRender = (record: Assignment) => {
        const assignmentKey = `assignment_${record.id}`;
        const isAssignmentSelected = selectedRowKeys.includes(assignmentKey);
        if (!isAssignmentSelected) {
            return (
                <p style={{margin: 0, paddingLeft: 40, color: 'gray'}}>
                    {t('Please select the assignment to view/select its modules.')}
                </p>
            );
        }

        if (!record.modules || record.modules.length === 0) {
            return (
                <p style={{margin: 0, paddingLeft: 40, color: 'gray'}}>
                    {t('No modules found for this assignment.')}
                </p>
            );
        }

        const modulesWithKeys: Module[] = record.modules.map(mod => ({
            ...mod,
            key: `module_${mod.id}` as unknown as number,
        }));

        return (
            <Table
                columns={moduleColumns}
                dataSource={modulesWithKeys}
                pagination={false}
                rowKey={(record) => `module_${record.id}`}
                rowSelection={{
                    selectedRowKeys: selectedRowKeys.filter(key => key.startsWith('module_')),
                    onChange: (selectedKeys: Key[]) => {
                        const otherKeys = selectedRowKeys.filter(key => !key.startsWith('module_'));
                        setSelectedRowKeys([...otherKeys, ...selectedKeys] as string[]);
                    },
                }}
                size="small"
                style={{margin: '10px 0', backgroundColor: '#fafafa'}}
            />
        );
    };


    const onSearch = (value: string) => {
        setSearchTerm(value);
        setCurrentPage(1);
    };

    const onSelectChange = (selectedKeys: Key[]) => {
        const assignmentKeys = selectedKeys
            .filter(key => key.toString().startsWith('assignment_'))
            .map(key => key.toString());

        const moduleKeys = selectedRowKeys.filter(key => key.startsWith('module_'));
        setSelectedRowKeys([...assignmentKeys, ...moduleKeys]);
    };

    const rowSelection = {
        selectedRowKeys,
        onChange: onSelectChange,
        getCheckboxProps: (record: Assignment) => ({
            key: `assignment_${record.id}`,
        }),
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
                    <Button key="close" onClick={onClose}>{t('Close')}</Button>,
                    <Button
                        key="assign"
                        type="primary"
                        onClick={handleAssign}
                        disabled={selectedRowKeys.length === 0}
                        loading={assignLoading}
                    >
                        {t('Assign')}
                    </Button>
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
                                                if (start && end && end.isAfter(start)) return Promise.resolve();

                                                return Promise.reject(new Error(t('End date must be after start date!') || 'Ngày kết thúc phải sau ngày bắt đầu!'));
                                            }
                                        })
                                    ]}
                                >
                                    <RangePicker
                                        style={{width: '100%'}}
                                        format="YYYY-MM-DD"
                                        placeholder={[t('Start Date'), t('End Date')]}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Form>

                    <Spin spinning={loading} tip={t("Loading assignments...")}>
                        <Table
                            dataSource={assignments}
                            columns={columns}
                            rowKey="key"
                            pagination={{
                                current: currentPage,
                                pageSize,
                                total: totalItems,
                                showSizeChanger: true,
                                pageSizeOptions: ['5', '10', '20', '50'],
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