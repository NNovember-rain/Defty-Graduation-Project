import React, { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Split from "react-split";
import Description from "./Description";
import CodeEditor from "./CodeEditor.tsx";
import Result from "./Result";
import SubmissionHistory from "./SubmissionHistory";
import "./ProblemDetail.scss";
import { useUserStore } from "../../../shared/authentication/useUserStore";
import { useTranslation } from "react-i18next";
import { getClassById, type IClass } from "../../../shared/services/classManagementService";
import { getAssignmentById, type IAssignment } from "../../../shared/services/assignmentService";
import { deflate } from "pako";
import { createSubmission, type SubmissionRequest } from "../../../shared/services/submissionService.ts";
import { useNotification } from "../../../shared/notification/useNotification.ts";

/** ========= PlantUML helpers (Giữ nguyên) ========= */
const plantUmlEncTable = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_";
function _append3bytes(b1: number, b2: number, b3: number) {
    const c1 = b1 >> 2;
    const c2 = ((b1 & 0x3) << 4) | (b2 >> 4);
    const c3 = ((b2 & 0xF) << 2) | (b3 >> 6);
    const c4 = b3 & 0x3F;
    return (
        plantUmlEncTable.charAt(c1) +
        plantUmlEncTable.charAt(c2) +
        plantUmlEncTable.charAt(c3) +
        plantUmlEncTable.charAt(c4)
    );
}
function plantUmlEncode(bytes: Uint8Array) {
    let r = "";
    for (let i = 0; i < bytes.length; i += 3) {
        if (i + 2 === bytes.length) r += _append3bytes(bytes[i], bytes[i + 1], 0);
        else if (i + 1 === bytes.length) r += _append3bytes(bytes[i], 0, 0);
        else r += _append3bytes(bytes[i], bytes[i + 1], bytes[i + 2]);
    }
    return r;
}
function plantUmlSvgUrl(uml: string) {
    const data = new TextEncoder().encode(uml);
    const deflated = deflate(data, { level: 9, raw: true }); // raw DEFLATE
    const encoded = plantUmlEncode(deflated);
    return `https://www.plantuml.com/plantuml/svg/${encoded}`;
}
/** ==================================== */

const initialPlantUml = `@startuml
Bob -> Alice : Hello
Alice -> Bob : Hi
@enduml`;

// Định nghĩa các loại UML được hỗ trợ bởi Kroki
// Chúng ta sẽ chỉ sử dụng một số loại phổ biến cho PlantUML
const UML_TYPES = [
    { key: "plantuml", label: "PlantUML (Default)" },
    { key: "mermaid", label: "Mermaid" },
    { key: "graphviz", label: "Graphviz" },
    { key: "ditaa", label: "Ditaa" },
];

const ProblemDetail: React.FC = () => {
    const { message, notification } = useNotification();
    const { classId, problemId } = useParams<{ classId: string; problemId: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();

    // state
    const [code, setCode] = useState<string>(initialPlantUml);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [assignment, setAssignment] = useState<IAssignment | null>(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);
    const [, setClassInfo] = useState<IClass | null>(null);

    const [svgMarkup, setSvgMarkup] = useState<string | null>(null);
    const [renderErr, setRenderErr] = useState<string | null>(null);
    const [isRendering, setIsRendering] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    // NEW STATES cho Type UML và Module (Module ở đây tạm bỏ qua, vì Kroki dùng UML type trực tiếp)
    // Nếu bạn chỉ muốn PlantUML, bạn chỉ cần một state duy nhất cho UML Type.
    const [umlType, setUmlType] = useState<string>("plantuml"); // Mặc định là PlantUML
    const [module, setModule] = useState<string>("default"); // Module: có thể là 'default' hoặc 'server-side'

    // responsive orientation
    const [isNarrow, setIsNarrow] = useState<boolean>(() => window.innerWidth < 1024);

    // submission history modal state
    const [showHistoryModal, setShowHistoryModal] = useState(false);

    // Get current user info
    const { user } = useUserStore();

    useEffect(() => {
        const onResize = () => setIsNarrow(window.innerWidth < 1024);
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    // split sizes (persist)
    const [sizesOuter, setSizesOuter] = useState<number[]>(
        () => JSON.parse(localStorage.getItem(isNarrow ? "pd-sizes-outer-v" : "pd-sizes-outer-h") || "[35,65]")
    );
    const [sizesInner, setSizesInner] = useState<number[]>(
        () => JSON.parse(localStorage.getItem("pd-sizes-inner-v") || "[55,45]")
    );

    // helpers
    const getHttpStatus = (e: any): number | undefined =>
        e?.response?.status ?? e?.status ?? e?.data?.status ?? e?.code;

    // Cập nhật hàm renderWithKroki để sử dụng umlType
    const renderWithKroki = async (uml: string, type: string) => {
        setIsRendering(true);
        setRenderErr(null);
        setSvgMarkup(null);
        setImageUrl(null);

        // Sử dụng type (ví dụ: plantuml, mermaid) trong endpoint của Kroki
        const krokiUrl = `https://kroki.io/${type}/svg`;

        try {
            const res = await fetch("https://kroki.io/plantuml/svg", {
                method: "POST",
                headers: { "Content-Type": "text/plain" },
                body: uml,
            });

            if (!res.ok) {
                setRenderErr(t("problemDetail.result.renderErrorWithStatus", { status: res.status }));
                // Fallback chỉ dùng được cho PlantUML, các loại khác sẽ hiện PlantUML lỗi.
                if (type === 'plantuml') {
                    setImageUrl(plantUmlSvgUrl(uml));
                } else {
                    // Đối với các loại khác, hiển thị lỗi API text
                    const errorText = await res.text();
                    setRenderErr(t("problemDetail.result.renderErrorWithStatus", { status: res.status }) + `: ${errorText.substring(0, 100)}`);
                }
                return;
            }

            const svg = await res.text();
            setSvgMarkup(svg);
            setImageUrl(null);
        } catch (e: any) {
            setRenderErr(t("problemDetail.result.renderFailed"));
            setSvgMarkup(null);
            // Fallback chỉ dùng được cho PlantUML
            if (type === 'plantuml') {
                setImageUrl(plantUmlSvgUrl(uml));
            }
        } finally {
            setIsRendering(false);
        }
    };

    // Truyền umlType vào hàm run
    const handleRunCode = () => renderWithKroki(code, umlType);

    // Handle view submission history (giữ nguyên)
    const handleViewHistory = () => {
        console.log('📖 handleViewHistory clicked');
        console.log('Props that will be passed:', {
            classId: Number(classId),
            problemId: Number(problemId),
            studentId: Number(user?.id) || 1
        });
        setShowHistoryModal(true);
    };

    const handleCloseHistoryModal = () => {
        setShowHistoryModal(false);
    };

    const handleViewSubmission = (submissionId: number) => {
        console.log("View submission:", submissionId);
        setShowHistoryModal(false);
    };

    // Handle submit code (giữ nguyên)
    const handleSubmitCode = async () => {
        setIsSubmitting(true);
        try {
            const submissionData: SubmissionRequest = {
                classId: Number(classId), // Chuyển đổi URL param sang số
                assignmentId: Number(problemId), // Chuyển đổi URL param sang số
                studentPlantUmlCode: code, // Code PlantUML từ editor
                examMode: false // Set examMode = false cho trang nộp bài thường
            };

            // Bước 1: Validate dữ liệu trước khi gửi đi
            if (!submissionData.studentPlantUmlCode) {
                message.error("Mã PlantUML không được để trống!");
                return;
            }

            if (isNaN(submissionData.classId) || isNaN(submissionData.assignmentId)) {
                message.error("ID lớp học hoặc ID bài tập không hợp lệ!");
                return;
            }

            // Bước 2: Gọi API nếu dữ liệu hợp lệ
            await createSubmission(submissionData);

            // Bước 3: Thông báo thành công nếu API trả về OK
            notification.success(
                "Nộp bài thành công",
                `Hệ thống sẽ xử lý và thông báo kết quả cho bạn sớm!`,
                { duration: 5, placement: 'topRight' }
            );

        } catch (error) {
            message.error("Nộp bài thất bại, hãy kiểm tra lại mạng và thử lại!");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Tách function fetch (giữ nguyên)
    const fetchClassInfo = async (cid: number) => {
        try {
            const cls = await getClassById(cid);
            setClassInfo(cls);
            return true;
        } catch (e: any) {
            const s = getHttpStatus(e);
            if (s === 400 || s === 404) {
                navigate("/not-found");
                return false;
            }
            throw e;
        }
    };

    const fetchAssignmentInfo = async (pid: number) => {
        try {
            const asg = await getAssignmentById(pid);
            console.log("Fetched assignment:", asg);
            setAssignment(asg);
            return true;
        } catch (e: any) {
            const s = getHttpStatus(e);
            if (s === 400 || s === 404) {
                navigate("/not-found");
                return false;
            }
            throw e;
        }
    };

    const fetchAll = useCallback(
        async (cid: number, pid: number) => {
            setLoading(true);
            setErr(null);
            try {
                const okClass = await fetchClassInfo(cid);
                if (!okClass) return;
                const okAsg = await fetchAssignmentInfo(pid);
                if (!okAsg) return;
            } catch (e: any) {
                setErr(e?.message ?? "Failed to load data");
            } finally {
                setLoading(false);
            }
        },
        [navigate]
    );

    useEffect(() => {
        const cid = Number(classId);
        const pid = Number(problemId);
        if (!Number.isFinite(cid) || !Number.isFinite(pid)) {
            navigate("/not-found");
            return;
        }
        fetchAll(cid, pid);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [classId, problemId]);

    if (loading) return <div className="problem-detail__loading">Loading…</div>;
    if (err) return <div className="problem-detail__error">Error: {err}</div>;

    return (
        <div className="problem-detail">
            {/* Outer split: LEFT (Description) | RIGHT (Code+Result) */}
            <Split
                className={`split-outer ${isNarrow ? "split-vertical" : "split-horizontal"}`}
                direction={isNarrow ? "vertical" : "horizontal"}
                sizes={sizesOuter}
                minSize={isNarrow ? 160 : 260}
                gutterSize={8}
                onDragEnd={(sizes) => {
                    setSizesOuter(sizes);
                    localStorage.setItem(isNarrow ? "pd-sizes-outer-v" : "pd-sizes-outer-h", JSON.stringify(sizes));
                }}
            >
                {/* LEFT */}
                <div className="panel panel--left scrollable">
                    <Description assignment={assignment} isLoading={loading} error={err} />
                </div>

                {/* RIGHT: inner vertical split (Code over Result) */}
                <Split
                    className="split-inner split-vertical"
                    direction="vertical"
                    sizes={sizesInner}
                    minSize={180}
                    gutterSize={8}
                    onDragEnd={(sizes) => {
                        setSizesInner(sizes);
                        localStorage.setItem("pd-sizes-inner-v", JSON.stringify(sizes));
                    }}
                >
                    {/* CODE (TOP) */}
                    <div className="panel panel--code scrollable">
                        <CodeEditor
                            code={code}
                            onCodeChange={setCode}
                            onRun={handleRunCode}
                            onSubmit={handleSubmitCode}
                            onViewHistory={handleViewHistory}
                            isRendering={isRendering}
                            isSubmitting={isSubmitting}
                            umlType={umlType}
                            onUmlTypeChange={setUmlType}
                            module={module}
                            onModuleChange={setModule}
                            umlTypes={UML_TYPES}
                        />
                    </div>

                    {/* RESULT (BOTTOM) */}
                    <div className="panel panel--result scrollable">
                        <Result imageUrl={imageUrl} svgMarkup={svgMarkup} error={renderErr} isRendering={isRendering} />
                    </div>
                </Split>
            </Split>

            {/* Submission History Modal */}
            <SubmissionHistory
                visible={showHistoryModal}
                onClose={handleCloseHistoryModal}
                assignmentId={Number(problemId)}
                classId={Number(classId)}
                studentId={Number(user?.id) || 1} // Use actual student ID from auth context
                examMode={false}
            />
        </div>
    );
};

export default ProblemDetail;
