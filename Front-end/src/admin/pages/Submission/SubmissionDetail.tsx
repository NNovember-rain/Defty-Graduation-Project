import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import { getSubmissionDetail, type SubmissionDetailResponse } from "../../../shared/services/submissionService.ts";
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

const SubmissionDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [data, setData] = useState<SubmissionDetailResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    const createdAt = useMemo(() => {
        if (!data?.createdDate) return "";
        return dayjs(data.createdDate).format("YYYY-MM-DD HH:mm");
    }, [data]);

    useEffect(() => {
        let mounted = true;

        (async () => {
            if (!id) {
                setErr("Invalid submission id");
                setLoading(false);
                return;
            }
            try {
                const res = await getSubmissionDetail(id);
                if (mounted) {
                    setData(res);
                    setLoading(false);
                }
            } catch (e) {
                console.error(e);
                if (mounted) {
                    setErr("Không tải được dữ liệu");
                    setLoading(false);
                }
            }
        })();

        return () => {
            mounted = false;
        };
    }, [id]);

    const handleCopy = (text?: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text).catch(() => {});
    };

    if (loading) {
        return (
            <div className="sd-container">
                <div className="sd-skeleton">Đang tải...</div>
            </div>
        );
    }

    if (err) {
        return (
            <div className="sd-container">
                <div className="sd-error">{err}</div>
            </div>
        );
    }

    if (!data) return null;

    const statusTone = STATUS_CLASS[data.submissionStatus];

    return (
        <div className="sd-container">
            <div className="sd-header">
                <button className="sd-back" onClick={() => navigate(-1)} aria-label="Quay lại">
                    ← Quay lại
                </button>
                <h1 className="sd-title">Submission Detail #{data.id}</h1>
            </div>

            <div className="sd-grid">
                {/* Thông tin sinh viên */}
                <div className="sd-card">
                    <div className="sd-card__header">Thông tin sinh viên</div>
                    <div className="sd-row">
                        <div className="sd-label">Tên sinh viên</div>
                        <div className="sd-value">{data.studentName}</div>
                    </div>
                    <div className="sd-row">
                        <div className="sd-label">Mã sinh viên</div>
                        <div className="sd-value">{data.studentCode}</div>
                    </div>
                    <div className="sd-row">
                        <div className="sd-label">Lớp</div>
                        <div className="sd-value">{data.classCode}</div>
                    </div>
                </div>

                {/* Thông tin bài nộp */}
                <div className="sd-card">
                    <div className="sd-card__header">Thông tin bài nộp</div>
                    <div className="sd-row">
                        <div className="sd-label">Bài tập</div>
                        <div className="sd-value">{data.assignmentTitle}</div>
                    </div>
                    <div className="sd-row">
                        <div className="sd-label">Loại UML</div>
                        <div className="sd-value">{data.typeUml}</div>
                    </div>
                    <div className="sd-row">
                        <div className="sd-label">Ngày tạo</div>
                        <div className="sd-value">{createdAt}</div>
                    </div>
                    <div className="sd-row">
                        <div className="sd-label">Trạng thái</div>
                        <div className={`sd-badge sd-badge--${statusTone}`}>{data.submissionStatus}</div>
                    </div>
                </div>

                {/* Mã PlantUML của sinh viên */}
                <div className="sd-card sd-card--full">
                    <div className="sd-card__header sd-card__header--row">
                        <span>Mã PlantUML (Sinh viên)</span>
                        <button className="sd-btn sd-btn--ghost" onClick={() => handleCopy(data.studentPlantUMLCode)}>
                            Copy
                        </button>
                    </div>
                    <pre className="sd-code">
            <code>{data.studentPlantUMLCode || "// (Không có dữ liệu)"}</code>
          </pre>
                </div>

                {/* Mã mẫu/solution */}
                <div className="sd-card sd-card--full">
                    <div className="sd-card__header sd-card__header--row">
                        <span>Mã PlantUML (Đáp án)</span>
                        <button className="sd-btn sd-btn--ghost" onClick={() => handleCopy(data.solutionCode)}>
                            Copy
                        </button>
                    </div>
                    <pre className="sd-code">
            <code>{data.solutionCode || "// (Không có dữ liệu)"}</code>
          </pre>
                </div>
            </div>
        </div>
    );
};

export default SubmissionDetail;
