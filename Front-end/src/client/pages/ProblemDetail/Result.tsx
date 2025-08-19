import React from "react";
import { CiImageOn } from "react-icons/ci";
import { Spin, Image, Alert } from "antd";
import { LoadingOutlined } from '@ant-design/icons';

interface ResultProps {
    imageUrl?: string | null;
    svgMarkup?: string | null;
    error?: string | null;
    isRendering?: boolean;
}

const Result: React.FC<ResultProps> = ({ imageUrl, svgMarkup, error, isRendering }) => {
    const [imgErr, setImgErr] = React.useState<string | null>(null);

    // Convert SVG to data URL for Image component
    const svgToDataUrl = (svgMarkup: string): string => {
        const encodedSvg = encodeURIComponent(svgMarkup);
        return `data:image/svg+xml,${encodedSvg}`;
    };

    // Reset image error when props change
    React.useEffect(() => {
        setImgErr(null);
    }, [svgMarkup, imageUrl]);

    // Hiển thị loading nếu isRendering là true
    if (isRendering) {
        return (
            <div className="result-container">
                <div className="result__header">
                    <h2 className="result__header-title">
                        <CiImageOn />
                        Kết quả
                    </h2>
                </div>
                <div className="result__loading">
                    <div className="result__loading-spinner">
                        <Spin indicator={<LoadingOutlined spin />} size="large" />
                    </div>
                    <p>Đang tạo ảnh UML...</p>
                </div>
            </div>
        );
    }

    const hasImage = svgMarkup || imageUrl;
    const hasError = error || imgErr;

    return (
        <div className="result-container">
            <div className="result__header">
                <h2 className="result__header-title">
                    <CiImageOn />
                    Kết quả
                </h2>
            </div>

            {/* Show error state */}
            {hasError && (
                <div className="result__error-state">
                    <div className="result__error-content">
                        <Alert
                            message="Lỗi cú pháp PlantUML"
                            description={error || imgErr || "Không thể render ảnh UML. Vui lòng kiểm tra lại cú pháp."}
                            type="error"
                            showIcon
                            className="result__error-alert"
                        />
                    </div>
                </div>
            )}

            {/* Primary: SVG from Kroki */}
            {svgMarkup && !imgErr && (
                <div className="rendered-image">
                    <Image
                        src={svgToDataUrl(svgMarkup)}
                        alt="UML Diagram"
                        className="rendered-image__img"
                        preview={true} // Tắt preview
                        onError={() => setImgErr("Lỗi khi hiển thị SVG")}
                    />
                </div>
            )}

            {/* Fallback: Image from PlantUML official */}
            {!svgMarkup && imageUrl && !imgErr && (
                <div className="rendered-image">
                    <Image
                        src={imageUrl}
                        alt="UML Diagram (Fallback)"
                        className="rendered-image__img"
                        preview={true} // Tắt preview
                        onError={() => setImgErr("Lỗi khi tải ảnh")}
                    />
                </div>
            )}

            {/* Empty state */}
            {!hasImage && !hasError && (
                <div className="rendered-image">
                    <div className="rendered-image__placeholder">
                        <CiImageOn style={{ fontSize: 48, color: '#d4d4d4', marginBottom: 16 }} />
                        <p>Kết quả sẽ hiển thị ở đây. Nhấn "Chạy" để xem ảnh UML của bạn!</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Result;