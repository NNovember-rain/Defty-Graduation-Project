import React from "react";
import { CiImageOn } from "react-icons/ci";
import { useTranslation } from "react-i18next";

interface ResultProps {
    imageUrl?: string | null;
    svgMarkup?: string | null;
    error?: string | null;
}

const Result: React.FC<ResultProps> = ({ imageUrl, svgMarkup, error }) => {
    const { t } = useTranslation();
    const [imgErr, setImgErr] = React.useState<string | null>(null);

    return (
        <div className="result-container">
            <div className="result__header">
                <h2 className="result__header-title">
                    <CiImageOn />
                    {t("problemDetail.result.title")}
                </h2>
            </div>

            {error && <div className="result__error">{error}</div>}

            {svgMarkup && (
                <div
                    className="rendered-image"
                    // Nếu cần cực an toàn có thể sanitize SVG trước khi set
                    dangerouslySetInnerHTML={{ __html: svgMarkup }}
                />
            )}

            {!svgMarkup && imageUrl && (
                <div className="rendered-image">
                    {!!imgErr && <div className="result__error">{imgErr}</div>}
                    <img
                        src={imageUrl}
                        alt=""
                        className="rendered-image__img"
                        onError={() => setImgErr(t("problemDetail.result.imageLoadError"))}
                    />
                </div>
            )}

            {!svgMarkup && !imageUrl && !error && (
                <div className="rendered-image">
                    <div className="rendered-image__placeholder">
                        {t("problemDetail.result.placeholder")}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Result;