import React from "react";
import Editor, {type OnMount, useMonaco } from "@monaco-editor/react";
import { MdPlayArrow, MdSend } from "react-icons/md";
import { useTranslation } from "react-i18next";

export type CodeEditorProps = {
    code: string;
    onCodeChange: (value: string) => void;
    onRun: () => void;
    onSubmit: () => void;
    readOnly?: boolean;
};

const CodeEditor: React.FC<CodeEditorProps> = ({
                                                   code,
                                                   onCodeChange,
                                                   onRun,
                                                   onSubmit,
                                                   readOnly = false,
                                               }) => {
    const { t } = useTranslation();
    const monaco = useMonaco();
    const editorRef = React.useRef<import("monaco-editor").editor.IStandaloneCodeEditor | null>(null);
    const [cursor, setCursor] = React.useState<{ line: number; column: number }>({ line: 1, column: 1 });

    // Đăng ký ngôn ngữ + theme tối cố định (không còn wrap/theme toggle)
    React.useEffect(() => {
        if (!monaco) return;

        const langId = "plantuml";
        const langs = (monaco.languages.getLanguages() || []).map((l) => l.id);
        if (!langs.includes(langId)) {
            monaco.languages.register({ id: langId });
            monaco.languages.setMonarchTokensProvider(langId, {
                tokenizer: {
                    root: [
                        [/^@startuml|@enduml\b/, "keyword"],
                        [/'+.*/, "comment"],
                        [/-{1,2}>{1}/, "operator"],       // ->, -->, -->> ...
                        [/:[^$]*/, "string"],              // : message
                        [/\b[A-Za-z_][\w-]*\b/, "identifier"],
                    ],
                },
            });
        }

        monaco.editor.defineTheme("uml-dark", {
            base: "vs-dark",
            inherit: true,
            rules: [
                { token: "keyword", foreground: "7BD88F", fontStyle: "bold" },
                { token: "comment", foreground: "8B949E" },
                { token: "operator", foreground: "79C0FF" },
                { token: "string", foreground: "E6CC77" },
                { token: "identifier", foreground: "E5E7EB" },
            ],
            colors: {
                // đồng bộ màu với box (#262626)
                "editor.background": "#262626",
                "editorGutter.background": "#262626",
                "editorLineNumber.foreground": "#6B7280",
                "editorLineNumber.activeForeground": "#E5E7EB",
            },
        });
    }, [monaco]);

    const onMount: OnMount = (editor, monacoApi) => {
        editorRef.current = editor;

        // phím tắt
        editor.addCommand(monacoApi.KeyMod.CtrlCmd | monacoApi.KeyCode.Enter, () => onRun());
        editor.addCommand(monacoApi.KeyMod.CtrlCmd | monacoApi.KeyCode.KeyS, () => onSubmit());

        // cập nhật vị trí con trỏ
        editor.onDidChangeCursorPosition((e) => {
            setCursor({ line: e.position.lineNumber, column: e.position.column });
        });
    };

    return (
        <div className="code-editor">
            {/* Header / Toolbar */}
            <div className="code-editor__header">
                <div className="code-editor__toolbar">
                    <div className="code-editor__left-controls">
                        <span className="code-editor__language-label">PlantUML</span>
                    </div>

                    <div className="code-editor__header--right-controls">
                        <button
                            className="code-editor__btn code-editor__btn--run"
                            data-tooltip={t("problemDetail.codeEditor.runTooltip") || "Run (Ctrl/Cmd + Enter)"}
                            onClick={onRun}
                            type="button"
                        >
                            <MdPlayArrow/>
                        </button>

                        <button
                            className="code-editor__btn code-editor__btn--submit"
                            data-tooltip={t("problemDetail.codeEditor.submitTooltip") || "Submit (Ctrl/Cmd + S)"}
                            onClick={onSubmit}
                            type="button"
                        >
                            <MdSend />
                        </button>
                    </div>
                </div>
            </div>

            {/* Editor */}
            <div className="code-editor__body">
                <Editor
                    height="100%"
                    language="plantuml"
                    theme="uml-dark"         // theme cố định
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
                        wordWrap: "off",       // tắt wrap cố định
                        renderWhitespace: "selection",
                        smoothScrolling: true,
                        cursorBlinking: "blink",
                        lineNumbers: "on",
                        padding: { top: 8, bottom: 8 },
                    }}
                />
            </div>

            {/* Status bar — giữ đơn giản */}
            <div className="code-editor__statusbar">
                <span>Ln {cursor.line}, Col {cursor.column}</span>
                <span> | </span>
                <span>{code.length} chars</span>
            </div>
        </div>
    );
};

export default CodeEditor;