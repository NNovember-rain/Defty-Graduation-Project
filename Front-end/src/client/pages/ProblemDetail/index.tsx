import React, { useCallback, useEffect, useState } from "react";
import {useParams, useNavigate, useSearchParams} from "react-router-dom";
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
import { getAssignmentById, type IAssignment } from "../../../shared/services/assignmentService";
import { deflate } from "pako";
import { createSubmission, type SubmissionRequest, getLastSubmissionExamMode, type LastSubmissionResponse } from "../../../shared/services/submissionService.ts";
import { useNotification } from "../../../shared/notification/useNotification.ts";

// KHAI BÁO INTERFACE ĐỂ DÙNG TRONG STATE VÀ LOGIC
interface IAssignmentClass {
    classId: number;
    moduleName: string;
    moduleDescription: string;
}
type IAssignmentWithClasses = IAssignment & { assignmentClasses?: IAssignmentClass[] };
// END KHAI BÁO

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
    const { classId, problemId } = useParams<{ classId: string; problemId: string }>();
    const currentClassId = Number(classId); // Lấy classId dưới dạng số
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [searchParams] = useSearchParams();
    const isTestMode = searchParams.get("mode") === "test";
    const currentMode: 'practice' | 'test' = isTestMode ? 'test' : 'practice';

    // state - KHÔNG khởi tạo code mặc định nếu là Test Mode
    const [code, setCode] = useState<string>("");
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [assignment, setAssignment] = useState<IAssignment | null>(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);
    const [, setClassInfo] = useState<IClass | null>(null);

    const [svgMarkup, setSvgMarkup] = useState<string | null>(null);
    const [renderErr, setRenderErr] = useState<string | null>(null);
    const [isRendering, setIsRendering] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    // THÊM STATE ĐỂ LƯU THÔNG TIN MODULE CỦA CLASS
    const [assignmentClassModule, setAssignmentClassModule] = useState<IAssignmentClass | null>(null);

    // NEW STATES cho Type UML và Module
    const [umlType, setUmlType] = useState<string>("");
    const [module, setModule] = useState<string>(""); // Module được chọn
    const [typeUmlName, setTypeUmlName] = useState<string>("");
    
    // STATE để kiểm tra xem bài đã được chấm điểm chưa (trong test mode)
    const [isGraded, setIsGraded] = useState<boolean>(false);
    
    // STATE để lưu submission data cho FeedbackPanel
    const [lastSubmission, setLastSubmission] = useState<LastSubmissionResponse | null>(null);
    
    // STATE để track việc đã load initial data cho Test Mode chưa
    const [isInitialDataLoaded, setIsInitialDataLoaded] = useState<boolean>(false);

    // === BƯỚC SỬA CHỮA LỖI VÒNG LẶP: DÙNG useCallback ĐỂ ỔN ĐỊNH CÁC HÀM SETTER ===

    // 1. Ổn định hàm setModule (prop onModuleChange)
    const handleModuleChange = useCallback((value: string) => {
        setModule(value);
    }, []);

    // 2. Ổn định hàm setUmlType (prop onUmlTypeChange)
    const handleUmlTypeChange = useCallback((value: string) => {
        setUmlType(value);
    }, []);

    // 3. Callback cho typeUmlName
    const handleTypeUmlNameChange = useCallback((name: string) => {
        setTypeUmlName(name);
    }, []);

    // 4. Callback cho moduleName
    const handleModuleNameChange = useCallback((name: string) => {
        console.log('Module name changed:', name);
    }, []);

    // =========================================================================

    // responsive orientation
    const [isNarrow, setIsNarrow] = useState<boolean>(() => window.innerWidth < 1024);

    // submission history modal state
    const [showHistoryModal, setShowHistoryModal] = useState(false);

    // Get current user info
    const { user } = useUserStore();

    // Trigger để refresh FeedbackPanel sau khi submit
    const [feedbackRefreshTrigger, setFeedbackRefreshTrigger] = useState(0);

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

    // Tỉ lệ riêng cho Test Mode
    const effectiveSizesInner = isTestMode ? [65, 35] : sizesInner;

    // helpers
    const getHttpStatus = (e: any): number | undefined =>
        e?.response?.status ?? e?.status ?? e?.data?.status ?? e?.code;

    // Cập nhật hàm renderWithKroki để sử dụng umlType
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
            classId: currentClassId,
            problemId: Number(problemId),
            studentId: Number(user?.id) || 1
        });
        setShowHistoryModal(true);
    };

    const handleCloseHistoryModal = () => {
        setShowHistoryModal(false);
    };

    // Handle submit code (giữ nguyên)
    const handleSubmitCode = async () => {
        // Kiểm tra nếu đã được chấm điểm thì không cho nộp
        if (isTestMode && isGraded) {
            message.warning("Bài tập đã được chấm điểm, không thể nộp lại!");
            return;
        }
        
        setIsSubmitting(true);
        try {
            const submissionData: SubmissionRequest = {
                classId: currentClassId, // Chuyển đổi URL param sang số
                assignmentId: Number(problemId), // Chuyển đổi URL param sang số
                studentPlantUmlCode: code, // Code PlantUML từ editor
                examMode: isTestMode, // Dùng isTestMode cho examMode
                moduleId: Number(module),
                typeUmlId: Number(umlType),
                typeUmlName: typeUmlName
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

            if (!module || !umlType) {
                message.error("Vui lòng chọn Module và UML Type trước khi nộp bài!");
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

            // Bước 4: Reload submission data và trigger refresh FeedbackPanel nếu đang ở Test Mode
            if (isTestMode) {
                // Reload submission data sau khi submit
                try {
                    const newSubmission = await getLastSubmissionExamMode(currentClassId, Number(problemId));
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

    // SỬA HÀM fetchAssignmentInfo để lấy thông tin module của class
    const fetchAssignmentInfo = async (pid: number) => {
        try {
            // Ép kiểu để có assignmentClasses
            const asg = (await getAssignmentById(pid)) as IAssignmentWithClasses;

            // LOGIC MỚI: TÌM THÔNG TIN MODULE DỰA TRÊN classId
            const classModuleInfo = asg.assignmentClasses?.find((ac: IAssignmentClass) => ac.classId === currentClassId);

            // LƯU Ý: setAssignmentClassModule nhận IAssignmentClass, không cần bọc trong object mới
            if (classModuleInfo) {
                setAssignmentClassModule(classModuleInfo);
            } else {
                setAssignmentClassModule(null);
            }

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
    // END SỬA HÀM fetchAssignmentInfo

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
        [navigate, currentClassId] // THÊM currentClassId vào dependencies
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
    }, [classId, problemId, fetchAll]); // Đảm bảo fetchAll là dependency

    // Load submitted code in Test Mode - CHẠY SỚM HƠN VÀ SET CODE MẶC ĐỊNH
    useEffect(() => {
        const loadSubmittedCode = async () => {
            if (!assignment?.id) return;
            
            if (isTestMode) {
                // Test Mode: Load code đã nộp
                try {
                    const submission: LastSubmissionResponse | null = await getLastSubmissionExamMode(currentClassId, assignment.id);
                    
                    // Lưu submission vào state để truyền cho FeedbackPanel
                    setLastSubmission(submission);
                    
                    if (submission?.studentPlantUMLCode) {
                        setCode(submission.studentPlantUMLCode);
                        console.log('✅ Loaded submitted code in Test Mode');
                        
                        // THÊM: Load module và umlType từ submission nếu có
                        if (submission.moduleId) {
                            setModule(String(submission.moduleId));
                            console.log('✅ Loaded module from submission:', submission.moduleId);
                        }
                        if (submission.typeUmlId) {
                            setUmlType(String(submission.typeUmlId));
                            console.log('✅ Loaded umlType from submission:', submission.typeUmlId);
                        }
                    } else {
                        // Nếu chưa có submission, set code mặc định
                        setCode(initialPlantUml);
                        console.log('⚠️ No submission found, using default code');
                    }
                    
                    // Kiểm tra xem bài đã được chấm điểm chưa
                    if (submission?.score !== undefined && submission?.score !== null) {
                        setIsGraded(true);
                    } else {
                        setIsGraded(false);
                    }
                    
                    setIsInitialDataLoaded(true);
                } catch (error) {
                    console.log('No previous submission found in test mode');
                    setCode(initialPlantUml);
                    setIsGraded(false);
                    setLastSubmission(null);
                    setIsInitialDataLoaded(true);
                }
            } else {
                // Practice Mode: Dùng code mặc định
                if (!code) {
                    setCode(initialPlantUml);
                }
                setIsInitialDataLoaded(true);
            }
        };

        loadSubmittedCode();
    }, [isTestMode, assignment?.id, currentClassId]);

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
                {/* LEFT - Description */}
                <div className="panel panel--left scrollable">
                    <Description assignment={assignment} isLoading={loading} error={err}
                                 mode={currentMode}
                                 assignmentClassModule={assignmentClassModule}
                                 umlType={umlType}
                                 onUmlTypeChange={handleUmlTypeChange}
                                 module={module}
                                 onModuleChange={handleModuleChange}
                                 classId={currentClassId}
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
                            assignmentId={Number(problemId)}
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
                assignmentId={Number(problemId)}
                classId={currentClassId}
                studentId={Number(user?.id) || 1} // Use actual student ID from auth context
                examMode={false}
            />
        </div>
    );
};

export default ProblemDetail;