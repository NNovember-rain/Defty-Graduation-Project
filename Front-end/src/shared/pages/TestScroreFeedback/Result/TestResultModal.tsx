import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';
import { ScoringResultResponse } from '../../../services/testService';

interface TestResultModalProps {
    result: ScoringResultResponse;
    testName: string;
    onViewDetails: () => void;
    onClose: () => void;
}

const TestResultModal: React.FC<TestResultModalProps> = ({
                                                             result,
                                                             testName,
                                                             onViewDetails,
                                                             onClose
                                                         }) => {
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const formatTime = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const totalQuestions = result.correctAnswers + result.incorrectAnswers + result.unansweredQuestions;
    const accuracy = totalQuestions > 0
        ? Math.round((result.correctAnswers / totalQuestions) * 100)
        : 0;

    const hasScore = result.totalScore !== null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-lg w-full max-w-[620px] max-h-[90vh] overflow-y-auto animate-fadeIn relative"
            >
                {/* Header */}
                <div className="bg-white px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-5 h-5 text-green-600"/>
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-green-700">
                                    Nộp bài thành công
                                </h2>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:bg-gray-100 rounded-full p-2 transition-colors"
                            aria-label="Đóng"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                      d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6">
                    {/* Test Name */}
                    <div className="mb-5">
                        <h3 className="text-xl font-semibold text-gray-900">{testName}</h3>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                            <span className="flex items-center">
                                <Clock className="w-4 h-4 mr-1 text-gray-500" />
                                <span>Thời gian: {formatTime(result.completionTime)}</span>
                            </span>
                            <span className="text-gray-600">Lần thử: #{result.attemptNumber}</span>
                        </div>
                    </div>

                    {/* Score Cards */}
                    {hasScore && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            {/* Tổng điểm */}
                            <div className="bg-green-50 border border-green-100 rounded-xl p-5 text-center">
                                <div className="text-sm font-medium text-green-700 mb-1 uppercase tracking-wide">
                                    Tổng điểm
                                </div>
                                <div className="text-4xl md:text-5xl font-bold text-green-700 my-2">
                                    {result.totalScore}
                                </div>
                                <div className="text-xs text-green-600 font-medium">/ 990</div>
                            </div>

                            {/* Listening + Reading */}
                            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                                <div className="text-sm font-medium text-gray-700 mb-3 uppercase tracking-wide text-center">
                                    Chi tiết điểm phần
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex-1 bg-white rounded-lg p-3 border border-gray-100 text-center">
                                        <div className="text-xs text-gray-600 mb-1">Listening</div>
                                        <div className="text-2xl font-semibold text-gray-800">
                                            {result.listeningScore || 0}
                                        </div>
                                        <div className="text-xs text-gray-400">/ 495</div>
                                    </div>
                                    <div className="flex-1 bg-white rounded-lg p-3 border border-gray-100 text-center">
                                        <div className="text-xs text-gray-600 mb-1">Reading</div>
                                        <div className="text-2xl font-semibold text-gray-800">
                                            {result.readingScore || 0}
                                        </div>
                                        <div className="text-xs text-gray-400">/ 495</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Statistics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
                            <div className="text-gray-600 text-sm mb-1">Tổng câu</div>
                            <div className="text-2xl font-bold text-gray-800">{totalQuestions}</div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
                            <div className="text-green-700 text-sm mb-1 flex items-center justify-center">
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Đúng
                            </div>
                            <div className="text-2xl font-bold text-green-600">{result.correctAnswers}</div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
                            <div className="text-red-600 text-sm mb-1 flex items-center justify-center">
                                <XCircle className="w-4 h-4 mr-1" />
                                Sai
                            </div>
                            <div className="text-2xl font-bold text-red-600">{result.incorrectAnswers}</div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
                            <div className="text-gray-600 text-sm mb-1 flex items-center justify-center">
                                <AlertCircle className="w-4 h-4 mr-1" />
                                Bỏ qua
                            </div>
                            <div className="text-2xl font-bold text-gray-700">{result.unansweredQuestions}</div>
                        </div>
                    </div>

                    {/* Accuracy Bar */}
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-700">Độ chính xác</span>
                            <span className="text-sm font-bold text-gray-900">{accuracy}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div
                                className="h-3 rounded-full transition-all duration-500"
                                style={{
                                    width: `${accuracy}%`,
                                    background: 'linear-gradient(90deg, rgba(52,211,153,1) 0%, rgba(16,185,129,1) 100%)'
                                }}
                            />
                        </div>
                    </div>

                    {/* Parts Taken */}
                    <div className="mb-6">
                        <div className="text-sm font-medium text-gray-700 mb-2">Các phần đã làm:</div>
                        <div className="flex flex-wrap gap-2">
                            {result.partsTaken.map((part) => (
                                <span
                                    key={part}
                                    className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium border border-gray-200"
                                >
                                    {part.replace('_', ' ')}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-center gap-3 pt-3 border-t border-gray-100">
                        <button
                            onClick={onViewDetails}
                            className="px-5 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all font-semibold text-sm shadow-sm"
                        >
                            Xem đáp án chi tiết
                        </button>

                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-sm border border-gray-200"
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TestResultModal;
