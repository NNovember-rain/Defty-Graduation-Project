import React, { useEffect, useState, useCallback } from "react";
import { Modal, Button, List, Pagination, Spin, Typography } from "antd";
import { EyeOutlined, HistoryOutlined, CloseOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import {
    getSubmissionHistory,
    getFeedbackAI,
    type ISubmission,
    type GetSubmissionsResult,
    type FeedbackAIResponse
} from "../../../shared/services/submissionService";
import SubmissionFeedbackAI from "./SubmissionFeedbackAI";
import "./SubmissionHistory.scss";

const { Title, Text } = Typography;

type ViewMode = 'list' | 'feedback';

interface SubmissionHistoryProps {
    visible: boolean;
    onClose: () => void;
    assignmentId: number;
    classId: number;
    studentId: number;
    examMode?: boolean;
}

const SubmissionHistory: React.FC<SubmissionHistoryProps> = ({
    visible,
    onClose,
    assignmentId,
    classId,
    studentId,
    examMode = false
}) => {
    // List view states
    const [loading, setLoading] = useState(false);
    const [submissions, setSubmissions] = useState<ISubmission[]>([]);
    const [total, setTotal] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(6);
    const [error, setError] = useState<string | null>(null);

    // View mode and feedback states
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [feedbackData, setFeedbackData] = useState<FeedbackAIResponse | null>(null);
    const [feedbackLoading, setFeedbackLoading] = useState(false);
    const [feedbackError, setFeedbackError] = useState<string | null>(null);

    const fetchHistory = useCallback(async (page: number = 1, size: number = 10) => {
        console.log('🔍 fetchHistory called with:', { classId, assignmentId, studentId, examMode, page, size });
        setLoading(true);
        setError(null);
        try {
            const result: GetSubmissionsResult = await getSubmissionHistory(classId, assignmentId, studentId, examMode, {
                page: page, // API function internally converts to 0-based
                limit: size
            });
            console.log('✅ fetchHistory result:', result);

            setSubmissions(result.submissions);
            setTotal(result.total);
            setCurrentPage(page);
            setPageSize(size);
        } catch (err) {
            console.error("❌ Failed to fetch submission history:", err);
            setError("Không thể tải lịch sử nộp bài");
            setSubmissions([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    }, [classId, assignmentId, studentId, examMode]);

    const fetchFeedback = async (submissionId: number) => {
        setFeedbackLoading(true);
        setFeedbackError(null);
        try {
            const result = await getFeedbackAI(submissionId);
            setFeedbackData(result);
            setViewMode('feedback');
        } catch (err) {
            console.error("Failed to fetch feedback:", err);
            setFeedbackError("Không thể tải phản hồi từ AI");
        } finally {
            setFeedbackLoading(false);
        }
    };

    useEffect(() => {
        console.log('🚀 SubmissionHistory useEffect triggered:', { 
            visible, assignmentId, classId, studentId, examMode 
        });
        
        if (visible && assignmentId && classId && studentId) {
            console.log('✅ All conditions met, calling fetchHistory');
            fetchHistory(1, pageSize);
        } else {
            console.log('❌ Conditions not met:', { 
                visible, 
                assignmentId: !!assignmentId, 
                classId: !!classId, 
                studentId: !!studentId 
            });
        }
        
        if (!visible) {
            setCurrentPage(1);
            setSubmissions([]);
            setTotal(0);
            setError(null);
            setViewMode('list');
            setFeedbackData(null);
        }
    }, [visible, assignmentId, classId, studentId, examMode, pageSize, fetchHistory]);

    const handlePageChange = (page: number, size?: number) => {
        const newSize = size || pageSize;
        fetchHistory(page, newSize);
    };

    const handlePageSizeChange = (_current: number, size: number) => {
        fetchHistory(1, size);
    };

    const handleViewSubmission = (submissionId: number) => {
        fetchFeedback(submissionId);
    };

    const handleBackToList = () => {
        setViewMode('list');
        setFeedbackData(null);
        // Refresh lại data để cập nhật trạng thái mới nhất
        fetchHistory(currentPage, pageSize);
    };

    const renderSubmissionItem = (item: ISubmission, index: number) => {
        return (
            <List.Item
                key={item.id}
                actions={[
                    <Button
                        key="view"
                        type="primary"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => handleViewSubmission(item.id)}
                    >
                        Xem
                    </Button>
                ]}
            >
                <List.Item.Meta
                    avatar={<HistoryOutlined />}
                    title={
                        <div className="submission-history-item__header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                <Text strong>Bài nộp #{total - (currentPage - 1) * pageSize - index}</Text>
                            </div>
                        </div>
                    }
                    description={
                        <div className="submission-history-item__meta">
                            <Text type="secondary">
                                Thời gian nộp: {dayjs(item.createdDate).format("DD/MM/YYYY HH:mm:ss")}
                            </Text>
                        </div>
                    }
                />
            </List.Item>
        );
    };

    return (
        <Modal
            title={
                <div className="submission-history__title">
                    <HistoryOutlined />
                    Lịch sử luyện tập
                </div>
            }
            open={visible}
            onCancel={onClose}
            footer={[
                <Button key="close" onClick={onClose}>
                    Đóng
                </Button>
            ]}
            width="75vw"
            className="submission-history-modal"
            destroyOnClose={true}
            style={{ top: 80, height: '82vh' }}
            closeIcon={<CloseOutlined style={{ color: '#ffffff', fontSize: '16px' }} />}
        >
            <div className="submission-history__content">
                {error ? (
                    <div className="submission-history__error">
                        <Text type="danger">{error}</Text>
                        <div style={{ marginTop: 8 }}>
                            <Button
                                type="link"
                                onClick={() => fetchHistory(currentPage, pageSize)}
                                style={{ color: '#02b128', padding: 0 }}
                            >
                                Thử lại
                            </Button>
                        </div>
                    </div>
                ) : (
                    <>
                        {viewMode === 'list' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                <div className="submission-history__list-container" style={{ flex: 1, minHeight: 0 }}>
                                    {loading ? (
                                        <div className="submission-history__loading">
                                            <Spin size="large" />
                                            <Text>Đang tải lịch sử...</Text>
                                        </div>
                                    ) : submissions.length > 0 ? (
                                        <List
                                            itemLayout="horizontal"
                                            dataSource={submissions}
                                            renderItem={renderSubmissionItem}
                                            style={{ height: '100%', overflow: 'hidden' }}
                                        />
                                    ) : (
                                        <div className="submission-history__empty">
                                            <HistoryOutlined />
                                            <Title level={4}>
                                                Chưa có lịch sử nộp bài
                                            </Title>
                                            <Text>
                                                Bạn chưa nộp bài nào cho bài tập này.
                                            </Text>
                                        </div>
                                    )}
                                </div>

                                {/* Always show pagination */}
                                <div className="submission-history__pagination" style={{ flexShrink: 0 }}>
                                    <Pagination
                                        current={currentPage}
                                        total={Math.max(total, 1)} // Ensure minimum 1 for pagination display
                                        pageSize={pageSize}
                                        onChange={handlePageChange}
                                        onShowSizeChange={handlePageSizeChange}
                                        showSizeChanger={false}
                                        showQuickJumper={true}
                                        showTotal={(total, range) =>
                                            total > 0
                                                ? `Hiển thị ${range[0]}-${range[1]} trong tổng số ${total} bài nộp`
                                                : `Không có bài nộp nào`
                                        }
                                        pageSizeOptions={['10', '20', '50']}
                                        size="default"
                                        disabled={loading || submissions.length === 0}
                                    />
                                </div>
                            </div>
                        ) : (
                            <SubmissionFeedbackAI
                                feedbackData={feedbackData}
                                loading={feedbackLoading}
                                error={feedbackError}
                                onBack={handleBackToList}
                            />
                        )}
                    </>
                )}
            </div>
        </Modal>
    );
};

export default SubmissionHistory;
