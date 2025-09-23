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
    type FeedbackTeacherRequest,
    JsonObject,
    JsonValue
} from "../../../shared/services/submissionService.ts";
import "./SubmissionDetail.scss";

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
// Enhanced AI feedback renderer for nested JSON structure
const renderAIFeedback = (feedbackInput: unknown): React.ReactNode => {
    try {
        let raw: JsonObject | null = null;
        if (typeof feedbackInput === 'string') {
            try { raw = JSON.parse(feedbackInput) as JsonObject; } catch { raw = null; }
        } else if (feedbackInput && typeof feedbackInput === 'object') {
            raw = feedbackInput as JsonObject; // assume backend shape
        }
        if (!raw) {
            return <div className="sd-ai-feedback-empty">Không có dữ liệu hợp lệ</div>;
        }

        type Severity = 'error' | 'warning' | 'success' | 'suggestion' | 'info';

        const formatKey = (k: string) => k
            .replace(/([A-Z])/g, ' $1')
            .replace(/_/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .replace(/^./, c => c.toUpperCase());

        const getIcon = (k: string): string => {
            const kl = k.toLowerCase();
            if (/(error|lỗi)/.test(kl)) return '❌';
            if (/(warn|cảnh|warning)/.test(kl)) return '⚠️';
            if (/(success|điểm|score|ok|passed)/.test(kl)) return '✅';
            if (/(suggest|gợi|đề xuất|improve)/.test(kl)) return '💡';
            if (/(stat|tổng|summary)/.test(kl)) return '📊';
            return '📁';
        };

        const getSeverity = (k: string, v: JsonValue): Severity => {
            const baseStr = `${k} ${typeof v === 'string' ? v : ''}`.toLowerCase();
            if (/(error|lỗi)/.test(baseStr)) return 'error';
            if (/(warn|cảnh)/.test(baseStr)) return 'warning';
            if (/(success|pass|đạt|tốt)/.test(baseStr)) return 'success';
            if (/(suggest|gợi|đề xuất)/.test(baseStr)) return 'suggestion';
            return 'info';
        };

        const renderPrimitive = (k: string, v: Exclude<JsonValue, JsonObject | JsonValue[]>, idx: number) => {
            const sev = getSeverity(k, v);
            return (
                <div key={idx} className={`sd-ai-row sd-ai-row--${sev}`}>
                    <div className="sd-ai-row-key">{formatKey(k)}</div>
                    <div className="sd-ai-row-value">{String(v)}</div>
                </div>
            );
        };

        const renderArray = (arr: JsonValue[], parentKey: string) => {
            if (arr.length === 0) return <div className="sd-ai-empty">Không có mục</div>;
            return (
                <ul className="sd-ai-list">
                    {arr.map((item, idx) => {
                        if (item && typeof item === 'object' && !Array.isArray(item)) {
                            const obj = item as JsonObject;
                            const flatEntries = Object.entries(obj);
                            return (
                                <li key={idx} className="sd-ai-list-item sd-ai-list-item--object">
                                    {flatEntries.map(([k, v]) => (
                                        <div key={k} className="sd-ai-mini-row">
                                            <span className="sd-ai-mini-key">{formatKey(k)}:</span>
                                            <span className="sd-ai-mini-value">{typeof v === 'object' ? JSON.stringify(v, null, 0) : String(v)}</span>
                                        </div>
                                    ))}
                                </li>
                            );
                        }
                        const sev = getSeverity(parentKey, item as JsonValue);
                        return (
                            <li key={idx} className={`sd-ai-list-item sd-ai-list-item--${sev}`}>
                                {typeof item === 'object' ? JSON.stringify(item) : String(item)}
                            </li>
                        );
                    })}
                </ul>
            );
        };

        const renderObjectLevel2 = (obj: JsonObject) => {
            const entries = Object.entries(obj);
            if (!entries.length) return <div className="sd-ai-empty">Không có dữ liệu</div>;
            return (
                <div className="sd-ai-subgrid">
                    {entries.map(([k, v]) => {
                        if (Array.isArray(v)) {
                            return (
                                <div key={k} className="sd-ai-subsection">
                                    <div className="sd-ai-subsection-title">{formatKey(k)}</div>
                                    {renderArray(v as JsonValue[], k)}
                                </div>
                            );
                        }
                        if (v && typeof v === 'object') {
                            return (
                                <div key={k} className="sd-ai-subsection">
                                    <div className="sd-ai-subsection-title">{formatKey(k)}</div>
                                    <pre className="sd-ai-json">{JSON.stringify(v, null, 2)}</pre>
                                </div>
                            );
                        }
                        return (
                            <div key={k} className="sd-ai-subsection sd-ai-subsection--row">
                                <span className="sd-ai-mini-key">{formatKey(k)}:</span>
                                <span className="sd-ai-mini-value">{String(v)}</span>
                            </div>
                        );
                    })}
                </div>
            );
        };

        return (
            <div className="sd-ai-feedback">
                {Object.entries(raw).map(([key, value]) => {
                    const icon = getIcon(key);
                    const severity = getSeverity(key, value as JsonValue);
                    let bodyContent: React.ReactNode;
                    if (Array.isArray(value)) {
                        bodyContent = renderArray(value as JsonValue[], key);
                    } else if (value && typeof value === 'object') {
                        bodyContent = renderObjectLevel2(value as JsonObject);
                    } else {
                        bodyContent = renderPrimitive(key, value as Exclude<JsonValue, JsonObject | JsonValue[]>, 0);
                    }
                    return (
                        <div key={key} className={`sd-ai-block sd-ai-block--${severity}`}>
                            <div className="sd-ai-block-header">
                                <span className="sd-ai-block-icon" aria-hidden>{icon}</span>
                                <h4 className="sd-ai-block-title">{formatKey(key)}</h4>
                            </div>
                            <div className="sd-ai-block-body">{bodyContent}</div>
                        </div>
                    );
                })}
            </div>
        );
    } catch (error) {
        return (
            <div className="sd-ai-feedback-error">
                <div className="sd-ai-block sd-ai-block--error">
                    <div className="sd-ai-block-header">
                        <span className="sd-ai-block-icon">⚠️</span>
                        <h4 className="sd-ai-block-title">Lỗi định dạng</h4>
                    </div>
                    <div className="sd-ai-block-body">
                        Không thể phân tích phản hồi AI.
                        <pre className="sd-ai-json">{typeof feedbackInput === 'string' ? feedbackInput : JSON.stringify(feedbackInput, null, 2)}</pre>
                    </div>
                </div>
            </div>
        );
    }
};
const SubmissionDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // Get initial tab from URL params - simplified
    const initialTab = new URLSearchParams(window.location.search).get('tab') as 'overview' | 'code' | 'feedback' || 'overview';

    // Tab state
    const [activeTab, setActiveTab] = useState<'overview' | 'code' | 'feedback'>(initialTab);

    // Data states
    const [data, setData] = useState<SubmissionDetailResponse | null>(null);
    const [aiFeedback, setAiFeedback] = useState<FeedbackAIResponse | null>(null);
    const [teacherFeedback, setTeacherFeedback] = useState<FeedbackTeacherResponse | null>(null);

    // Loading states - simplified
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    // Form states
    const [isEditingFeedback, setIsEditingFeedback] = useState(false);
    const [isEditingScore, setIsEditingScore] = useState(false);
    const [submittingFeedback, setSubmittingFeedback] = useState(false);
    const [submittingScore, setSubmittingScore] = useState(false);

    const [feedbackForm, setFeedbackForm] = useState({
        content: ""
    });
    const [scoreForm, setScoreForm] = useState("");

    const createdAt = useMemo(() => {
        if (!data?.createdDate) return "";
        return dayjs(data.createdDate).format("DD/MM/YYYY HH:mm");
    }, [data]);

    const getScoreClass = (score: number): string => {
        if (score >= 8) return 'sd-score--excellent';
        if (score >= 5) return 'sd-score--good';
        return 'sd-score--poor';
    };

    // Fetch all data
    useEffect(() => {
        let mounted = true;

        const fetchData = async () => {
            if (!id) {
                setErr("ID bài nộp không hợp lệ");
                setLoading(false);
                return;
            }

            try {
                const submissionResponse = await getSubmissionDetail(id);
                if (mounted) {
                    setData(submissionResponse);
                }

                // Fetch AI feedback (optional)
                let aiResponse: FeedbackAIResponse | null = null;
                try { aiResponse = await getFeedbackAI(id); } catch { /* ignore */ }

                // Fetch Teacher feedback (optional)
                let teacherResponse: FeedbackTeacherResponse | null = null;
                try { teacherResponse = await getFeedbackTeacher(id); } catch { /* ignore */ }

                if (mounted) {
                    setAiFeedback(aiResponse as FeedbackAIResponse | null);
                    setTeacherFeedback(teacherResponse as FeedbackTeacherResponse | null);

                    if (teacherResponse) {
                        const teacherContent = typeof teacherResponse.feedback === 'string' ? teacherResponse.feedback : '';
                        setFeedbackForm({
                            content: teacherContent
                        });
                    } else {
                        setIsEditingFeedback(true);
                    }

                    setLoading(false);
                }
            } catch (e) {
                console.error(e);
                if (mounted) {
                    setErr("Không tải được dữ liệu");
                    setLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            mounted = false;
        };
    }, [id]);

    const handleCopy = (text?: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text).catch(() => {});
    };

    const handleFeedbackSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id || !feedbackForm.content.trim()) return;

        setSubmittingFeedback(true);
        try {
            const feedbackData: FeedbackTeacherRequest = {
                submissionId: parseInt(id),
                content: feedbackForm.content
            };

            if (teacherFeedback?.id) {
                await updateFeedbackTeacher(teacherFeedback.id, feedbackData);
            } else {
                await addFeedbackTeacher(feedbackData);
            }

            setIsEditingFeedback(false);

            // Refresh teacher feedback
            const refreshedFeedback = await getFeedbackTeacher(id);
            setTeacherFeedback(refreshedFeedback);
            setFeedbackForm({
                content: refreshedFeedback.feedback || ""
            });
        } catch (error) {
            console.error("Lỗi khi gửi phản hồi:", error);
            setErr("Không thể gửi phản hồi");
        } finally {
            setSubmittingFeedback(false);
        }
    };

    const handleScoreSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id || !scoreForm.trim()) return;

        setSubmittingScore(true);
        try {
            const score = parseFloat(scoreForm);
            await addScore(id, score);

            const refreshedSubmission = await getSubmissionDetail(id);
            setData(refreshedSubmission);
            setIsEditingScore(false);
            setScoreForm("");
        } catch (error) {
            console.error("Lỗi khi chấm điểm:", error);
            setErr("Không thể gửi điểm số");
        } finally {
            setSubmittingScore(false);
        }
    };

    if (loading) {
        return (
            <div className="sd-container">
                <div className="sd-loading">
                    <div className="sd-spinner"></div>
                    <p>Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    if (err) {
        return (
            <div className="sd-container">
                <div className="sd-error">
                    <p>{err}</p>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const statusTone = STATUS_CLASS[data.submissionStatus];

    return (
        <div className="sd-container">
            {/* Header */}
            <div className="sd-header">
                <button className="sd-back" onClick={() => navigate(-1)} aria-label="Quay lại">
                    ← Quay lại
                </button>
                <div className="sd-header-info">
                    {/* Removed title per request */}
                    <div className={`sd-badge sd-badge--${statusTone}`}>{data.submissionStatus}</div>
                </div>
            </div>

            {/* Student Info Summary */}
            <div className="sd-summary">
                <div className="sd-summary-item">
                    <span className="sd-summary-label">Sinh viên:</span>
                    <span className="sd-summary-value">{data.studentName} ({data.studentCode})</span>
                </div>
                <div className="sd-summary-item">
                    <span className="sd-summary-label">Lớp:</span>
                    <span className="sd-summary-value">{data.classCode}</span>
                </div>
                <div className="sd-summary-item">
                    <span className="sd-summary-label">Bài tập:</span>
                    <span className="sd-summary-value">{data.assignmentTitle}</span>
                </div>
                <div className="sd-summary-item">
                    <span className="sd-summary-label">Ngày nộp:</span>
                    <span className="sd-summary-value">{createdAt}</span>
                </div>
                {data.score && (
                    <div className="sd-summary-item">
                        <span className="sd-summary-label">Điểm:</span>
                        <span className={`sd-summary-score ${getScoreClass(data.score)}`}>
                            {data.score}/10
                        </span>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="sd-tabs">
                <button
                    className={`sd-tab ${activeTab === 'overview' ? 'sd-tab--active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    Tổng quan
                </button>
                <button
                    className={`sd-tab ${activeTab === 'code' ? 'sd-tab--active' : ''}`}
                    onClick={() => setActiveTab('code')}
                >
                    Mã nguồn
                </button>
                <button
                    className={`sd-tab ${activeTab === 'feedback' ? 'sd-tab--active' : ''}`}
                    onClick={() => setActiveTab('feedback')}
                >
                    Phản hồi & Chấm điểm
                </button>
            </div>

            {/* Tab Content */}
            <div className="sd-tab-content">
                {/* Overview Tab - Simplified */}
                {activeTab === 'overview' && (
                    <div className="sd-overview-content">
                        <div className="sd-card sd-card--full">
                            <div className="sd-card__header">Kết quả đánh giá & Thống kê</div>
                            <div className="sd-overview-grid">
                                <div className="sd-evaluation">
                                    {data.score ? (
                                        <div className="sd-score-display">
                                            <div className={`sd-score-circle ${getScoreClass(data.score)}`}>
                                                <span className="sd-score-number">{data.score}</span>
                                                <span className="sd-score-max">/10</span>
                                            </div>
                                            <div className="sd-score-status">
                                                {data.score >= 8 ? 'Xuất sắc' :
                                                 data.score >= 5 ? 'Đạt yêu cầu' : 'Cần cải thiện'}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="sd-no-score">
                                            <div className="sd-no-score-icon">📝</div>
                                            <p>Chưa có điểm số</p>
                                            <small>Chuyển sang tab "Phản hồi & Chấm điểm" để chấm điểm</small>
                                        </div>
                                    )}
                                </div>

                                <div className="sd-submission-stats">
                                    <h4>Thông tin bổ sung</h4>
                                    <div className="sd-stats-grid">
                                        <div className="sd-stat-item">
                                            <span className="sd-stat-label">Loại UML:</span>
                                            <span className="sd-stat-value">{data.typeUml}</span>
                                        </div>
                                        <div className="sd-stat-item">
                                            <span className="sd-stat-label">Trạng thái xử lý:</span>
                                            <span className={`sd-badge sd-badge--${statusTone}`}>
                                                {data.submissionStatus}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Code Tab */}
                {activeTab === 'code' && (
                    <div className="sd-code-section">
                        <div className="sd-card sd-card--full">
                            <div className="sd-card__header sd-card__header--row">
                                <span>Mã PlantUML (Sinh viên)</span>
                                <button
                                    className="sd-btn sd-btn--ghost"
                                    onClick={() => handleCopy(data.studentPlantUMLCode)}
                                >
                                    📋 Copy
                                </button>
                            </div>
                            <div className="sd-code-wrapper">
                                <pre className="sd-code">
                                    <code>{data.studentPlantUMLCode || "// Không có dữ liệu"}</code>
                                </pre>
                            </div>
                        </div>

                        <div className="sd-card sd-card--full">
                            <div className="sd-card__header sd-card__header--row">
                                <span>Mã PlantUML (Đáp án)</span>
                                <button
                                    className="sd-btn sd-btn--ghost"
                                    onClick={() => handleCopy(data.solutionCode)}
                                >
                                    📋 Copy
                                </button>
                            </div>
                            <div className="sd-code-wrapper">
                                <pre className="sd-code">
                                    <code>{data.solutionCode || "// Không có dữ liệu"}</code>
                                </pre>
                            </div>
                        </div>
                    </div>
                )}

                {/* Feedback Tab */}
                {activeTab === 'feedback' && (
                    <div className="sd-feedback-section">
                        {/* AI Feedback */}
                        <div className="sd-card sd-card--full">
                            <div className="sd-card__header">
                                <span>🤖 Phản hồi từ AI</span>
                            </div>
                            {aiFeedback ? (
                                <div className="sd-feedback-content">
                                    <div className="sd-feedback-meta">
                                        <span className="sd-feedback-author">
                                            {aiFeedback.aiModalName || 'AI Assistant'}
                                        </span>
                                        <span className="sd-feedback-id">ID: {aiFeedback.id}</span>
                                    </div>
                                    {renderAIFeedback(aiFeedback.feedback)}
                                </div>
                            ) : (
                                <div className="sd-feedback-empty">
                                    <div className="sd-empty-icon">🔄</div>
                                    <p>Chưa có phản hồi từ AI</p>
                                    <small>Bài nộp chưa được AI phân tích hoặc đang trong hàng đợi xử lý</small>
                                </div>
                            )}
                        </div>

                        {/* Teacher Feedback */}
                        <div className="sd-card sd-card--full">
                            <div className="sd-card__header sd-card__header--row">
                                <span>👨‍🏫 Phản hồi từ giảng viên</span>
                                {teacherFeedback && (
                                    <button
                                        className="sd-btn sd-btn--primary"
                                        onClick={() => setIsEditingFeedback(!isEditingFeedback)}
                                        disabled={submittingFeedback}
                                    >
                                        {isEditingFeedback ? "Hủy" : "Chỉnh sửa"}
                                    </button>
                                )}
                            </div>

                            {teacherFeedback && !isEditingFeedback ? (
                                <div className="sd-feedback-content">
                                    <div className="sd-feedback-meta">
                                        <span className="sd-feedback-date">
                                            {dayjs(teacherFeedback.createdDate).format("DD/MM/YYYY HH:mm")}
                                        </span>
                                        {teacherFeedback.updatedDate && (
                                            <span className="sd-feedback-updated">
                                                (Cập nhật: {dayjs(teacherFeedback.updatedDate).format("DD/MM/YYYY HH:mm")})
                                            </span>
                                        )}
                                    </div>
                                    <div className="sd-feedback-text">{teacherFeedback.feedback}</div>
                                </div>
                            ) : (
                                <form className="sd-feedback-form" onSubmit={handleFeedbackSubmit}>
                                    <div className="sd-form-group">
                                        <label htmlFor="content">Nội dung phản hồi</label>
                                        <textarea
                                            id="content"
                                            name="content"
                                            value={feedbackForm.content}
                                            onChange={(e) => setFeedbackForm({...feedbackForm, content: e.target.value})}
                                            placeholder="Nhập phản hồi của bạn tại đây..."
                                            rows={6}
                                            required
                                        />
                                    </div>
                                    <div className="sd-form-actions">
                                        <button
                                            type="submit"
                                            className="sd-btn sd-btn--primary"
                                            disabled={submittingFeedback || !feedbackForm.content.trim()}
                                        >
                                            {submittingFeedback ? "Đang gửi..." :
                                             (teacherFeedback ? "Cập nhật phản hồi" : "Gửi phản hồi")}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>

                        {/* Score Section */}
                        <div className="sd-card sd-card--full">
                            <div className="sd-card__header sd-card__header--row">
                                <span>📊 Chấm điểm</span>
                                <button
                                    className="sd-btn sd-btn--primary"
                                    onClick={() => {
                                        setIsEditingScore(!isEditingScore);
                                        if (!isEditingScore) {
                                            setScoreForm(data?.score?.toString() || "");
                                        }
                                    }}
                                    disabled={submittingScore}
                                >
                                    {isEditingScore ? "Hủy" : (data?.score ? "Sửa điểm" : "Chấm điểm")}
                                </button>
                            </div>

                            {data?.score && !isEditingScore ? (
                                <div className="sd-score-content">
                                    <div className="sd-score-display">
                                        <div className={`sd-score-circle ${getScoreClass(data.score)}`}>
                                            <span className="sd-score-number">{data.score}</span>
                                            <span className="sd-score-max">/10</span>
                                        </div>
                                        <div className="sd-score-details">
                                            <div className="sd-score-status">
                                                {data.score >= 8 ? 'Xuất sắc' :
                                                 data.score >= 5 ? 'Đạt yêu cầu' : 'Cần cải thiện'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : !data?.score && !isEditingScore ? (
                                <div className="sd-score-empty">
                                    <div className="sd-empty-icon">📝</div>
                                    <p>Chưa có điểm số</p>
                                    <small>Nhấn "Chấm điểm" để thêm điểm cho bài nộp này</small>
                                </div>
                            ) : (
                                <form className="sd-score-form" onSubmit={handleScoreSubmit}>
                                    <div className="sd-form-group">
                                        <label htmlFor="scoreInput">Điểm số (0-10)</label>
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
                                    <div className="sd-form-actions">
                                        <button
                                            type="submit"
                                            className="sd-btn sd-btn--primary"
                                            disabled={submittingScore || !scoreForm.trim()}
                                        >
                                            {submittingScore ? "Đang lưu..." : "Lưu điểm"}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SubmissionDetail;
