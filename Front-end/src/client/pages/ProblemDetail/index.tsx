import React, { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Split from "react-split";
import Description from "./Description";
import CodeEditor from "./CodeEditor.tsx";
import Result from "./Result";
import "./ProblemDetail.scss";
import { useTranslation } from "react-i18next";
import { getClassById, type IClass } from "../../../shared/services/classManagementService";
import { getAssignmentById, type IAssignment } from "../../../shared/services/assignmentService";
import { deflate } from "pako";
import {createSubmission} from "../../../shared/services/submissionService.ts";

/** ========= PlantUML helpers ========= */
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
    const { classId, problemId } = useParams<{ classId: string; problemId: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();

    // state
    const [code, setCode] = useState<string>(initialPlantUml);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [assignment, setAssignment] = useState<IAssignment | null>(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);
    const [, setClassInfo] = useState<IClass | null>(null); // chỉ để verify class tồn tại

    const [svgMarkup, setSvgMarkup] = useState<string | null>(null);
    const [renderErr, setRenderErr] = useState<string | null>(null);

    // responsive orientation
    const [isNarrow, setIsNarrow] = useState<boolean>(() => window.innerWidth < 1024);
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

    const renderWithKroki = async (uml: string) => {
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
                // TRƯỚC ĐÂY: setRenderErr(`Render error (${res.status})`);
                setRenderErr(t("problemDetail.result.renderErrorWithStatus", { status: res.status }));
                setImageUrl(plantUmlSvgUrl(uml)); // fallback để vẫn thấy ảnh lỗi
                return;
            }

            const svg = await res.text();
            setSvgMarkup(svg);
            setImageUrl(null);
        } catch (e: any) {
            // TRƯỚC ĐÂY: setRenderErr(e?.message || "Render failed");
            setRenderErr(t("problemDetail.result.renderFailed"));
            setSvgMarkup(null);
            setImageUrl(plantUmlSvgUrl(uml));
        }
    };

    const handleRunCode = () => renderWithKroki(code);
    const handleSubmitCode = async () => {
        const submissionData = {
            studentId: 1, // Replace with actual student ID from authentication state
            classId: Number(classId), // Convert URL param to a number
            assignmentId: Number(problemId), // Convert URL param to a number
            studentPlantUmlCode: code, // The PlantUML code from the editor state
        };

        const submissionResponse = await createSubmission(submissionData);
        console.log("Submission successful:", submissionResponse);
    };

    // tách function fetch
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
                        />
                    </div>

                    {/* RESULT (BOTTOM) */}
                    <div className="panel panel--result scrollable">
                        <Result imageUrl={imageUrl} svgMarkup={svgMarkup} error={renderErr} />
                    </div>
                </Split>
            </Split>
        </div>
    );
};

export default ProblemDetail;