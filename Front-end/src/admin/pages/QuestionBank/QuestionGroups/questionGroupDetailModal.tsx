import React, { useState, useRef, useEffect } from "react";
import { X, Play, Pause } from "lucide-react";
import { Tag } from "antd";

// Types
interface FileItem {
    id: string | number;
    name: string;
    url: string;
    type: "AUDIO" | "IMAGE";
    displayOrder?: number;
}

interface Answer {
    id: string | number;
    content: string;
    isCorrect: boolean;
}

interface Question {
    id: string | number;
    questionNumber: number;
    questionText?: string;
    answers: Answer[];
}

export interface QuestionGroupData {
    questionPart: string;
    difficulty: "EASY" | "MEDIUM" | "HARD";
    status: number;
    requiredAudio: boolean;
    files?: FileItem[];
    questions?: Question[];
    audioTranscript?: string;
    explanation?: string;
    notes?: string;
}

interface QuestionGroupDetailModalProps {
    isOpen: boolean;
    data?: QuestionGroupData | undefined;
    onClose: () => void;
}

// Mock functions - replace with your actual imports
const getDifficultyText = (diff: string): string =>
    diff === "EASY" ? "Dễ" : diff === "MEDIUM" ? "Trung bình" : diff === "HARD" ? "Khó" : "";
const getStatusText = (status: string): string =>
    status === "ACTIVE" ? "Hoạt động" : "Không hoạt động";

const formatTime = (time: number): string => {
    if (!time || isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
};

const QuestionGroupDetailModal: React.FC<QuestionGroupDetailModalProps> = ({
                                                                               isOpen,
                                                                               data,
                                                                               onClose
                                                                           }) => {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const progressBarRef = useRef<HTMLDivElement | null>(null);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [isSeeking, setIsSeeking] = useState<boolean>(false);

    const handlePlayPause = (): void => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleTimeUpdate = (): void => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
            setDuration(audioRef.current.duration);
        }
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>): void => {
        if (!audioRef.current || !duration || !progressBarRef.current) return;
        const rect = progressBarRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percent = Math.min(Math.max(clickX / rect.width, 0), 1);
        audioRef.current.currentTime = percent * duration;
    };

    const handleMouseDown = (): void => setIsSeeking(true);

    const handleMouseUp = (e: MouseEvent): void => {
        if (isSeeking && progressBarRef.current && audioRef.current) {
            const rect = progressBarRef.current.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const percent = Math.min(Math.max(clickX / rect.width, 0), 1);
            audioRef.current.currentTime = percent * duration;
        }
        setIsSeeking(false);
    };

    useEffect(() => {
        document.addEventListener("mouseup", handleMouseUp);
        return () => {
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isSeeking, duration]);

    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
            }
        };
    }, []);

    if (!isOpen || !data) return null;

    const audioFiles: FileItem[] = data.files?.filter((f) => f.type === "AUDIO") || [];
    const imageFiles: FileItem[] = data.files
        ?.filter((f) => f.type === "IMAGE")
        ?.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)) || [];

    return (
        <>
            {/* Main Modal */}
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 mt-[57px]"
                onClick={(e) => {
                    if (e.target === e.currentTarget) onClose();
                }}
            >
                <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <h2 className="text-lg font-semibold text-gray-800">Nhóm Câu Hỏi</h2>
                            <Tag color="blue">{data.questionPart}</Tag>
                            {getDifficultyText(data.difficulty) !== "" && (

                                <Tag
                                    color={
                                        data.difficulty === "EASY"
                                            ? "green"
                                            : data.difficulty === "MEDIUM"
                                                ? "orange"
                                                : "red"
                                    }
                                >
                                    {getDifficultyText(data.difficulty)}
                                </Tag>
                            )}
                            <Tag color={data.status === 1 ? "green" : "red"}>
                                {getStatusText(data.status === 1 ? "ACTIVE" : "INACTIVE")}
                            </Tag>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 p-6 flex flex-col overflow-hidden gap-6">
                        {/* Audio Player */}
                        {data.requiredAudio && audioFiles.length > 0 && (
                            <div className="flex-shrink-0 bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={handlePlayPause}
                                        className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors flex-shrink-0"
                                    >
                                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                                    </button>

                                    <span className="text-sm text-blue-700 truncate min-w-[100px]">
                                        {audioFiles[0].name || "Audio file"}
                                    </span>

                                    <div
                                        ref={progressBarRef}
                                        className="relative flex-1 h-2 bg-gray-200 rounded cursor-pointer"
                                        onClick={handleSeek}
                                        onMouseDown={handleMouseDown}
                                    >
                                        <div
                                            className="absolute top-0 left-0 h-2 bg-blue-500 rounded"
                                            style={{ width: duration ? `${(currentTime / duration) * 100}%` : "0%" }}
                                        />
                                        <div
                                            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-600 rounded-full shadow"
                                            style={{
                                                left: duration ? `calc(${(currentTime / duration) * 100}% - 6px)` : "0%",
                                            }}
                                        />
                                    </div>

                                    <span className="text-xs text-gray-600 whitespace-nowrap min-w-[80px]">
                                        {formatTime(currentTime)} / {formatTime(duration)}
                                    </span>

                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.01"
                                        defaultValue="1"
                                        className="w-20 h-1 accent-blue-500 flex-shrink-0"
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                            if (audioRef.current) {
                                                audioRef.current.volume = parseFloat(e.target.value);
                                            }
                                        }}
                                    />

                                    <audio
                                        ref={audioRef}
                                        src={audioFiles[0].url}
                                        onTimeUpdate={handleTimeUpdate}
                                        onEnded={() => setIsPlaying(false)}
                                    />
                                </div>
                            </div>
                        )}

                        {data.requiredAudio && audioFiles.length === 0 && (
                            <div className="flex-shrink-0 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <p className="text-sm text-yellow-800">Yêu cầu audio nhưng chưa có file</p>
                            </div>
                        )}

                        {/* Main Content Grid */}
                        <div className="flex-1 min-h-0 grid grid-cols-12 gap-6">
                            {/* Images Column */}
                            {imageFiles.length > 0 && (
                                <div className="col-span-7 flex flex-col min-h-0">
                                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex-shrink-0">
                                        Hình ảnh
                                    </h3>
                                    <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg p-4 space-y-4">
                                        {imageFiles.map((img) => (
                                            <div
                                                key={img.id}
                                                className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                                            >
                                                <img
                                                    src={img.url}
                                                    alt={`Image ${img.displayOrder}`}
                                                    className="w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                                                    onClick={() => setSelectedImage(img.url)}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Questions Column */}
                            <div className={`${imageFiles.length > 0 ? "col-span-5" : "col-span-12"} flex flex-col min-h-0`}>
                                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex-shrink-0">
                                    Câu hỏi
                                </h3>
                                <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg p-4 space-y-4">
                                    {data.questions?.map((q) => (
                                        <div key={q.id} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 shadow-sm">
                                            {/* Question */}
                                            <div className="flex items-start gap-3 mb-3">
                                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center font-bold text-sm shadow-sm">
                                                    {q.questionNumber}
                                                </div>
                                                {q.questionText?.trim() && (
                                                    <div className="flex-1 font-semibold text-gray-900 pt-1">
                                                        {q.questionText}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Answers */}
                                            <div className="space-y-2 ml-11">
                                                {q.answers?.map((a, idx) => (
                                                    <div
                                                        key={a.id}
                                                        className={`flex items-start gap-2 px-3 py-2 rounded-md transition-all ${
                                                            a.isCorrect
                                                                ? "bg-green-100 border-2 border-green-400 shadow-sm"
                                                                : "bg-white border border-gray-200 hover:bg-gray-50"
                                                        }`}
                                                    >
                                                        <span
                                                            className={`font-bold min-w-[28px] flex-shrink-0 ${
                                                                a.isCorrect ? "text-green-700" : "text-gray-600"
                                                            }`}
                                                        >
                                                            {String.fromCharCode(65 + idx)}.
                                                        </span>
                                                        <span
                                                            className={`flex-1 ${
                                                                a.isCorrect
                                                                    ? "text-green-900 font-semibold"
                                                                    : "text-gray-800"
                                                            }`}
                                                        >
                                                            {a.content?.trim()}
                                                        </span>
                                                        {a.isCorrect && (
                                                            <span className="text-green-600 text-xs font-bold flex-shrink-0">✓</span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Extra Info */}
                        {(data.audioTranscript || data.explanation || data.notes) && (
                            <div className="flex-shrink-0 space-y-3">
                                {data.audioTranscript && (
                                    <details className="bg-gray-50 p-4 border border-gray-200 rounded-lg">
                                        <summary className="cursor-pointer font-semibold text-gray-800 hover:text-blue-600 transition-colors">
                                            Transcript
                                        </summary>
                                        <div
                                            className="mt-3 text-gray-700 leading-relaxed prose prose-sm max-w-none"
                                            dangerouslySetInnerHTML={{ __html: data.audioTranscript }}
                                        />
                                    </details>
                                )}

                                {data.explanation && (
                                    <details className="bg-gray-50 p-4 border border-gray-200 rounded-lg">
                                        <summary className="cursor-pointer font-semibold text-gray-800 hover:text-blue-600 transition-colors">
                                            Giải thích
                                        </summary>
                                        <div
                                            className="mt-3 text-gray-700 leading-relaxed prose prose-sm max-w-none"
                                            dangerouslySetInnerHTML={{ __html: data.explanation }}
                                        />
                                    </details>
                                )}

                                {data.notes && (
                                    <details className="bg-gray-50 p-4 border border-gray-200 rounded-lg">
                                        <summary className="cursor-pointer font-semibold text-gray-800 hover:text-blue-600 transition-colors">
                                            Ghi chú
                                        </summary>
                                        <div
                                            className="mt-3 text-gray-700 leading-relaxed prose prose-sm max-w-none"
                                            dangerouslySetInnerHTML={{ __html: data.notes }}
                                        />
                                    </details>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end px-6 py-4 border-t border-gray-200 flex-shrink-0">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors font-medium"
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            </div>

            {/* Image Lightbox Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90"
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="relative max-w-5xl max-h-[90vh] p-4">
                        <img
                            src={selectedImage}
                            alt="Full size"
                            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                        />
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute top-6 right-6 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-full p-2 transition-all hover:scale-110"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default QuestionGroupDetailModal;