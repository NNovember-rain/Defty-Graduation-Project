import React, { useState, useCallback, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    FaCloudUploadAlt,
    FaFolderOpen,
    FaTimes,
    FaFilePdf,
    FaSpinner,
    FaCheckCircle,
    FaExclamationTriangle,
    FaInfoCircle,
} from 'react-icons/fa';
import PageLayoutWrapper from '../../../template/ManagementTemplate/pageLayoutWrapper';
import { getAllActiveTestSets, type ITestSet } from '../../../../shared/services/questionBankService/testSetService';
import { uploadTestFile } from '../../../../shared/services/questionBankService/fileProcessingService';
// 1. Import useNotification
import { useNotification } from "../../../../shared/notification/useNotification";
import TestSetSelector from './TestSetSelector';

interface UploadState {
    file: File | null;
    uploading: boolean;
    status: 'idle' | 'uploading' | 'success' | 'error';
    message: string;
}

const UploadTestForm: React.FC = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 2. Khởi tạo hook useNotification
    const { message } = useNotification();

    const [selectedTestSet, setSelectedTestSet] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [uploadState, setUploadState] = useState<UploadState>({
        file: null,
        uploading: false,
        status: 'idle',
        message: ''
    });
    const [dragOver, setDragOver] = useState(false);
    const [testSets, setTestSets] = useState<ITestSet[]>([]);
    const [loadingTestSets, setLoadingTestSets] = useState(true);

    // 3. Thay thế các hàm alert bằng message.warning/error/success

    // Hàm thay thế cho alert (thông báo lỗi/cảnh báo)
    const showWarning = (msg: string) => message.warning(msg);
    // Hàm thay thế cho alert (thông báo lỗi)
    const showError = (msg: string) => message.error(msg);
    // Hàm thay thế cho alert (thông báo thành công)
    const showSuccess = (msg: string) => message.success(msg);

    useEffect(() => {
        const fetchTestSets = async () => {
            try {
                setLoadingTestSets(true);
                const response = await getAllActiveTestSets();
                if (response.status === 200 && response.data) {
                    const formattedTestSets = response.data.map((testSet: ITestSet) => ({
                        id: testSet.id,
                        testName: testSet.testName,  // ✅ Đúng
                        totalQuestions: testSet.totalQuestions,
                        collectionName: testSet.collectionName,
                        createdDate: testSet.createdDate
                    }));
                    setTestSets(formattedTestSets);
                }
            } catch (error) {
                console.error('Failed to fetch test sets:', error);
                // Dùng showError mới
                showError('Không thể tải danh sách đề thi. Vui lòng thử lại.');
            } finally {
                setLoadingTestSets(false);
            }
        };

        fetchTestSets();
    }, []);

    const sections = [
        { value: 'LC', label: 'Listening Comprehension (LC)', icon: '🎧' },
        { value: 'RC', label: 'Reading Comprehension (RC)', icon: '📖' }
    ];

    const breadcrumbItems = [
        { label: 'Trang chủ', path: '/' },
        { label: 'Ngân hàng câu hỏi'},
        { label: 'Lịch sử tải lên', path: '/admin/question-bank/testset-processes' },
        { label: 'Tải lên đề thi'},
    ];

    // CÁC HÀM NÀY ĐÃ ĐƯỢC ĐỊNH NGHĨA LẠI Ở PHÍA TRÊN
    // const showWarning = (msg: string) => alert(msg);
    // const showError = (msg: string) => alert(msg);
    // const showSuccess = (msg: string) => alert(msg);

    const handleFileSelect = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFile(file);
        }
    }, []);

    const handleFile = useCallback((file: File) => {
        if (file.type !== 'application/pdf') {
            // Dùng showError mới
            showError('Chỉ chấp nhận file PDF');
            return;
        }

        if (file.size > 30 * 1024 * 1024) {
            // Dùng showError mới
            showError('File vượt quá giới hạn 30MB');
            return;
        }

        setUploadState({
            file,
            uploading: false,
            status: 'idle',
            message: ''
        });
    }, []);

    const removeFile = useCallback(() => {
        setUploadState({
            file: null,
            uploading: false,
            status: 'idle',
            message: ''
        });
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) {
            handleFile(file);
        }
    }, [handleFile]);

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleUpload = async () => {
        if (!selectedTestSet) {
            // Dùng showWarning mới
            showWarning('Vui lòng chọn Test Set');
            return;
        }

        if (!selectedSection) {
            // Dùng showWarning mới
            showWarning('Vui lòng chọn phần thi');
            return;
        }

        if (!uploadState.file) {
            // Dùng showError mới
            showError('Vui lòng chọn file PDF');
            return;
        }

        setUploadState(prev => ({
            ...prev,
            uploading: true,
            status: 'uploading',
            message: 'Đang upload file...'
        }));

        try {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const response = await uploadTestFile({
                testSetId: selectedTestSet,
                partType: selectedSection,
                file: uploadState.file
            });

            setUploadState(prev => ({
                ...prev,
                uploading: false,
                status: 'success',
                message: 'Upload file thành công. File đang được xử lý.'
            }));

            showSuccess('Upload file thành công. File đang được xử lý.');

            setTimeout(() => {
                navigate('/admin/question-bank/testset-processes');
            }, 2000);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Upload thất bại. Vui lòng thử lại.';
            setUploadState(prev => ({
                ...prev,
                uploading: false,
                status: 'error',
                message: errorMessage
            }));
            // Dùng showError mới
            showError(errorMessage);
        }
    };

    const canUpload = selectedTestSet && selectedSection && uploadState.file && !uploadState.uploading && uploadState.status !== 'success';

    return (
        <PageLayoutWrapper
            pageTitle="Upload Đề Thi TOEIC"
            breadcrumbItems={breadcrumbItems}
            showDefaultPadding={false}
        >
            <div className="bg-gray-50 min-h-screen">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    {/* Row 1: Test Configuration & File Upload */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-6 lg:mb-8">
                        {/* Left: Test Configuration */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">Cài đặt Bài Thi</h3>

                            <div className="space-y-4 sm:space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Chọn Đề Thi <span className="text-red-500">*</span>
                                    </label>
                                    {loadingTestSets ? (
                                        <div className="flex items-center px-3 py-2 text-gray-500 text-sm">
                                            <FaSpinner className="animate-spin mr-2"/>
                                            Đang tải danh sách đề thi...
                                        </div>
                                    ) : (
                                        <TestSetSelector
                                            testSets={testSets}
                                            selectedTestSetId={selectedTestSet}
                                            onSelect={setSelectedTestSet}
                                            loading={loadingTestSets}
                                            placeholder="Chọn đề thi"
                                        />
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Chọn Phần Thi <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                                        {sections.map((section) => (
                                            <label
                                                key={section.value}
                                                className={`flex-1 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 border rounded-lg cursor-pointer transition-all ${
                                                    selectedSection === section.value
                                                        ? 'border-gray-800 bg-gray-50'
                                                        : 'border-gray-300'
                                                }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="section"
                                                    value={section.value}
                                                    checked={selectedSection === section.value}
                                                    onChange={(e) => setSelectedSection(e.target.value)}
                                                    className="w-4 h-4 text-gray-800 focus:ring-gray-500"
                                                />
                                                <span className="text-xl sm:text-2xl">{section.icon}</span>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-gray-800 text-sm sm:text-base">
                                                        {section.value}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {section.value === "LC" ? "Part 1-4" : "Part 5-7"}
                                                    </span>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Right: File Upload */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">
                                Upload File PDF
                            </h3>

                            {!uploadState.file ? (
                                <div
                                    className={`border-2 border-dashed rounded-lg p-8 sm:p-12 text-center cursor-pointer transition-colors ${
                                        dragOver ? 'border-gray-800 bg-gray-50' : 'border-gray-300 hover:border-gray-400'
                                    }`}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    onClick={handleFileSelect}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".pdf"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                    <div className="space-y-3 sm:space-y-4">
                                        <FaFilePdf className="text-5xl sm:text-6xl text-red-400 mx-auto"/>
                                        <div>
                                            <h4 className="text-base sm:text-lg font-medium text-gray-700">
                                                Kéo thả file PDF hoặc click để chọn
                                            </h4>
                                            <p className="text-sm text-gray-500 mt-2">Chỉ chấp nhận file PDF</p>
                                            <p className="text-xs sm:text-sm text-gray-400 mt-1">Kích thước tối đa: 30MB</p>
                                        </div>
                                        <button
                                            type="button"
                                            className="px-4 sm:px-6 py-2 sm:py-3 bg-gray-800 text-white text-sm sm:text-base rounded-lg hover:bg-gray-700 inline-flex items-center"
                                        >
                                            <FaFolderOpen className="mr-2"/>
                                            Chọn File PDF
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                                            <FaFilePdf className="text-2xl sm:text-3xl text-red-600 flex-shrink-0"/>
                                            <div className="min-w-0">
                                                <div className="font-medium text-gray-800 text-sm sm:text-base truncate">{uploadState.file.name}</div>
                                                <div className="text-xs sm:text-sm text-gray-500">
                                                    {formatFileSize(uploadState.file.size)}
                                                </div>
                                            </div>
                                        </div>
                                        {!uploadState.uploading && uploadState.status === 'idle' && (
                                            <button
                                                onClick={removeFile}
                                                className="text-red-600 hover:text-red-800 flex-shrink-0 ml-2"
                                                type="button"
                                            >
                                                <FaTimes className="text-lg sm:text-xl"/>
                                            </button>
                                        )}
                                    </div>

                                    {uploadState.uploading && (
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                                            <div className="flex items-center">
                                                <FaSpinner className="animate-spin text-blue-600 mr-2 flex-shrink-0"/>
                                                <span className="font-medium text-blue-800 text-sm sm:text-base">{uploadState.message}</span>
                                            </div>
                                        </div>
                                    )}

                                    {uploadState.status === 'success' && (
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
                                            <div className="flex items-center">
                                                <FaCheckCircle className="text-green-600 text-xl sm:text-2xl mr-2 sm:mr-3 flex-shrink-0"/>
                                                <div>
                                                    {/*<h4 className="font-medium text-green-800 text-sm sm:text-base">{uploadState.message}</h4>*/}
                                                    <p className="text-xs sm:text-sm text-green-600 mt-1">
                                                        Chuyển hướng đến trang lịch sử upload...
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {uploadState.status === 'error' && (
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
                                            <div className="flex items-center">
                                                <FaExclamationTriangle className="text-red-600 text-xl sm:text-2xl mr-2 sm:mr-3 flex-shrink-0"/>
                                                <div>
                                                    <h4 className="font-medium text-red-800 text-sm sm:text-base">{uploadState.message}</h4>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Row 2: Instructions & Warning */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-6 lg:gap-8 mb-6">
                        {/* Left: Instructions */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-5">
                            <div className="flex items-start">
                                <FaInfoCircle className="text-blue-600 mt-1 mr-2 sm:mr-3 flex-shrink-0"/>
                                <div>
                                    <h4 className="font-semibold text-blue-800 mb-2 text-sm sm:text-base">Hướng dẫn Upload</h4>
                                    <ul className="text-xs sm:text-sm text-blue-700 space-y-1.5 sm:space-y-2">
                                        <li>• Chọn đề thi đã được tạo trên hệ thống</li>
                                        <li>• Mỗi lần upload chỉ upload 1 phần thi (LC hoặc RC)</li>
                                        <li>• Chỉ chấp nhận file PDF, tối đa 30MB</li>
                                        <li>• Hệ thống sẽ tự động parse PDF và lưu câu hỏi</li>
                                        <li>• Quá trình xử lý có thể mất vài phút</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Right: Warning */}
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 sm:p-5">
                            <div className="flex items-start">
                                <FaExclamationTriangle className="text-yellow-600 mt-1 mr-2 sm:mr-3 flex-shrink-0"/>
                                <div>
                                    <h4 className="font-semibold text-yellow-800 mb-2 text-sm sm:text-base">Lưu ý quan trọng</h4>
                                    <p className="text-xs sm:text-sm text-yellow-700">
                                        Vui lòng kiểm tra kỹ thông tin trước khi upload.
                                        File đã upload không thể chỉnh sửa, chỉ có thể upload lại.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4">
                        <Link
                            to="/admin/question-bank/testset-processes"
                            className="px-4 sm:px-6 py-2 sm:py-3 border border-gray-300 rounded-lg hover:bg-gray-50 inline-flex items-center justify-center text-gray-700 text-sm sm:text-base"
                        >
                            Hủy
                        </Link>

                        <button
                            onClick={handleUpload}
                            disabled={!canUpload}
                            className="px-4 sm:px-6 py-2 sm:py-3 bg-green-600 text-white text-sm sm:text-base rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center"
                        >
                            {uploadState.uploading ? (
                                <>
                                    <FaSpinner className="animate-spin mr-2"/>
                                    Đang xử lý...
                                </>
                            ) : (
                                <>
                                    <FaCloudUploadAlt className="mr-2"/>
                                    Upload & Hoàn thành
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </PageLayoutWrapper>
    );
};

export default UploadTestForm;