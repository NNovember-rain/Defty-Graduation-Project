import React from "react";
import { IoCodeSlashOutline } from "react-icons/io5";
import { FaPlay } from "react-icons/fa";
import { BsCloudUploadFill } from "react-icons/bs";
import { useTranslation } from "react-i18next";

interface CodeEditorProps {
    code: string;
    onCodeChange: (code: string) => void;
    onRun: () => void;
    onSubmit?: () => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ code, onCodeChange, onRun, onSubmit }) => {
    const { t } = useTranslation();
    return (
        <div className="code-editor">
            <div className="code-editor__header">
                <h2 className="code-editor__header-title">
                    <IoCodeSlashOutline />
                    {t('problemDetail.codeEditor.title')}
                </h2>

                <div className="code-editor__header--right-controls">
                    <button
                        className="code-editor__btn code-editor__btn--run"
                        onClick={onRun}
                        data-tooltip={t('problemDetail.codeEditor.runTooltip')}
                    >
                        <FaPlay />
                    </button>
                    <button
                        className="code-editor__btn code-editor__btn--submit"
                        onClick={onSubmit}
                        data-tooltip={t('problemDetail.codeEditor.submitTooltip')}
                    >
                        <BsCloudUploadFill />
                    </button>
                </div>
            </div>

            <textarea
                value={code}
                onChange={(e) => onCodeChange(e.target.value)}
                className="code-editor__textarea"
                spellCheck={false}
            />
        </div>
    );
}

export default CodeEditor;