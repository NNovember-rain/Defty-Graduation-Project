    import { ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
    import React, { useState, useEffect, useCallback, useRef } from 'react';
    import { useNavigate, useParams } from "react-router-dom";
    import {
        submitTest,
        convertAnswersToUserAnswerDetails,
        getPartsTakenFromQuestionGroups,
        formatResultForDisplay,
        type ScoringResultResponse
    } from '../../../services/testService.ts';
    import {getQuestionGroupOrders} from '../../../services/questionBankService/testSetService.ts';
    import TestResultModal from '../Result/TestResultModal.tsx';
    import LoadingSpinner from '../../../../client/components/LoadingSpinner.tsx';

    interface Answer {
        id: string;
        content: string;
        answerOrder: number;
    }

    interface Question {
        id: string;
        questionNumber: number;
        questionText: string;
        answers: Answer[];
    }

    interface QuestionFile {
        id: string;
        url: string;
        fileType: 'IMAGE' | 'AUDIO';
        displayOrder: number;
    }

    interface QuestionGroup {
        id: string;
        questionPart: string;
        questionGroupOrder: number;
        passageText: string | null;
        files: QuestionFile[];
        questions: Question[];
    }

    interface TestData {
        collectionId: string;
        testSetId: string;
        testName: string;
        questionGroups: QuestionGroup[];
    }

    interface TimerProps {
        timeRemaining: number;
        onTimeUp: () => void;
    }

    interface AudioPlayerProps {
        audioSource: string;
        audioId: string;
        isTestMode: boolean;
        onAudioEnd?: () => void;
        autoPlay?: boolean;
        playbackSpeed?: number;
        onSpeedChange?: (speed: number) => void;
    }

    interface QuestionCardProps {
        questionNum: number;
        questionText?: string;
        options: { letter: string; text: string }[];
        selectedAnswer?: string;
        onSelectAnswer: (questionNum: number, answer: string) => void;
        isFlagged: boolean;
        onToggleFlag: (questionNum: number) => void;
        passageText?: string;
        isLocked?: boolean;
    }

    interface NavButtonProps {
        questionNum: number;
        isAnswered: boolean;
        isFlagged: boolean;
        isCurrent: boolean;
        isCurrentGroup: boolean;
        onClick: (questionNum: number) => void;
        isDisabled?: boolean;
    }

    interface AudioPreloadStatus {
        url: string;
        status: 'pending' | 'loading' | 'loaded' | 'error';
        retryCount: number;
    }


    const Timer: React.FC<TimerProps> = ({ timeRemaining, onTimeUp }) => {
        const hours = Math.floor(timeRemaining / 3600);
        const minutes = Math.floor((timeRemaining % 3600) / 60);
        const seconds = timeRemaining % 60;

        useEffect(() => {
            if (timeRemaining === 0) {
                onTimeUp();
            }
        }, [timeRemaining, onTimeUp]);

        return (
            <div className="text-lg sm:text-2xl lg:text-3xl font-bold tracking-wide text-gray-800">
                {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
        );
    };

    const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioSource,
                                                         audioId,
                                                         isTestMode,
                                                         onAudioEnd,
                                                         autoPlay = false,
                                                         playbackSpeed = 1,
                                                         onSpeedChange  }) => {
        const audioRef = useRef<HTMLAudioElement>(null);
        const playerRef = useRef<any>(null);
        const [plyrLoaded, setPlyrLoaded] = useState(false);

        useEffect(() => {
            if (!document.querySelector('link[href*="plyr.css"]')) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = 'https://cdnjs.cloudflare.com/ajax/libs/plyr/3.7.8/plyr.css';

                document.head.appendChild(link);

                const style = document.createElement('style');
                style.textContent = `
                    .plyr__menu { position: relative !important; z-index: 50 !important; }
                    .plyr__menu__container {
                        position: absolute !important; top: 100% !important;
                        bottom: auto !important; right: 0 !important;
                        left: auto !important; margin-top: 6px !important;
                        border-radius: 8px !important; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
                        background: #fff !important; z-index: 9999 !important;
                    }
                    .plyr__menu__container::after {
                        top: -6px !important; bottom: auto !important;
                        transform: rotate(180deg); right: 12px !important;
                        border-width: 6px; border-style: solid;
                        border-color: transparent transparent #fff transparent !important;
                    }
                    .plyr__controls { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
                    .plyr__controls button[data-plyr="settings"] { margin-left: 4px; }
                    .plyr--audio { border-radius: 10px; background: #f9fafb; padding: 0.3rem 0.5rem; }
                    .plyr--audio .plyr__controls button {
                        border-radius: 6px !important; background: transparent !important; transition: none !important;
                    }
                    .plyr--audio .plyr__controls button:hover { background: #e5e7eb !important; }
                    .plyr--audio .plyr__progress input[type="range"]::-webkit-slider-thumb { background: #3b82f6; }
                    .plyr--audio .plyr__progress input[type="range"]::-moz-range-thumb { background: #3b82f6; }
                    .plyr__tooltip { z-index: 9999 !important; }
                    /* Mobile - thu nhỏ lại */
                    @media (max-width: 640px) {
                        .plyr__controls {
                            display: flex !important;
                            align-items: center !important; 
                        }
                        .plyr__controls > * {
                            vertical-align: middle !important;
                        }
                        
                        .plyr__controls button {
                            display: flex !important;
                            align-items: center !important;
                            justify-content: center !important;
                          }
                        
                        /* và thu nhỏ padding trong container để không bị “nâng” control */
                        .plyr--audio {
                            padding-top: 0 !important;
                            padding-bottom: 0 !important;
                          }
                        
                        .plyr--audio { 
                            background: transparent !important; 
                            padding: 0.25rem 0;
                        }
                        
                        .plyr--audio .plyr__controls button {
                            width: 28px !important;
                            height: 28px !important;
                            border-radius: 4px !important;
                        }
                        
                        .plyr--audio .plyr__controls button svg {
                            width: 18px !important;
                            height: 18px !important;
                        }
                        
                        .plyr--audio .plyr__controls button:hover { 
                            background: #f3f4f6 !important; 
                        }
                        
                        .plyr--audio .plyr__progress {
                            min-width: 20px;
                            max-width: 150px;
                        }
                        
                        .plyr--audio .plyr__progress input[type="range"] {
                            height: 4px !important;
                        }
                        
                        .plyr--audio .plyr__progress input[type="range"]::-webkit-slider-thumb { 
                            width: 12px !important;
                            height: 12px !important;
                        }
                        .plyr--audio .plyr__progress input[type="range"]::-moz-range-thumb { 
                            width: 12px !important;
                            height: 12px !important;
                        }
                        
                        .plyr__time {
                            font-size: 0.7rem !important;
                            padding: 0 2px;
                            color: #6b7280 !important;
                        }
                        
                        .plyr__volume {
                            min-width: 50px;
                            max-width: 80px;
                        }
                        
                        .plyr__volume input[type="range"] {
                            height: 4px !important;
                            min-width: 45px;
                            max-width: 50px;
                        }
                        
                        .plyr__volume input[type="range"]::-webkit-slider-thumb { 
                            width: 12px !important;
                            height: 12px !important;
                        }
                        .plyr__volume input[type="range"]::-moz-range-thumb { 
                            width: 12px !important;
                            height: 12px !important;
                        }
                        /* Mở rộng menu Speed cho mobile */
                        .plyr__menu__container {
                            min-width: 140px !important;
                            width: auto !important;
                        }
                        
                        .plyr__menu__container [role="menu"] {
                            padding: 8px !important;
                        }
                        
                        .plyr__menu__container [role="menuitemradio"] {
                            padding: 8px 12px !important;
                            white-space: nowrap !important;
                        }
                        
                        .plyr__menu__container .plyr__control[role="menuitemradio"]::after {
                            display: none !important;
                            content: none !important;
                        } 
                        .plyr__menu__container .plyr__control::after {
                          display: none !important;
                          content: none !important;
                        } 
                        .plyr__menu__value {
                          width: auto !important;
                          overflow: visible !important;
                          white-space: nowrap !important;
                          display: inline-block !important;
                          pointer-events: auto !important;
                        }
                    }
                `;
                document.head.appendChild(style);
            }

            if (typeof (window as any).Plyr === 'undefined') {
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/plyr/3.7.8/plyr.min.js';
                script.onload = () => {
                    setPlyrLoaded(true);
                    initializePlyr();
                };
                document.body.appendChild(script);
            } else {
                setPlyrLoaded(true);
                initializePlyr();
            }

            return () => {
                if (playerRef.current) {
                    playerRef.current.destroy();
                    playerRef.current = null;
                }
            };
        }, []);

        useEffect(() => {
            if (plyrLoaded && audioRef.current) {
                audioRef.current.src = audioSource;
                audioRef.current.load();

                // ✅ Set playbackRate NGAY khi audio loaded
                const handleLoadedMetadata = () => {
                    if (!isTestMode && audioRef.current) {
                        audioRef.current.playbackRate = playbackSpeed;
                        // console.log('🔄 Set playback rate on load:', playbackSpeed);

                        // Cập nhật Plyr UI
                        if (playerRef.current) {
                            playerRef.current.speed = playbackSpeed;
                        }
                    }
                };

                audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);

                if (autoPlay) {
                    const playPromise = audioRef.current.play();
                    if (playPromise !== undefined) {
                        playPromise.catch(err => console.error('Autoplay failed:', err));
                    }
                }

                // Cleanup
                return () => {
                    if (audioRef.current) {
                        audioRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
                    }
                };
            }
        }, [audioSource, plyrLoaded, autoPlay, isTestMode, playbackSpeed]); // ✅ Thêm playbackSpeed vào dependency

        useEffect(() => {
            if (playerRef.current && audioRef.current && !isTestMode) {
                // Cập nhật speed trong Plyr
                if (playerRef.current.speed !== playbackSpeed) {
                    playerRef.current.speed = playbackSpeed;
                }
                // Cập nhật playbackRate trong audio element
                if (audioRef.current.playbackRate !== playbackSpeed) {
                    audioRef.current.playbackRate = playbackSpeed;
                }
                // console.log('🔄 Updated playback speed to:', playbackSpeed);
            }
        }, [playbackSpeed, isTestMode]);

        const initializePlyr = () => {
            if (audioRef.current && (window as any).Plyr) {
                try {
                    if (playerRef.current) {
                        playerRef.current.destroy();
                    }

                    const controls = isTestMode
                        ? ['play', 'progress', 'current-time', 'duration']
                        : ['play', 'progress', 'current-time', 'duration', 'mute', 'volume', 'settings'];

                    playerRef.current = new (window as any).Plyr(audioRef.current, {
                        controls,
                        settings: isTestMode ? [] : ['speed'],
                        speed: isTestMode
                            ? { selected: 1, options: [1] }
                            : { selected: playbackSpeed, options: [0.5, 0.75, 0.9, 1, 1.1, 1.25, 1.5, 2] },
                        tooltips: { controls: true, seek: !isTestMode },
                        displayDuration: true,
                        invertTime: false,
                        seekTime: isTestMode ? 0 : 10
                    });

                    if (!isTestMode && onSpeedChange) {
                        playerRef.current.on('ratechange', () => {
                            const newSpeed = playerRef.current.speed;
                            // console.log('🎵 Speed changed to:', newSpeed);
                            onSpeedChange(newSpeed);
                        });
                    }

                    // Set lại speed sau khi khởi tạo (đảm bảo áp dụng đúng)
                    if (!isTestMode && audioRef.current) {
                        audioRef.current.playbackRate = playbackSpeed;
                    }

                    if (audioRef.current && onAudioEnd) {
                        audioRef.current.addEventListener('ended', onAudioEnd);
                    }
                } catch (e) {
                    console.error('Error initializing Plyr:', e);
                }
            }
        };

        return (
            <div className="audio-player rounded-lg bg-white relative z-50">
                <audio ref={audioRef} preload="metadata">
                    <source src={audioSource} type="audio/mpeg" />
                    <source src={audioSource} type="audio/wav" />
                </audio>
            </div>
        );
    };

    const QuestionCard: React.FC<QuestionCardProps> = ({questionNum, questionText, options, selectedAnswer, onSelectAnswer, isFlagged, onToggleFlag, passageText, isLocked = false}) => {
        return (
            <div className={`border border-gray-100 rounded-md bg-white mb-2 transition-all ${isLocked ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between px-2 sm:px-2.5 py-2 border-b border-gray-50">
                    <div className="flex items-start flex-1 min-w-0">
                        <div
                            className="flex items-center justify-center bg-gray-100 text-gray-700 font-medium
                                        rounded-full w-7 h-7 text-xs sm:text-sm mr-2 flex-shrink-0 border border-gray-300">
                            {questionNum}
                        </div>

                        {questionText && (
                            <span className="text-base sm:text-lg text-gray-900 leading-relaxed break-words font-normal">
                                {questionText}
                            </span>
                        )}
                    </div>


                    <button
                        className={`ml-2 p-1 rounded hover:bg-gray-100 flex-shrink-0 ${
                            isFlagged ? "text-yellow-500" : "text-gray-400"
                        } ${isLocked ? 'cursor-not-allowed' : ''}`}
                        onClick={() => !isLocked && onToggleFlag(questionNum)}
                        title={isLocked ? "Đã khóa" : (isFlagged ? "Bỏ gắn cờ" : "Gắn cờ câu hỏi")}
                        disabled={isLocked}
                    >
                        <svg className="w-4 h-4" fill={isFlagged ? "currentColor" : "none"} stroke="currentColor"
                             viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                  d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 2h7a2 2 0 012 2v6a2 2 0 01-2 2H12l-1-2H5a2 2 0 00-2 2z"/>
                        </svg>
                    </button>
                </div>

                {passageText && (
                    <div className="px-2 sm:px-2.5 py-2 bg-gray-50 border-b border-gray-100">
                        <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap">{passageText}</p>
                    </div>
                )}

                <div className="space-y-2 p-2 sm:px-2.5 sm:pb-2.5">
                    {options.map((option) => (
                        <label
                            key={option.letter}
                            className={`flex items-center space-x-2 text-gray-800 ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                            <input
                                type="radio"
                                name={`answer-${questionNum}`}
                                value={option.letter}
                                className="w-4 h-4 text-blue-600 focus:ring-0 focus:outline-none mt-0.5 flex-shrink-0"
                                checked={selectedAnswer === option.letter}
                                onChange={() => !isLocked && onSelectAnswer(questionNum, option.letter)}
                                disabled={isLocked}
                            />
                            <span className="text-base sm:text-lg break-words leading-relaxed">
                                {option.letter}. {option.text || ''}
                            </span>
                        </label>
                    ))}
                </div>
            </div>
        );
    };

    const NavButton: React.FC<NavButtonProps> = ({
                                                     questionNum,
                                                     isAnswered,
                                                     isFlagged, isCurrent, isCurrentGroup, onClick, isDisabled = false}) => {
        const getClassName = () => {
            let classes = 'w-8 h-8 rounded text-xs font-semibold transition-colors ';
            if (isDisabled) return classes + 'bg-gray-200 text-gray-400 cursor-not-allowed';
            if (isCurrent) return classes + 'bg-blue-500 text-white cursor-pointer';
            if (isCurrentGroup) return classes + 'bg-blue-400 text-white cursor-pointer';
            if (isFlagged) return classes + 'bg-yellow-500 text-white cursor-pointer';
            if (isAnswered) return classes + 'bg-green-500 text-white cursor-pointer';
            return classes + 'bg-gray-100 hover:bg-gray-200 cursor-pointer';
        };

        return (
            <button
                className={getClassName()}
                onClick={() => !isDisabled && onClick(questionNum)}
                disabled={isDisabled}
            >
                {questionNum}
            </button>
        );
    };

    interface DirectionModalProps {
        part: string;
        directionText: string;
        audioUrl: string | null;
        onStart: () => void;
        onAudioEnd?: () => void;
        isAudioPlaying: boolean;
        setIsAudioPlaying: (playing: boolean) => void;
    }

    const DirectionModal: React.FC<DirectionModalProps> = ({
                                                               part,
                                                               directionText,
                                                               audioUrl,
                                                               onStart,
                                                               onAudioEnd,
                                                               isAudioPlaying,
                                                               setIsAudioPlaying
                                                           }) => {
        const audioRef = useRef<HTMLAudioElement>(null);
        const [countdown, setCountdown] = useState<number | null>(null);

        const partNum = part.replace('PART_', '');
        const isListeningPart = ['1', '2', '3', '4'].includes(partNum);

        useEffect(() => {
            if (audioUrl && audioRef.current && isListeningPart) {
                audioRef.current.play();
                setIsAudioPlaying(true);
            }
        }, [audioUrl, isListeningPart]);

        const handleAudioEnded = () => {
            setIsAudioPlaying(false);
            // Auto start countdown sau khi audio kết thúc
            setCountdown(3);
        };

        useEffect(() => {
            if (countdown === null) return;

            if (countdown > 0) {
                const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
                return () => clearTimeout(timer);
            } else {
                // Auto start khi countdown về 0
                onStart();
            }
        }, [countdown, onStart]);

        const handleStartNow = () => {
            if (audioRef.current && isAudioPlaying) {
                audioRef.current.pause();
            }
            setIsAudioPlaying(false);
            onStart();
        };

        return (
            <div className="fixed inset-0 z-40 flex flex-col bg-white">

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-[1200px] mx-auto px-4 pt-20 pb-8 sm:px-6 sm:pt-24 sm:pb-12 lg:pt-28 lg:pb-16">
                        {isListeningPart && audioUrl && (
                            <div className="mb-8">
                                <div className="flex items-center justify-center gap-3 w-full rounded-2xl border border-red-200 bg-red-50/60 px-6 py-4">
                              <span
                                  className={`h-3 w-3 rounded-full ${
                                      isAudioPlaying ? "bg-red-600 animate-pulse" : "bg-gray-400"
                                  }`}
                              />
                                    <span className="text-sm sm:text-base font-medium text-gray-700">
                                {isAudioPlaying ? "Playing direction audio..." : "Direction audio ended"}
                              </span>
                                </div>

                                <audio ref={audioRef} onEnded={handleAudioEnded} preload="auto">
                                    <source src={audioUrl} type="audio/mpeg" />
                                </audio>
                            </div>
                        )}


                        {/* Direction Text */}
                        <div
                            className="prose prose-sm sm:prose-base lg:prose-lg text-gray-800 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: directionText }}
                        />

                        {/* Countdown */}
                        {countdown !== null && countdown > 0 && (
                            <div className="mt-6 text-center rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                                <p className="text-gray-600">
                                    Auto starting in{" "}
                                    <span className="text-2xl font-bold text-red-600">{countdown}</span>s
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t bg-white shadow-md">
                    <div className="max-w-4xl mx-auto px-4 py-6">
                        <div className="flex flex-col sm:flex-row justify-center gap-4">

                            {isListeningPart && isAudioPlaying && (
                                <button
                                    onClick={handleStartNow}
                                    className="w-full sm:w-auto bg-white hover:bg-red-50 text-[#C41E3A] border-2 border-[#C41E3A] font-bold px-10 py-3.5 rounded-lg transition-all shadow-sm hover:shadow-md"
                                >
                                    Bỏ qua & Bắt đầu
                                </button>
                            )}

                            {(!isListeningPart || !isAudioPlaying) && countdown === null && (
                                <button
                                    onClick={handleStartNow}
                                    className="w-full sm:w-auto bg-white hover:bg-red-50 text-[#C41E3A] border-2 border-[#C41E3A] font-bold px-10 py-3.5 rounded-lg transition-all shadow-sm hover:shadow-md"
                                >
                                    Bắt đầu
                                </button>
                            )}
                        </div>

                        {isListeningPart && (
                            <p className="mt-3 text-center text-xs text-gray-500">
                                Âm thanh hướng dẫn sẽ tự động phát. Bạn có thể bỏ qua bất cứ lúc nào.
                            </p>
                        )}
                    </div>
                </div>

            </div>
        );

    };

    const TOEICTestPage: React.FC = () => {
        const [timeRemaining, setTimeRemaining] = useState(7200);
        const [hasTimeLimit, setHasTimeLimit] = useState(true);
        const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
        const [answers, setAnswers] = useState<Record<number, string>>({});
        const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
        const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < 1024);
        const [testData, setTestData] = useState<TestData | null>(null);
        const [loading, setLoading] = useState(true);
        const [testMode, setTestMode] = useState<'practice' | 'test'>('practice');
        const [savedClassId, setSavedClassId] = useState<string | null>(null);

        const [questionGroupOrders, setQuestionGroupOrders] = useState<Map<string, number>>(new Map());

        const [listeningCompleted, setListeningCompleted] = useState(false);
        const [showReadingTransition, setShowReadingTransition] = useState(false);
        const [lockedAnswers, setLockedAnswers] = useState<Set<number>>(new Set());
        const [isWaitingForNextGroup, setIsWaitingForNextGroup] = useState(false);

        const navigate = useNavigate();
        const { slug } = useParams<{ slug: string }>();

        const [audioPreloadStatus, setAudioPreloadStatus] = useState<Record<string, AudioPreloadStatus>>({});
        const [showNetworkError, setShowNetworkError] = useState(false);
        const [isAudioStalled, setIsAudioStalled] = useState(false);
        const [currentAudioError, setCurrentAudioError] = useState<string | null>(null);
        const audioPreloadRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

        const [isSubmitting, setIsSubmitting] = useState(false);
        const [initialDuration, setInitialDuration] = useState(7200);

        const [showResultModal, setShowResultModal] = useState(false);
        const [submitResult, setSubmitResult] = useState<ScoringResultResponse | null>(null);

    // 🔎 Dùng để theo dõi tình trạng mạng yếu khi phát audio
        const audioNetworkStallTimer = useRef<number | null>(null);
        const audioNetworkStallStart = useRef<number | null>(null);
        const [imageReloadKey, setImageReloadKey] = useState(0);

        const [currentSection, setCurrentSection] = useState<'listening' | 'reading'>('listening');
        const [readingStartTime, setReadingStartTime] = useState<number | null>(null);

        const [showDirection, setShowDirection] = useState(false);
        const [currentDirectionPart, setCurrentDirectionPart] = useState<string | null>(null);
        const [completedDirections, setCompletedDirections] = useState<Set<string>>(new Set());
        const [isDirectionAudioPlaying, setIsDirectionAudioPlaying] = useState(false);
        const [allowAudioPlay, setAllowAudioPlay] = useState(false);

    // -------------------- IMAGE PRELOAD --------------------
        const [imagePreloadStatus, setImagePreloadStatus] = useState<Record<string, {
            url: string;
            status: 'pending'|'loading'|'loaded'|'error';
            retryCount: number;
        }>>({});

    // Map lưu preloaded Image object URLs (blob URLs)
        const imagePreloadRefs = useRef<Map<string, { objectUrl: string; abortController?: AbortController }>>(new Map());
        const [playbackSpeed, setPlaybackSpeed] = useState(1);
        // ✅ THÊM useEffect này
        useEffect(() => {
            // console.log('📊 playbackSpeed changed in parent:', playbackSpeed);
        }, [playbackSpeed]);


        useEffect(() => {
            const savedData = sessionStorage.getItem('currentTestData');
            if (savedData) {
                const parsed = JSON.parse(savedData);

                // 🔹 GỌI API LẤY QUESTION GROUP ORDERS
                const fetchOrders = async () => {
                    try {
                        const orders = await getQuestionGroupOrders(parsed.questions.testSetId);

                        // Tạo Map để tra cứu nhanh: questionGroupId -> questionPartOrder
                        const orderMap = new Map(
                            orders.map(order => [order.questionGroupId, order.questionPartOrder])
                        );

                        setQuestionGroupOrders(orderMap);
                        // console.log('📊 Question Group Orders loaded:', orderMap);
                    } catch (error) {
                        console.error('❌ Failed to load question group orders:', error);
                    }
                };

                fetchOrders();

                setTestData(parsed.questions);
                setTestMode(parsed.mode || 'practice');
                setSavedClassId(parsed.classId || null);
                setCompletedDirections(new Set());
                if (parsed.timeLimit === "" || parsed.timeLimit === null || parsed.timeLimit === undefined) {
                    // Không giới hạn thời gian - đặt 10 giờ (36000 giây)
                    setHasTimeLimit(false);
                    setTimeRemaining(36000); // 10 giờ
                    setInitialDuration(36000);
                } else {
                    // Có giới hạn thời gian
                    setHasTimeLimit(true);
                    const duration = parseInt(parsed.timeLimit);
                    const durationInSeconds = duration * 60;
                    if (parsed.mode === 'test' && hasListeningParts()) {
                        setTimeRemaining(0); // LC không đếm thời gian
                        setHasTimeLimit(false); // Tắt giới hạn thời gian cho LC
                    } else {
                        setTimeRemaining(durationInSeconds); // Practice mode bình thường
                    }
                    setInitialDuration(durationInSeconds);
                }

                setLoading(false);
            } else {
                navigate(`/tests/${slug}`);
            }
        }, [slug, navigate]);

        useEffect(() => {
            const timer = setInterval(() => {
                setTimeRemaining((prev) => {
                    if (prev <= 0) {
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(timer);
        }, []);

        // Preload audio function với retry logic (silent, không có UI)
        // Preload audio function - Không auto retry, chỉ đánh dấu error
        const preloadAudio = useCallback((url: string): Promise<void> => {
            return new Promise((resolve, reject) => {
                // Nếu đã tải rồi thì skip
                const existingAudio = audioPreloadRefs.current.get(url);
                if (existingAudio) {
                    // Check status từ state hiện tại
                    const currentStatus = audioPreloadStatus[url];
                    if (currentStatus?.status === 'loaded') {
                        resolve();
                        return;
                    }

                    // Nếu chưa resolve thì chờ
                    if (!existingAudio.readyState || existingAudio.readyState < 4) {
                        const checkReady = () => {
                            if (existingAudio.readyState >= 4) {
                                resolve();
                            } else {
                                setTimeout(checkReady, 100);
                            }
                        };
                        checkReady();
                        return;
                    }
                    resolve();
                    return;
                }

                const audio = new Audio();
                audioPreloadRefs.current.set(url, audio);

                setAudioPreloadStatus(prev => ({
                    ...prev,
                    [url]: {
                        url,
                        status: 'loading',
                        retryCount: 0
                    }
                }));

                let timeoutId: NodeJS.Timeout;

                const cleanup = () => {
                    clearTimeout(timeoutId);
                    audio.removeEventListener('canplaythrough', handleSuccess);
                    audio.removeEventListener('error', handleError);
                    audio.removeEventListener('loadeddata', handleSuccess);
                };

                const handleSuccess = () => {
                    cleanup();
                    setAudioPreloadStatus(prev => ({
                        ...prev,
                        [url]: { ...prev[url], status: 'loaded' }
                    }));
                    // console.log(`✓ Audio preloaded: ${url.substring(url.lastIndexOf('/') + 1)}`);
                    resolve();
                };

                const handleError = () => {
                    cleanup();

                    console.error(`✗ Failed to preload audio: ${url.substring(url.lastIndexOf('/') + 1)}`);

                    // ⚠️ Chỉ đánh dấu error, KHÔNG hiển thị modal ngay
                    // Modal sẽ được hiển thị khi chuyển câu và phát hiện audio chưa sẵn sàng
                    setAudioPreloadStatus(prev => ({
                        ...prev,
                        [url]: { ...prev[url], status: 'error' }
                    }));

                    reject(new Error('Failed to load audio'));
                };

                // Timeout sau 30 giây
                timeoutId = setTimeout(() => {
                    console.warn('⏱ Audio loading timeout');
                    handleError();
                }, 10000);

                audio.addEventListener('canplaythrough', handleSuccess);
                audio.addEventListener('loadeddata', handleSuccess);
                audio.addEventListener('error', handleError);

                audio.preload = 'auto';
                audio.src = url;
                audio.load();
            });
        }, [audioPreloadStatus]);
    // Preload image bằng fetch -> blob -> createObjectURL
        const preloadImage = useCallback((url: string): Promise<void> => {
            return new Promise(async (resolve, reject) => {
                // Nếu đã có objectUrl thì resolve
                const existing = imagePreloadRefs.current.get(url);
                if (existing && existing.objectUrl) {
                    setImagePreloadStatus(prev => ({ ...prev, [url]: { url, status: 'loaded', retryCount: prev[url]?.retryCount || 0 } }));
                    resolve();
                    return;
                }

                setImagePreloadStatus(prev => ({ ...prev, [url]: { url, status: 'loading', retryCount: prev[url]?.retryCount || 0 } }));

                const controller = new AbortController();
                imagePreloadRefs.current.set(url, { objectUrl: '', abortController: controller });

                try {
                    const resp = await fetch(url, { signal: controller.signal, cache: 'force-cache' });
                    if (!resp.ok) throw new Error('Network response not ok');
                    const blob = await resp.blob();
                    const objUrl = URL.createObjectURL(blob);

                    // lưu
                    imagePreloadRefs.current.set(url, { objectUrl: objUrl, abortController: controller });
                    setImagePreloadStatus(prev => ({ ...prev, [url]: { url, status: 'loaded', retryCount: prev[url]?.retryCount || 0 } }));
                    // console.log(`✓ Image preloaded: ${url}`);
                    resolve();
                } catch (err) {
                    if ((err as any).name === 'AbortError') {
                        console.warn('Image preload aborted:', url);
                    } else {
                        console.error('✗ Failed to preload image:', url, err);
                    }
                    setImagePreloadStatus(prev => ({ ...prev, [url]: { url, status: 'error', retryCount: (prev[url]?.retryCount || 0) } }));
                    reject(err);
                }
            });
        }, []);

        const currentGroup = testData?.questionGroups[currentGroupIndex];
        const currentPart = currentGroup?.questionPart.replace('PART_', '');

        const isListeningPart = (part: string) => {
            const partNum = parseInt(part.replace('PART_', ''));
            return partNum >= 1 && partNum <= 4;
        };

        const hasListeningParts = useCallback(() => {
            if (!testData) return false;
            return testData.questionGroups.some(g => isListeningPart(g.questionPart));
        }, [testData]);

        const isCurrentlyInListening = currentGroup ? isListeningPart(currentGroup.questionPart) : false;
        const currentGroupHasAudio = currentGroup?.files.some(f => f.fileType === 'AUDIO') || false;

        const getAbsoluteQuestionNumber = useCallback((groupIndex: number, relativeQuestionIndex: number) => {
            if (!testData) return 1;

            const currentGroup = testData.questionGroups[groupIndex];
            const baseOrder = questionGroupOrders.get(currentGroup.id);

            if (baseOrder === undefined) {
                console.warn('⚠️ No order found for group:', currentGroup.id);
                return 1;
            }

            // Công thức: questionPartOrder + questionNumber - 1
            // Ví dụ: group có questionPartOrder = 95, câu đầu tiên (index 0) -> 95 + 0 = 95
            const absoluteNum = baseOrder + relativeQuestionIndex;

            return absoluteNum;
        }, [testData, questionGroupOrders]);

        const getCurrentGroupQuestionNumbers = useCallback(() => {
            if (!currentGroup) return [];
            const startNum = getAbsoluteQuestionNumber(currentGroupIndex, 0);
            return currentGroup.questions.map((_, idx) => startNum + idx);
        }, [currentGroup, currentGroupIndex, getAbsoluteQuestionNumber]);

        // Preload next 2 groups' audio khi chuyển group (chỉ test mode)
        useEffect(() => {
            if (testMode !== 'test' || !testData || !isCurrentlyInListening) return;

            const preloadNextAudios = async () => {
                // Lấy 2 group tiếp theo
                const nextGroups = testData.questionGroups.slice(
                    currentGroupIndex + 1,
                    currentGroupIndex + 3
                );

                const audioUrls = nextGroups
                    .filter(g => isListeningPart(g.questionPart))
                    .flatMap(g => g.files)
                    .filter(f => f.fileType === 'AUDIO')
                    .map(f => f.url);

                const imageUrls = nextGroups
                    .flatMap(g => g.files)
                    .filter(f => f.fileType === 'IMAGE')
                    .map(f => f.url);

                if (audioUrls.length === 0) return;

                // console.log(`🔄 Preloading ${audioUrls.length} audio file(s) for next groups...`);

                // Preload song song
                try {
                    await Promise.allSettled([
                        ...audioUrls.map(url => preloadAudio(url)),
                        ...imageUrls.map(url => preloadImage(url))
                    ]);
                } catch (error) {
                    console.error('Error preloading next audios:', error);
                }
            };

            preloadNextAudios();
        }, [testMode, testData, currentGroupIndex, isCurrentlyInListening, preloadAudio]);

        // 🎧 Preload audio và image đầu tiên khi vào test mode
        useEffect(() => {
            if (testMode !== 'test' || !testData || currentGroupIndex !== 0) return;

            const firstGroup = testData.questionGroups[0];
            if (!isListeningPart(firstGroup.questionPart)) return;

            // --- Preload AUDIO ---
            const audioFile = firstGroup.files.find(f => f.fileType === 'AUDIO');
            if (audioFile) {
                // console.log('🎵 Preloading first audio...');
                preloadAudio(audioFile.url).catch(() => {
                    // Silent fail, sẽ xử lý khi người dùng bắt đầu
                });
            }

            // --- Preload IMAGE (nếu có) ---
            const imageFiles = firstGroup.files.filter(f => f.fileType === 'IMAGE');
            if (imageFiles.length > 0) {
                // console.log(`🖼️ Preloading ${imageFiles.length} image(s)...`);
                Promise.allSettled(imageFiles.map(img => preloadImage(img.url)))
                    .then(results => {
                        results.forEach((res, i) => {
                            if (res.status === 'fulfilled') {
                                // console.log(`✅ Image preloaded: ${imageFiles[i].url}`);
                            } else {
                                console.warn(`⚠️ Image preload failed: ${imageFiles[i].url}`);
                            }
                        });
                    });
            }
        }, [testMode, testData, currentGroupIndex, preloadAudio, preloadImage]);


        const handleAudioEndOrNoAudio = useCallback(() => {
            if (testMode !== 'test' || isWaitingForNextGroup) return;

            setIsWaitingForNextGroup(true);

            const currentQuestions = getCurrentGroupQuestionNumbers();
            setLockedAnswers(prev => {
                const newSet = new Set(prev);
                currentQuestions.forEach(q => newSet.add(q));
                return newSet;
            });

            setTimeout(() => {
                if (!testData) {
                    setIsWaitingForNextGroup(false);
                    return;
                }

                const nextGroupIndex = currentGroupIndex + 1;

                if (nextGroupIndex >= testData.questionGroups.length) {
                    setIsWaitingForNextGroup(false);
                    return;
                }

                const nextGroup = testData.questionGroups[nextGroupIndex];

                // ✅ Chuyển sang câu tiếp theo - KHÔNG check preload ở đây
                // Audio sẽ tự động load khi <audio> tag render
                if (isCurrentlyInListening && !isListeningPart(nextGroup.questionPart)) {
                    setListeningCompleted(true);
                    setShowReadingTransition(true);
                    setIsWaitingForNextGroup(false);
                } else {
                    setCurrentGroupIndex(nextGroupIndex);
                    setIsWaitingForNextGroup(false);
                }
            }, 800);
        }, [testMode, currentGroupIndex, testData, isCurrentlyInListening, isWaitingForNextGroup, getCurrentGroupQuestionNumbers]);
    // ⚙️ Gắn event listener để phát hiện khi audio bị "stalled" hoặc "waiting"
        const attachNetworkHandlersToAudio = useCallback((audioEl: HTMLAudioElement | null, audioUrl: string) => {
            if (!audioEl) return;

            // Kiểm tra xem audio đã buffer đủ chưa (ít nhất 1s dữ liệu phía trước)
            const checkBufferedEnough = () => {
                try {
                    const currentTime = audioEl.currentTime || 0;
                    const buffered = audioEl.buffered;
                    let bufferedEnd = 0;
                    for (let i = 0; i < buffered.length; i++) {
                        if (buffered.start(i) <= currentTime && buffered.end(i) >= currentTime) {
                            bufferedEnd = buffered.end(i);
                            break;
                        }
                    }
                    return bufferedEnd > currentTime + 1.0;
                } catch {
                    return false;
                }
            };

            // Khi audio bị "đứng hình" giữa chừng
            const onWaiting = () => {
                if (!checkBufferedEnough()) {
                    console.warn('⚠️ Audio stalled, possibly weak network:', audioUrl);

                    // 1. KÍCH HOẠT SPINNER (Case 2A)
                    setIsAudioStalled(true); // <--- CẬP NHẬT TRẠNG THÁI STALLED

                    if (audioNetworkStallTimer.current) clearTimeout(audioNetworkStallTimer.current);

                    // 2. Bắt đầu đếm 5 giây — nếu vẫn không hồi phục, hiển thị cảnh báo (Case 2B)
                    audioNetworkStallStart.current = Date.now();
                    audioNetworkStallTimer.current = window.setTimeout(() => {
                        console.warn('🚨 Network issue detected — showing modal');
                        // Chỉ hiện modal nếu audio vẫn đang bị dừng (chưa kịp tự hồi phục)
                        if (audioEl.paused || audioEl.readyState < 4) {
                            setCurrentAudioError(audioUrl);
                            setShowNetworkError(true);
                        }
                    }, 5000);
                }
            };

            // Khi audio đã tiếp tục tải lại / phát được
            const onProgressOrPlaying = () => {
                // 1. TẮT SPINNER VÀ TIMER
                if (audioNetworkStallTimer.current) {
                    clearTimeout(audioNetworkStallTimer.current);
                    audioNetworkStallTimer.current = null;
                }
                audioNetworkStallStart.current = null;

                setIsAudioStalled(false); // <--- TẮT TRẠNG THÁI STALLED

                // 2. ẨN MODAL nếu nó đang hiển thị
                if (currentAudioError === audioUrl && showNetworkError) {
                    setCurrentAudioError(null);
                    setShowNetworkError(false);
                }
            };

            // Gắn các event cần theo dõi
            audioEl.addEventListener('waiting', onWaiting);
            audioEl.addEventListener('stalled', onWaiting);
            audioEl.addEventListener('progress', onProgressOrPlaying);
            audioEl.addEventListener('playing', onProgressOrPlaying);
            audioEl.addEventListener('canplaythrough', onProgressOrPlaying);
            audioEl.addEventListener('error', (e) => {
                console.error('Audio playback error:', e);
                setCurrentAudioError(audioUrl);
                setShowNetworkError(true);
            });

            // Hàm dọn dẹp khi component unmount hoặc ref thay đổi
            return () => {
                audioEl.removeEventListener('waiting', onWaiting);
                audioEl.removeEventListener('stalled', onWaiting);
                audioEl.removeEventListener('progress', onProgressOrPlaying);
                audioEl.removeEventListener('playing', onProgressOrPlaying);
                audioEl.removeEventListener('canplaythrough', onProgressOrPlaying);
            };
        }, [currentAudioError, showNetworkError]);

        // 🔁 Reload current question (audio + image)
        const handleReloadCurrentQuestion = useCallback(() => {
            if (!currentGroup) return;

            // console.log('🔁 Reloading current question resources...');

            // --- 🔹 Reload IMAGE ---
            const imageFiles = currentGroup.files.filter(f => f.fileType === 'IMAGE').map(f => f.url);
            if (imageFiles.length > 0) {
                // console.log(`🖼️ Reloading ${imageFiles.length} image(s)...`);
                imageFiles.forEach(imgUrl => {
                    const stored = imagePreloadRefs.current?.get?.(imgUrl);
                    if (stored) {
                        if (stored.abortController) stored.abortController.abort();
                        if (stored.objectUrl) {
                            try { URL.revokeObjectURL(stored.objectUrl); } catch (e) {}
                        }
                        imagePreloadRefs.current.delete(imgUrl);
                    }

                    setImagePreloadStatus(prev => ({
                        ...prev,
                        [imgUrl]: {
                            url: imgUrl,
                            status: 'loading',
                            retryCount: (prev[imgUrl]?.retryCount || 0) + 1
                        }
                    }));

                    preloadImage(imgUrl)
                        .then(() => {
                            // console.log('✅ Image reload successful:', imgUrl);
                            setImageReloadKey(k => k + 1);
                            setImagePreloadStatus(prev => ({
                                ...prev,
                                [imgUrl]: { ...prev[imgUrl], status: 'loaded' }
                            }));
                        })
                        .catch(() => {
                            console.warn('⚠️ Image reload failed:', imgUrl);
                            setImagePreloadStatus(prev => ({
                                ...prev,
                                [imgUrl]: { ...prev[imgUrl], status: 'error' }
                            }));
                        });
                });
            }

            // --- 🔹 Reload AUDIO (giữ nguyên logic cũ của bạn) ---
            const audioFile = currentGroup.files.find(f => f.fileType === 'AUDIO');
            if (!audioFile) return;

            // console.log('🎧 Reloading current audio:', audioFile.url);

            audioPreloadRefs.current.delete(audioFile.url);
            setAudioPreloadStatus(prev => {
                const newStatus = { ...prev };
                delete newStatus[audioFile.url];
                return newStatus;
            });

            setAudioPreloadStatus(prev => ({
                ...prev,
                [audioFile.url]: {
                    url: audioFile.url,
                    status: 'loading',
                    retryCount: (prev[audioFile.url]?.retryCount || 0) + 1
                }
            }));

            preloadAudio(audioFile.url)
                .then(() => {
                    // console.log('✅ Audio reloaded successfully');
                    setCurrentAudioError(null);
                    setShowNetworkError(false);
                    setIsAudioStalled(false);

                    // ✅ Phát lại audio ngay
                    const preloadedAudio = audioPreloadRefs.current.get(audioFile.url);
                    if (preloadedAudio && preloadedAudio.readyState >= 3) {
                        // console.log('🎵 Playing reloaded audio...');
                        const handleEnded = () => {
                            // console.log('🎵 Reloaded audio ended → next question');
                            preloadedAudio.removeEventListener('ended', handleEnded);
                            handleAudioEndOrNoAudio();
                        };
                        preloadedAudio.addEventListener('ended', handleEnded);
                        preloadedAudio.currentTime = 0;
                        preloadedAudio.play()
                            // .then(() => console.log('🎶 Audio playing...'))
                            .catch(err => console.error('✗ Failed to play audio:', err));
                    } else {
                        console.warn('⚠️ No active audio tag found in DOM to play.');
                    }

                    // ✅ Tiếp tục preload audio kế tiếp
                    if (testData) {
                        const nextGroupIndex = currentGroupIndex + 1;
                        if (nextGroupIndex < testData.questionGroups.length) {
                            const nextGroup = testData.questionGroups[nextGroupIndex];
                            if (isListeningPart(nextGroup.questionPart)) {
                                const nextAudioFile = nextGroup.files.find(f => f.fileType === 'AUDIO');
                                if (nextAudioFile) {
                                    // console.log('🎧 Preloading next audio after successful reload...');
                                    preloadAudio(nextAudioFile.url).catch(() => {
                                        console.warn('⚠️ Failed to preload next audio');
                                    });
                                }
                            }
                        }
                    }
                })
                .catch(() => {
                    console.error('✗ Audio reload failed, keeping modal open');
                    // ⚠️ Giữ modal mở, status vẫn là 'loading'
                });
        }, [currentGroup, currentGroupIndex, testData, preloadAudio, preloadImage, handleAudioEndOrNoAudio]);



        // Auto-retry và chuyển câu khi audio đã sẵn sàng
        useEffect(() => {
            if (testMode !== 'test' || !currentAudioError || !showNetworkError) return;

            // Check xem audio đã sẵn sàng chưa
            const checkAudioReady = () => {
                const status = audioPreloadStatus[currentAudioError];
                if (status?.status === 'loaded') {
                    // console.log('✓ Audio ready after retry, continuing...');
                    setCurrentAudioError(null);
                    setShowNetworkError(false);

                    // Nếu đang chờ chuyển câu, tự động chuyển
                    if (isWaitingForNextGroup) {
                        setTimeout(() => {
                            handleAudioEndOrNoAudio();
                        }, 300);
                    }
                }
            };

            const interval = setInterval(checkAudioReady, 500);
            return () => clearInterval(interval);
        }, [testMode, currentAudioError, showNetworkError, audioPreloadStatus, isWaitingForNextGroup, handleAudioEndOrNoAudio]);

        useEffect(() => {
            if (testMode === 'test' &&
                isCurrentlyInListening &&
                !currentGroupHasAudio &&
                !isWaitingForNextGroup) {
                const timer = setTimeout(() => {
                    handleAudioEndOrNoAudio();
                }, 100);
                return () => clearTimeout(timer);
            }
        }, [testMode, isCurrentlyInListening, currentGroupHasAudio, currentGroupIndex, isWaitingForNextGroup, handleAudioEndOrNoAudio]);

        useEffect(() => {
            return () => {
                // cleanup audios
                audioPreloadRefs.current.forEach(audio => {
                    try { audio.pause(); } catch(e) {}
                    try { audio.src = ''; } catch(e) {}
                });
                audioPreloadRefs.current.clear();

                // cleanup images (revoke object URLs and abort controllers)
                imagePreloadRefs.current.forEach((entry, url) => {
                    try {
                        if (entry.abortController) entry.abortController.abort();
                    } catch(e) {}
                    try {
                        if (entry.objectUrl) URL.revokeObjectURL(entry.objectUrl);
                    } catch(e) {}
                });
                imagePreloadRefs.current.clear();
            };
        }, [])

        useEffect(() => {
            const handleBeforeUnload = (e: BeforeUnloadEvent) => {
                if (testData) {
                    e.preventDefault();
                    e.returnValue = '';
                    return 'Các thay đổi bạn đã thực hiện có thể không được lưu. Bạn có chắc chắn muốn rời khỏi trang?';
                }
            };

            window.addEventListener('beforeunload', handleBeforeUnload);

            return () => {
                window.removeEventListener('beforeunload', handleBeforeUnload);
            };
        }, [testData]);

        useEffect(() => {
            if (!testData) return;

            // Thêm một entry vào history để có thể intercept Back
            window.history.pushState(null, '', window.location.href);

            const handlePopState = (e: PopStateEvent) => {
                // Gọi hàm thoát giống như bấm nút Thoát
                handleExitTest();
            };

            window.addEventListener('popstate', handlePopState);

            return () => {
                window.removeEventListener('popstate', handlePopState);
            };
        }, [testData]);

        useEffect(() => {
            if (testMode !== 'test' || !currentGroup) return;

            const currentPart = currentGroup.questionPart;

            // Kiểm tra xem đã xem direction của part này chưa
            if (!completedDirections.has(currentPart)) {
                setCurrentDirectionPart(currentPart);
                setShowDirection(true);
                setAllowAudioPlay(false); // 🔹 Không cho phép audio play khi đang show direction
            } else {
                setAllowAudioPlay(true); // 🔹 Cho phép audio play nếu đã hoàn thành direction
            }
        }, [currentGroupIndex, testMode, completedDirections, currentGroup]);

        const getPartStructure = useCallback(() => {
            if (!testData || questionGroupOrders.size === 0) return [];

            const partMap: Record<string, {
                name: string;
                groups: QuestionGroup[];
                startQ: number;
                totalQuestions: number;
                questionNumbers: number[]; // 🔹 THÊM FIELD MỚI
            }> = {};

            // 🔹 BƯỚC 1: Nhóm các groups theo Part và thu thập tất cả số câu hỏi
            testData.questionGroups.forEach((group) => {
                const part = group.questionPart;
                if (!partMap[part]) {
                    partMap[part] = {
                        name: part.replace('_', ' '),
                        groups: [],
                        startQ: Infinity, // Sẽ tìm min
                        totalQuestions: 0,
                        questionNumbers: []
                    };
                }
                partMap[part].groups.push(group);

                // Lấy baseOrder của group này
                const baseOrder = questionGroupOrders.get(group.id);
                if (baseOrder !== undefined) {
                    // Tính tất cả số câu hỏi trong group này
                    const groupQuestions = group.questions.map((_, idx) => baseOrder + idx);
                    partMap[part].questionNumbers.push(...groupQuestions);
                }
            });

            // 🔹 BƯỚC 2: Sort và tính startQ, totalQuestions cho mỗi part
            Object.keys(partMap).forEach((part) => {
                const numbers = partMap[part].questionNumbers.sort((a, b) => a - b);
                if (numbers.length > 0) {
                    partMap[part].startQ = numbers[0]; // Câu đầu tiên
                    partMap[part].totalQuestions = numbers.length;
                }
            });

            return Object.entries(partMap).map(([key, value]) => ({
                part: key,
                ...value
            }));
        }, [testData, questionGroupOrders]);

        const partStructure = getPartStructure();

        const handleSelectAnswer = useCallback((questionNum: number, answer: string) => {
            if (testMode === 'test' && lockedAnswers.has(questionNum)) {
                return;
            }

            setAnswers(prev => ({ ...prev, [questionNum]: answer }));
        }, [testMode, lockedAnswers]);

        const handleToggleFlag = useCallback((questionNum: number) => {
            if (testMode === 'test' && lockedAnswers.has(questionNum)) {
                return;
            }

            setFlaggedQuestions(prev => {
                const newSet = new Set(prev);
                if (newSet.has(questionNum)) {
                    newSet.delete(questionNum);
                } else {
                    newSet.add(questionNum);
                }
                return newSet;
            });
        }, [testMode, lockedAnswers]);

        // Modified handleNextGroup với audio check
        const handleNextGroup = useCallback(() => {
            if (!testData || currentGroupIndex >= testData.questionGroups.length - 1) return;

            if (testMode === 'test' && isCurrentlyInListening) {
                return;
            }

            const nextGroupIndex = currentGroupIndex + 1;
            const nextGroup = testData.questionGroups[nextGroupIndex];

            // Check audio của group tiếp theo nếu là test mode
            if (testMode === 'test' && isListeningPart(nextGroup.questionPart)) {
                const audioFile = nextGroup.files.find(f => f.fileType === 'AUDIO');
                if (audioFile) {
                    const status = audioPreloadStatus[audioFile.url];
                    if (!status || status.status !== 'loaded') {
                        setCurrentAudioError(audioFile.url);
                        setShowNetworkError(true);
                        return;
                    }
                }
            }

            setCurrentGroupIndex(nextGroupIndex);
        }, [currentGroupIndex, testData, testMode, isCurrentlyInListening, audioPreloadStatus]);

        const handlePreviousGroup = useCallback(() => {
            // 1️⃣ Nếu đang trong Listening (test mode) → KHÔNG cho Previous
            if (testMode === 'test' && isCurrentlyInListening) {
                return;
            }

            // 2️⃣ Nếu đã hoàn thành LC và đang ở câu đầu tiên của RC → KHÔNG cho Previous
            if (testMode === 'test' && listeningCompleted && testData) {
                // Tìm index của group đầu tiên thuộc Reading (Part 5-7)
                const firstReadingGroupIndex = testData.questionGroups.findIndex(
                    g => !isListeningPart(g.questionPart)
                );

                // Nếu đang ở group đầu tiên của Reading → không cho quay lại
                if (currentGroupIndex <= firstReadingGroupIndex) {
                    return;
                }
            }

            // 3️⃣ Các trường hợp còn lại: cho phép quay lại bình thường
            if (currentGroupIndex <= 0) return;
            setCurrentGroupIndex(prev => prev - 1);
        }, [currentGroupIndex, testMode, listeningCompleted, isCurrentlyInListening, testData]);

        const startReadingSection = () => {
            setShowReadingTransition(false);

            // Khi bắt đầu Reading trong test mode
            if (testMode === 'test') {
                setCurrentSection('reading');
                setTimeRemaining(75 * 60); // Bắt đầu đếm 75 phút
                setHasTimeLimit(true); // Bật lại giới hạn thời gian
                setReadingStartTime(Date.now()); // Lưu thời điểm bắt đầu
            }

            if (testData) {
                const firstReadingGroupIndex = testData.questionGroups.findIndex(g => !isListeningPart(g.questionPart));
                if (firstReadingGroupIndex !== -1) {
                    setCurrentGroupIndex(firstReadingGroupIndex);
                }
            }
        };

        const handleExitTest = () => {
            if (window.confirm("Các thay đổi bạn đã thực hiện có thể không được lưu.")) {
                sessionStorage.removeItem('currentTestData');
                if (savedClassId) {
                    navigate(`/class/${savedClassId}/excercise/${slug}`);
                } else {
                    navigate(`/tests/${slug}`);
                }
            }
        };

        const handleGoToQuestion = useCallback((absoluteQuestionNum: number) => {
            if (!testData) return;

            if (testMode === 'test' && !listeningCompleted && hasListeningParts()) {
                return;
            }

            // 🔹 TÌM GROUP CHỨA CÂU HỎI DỰA TRÊN questionPartOrder
            for (let i = 0; i < testData.questionGroups.length; i++) {
                const group = testData.questionGroups[i];
                const baseOrder = questionGroupOrders.get(group.id);

                if (baseOrder === undefined) continue;

                const groupStart = baseOrder;
                const groupEnd = baseOrder + group.questions.length - 1;

                // Check xem absoluteQuestionNum có nằm trong range của group này không
                if (absoluteQuestionNum >= groupStart && absoluteQuestionNum <= groupEnd) {
                    // Check permission cho test mode
                    if (testMode === 'test' && listeningCompleted && isListeningPart(group.questionPart)) {
                        return; // Không cho phép quay lại phần Listening
                    }

                    setCurrentGroupIndex(i);
                    return;
                }
            }
        }, [testData, testMode, listeningCompleted, hasListeningParts, questionGroupOrders]);

        const handleChangePart = useCallback((partName: string) => {
            if (!testData) return;

            if (testMode === 'test' && !listeningCompleted && hasListeningParts()) {
                return;
            }

            if (testMode === 'test' && listeningCompleted && isListeningPart(partName)) {
                return;
            }

            const groupIndex = testData.questionGroups.findIndex(g => g.questionPart === partName);
            if (groupIndex !== -1) {
                setCurrentGroupIndex(groupIndex);
            }
        }, [testData, testMode, listeningCompleted, hasListeningParts]);

        const handleSubmitTest = useCallback(async () => {
            if (!testData) return;

            if (Object.keys(answers).length === 0) {
                alert('Bạn chưa trả lời câu hỏi nào! Vui lòng chọn ít nhất một đáp án trước khi nộp bài.');
                return;
            }

            const confirmMessage = testMode === 'test'
                ? 'Bạn có chắc chắn muốn nộp bài không? Bài thi sẽ được chấm điểm ngay.'
                : 'Bạn có muốn xem kết quả bài làm không?';

            if (!window.confirm(confirmMessage)) {
                return;
            }

            audioPreloadRefs.current.forEach(audio => {
                try {
                    audio.pause();
                    audio.currentTime = 0;
                } catch (e) {
                    console.error('Error stopping audio:', e);
                }
            });

            const allAudioElements = document.querySelectorAll('audio');
            allAudioElements.forEach(audio => {
                try {
                    audio.pause();
                    audio.currentTime = 0;
                } catch (e) {}
            });

            setIsSubmitting(true);

            setIsSubmitting(true);

            try {
                const userAnswers = convertAnswersToUserAnswerDetails(answers, testData.questionGroups, questionGroupOrders);

                const partsTaken = getPartsTakenFromQuestionGroups(testData.questionGroups);
                let completionTime;
                if (testMode === 'test') {
                    if (currentSection === 'reading') {
                        completionTime = (45 * 60) + (75 * 60 - timeRemaining);
                    } else {
                        completionTime = 45 * 60;
                    }
                } else {
                    // Practice mode: tính bình thường
                    completionTime = initialDuration - timeRemaining;
                }

                const request = {
                    collectionId: testData.collectionId,
                    testsetId: testData.testSetId,
                    testsetName: testData.testName,
                    isFulltest: testMode === 'test',
                    partsTaken,
                    userAnswers,
                    completionTime,
                };

                // console.log('📤 Submitting test:', request);

                const result = await submitTest(request);

                // console.log('✅ Submit successful:', result.data);

                // Lưu kết quả vào state để hiển thị modal
                setSubmitResult(result.data);

                // Lưu vào sessionStorage để dùng cho trang chi tiết
                const formattedResult: any = {
                    ...result.data,
                    testName: testData.testName,
                    testSetId: testData.testSetId,
                    timestamp: new Date().toISOString(),
                    questionGroups: testData.questionGroups
                };

                // 🔹 TẠO questionIdMap với questionNumber ĐÃ TÍNH theo questionPartOrder
                const questionIdMap: Record<number, string> = {};
                if (result.data.answerDetails) {
                    Object.values(result.data.answerDetails).forEach((detail: any) => {
                        let displayQuestionNumber = detail.questionNumber; // fallback

                        // Tính questionNumber dựa trên questionPartOrder
                        if (detail.questionGroupId && questionGroupOrders.size > 0) {
                            const baseOrder = questionGroupOrders.get(detail.questionGroupId);
                            if (baseOrder !== undefined) {
                                displayQuestionNumber = baseOrder + (detail.questionNumber - 1);
                            }
                        }

                        questionIdMap[displayQuestionNumber] = detail.questionId;
                    });
                }
                formattedResult.questionIdMap = questionIdMap;

                sessionStorage.setItem('latestTestResult', JSON.stringify(formattedResult));

                // Hiển thị modal kết quả
                setShowResultModal(true);

            } catch (error: any) {
                console.error('❌ Submit failed:', error);
                alert(`Lỗi khi nộp bài: ${error.message || 'Vui lòng thử lại sau'}`);
            } finally {
                setIsSubmitting(false);
                // Xóa dữ liệu test hiện tại
                sessionStorage.removeItem('currentTestData');
            }
        }, [testData, testMode, answers, initialDuration, timeRemaining]);

        const handleDirectionStart = useCallback(() => {
            if (currentDirectionPart) {
                setCompletedDirections(prev => new Set(prev).add(currentDirectionPart));
                setShowDirection(false);
                setCurrentDirectionPart(null);
                setIsDirectionAudioPlaying(false);

                // 🔹 Delay nhỏ trước khi cho phép audio play để tránh conflict
                setTimeout(() => {
                    setAllowAudioPlay(true);
                }, 300);
            }
        }, [currentDirectionPart]);

        const handleViewDetails = useCallback(() => {
            if (submitResult) {
                const navigationOptions = savedClassId ? { state: { classId: savedClassId } } : {};
                navigate(`/tests/${slug}/result/latest`, navigationOptions);
                // if (submitResult.attemptId) {
                //     navigate(`/tests/${slug}/result/${submitResult.attemptId}`, navigationOptions);
                // } else {
                //
                // }
            }
        }, [submitResult, navigate, slug, savedClassId]);

        const handleCloseResultModal = useCallback(() => {
            setShowResultModal(false);
            // Quay về đúng route dựa trên có classId hay không
            if (savedClassId) {
                navigate(`/class/${savedClassId}/excercise/${slug}`);
            } else {
                navigate(`/tests/${slug}`);
            }
        }, [savedClassId, navigate, slug]);

        const handleTimeUp = useCallback(() => {
            if (testMode === 'test') {
                if (currentSection === 'reading') {
                    alert('Hết giờ phần Reading! Bài thi sẽ được nộp tự động.');
                    handleSubmitTest();
                }
            } else {
                alert('Hết giờ! Bài thi sẽ được nộp tự động.');
                handleSubmitTest();
            }
        }, [handleSubmitTest, testMode, currentSection]);

        const renderNetworkError = () => {
            if (!showNetworkError || testMode !== 'test') return null;

            const currentStatus = currentAudioError ? audioPreloadStatus[currentAudioError] : null;
            const isReloading = currentStatus?.status === 'loading';

            return (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8">
                        <div className="flex items-center justify-center mb-6">
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
                                isReloading ? 'bg-blue-100' : 'bg-red-100'
                            }`}>
                                {isReloading ? (
                                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <AlertCircle className="w-12 h-12 text-red-600" />
                                )}
                            </div>
                        </div>

                        <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                            {isReloading ? 'Đang tải lại...' : 'Lỗi kết nối mạng'}
                        </h3>

                        <p className="text-gray-700 mb-8 text-center text-base leading-relaxed">
                            {isReloading
                                ? 'Đang tải audio, vui lòng chờ...'
                                : 'Mạng không ổn định, vui lòng reload lại câu hỏi để tiếp tục làm bài'
                            }
                        </p>

                        {currentStatus && currentStatus.retryCount > 0 && (
                            <p className="text-sm text-gray-500 text-center mb-4">
                                Lần thử: {currentStatus.retryCount}
                            </p>
                        )}

                        <button
                            onClick={handleReloadCurrentQuestion}
                            disabled={isReloading}
                            className={`w-full px-6 py-4 rounded-lg transition-colors font-bold text-lg shadow-lg ${
                                isReloading
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-xl'
                            }`}
                        >
                            {isReloading ? 'Đang tải...' : 'RELOAD QUESTION'}
                        </button>

                        <p className="text-xs text-gray-500 text-center mt-4">
                            {isReloading
                                ? 'Vui lòng không tắt cửa sổ này'
                                : 'Chỉ tải lại câu hỏi hiện tại'
                            }
                        </p>
                    </div>
                </div>
            );
        };

        const renderSubmittingModal = () => {
            if (!isSubmitting) return null;

            return (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 relative overflow-hidden">
                        {/* Decorative background elements */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full -mr-16 -mt-16"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-red-50 rounded-full -ml-12 -mb-12"></div>

                        <div className="relative z-10">
                            <div className="flex items-center justify-center mb-6">
                                <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center relative">
                                    <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                    <div className="absolute inset-0 w-20 h-20 border-2 border-red-200 rounded-full animate-ping"></div>
                                </div>
                            </div>

                            <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                                Đang nộp bài...
                            </h3>

                            <p className="text-gray-700 text-center text-base leading-relaxed mb-6">
                                Vui lòng chờ trong giây lát. Hệ thống đang chấm điểm bài làm của bạn.
                            </p>

                            <div className="mt-6 flex items-center justify-center space-x-2">
                                <div className="w-2.5 h-2.5 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-2.5 h-2.5 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-2.5 h-2.5 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-gray-100">
                                <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-2">
                                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    Vui lòng không tắt cửa sổ này
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            );
        };

        const renderMediaContent = () => {
            if (!currentGroup) return null;

            const audioFile = currentGroup.files.find(f => f.fileType === 'AUDIO');
            const imageFiles = currentGroup.files
                .filter(f => f.fileType === 'IMAGE')
                .sort((a, b) => a.displayOrder - b.displayOrder);

            const shouldAutoPlay = testMode === 'test' && isCurrentlyInListening && !isWaitingForNextGroup && allowAudioPlay && !showDirection;

            const hasAudio = !!audioFile;
            const hasImage = imageFiles.length > 0;
            const hasPassage = !!(currentGroup.passageText && currentGroup.passageText.trim());

            // Nếu không có audio + image + passage => show placeholder (tránh trống)
            // if (!hasAudio && !hasImage && !hasPassage) {
            //     return (
            //         <div className="flex items-center justify-center h-48 lg:h-full text-gray-400 text-sm italic select-none border rounded-lg bg-gray-50 p-4">
            //             No image or audio for this question.
            //         </div>
            //     );
            // }
            const getMinHeight = () => {
                // Nếu chỉ có audio (không có image/passage), cho min-height thấp
                if (!hasAudio && !hasImage) return 'min-h-[0px]';
                if (hasAudio && !hasImage && !hasPassage) return 'min-h-[120px]';
                // Nếu có image hoặc passage, giữ nguyên
                return 'min-h-[300px] lg:min-h-full';
            };

            return (
                <div className={`space-y-4 ${getMinHeight()}`}>
                    {/* Audio player cho practice mode */}
                    {audioFile && testMode !== 'test' && (
                        <AudioPlayer
                            audioSource={audioFile.url}
                            audioId={`audio-${currentGroupIndex}`}
                            isTestMode={false}
                            autoPlay={true}
                            playbackSpeed={playbackSpeed}
                            onSpeedChange={setPlaybackSpeed}
                        />
                    )}

                    {/* Audio ẩn cho test mode */}
                    {audioFile && testMode === 'test' && !showDirection && (
                        <audio
                            key={`test-audio-${currentGroupIndex}-${audioFile.url}`}
                            ref={(el) => {
                                if (el) {
                                    // Gắn event theo dõi mạng yếu
                                    const cleanup = attachNetworkHandlersToAudio(el, audioFile.url);
                                    // Lưu cleanup nếu cần dọn sau
                                    (el as any).__networkCleanup = cleanup;
                                }
                            }}
                            autoPlay={shouldAutoPlay}
                            onEnded={handleAudioEndOrNoAudio}
                            onError={(e) => {
                                console.error('Audio playback error:', e);
                                setCurrentAudioError(audioFile.url);
                                setShowNetworkError(true);
                            }}
                            style={{display: 'none'}}
                            preload="auto"
                        >
                            <source src={audioFile.url} type="audio/mpeg"/>
                            <source src={audioFile.url} type="audio/wav"/>
                        </audio>
                    )}

                    {/* 🔊 HIỂN THỊ SPINNER KHI AUDIO BỊ STALLED (CASE 2A) */}
                    {testMode === 'test' && isAudioStalled && !showNetworkError && (
                        <div
                            className="flex items-center justify-center p-4 rounded-lg bg-gray-100 border border-gray-200 shadow-sm">
                            <div
                                className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mr-3"></div>
                            <p className="text-blue-600 font-semibold">Đang chờ kết nối mạng ổn định...</p>
                        </div>
                    )}

                    {/* Images */}
                    {imageFiles.length > 0 && (
                        <div className="space-y-3">
                            {imageFiles.map((imageFile, index) => {
                                const imgStatus = imagePreloadStatus[imageFile.url];
                                const isLoading = !imgStatus || imgStatus.status !== 'loaded';
                                const preloaded = imagePreloadRefs.current.get(imageFile.url);
                                const imgSrc = preloaded && preloaded.objectUrl ? preloaded.objectUrl : `${imageFile.url}?reload=${imageReloadKey}`;

                                return (
                                    <div key={imageFile.id}
                                         className="relative rounded-sm overflow-hidden shadow-sm border border-gray-200 flex items-center justify-center">
                                        {isLoading && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                                                <LoadingSpinner/>
                                            </div>
                                        )}
                                        <img
                                            src={imgSrc}
                                            alt={`Image ${index + 1}`}
                                            className="w-full h-auto object-contain"
                                            loading="lazy"
                                            onLoad={() => {
                                                if (!imgStatus || imgStatus.status !== 'loaded') {
                                                    setImagePreloadStatus(prev => ({
                                                        ...prev,
                                                        [imageFile.url]: {
                                                            url: imageFile.url,
                                                            status: 'loaded',
                                                            retryCount: prev[imageFile.url]?.retryCount || 0
                                                        }
                                                    }));
                                                }
                                            }}
                                            onError={() => setImagePreloadStatus(prev => ({
                                                ...prev,
                                                [imageFile.url]: {
                                                    url: imageFile.url,
                                                    status: 'error',
                                                    retryCount: (prev[imageFile.url]?.retryCount || 0)
                                                }
                                            }))}
                                        />
                                    </div>
                                );
                            })}

                        </div>
                    )}

                    {/* Passage text */}
                    {currentGroup.passageText && (
                        <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                            <div
                                className="space-y-2 sm:space-y-3 text-gray-800 text-sm sm:text-base leading-loose whitespace-pre-wrap">
                                {currentGroup.passageText}
                            </div>
                        </div>
                    )}
                </div>
            );
        };

        const renderQuestionContent = () => {
            if (!currentGroup) return null;

            const currentQuestionNumbers = getCurrentGroupQuestionNumbers();

            return (
                <div className="space-y-3">
                    {currentGroup.questions.map((question, index) => {
                        const absoluteQuestionNum = currentQuestionNumbers[index];
                        const options = question.answers
                            .sort((a, b) => a.answerOrder - b.answerOrder)
                            .map((answer, idx) => ({
                                letter: String.fromCharCode(65 + idx),
                                text: answer.content
                            }));

                        const isLocked = testMode === 'test' && lockedAnswers.has(absoluteQuestionNum);

                        return (
                            <QuestionCard
                                key={question.id}
                                questionNum={absoluteQuestionNum}
                                questionText={question.questionText}
                                options={options}
                                selectedAnswer={answers[absoluteQuestionNum]}
                                onSelectAnswer={handleSelectAnswer}
                                isFlagged={flaggedQuestions.has(absoluteQuestionNum)}
                                onToggleFlag={handleToggleFlag}
                                isLocked={isLocked}
                            />
                        );
                    })}
                </div>
            );
        };

        if (loading || !testData) {
            return (
                <div className="bg-gray-50 h-screen flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-gray-800">Đang tải bài test...</div>
                    </div>
                </div>
            );
        }

        if (showReadingTransition) {
            return (
                <div className="fixed inset-0 flex flex-col bg-white">
                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto">
                        <div className="max-w-[1200px] mx-auto px-4 pt-20 pb-8 sm:px-6 sm:pt-24 sm:pb-12 lg:pt-28 lg:pb-16">
                            {/* Content */}
                            <div className="text-center space-y-6">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                    <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">
                                        Hoàn thành phần Listening!
                                    </h3>
                                    <p className="text-base sm:text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed">
                                        Bạn có sẵn sàng bắt đầu phần Reading (75 phút) không?
                                    </p>
                                </div>

                                {/* Info box */}
                                <div className="mt-8 max-w-xl mx-auto bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <p className="text-sm text-gray-700">
                                        <strong>Lưu ý:</strong> Sau khi bắt đầu phần Reading, bạn sẽ có 75 phút để hoàn thành các câu hỏi từ Part 5 đến Part 7.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t bg-white shadow-md">
                        <div className="max-w-4xl mx-auto px-4 py-6">
                            <div className="flex flex-col sm:flex-row justify-center gap-4">
                                <button
                                    onClick={startReadingSection}
                                    className="w-full sm:w-auto bg-white hover:bg-red-50 text-[#C41E3A] border-2 border-[#C41E3A] font-bold px-10 py-3.5 rounded-lg transition-all shadow-sm hover:shadow-md"
                                >
                                    Bắt đầu Reading
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        const totalQuestions = testData.questionGroups.reduce((sum, group) => sum + group.questions.length, 0);
        const uniqueParts = [...new Set(testData.questionGroups.map(g => g.questionPart))];

        const isQuestionDisabled = (questionNum: number) => {
            if (testMode !== 'test') return false;

            if (!listeningCompleted && hasListeningParts()) {
                return true;
            }

            if (listeningCompleted) {
                let counter = 1;
                for (const group of testData.questionGroups) {
                    const groupEnd = counter + group.questions.length;
                    if (questionNum >= counter && questionNum < groupEnd) {
                        return isListeningPart(group.questionPart);
                    }
                    counter = groupEnd;
                }
            }

            return false;
        };

        const isPartDisabled = (partName: string) => {
            if (testMode !== 'test') return false;

            if (!listeningCompleted && hasListeningParts()) {
                return partName !== currentGroup?.questionPart;
            }

            if (listeningCompleted) {
                return isListeningPart(partName);
            }

            return false;
        };

        const shouldHideSidebar = testMode === 'test' && isCurrentlyInListening;

        const getFilteredPartStructure = () => {
            if (testMode !== 'test') return partStructure;

            // Nếu đang trong Listening: không hiện sidebar
            if (isCurrentlyInListening) return [];

            // Nếu đã hoàn thành Listening: chỉ hiện Reading parts
            if (listeningCompleted) {
                return partStructure.filter(p => !isListeningPart(p.part));
            }

            return partStructure;
        };

        const filteredPartStructure = getFilteredPartStructure();

        return (
            <div className="bg-gray-50 overflow-hidden h-screen flex flex-col">
                {renderNetworkError()}

                <div className="bg-white border-b border-gray-200 px-3 sm:px-6 py-2 sticky top-0 z-50">
                    <div className="flex lg:hidden items-center justify-between">
                        <div className="flex items-center gap-3">
                            <img
                                src="https://res.cloudinary.com/dlozdfe2o/image/upload/v1760463289/mkpzkc2obuludraiqpc6.png"
                                alt="Logo"
                                className="h-8 w-auto cursor-pointer"
                                onClick={() => navigate("/")}
                            />
                            {hasTimeLimit && !(testMode === 'test' && isCurrentlyInListening) && (
                                <Timer timeRemaining={timeRemaining} onTimeUp={handleTimeUp}/>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleSubmitTest}
                                disabled={isSubmitting}
                                className={`px-3 py-1.5 border-2 rounded-lg text-xs font-semibold ${
                                    isSubmitting
                                        ? 'border-gray-400 text-gray-400 cursor-not-allowed'
                                        : 'border-blue-600 text-blue-600'
                                }`}
                            >
                                {isSubmitting ? 'Nộp...' : 'Nộp'}
                            </button>
                            <button
                                onClick={handleExitTest}
                                disabled={isSubmitting}
                                className="px-3 py-1.5 border-2 border-red-600 text-red-600 rounded-lg text-xs font-semibold disabled:opacity-50"
                            >
                                Thoát
                            </button>

                            {!shouldHideSidebar && (
                                <button
                                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                                    className="p-2 bg-gray-100 rounded-lg"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                              d="M4 6h16M4 12h16M4 18h16"/>
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="hidden lg:flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                            <img
                                src="https://res.cloudinary.com/dlozdfe2o/image/upload/v1760463289/mkpzkc2obuludraiqpc6.png"
                                alt="Logo"
                                className="h-10 w-auto cursor-pointer"
                                onClick={() => navigate("/")}
                            />
                            {hasTimeLimit && !(testMode === 'test' && isCurrentlyInListening) && (
                                <Timer timeRemaining={timeRemaining} onTimeUp={handleTimeUp}/>
                            )}
                            {/*<div className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold">*/}
                            {/*    {testMode === 'practice' ? 'Luyện tập' : 'Kiểm tra'}*/}
                            {/*</div>*/}
                        </div>

                        {/* 👇 THAY ĐỔI PHẦN NÀY - Đặt nút Previous/Next TRƯỚC Part buttons */}
                        <div className="flex items-center space-x-3">
                            {/* Navigation buttons */}
                            {!(testMode === 'test' && isCurrentlyInListening) && (
                                <>
                                    <button
                                        onClick={handlePreviousGroup}
                                        className="p-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={currentGroupIndex === 0 || (testMode === 'test' && isCurrentlyInListening) || showDirection}
                                    >
                                        <ChevronLeft className="w-5 h-5"/>
                                    </button>
                                    <button
                                        onClick={handleNextGroup}
                                        className="p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={!testData || currentGroupIndex >= testData.questionGroups.length - 1 || (testMode === 'test' && isCurrentlyInListening) || showDirection}
                                    >
                                        <ChevronRight className="w-5 h-5"/>
                                    </button>

                                    {/* Divider */}
                                    <div className="h-8 w-px bg-gray-300"></div>
                                </>
                            )}

                            {/* Part buttons */}
                            {!(testMode === 'test' && isCurrentlyInListening) && (
                                <div className="flex space-x-2">
                                    {uniqueParts
                                        .filter(part => {
                                            // Nếu test mode và đã hoàn thành Listening thì chỉ hiện Reading parts
                                            if (testMode === 'test' && listeningCompleted) {
                                                return !isListeningPart(part);
                                            }
                                            return true; // Practice mode hoặc chưa hoàn thành LC thì hiện tất cả
                                        })
                                        .map((part) => {
                                            const partNum = part.replace('PART_', '');
                                            const disabled = isPartDisabled(part) || showDirection;
                                            return (
                                                <button
                                                    key={part}
                                                    onClick={() => handleChangePart(part)}
                                                    disabled={disabled}
                                                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                                                        disabled
                                                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                                            : currentGroup?.questionPart === part
                                                                ? "bg-blue-600 text-white"
                                                                : "bg-gray-100 text-black hover:bg-gray-200"
                                                    }`}
                                                >
                                                    Part {partNum}
                                                </button>
                                            );
                                        })}
                                </div>
                            )}
                        </div>

                        {/* Action buttons bên phải giữ nguyên */}
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={handleSubmitTest}
                                disabled={isSubmitting}
                                className={`px-3 py-1.5 border-2 rounded-lg transition-colors text-sm font-semibold ${
                                    isSubmitting
                                        ? 'border-gray-400 text-gray-400 cursor-not-allowed'
                                        : 'border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white'
                                }`}
                            >
                                {isSubmitting ? 'Đang nộp...' : 'Nộp bài'}
                            </button>
                            <button
                                onClick={handleExitTest}
                                className="px-3 py-1.5 border-2 border-red-600 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-colors text-sm font-semibold"
                            >
                                Thoát
                            </button>
                        </div>
                    </div>
                </div>
                <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                    <div className="lg:w-1/2 overflow-y-auto bg-white border-b lg:border-b-0 lg:border-r border-gray-200 p-3 sm:p-4
                        max-h-[45vh] lg:max-h-full flex-shrink-0">
                        {renderMediaContent()}
                    </div>

                    <div className="flex-1 overflow-y-auto bg-white p-2 sm:p-3">
                        {renderQuestionContent()}
                    </div>

                    {/* Chỉ hiện khi KHÔNG phải test mode Listening */}
                    {!(testMode === 'test' && isCurrentlyInListening) && (
                        <div className="lg:hidden border-t border-gray-200 p-3 pb-4 bg-white">
                            <div className="flex items-center justify-center gap-3">
                                <button
                                    onClick={handlePreviousGroup}
                                    className="flex-1 max-w-[130px] py-2.5 bg-gray-100 text-gray-700 rounded-lg flex items-center justify-center gap-2 font-medium disabled:opacity-50 text-sm"
                                    disabled={currentGroupIndex === 0 || showDirection}
                                >
                                    <ChevronLeft className="w-4 h-4"/>
                                    <span>Previous</span>
                                </button>
                                <button
                                    onClick={handleNextGroup}
                                    className="flex-1 max-w-[130px] py-2.5 bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2 font-medium disabled:opacity-50 text-sm"
                                    disabled={!testData || currentGroupIndex >= testData.questionGroups.length - 1 || showDirection}
                                >
                                    <span>Next</span>
                                    <ChevronRight className="w-4 h-4"/>
                                </button>
                            </div>
                        </div>
                    )}

                    {!shouldHideSidebar && (
                        <div
                            className={`
                                fixed lg:relative inset-0 lg:inset-auto
                                bg-black bg-opacity-50 lg:bg-transparent
                                z-50 lg:z-auto
                                transition-all duration-300
                                ${sidebarCollapsed ? 'pointer-events-none opacity-0 lg:opacity-100 lg:pointer-events-auto' : 'opacity-100'}
                                lg:border-l lg:border-gray-200 lg:overflow-y-auto
                                ${sidebarCollapsed ? 'lg:w-16' : 'lg:w-52'}
                            `}
                            onClick={(e) => {
                                // Chỉ đóng khi click vào overlay (div này), KHÔNG đóng khi click vào con
                                if (e.target === e.currentTarget) {
                                    setSidebarCollapsed(true);
                                }
                            }}
                        >
                            <div className={`
                                lg:hidden absolute right-0 top-0 bottom-0 w-72 max-w-full
                                bg-white overflow-y-auto transform transition-transform duration-300
                                ${sidebarCollapsed ? 'translate-x-full' : 'translate-x-0'}
                            `}>
                                <div
                                    className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center z-10">
                                    <h3 className="font-semibold">Navigation</h3>
                                    <button onClick={() => setSidebarCollapsed(true)}
                                            className="p-2 hover:bg-gray-100 rounded-lg">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                                  d="M6 18L18 6M6 6l12 12"/>
                                        </svg>
                                    </button>
                                </div>
                                <div className="p-4 space-y-4">
                                    {filteredPartStructure.map((partInfo) => {
                                        const partNum = partInfo.part.replace('PART_', '');
                                        return (
                                            <div key={partInfo.part}>
                                                <h4 className="text-sm font-semibold text-gray-800 mb-2">Part {partNum}</h4>
                                                <div className="grid grid-cols-7 gap-2">
                                                    {partInfo.questionNumbers.map((questionNum, idx) => {
                                                        const currentQuestions = getCurrentGroupQuestionNumbers();
                                                        const disabled = isQuestionDisabled(questionNum);
                                                        return (
                                                            <NavButton
                                                                key={`${partInfo.part}-${questionNum}-${idx}`}
                                                                questionNum={questionNum}
                                                                isAnswered={!!answers[questionNum]}
                                                                isFlagged={flaggedQuestions.has(questionNum)}
                                                                isCurrent={currentQuestions[0] === questionNum}
                                                                isCurrentGroup={currentQuestions.includes(questionNum)}
                                                                onClick={(q) => {
                                                                    handleGoToQuestion(q);
                                                                    setSidebarCollapsed(true);
                                                                }}
                                                                isDisabled={disabled}
                                                            />
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div className="border-t border-gray-200 pt-4 mt-4 text-sm text-gray-600">
                                        <div>Question {getCurrentGroupQuestionNumbers()[0] || 1} of {totalQuestions}</div>
                                        <div>Part {currentPart}</div>
                                        <div className="mt-2">Answered: {Object.keys(answers).length}/{totalQuestions}</div>
                                        {testMode === 'test' && listeningCompleted && (
                                            <div className="mt-2 text-xs">
                                                <div className="text-green-600 font-semibold">
                                                    ✓ Listening hoàn thành
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="hidden lg:block bg-white h-full">
                                <div className="sticky top-0 bg-white p-2 z-10">
                                    <button
                                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                                        className="w-8 h-8 bg-white border border-gray-200 rounded-md flex items-center justify-center hover:bg-gray-100"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                                  d="M4 6h16M4 12h16M4 18h16"/>
                                        </svg>
                                    </button>
                                </div>

                                {!sidebarCollapsed && (
                                    <div className="p-2 space-y-4">
                                        {filteredPartStructure.map((partInfo) => {
                                            const partNum = partInfo.part.replace('PART_', '');
                                            return (
                                                <div key={partInfo.part}>
                                                    <h4 className="text-sm font-semibold text-gray-800 mb-2">Part {partNum}</h4>
                                                    <div className="grid grid-cols-5 gap-2">
                                                        {partInfo.questionNumbers.map((questionNum, idx) => {
                                                            const currentQuestions = getCurrentGroupQuestionNumbers();
                                                            const disabled = isQuestionDisabled(questionNum);
                                                            return (
                                                                <NavButton
                                                                    key={`${partInfo.part}-${questionNum}-${idx}`}
                                                                    questionNum={questionNum}
                                                                    isAnswered={!!answers[questionNum]}
                                                                    isFlagged={flaggedQuestions.has(questionNum)}
                                                                    isCurrent={currentQuestions[0] === questionNum}
                                                                    isCurrentGroup={currentQuestions.includes(questionNum)}
                                                                    onClick={(q) => {
                                                                        handleGoToQuestion(q);
                                                                        // setSidebarCollapsed(true);
                                                                    }}
                                                                    isDisabled={disabled}
                                                                />
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div className="border-t border-gray-200 pt-4 mt-4 text-sm text-gray-600">
                                            <div>Question {getCurrentGroupQuestionNumbers()[0] || 1} of {totalQuestions}</div>
                                            <div>Part {currentPart}</div>
                                            <div
                                                className="mt-2">Answered: {Object.keys(answers).length}/{totalQuestions}</div>
                                            {testMode === 'test' && listeningCompleted && (
                                                <div className="mt-2 text-xs">
                                                    <div className="text-green-600 font-semibold">
                                                        ✓ Listening hoàn thành
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                {showDirection && currentDirectionPart && testMode === 'test' && testData?.directionSet && (
                    <DirectionModal
                        part={currentDirectionPart}
                        directionText={testData.directionSet.directions[currentDirectionPart]?.directionText || ''}
                        audioUrl={testData.directionSet.directions[currentDirectionPart]?.audioUrl}
                        onStart={handleDirectionStart}
                        isAudioPlaying={isDirectionAudioPlaying}
                        setIsAudioPlaying={setIsDirectionAudioPlaying}
                    />
                )}
                {showResultModal && submitResult && (
                    <TestResultModal
                        result={submitResult}
                        testName={testData?.testName || ''}
                        onViewDetails={handleViewDetails}
                        onClose={handleCloseResultModal}
                    />
                )}
                {renderSubmittingModal()}
            </div>
        );
    };

    export default TOEICTestPage;