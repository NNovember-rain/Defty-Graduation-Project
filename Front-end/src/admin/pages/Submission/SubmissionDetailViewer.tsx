import React, { useEffect, useState, memo } from "react";
import { Button, Card, Row, Col, Typography, Tag, Input, message, Spin, Alert, Avatar, Collapse } from "antd";
import { MessageOutlined, UserOutlined, InfoCircleOutlined, FileTextOutlined, CodeOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import PlantUMLViewer from "../../components/PlantUMLViewer";
import {
    getSubmissionDetail,
    getFeedbackTeacher,
    addFeedbackTeacher,
    addScore,
    type ISubmissionDetail,
    type FeedbackTeacherResponse,
    type FeedbackTeacherRequest,
} from "../../../shared/services/submissionService.ts";
import { IoDocumentTextOutline } from 'react-icons/io5'
import TextArea from "antd/es/input/TextArea";

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

    const [isEditingFeedback, setIsEditingFeedback] = useState(false);
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

            try {
                const teacherFeedbackData = await getFeedbackTeacher(id);
                setTeacherFeedbacks(teacherFeedbackData || []);
                setIsEditingFeedback(!teacherFeedbackData || teacherFeedbackData.length === 0);
            } catch (err) {
                console.log("No teacher feedback available or error during fetch:", err);
                setTeacherFeedbacks([]);
                setIsEditingFeedback(true);
            }

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
            };
            setTeacherFeedbacks(prev => [newFeedback, ...prev]);

            setIsEditingFeedback(false);
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

    const getScoreColor = (score: number | null | undefined) => {
        if (score === null || score === undefined) return "#d9d9d9";
        if (score >= maxScore * 0.8) return "#52c41a";
        if (score >= maxScore * 0.5) return "#faad14";
        return "#ff4d4f";
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
                    <Card
                        title={<span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1890ff' }}><MessageOutlined /> Đánh giá Bài nộp</span>}
                        style={{ backgroundColor: '#fafafa', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)' }}
                        bodyStyle={{ padding: '16px' }}
                    >
                        <div style={{ marginBottom: 16, textAlign: 'center', borderBottom: '1px solid #f0f0f0', paddingBottom: 16 }}>
                            <Tag
                                color={submission.score !== null ? 'success' : (selectedStudent.submitted ? 'warning' : 'error')}
                                style={{ fontSize: '14px', padding: '4px 12px', fontWeight: 'bold' }}
                            >
                                {submission.score !== null ? 'ĐÃ CHẤM' : (selectedStudent.submitted ? 'CHỜ CHẤM' : 'CHƯA NỘP')}
                            </Tag>
                        </div>

                        <div style={{ marginBottom: 20, border: '1px solid #d9d9d9', padding: '12px', borderRadius: '6px', backgroundColor: '#fff' }}>
                            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 600 }}>Điểm số</h4>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                <span style={{ fontSize: '36px', fontWeight: 'bolder', color: getScoreColor(submission.score) }}>
                                    {submission.score !== null ? submission.score : "--"}
                                </span>
                                <span style={{ fontSize: '20px', color: '#888' }}>/{maxScore}</span>
                            </div>

                            <div style={{ display: 'flex', gap: '8px' }}>
                                <Input
                                    type="number"
                                    min={0}
                                    max={maxScore}
                                    step={0.1}
                                    value={scoreInput !== null ? scoreInput : undefined}
                                    onChange={(e) => setScoreInput(Number(e.target.value))}
                                    placeholder={`Điểm`}
                                    style={{ flex: 1, borderRadius: '4px' }}
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

                        {/* Feedback Section */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Nhận xét</h4>
                                {!isEditingFeedback && (
                                    <Button size="small" type="dashed" onClick={() => setIsEditingFeedback(true)}>
                                        Thêm
                                    </Button>
                                )}
                            </div>

                            {isEditingFeedback && (
                                <div style={{ marginBottom: 15, border: '1px solid #bae0ff', padding: '10px', borderRadius: '6px', backgroundColor: '#e6f7ff' }}>
                                    <TextArea
                                        value={feedbackText}
                                        onChange={(e) => setFeedbackText(e.target.value)}
                                        placeholder="Nhập nhận xét chi tiết..."
                                        rows={4}
                                        style={{ marginBottom: '8px' }}
                                    />
                                    <div style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                        <Button
                                            size="small"
                                            onClick={() => { setIsEditingFeedback(false); setFeedbackText(""); }}
                                        >
                                            Hủy
                                        </Button>
                                        <Button
                                            type="primary"
                                            size="small"
                                            onClick={handleSaveFeedback}
                                            loading={submittingFeedback}
                                        >
                                            Lưu
                                        </Button>
                                    </div>
                                </div>
                            )}

                            <div className="feedback-list" style={{ maxHeight: '40vh', overflowY: 'auto' }}>
                                {teacherFeedbacks.length > 0 ? (
                                    teacherFeedbacks.map((feedback) => (
                                        <div key={feedback.id} style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #f0f0f0' }}>
                                            <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '8px' }}>
                                                <Avatar size={32} src={feedback.avatar} icon={<UserOutlined />} style={{ marginRight: '10px', flexShrink: 0 }} />
                                                <div style={{ fontSize: '13px', lineHeight: 1.4, flexGrow: 1 }}>
                                                    <span style={{ fontWeight: 'bold', color: '#1890ff' }}>{feedback.fullName || 'Giáo viên'}</span>
                                                    <br/>
                                                    <Text type="secondary" style={{ fontSize: '11px' }}>{dayjs(feedback.createdDate).format("DD/MM/YY HH:mm")}</Text>
                                                </div>
                                            </div>
                                            <div style={{ fontSize: '14px', margin: 0, padding: '8px 10px', backgroundColor: '#f5f5f5', borderRadius: '4px', whiteSpace: 'pre-wrap' }}>
                                                {feedback.content}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p style={{ fontSize: '14px', color: '#999', textAlign: 'center', paddingTop: 10 }}>Chưa có nhận xét nào.</p>
                                )}
                            </div>
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    );
});

export default SubmissionDetailViewer;