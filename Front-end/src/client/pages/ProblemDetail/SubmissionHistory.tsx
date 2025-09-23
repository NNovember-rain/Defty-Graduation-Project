import React, { useEffect, useState, useCallback } from "react";
import { Modal, Button, List, Pagination, Spin, Typography, Tag } from "antd";
import { EyeOutlined, HistoryOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import {
    getSubmissionHistory,
    getFeedbackAI,
    type SubmissionHistoryResponse,
    type GetSubmissionHistoryResult,
    type FeedbackAIResponse,
    type JsonObject,
    type JsonValue
} from "../../../shared/services/submissionService";
import "./SubmissionHistory.scss";

const { Title, Text } = Typography;

// Helper function to get submission status color and text
const getSubmissionStatusConfig = (status: string) => {
    switch (status) {
        case 'SUBMITTED':
            return {
                color: 'rgba(24, 144, 255, 0.12)',
                textColor: '#4096ff',
                text: 'Đã nộp'
            };
        case 'PROCESSING':
            return {
                color: 'rgba(13, 110, 253, 0.12)',
                textColor: '#4096ff',
                text: 'Đang xử lý'
            };
        case 'COMPLETED':
            return {
                color: 'rgba(82, 196, 26, 0.12)',
                textColor: '#73d13d',
                text: 'Hoàn thành'
            };
        case 'REVIEWED':
            return {
                color: 'rgba(114, 46, 209, 0.12)',
                textColor: '#9254de',
                text: 'Đã đánh giá'
            };
        case 'FAILED':
            return {
                color: 'rgba(255, 77, 79, 0.12)',
                textColor: '#ff7875',
                text: 'Thất bại'
            };
        default:
            return {
                color: 'rgba(128, 128, 128, 0.12)',
                textColor: '#8c8c8c',
                text: status
            };
    }
};

// Helper function to render AI feedback with full nested support
const renderAIFeedback = (feedback: JsonObject | string) => {
    let raw: JsonObject | null = null;
    if (typeof feedback === 'string') {
        try { raw = JSON.parse(feedback) as JsonObject; } catch { raw = null; }
    } else raw = feedback;
    if (!raw || typeof raw !== 'object') {
        return (
            <div className="submission-feedback-text">
                <pre className="submission-feedback-raw">Không có dữ liệu phản hồi hợp lệ</pre>
            </div>
        );
    }

    const formatKey = (k: string) => k
        .replace(/([A-Z])/g, ' $1')
        .replace(/_/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/^./, c => c.toUpperCase());

    const isPrimitive = (v: JsonValue): v is string | number | boolean | null =>
        v === null || ['string', 'number', 'boolean'].includes(typeof v);

    // Recursive function to render any JSON value with proper nesting
    const renderValue = (value: JsonValue, depth: number = 0): React.ReactNode => {
        const indentClass = `depth-${Math.min(depth, 5)}`; // Limit depth classes for styling

        if (isPrimitive(value)) {
            return (
                <div className={`submission-feedback-value ${indentClass}`}>
                    {value === null ? 'null' : String(value)}
                </div>
            );
        }

        if (Array.isArray(value)) {
            return (
                <div className={`submission-feedback-array ${indentClass}`}>
                    {value.length === 0 ? (
                        <div className="submission-feedback-empty">Mảng rỗng</div>
                    ) : (
                        <ul className="submission-feedback-list">
                            {value.map((item, idx) => (
                                <li key={idx} className="submission-feedback-item">
                                    <span className="submission-feedback-index">[{idx}]</span>
                                    {renderValue(item, depth + 1)}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            );
        }

        if (value && typeof value === 'object') {
            const obj = value as JsonObject;
            const entries = Object.entries(obj);

            if (entries.length === 0) {
                return <div className={`submission-feedback-empty ${indentClass}`}>Object rỗng</div>;
            }

            return (
                <div className={`submission-feedback-object ${indentClass}`}>
                    {entries.map(([key, val]) => (
                        <div key={key} className="submission-feedback-property">
                            <div className="submission-feedback-key">
                                {formatKey(key)}:
                            </div>
                            <div className="submission-feedback-property-value">
                                {renderValue(val, depth + 1)}
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        return <div className={`submission-feedback-unknown ${indentClass}`}>{String(value)}</div>;
    };

    return (
        <div className="submission-feedback-content">
            {Object.entries(raw).map(([k, v]) => (
                <div key={k} className="submission-feedback-section">
                    <h4 className="submission-feedback-title">{formatKey(k)}</h4>
                    <div className="submission-feedback-section-content">
                        {renderValue(v, 0)}
                    </div>
                </div>
            ))}
        </div>
    );
};

type ViewMode = 'list' | 'feedback';

interface SubmissionHistoryProps {
    visible: boolean;
    onClose: () => void;
    assignmentId: number;
}

const SubmissionHistory: React.FC<SubmissionHistoryProps> = ({
    visible,
    onClose,
    assignmentId
}) => {
    // List view states
    const [loading, setLoading] = useState(false);
    const [submissions, setSubmissions] = useState<SubmissionHistoryResponse[]>([]);
    const [total, setTotal] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);
    const [error, setError] = useState<string | null>(null);

    // View mode and feedback states
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [feedbackData, setFeedbackData] = useState<FeedbackAIResponse | null>(null);
    const [feedbackLoading, setFeedbackLoading] = useState(false);
    const [feedbackError, setFeedbackError] = useState<string | null>(null);

    const fetchHistory = useCallback(async (page: number = 1, size: number = 10) => {
        setLoading(true);
        setError(null);
        try {
            const result: GetSubmissionHistoryResult = await getSubmissionHistory(assignmentId, {
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
    }, [assignmentId]);

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
        if (visible && assignmentId) {
            fetchHistory(1, pageSize);
        }
        if (!visible) {
            setCurrentPage(1);
            setSubmissions([]);
            setTotal(0);
            setError(null);
            setViewMode('list');
            setFeedbackData(null);
        }
    }, [visible, assignmentId, pageSize, fetchHistory]);

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

    const renderSubmissionItem = (item: SubmissionHistoryResponse, index: number) => {
        const statusConfig = getSubmissionStatusConfig(item.submissionStatus);

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
                        className="submission-history__view-btn"
                    >
                        Xem
                    </Button>
                ]}
            >
                <List.Item.Meta
                    avatar={<HistoryOutlined className="submission-history__item-icon" />}
                    title={
                        <div className="submission-history-item__header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                <Text strong>Bài nộp #{total - (currentPage - 1) * pageSize - index}</Text>
                                <Tag
                                    style={{
                                        backgroundColor: statusConfig.color,
                                        color: statusConfig.textColor,
                                        border: `1px solid ${statusConfig.textColor}`,
                                        borderRadius: '4px',
                                        fontWeight: 500,
                                        height: '20px',
                                        lineHeight: '18px',
                                        fontSize: '11px',
                                        padding: '0 6px',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        marginTop: '2px'
                                    }}
                                >
                                    {statusConfig.text}
                                </Tag>
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
                        {viewMode === 'list' ? (
                            <>
                                <div className="submission-history__list-container">
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
                                <div className="submission-history__pagination">
                                    <Pagination
                                        current={currentPage}
                                        total={Math.max(total, 1)} // Ensure minimum 1 for pagination display
                                        pageSize={pageSize}
                                        onChange={handlePageChange}
                                        onShowSizeChange={handlePageSizeChange}
                                        showSizeChanger={true}
                                        showQuickJumper={true}
                                        showTotal={(total, range) =>
                                            total > 0
                                                ? `Hiển thị ${range[0]}-${range[1]} trong tổng số ${total} bài nộp`
                                                : `Không có bài nộp nào`
                                        }
                                        pageSizeOptions={['5', '10', '20', '50']}
                                        size="default"
                                        disabled={loading || submissions.length === 0}
                                    />
                                </div>
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

                                <div className="submission-feedback__content-wrapper">
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
                            </div>
                        )}
                    </>
                )}
            </div>
        </Modal>
    );
};

export default SubmissionHistory;
