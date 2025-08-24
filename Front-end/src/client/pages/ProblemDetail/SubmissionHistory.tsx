import React, { useEffect, useState } from "react";
import { Modal, Button, List, Pagination, Spin, Typography } from "antd";
import { EyeOutlined, HistoryOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import {
    getSubmissionHistory,
    getFeedbackAI,
    type SubmissionHistoryResponse,
    type GetSubmissionHistoryResult,
    type FeedbackAIResponse
} from "../../../shared/services/submissionService";
import { useTranslation } from "react-i18next";
import "./SubmissionHistory.scss";

const { Title, Text } = Typography;

// Helper function to render AI feedback nicely
const renderAIFeedback = (feedback: { [key: string]: any }) => {
    try {
        // Check if it's already a parsed object
        const feedbackData = typeof feedback === 'string' ? JSON.parse(feedback) : feedback;

        return (
            <div className="submission-feedback-content">
                {/* Render each key-value pair in feedback */}
                {Object.entries(feedbackData).map(([key, value]) => {
                    // Skip rendering if value is null or undefined
                    if (value === null || value === undefined) return null;

                    // Handle different value types
                    if (Array.isArray(value)) {
                        // Array values - render as list
                        return (
                            <div key={key} className="submission-feedback-section">
                                <h4 className="submission-feedback-title">{key}:</h4>
                                <ul className="submission-feedback-list">
                                    {value.map((item: any, index: number) => (
                                        <li key={index} className="submission-feedback-item">
                                            {typeof item === 'object' && item.type && item.message ? (
                                                // Handle error-like objects with type and message
                                                <><strong>{item.type}:</strong> {item.message}</>
                                            ) : (
                                                // Handle simple string items
                                                String(item)
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        );
                    } else if (typeof value === 'object' && value !== null) {
                        // Object values - render as nested structure
                        return (
                            <div key={key} className="submission-feedback-section">
                                <h4 className="submission-feedback-title">{key}:</h4>
                                <div className="submission-feedback-nested">
                                    <pre className="submission-feedback-code">
                                        {JSON.stringify(value, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        );
                    } else {
                        // Primitive values (string, number, boolean)
                        return (
                            <div key={key} className="submission-feedback-section">
                                <h4 className="submission-feedback-title">{key}:</h4>
                                <div className="submission-feedback-value">
                                    {String(value)}
                                </div>
                            </div>
                        );
                    }
                })}
            </div>
        );
    } catch (e) {
        // If it's not valid JSON or has unexpected structure, show as text
        return (
            <div className="submission-feedback-text">
                <pre className="submission-feedback-raw">
                    {typeof feedback === 'string' ? feedback : JSON.stringify(feedback, null, 2)}
                </pre>
            </div>
        );
    }
};

type ViewMode = 'list' | 'feedback';

interface SubmissionHistoryProps {
    visible: boolean;
    onClose: () => void;
    studentId: number;
    onViewSubmission?: (submissionId: number) => void;
}

const SubmissionHistory: React.FC<SubmissionHistoryProps> = ({
    visible,
    onClose,
    studentId,
    onViewSubmission
}) => {
    const { t } = useTranslation();
    // List view states
    const [loading, setLoading] = useState(false);
    const [submissions, setSubmissions] = useState<SubmissionHistoryResponse[]>([]);
    const [total, setTotal] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [error, setError] = useState<string | null>(null);

    // View mode and feedback states
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [currentSubmissionId, setCurrentSubmissionId] = useState<number | null>(null);
    const [feedbackData, setFeedbackData] = useState<FeedbackAIResponse | null>(null);
    const [feedbackLoading, setFeedbackLoading] = useState(false);
    const [feedbackError, setFeedbackError] = useState<string | null>(null);

    const fetchHistory = async (page: number = 1, size: number = 10) => {
        setLoading(true);
        setError(null);
        try {
            const result: GetSubmissionHistoryResult = await getSubmissionHistory(studentId, {
                page: page - 1, // Backend uses 0-based pagination
                size: size
            });

            setSubmissions(result.content);
            setTotal(result.totalElements);
            setCurrentPage(page);
            setPageSize(size);
        } catch (err) {
            console.error("Failed to fetch submission history:", err);
            setError("Không thể tải lịch sử nộp bài");
            setSubmissions([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    };

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
        if (visible && studentId) {
            fetchHistory(1, pageSize);
        }
        // Reset state when modal is closed
        if (!visible) {
            setCurrentPage(1);
            setSubmissions([]);
            setTotal(0);
            setError(null);
            setViewMode('list');
            setCurrentSubmissionId(null);
            setFeedbackData(null);
        }
    }, [visible, studentId]);

    const handlePageChange = (page: number, size?: number) => {
        const newSize = size || pageSize;
        fetchHistory(page, newSize);
    };

    const handlePageSizeChange = (current: number, size: number) => {
        fetchHistory(1, size); // Reset to first page when changing page size
    };

    const handleViewSubmission = (submissionId: number) => {
        // Instead of just logging, call the feedback API
        setCurrentSubmissionId(submissionId);
        fetchFeedback(submissionId);
    };

    const handleFeedbackClick = (submissionId: number) => {
        setCurrentSubmissionId(submissionId);
        fetchFeedback(submissionId);
    };

    const handleBackToList = () => {
        setViewMode('list');
        setCurrentSubmissionId(null);
        setFeedbackData(null);
    };

    const renderSubmissionItem = (item: SubmissionHistoryResponse) => (
        <List.Item
            key={item.id}
            actions={[
                <Button
                    key="view"
                    type="primary"
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => handleViewSubmission(item.id)}
                    className="submission-history__view-btn"
                >
                    Xem
                </Button>
            ]}
        >
            <List.Item.Meta
                avatar={<HistoryOutlined className="submission-history__item-icon" />}
                title={
                    <div className="submission-history-item__header">
                        <Text strong>Bài nộp #{item.id}</Text>
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

    return (
        <Modal
            title={
                <div className="submission-history__title">
                    <HistoryOutlined />
                    Lịch sử nộp bài
                </div>
            }
            open={visible}
            onCancel={onClose}
            footer={[
                <Button key="close" onClick={onClose}>
                    Đóng
                </Button>
            ]}
            width={800}
            className="submission-history-modal"
            destroyOnClose={true}
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
                        {loading ? (
                            <div className="submission-history__loading">
                                <Spin size="large" />
                                <Text>Đang tải lịch sử...</Text>
                            </div>
                        ) : submissions.length > 0 ? (
                            <>
                                {viewMode === 'list' ? (
                                    <>
                                        <List
                                            itemLayout="horizontal"
                                            dataSource={submissions}
                                            renderItem={renderSubmissionItem}
                                        />
                                        {total > pageSize && (
                                            <div className="submission-history__pagination">
                                                <Pagination
                                                    current={currentPage}
                                                    total={total}
                                                    pageSize={pageSize}
                                                    onChange={handlePageChange}
                                                    onShowSizeChange={handlePageSizeChange}
                                                    showSizeChanger={true}
                                                    showQuickJumper={true}
                                                    showTotal={(total, range) =>
                                                        `Hiển thị ${range[0]}-${range[1]} trong tổng số ${total} bài nộp`
                                                    }
                                                    pageSizeOptions={['5', '10', '20', '50']}
                                                    size="default"
                                                />
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="submission-feedback">
                                        <Button
                                            type="link"
                                            icon={<ArrowLeftOutlined />}
                                            onClick={handleBackToList}
                                            className="submission-feedback__back-btn"
                                        >
                                            Quay lại danh sách
                                        </Button>
                                        {feedbackLoading ? (
                                            <div className="submission-feedback__loading">
                                                <Spin size="large" />
                                                <Text>Đang tải phản hồi...</Text>
                                            </div>
                                        ) : feedbackError ? (
                                            <div className="submission-feedback__error">
                                                <Text type="danger">{feedbackError}</Text>
                                            </div>
                                        ) : feedbackData ? (
                                            <>
                                                <div className="submission-feedback__header">
                                                    <Title level={4} style={{ color: '#e0e0e0', marginBottom: 8 }}>
                                                        Phản hồi từ AI - {feedbackData.aiModalName}
                                                    </Title>
                                                    <Text type="secondary" style={{ color: '#b0b0b0' }}>
                                                        ID: {feedbackData.id} | Submission: #{feedbackData.submissionId}
                                                    </Text>
                                                </div>
                                                {feedbackData.feedback && Object.keys(feedbackData.feedback).length > 0 ? (
                                                    renderAIFeedback(feedbackData.feedback)
                                                ) : (
                                                    <div className="submission-feedback__no-data">
                                                        <Text type="secondary" style={{ color: '#888888' }}>
                                                            Chưa có phản hồi từ AI hoặc AI đang xử lý bài nộp này.
                                                        </Text>
                                                    </div>
                                                )}
                                            </>
                                        ) : null}
                                    </div>
                                )}
                            </>
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
                    </>
                )}
            </div>
        </Modal>
    );
};

export default SubmissionHistory;
