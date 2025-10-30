import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Card, Row, Col, Typography, Tag, Input, message, Spin, Alert, Avatar, Collapse } from "antd";
import { MessageOutlined, UserOutlined, InfoCircleOutlined, FileTextOutlined, CodeOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import PlantUMLViewer from "../../components/PlantUMLViewer";
import "./SubmissionDetail.scss";
import {
    getSubmissionDetail,
    getFeedbackTeacher,
    addFeedbackTeacher,
    addScore,
    type ISubmission,
    type FeedbackTeacherResponse,
    type FeedbackTeacherRequest,
} from "../../../shared/services/submissionService.ts";

const { Title, Text } = Typography;


const SubmissionDetail: React.FC = () => {
    const { id, submissionId } = useParams<{ id: string; submissionId: string }>();
    const navigate = useNavigate();

    // Use submissionId first, fallback to id for backward compatibility
    const actualSubmissionId = submissionId || id;

    // States
    const [submission, setSubmission] = useState<ISubmission | null>(null);
    const [teacherFeedbacks, setTeacherFeedbacks] = useState<FeedbackTeacherResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Form states
    const [isEditingFeedback, setIsEditingFeedback] = useState(false);
    const [feedbackText, setFeedbackText] = useState("");
    const [score, setScore] = useState<number | null>(null);
    const [submittingFeedback, setSubmittingFeedback] = useState(false);
    const [submittingScore, setSubmittingScore] = useState(false);

    useEffect(() => {
        if (actualSubmissionId) {
            fetchData();
        }
    }, [actualSubmissionId]);

    const fetchData = async () => {
        if (!actualSubmissionId) return;

        try {
            setLoading(true);
            setError(null);

            // Fetch submission data
            const submissionData = await getSubmissionDetail(actualSubmissionId);
            setSubmission(submissionData);

            // Try to fetch teacher feedback
            try {
                const teacherFeedbackData = await getFeedbackTeacher(actualSubmissionId);
                setTeacherFeedbacks(teacherFeedbackData || []); // Ensure it's always an array
            } catch (err) {
                console.log("No teacher feedback available:", err);
                setTeacherFeedbacks([]); // Set empty array if no feedback
                setIsEditingFeedback(true); // Auto enable editing if no feedback exists
            }

            // Set initial score
            if (submissionData.score) {
                setScore(submissionData.score);
            }

        } catch (err) {
            console.error("Error fetching data:", err);
            setError("Không thể tải dữ liệu bài nộp");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveFeedback = async () => {
        if (!actualSubmissionId || !feedbackText.trim()) {
            message.error("Vui lòng nhập nội dung phản hồi");
            return;
        }

        try {
            setSubmittingFeedback(true);
            const feedbackData: FeedbackTeacherRequest = {
                submissionId: parseInt(actualSubmissionId),
                content: feedbackText
            };

            // Always add new feedback (no update functionality)
            const newFeedbackId = await addFeedbackTeacher(feedbackData);
            message.success("Thêm nhận xét thành công");
            
            // Add new feedback to the list
            const newFeedback: FeedbackTeacherResponse = {
                id: newFeedbackId,
                content: feedbackText,
                teacherId: null,
                avatar: undefined, // Có thể lấy từ user store hiện tại
                fullName: "Giáo viên hiện tại", // Có thể lấy từ user store
                createdDate: new Date().toISOString(), // Use ISO string format
                updatedDate: new Date().toISOString()
            };
            setTeacherFeedbacks(prev => [newFeedback, ...prev]); // Add to top of list
            
            setIsEditingFeedback(false);
            setFeedbackText(""); // Clear input after successful add
        } catch (err) {
            console.error("Error saving feedback:", err);
            message.error("Không thể lưu phản hồi");
        } finally {
            setSubmittingFeedback(false);
        }
    };

    const handleSaveScore = async () => {
        if (!actualSubmissionId || score === null || score < 0 || score > 10) {
            message.error("Vui lòng nhập điểm số hợp lệ (0-10)");
            return;
        }

        try {
            setSubmittingScore(true);
            await addScore(actualSubmissionId, score);
            message.success("Cập nhật điểm số thành công");
            
            // Update local state instead of refetching data
            setSubmission(prev => prev ? { ...prev, score } : null);
        } catch (err) {
            console.error("Error saving score:", err);
            message.error("Không thể lưu điểm số");
        } finally {
            setSubmittingScore(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 8) return "#52c41a"; // green
        if (score >= 5) return "#faad14"; // orange
        return "#ff4d4f"; // red
    };

    if (loading) {
        return (
            <div style={{ textAlign: "center", marginTop: "20vh" }}>
                <Spin size="large" />
                <div style={{ marginTop: 16 }}>
                    <Text>Đang tải dữ liệu...</Text>
                </div>
            </div>
        );
    }

    if (error || !submission) {
        return (
            <div style={{ padding: "2rem" }}>
                <Alert
                    message="Lỗi"
                    description={error || "Không tìm thấy bài nộp"}
                    type="error"
                    showIcon
                />
                <div style={{ textAlign: "center", marginTop: 16 }}>
                    <Button onClick={() => navigate(-1)}>Quay lại</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="submission-detail-container">
            {/* Header */}
            <div className="submission-detail-header">
                <div className="submission-detail-info">
                    <div className="submission-detail-info-left">
                        <Title level={3} style={{ margin: 0, marginBottom: 8 }}>
                            {submission.assignmentTitle}
                        </Title>
                        <div className="submission-detail-meta">
                            <Text strong>{submission.studentName}</Text>
                            {submission.studentCode && (
                                <Text type="secondary">({submission.studentCode})</Text>
                            )}
                            {submission.moduleName && (
                                <>
                                    <Text type="secondary" strong>Module:</Text>
                                    <Tag color="blue">{submission.moduleName}</Tag>
                                </>
                            )}
                            {submission.typeUml && (
                                <Tag color="green">{submission.typeUml}</Tag>
                            )}
                            <Text type="secondary">
                                Nộp lúc: {dayjs(submission.createdDate).format("DD/MM/YYYY HH:mm")}
                            </Text>
                        </div>
                    </div>
                </div>
            </div>

            <Row gutter={24}>
                {/* Left Column - Code Display */}
                <Col span={18}>
                    {/* Compact Info Section with Tabs */}
                    {(submission.descriptionModule || submission.descriptionAssignment) && (
                        <Collapse 
                            defaultActiveKey={[]} 
                            style={{ marginBottom: 16 }}
                            items={[
                                {
                                    key: '1',
                                    label: (
                                        <span>
                                            <InfoCircleOutlined style={{ marginRight: 8 }} />
                                            Thông tin đề bài
                                        </span>
                                    ),
                                    children: (
                                        <div>
                                            {submission.descriptionAssignment && (
                                                <div style={{ marginBottom: submission.descriptionModule ? '20px' : 0 }}>
                                                    <h4 style={{ 
                                                        margin: '0 0 12px 0',
                                                        fontSize: '14px',
                                                        fontWeight: 600,
                                                        color: '#1890ff',
                                                        borderBottom: '2px solid #1890ff',
                                                        paddingBottom: '6px'
                                                    }}>
                                                        Đề bài
                                                    </h4>
                                                    <div 
                                                        dangerouslySetInnerHTML={{ __html: submission.descriptionAssignment }}
                                                        style={{ 
                                                            padding: '12px',
                                                            backgroundColor: '#fafafa',
                                                            borderRadius: '4px',
                                                            maxHeight: '300px',
                                                            overflowY: 'auto'
                                                        }}
                                                    />
                                                </div>
                                            )}
                                            
                                            {submission.descriptionModule && (
                                                <div>
                                                    <h4 style={{ 
                                                        margin: '0 0 12px 0',
                                                        fontSize: '14px',
                                                        fontWeight: 600,
                                                        color: '#52c41a',
                                                        borderBottom: '2px solid #52c41a',
                                                        paddingBottom: '6px'
                                                    }}>
                                                        Module
                                                    </h4>
                                                    <div 
                                                        dangerouslySetInnerHTML={{ __html: submission.descriptionModule }}
                                                        style={{ 
                                                            padding: '12px',
                                                            backgroundColor: '#fafafa',
                                                            borderRadius: '4px',
                                                            maxHeight: '300px',
                                                            overflowY: 'auto'
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )
                                }
                            ]}
                        />
                    )}

                    {/* Solution Code - Collapsible */}
                    {submission.solutionCode && (
                        <Collapse
                            style={{ marginBottom: 16 }}
                            items={[
                                {
                                    key: '1',
                                    label: (
                                        <span>
                                            <FileTextOutlined style={{ marginRight: 8 }} />
                                            Đáp án tham khảo
                                        </span>
                                    ),
                                    children: (
                                        <PlantUMLViewer 
                                            code={submission.solutionCode}
                                        />
                                    )
                                }
                            ]}
                        />
                    )}

                    {/* Main Code Card - Student Code */}
                    <Card
                        title={
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <CodeOutlined />
                                <span>Chi tiết bài làm</span>
                            </div>
                        }
                        bodyStyle={{ padding: '16px' }}
                    >
                        <PlantUMLViewer 
                            code={submission.studentPlantUMLCode || "// Không có dữ liệu"}
                        />
                    </Card>
                </Col>

                {/* Right Column - Modern Evaluation Panel */}
                <Col span={6}>
                    <div className="evaluation-panel">
                        {/* Header */}
                        <div className="evaluation-header">
                            <div className="evaluation-title">
                                <MessageOutlined className="evaluation-icon" />
                                <span>Đánh giá bài nộp</span>
                            </div>
                            <div className="evaluation-status">
                                <Tag 
                                    color={submission?.score !== null && submission?.score !== undefined ? 'green' : 'orange'} 
                                    className="status-tag"
                                >
                                    {submission?.score !== null && submission?.score !== undefined ? 'ĐÃ CHẤM' : 'CHƯA CHẤM'}
                                </Tag>
                            </div>
                        </div>

                        {/* Score Section */}
                        <div className="score-section">
                            <div className="score-header">
                                <h4 className="section-title">Điểm số</h4>
                                <div className="score-display">
                                    <span className="score-value" style={{ 
                                        color: submission?.score ? getScoreColor(submission.score) : "#d9d9d9" 
                                    }}>
                                        {submission?.score !== null && submission?.score !== undefined ? submission.score : "--"}
                                    </span>
                                    <span className="score-max">/10</span>
                                </div>
                            </div>
                            
                            <div className="score-input-container">
                                <div className="score-input-wrapper">
                                    <Input
                                        type="number"
                                        min={0}
                                        max={10}
                                        step={0.1}
                                        value={score !== null ? score : (submission?.score || "")}
                                        onChange={(e) => setScore(Number(e.target.value))}
                                        placeholder="Nhập điểm (0-10)"
                                        className="score-input"
                                        onPressEnter={handleSaveScore}
                                    />
                                    <div className="score-actions">
                                        <Button 
                                            type="primary"
                                            size="small"
                                            onClick={handleSaveScore}
                                            loading={submittingScore}
                                            disabled={score === null || score < 0 || score > 10}
                                        >
                                            Lưu điểm
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Feedback Section */}
                        <div className="feedback-section">
                            <div className="feedback-header">
                                <h4 className="section-title">Nhận xét của giáo viên</h4>
                                {!isEditingFeedback && (
                                    <Button 
                                        type="primary"
                                        size="small"
                                        onClick={() => setIsEditingFeedback(true)}
                                        className="add-feedback-btn"
                                    >
                                        Thêm nhận xét
                                    </Button>
                                )}
                            </div>

                            {isEditingFeedback && (
                                <div className="feedback-form">
                                    <div className="feedback-input-wrapper">
                                        <textarea
                                            className="feedback-textarea"
                                            value={feedbackText}
                                            onChange={(e) => setFeedbackText(e.target.value)}
                                            placeholder="Nhập nhận xét chi tiết cho sinh viên về bài làm này..."
                                            rows={4}
                                        />
                                    </div>
                                    <div className="feedback-actions">
                                        <Button 
                                            size="small"
                                            onClick={() => {
                                                setIsEditingFeedback(false);
                                                setFeedbackText("");
                                            }}
                                        >
                                            Hủy
                                        </Button>
                                        <Button 
                                            type="primary"
                                            size="small"
                                            onClick={handleSaveFeedback}
                                            loading={submittingFeedback}
                                        >
                                            Lưu nhận xét
                                        </Button>
                                    </div>
                                </div>
                            )}

                            <div className="feedback-list">
                                {teacherFeedbacks.length > 0 ? (
                                    teacherFeedbacks.map((feedback) => (
                                        <div key={feedback.id} className="feedback-item">
                                            <div className="feedback-header">
                                                <div className="feedback-teacher-info">
                                                    <Avatar 
                                                        size={32}
                                                        src={feedback.avatar}
                                                        icon={<UserOutlined />}
                                                        className="feedback-avatar"
                                                    />
                                                    <div className="feedback-teacher-details">
                                                        <span className="feedback-teacher-name">
                                                            {feedback.fullName || "Giáo viên"}
                                                        </span>
                                                        <span className="feedback-date">
                                                            {feedback.createdDate 
                                                                ? dayjs(feedback.createdDate).isValid() 
                                                                    ? dayjs(feedback.createdDate).format("DD/MM/YYYY HH:mm")
                                                                    : "Thời gian không hợp lệ"
                                                                : "Vừa tạo"
                                                            }
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="feedback-content">
                                                {feedback.content || "Không có nội dung"}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="feedback-empty">
                                        <div className="feedback-empty-content">
                                            <MessageOutlined className="feedback-empty-icon" />
                                            <p className="feedback-empty-text">
                                                Chưa có nhận xét nào cho bài nộp này
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </Col>
            </Row>
        </div>
    );
};

export default SubmissionDetail;
