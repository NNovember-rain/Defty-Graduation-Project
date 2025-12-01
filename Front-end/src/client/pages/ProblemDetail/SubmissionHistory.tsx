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
    const [pageSize, setPageSize] = useState(5);
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
                    description={
                        <div className="submission-history-item__meta">
                            {item.moduleName && (
                                <div style={{ marginBottom: 4 }}>
                                    <Text type="secondary">Module: </Text>
                                    <Text strong style={{ color: '#1890ff', fontSize: '16px' }}>{item.moduleName}</Text>
                                </div>
                            )}
                            {item.typeUml && (
                                <div style={{ marginBottom: 4 }}>
                                    <Text type="secondary">Loại UML: </Text>
                                    <Text strong style={{ color: '#52c41a' }}>
                                        {item.typeUml === 'CLASS_DIAGRAM' ? 'Class Diagram' : 
                                         item.typeUml === 'USE_CASE_DIAGRAM' ? 'Use Case Diagram' : 
                                         item.typeUml}
                                    </Text>
                                </div>
                            )}
                            <div>
                                <Text type="secondary">
                                    Thời gian nộp: {dayjs(item.createdDate).format("DD/MM/YYYY HH:mm:ss")}
                                </Text>
                            </div>
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
                <div key="footer" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', position: 'relative' }}>
                    {viewMode === 'list' && total > 0 && (
                        <Pagination
                            current={currentPage}
                            total={Math.max(total, 1)}
                            pageSize={pageSize}
                            onChange={handlePageChange}
                            onShowSizeChange={handlePageSizeChange}
                            showSizeChanger={true}
                            showQuickJumper={false}
                            showTotal={(total, range) =>
                                total > 0
                                    ? `Hiển thị ${range[0]}-${range[1]} trong tổng số ${total} bài nộp`
                                    : `Không có bài nộp nào`
                            }
                            pageSizeOptions={['5', '10', '20']}
                            size="default"
                            disabled={loading}
                        />
                    )}
                    <Button onClick={onClose} style={{ position: 'absolute', right: '0' }}>
                        Đóng
                    </Button>
                </div>
            ]}
            width="75vw"
            className="submission-history-modal"
            destroyOnClose={true}
            style={{ top: 50 }}
            bodyStyle={{ height: '70vh', overflow: 'hidden', padding: '16px' }}
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
                            <div style={{ display: 'flex', flexDirection: 'column', height: '65vh', position: 'relative' }}>
                                {loading && (
                                    <div className="submission-history__loading">
                                        <Spin size="large" />
                                        <Text>Đang tải lịch sử...</Text>
                                    </div>
                                )}
                                <div className="submission-history__list-container" style={{ flex: '1', overflow: 'hidden' }}>
                                    {submissions.length > 0 ? (
                                        <List
                                            itemLayout="horizontal"
                                            dataSource={submissions}
                                            renderItem={renderSubmissionItem}
                                        />
                                    ) : !loading && (
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
