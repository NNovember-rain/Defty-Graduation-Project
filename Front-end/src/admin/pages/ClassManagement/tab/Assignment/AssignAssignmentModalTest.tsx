import {Button, Col, DatePicker, Form, Input, message, Modal, Row, Spin, Table, Select, Typography} from "antd";
import React, {useCallback, useEffect, useState} from "react";
import type {ColumnsType} from "antd/es/table";
import {
    assignAssignment,
    getAssignments,
    getUnassignedAssignments
} from "../../../../../shared/services/assignmentService.ts";
import {useTranslation} from "react-i18next";
import type { Key } from "react";
import {getTypeUmls} from "../../../../../shared/services/typeUmlService.ts";
import moment from "moment";
import { useParams } from "react-router-dom";

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

// Giả định ITypeUml không có ID
interface ITypeUml {
    name: string;
}

// 1. 🛠️ SỬA INTERFACE STATE: Lưu trữ mảng chuỗi (tên Enum)
interface AssignmentModuleConfig {
    [moduleId: number]: string[]; // Thay đổi từ number[] sang string[]
}
interface AssignmentConfigMap {
    [assignmentId: number]: AssignmentModuleConfig;
}

interface ModuleAssignRequest {
    moduleId: number;
    typeUmls: string[];
}

interface AssignmentAssignRequest {
    assignmentId: number;
    modules: ModuleAssignRequest[];
    startDate: string | null;
    endDate: string | null;
    checkedTest: boolean;
}

interface AssignRequest {
    classIds: number[];
    assignments: AssignmentAssignRequest[];
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

    const [selectedAssignmentIds, setSelectedAssignmentIds] = useState<number[]>([]);
    const [expandedRowKeys, setExpandedRowKeys] = useState<Key[]>([]);
    const [configMap, setConfigMap] = useState<AssignmentConfigMap>({});

    const [typeUMLs, setTypeUMLs] = useState<TypeUmlOption[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [messageApi, contextHolder] = message.useMessage();

    // Lấy ID từ URL Params
    const { id } = useParams<ClassDetailParams>();

    const classId = Number(id);

    const fetchAssignmentsForModal = useCallback(async (page: number, limit: number) => {
        if (isNaN(classId) || classId <= 0) {
            console.error("Class ID is invalid or missing.");
            return;
        }

        setLoading(true);
        try {
            const options = {page, limit,};
            const response = await getUnassignedAssignments(classId, "test", options);

            const assignmentData = response.assignments || [];
            const total = response.total || assignmentData.length;

            const dataWithKeys: Assignment[] = assignmentData.map((item: any) => ({
                ...item,
                key: `assignment_${item.id}`,
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
    }, [classId, messageApi, t]);

    useEffect(() => {
        async function fetchTypeUMLs() {
            try {
                const response = await getTypeUmls();
                // console.log('Fetched Type UMLs:', response);
                const typeUmlsArray: TypeUmlOption[] = Array.isArray(response.typeUmls)
                    ? response.typeUmls.map((t: ITypeUml) => ({
                        value: t.name,
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
            setSelectedAssignmentIds([]);
            setConfigMap({});
            setExpandedRowKeys([]);
            form.resetFields();
        }
    }, [visible, currentPage, pageSize, fetchAssignmentsForModal, form]);

    const columns: ColumnsType<Assignment> = [
        {title: t("assignmentForm.listAssignment"), dataIndex: "title", key: "title"},
    ];


    const handleAssign = async () => {
        try {
            const values = await form.validateFields();

            if (selectedAssignmentIds.length === 0) {
                return messageApi.error(t('Please select at least one assignment') || 'Vui lòng chọn ít nhất một bài tập.');
            }

            const dateRange = values.dateRange || [];
            const startDate = dateRange.length > 0 ? (dateRange[0] as moment.Moment).toISOString() : null;
            const endDate = dateRange.length > 1 ? (dateRange[1] as moment.Moment).toISOString() : null;
            const checkedTest = false;

            const assignmentsToValidate = assignments.filter(a => selectedAssignmentIds.includes(a.id));
            const assignmentsPayload: AssignmentAssignRequest[] = [];

            let failedValidation = false;
            let validationMessage = '';

            for (const assignment of assignmentsToValidate) {
                const assignmentConfig = configMap[assignment.id];
                const moduleAssignRequests: ModuleAssignRequest[] = [];

                if (!assignmentConfig || Object.keys(assignmentConfig).length === 0) {
                    failedValidation = true;
                    validationMessage = t('validation.selectModuleRequired') || `Vui lòng chọn ít nhất một Module cho bài tập "${assignment.title}".`;
                    break;
                }

                for (const moduleIdKey in assignmentConfig) {
                    const moduleId = Number(moduleIdKey);

                    const typeUmls: string[] = assignmentConfig[moduleId];

                    const moduleName = assignment.modules?.find(m => m.id === moduleId)?.moduleName || `ID ${moduleId}`;

                    if (typeUmls.length === 0) {
                        failedValidation = true;
                        validationMessage = t('validation.selectTypeUmlRequired') || `Module "${moduleName}" của bài tập "${assignment.title}" phải có ít nhất một Type UML được chọn.`;
                        break;
                    }

                    moduleAssignRequests.push({ moduleId, typeUmls });
                }

                if (failedValidation) break;

                assignmentsPayload.push({
                    assignmentId: assignment.id,
                    modules: moduleAssignRequests,
                    startDate,
                    endDate,
                    checkedTest
                });
            }

            if (failedValidation) {
                return messageApi.error(validationMessage);
            }

            setAssignLoading(true);

            const payload: AssignRequest = {
                classIds,
                assignments: assignmentsPayload,
            };

            await assignAssignment(payload);


            messageApi.success(t('apiMessages.assignSuccess') || 'Giao bài tập thành công!');
            onAssigned?.();
            onClose();
        } catch (error) {
            console.error(error);
            if (!(error && (error as any).errorFields)) {
                messageApi.error(t("Failed to assign assignment") || 'Lỗi khi giao bài tập.');
            }
        } finally {
            setAssignLoading(false);
        }
    };

    const expandedRowRender = (assignmentRecord: Assignment) => {
        const currentAssignmentConfig = configMap[assignmentRecord.id] || {};
        const selectedModuleIds = Object.keys(currentAssignmentConfig).map(Number);

        if (!assignmentRecord.modules || assignmentRecord.modules.length === 0) {
            return (
                <p style={{margin: 0, paddingLeft: 40, color: 'gray'}}>
                    {t('No modules found for this assignment.') || 'Không tìm thấy Module nào cho bài tập này.'}
                </p>
            );
        }

        // 4. 🛠️ SỬA LOGIC XỬ LÝ CHANGE: Loại bỏ .map(Number)
        const handleTypeUmlChange = (moduleId: number, values: string[]) => {
            setConfigMap(prevMap => ({
                ...prevMap,
                [assignmentRecord.id]: {
                    ...prevMap[assignmentRecord.id],
                    [moduleId]: values,
                },
            }));
        };

        const moduleColumnsWithSelection: ColumnsType<Module> = [
            {title: t("Module"), dataIndex: "moduleName", key: "moduleName"},
            {
                title: t("Type UML") ,
                key: "selectTypeUml",
                width: 200,
                render: (text, moduleRecord) => {
                    const isModuleSelected = selectedModuleIds.includes(moduleRecord.id);

                    const currentValues = isModuleSelected
                        ? currentAssignmentConfig[moduleRecord.id] || []
                        : undefined;

                    return (
                        <Select
                            mode="multiple"
                            placeholder={t('Select Type UML') || 'Chọn Type UML'}
                            options={typeUMLs}
                            disabled={!isModuleSelected}
                            value={currentValues}
                            onChange={(values) => handleTypeUmlChange(moduleRecord.id, values)}
                            style={{width: '100%'}}
                        />
                    );
                }
            }
        ];

        const modulesWithKeys: Module[] = assignmentRecord.modules.map(mod => ({
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
                    type: 'checkbox' as const,
                    selectedRowKeys: selectedModuleIds.map(id => `module_${id}`),
                    onChange: (selectedKeys: Key[]) => {
                        const newModuleIds: number[] = selectedKeys.map(key => Number((key as string).split('_')[1]));

                        setConfigMap(prevMap => {
                            const currentAssignmentConfig = prevMap[assignmentRecord.id] || {};
                            const newAssignmentConfig: AssignmentModuleConfig = {};

                            newModuleIds.forEach(moduleId => {
                                newAssignmentConfig[moduleId] = currentAssignmentConfig[moduleId] || [];
                            });

                            return {
                                ...prevMap,
                                [assignmentRecord.id]: newAssignmentConfig,
                            };
                        });
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

    const rowSelection = {
        type: 'checkbox' as const,
        selectedRowKeys: selectedAssignmentIds.map(id => `assignment_${id}`),
        onChange: (selectedKeys: Key[]) => {
            const newAssignmentIds: number[] = selectedKeys.map(key => Number((key as string).split('_')[1]));

            setExpandedRowKeys(selectedKeys);

            setConfigMap(prevMap => {
                const newMap: AssignmentConfigMap = {};

                newAssignmentIds.forEach(id => {
                    newMap[id] = prevMap[id] || {};
                });
                return newMap;
            });

            setSelectedAssignmentIds(newAssignmentIds);
        },
    };

    const handleTableChange = (pagination: any) => {
        setCurrentPage(pagination.current);
        setPageSize(pagination.pageSize);
    };

    const isAssignButtonDisabled = selectedAssignmentIds.length === 0;

    return (
        <>
            {contextHolder}
            <Modal
                title={t("classDetail.assignmentAssignment") || 'Giao bài tập Luyện tập'}
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
                width={1000}
            >
                <Spin spinning={assignLoading} tip={t("Assigning...") || 'Đang giao bài...'}>
                    <Form
                        form={form}
                        layout="vertical"
                        initialValues={{ checkedTest: false }}
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
                                                const [start, end] = value as moment.Moment[];
                                                if (start && end && end.isAfter(start, 'day')) return Promise.resolve();

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
                                <Form.Item name="checkedTest" style={{ display: 'none' }}>
                                    <Input type="hidden" />
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
                            expandedRowKeys={selectedAssignmentIds.map(id => `assignment_${id}`)}
                        />
                    </Spin>
                </Spin>
            </Modal>
        </>
    );
};

export default AssignAssignmentModal;