import React, { useCallback, useState, useEffect } from "react";
import { Modal, Table, Button, Input, Select, Spin, Tooltip } from "antd";
import { FaToggleOn, FaToggleOff } from 'react-icons/fa';
// import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import dayjs from 'dayjs';
import {
    getTestSets,
    toggleTestSetStatus,
    type ITestSet,
    type GetTestSetsOptions
} from "../../../../shared/services/questionBankService/testSetService.ts";
import { useNotification } from "../../../../shared/notification/useNotification";
import type { ITestCollection } from "../../../../shared/services/questionBankService/testCollectionService.ts";
import { FaPlus } from "react-icons/fa6";

interface TestSetPopupProps {
    visible: boolean;
    onClose: () => void;
    collection: ITestCollection | null;
}

const TestSetPopup: React.FC<TestSetPopupProps> = ({ visible, onClose, collection }) => {
    // const { t } = useTranslation();
    const navigate = useNavigate();
    const { message: messageApi, modal } = useNotification();

    const [testSets, setTestSets] = useState<ITestSet[]>([]);
    const [totalSets, setTotalSets] = useState(0);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');

    const fetchTestSets = useCallback(async () => {
        if (!collection?.id) return;

        setLoading(true);
        try {
            const options: GetTestSetsOptions = {
                page: currentPage,
                limit: pageSize,
                collectionId: collection.id,
                testName: searchText || undefined,
                status: statusFilter !== '' ? parseInt(statusFilter, 10) : undefined,
            };

            const result = await getTestSets(options);
            if (result && result.content) {
                setTestSets(result.content || []);
                setTotalSets(result.totalElements || 0);
            }
        } catch (error: any) {
            console.error("Failed to fetch test sets:", error);
            messageApi.error(error?.response?.data?.message || error?.message || 'Có lỗi xảy ra khi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    }, [collection?.id, currentPage, pageSize, searchText, statusFilter]);

    useEffect(() => {
        if (visible && collection?.id) {
            fetchTestSets();
        }
    }, [visible, collection?.id, currentPage, pageSize, searchText, statusFilter]);

    // Reset state when popup opens
    useEffect(() => {
        if (visible) {
            setCurrentPage(1);
            setSearchText('');
            setStatusFilter('');
        }
    }, [visible]);

    const handleSearch = () => {
        setCurrentPage(1);
    };

    const handleReset = () => {
        setSearchText('');
        setStatusFilter('');
        setCurrentPage(1);
    };


    const handleToggleStatus = useCallback(async (testSet: ITestSet) => {
        if (!testSet.id) return;

        const confirmMessage = testSet.status === 1
            ? `Bạn có chắc chắn muốn ngưng hoạt động bài test "${testSet.testName}" không?`
            : `Bạn có chắc chắn muốn kích hoạt bài test "${testSet.testName}" không?`;

        modal.confirm({
            title: 'Xác nhận thay đổi trạng thái',
            content: confirmMessage,
            onOk: async () => {
                try {
                    setLoading(true);
                    await toggleTestSetStatus(testSet.id);
                    messageApi.success(`Cập nhật thành công, trạng thái: ${testSet.status === 1 ? 'Ngưng hoạt động' : 'Đang hoạt động'}`);
                    // Refresh data after status change
                    if (visible && collection?.id) {
                        const options: GetTestSetsOptions = {
                            page: currentPage,
                            limit: pageSize,
                            collectionId: collection.id,
                            testName: searchText || undefined,
                            status: statusFilter !== '' ? parseInt(statusFilter, 10) : undefined,
                        };
                        const result = await getTestSets(options);
                        if (result && result.content) {
                            setTestSets(result.content || []);
                            setTotalSets(result.totalElements || 0);
                        }
                    }
                } catch (error: any) {
                    const errorMessage = error?.response?.data?.message || error?.message || "Có lỗi xảy ra khi cập nhật dữ liệu";
                    messageApi.error(errorMessage);
                } finally {
                    setLoading(false);
                }
            },
        });
    }, [modal, messageApi, visible, collection?.id, currentPage, pageSize, searchText, statusFilter]);

    const columns = [
        {
            title: 'STT',
            key: 'stt',
            width: 60,
            align: 'center' as const,
            render: (_: any, __: any, index: number) => {
                const stt = (currentPage - 1) * pageSize + index + 1;
                return <span className="font-medium text-gray-700">{stt}</span>;
            },
        },
        {
            title: 'Tên bài test',
            dataIndex: 'testName',
            key: 'testName',
            width: 200,
            ellipsis: true,
        },
        {
            title: 'Số thứ tự',
            dataIndex: 'testNumber',
            key: 'testNumber',
            width: 100,
            align: 'center' as const,
            render: (value: number) => value || 0,
        },
        {
            title: 'Tổng câu hỏi',
            dataIndex: 'totalQuestions',
            key: 'totalQuestions',
            width: 120,
            align: 'center' as const,
            render: (value: number) => value || 0,
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'createdDate',
            key: 'createdDate',
            width: 140,
            render: (value: string | Date) => {
                try {
                    return dayjs(value).format('YYYY-MM-DD HH:mm');
                } catch {
                    return value ? String(value) : '-';
                }
            },
        },
        {
            title: 'Thao tác',
            key: 'actions',
            width: 150,
            align: 'center' as const,
            render: (_: any, record: ITestSet) => (
                <div className="flex items-center justify-center gap-1">
                    <Tooltip title={record.status ? 'Ngưng hoạt động' : 'Kích hoạt'}>
                        <button
                            onClick={() => handleToggleStatus(record)}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                            style={{ color: record.status ? '#63782b' : '#6c757d' }}
                        >
                            {record.status ? <FaToggleOn fontSize={17} /> : <FaToggleOff fontSize={17} />}
                        </button>
                    </Tooltip>
                </div>
            ),
        },
    ];

    const handleCreateNew = () => {
        navigate("/admin/question-bank/test-sets/create");
        onClose();
    };

    return (
        <Modal
            title={
                <div className="flex items-center justify-between w-full pr-8">
                    <span className="text-lg font-semibold">
                        {collection?.collectionName}
                    </span>
                    <Button
                        type="primary"
                        icon={<FaPlus className="mr-1" />}
                        onClick={handleCreateNew}
                        className="flex items-center"
                    >
                        Thêm bài test mới
                    </Button>
                </div>
            }
            open={visible}
            onCancel={onClose}
            width="60%"
            style={{ maxWidth: 1200}}
            footer={null}
            className="test-set-popup"
            centered
        >
            <div className="space-y-4">
                {/* Search filters - giống hệt như TestSetManagement */}
                <div className="bg-gray-50 p-4 rounded-lg border">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Tên bài test</label>
                            <Input
                                placeholder="Nhập tên bài test"
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                onPressEnter={handleSearch}
                                allowClear
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Trạng thái</label>
                            <Select
                                placeholder="Chọn trạng thái"
                                value={statusFilter}
                                onChange={setStatusFilter}
                                allowClear
                                className="w-full"
                            >
                                <Select.Option value="1">Hoạt động</Select.Option>
                                <Select.Option value="0">Ngừng hoạt động</Select.Option>
                            </Select>
                        </div>
                        <div className="flex items-end gap-2">
                            <Button type="primary" onClick={handleSearch}>
                                Tìm kiếm
                            </Button>
                            <Button onClick={handleReset}>
                                Đặt lại
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <Spin spinning={loading}>
                    <Table
                        columns={columns}
                        dataSource={testSets}
                        rowKey="id"
                        bordered
                        pagination={{
                            current: currentPage,
                            pageSize: pageSize,
                            total: totalSets,
                            showSizeChanger: true,
                            // showQuickJumper: true,
                            showTotal: (total, range) =>
                                `${range[0]}-${range[1]} của ${total} bài test`,
                            onChange: (page, size) => {
                                setCurrentPage(page);
                                setPageSize(size || 10);
                            },
                            onShowSizeChange: (current, size) => {
                                setCurrentPage(1);
                                setPageSize(size);
                            },
                            pageSizeOptions: ['5', '10', '20', '50'],
                        }}
                        scroll={{ x: 900, y: 500 }}
                        size="small"
                        className="custom-table"
                    />
                </Spin>
            </div>

            <style jsx global>{`
                .test-set-popup .ant-modal-header {
                    border-bottom: 1px solid #f0f0f0;
                    padding: 16px 24px;
                    background: white;
                }

                .test-set-popup .ant-modal-body {
                    padding: 24px;
                    background: white;
                }

                .test-set-popup .ant-modal-content {
                    border-radius: 8px;
                    overflow: hidden;
                }

                .custom-table .ant-table {
                    background: white;
                }

                .custom-table .ant-table-thead > tr > th {
                    background-color: #fafafa;
                    font-weight: 600;
                    color: #262626;
                    border-bottom: 2px solid #d9d9d9;
                    border-right: 1px solid #d9d9d9;
                    padding: 12px 16px;
                    text-align: center;
                }

                .custom-table .ant-table-thead > tr > th:last-child {
                    border-right: none;
                }

                .custom-table .ant-table-tbody > tr:hover > td {
                    background-color: #f5f5f5;
                }

                .custom-table .ant-table-tbody > tr > td {
                    padding: 12px 16px;
                    border-bottom: 1px solid #d9d9d9;
                    border-right: 1px solid #d9d9d9;
                    vertical-align: middle;
                }

                .custom-table .ant-table-tbody > tr > td:last-child {
                    border-right: none;
                }

                /* Zebra striping for better readability */
                .custom-table .ant-table-tbody > tr:nth-child(even) > td {
                    background-color: #fafafa;
                }

                .custom-table .ant-table-tbody > tr:nth-child(even):hover > td {
                    background-color: #f0f0f0;
                }

                /* STT column styling */
                .custom-table .ant-table-tbody > tr > td:first-child {
                    font-weight: 500;
                    text-align: center;
                }

                /* Action button styles */
                .custom-table button {
                    border: none;
                    background: transparent;
                    padding: 4px 6px;
                    border-radius: 4px;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                    font-size: 14px;
                }

                .custom-table button:hover {
                    background-color: rgba(0, 0, 0, 0.06);
                    transform: translateY(-1px);
                }

                .custom-table button:active {
                    transform: translateY(0);
                }

                /* Table container border */
                .custom-table .ant-table-container {
                    border: 1px solid #d9d9d9;
                    border-radius: 6px;
                    overflow: hidden;
                }

                /* Remove default table borders to use our custom ones */
                .custom-table .ant-table-bordered .ant-table-container {
                    border: 1px solid #d9d9d9;
                }
            `}</style>
        </Modal>
    );
};

export default TestSetPopup;