import React, { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import Split from "react-split";
import Description from "./Description";
import CodeEditor from "./CodeEditor.tsx";
import Result from "./Result";
import SubmissionHistory from "./SubmissionHistory";
import FeedbackPanel from "./FeedbackPanel";
import "./ProblemDetail.scss";
import { useUserStore } from "../../../shared/authentication/useUserStore";
import { useTranslation } from "react-i18next";
import { getClassById, type IClass } from "../../../shared/services/classManagementService";
import { getAssignmentDetail, type IAssignment } from "../../../shared/services/assignmentService";
import { deflate } from "pako";
import { createSubmission, type SubmissionRequest, getLastSubmissionExamMode, type LastSubmissionResponse } from "../../../shared/services/submissionService.ts";
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

const ProblemDetail: React.FC = () => {
    const { message, notification } = useNotification();

    // Lấy classId và assignmentClassDetailId (từ problemId trong URL)
    const { classId, problemId } = useParams<{ classId: string; problemId: string }>();
    const currentClassId = Number(classId);
    const assignmentClassDetailId = Number(problemId); // ID chi tiết lớp/gán bài tập

    const navigate = useNavigate();
    const { t } = useTranslation();

    const [searchParams] = useSearchParams();
    const isTestMode = searchParams.get("mode") === "test";
    const assignmentClassId = searchParams.get("problemId");
    const currentMode: 'practice' | 'test' = isTestMode ? 'test' : 'practice';

    const [code, setCode] = useState<string>("");
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    // Assignment gốc (chứa commonDescription, title)
    const problemIdNumber = Number(problemId);
    const assignmentClassIdForPractice = !isTestMode ? problemIdNumber : 0;
    const [assignment, setAssignment] = useState<IAssignment | null>(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);
    const [, setClassInfo] = useState<IClass | null>(null);

    const [svgMarkup, setSvgMarkup] = useState<string | null>(null);
    const [renderErr, setRenderErr] = useState<string | null>(null);
    const [isRendering, setIsRendering] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    // State cho Module/UML Type (giữ nguyên để kiểm soát Select/CodeEditor)
    const [umlType, setUmlType] = useState<string>("");
    const [module, setModule] = useState<string>("");
    const [typeUmlName, setTypeUmlName] = useState<string>("");

    const [isGraded, setIsGraded] = useState<boolean>(false);
    const [lastSubmission, setLastSubmission] = useState<LastSubmissionResponse | null>(null);
    const [isInitialDataLoaded, setIsInitialDataLoaded] = useState<boolean>(false);

    const handleModuleChange = useCallback((value: string) => {
        setModule(value);
    }, []);

    const handleUmlTypeChange = useCallback((value: string) => {
        setUmlType(value);
    }, []);

    const handleTypeUmlNameChange = useCallback((name: string) => {
        setTypeUmlName(name);
    }, []);

    const handleModuleNameChange = useCallback((name: string) => {
    }, []);

    const [isNarrow, setIsNarrow] = useState<boolean>(() => window.innerWidth < 1024);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const { user } = useUserStore();

    const [feedbackRefreshTrigger, setFeedbackRefreshTrigger] = useState(0);

    useEffect(() => {
        const onResize = () => setIsNarrow(window.innerWidth < 1024);
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    const [sizesOuter, setSizesOuter] = useState<number[]>(
        () => JSON.parse(localStorage.getItem(isNarrow ? "pd-sizes-outer-v" : "pd-sizes-outer-h") || "[35,65]")
    );
    const [sizesInner, setSizesInner] = useState<number[]>(
        () => JSON.parse(localStorage.getItem("pd-sizes-inner-v") || "[55,45]")
    );

    const effectiveSizesInner = isTestMode ? [65, 35] : sizesInner;

    const getHttpStatus = (e: any): number | undefined =>
        e?.response?.status ?? e?.status ?? e?.data?.status ?? e?.code;

    const renderWithKroki = async (uml: string, type: string) => {
        setIsRendering(true);
        setRenderErr(null);
        setSvgMarkup(null);
        setImageUrl(null);

        try {
            const res = await fetch("https://kroki.io/plantuml/svg", {
                method: "POST",
                headers: { "Content-Type": "text/plain" },
                body: uml,
            });

            if (!res.ok) {
                setRenderErr(t("problemDetail.result.renderErrorWithStatus", { status: res.status }));
                if (type === 'plantuml') {
                    setImageUrl(plantUmlSvgUrl(uml));
                } else {
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
            if (type === 'plantuml') {
                setImageUrl(plantUmlSvgUrl(uml));
            }
        } finally {
            setIsRendering(false);
        }
    };

    const handleRunCode = () => renderWithKroki(code, umlType);

    const handleViewHistory = () => {
        setShowHistoryModal(true);
    };

    const handleCloseHistoryModal = () => {
        setShowHistoryModal(false);
    };

    const handleSubmitCode = async () => {
        if (isTestMode && isGraded) {
            message.warning("Bài tập đã được chấm điểm, không thể nộp lại!");
            return;
        }

        setIsSubmitting(true);
        try {
            const submissionData: SubmissionRequest = {
                classId: currentClassId,
                assignmentId: assignmentClassDetailId,
                studentPlantUmlCode: code,
                examMode: isTestMode,
                moduleId: Number(module),
                typeUmlId: Number(umlType),
                typeUmlName: typeUmlName
            };

            if (!submissionData.studentPlantUmlCode) {
                message.error("Mã PlantUML không được để trống!");
                return;
            }

            if (isNaN(submissionData.classId) || isNaN(submissionData.assignmentId)) {
                message.error("ID lớp học hoặc ID bài tập không hợp lệ!");
                return;
            }

            // Kiểm tra Module và UML Type đã chọn chưa
            if (!module || !umlType) {
                message.error("Vui lòng chọn Module và UML Type trước khi nộp bài!");
                return;
            }

            await createSubmission(submissionData);

            notification.success(
                "Nộp bài thành công",
                `Hệ thống sẽ xử lý và thông báo kết quả cho bạn sớm!`,
                { duration: 5, placement: 'topRight' }
            );

            if (isTestMode) {
                try {
                    // Dùng assignmentClassDetailId khi reload submission
                    const newSubmission = await getLastSubmissionExamMode(currentClassId, assignmentClassDetailId);
                    setLastSubmission(newSubmission);
                } catch (err) {
                    console.error('Error reloading submission after submit:', err);
                }

                setFeedbackRefreshTrigger(prev => prev + 1);
            }

        } catch (error) {
            message.error("Nộp bài thất bại, hãy kiểm tra lại mạng và thử lại!");
        } finally {
            setIsSubmitting(false);
        }
    };

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

    // Gọi API chỉ bằng ID chi tiết
    const fetchAssignmentInfo = async (detailId: number) => {
            const asg = (await getAssignmentDetail(assignmentClassDetailId));
            setAssignment(asg);
            return true;
    };

    const fetchAll = useCallback(
        async (cid: number, detailId: number) => {
            setLoading(true);
            setErr(null);
            try {
                const okClass = await fetchClassInfo(cid);
                if (!okClass) return;
                // Truyền ID chi tiết vào fetchAssignmentInfo
                const okAsg = await fetchAssignmentInfo(detailId);
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
        const detailId = Number(problemId);
        if (!Number.isFinite(cid) || !Number.isFinite(detailId)) {
            navigate("/not-found");
            return;
        }
        // Truyền ID chi tiết vào fetchAll
        fetchAll(cid, detailId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [classId, problemId, fetchAll]);

    // Load submitted code in Test Mode
    useEffect(() => {
        const loadSubmittedCode = async () => {
            if (isNaN(assignmentClassDetailId)) return;

            if (isTestMode) {
                try {
                    // Dùng assignmentClassDetailId khi lấy submission
                    const submission: LastSubmissionResponse | null = await getLastSubmissionExamMode(currentClassId, assignmentClassDetailId);

                    setLastSubmission(submission);

                    if (submission?.studentPlantUMLCode) {
                        setCode(submission.studentPlantUMLCode);

                        if (submission.moduleId) {
                            setModule(String(submission.moduleId));
                        }
                        if (submission.typeUmlId) {
                            setUmlType(String(submission.typeUmlId));
                        }
                    } else {
                        setCode(initialPlantUml);
                    }

                    if (submission?.score !== undefined && submission?.score !== null) {
                        setIsGraded(true);
                    } else {
                        setIsGraded(false);
                    }

                    setIsInitialDataLoaded(true);
                } catch (error) {
                    console.log('No previous submission found in test mode, using default code', error);
                    setCode(initialPlantUml);
                    setIsGraded(false);
                    setLastSubmission(null);
                    setIsInitialDataLoaded(true);
                }
            } else {
                if (!code) {
                    setCode(initialPlantUml);
                }
                setIsInitialDataLoaded(true);
            }
        };

        loadSubmittedCode();
    }, [isTestMode, assignmentClassDetailId, currentClassId]);

    if (loading || !isInitialDataLoaded) return <div className="problem-detail__loading">Loading…</div>;
    if (err) return <div className="problem-detail__error">Error: {err}</div>;

    return (
        <div className="problem-detail">
            {/* Outer split: LEFT (Description) | MIDDLE (Code+Result) | RIGHT (Feedback - chỉ ở Test Mode) */}
            <Split
                className={`split-outer ${isNarrow ? "split-vertical" : "split-horizontal"}`}
                direction={isNarrow ? "vertical" : "horizontal"}
                sizes={isTestMode ? [35, 50, 15] : sizesOuter}
                minSize={isNarrow ? 160 : 200}
                gutterSize={8}
                onDragEnd={(sizes) => {
                    if (!isTestMode) {
                        setSizesOuter(sizes);
                        localStorage.setItem(isNarrow ? "pd-sizes-outer-v" : "pd-sizes-outer-h", JSON.stringify(sizes));
                    }
                }}
            >
                <div className="panel panel--left scrollable">
                    <Description assignment={assignment} isLoading={loading} error={err}
                                 mode={currentMode}
                                 umlTypes={assignment?.assignmentClassDetailResponseList.find(m => String(m.id) === module)?.typeUmls || []}
                                 assignmentClassId={assignmentClassIdForPractice}
                                 onUmlTypeChange={handleUmlTypeChange}
                                 module={module}
                                 onModuleChange={handleModuleChange}
                                 classId={currentClassId}
                                 assignmentClassDetailId={assignmentClassDetailId}
                                 isRenderingOrSubmitting={isRendering || isSubmitting}
                                 onTypeUmlNameChange={handleTypeUmlNameChange}
                                 onModuleNameChange={handleModuleNameChange}
                    />
                </div>

                {/* MIDDLE - Code + Result */}
                <Split
                    className="split-inner split-vertical"
                    direction="vertical"
                    sizes={effectiveSizesInner}
                    minSize={180}
                    gutterSize={8}
                    onDragEnd={(sizes) => {
                        if (!isTestMode) {
                            setSizesInner(sizes);
                            localStorage.setItem("pd-sizes-inner-v", JSON.stringify(sizes));
                        }
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
                            isTestMode={isTestMode}
                            isGraded={isGraded}
                            // Chỉ cho ReadOnly khi ở Test Mode VÀ đã được chấm điểm
                            readOnly={isTestMode && isGraded}
                        />
                    </div>

                    {/* RESULT (BOTTOM) */}
                    <div className="panel panel--result scrollable">
                        <Result imageUrl={imageUrl} svgMarkup={svgMarkup} error={renderErr} isRendering={isRendering} />
                    </div>
                </Split>

                {/* RIGHT - Feedback Panel (CHỈ HIỂN THỊ Ở TEST MODE) */}
                {isTestMode && (
                    <div className="panel panel--feedback scrollable">
                        <FeedbackPanel
                            classId={currentClassId}
                            assignmentId={assignmentClassDetailId} // Dùng ID chi tiết
                            refreshTrigger={feedbackRefreshTrigger}
                            submissionData={lastSubmission}
                        />
                    </div>
                )}
            </Split>

            {/* Submission History Modal */}
            <SubmissionHistory
                visible={showHistoryModal}
                onClose={handleCloseHistoryModal}
                assignmentId={assignmentClassDetailId} // Dùng ID chi tiết
                classId={currentClassId}
                studentId={Number(user?.id) || 1}
                examMode={isTestMode} // Chỉ xem lịch sử ở mode hiện tại
            />
        </div>
    );
};

export default ProblemDetail;