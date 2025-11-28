import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { getQuestionGroupByQuestionId, QuestionGroupResponse } from '../../../../shared/services/questionBankService/questionGroupService';

interface QuestionDetailModalProps {
    questionNumber: number;
    onClose: () => void;
    attemptId?: string;
    userAnswers?: Record<number, string>; // Map questionNumber -> selected answer letter
}

const QuestionDetailModal: React.FC<QuestionDetailModalProps> = ({questionNumber, attemptId, userAnswers, onClose}) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [groupData, setGroupData] = useState<QuestionGroupResponse | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [showExplanation, setShowExplanation] = useState(false);
    const [showTranscript, setShowTranscript] = useState(false);
    const [initialQuestionIndex, setInitialQuestionIndex] = useState(0);
    const audioRef = useRef<HTMLAudioElement>(null);
    const playerRef = useRef<any>(null);

    useEffect(() => {
        // Khóa scroll khi modal mở
        document.body.style.overflow = 'hidden';

        // Mở khóa scroll khi modal đóng
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    useEffect(() => {
        loadQuestionGroup();
    }, [questionNumber]);

    useEffect(() => {
        // Load Plyr for audio
        if (!document.querySelector('link[href*="plyr.css"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://cdnjs.cloudflare.com/ajax/libs/plyr/3.7.8/plyr.css';
            document.head.appendChild(link);

            const style = document.createElement('style');
            style.textContent = `
                .plyr__menu { position: relative !important; z-index: 50 !important; }
                .plyr__menu__container {
                    position: absolute !important; 
                    top: 100% !important;
                    bottom: auto !important;
                    right: 0 !important;
                    left: auto !important; 
                    margin-top: 6px !important;
                    border-radius: 8px !important; 
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
                    background: #fff !important; 
                    z-index: 9999 !important;
                }
                .plyr__menu__container::after {
                    top: -6px !important; 
                    bottom: auto !important;
                    transform: rotate(180deg); 
                    right: 12px !important;
                    border-width: 6px; 
                    border-style: solid;
                    border-color: transparent transparent #fff transparent !important;
                }
                
                /* Desktop - giữ nguyên như cũ */
                .plyr--audio { 
                    border-radius: 8px; 
                    background: #f9fafb; 
                    padding: 0.3rem 0.5rem;
                }
                
                .plyr--audio .plyr__controls button {
                    border-radius: 6px !important; 
                    background: transparent !important; 
                    transition: none !important;
                }
                
                .plyr--audio .plyr__controls button:hover { 
                    background: #e5e7eb !important; 
                }
                
                .plyr--audio .plyr__progress input[type="range"]::-webkit-slider-thumb { 
                    background: #3b82f6; 
                }
                .plyr--audio .plyr__progress input[type="range"]::-moz-range-thumb { 
                    background: #3b82f6; 
                }
                
                .plyr__tooltip { 
                    z-index: 9999 !important; 
                }
                
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
            script.onload = () => initializePlyr();
            document.body.appendChild(script);
        } else {
            initializePlyr();
        }

        return () => {
            if (playerRef.current) {
                playerRef.current.destroy();
                playerRef.current = null;
            }
        };
    }, [groupData]);

    const initializePlyr = () => {
        if (audioRef.current && (window as any).Plyr && !playerRef.current) {
            try {
                playerRef.current = new (window as any).Plyr(audioRef.current, {
                    controls: ['play', 'progress', 'current-time', 'duration', 'mute', 'volume', 'settings'],
                    settings: ['speed'],
                    speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 2] },
                });
            } catch (e) {
                console.error('Error initializing Plyr:', e);
            }
        }
    };

    const loadQuestionGroup = async () => {
        try {
            setLoading(true);
            setError(null);

            let questionId: string | null = null;

            // ✅ CASE 1: Có attemptId (load từ API)
            if (attemptId && attemptId !== 'latest') {
                console.log('📥 Case 1: Loading from API history, attemptId:', attemptId);

                const storedResult = sessionStorage.getItem(`attemptResult_${attemptId}`);

                if (storedResult) {
                    const parsed = JSON.parse(storedResult);

                    // 🔥 SỬ DỤNG questionIdMap từ formatted data
                    if (parsed.questionIdMap && parsed.questionIdMap[questionNumber]) {
                        questionId = parsed.questionIdMap[questionNumber];
                        console.log('✅ Found questionId from map:', questionId);
                    }

                    // Fallback: Tìm trong answerDetails nếu chưa có map
                    if (!questionId && parsed.answerDetails) {
                        const answerDetail = Object.values(parsed.answerDetails).find(
                            (detail: any) => detail.questionNumber === questionNumber
                        ) as any;

                        if (answerDetail) {
                            questionId = answerDetail.questionId;
                            console.log('✅ Found questionId from answerDetails:', questionId);
                        }
                    }
                }
            }
            // ✅ CASE 2: attemptId = 'latest' (vừa làm xong)
            else {
                console.log('📥 Case 2: Loading from sessionStorage (latest test)');

                const storedTestData = sessionStorage.getItem('latestTestResult');

                if (!storedTestData) {
                    throw new Error('Không tìm thấy dữ liệu bài test');
                }

                const testData = JSON.parse(storedTestData);

                console.log('🔍 testData keys:', Object.keys(testData));
                console.log('🔍 questionIdMap:', testData.questionIdMap);
                console.log('🔍 Looking for questionNumber:', questionNumber);

                // 🔥 PRIORITIZE questionIdMap
                if (testData.questionIdMap && testData.questionIdMap[questionNumber]) {
                    questionId = testData.questionIdMap[questionNumber];
                    console.log('✅ Found questionId from questionIdMap:', questionId);
                }
                // Fallback 1: Tìm trong questionGroups
                else if (testData.questionGroups) {
                    console.log('⚠️ questionIdMap not found, fallback to questionGroups');

                    let globalCounter = 1;
                    for (const group of testData.questionGroups) {
                        if (!group.questions) continue;

                        const sortedQuestions = [...group.questions].sort(
                            (a: any, b: any) => a.questionNumber - b.questionNumber
                        );

                        for (const q of sortedQuestions) {
                            if (globalCounter === questionNumber) {
                                questionId = q.id;
                                console.log('✅ Found questionId from questionGroups:', questionId);
                                break;
                            }
                            globalCounter++;
                        }
                        if (questionId) break;
                    }
                }
            }

            if (!questionId) {
                throw new Error(`Không tìm thấy câu hỏi số ${questionNumber}`);
            }

            // Gọi API lấy QuestionGroup đầy đủ
            console.log('📡 Calling API with questionId:', questionId);
            const response = await getQuestionGroupByQuestionId(questionId);

            // ✅ Sort questions và files trước khi set state
            const sortedResponse = {
                ...response,
                questions: response.questions.sort((a, b) => a.questionNumber - b.questionNumber),
                files: response.files.sort((a, b) => a.displayOrder - b.displayOrder)
            };

            console.log('📊 Sorted questions:', sortedResponse.questions.map(q => ({
                id: q.id,
                questionNumber: q.questionNumber
            })));

            setGroupData(sortedResponse);

            // ✅ TÌM INDEX BẰNG questionId THAY VÌ questionNumber
            const currentIndex = sortedResponse.questions.findIndex(
                q => q.id === questionId
            );

            console.log('🎯 Found currentIndex:', currentIndex, 'for questionId:', questionId);

            const finalIndex = currentIndex >= 0 ? currentIndex : 0;
            setCurrentQuestionIndex(finalIndex);
            setInitialQuestionIndex(finalIndex);

        } catch (err: any) {
            console.error('❌ Error loading question group:', err);
            setError(err.message || 'Không thể tải thông tin câu hỏi');
        } finally {
            setLoading(false);
        }
    };

    const handlePrevQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
            setShowExplanation(false);
            setShowTranscript(false);
        }
    };

    const handleNextQuestion = () => {
        if (groupData && currentQuestionIndex < groupData.questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setShowExplanation(false);
            setShowTranscript(false);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
                <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                    <div className="p-8 flex items-center justify-center">
                        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !groupData) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
                <div className="bg-white rounded-xl w-full max-w-4xl p-8">
                    <div className="text-center">
                        <div className="text-red-600 text-5xl mb-4">⚠️</div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Không thể tải dữ liệu</h3>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const currentQuestion = groupData.questions[currentQuestionIndex];
    const audioFile = groupData.files.find(f => f.type === 'AUDIO');
    const imageFiles = groupData.files.filter(f => f.type === 'IMAGE').sort((a, b) => a.displayOrder - b.displayOrder);
    const displayQuestionNumber = questionNumber + (currentQuestionIndex - initialQuestionIndex);

    console.log('--- Modal State Update ---');
    console.log('Param questionNumber (Initial Click):', questionNumber);
    console.log('Current Index:', currentQuestionIndex);
    console.log('Initial Index:', initialQuestionIndex);
    console.log('Calculated displayQuestionNumber (Current Q#):', displayQuestionNumber);

    return (

        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between px-4 py-3 border-b border-gray-200 bg-white">
                    <div className="space-y-1">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Câu {displayQuestionNumber}
                        </h2>

                        <div className="flex items-center flex-wrap gap-2 text-sm text-gray-700">
                            <span>{groupData.questionPart.replace('_', ' ')}</span>
                            <span>·</span>
                            <span>{groupData.difficulty || 'N/A'}</span>

                            {currentQuestion.tags && currentQuestion.tags.length > 0 && (
                                <>
                                    <span>·</span>
                                    <div className="flex flex-wrap gap-1">
                                        {currentQuestion.tags.map(tag => (
                                            <span
                                                key={tag.id}
                                                className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium"
                                            >
                                                {tag.tagName}
                                            </span>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-600"/>
                    </button>
                </div>


                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {/* Audio Player */}
                    {audioFile && (


                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">

                            <audio ref={audioRef} preload="metadata">
                                <source src={audioFile.url} type="audio/mpeg"/>
                                <source src={audioFile.url} type="audio/wav"/>
                            </audio>
                            {/* Transcript Section */}
                            {groupData.audioTranscript && (
                                <div className="mt-3 border-t border-gray-200 pt-3">
                                    <button
                                        onClick={() => setShowTranscript(!showTranscript)}
                                        className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor"
                                                 viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                                            </svg>
                                            <span className="text-sm font-semibold text-gray-800">Transcript</span>
                                        </div>
                                        <svg
                                            className={`w-5 h-5 text-gray-600 transition-transform ${showTranscript ? 'rotate-180' : ''}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                                  d="M19 9l-7 7-7-7"/>
                                        </svg>
                                    </button>
                                    {showTranscript && (
                                        <div className="mt-2 bg-white border border-gray-200 rounded-lg p-3">
                                            <div
                                                className="text-sm text-gray-700 leading-relaxed"
                                                dangerouslySetInnerHTML={{__html: groupData.audioTranscript}}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                    )}

                    {/* Images */}
                    {imageFiles.length > 0 && (
                        <div className="space-y-2">
                            <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
                                {imageFiles.map((img, idx) => (
                                    <div key={img.id} className="rounded-lg overflow-hidden border border-gray-200">
                                        <img
                                            src={img.url}
                                            alt={`Image ${idx + 1}`}
                                            className="w-full h-auto object-contain"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Passage Text */}
                    {groupData.passageText && (
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor"
                                     viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                                </svg>
                                Đoạn văn
                            </h3>
                            <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                {groupData.passageText}
                            </div>
                        </div>
                    )}

                    {/* Question */}
                    <div className="border border-gray-100 rounded-md bg-white py-2">
                        <div className="flex items-start px-2.5 py-2 border-b border-gray-50">
                            {/*<div*/}
                            {/*    className="flex items-center justify-center bg-blue-50 text-blue-700 font-semibold rounded-full w-7 h-7 text-sm mr-2 flex-shrink-0">*/}
                            {/*    {currentQuestion.questionNumber}*/}
                            {/*</div>*/}
                            {currentQuestion.questionText && (
                                <span className="text-[15px] text-gray-800 leading-relaxed break-words">
                                    {currentQuestion.questionText}
                                </span>
                            )}
                        </div>

                        {/* Answers */}
                        <div className="space-y-1">
                            {currentQuestion.answers
                                .sort((a, b) => a.answerOrder - b.answerOrder)
                                .map((answer, idx) => {
                                    const letter = String.fromCharCode(65 + idx);
                                    const isCorrect = answer.isCorrect;
                                    const isUserAnswer = userAnswers && userAnswers[displayQuestionNumber] === letter;
                                    const isWrongAnswer = isUserAnswer && !isCorrect;

                                    const answerUsedForLookup = userAnswers ? userAnswers[questionNumber] : 'N/A';
                                    console.log(`-- Q#${displayQuestionNumber} Answer Option ${letter} Lookup --`);
                                    console.log(`Lookup key used: ${questionNumber}`);
                                    console.log(`User Answer found with key ${questionNumber}: ${answerUsedForLookup}`);
                                    console.log(`userAnswers map contains current Q#: ${userAnswers ? !!userAnswers[displayQuestionNumber] : 'N/A'}`);

                                    return (
                                        <label
                                            key={answer.id}
                                            className={`flex items-center space-x-2 rounded-lg px-3 transition-all ${
                                                isCorrect
                                                    ? 'bg-green-50 shadow-sm'
                                                    : isWrongAnswer
                                                        ? 'bg-red-50 shadow-sm'
                                                        : 'hover:bg-gray-50'
                                            }`}
                                        >
                                            <div
                                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                                    isCorrect
                                                        ? 'bg-green-500 border-green-500'
                                                        : isWrongAnswer
                                                            ? 'bg-red-500 border-red-500'
                                                            : 'border-gray-300'
                                                }`}
                                            >
                                                {isCorrect && (
                                                    <svg className="w-3 h-3 text-white" fill="currentColor"
                                                         viewBox="0 0 20 20">
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                )}
                                                {isWrongAnswer && (
                                                    <svg className="w-3 h-3 text-white" fill="currentColor"
                                                         viewBox="0 0 20 20">
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                )}
                                            </div>

                                            <div className="flex-1 py-1">
                                                <span
                                                    className={`text-base leading-relaxed break-words ${
                                                        isCorrect
                                                            ? 'text-green-900'
                                                            : isWrongAnswer
                                                                ? 'text-red-900'
                                                                : 'text-gray-800'
                                                    }`}
                                                >
                                                  <span className="mr-1">{letter}.</span>
                                                    {answer.content}
                                                </span>

                                                {isWrongAnswer && (
                                                    <div className="flex items-center gap-1 text-xs text-red-700">

                                                    </div>
                                                )}
                                            </div>
                                        </label>
                                    );
                                })}
                        </div>


                        {/* Explanation - Collapsible */}
                        {groupData.explanation && (
                            <div className="border-t border-gray-100">
                                <button
                                    onClick={() => setShowExplanation(!showExplanation)}
                                    className="w-full flex items-center justify-between px-2.5 py-2 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor"
                                             viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                                        </svg>
                                        <span className="text-sm font-semibold text-gray-800">Giải thích</span>
                                    </div>
                                    <svg
                                        className={`w-5 h-5 text-gray-600 transition-transform ${showExplanation ? 'rotate-180' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                              d="M19 9l-7 7-7-7"/>
                                    </svg>
                                </button>
                                {showExplanation && (
                                    <div className="px-2.5 pb-2.5">
                                        <div className="bg-blue-50 border border-blue-200 rounded p-3">
                                            <div
                                                className="text-sm text-gray-700 leading-relaxed"
                                                dangerouslySetInnerHTML={{__html: groupData.explanation}}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>


                {/* Footer - Navigation */}
                {groupData.questions.length > 1 && (
                    <div
                        className="border-t border-gray-200 px-4 py-3 bg-gray-50 flex items-center justify-between flex-wrap gap-3">

                        {/* Điều hướng bên trái */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handlePrevQuestion}
                                disabled={currentQuestionIndex === 0}
                                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5"/>
                                <span>Trước</span>
                            </button>

                            <button
                                onClick={handleNextQuestion}
                                disabled={currentQuestionIndex === groupData.questions.length - 1}
                                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <span>Sau</span>
                                <ChevronRight className="w-5 h-5"/>
                            </button>
                        </div>

                        {/* Hiển thị số câu bên phải */}
                        <div className="text-sm text-gray-600 font-medium ml-auto">
                            Câu {currentQuestionIndex + 1} / {groupData.questions.length} trong nhóm
                        </div>
                    </div>

                )}
            </div>
        </div>
    );
};

export default QuestionDetailModal;