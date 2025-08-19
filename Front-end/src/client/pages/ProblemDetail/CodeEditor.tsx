import React from "react";
import Editor, { type OnMount, useMonaco } from "@monaco-editor/react";
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

    React.useEffect(() => {
        if (!monaco) return;

        // Chỉ định nghĩa theme dark, không custom tokenizer
        monaco.editor.defineTheme("uml-dark", {
            base: "vs-dark",
            inherit: true,
            rules: [
                // Giữ rules cơ bản của vs-dark
            ],
            colors: {
                "editor.background": "#262626",
                "editorGutter.background": "#262626",
                "editorLineNumber.foreground": "#6B7280",
                "editorLineNumber.activeForeground": "#E5E7EB",
            },
        });

        monaco.editor.setTheme("uml-dark");
    }, [monaco]);

    const onMount: OnMount = (editor, monacoApi) => {
        editorRef.current = editor;

        editor.addCommand(monacoApi.KeyMod.CtrlCmd | monacoApi.KeyCode.Enter, () => onRun());
        editor.addCommand(monacoApi.KeyMod.CtrlCmd | monacoApi.KeyCode.KeyS, () => onSubmit());

        editor.onDidChangeCursorPosition((e) => {
            setCursor({ line: e.position.lineNumber, column: e.position.column });
        });
    };

    return (
        <div className="code-editor">
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