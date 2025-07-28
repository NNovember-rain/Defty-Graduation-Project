import React from "react";
import { CiImageOn } from "react-icons/ci";
import { useTranslation } from "react-i18next";

interface ResultProps {
    imageUrl: string | null;
}

const Result: React.FC<ResultProps> = ({ imageUrl }) => {
    const { t } = useTranslation();
    return (
        <div className="result-container">
            <div className="result__header">
                <h2 className="result__header-title">
                    <CiImageOn />
                    {t('problemDetail.result.title')}
                </h2>
            </div>

            <div className="rendered-image">
                {imageUrl ? (
                    <img src={imageUrl} alt="Rendered PlantUML Diagram" className="rendered-image__img" />
                ) : (
                    <div className="rendered-image__placeholder">
                        {t('problemDetail.result.placeholder')}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Result;