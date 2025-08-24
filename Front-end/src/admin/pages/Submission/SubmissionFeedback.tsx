import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import {
    getSubmissionDetail,
    getFeedbackAI,
    getFeedbackTeacher,
    addFeedbackTeacher,
    updateFeedbackTeacher,
    addScore,
    type SubmissionDetailResponse,
    type FeedbackAIResponse,
    type FeedbackTeacherResponse,
    type FeedbackTeacherRequest
} from "../../../shared/services/submissionService.ts";
import "./SubmissionFeedback.scss";

const STATUS_CLASS: Record<
    SubmissionDetailResponse["submissionStatus"],
    "gray" | "blue" | "green" | "orange" | "red"
> = {
    SUBMITTED: "gray",
    PROCESSING: "blue",
    COMPLETED: "green",
    REVIEWED: "green",
    FAILED: "red",
};

// Helper function to render AI feedback nicely
const renderAIFeedback = (feedback: { [key: string]: any }) => {
    try {
        // Check if it's already a parsed object
        const feedbackData = typeof feedback === 'string' ? JSON.parse(feedback) : feedback;

        return (
            <div className="sf-ai-feedback-content">
                {/* Render each key-value pair in feedback */}
                {Object.entries(feedbackData).map(([key, value]) => {
                    // Skip rendering if value is null or undefined
                    if (value === null || value === undefined) return null;

                    // Handle different value types
                    if (Array.isArray(value)) {
                        // Array values - render as list
                        return (
                            <div key={key} className="sf-feedback-section">
                                <h4>{key}:</h4>
                                <ul className="sf-feedback-list">
                                    {value.map((item: any, index: number) => (
                                        <li key={index} className="sf-feedback-item">
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
                            <div key={key} className="sf-feedback-section">
                                <h4>{key}:</h4>
                                <div className="sf-feedback-nested">
                                    <pre style={{
                                        whiteSpace: 'pre-wrap',
                                        fontSize: '13px',
                                        background: '#f8fafc',
                                        padding: '8px 12px',
                                        borderRadius: '4px',
                                        border: '1px solid #e2e8f0'
                                    }}>
                                        {JSON.stringify(value, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        );
                    } else {
                        // Primitive values (string, number, boolean) - tất cả đều hiển thị giống nhau
                        return (
                            <div key={key} className="sf-feedback-section">
                                <h4>{key}:</h4>
                                <div className="sf-feedback-value">
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
            <div className="sf-feedback-text">
                <pre style={{ whiteSpace: 'pre-wrap', fontSize: '14px', background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
                    {typeof feedback === 'string' ? feedback : JSON.stringify(feedback, null, 2)}
                </pre>
            </div>
        );
    }
};

const SubmissionFeedback: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // States for submission data
    const [submissionData, setSubmissionData] = useState<SubmissionDetailResponse | null>(null);
    const [aiFeedback, setAiFeedback] = useState<FeedbackAIResponse | null>(null);
    const [teacherFeedback, setTeacherFeedback] = useState<FeedbackTeacherResponse | null>(null);
    const [aiLoading, setAiLoading] = useState(true);
    const [aiError, setAiError] = useState<string | null>(null);
    const [teacherFeedbackLoading, setTeacherFeedbackLoading] = useState(true);

    // Loading and error states
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [submittingFeedback, setSubmittingFeedback] = useState(false);

    // Form states
    const [isEditing, setIsEditing] = useState(false);
    const [feedbackForm, setFeedbackForm] = useState({
        content: "",
        score: "",
        comments: ""
    });

    // Score states
    const [isEditingScore, setIsEditingScore] = useState(false);
    const [scoreForm, setScoreForm] = useState("");
    const [submittingScore, setSubmittingScore] = useState(false);

    // Helper function to get score class based on score value
    const getScoreClass = (score: number): string => {
        if (score >= 8) return 'sf-score--excellent'; // Xanh lá cho điểm >= 8
        if (score >= 5) return 'sf-score--good';      // Vàng cam cho điểm 5-7.9
        return 'sf-score--poor';                       // Đỏ hồng cho điểm < 5
    };

    const createdAt = useMemo(() => {
        if (!submissionData?.createdDate) return "";
        return dayjs(submissionData.createdDate).format("YYYY-MM-DD HH:mm");
    }, [submissionData]);

    const statusTone = submissionData ? STATUS_CLASS[submissionData.submissionStatus] : "gray";

    // Fetch all data
    useEffect(() => {
        let mounted = true;

        const fetchData = async () => {
            if (!id) {
                setError("ID bài nộp không hợp lệ");
                setLoading(false);
                return;
            }

            try {
                // Fetch submission details
                console.log(`Fetching submission detail for ID: ${id}`);
                const submissionResponse = await getSubmissionDetail(id);
                if (mounted) {
                    setSubmissionData(submissionResponse);
                    console.log("Submission data loaded:", submissionResponse);
                }

                // Fetch AI feedback
                setAiLoading(true);
                try {
                    console.log(`Fetching AI feedback for submission ID: ${id}`);
                    const aiResponse = await getFeedbackAI(id);
                    if (mounted) {
                        setAiFeedback(aiResponse);
                        setAiError(null);
                        console.log("AI feedback loaded:", aiResponse);
                    }
                } catch (aiError: any) {
                    console.warn("Lỗi khi tải AI feedback:", aiError);
                    if (mounted) {
                        setAiError("Chưa có phản hồi từ AI hoặc AI đang xử lý");
                    }
                } finally {
                    if (mounted) {
                        setAiLoading(false);
                    }
                }

                // Fetch teacher feedback
                setTeacherFeedbackLoading(true);
                try {
                    console.log(`Fetching teacher feedback for submission ID: ${id}`);
                    const teacherResponse = await getFeedbackTeacher(id);
                    if (mounted) {
                        setTeacherFeedback(teacherResponse);
                        setFeedbackForm({
                            content: teacherResponse.feedback || "", // Sử dụng "feedback" thay vì "content"
                            score: "", // Backend không có score
                            comments: "" // Backend không có comments
                        });
                        console.log("Teacher feedback loaded:", teacherResponse);
                    }
                } catch (teacherError: any) {
                    console.warn("Chưa có phản hồi từ giảng viên:", teacherError);
                    // Nếu chưa có feedback từ teacher, set isEditing = true để hiển thị form
                    if (mounted) {
                        setTeacherFeedback(null);
                        setIsEditing(true); // Tự động hiển thị form tạo feedback mới
                        setFeedbackForm({
                            content: "",
                            score: "",
                            comments: ""
                        });
                    }
                } finally {
                    if (mounted) {
                        setTeacherFeedbackLoading(false);
                    }
                }

                if (mounted) {
                    setLoading(false);
                }
            } catch (e) {
                console.error("Lỗi khi tải dữ liệu:", e);
                if (mounted) {
                    setError("Không thể tải dữ liệu");
                    setLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            mounted = false;
        };
    }, [id]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFeedbackForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmitFeedback = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id || !feedbackForm.content.trim()) return;

        setSubmittingFeedback(true);
        try {
            const feedbackData: FeedbackTeacherRequest = {
                submissionId: parseInt(id),
                content: feedbackForm.content,
                score: feedbackForm.score ? parseFloat(feedbackForm.score) : undefined,
                comments: feedbackForm.comments || undefined
            };

            if (teacherFeedback?.id) {
                // Update existing feedback
                console.log(`Updating teacher feedback ID: ${teacherFeedback.id}`, feedbackData);
                await updateFeedbackTeacher(teacherFeedback.id, feedbackData);
            } else {
                // Create new feedback
                console.log("Creating new teacher feedback:", feedbackData);
                await addFeedbackTeacher(feedbackData);
            }

            setIsEditing(false);

            // Refresh the teacher feedback
            try {
                const refreshedFeedback = await getFeedbackTeacher(id);
                setTeacherFeedback(refreshedFeedback);
                setFeedbackForm({
                    content: refreshedFeedback.feedback || "", // Sử dụng "feedback" thay vì "content"
                    score: "", // Backend không có score
                    comments: "" // Backend không có comments
                });
            } catch (refreshError) {
                console.warn("Không thể refresh teacher feedback:", refreshError);
            }

        } catch (error) {
            console.error("Lỗi khi gửi phản hồi:", error);
            setError("Không thể gửi phản hồi");
        } finally {
            setSubmittingFeedback(false);
        }
    };

    const handleEditToggle = () => {
        if (isEditing) {
            // Reset form to current values when canceling
            if (teacherFeedback) {
                setFeedbackForm({
                    content: teacherFeedback.feedback || "", // Sử dụng "feedback" thay vì "content"
                    score: "", // Backend không có score
                    comments: "" // Backend không có comments
                });
            } else {
                // If no existing feedback, reset to empty
                setFeedbackForm({
                    content: "",
                    score: "",
                    comments: ""
                });
            }
        }
        setIsEditing(!isEditing);
    };

    // Score handlers
    const handleScoreSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id || !scoreForm.trim()) return;

        setSubmittingScore(true);
        try {
            const score = parseFloat(scoreForm);
            console.log(`Submitting score ${score} for submission ID: ${id}`);

            await addScore(id, score);

            // Refresh submission data to get updated score
            const refreshedSubmission = await getSubmissionDetail(id);
            setSubmissionData(refreshedSubmission);

            setIsEditingScore(false);
            setScoreForm("");

            console.log("Score submitted successfully");
        } catch (error) {
            console.error("Lỗi khi chấm điểm:", error);
            setError("Không thể gửi điểm số");
        } finally {
            setSubmittingScore(false);
        }
    };

    const handleScoreEditToggle = () => {
        if (isEditingScore) {
            // Reset score form when canceling
            setScoreForm(submissionData?.score?.toString() || "");
        } else {
            // Set current score or empty when starting to edit
            setScoreForm(submissionData?.score?.toString() || "");
        }
        setIsEditingScore(!isEditingScore);
    };

    if (loading) {
        return (
            <div className="sf-container">
                <div className="sf-skeleton">Đang tải...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="sf-container">
                <div className="sf-error">{error}</div>
            </div>
        );
    }

    if (!submissionData) return null;

    return (
        <div className="sf-container">
            <div className="sf-header">
                <button
                    className="sf-back"
                    onClick={() => navigate(-1)}
                    aria-label="Quay lại"
                >
                    ← Quay lại
                </button>
                <h1 className="sf-title">Phản hồi bài nộp #{submissionData.id}</h1>
            </div>

            <div className="sf-grid">
                {/* Student Information */}
                <div className="sf-card">
                    <div className="sf-card__header">Thông tin sinh viên</div>
                    <div className="sf-row">
                        <div className="sf-label">Tên sinh viên</div>
                        <div className="sf-value">{submissionData.studentName}</div>
                    </div>
                    <div className="sf-row">
                        <div className="sf-label">Mã sinh viên</div>
                        <div className="sf-value">{submissionData.studentCode}</div>
                    </div>
                    <div className="sf-row">
                        <div className="sf-label">Lớp</div>
                        <div className="sf-value">{submissionData.classCode}</div>
                    </div>
                </div>

                {/* Submission Information */}
                <div className="sf-card">
                    <div className="sf-card__header">Thông tin bài nộp</div>
                    <div className="sf-row">
                        <div className="sf-label">Bài tập</div>
                        <div className="sf-value">{submissionData.assignmentTitle}</div>
                    </div>
                    <div className="sf-row">
                        <div className="sf-label">Loại UML</div>
                        <div className="sf-value">{submissionData.typeUml}</div>
                    </div>
                    <div className="sf-row">
                        <div className="sf-label">Ngày tạo</div>
                        <div className="sf-value">{createdAt}</div>
                    </div>
                    <div className="sf-row">
                        <div className="sf-label">Trạng thái</div>
                        <div className={`sf-badge sf-badge--${statusTone}`}>
                            {submissionData.submissionStatus}
                        </div>
                    </div>
                </div>

                {/* AI Feedback */}
                <div className="sf-card sf-card--full">
                    <div className="sf-card__header">Phản hồi từ AI</div>
                    {aiLoading ? (
                        <div className="sf-feedback-loading">
                            <p>Đang tải phản hồi từ AI...</p>
                        </div>
                    ) : aiError ? (
                        <div className="sf-feedback-error">
                            <p>{aiError}</p>
                            <small>Bài nộp có thể chưa được AI xử lý hoặc đang trong quá trình phân tích.</small>
                        </div>
                    ) : aiFeedback ? (
                        <div className="sf-feedback-content">
                            <div className="sf-feedback-meta">
                                <span className="sf-feedback-author">{aiFeedback.aiModalName || 'AI Assistant'}</span>
                                <span className="sf-feedback-id">ID: {aiFeedback.id}</span>
                            </div>

                            {/* Hiển thị feedback Map từ Backend */}
                            {renderAIFeedback(aiFeedback.feedback)}
                        </div>
                    ) : (
                        <div className="sf-feedback-empty">
                            <p>Chưa có phản hồi từ AI</p>
                            <small>Bài nộp chưa được AI phân tích hoặc đang trong hàng đợi xử lý.</small>
                        </div>
                    )}
                </div>

                {/* Teacher Feedback */}
                <div className="sf-card sf-card--full">
                    <div className="sf-card__header sf-card__header--row">
                        <span>Phản hồi từ giảng viên</span>
                        {teacherFeedback && (
                            <button
                                className="sf-btn sf-btn--primary"
                                onClick={handleEditToggle}
                                disabled={submittingFeedback}
                            >
                                {isEditing ? "Hủy" : "Chỉnh sửa"}
                            </button>
                        )}
                    </div>

                    {teacherFeedbackLoading ? (
                        <div className="sf-feedback-loading">
                            <p>Đang tải phản hồi từ giảng viên...</p>
                        </div>
                    ) : teacherFeedback && !isEditing ? (
                        <div className="sf-feedback-content">
                            <div className="sf-feedback-meta">
                                <span className="sf-feedback-author">Giảng viên</span>
                                <span className="sf-feedback-date">
                                    {dayjs(teacherFeedback.createdDate).format("YYYY-MM-DD HH:mm")}
                                </span>
                                {teacherFeedback.updatedDate && (
                                    <span className="sf-feedback-updated">
                                        (Cập nhật: {dayjs(teacherFeedback.updatedDate).format("YYYY-MM-DD HH:mm")})
                                    </span>
                                )}
                                {teacherFeedback.score && (
                                    <span className={`sf-feedback-score ${getScoreClass(teacherFeedback.score)}`}>Điểm: {teacherFeedback.score}/10</span>
                                )}
                            </div>
                            {/* Sử dụng "feedback" từ Backend thay vì "content" */}
                            <div className="sf-feedback-text">{teacherFeedback.feedback}</div>
                        </div>
                    ) : (
                        <form className="sf-feedback-form" onSubmit={handleSubmitFeedback}>
                            <div className="sf-form-group">
                                <label htmlFor="content">Nội dung phản hồi *</label>
                                <textarea
                                    id="content"
                                    name="content"
                                    value={feedbackForm.content}
                                    onChange={handleInputChange}
                                    placeholder="Nhập phản hồi của bạn tại đây..."
                                    rows={6}
                                    required
                                />
                            </div>

                            <div className="sf-form-actions">
                                <button
                                    type="submit"
                                    className="sf-btn sf-btn--primary"
                                    disabled={submittingFeedback || !feedbackForm.content.trim()}
                                >
                                    {submittingFeedback ? "Đang gửi..." : (teacherFeedback ? "Cập nhật phản hồi" : "Gửi phản hồi")}
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Score Section - Khu vực chấm điểm riêng biệt - Di chuyển xuống dưới */}
                <div className="sf-card sf-card--full">
                    <div className="sf-card__header sf-card__header--row">
                        <span>Chấm điểm</span>
                        <button
                            className="sf-btn sf-btn--primary"
                            onClick={handleScoreEditToggle}
                            disabled={submittingScore}
                        >
                            {isEditingScore ? "Hủy" : (submissionData?.score ? "Sửa điểm" : "Chấm điểm")}
                        </button>
                    </div>

                    {submissionData?.score && !isEditingScore ? (
                        <div className="sf-score-content">
                            <div className="sf-score-display">
                                <span className="sf-score-label">Điểm số:</span>
                                <span className={`sf-score-value ${getScoreClass(submissionData.score)}`}>
                                    {submissionData.score}/10
                                </span>
                            </div>
                        </div>
                    ) : !submissionData?.score && !isEditingScore ? (
                        <div className="sf-score-empty">
                            <p>Chưa có điểm số</p>
                            <small>Nhấn "Chấm điểm" để thêm điểm cho bài nộp này.</small>
                        </div>
                    ) : (
                        <form className="sf-score-form" onSubmit={handleScoreSubmit}>
                            <div className="sf-form-group">
                                <label htmlFor="scoreInput">Điểm số (0-10) *</label>
                                <input
                                    id="scoreInput"
                                    type="number"
                                    min="0"
                                    max="10"
                                    step="0.1"
                                    value={scoreForm}
                                    onChange={(e) => setScoreForm(e.target.value)}
                                    placeholder="Nhập điểm từ 0 đến 10"
                                    required
                                />
                            </div>
                            <div className="sf-form-actions">
                                <button
                                    type="submit"
                                    className="sf-btn sf-btn--primary"
                                    disabled={submittingScore || !scoreForm.trim()}
                                >
                                    {submittingScore ? "Đang gửi..." : "Lưu điểm"}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SubmissionFeedback;

