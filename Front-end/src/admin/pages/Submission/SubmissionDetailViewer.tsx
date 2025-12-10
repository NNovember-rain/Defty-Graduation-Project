import React, { useEffect, useState, memo } from "react";
import { Button, Card, Row, Col, Typography, Tag, Input, message, Spin, Alert, Avatar, Collapse } from "antd";
import { UserOutlined, InfoCircleOutlined, FileTextOutlined, CodeOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import PlantUMLViewer from "../../components/PlantUMLViewer";
import {
    getSubmissionDetail,
    addFeedbackTeacher,
    addScore,
    type ISubmissionDetail,
    type FeedbackTeacherResponse,
    type FeedbackTeacherRequest,
} from "../../../shared/services/submissionService.ts";
import { IoDocumentTextOutline } from 'react-icons/io5'
import "./SubmissionDetailViewer.scss";

const { Title, Text } = Typography;

interface StudentAssignmentData {
    id: string;
    name: string;
    submitted: boolean;
    score: number | null;
    status: 'Đã chấm' | 'Đã nộp' | 'Chưa nộp';
    submissionId: string | null;
}

interface SubmissionDetailViewerProps {
    selectedStudent: StudentAssignmentData;
    maxScore: number;
    onScoreUpdate: (studentId: string, newScore: number) => void;
}

const SubmissionDetailViewer: React.FC<SubmissionDetailViewerProps> = memo(({ selectedStudent, maxScore, onScoreUpdate }) => {
    const { submissionId, id: studentId, name: studentName } = selectedStudent;
    const actualSubmissionId = submissionId;

    const [submission, setSubmission] = useState<ISubmissionDetail | null>(null);
    const [teacherFeedbacks, setTeacherFeedbacks] = useState<FeedbackTeacherResponse[]>([]);
    const [loadingDetail, setLoadingDetail] = useState(true);
    const [errorDetail, setErrorDetail] = useState<string | null>(null);

    const [feedbackText, setFeedbackText] = useState("");
    const [scoreInput, setScoreInput] = useState<number | null>(null);
    const [submittingFeedback, setSubmittingFeedback] = useState(false);
    const [submittingScore, setSubmittingScore] = useState(false);
    useEffect(() => {
        if (selectedStudent.id !== studentId || selectedStudent.score !== scoreInput) {
            setScoreInput(selectedStudent.score || null);
        }
    }, [selectedStudent.score, selectedStudent.id]);


    useEffect(() => {
        if (actualSubmissionId) {
            fetchData(actualSubmissionId);
        } else {
            setSubmission(null);
            setTeacherFeedbacks([]);
            setLoadingDetail(false);
            setErrorDetail(null);
        }
    }, [actualSubmissionId]);


    const fetchData = async (id: string) => {
        try {
            setLoadingDetail(true);
            setErrorDetail(null);

            const submissionData = await getSubmissionDetail(id);
            console.log("Fetched submission detail:", submissionData);
            setSubmission(submissionData);

            // Lấy feedback từ submission response
            const feedbacks = submissionData.submissionFeedbackResponse || [];
            setTeacherFeedbacks(feedbacks);

        } catch (err) {
            console.error("Error fetching detail data:", err);
            setErrorDetail("Không thể tải chi tiết bài nộp. Vui lòng kiểm tra kết nối API.");
            setSubmission(null);
        } finally {
            setLoadingDetail(false);
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

            const newFeedbackId = await addFeedbackTeacher(feedbackData);
            message.success("Thêm nhận xét thành công");

            const newFeedback: FeedbackTeacherResponse = {
                id: newFeedbackId,
                content: feedbackText,
                fullName: "Giáo viên hiện tại",
                createdDate: new Date().toISOString(),
                updatedDate: null
            };
            setTeacherFeedbacks(prev => [newFeedback, ...prev]);

            setFeedbackText("");
        } catch (err) {
            console.error("Error saving feedback:", err);
            message.error("Không thể lưu phản hồi");
        } finally {
            setSubmittingFeedback(false);
        }
    };

    const handleSaveScore = async () => {
        if (!actualSubmissionId || scoreInput === null || scoreInput < 0 || scoreInput > maxScore) {
            message.error(`Vui lòng nhập điểm số hợp lệ (0-${maxScore})`);
            return;
        }

        try {
            setSubmittingScore(true);
            await addScore(actualSubmissionId, scoreInput);
            message.success("Cập nhật điểm số thành công");

            setSubmission(prev => prev ? { ...prev, score: scoreInput } : null);
            onScoreUpdate(studentId, scoreInput);

        } catch (err) {
            console.error("Error saving score:", err);
            message.error("Không thể lưu điểm số");
        } finally {
            setSubmittingScore(false);
        }
    };

    if (!actualSubmissionId) {
        return (
            <div className="text-center p-12" style={{ backgroundColor: '#fffbe6', borderRadius: '8px', border: '1px solid #ffe58f' }}>
                <IoDocumentTextOutline className="text-5xl" style={{ color: '#faad14', margin: '0 auto 16px' }} />
                <p className="font-semibold" style={{ color: '#d48806' }}>Học viên {studentName} chưa nộp bài.</p>
                <p className="text-sm" style={{ color: '#d48806' }}>Không có nội dung chi tiết để chấm điểm.</p>
            </div>
        )
    }

    if (loadingDetail) {
        return (
            <div style={{ textAlign: "center", padding: "4rem" }}>
                <Spin size="large" />
                <div style={{ marginTop: 16 }}>
                    <Text>Đang tải chi tiết bài nộp...</Text>
                </div>
            </div>
        );
    }

    if (errorDetail || !submission) {
        return (
            <Alert
                message="Lỗi tải chi tiết bài nộp"
                description={errorDetail || "Không tìm thấy dữ liệu bài nộp chi tiết."}
                type="error"
                showIcon
            />
        );
    }

    return (
        <div className="submission-detail-inline">
            <div style={{ marginBottom: 24, borderBottom: '1px solid #e8e8e8', paddingBottom: 16 }}>
                <Title level={4} style={{ margin: '0 0 4px 0', color: '#1f1f1f' }}>
                    {submission.assignmentTitle}
                </Title>
            </div>

            <Row gutter={24}>
                <Col span={18}>
                    {(submission.descriptionModule || submission.descriptionAssignment) && (
                        <Collapse
                            accordion
                            defaultActiveKey={[]}
                            style={{ marginBottom: 16, borderRadius: '8px', overflow: 'hidden' }}
                            items={[
                                {
                                    key: '1',
                                    label: (
                                        <span style={{ fontWeight: 600, color: '#1890ff' }}>
                                            <InfoCircleOutlined style={{ marginRight: 8 }} />
                                            Thông tin đề bài/Module
                                            {submission.typeUml && <Tag color="green" style={{ marginLeft: 8 }}>{submission.typeUml}</Tag>}
                                        </span>
                                    ),
                                    children: (
                                        <div className="info-content" style={{ maxHeight: '300px', overflowY: 'auto', backgroundColor: '#f9f9f9', padding: '12px', borderRadius: '4px' }}>
                                            {submission.descriptionAssignment && (
                                                <div style={{ marginBottom: 15, borderBottom: '1px dashed #eee', paddingBottom: 10 }}>
                                                    <Text strong style={{ color: '#1890ff' }}>Đề bài:</Text>
                                                    <div dangerouslySetInnerHTML={{ __html: submission.descriptionAssignment || '' }} />
                                                </div>
                                            )}
                                            {submission.descriptionModule && (
                                                <div>
                                                    <Text strong style={{ color: '#52c41a' }}>Module:</Text>
                                                    <div dangerouslySetInnerHTML={{ __html: submission.descriptionModule || '' }} />
                                                </div>
                                            )}
                                        </div>
                                    )
                                }
                            ]}
                        />
                    )}

                    {submission.solutionCode && (
                        <Collapse
                            defaultActiveKey={[]}
                            style={{ marginBottom: 16, borderRadius: '8px', overflow: 'hidden' }}
                            items={[
                                {
                                    key: '1',
                                    label: (
                                        <span style={{ fontWeight: 600 }}>
                                            <FileTextOutlined style={{ marginRight: 8 }} />
                                            Đáp án tham khảo (Solution Code)
                                        </span>
                                    ),
                                    children: (
                                        <PlantUMLViewer code={submission.solutionCode} />
                                    )
                                }
                            ]}
                        />
                    )}

                    {/* Main Code Card - Student Code */}
                    <Card
                        title={
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <CodeOutlined style={{ color: '#1890ff' }} />
                                <span style={{ fontWeight: 600 }}>Mã PlantUML Bài làm</span>
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                    Nộp lúc: {dayjs(submission.createdDate).format("DD/MM/YYYY HH:mm")}
                                </Text>
                            </div>
                        }
                        style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', borderRadius: '8px' }}
                        bodyStyle={{ padding: '16px' }}
                    >
                        <PlantUMLViewer
                            code={submission.studentPlantUMLCode || "// Học viên không cung cấp mã PlantUML"}
                        />
                    </Card>
                </Col>

                <Col span={6}>
                    <div className="evaluation-panel">
                        {/* Header */}
                        <div className="evaluation-panel__header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <h3 className="evaluation-panel__title">Trạng thái:</h3>
                                <div className="evaluation-panel__header-content">
                                    {submission.score !== null ? (
                                        <>
                                            <span className="score-number">{submission.score}</span>
                                            <span className="score-divider">/</span>
                                            <span className="score-total">{maxScore}</span>
                                            <span className="status-spacer">•</span>
                                        </>
                                    ) : null}
                                    <span className="status-text">
                                        {submission.score !== null ? '✅ Đã chấm' : (selectedStudent.submitted ? '⏳ Chờ chấm' : '❌ Chưa nộp')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="evaluation-panel__content">
                            {/* Score Section */}
                            <div className="evaluation-panel__section">
                                <div className="evaluation-panel__section-title">
                                    Điểm số:
                                </div>
                                <div className="evaluation-panel__status">
                                    <div className="evaluation-panel__score-display">
                                        <div className="evaluation-panel__score-value">
                                            {submission.score !== null ? (
                                                <>
                                                    <span className="score-number">{submission.score}</span>
                                                    <span className="score-divider">/</span>
                                                    <span className="score-total">{maxScore}</span>
                                                </>
                                            ) : (
                                                <span className="score-empty">--</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="evaluation-panel__section evaluation-panel__section--score-input">
                                    <div className="evaluation-panel__score-input">
                                        <Input
                                            type="number"
                                            min={0}
                                            max={maxScore}
                                            step={0.1}
                                            value={scoreInput !== null ? scoreInput : undefined}
                                            onChange={(e) => setScoreInput(Number(e.target.value))}
                                            placeholder="Nhập điểm"
                                            onPressEnter={handleSaveScore}
                                        />
                                        <Button
                                            type="primary"
                                            onClick={handleSaveScore}
                                            loading={submittingScore}
                                            disabled={scoreInput === null || scoreInput < 0 || scoreInput > maxScore}
                                        >
                                            Lưu
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Feedback Section */}
                            <div className="evaluation-panel__section">
                                <div className="evaluation-panel__section-title">
                                    Nhận xét:
                                </div>
                                <div className="evaluation-panel__feedback-section">
                                    {/* Display existing feedback */}
                                    {teacherFeedbacks.length > 0 ? (
                                        <div className="evaluation-panel__feedback-list">
                                            {teacherFeedbacks.map((feedback) => (
                                                <div key={feedback.id} className="evaluation-panel__feedback-item">
                                                    <div className="evaluation-panel__comment-header">
                                                        <Avatar 
                                                            size={32} 
                                                            src={feedback.imageUrl} 
                                                            icon={!feedback.imageUrl && <UserOutlined />}
                                                            style={{ backgroundColor: '#1890ff' }}
                                                        />
                                                        <div className="evaluation-panel__comment-user-info">
                                                            <Text className="evaluation-panel__comment-user-name">
                                                                {feedback.fullName || 'Giáo viên'}
                                                            </Text>
                                                            <Text className="evaluation-panel__comment-date">
                                                                {feedback.createdDate ? new Date(feedback.createdDate).toLocaleString('vi-VN') : ''}
                                                            </Text>
                                                        </div>
                                                    </div>
                                                    <Text className="evaluation-panel__comment-content">
                                                        {feedback.content}
                                                    </Text>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="evaluation-panel__empty-feedback">
                                            <Text style={{ color: '#8c8c8c', fontSize: '13px' }}>
                                                Chưa có nhận xét nào. Hãy thêm nhận xét đầu tiên!
                                            </Text>
                                        </div>
                                    )}

                                    {/* Input for new feedback - outside the feedback list */}
                                    <div className="evaluation-panel__feedback-input-container">
                                        <Input.TextArea
                                            value={feedbackText}
                                            onChange={(e) => setFeedbackText(e.target.value)}
                                            placeholder="Nhập nhận xét chi tiết cho học viên..."
                                            rows={2}
                                            maxLength={500}
                                            style={{
                                                resize: 'none',
                                                borderRadius: '6px',
                                                border: '1px solid #d9d9d9',
                                                marginBottom: '8px'
                                            }}
                                        />
                                        <div style={{ 
                                            display: 'flex', 
                                            justifyContent: 'space-between', 
                                            alignItems: 'center' 
                                        }}>
                                            <Text style={{ fontSize: '12px', color: '#8c8c8c' }}>
                                                {feedbackText.length}/500 ký tự
                                            </Text>
                                            <Button
                                                type="primary"
                                                size="small"
                                                onClick={handleSaveFeedback}
                                                loading={submittingFeedback}
                                                disabled={!feedbackText.trim() || submittingFeedback}
                                                style={{
                                                    borderRadius: '6px'
                                                }}
                                            >
                                                {submittingFeedback ? 'Đang lưu...' : 'Gửi nhận xét'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Col>
            </Row>
        </div>
    );
});

export default SubmissionDetailViewer;