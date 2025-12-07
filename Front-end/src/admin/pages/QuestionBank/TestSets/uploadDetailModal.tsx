import React, { useState } from 'react';
import { X, CheckCircle, AlertTriangle, XCircle, ExternalLink, Check, Clock, Loader } from 'lucide-react';
import {markAsResolved} from "../../../../shared/services/questionBankService/fileProcessingService";

interface IUploadProcess {
    id: string;
    testSetId: string;
    testSetName?: string;
    partType: 'LC' | 'RC';
    fileName: string;
    status: number; // -1: DELETED, 0: CANCELED, 1: COMPLETED, 2: PROCESSING, 3: PENDING, 4: FAILED
    questionsInserted?: number;
    questionsDuplicated?: number;
    questionsFailed?: number;
    errorMessage?: string;
    issueDetails?: {
        duplicates?: number[];
        errors?: number[];
    };
    manuallyResolved?: boolean | null;
    resolvedBy?: string;
    resolvedAt?: string;
}

interface UploadDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    uploadData: IUploadProcess | null;
    onRefresh?: () => Promise<void>;
}

const UploadDetailModal: React.FC<UploadDetailModalProps> = ({ isOpen, onClose, uploadData, onRefresh }) => {
    const [isResolving, setIsResolving] = useState(false);

    if (!isOpen || !uploadData) return null;

    const handleMarkAsResolved = async () => {
        setIsResolving(true);
        try {
            await markAsResolved(uploadData.id);

            // Đợi refresh hoàn tất trước khi đóng modal
            if (onRefresh) {
                await onRefresh();
            }

            setIsResolving(false);
            onClose();
        } catch (error) {
            setIsResolving(false);
        }
    };

    const handleViewTestSet = () => {
        window.open(`/admin/question-bank/test-sets/view/${uploadData.testSetId}`, '_blank');
    };

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    // Kiểm tra xem có cần hiển thị phần "Trạng thái xử lý" không
    // CHỈ hiển thị khi COMPLETED và có lỗi/trùng (manuallyResolved !== null)
    const shouldShowResolveSection = uploadData.status === 1 &&
        uploadData.manuallyResolved !== null &&
        uploadData.manuallyResolved !== undefined;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 pt-20"
            onClick={handleBackdropClick}
        >
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Chi tiết Upload
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={24}/>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                    {/* Thông tin file */}
                    <div className="mb-6">
                        <h3 className="text-sm font-medium text-gray-500 mb-2">File Upload</h3>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="font-medium text-gray-900">{uploadData.fileName}</p>
                            <p className="text-sm text-gray-600 mt-1">
                                Test Set: {uploadData.testSetName || uploadData.testSetId} • {uploadData.partType}
                            </p>
                        </div>
                    </div>

                    {/* Trạng thái PENDING (3) - Đang chờ */}
                    {uploadData.status === 3 && (
                        <div className="mb-6">
                            <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                <Clock className="text-yellow-600 flex-shrink-0" size={24}/>
                                <div className="flex-1">
                                    <p className="font-medium text-yellow-900">Đang chờ xử lý</p>
                                    <p className="text-sm text-yellow-700 mt-1">
                                        File đang trong hàng đợi, sẽ được xử lý sớm nhất có thể.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Trạng thái PROCESSING (2) - Đang xử lý */}
                    {uploadData.status === 2 && (
                        <div className="mb-6">
                            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <Loader className="text-blue-600 flex-shrink-0 animate-spin" size={24}/>
                                <div className="flex-1">
                                    <p className="font-medium text-blue-900">Đang xử lý file</p>
                                    <p className="text-sm text-blue-700 mt-1">
                                        Hệ thống đang phân tích và import câu hỏi vào test set. Vui lòng đợi...
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Trạng thái CANCELED (0) - Đã hủy */}
                    {uploadData.status === 0 && (
                        <div className="mb-6">
                            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <XCircle className="text-gray-600 flex-shrink-0" size={24}/>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">Tiến trình đã bị hủy</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Trạng thái COMPLETED (1) - Kết quả */}
                    {uploadData.status === 1 && (
                        <div className="mb-6">
                            <h3 className="text-sm font-medium text-gray-500 mb-3">Kết quả xử lý</h3>

                            <div className="space-y-3">
                                {/* Success */}
                                {uploadData.questionsInserted !== undefined && uploadData.questionsInserted !== null && uploadData.questionsInserted > 0 && (
                                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                                        <CheckCircle className="text-green-600 flex-shrink-0" size={20}/>
                                        <div className="flex-1">
                                            <p className="font-medium text-green-900">
                                                {uploadData.questionsInserted} câu đã thêm thành công
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Duplicates */}
                                {/*{uploadData.questionsDuplicated && uploadData.questionsDuplicated > 0 && (*/}
                                {/*    <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">*/}
                                {/*        <div className="flex items-start gap-3 mb-2">*/}
                                {/*            <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20}/>*/}
                                {/*            <div className="flex-1">*/}
                                {/*                <p className="font-medium text-yellow-900">*/}
                                {/*                    {uploadData.questionsDuplicated} câu bị trùng lặp*/}
                                {/*                </p>*/}
                                {/*                <p className="text-sm text-yellow-700 mt-1">*/}
                                {/*                    {uploadData.issueDetails?.duplicates ? (*/}
                                {/*                        <>Các câu số: {uploadData.issueDetails.duplicates.join(', ')}</>*/}
                                {/*                    ) : (*/}
                                {/*                        <>Đã tồn tại trong test set, không thêm lại</>*/}
                                {/*                    )}*/}
                                {/*                </p>*/}
                                {/*            </div>*/}
                                {/*        </div>*/}
                                {/*    </div>*/}
                                {/*)}*/}

                                {/* Errors */}
                                {uploadData.questionsFailed !== null && uploadData.questionsFailed !== undefined && uploadData.questionsFailed > 0 && (
                                    <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                                        <div className="flex items-start gap-3 mb-2">
                                            <XCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20}/>
                                            <div className="flex-1">
                                                <p className="font-medium text-red-900">
                                                    {uploadData.questionsFailed} câu gặp lỗi
                                                </p>
                                                {uploadData.issueDetails?.errors && (
                                                    <p className="text-sm text-red-700 mt-1">
                                                        Các câu số: {uploadData.issueDetails.errors.join(', ')}
                                                    </p>
                                                )}
                                                {uploadData.errorMessage && (
                                                    <p className="text-sm text-red-600 mt-2 p-2 bg-red-100 rounded">
                                                        {uploadData.errorMessage}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* No issues - All success (manuallyResolved = null) */}
                                {uploadData.manuallyResolved === null && (
                                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                                        <CheckCircle className="text-green-600 flex-shrink-0" size={20}/>
                                        <div className="flex-1">
                                            <p className="font-medium text-green-900">
                                                Hoàn thành hoàn hảo! Không có lỗi hoặc trùng lặp.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Trạng thái FAILED (4) - Thất bại */}
                    {uploadData.status === 4 && (
                        <div className="mb-6">
                            <h3 className="text-sm font-medium text-gray-500 mb-3">Lỗi xử lý</h3>
                            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                                <div className="flex items-start gap-3">
                                    <XCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20}/>
                                    <div className="flex-1">
                                        <p className="font-medium text-red-900 mb-1">Upload thất bại</p>
                                        {uploadData.errorMessage && (
                                            <p className="text-sm text-red-700">{uploadData.errorMessage}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Trạng thái xử lý - CHỈ hiển thị khi COMPLETED và manuallyResolved !== null */}
                    {shouldShowResolveSection && (
                        <div className="mb-6">
                            <h3 className="text-sm font-medium text-gray-500 mb-3">Trạng thái xử lý</h3>
                            {uploadData.manuallyResolved ? (
                                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                    <Check className="text-blue-600 flex-shrink-0" size={20}/>
                                    <div className="flex-1">
                                        <p className="font-medium text-blue-900">Đã xử lý thủ công</p>
                                        {uploadData.resolvedBy && uploadData.resolvedAt && (
                                            <p className="text-xs text-blue-600 mt-0.5">
                                                Bởi {uploadData.resolvedBy} • {new Date(uploadData.resolvedAt).toLocaleString('vi-VN')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 mb-4">
                                        <p className="text-sm text-gray-600">
                                            Chưa xử lý. Vui lòng kiểm tra test set và đánh dấu đã xử lý sau khi hoàn tất.
                                        </p>
                                    </div>

                                    {/* Hướng dẫn */}
                                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                        <p className="text-sm font-medium text-blue-900 mb-2">Cần làm gì tiếp theo?</p>
                                        <ol className="text-sm text-blue-800 space-y-1.5 ml-4 list-decimal">
                                            <li>Click "Xem Test Set" bên dưới để kiểm tra các câu hỏi</li>
                                            {uploadData.questionsDuplicated !== null && uploadData.questionsDuplicated !== undefined && uploadData.questionsDuplicated > 0 && (
                                                <li>Xem các câu trùng lặp (đã bỏ qua không thêm vào)</li>
                                            )}
                                            {uploadData.questionsFailed !== null && uploadData.questionsFailed !== undefined && uploadData.questionsFailed > 0 && (
                                                <li>Tìm và sửa/xóa các câu lỗi nếu có trong danh sách</li>
                                            )}
                                            <li>Sau khi xong, quay lại đây và click "Đánh dấu đã xử lý"</li>
                                        </ol>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between gap-3 p-6 border-t bg-gray-50">
                    {/* Chỉ hiển thị nút "Xem Test Set" khi status = COMPLETED */}
                    {uploadData.status === 1 && (
                        <button
                            onClick={handleViewTestSet}
                            className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors font-medium"
                        >
                            <ExternalLink size={18}/>
                            Xem Test Set
                        </button>
                    )}

                    <div className="flex gap-3 ml-auto">
                        {/* Chỉ hiển thị nút "Đánh dấu đã xử lý" khi COMPLETED, có lỗi/trùng (manuallyResolved !== null), và chưa resolve */}
                        {shouldShowResolveSection && !uploadData.manuallyResolved && (
                            <button
                                onClick={handleMarkAsResolved}
                                disabled={isResolving}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                            >
                                <Check size={18}/>
                                {isResolving ? 'Đang xử lý...' : 'Đánh dấu đã xử lý'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UploadDetailModal;