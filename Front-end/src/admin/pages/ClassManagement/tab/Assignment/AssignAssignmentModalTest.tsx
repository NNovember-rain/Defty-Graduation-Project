import {Button, Col, DatePicker, Form, Input, message, Modal, Row, Spin, Table, Select, Switch, Typography} from "antd";
import React, {useCallback, useEffect, useState} from "react";
import type {ColumnsType} from "antd/es/table";
import {assignAssignment, getAssignments} from "../../../../../shared/services/assignmentService.ts";
import {useTranslation} from "react-i18next";
import type { Key } from "react";
import {getTypeUmls} from "../../../../../shared/services/typeUmlService.ts";

const {RangePicker} = DatePicker;

interface Module {
    id: number;
    moduleName: string;
    key?: string;
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

interface TypeUmlOption {
    value: string;
    label: string;
}
interface ITypeUml {
    id: number;
    name: string;
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

    const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(null);
    const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
    const [selectedTypeUmlId, setSelectedTypeUmlId] = useState<number | null>(null);
    const [typeUMLs, setTypeUMLs] = useState<TypeUmlOption[]>([]);

    const [searchTerm, setSearchTerm] = useState('');
    const [messageApi, contextHolder] = message.useMessage();


    const fetchAssignmentsForModal = useCallback(async (page: number, limit: number) => {
        setLoading(true);
        try {
            const params = {page, limit, status: 1, searchTerm};
            const response: any = await getAssignments(params);

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
            messageApi.error(t('apiMessages.loadAssignmentsFailed') || 'Lỗi khi tải bài tập.');
        } finally {
            setLoading(false);
        }
    }, [messageApi, t, searchTerm]);

    useEffect(() => {
        async function fetchTypeUMLs() {
            try {
                const response = await getTypeUmls();
                const typeUmlsArray: TypeUmlOption[] = Array.isArray(response.typeUmls)
                    ? response.typeUmls.map((t: ITypeUml) => ({
                        value: String(t.id),
                        label: t.name,
                    }))
                    : [];
                setTypeUMLs(typeUmlsArray);
            } catch (error) {
                console.error('Error fetching Type UMLs:', error);
                messageApi.error(t('common.errorFetchingData') || 'Lỗi khi lấy dữ liệu Type UML.');
            }
        }
        fetchTypeUMLs();
    }, [messageApi, t]);

    useEffect(() => {
        if (visible) {
            fetchAssignmentsForModal(currentPage, pageSize);
            setSelectedAssignmentId(null);
            setSelectedModuleId(null);
            setSelectedTypeUmlId(null);
            form.resetFields();
        }
    }, [visible, currentPage, pageSize, fetchAssignmentsForModal, form]);

    const columns: ColumnsType<Assignment> = [
        {title: t("Title"), dataIndex: "title", key: "title"},
    ];


    const handleAssign = async () => {
        try {
            const values = await form.validateFields();

            if (!selectedAssignmentId) {
                return messageApi.error(t('Please select one assignment') || 'Vui lòng chọn một bài tập.');
            }
            if (selectedModuleId && !selectedTypeUmlId) {
                return messageApi.error(t('Please select a Type UML for the selected module') || 'Vui lòng chọn Type UML cho module đã chọn.');
            }

            setAssignLoading(true);

            const dateRange = values.dateRange || [];
            const startDate = dateRange.length > 0 ? dateRange[0].toISOString() : null;
            const endDate = dateRange.length > 1 ? dateRange[1].toISOString() : null;

            const checkedTest = true;

            await assignAssignment({
                assignmentIds: selectedAssignmentId ? [selectedAssignmentId] : [],
                moduleIds: selectedModuleId ? [selectedModuleId] : [],
                typeUmlId: selectedTypeUmlId,
                classIds,
                startDate,
                endDate,
                checkedTest
            });

            messageApi.success(t('apiMessages.assignSuccess') || 'Giao bài tập thành công!');
            onAssigned?.();
            onClose();
        } catch (error) {
            console.error(error);
            messageApi.error(t("Failed to assign assignment") || 'Lỗi khi giao bài tập.');
        } finally {
            setAssignLoading(false);
        }
    };

    const expandedRowRender = (record: Assignment) => {
        const isAssignmentSelected = selectedAssignmentId === record.id;
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

        // Cột cho Module và Type UML Select
        const moduleColumnsWithSelection: ColumnsType<Module> = [
            {title: t("Module Name"), dataIndex: "moduleName", key: "moduleName"},
            {
                title: t("Select Type UML"),
                key: "selectTypeUml",
                width: 220,
                render: (text, moduleRecord) => {
                    const isModuleSelected = selectedModuleId === moduleRecord.id;

                    return (
                        <Select
                            placeholder={t('Select Type UML') || 'Chọn Type UML'}
                            options={typeUMLs}
                            disabled={!isModuleSelected}
                            value={isModuleSelected && selectedTypeUmlId !== null ? String(selectedTypeUmlId) : undefined}
                            onChange={(value: string) => {
                                setSelectedTypeUmlId(Number(value));
                            }}
                            style={{width: '100%'}}
                        />
                    );
                }
            }
        ];

        const modulesWithKeys: Module[] = record.modules.map(mod => ({
            ...mod,
            key: `module_${mod.id}`,
        }));

        return (
            <Table
                columns={moduleColumnsWithSelection}
                dataSource={modulesWithKeys}
                pagination={false}
                rowKey={(record) => record.key!}
                rowSelection={{
                    type: 'radio' as const, // CHỈ CHO PHÉP CHỌN 1 MODULE
                    selectedRowKeys: selectedModuleId ? [`module_${selectedModuleId}`] : [],
                    onChange: (selectedKeys: Key[]) => {
                        const key = selectedKeys[0] as string | undefined;
                        const newModuleId = key ? Number(key.split('_')[1]) : null;

                        if (newModuleId !== selectedModuleId) {
                            setSelectedTypeUmlId(null);
                        }
                        setSelectedModuleId(newModuleId);
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

    // Row selection cho Assignment (Chỉ chọn 1)
    const rowSelection = {
        type: 'radio' as const, // CHỈ CHO PHÉP CHỌN 1 HÀNG (Assignment)
        selectedRowKeys: selectedAssignmentId ? [`assignment_${selectedAssignmentId}`] : [],
        onChange: (selectedKeys: Key[]) => {
            const key = selectedKeys[0] as string | undefined;
            const newAssignmentId = key ? Number(key.split('_')[1]) : null;

            // Reset module và typeUml khi chọn bài tập khác hoặc bỏ chọn bài tập
            if (newAssignmentId !== selectedAssignmentId) {
                setSelectedModuleId(null);
                setSelectedTypeUmlId(null);
            }

            setSelectedAssignmentId(newAssignmentId);
        },
        getCheckboxProps: (record: Assignment) => ({
            key: `assignment_${record.id}`,
        }),
    };

    const handleTableChange = (pagination: any) => {
        setCurrentPage(pagination.current);
        setPageSize(pagination.pageSize);
    };

    // Điều kiện để nút Assign được enable
    const isAssignButtonDisabled = !selectedAssignmentId ||
        (selectedModuleId && !selectedTypeUmlId);

    return (
        <>
            {contextHolder}
            <Modal
                title={t("Assign Assignment")}
                open={visible}
                onCancel={onClose}
                footer={[
                    <Button key="close" onClick={onClose}>{t('Close') || 'Đóng'}</Button>,
                    <Button
                        key="assign"
                        type="primary"
                        onClick={handleAssign}
                        disabled={isAssignButtonDisabled}
                        loading={assignLoading}
                    >
                        {t('Assign') || 'Giao bài'}
                    </Button>
                ]}
                width={800}
            >
                <Spin spinning={assignLoading} tip={t("Assigning...") || 'Đang giao bài...'}>
                    <Form
                        form={form}
                        layout="vertical"
                        initialValues={{ checkTest: true }}
                    >
                        <Row gutter={12} style={{marginBottom: 16}}>
                            <Col span={12}>
                                <Input.Search
                                    placeholder={t("Search assignments...") || 'Tìm kiếm bài tập...'}
                                    allowClear
                                    enterButton={t("Search") || 'Tìm kiếm'}
                                    size="middle"
                                    onSearch={onSearch}
                                />
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="dateRange"
                                    required={true}
                                    rules={[
                                        {
                                            required: true,
                                            message: t('Please select start and end dates') || 'Vui lòng chọn ngày bắt đầu và ngày kết thúc'
                                        },
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

                    <Spin spinning={loading} tip={t("Loading assignments...") || 'Đang tải bài tập...'}>
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
                            expandRowByClick
                        />
                    </Spin>
                </Spin>
            </Modal>
        </>
    );
};

export default AssignAssignmentModal;