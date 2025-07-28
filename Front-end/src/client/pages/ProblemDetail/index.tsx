import React, { useState } from "react";
import Description from "./Description";
import CodeEditor from "./CodeEditor.tsx";
import Result from "./Result";
import "./ProblemDetail.scss";
import { useTranslation } from "react-i18next";

const initialPlantUml = `@startuml
Bob -> Alice : Hello
Alice -> Bob : Hi
@enduml`;

const ProblemDetail: React.FC = () => {
    const [code, setCode] = useState<string>(initialPlantUml);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const { t } = useTranslation();

    const handleRunCode = () => {
        const encodedCode = encodeURIComponent(code);
        const diagramUrl = `https://www.plantuml.com/plantuml/svg/${encodedCode}`;
        setImageUrl(diagramUrl);
    };

    const handleSubmitCode = () => {
        // Xử lý submit code ở đây
        console.log(t('problemDetail.codeEditor.submitMessage'), code);
    };

    return (
        <div className="problem-detail">
            <div className="problem-detail__left-panel">
                <Description/>
            </div>

            <div className="problem-detail__right-panel">
                <div className="problem-detail__code-section">
                    <CodeEditor
                        code={code}
                        onCodeChange={setCode}
                        onRun={handleRunCode}
                        onSubmit={handleSubmitCode}
                    />
                </div>
                <div className="problem-detail__rendered-image-section">
                    <Result imageUrl={imageUrl}/>
                </div>
            </div>
        </div>
    );
}

export default ProblemDetail;