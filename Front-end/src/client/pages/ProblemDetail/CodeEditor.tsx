import React from "react";
import Editor, {type OnMount, useMonaco} from "@monaco-editor/react";
import {MdPlayArrow, MdSend} from "react-icons/md";
import {HistoryOutlined} from "@ant-design/icons";
import {useTranslation} from "react-i18next";
import {Spin} from "antd";
import {IoCodeSlashOutline} from "react-icons/io5";


export type CodeEditorProps = {
    code: string;
    onCodeChange: (value: string) => void;
    onRun: () => void;
    onSubmit: () => void;
    onViewHistory?: () => void;
    isRendering: boolean;
    isSubmitting: boolean;
    readOnly?: boolean;
    isTestMode: boolean;
    isGraded?: boolean; // Đã được chấm điểm (chỉ dùng trong test mode)
};

const CodeEditor: React.FC<CodeEditorProps> = ({
                                                   code,
                                                   onCodeChange,
                                                   onRun,
                                                   onSubmit,
                                                   onViewHistory,
                                                   isRendering,
                                                   isSubmitting,
                                                   readOnly = false,
                                                   isTestMode,
                                                   isGraded = false
                                               }) => {
    const { t } = useTranslation();
    const monaco = useMonaco();
    const editorRef = React.useRef<import("monaco-editor").editor.IStandaloneCodeEditor | null>(null);
    const [cursor, setCursor] = React.useState<{ line: number; column: number }>({ line: 1, column: 1 });

    React.useEffect(() => {
        if (!monaco) return;

        monaco.editor.defineTheme("uml-dark", {
            base: "vs-dark",
            inherit: true,
            rules: [],
            colors: {
                "editor.background": "#262626",
                "editorGutter.background": "#262626",
                "editorLineNumber.foreground": "#6B7280",
                "editorLineNumber.activeForeground": "#E5E7EB",
                "editorWidget.border": "#404040",
                "editorWidget.background": "#262626",
                "editorSuggestWidget.background": "#262626",
                "editorSuggestWidget.border": "#404040",
                "focusBorder": "#404040"
            },
        });

        monaco.editor.setTheme("uml-dark");
    }, [monaco]);

    const onMount: OnMount = (editor, monacoApi) => {
        editorRef.current = editor;

        editor.addCommand(monacoApi.KeyMod.CtrlCmd | monacoApi.KeyCode.Enter, () => onRun());

        editor.onDidChangeCursorPosition((e) => {
            setCursor({ line: e.position.lineNumber, column: e.position.column });
        });
    };

    return (
        <div className="code-editor">
            <div className="code-editor__header">
                <div className="code-editor__toolbar">
                    <div className="code-editor__left-controls">
                        <IoCodeSlashOutline fontSize={18} style={{"color": '#02B128'}} />
                        <span className="code-editor__language-label" style={{ marginLeft: 4 }}>
                            PlantUML Editor
                        </span>
                    </div>

                    <div className="code-editor__header--right-controls">
                        {onViewHistory && !isTestMode && (
                            <button
                                className="code-editor__btn code-editor__btn--history"
                                data-tooltip={t("problemDetail.codeEditor.historyTooltip") || "Xem lịch sử nộp bài"}
                                onClick={onViewHistory}
                                type="button"
                                disabled={isRendering || isSubmitting || readOnly}
                            >
                                <HistoryOutlined />
                            </button>
                        )}

                        <button
                            className="code-editor__btn code-editor__btn--run"
                            data-tooltip={t("problemDetail.codeEditor.runTooltip") || "Run (Ctrl/Cmd + Enter)"}
                            onClick={onRun}
                            type="button"
                            disabled={isRendering || isSubmitting || readOnly}
                        >
                            {isRendering ? <Spin size="small" /> : <MdPlayArrow />}
                        </button>

                        {isTestMode ? (
                            <button
                                className="code-editor__btn code-editor__btn--submit-text"
                                onClick={onSubmit}
                                type="button"
                                disabled={isRendering || isSubmitting || readOnly || isGraded}
                                data-tooltip={isGraded ? "Bài đã được chấm điểm" : ""}
                            >
                                {isSubmitting ? <Spin size="small" /> : isGraded ? 'Đã chấm điểm' : 'Nộp bài'}
                            </button>
                        ) : (
                            <button
                                className="code-editor__btn code-editor__btn--submit"
                                data-tooltip={t("problemDetail.codeEditor.submitTooltip") || "Submit (Ctrl/Cmd + S)"}
                                onClick={onSubmit}
                                type="button"
                                disabled={isRendering || isSubmitting || readOnly}
                            >
                                {isSubmitting ? <Spin size="small" /> : <MdSend />}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="code-editor__body">
                <Editor
                    height="100%"
                    language="text"
                    theme="uml-dark"
                    value={code}
                    onChange={(val) => onCodeChange(val ?? "")}
                    onMount={onMount}
                    options={{
                        readOnly,
                        automaticLayout: true,
                        fontSize: 14,
                        fontLigatures: true,
                        minimap: { enabled: true },
                        scrollBeyondLastLine: false,
                        wordWrap: "off",
                        renderWhitespace: "selection",
                        smoothScrolling: true,
                        cursorBlinking: "blink",
                        lineNumbers: "on",
                        padding: { top: 8, bottom: 8 },
                    }}
                />
            </div>

            <div className="code-editor__statusbar">
                <span>Ln {cursor.line}, Col {cursor.column}</span>
                <span> | </span>
                <span>{code.length} chars</span>
            </div>
        </div>
    );
};

export default CodeEditor;