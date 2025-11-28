import {Button, Col, DatePicker, Form, Input, message, Modal, Row, Select, Spin, Table, Tag} from "antd";
import type {Key} from "react";
import React, {useCallback, useEffect, useState} from "react";
import type {ColumnsType} from "antd/es/table";
import {useTranslation} from "react-i18next";
import {useParams} from "react-router-dom";
import moment from "moment";
import {getTestSets, type ITestSet} from "../../../../../shared/services/questionBankService/testSetService.ts";
import {getAllActiveTestCollections} from "../../../../../shared/services/questionBankService/testCollectionService.ts";

const {RangePicker} = DatePicker;

interface AssignQuizModalProps {
    visible: boolean;
    onClose: () => void;
    classIds: number[];
    onAssigned?: () => void;
}

interface ClassDetailParams {
    id: string;
}

interface QuizAssignRequest {
    testSetId: string;
    startDate: string | null;
    endDate: string | null;
}

interface AssignQuizRequest {
    classIds: number[];
    testSets: QuizAssignRequest[];
}

const AssignQuizModal: React.FC<AssignQuizModalProps> = ({
                                                             visible,
                                                             onClose,
                                                             classIds,
                                                             onAssigned,
                                                         }) => {
    const {t} = useTranslation();
    const [form] = Form.useForm();
    const [testSets, setTestSets] = useState<ITestSet[]>([]);
    const [loading, setLoading] = useState(false);
    const [assignLoading, setAssignLoading] = useState(false);
    const [totalItems, setTotalItems] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);
    const [selectedTestSetIds, setSelectedTestSetIds] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCollectionId, setSelectedCollectionId] = useState<number | undefined>(undefined);
    const [collections, setCollections] = useState<any[]>([]);
    const [messageApi, contextHolder] = message.useMessage();

    const { id } = useParams<ClassDetailParams>();
    const classId = Number(id);

    // Fetch collections cho filter
    useEffect(() => {
        const fetchCollections = async () => {
            try {
                const result = await getAllActiveTestCollections();
                if (result.data) {
                    setCollections(result.data.map((collection: any) => ({
                        value: collection.id,
                        label: collection.collectionName
                    })));
                }
            } catch (error) {
                console.error("Failed to fetch collections:", error);
            }
        };
        fetchCollections();
    }, []);

    const fetchTestSetsForModal = useCallback(async (page: number, limit: number) => {
        if (isNaN(classId) || classId <= 0) {
            console.error("Class ID is invalid or missing.");
            return;
        }

        setLoading(true);
        try {
            const options = {
                page,
                limit,
                status: 1, // Chỉ lấy test set đang hoạt động
                testName: searchTerm || undefined,
                collectionId: selectedCollectionId || undefined, // Thêm filter collection
            };

            const result = await getTestSets(options);

            if (result && result.content) {
                setTestSets(result.content || []);
                setTotalItems(result.totalElements || 0);
            }
        } catch (error) {
            console.error("Failed to load test sets:", error);
            messageApi.error(t("apiMessages.loadTestSetsFailed") || "Lỗi khi tải danh sách đề thi");
        } finally {
            setLoading(false);
        }
    }, [classId, searchTerm, selectedCollectionId, messageApi, t]);

    useEffect(() => {
        if (visible) {
            fetchTestSetsForModal(currentPage, pageSize);
            setSelectedTestSetIds([]);
            form.resetFields();
        }
    }, [visible, currentPage, pageSize, fetchTestSetsForModal, form]);

    const columns: ColumnsType<ITestSet> = [
        {
            title: "Tên bài thi",
            dataIndex: "testName",
            key: "testName",
        },
        {
            title: "Bộ sưu tập",
            dataIndex: "collectionName",
            key: "collectionName",
            render: (value: string) => value || '-',
        },
        {
            title: "Số câu hỏi",
            dataIndex: "totalQuestions",
            key: "totalQuestions",
            render: (value: number) => value || 0,
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            render: (status: number) => (
                <Tag color={status === 1 ? 'green' : 'red'}>
                    {status === 1 ? 'Hoạt động' : 'Ngừng'}
                </Tag>
            ),
        },
    ];


    const handleAssign = async () => {
        try {
            const values = await form.validateFields();

            if (selectedTestSetIds.length === 0) {
                return messageApi.error(t('validation.selectTestSetRequired') || 'Vui lòng chọn ít nhất một đề thi.');
            }

            const dateRange = values.dateRange || [];
            const startDate = dateRange.length > 0 ? (dateRange[0] as moment.Moment).toISOString() : null;
            const endDate = dateRange.length > 1 ? (dateRange[1] as moment.Moment).toISOString() : null;

            setAssignLoading(true);

            const testSetsPayload: QuizAssignRequest[] = selectedTestSetIds.map(testSetId => ({
                testSetId,
                startDate,
                endDate,
            }));

            const payload: AssignQuizRequest = {
                classIds,
                testSets: testSetsPayload,
            };

            console.log("Sending quiz assign payload:", payload);

            // TODO: Thay đổi API endpoint phù hợp cho việc giao quiz
            // await assignQuiz(payload);

            messageApi.success(t('apiMessages.assignQuizSuccess') || 'Giao đề thi thành công!');
            onAssigned?.();
            onClose();
        } catch (error) {
            console.error(error);
            if (!(error && (error as any).errorFields)) {
                messageApi.error(t("Failed to assign quiz") || 'Lỗi khi giao đề thi.');
            }
        } finally {
            setAssignLoading(false);
        }
    };

    const onSearch = (value: string) => {
        setSearchTerm(value);
        setCurrentPage(1);
    };

    const onCollectionChange = (value: number | undefined) => {
        setSelectedCollectionId(value);
        setCurrentPage(1);
    };

    // FIX: id là UUID string, không cần convert
    const rowSelection = {
        type: 'checkbox' as const,
        selectedRowKeys: selectedTestSetIds,
        onChange: (selectedKeys: Key[]) => {
            const newTestSetIds: string[] = selectedKeys.map(key => String(key));
            setSelectedTestSetIds(newTestSetIds);
            console.log('Selected IDs:', newTestSetIds); // Debug
        },
    };

    const handleTableChange = (pagination: any) => {
        setCurrentPage(pagination.current);
        setPageSize(pagination.pageSize);
    };

    const isAssignButtonDisabled = selectedTestSetIds.length === 0;

    return (
        <>
            {contextHolder}
            <Modal
                title="Giao bài trắc nghiệm"
                open={visible}
                onCancel={onClose}
                footer={[
                    <Button key="close" onClick={onClose}>
                        Đóng
                    </Button>,
                    <Button
                        key="assign"
                        type="primary"
                        onClick={handleAssign}
                        disabled={isAssignButtonDisabled}
                        loading={assignLoading}
                    >
                        Giao bài {selectedTestSetIds.length > 0 && `(${selectedTestSetIds.length})`}
                    </Button>
                ]}
                width={900}
            >
                <Spin spinning={assignLoading} tip="Đang giao bài...">
                    <Form
                        form={form}
                        layout="vertical"
                    >
                        <Row gutter={12} style={{marginBottom: 16}}>
                            <Col span={8}>
                                <Input.Search
                                    placeholder="Tìm kiếm đề thi..."
                                    allowClear
                                    enterButton="Tìm kiếm"
                                    size="middle"
                                    onSearch={onSearch}
                                />
                            </Col>
                            <Col span={8}>
                                <Select
                                    placeholder="Chọn bộ sưu tập"
                                    allowClear
                                    style={{ width: '100%' }}
                                    onChange={onCollectionChange}
                                    options={collections}
                                />
                            </Col>
                            <Col span={8}>
                                <Form.Item
                                    name="dateRange"
                                    required={true}
                                    style={{ marginBottom: 0 }}
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
                                                if (start && end && end.isSame(start, 'day')) return Promise.resolve();

                                                return Promise.reject(
                                                    new Error(t('End date must be after or same as start date!') || 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu!')
                                                );
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

                    <Spin spinning={loading} tip={t("Loading test sets...") || 'Đang tải đề thi...'}>
                        <Table
                            dataSource={testSets}
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

export default AssignQuizModal;