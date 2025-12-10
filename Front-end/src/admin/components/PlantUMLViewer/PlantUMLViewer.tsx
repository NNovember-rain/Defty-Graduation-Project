import React, { useState } from 'react';
import { Spin, Image, Alert } from 'antd';
import { MdPlayArrow } from 'react-icons/md';

interface PlantUMLViewerProps {
    code: string;
    backgroundColor?: string;
}

const PlantUMLViewer: React.FC<PlantUMLViewerProps> = ({
    code,
    backgroundColor = '#f6f8fa'
}) => {
    const [previewImageSrc, setPreviewImageSrc] = useState<string | null>(null);
    const [previewLoading, setPreviewLoading] = useState<boolean>(false);
    const [showPreview, setShowPreview] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleRunPreview = async () => {
        if (!code || !code.trim()) {
            setError("Không có code để render");
            return;
        }

        setPreviewLoading(true);
        setPreviewImageSrc(null);
        setError(null);

        try {
            const res = await fetch("https://kroki.io/plantuml/svg", {
                method: "POST",
                headers: { "Content-Type": "text/plain" },
                body: code,
            });

            if (!res.ok) {
                if (res.status === 400) {
                    setError('Code PlantUML không đúng định dạng. Vui lòng kiểm tra lại cú pháp.');
                } else {
                    setError(`Lỗi render: ${res.status} - ${res.statusText}`);
                }
                return;
            }

            const svg = await res.text();
            const base64Svg = `data:image/svg+xml;base64,${btoa(svg)}`;
            setPreviewImageSrc(base64Svg);
            setShowPreview(true);
        } catch (error: any) {
            console.error('Render failed:', error);
            setError('Lỗi kết nối đến server render. Vui lòng thử lại.');
        } finally {
            setPreviewLoading(false);
        }
    };

    return (
        <>
            {/* Play Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
                <button
                    onClick={handleRunPreview}
                    disabled={previewLoading}
                    type="button"
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: previewLoading ? 'not-allowed' : 'pointer',
                        fontSize: '22px',
                        color: '#02b128',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '4px 8px'
                    }}
                >
                    {previewLoading ? <Spin size="small" /> : <MdPlayArrow />}
                </button>
            </div>

            {/* Error Alert */}
            {error && (
                <Alert
                    description={error}
                    type="error"
                    showIcon
                    closable
                    onClose={() => setError(null)}
                    style={{ marginBottom: '16px' }}
                />
            )}

            {/* Code */}
            <pre style={{
                backgroundColor: backgroundColor,
                padding: '16px',
                borderRadius: '4px',
                border: '1px solid #e1e4e8',
                overflow: 'auto',
                maxHeight: '400px',
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                overflowWrap: 'break-word'
            }}>
                {code || "// Không có dữ liệu"}
            </pre>

            {/* Hidden Image for preview */}
            {previewImageSrc && showPreview && (
                <Image
                    src={previewImageSrc}
                    style={{ display: 'none' }}
                    preview={{
                        visible: showPreview,
                        onVisibleChange: (visible) => {
                            if (!visible) {
                                setShowPreview(false);
                                setPreviewImageSrc(null);
                            }
                        },
                        mask: false,
                    }}
                />
            )}
        </>
    );
};

export default PlantUMLViewer;
