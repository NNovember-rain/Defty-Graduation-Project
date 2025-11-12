import React, { useEffect, useState } from 'react';
import { Modal, Table, Input, DatePicker, Button, Space, Tooltip, Typography, Pagination } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { 
    getAutoFeedbackLLMEntries, 
    type IAutoFeedbackLLMEntry 
} from '../../../../shared/services/autoFeedbackLLMEntryService';
import { useNotification } from '../../../../shared/notification/useNotification';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Text } = Typography;

interface AutoFeedbackJobEntriesModalProps {
    visible: boolean;
    onClose: () => void;
    jobId: number;
    jobTitle: string;
}

export const AutoFeedbackJobEntriesModal: React.FC<AutoFeedbackJobEntriesModalProps> = ({
    visible,
    onClose,
    jobId,
    jobTitle
}) => {
    const { t } = useTranslation();
    const notification = useNotification();
    
    const [entries, setEntries] = useState<IAutoFeedbackLLMEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 6,
        total: 0,
    });
    
    // Filters
    const [studentInfo, setStudentInfo] = useState<string>('');
    const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
    const [sortBy, setSortBy] = useState('createdDate');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const fetchEntries = async (
        currentPage = pagination.current,
        pageSize = pagination.pageSize
    ) => {
        if (!visible || !jobId) return;
        
        setLoading(true);
        try {
            const response = await getAutoFeedbackLLMEntries({
                jobId,
                studentInfo: studentInfo || undefined,
                fromDate: dateRange?.[0]?.format('YYYY-MM-DD'),
                toDate: dateRange?.[1]?.format('YYYY-MM-DD'),
                page: currentPage - 1,
                size: pageSize,
                sortBy,
                sortOrder,
            });

            setEntries(response.content);
            setPagination(prev => ({
                ...prev,
                total: response.totalElements,
            }));
        } catch (error) {
            console.error('Error fetching entries:', error);
            notification.message.error('Không thể tải danh sách entries');
        } finally {
            setLoading(false);
        }
    };

    // Chỉ gọi API khi modal mở lần đầu
    useEffect(() => {
        if (visible && jobId) {
            fetchEntries();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible, jobId]);

    const handleTableChange = (paginationInfo: any, _filters: any, sorter: any) => {
        setPagination(prev => ({
            ...prev,
            current: paginationInfo.current,
            pageSize: paginationInfo.pageSize,
        }));

        if (sorter.field) {
            setSortBy(sorter.field);
            setSortOrder(sorter.order === 'ascend' ? 'asc' : 'desc');
        }
        
        // Call fetchEntries with new pagination values
        fetchEntries(paginationInfo.current, paginationInfo.pageSize);
    };

    const handleSearch = () => {
        setPagination(prev => ({ ...prev, current: 1 }));
        fetchEntries(1, pagination.pageSize);
    };

    const handleReset = () => {
        setStudentInfo('');
        setDateRange(null);
        setSortBy('createdDate');
        setSortOrder('desc');
        setPagination(prev => ({ ...prev, current: 1 }));
    };

    const columns = [
        {
            title: t('autoFeedbackJobPage.entries.studentInfo'),
            dataIndex: 'studentInfo',
            key: 'studentInfo',
            width: 150,
            sorter: true,
        },
        {
            title: t('autoFeedbackJobPage.entries.studentCode'),
            dataIndex: 'studentPlantUMLCode',
            key: 'studentPlantUMLCode',
            render: (text: string) => (
                <Tooltip title={text}>
                    <Text ellipsis style={{ maxWidth: 200, display: 'block' }}>
                        {text}
                    </Text>
                </Tooltip>
            ),
        },
        {
            title: t('autoFeedbackJobPage.entries.feedback'),
            dataIndex: 'feedBackLLM',
            key: 'feedBackLLM',
            render: (text: string) => (
                <Tooltip title={text}>
                    <Text ellipsis style={{ maxWidth: 200, display: 'block' }}>
                        {text}
                    </Text>
                </Tooltip>
            ),
        },
        {
            title: t('autoFeedbackJobPage.entries.createdDate'),
            dataIndex: 'createdDate',
            key: 'createdDate',
            width: 160,
            sorter: true,
            render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm'),
        },
    ];

    return (
        <Modal
            title={`${t('autoFeedbackJobPage.entries.title')} - ${jobTitle}`}
            open={visible}
            onCancel={onClose}
            footer={null}
            width={1400}
            centered={false}
            transitionName=""
            maskTransitionName=""
            style={{ top: 50, left: '50%', transform: 'translateX(-60%)' }}
            styles={{ 
                body: { 
                    padding: '20px',
                    height: '700px',
                    overflow: 'hidden'
                } 
            }}
        >
            {/* Filters */}
            <Space direction="vertical" size="middle" style={{ width: '100%', marginBottom: 16 }}>
                <Space wrap>
                    <Input
                        placeholder={t('autoFeedbackJobPage.entries.studentInfoPlaceholder')}
                        value={studentInfo}
                        onChange={(e) => setStudentInfo(e.target.value)}
                        style={{ width: 200 }}
                        prefix={<SearchOutlined />}
                        onPressEnter={handleSearch}
                    />
                    <RangePicker
                        value={dateRange}
                        onChange={setDateRange}
                        format="DD/MM/YYYY"
                        placeholder={[
                            t('autoFeedbackJobPage.entries.fromDate'),
                            t('autoFeedbackJobPage.entries.toDate')
                        ]}
                    />
                    <Button type="primary" onClick={handleSearch} icon={<SearchOutlined />}>
                        {t('common.search')}
                    </Button>
                    <Button onClick={handleReset} icon={<ReloadOutlined />}>
                        {t('common.reset')}
                    </Button>
                </Space>
            </Space>

            {/* Table */}
            <div style={{ height: '520px', marginBottom: '40px' }}>
                <Table
                    columns={columns}
                    dataSource={entries}
                    rowKey="id"
                    loading={loading}
                    pagination={false}
                    onChange={handleTableChange}
                    scroll={{ x: 1200, y: 470 }}
                />
            </div>
            
            {/* Pagination Outside Table */}
            <div style={{ 
                backgroundColor: '#fff',
                padding: '6px 0 16px 0',
                marginTop: '12px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                <Pagination
                    current={pagination.current}
                    pageSize={pagination.pageSize}
                    total={pagination.total}
                    showSizeChanger={true}
                    pageSizeOptions={['6', '12', '24', '48']}
                    showQuickJumper={true}
                    showTotal={(total: number, range: [number, number]) => 
                        `${range[0]}-${range[1]} ${t('common.of')} ${total} ${t('common.items')}`
                    }
                    onChange={(page: number, size?: number) => {
                        setPagination(prev => ({
                            ...prev,
                            current: page,
                            pageSize: size || prev.pageSize,
                        }));
                        fetchEntries(page, size || pagination.pageSize);
                    }}
                    onShowSizeChange={(_current: number, size: number) => {
                        setPagination(prev => ({
                            ...prev,
                            current: 1,
                            pageSize: size,
                        }));
                        fetchEntries(1, size);
                    }}
                />
            </div>
        </Modal>
    );
};