import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronDown, CheckCircle2, XCircle, Circle, Clock } from 'lucide-react';
import { getAttemptDetail, ScoringResultResponse } from '../../../services/testService';
import QuestionBox from './QuestionBox';
import TestResultCommentSection from '../../../../client/components/TestResultComments';
import QuestionDetailModal from './QuestionDetailModal';
import {getQuestionGroupOrders, getTestSetQuestionsByTestSetId } from '../../../../shared/services/questionBankService/testSetService';

interface AnswerDisplay {
  questionNumber: number;
  userAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean | null;
}

interface SectionData {
  name: string;
  correct: number;
  wrong: number;
  skipped: number;
  accuracy: number;
  questions: number[];
}

interface PartData {
  partName: string;
  partKey: string;
  sections: SectionData[];
}

const TestResultDetailPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedParts, setExpandedParts] = useState<Set<string>>(new Set());
  const [selectedQuestionNumber, setSelectedQuestionNumber] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userAnswersMap, setUserAnswersMap] = useState<Record<number, string>>({});

  const [questionGroupOrders, setQuestionGroupOrders] = useState<Map<string, number>>(new Map());

  // Data từ API hoặc sessionStorage
  const [resultData, setResultData] = useState<any>(null);

  const { slug, attemptId } = useParams<{ slug: string; attemptId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [classId, setClassId] = useState<string | null>(null);

  useEffect(() => {
    const loadResultData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Lấy classId từ location.state hoặc sessionStorage
        let savedClassId = location.state?.classId || null;

        if (!savedClassId) {
          // Thử lấy từ sessionStorage (trường hợp vừa nộp bài)
          const storedTestData = sessionStorage.getItem('currentTestData');
          if (storedTestData) {
            try {
              const parsed = JSON.parse(storedTestData);
              savedClassId = parsed.classId || null;
            } catch (e) {
              console.warn('Cannot parse currentTestData:', e);
            }
          }
        }

        setClassId(savedClassId);

        let testSetId: string | null = null;
        let questionGroups: any[] = [];
        let apiData: any = null;
          // Case 1: Có attemptId từ URL (user đã đăng nhập, xem từ lịch sử)
          if (attemptId && attemptId !== 'latest') {
              console.log('📥 Loading result from API, attemptId:', attemptId);
              const response = await getAttemptDetail(attemptId);
              apiData = response.data;

              // 🔹 LẤY testSetId từ API response
              testSetId = apiData.summaryInfo?.testsetId;

              // Lấy questionGroups từ sessionStorage (nếu có)
              const storedTestData = sessionStorage.getItem('currentTestData');

              if (storedTestData) {
                  try {
                      const parsed = JSON.parse(storedTestData);
                      questionGroups = parsed.questions?.questionGroups || parsed.questionGroups || [];
                  } catch (e) {
                      console.warn('Cannot parse currentTestData:', e);
                  }
              }

              // 🔹 NẾU CHƯA CÓ testSetId, thử lấy từ sessionStorage
              if (!testSetId && storedTestData) {
                  try {
                      const parsed = JSON.parse(storedTestData);
                      testSetId = parsed.questions?.testSetId || parsed.testSetId;
                  } catch (e) {
                      console.warn('Cannot get testSetId:', e);
                  }
              }

              // 🛑 BỔ SUNG LOGIC RE-FETCH questionGroups NẾU BỊ THIẾU
              if (questionGroups.length === 0 && testSetId) {
                  console.warn('⚠️ questionGroups missing in session. Attempting to re-fetch required groups using testSetId:', testSetId);

                  // Lấy danh sách các parts đã làm từ API response
                  const partsTaken = apiData.partsTaken || [];

                  try {
                      // Sử dụng API mới để lấy lại cấu trúc câu hỏi
                      // 🛑 FIX: Dùng API mới để fetch lại questionGroups (chứa chi tiết đáp án)
                      const questionsResponse = await getTestSetQuestionsByTestSetId(testSetId, partsTaken);
                      questionGroups = questionsResponse.data.questionGroups || [];
                      console.log(`✅ Successfully re-fetched ${questionGroups.length} question groups.`);
                  } catch (error) {
                      console.error('❌ Failed to re-fetch question groups using testSetId:', error);
                      // Có thể thêm setError('Không thể tải chi tiết câu hỏi...') nếu cần
                  }
              }


              // 🔹 GỌI API LẤY questionGroupOrders
              let orderMap = new Map<string, number>();
              if (testSetId) {
                  try {
                      const orders = await getQuestionGroupOrders(testSetId);
                      orderMap = new Map(
                          orders.map((order: any) => [order.questionGroupId, order.questionPartOrder])
                      );
                      setQuestionGroupOrders(orderMap);
                      console.log('📊 Question Group Orders loaded:', orderMap);
                  } catch (err) {
                      console.error('❌ Failed to load question group orders:', err);
                  }
              }

              console.log("questionGroups")
              console.log(questionGroups) // Kiểm tra log: Bây giờ sẽ có dữ liệu nếu API fetch thành công

              const formatted = formatApiDataToDisplay(apiData, questionGroups, orderMap);
              setResultData(formatted);

              // 🛑 CẬP NHẬT: Lưu trữ questionGroups (đã được fetch/tải lại) vào sessionStorage
              sessionStorage.setItem(`attemptResult_${attemptId}`, JSON.stringify({
                  ...apiData,
                  questionGroups: questionGroups,
                  questionIdMap: formatted.questionIdMap
              }));
          }
        // Case 2: attemptId = 'latest' (vừa nộp bài, dùng sessionStorage)
        else if (attemptId === 'latest') {
          console.log('📥 Loading result from sessionStorage');
          const stored = sessionStorage.getItem('latestTestResult');
          if (stored) {
            const parsed = JSON.parse(stored);
            questionGroups = parsed.questionGroups || [];
            testSetId = parsed.testSetId;

            // 🔹 GỌI API LẤY questionGroupOrders
            let orderMap = new Map<string, number>();
            if (testSetId) {
              try {
                const orders = await getQuestionGroupOrders(testSetId);
                orderMap = new Map(
                    orders.map((order: any) => [order.questionGroupId, order.questionPartOrder])
                );
                setQuestionGroupOrders(orderMap);
                console.log('📊 Question Group Orders loaded:', orderMap);
              } catch (err) {
                console.error('❌ Failed to load question group orders:', err);
              }
            }

            const formatted = formatApiDataToDisplay(parsed, questionGroups, orderMap);
            formatted.questionGroups = questionGroups;
            setResultData(formatted);
          } else {
            throw new Error('Không tìm thấy kết quả bài làm');
          }
        }
        // Case 3: Data truyền qua location.state (fallback)
        else if (location.state?.result) {
          console.log('📥 Loading result from location.state');
          questionGroups = location.state.result.questionGroups || location.state.questionGroups || [];
          testSetId = location.state.result.testSetId;

          // 🔹 GỌI API LẤY questionGroupOrders
          if (testSetId) {
            try {
              const orders = await getQuestionGroupOrders(testSetId);
              const orderMap = new Map(
                  orders.map((order: any) => [order.questionGroupId, order.questionPartOrder])
              );
              setQuestionGroupOrders(orderMap);
              console.log('📊 Question Group Orders loaded:', orderMap);
            } catch (err) {
              console.error('❌ Failed to load question group orders:', err);
            }
          }

          const formatted = formatApiDataToDisplay(location.state.result, questionGroups, questionGroupOrders);
          setResultData(formatted);
        } else {
          throw new Error('Không tìm thấy dữ liệu kết quả');
        }


      } catch (err: any) {
        console.error('❌ Error loading result:', err);
        setError(err.message || 'Không thể tải kết quả bài làm');
      } finally {
        setLoading(false);
      }
    };

    loadResultData();
  }, [attemptId, location.state]);

  useEffect(() => {
    if (resultData?.partDetails && resultData.partDetails.length > 0) {
      setExpandedParts(new Set([resultData.partDetails[0].partKey]));
    }
  }, [resultData]);

  // Hàm chuyển đổi data từ API sang format hiển thị
  const formatApiDataToDisplay = (apiData: any, questionGroups: any[], questionGroupOrders: Map<string, number>) => {
    const answerDetails = apiData.answerDetails || {};
    const partStatistics = apiData.partStatistics || {};

    // TẠO MAPPING questionNumber -> questionId
    const questionIdMap: Record<number, string> = {};
    Object.values(answerDetails).forEach((detail: any) => {
      questionIdMap[detail.questionNumber] = detail.questionId;
    });

    // Tạo map từ questionId sang question data
    const questionMap = new Map();
    questionGroups.forEach(group => {
      group.questions?.forEach((q: any) => {
        questionMap.set(q.id, {
          ...q,
          questionPart: group.questionPart
        });
      });
    });

    const answers: AnswerDisplay[] = [];
    Object.values(answerDetails).forEach((detail: any) => {
      const questionData = questionMap.get(detail.questionId);

      // 🔹 TÍNH questionNumber dựa trên questionPartOrder
      let displayQuestionNumber = detail.questionNumber; // fallback mặc định

      if (detail.questionGroupId && questionGroupOrders.size > 0) {
        const baseOrder = questionGroupOrders.get(detail.questionGroupId);

        if (baseOrder !== undefined) {
          // ✅ CÔNG THỨC ĐÚNG: questionPartOrder + (questionNumber - 1)
          displayQuestionNumber = baseOrder + (detail.questionNumber - 1);
        }
      }

      // Tìm đáp án user chọn (letter A, B, C, D)
      let userAnswerLetter = null;
      if (detail.selectedAnswerId && questionData) {
        const selectedAnswer = questionData.answers?.find(
            (a: any) => a.id === detail.selectedAnswerId
        );
        if (selectedAnswer) {
          // ✅ FIX: Nếu answerOrder bắt đầu từ 1, trừ đi 1
          // Nếu answerOrder bắt đầu từ 0, giữ nguyên
          const orderIndex = selectedAnswer.answerOrder >= 1 ? selectedAnswer.answerOrder - 1 : selectedAnswer.answerOrder;
          userAnswerLetter = String.fromCharCode(65 + orderIndex);
        }
      }

      // Tìm đáp án đúng (letter)
      let correctAnswerLetter = '?';
      if (detail.correctAnswerId && questionData) {
        const correctAnswer = questionData.answers?.find(
            (a: any) => a.id === detail.correctAnswerId
        );
        if (correctAnswer) {
          // ✅ FIX: Nếu answerOrder bắt đầu từ 1, trừ đi 1
          const orderIndex = correctAnswer.answerOrder >= 1 ? correctAnswer.answerOrder - 1 : correctAnswer.answerOrder;
          correctAnswerLetter = String.fromCharCode(65 + orderIndex);
        }
      }

      answers.push({
        questionNumber: displayQuestionNumber, // 🔹 SỬ DỤNG questionNumber MỚI
        userAnswer: userAnswerLetter,
        correctAnswer: correctAnswerLetter,
        isCorrect: detail.isSkipped ? null : detail.isCorrect
      });
    });

    // Sort answers theo questionNumber
    answers.sort((a, b) => a.questionNumber - b.questionNumber);

    // Tạo partDetails từ partStatistics
    const partDetails: PartData[] = [];
    Object.entries(partStatistics).forEach(([partKey, stat]: [string, any]) => {
      // 🔹 Lấy danh sách câu hỏi thuộc part này (đã tính questionNumber mới)
      const partQuestions = answers
          .filter(a => {
            // Tìm detail gốc để check questionPart
            const detail = Object.values(answerDetails).find((d: any) => {
              if (d.questionGroupId && questionGroupOrders.size > 0) {
                const baseOrder = questionGroupOrders.get(d.questionGroupId);
                if (baseOrder !== undefined) {
                  // So sánh questionNumber đã tính
                  return (baseOrder + (d.questionNumber - 1)) === a.questionNumber;
                }
              }
              return false;
            }) as any;

            return detail?.questionPart === partKey;
          })
          .map(a => a.questionNumber)
          .sort((a, b) => a - b); // 🔹 SORT theo thứ tự tăng dần

      // Group theo sections
      // Group theo sections - NHÓM THEO TAG
      const tagGroups = new Map<string, any[]>();

      // Duyệt qua answerDetails để nhóm theo tag
      Object.values(answerDetails).forEach((detail: any) => {
        if (detail.questionPart !== partKey) return;

        // Tính questionNumber đã format (giống logic ở trên)
        let displayQuestionNumber = detail.questionNumber;
        if (detail.questionGroupId && questionGroupOrders.size > 0) {
          const baseOrder = questionGroupOrders.get(detail.questionGroupId);
          if (baseOrder !== undefined) {
            displayQuestionNumber = baseOrder + (detail.questionNumber - 1);
          }
        }

        // Lấy tags
        const tags = detail.tags || [];

        if (tags.length === 0) {
          // Không có tag
          if (!tagGroups.has('Không phân loại')) {
            tagGroups.set('Không phân loại', []);
          }
          tagGroups.get('Không phân loại')!.push({
            questionNumber: displayQuestionNumber,
            isCorrect: detail.isCorrect,
            isSkipped: detail.isSkipped
          });
        } else {
          // Có tag - thêm vào từng tag
          tags.forEach((tag: any) => {
            const tagName = tag.tagName || 'Không rõ tag';
            if (!tagGroups.has(tagName)) {
              tagGroups.set(tagName, []);
            }
            tagGroups.get(tagName)!.push({
              questionNumber: displayQuestionNumber,
              isCorrect: detail.isCorrect,
              isSkipped: detail.isSkipped
            });
          });
        }
      });

      // Tạo sections từ tagGroups
      const sections: SectionData[] = [];

      // Thêm row "Tất cả câu hỏi" ở đầu
      sections.push({
        name: 'Tất cả câu hỏi',
        correct: stat.correctAnswers,
        wrong: stat.incorrectAnswers,
        skipped: stat.skippedQuestions,
        accuracy: stat.accuracy,
        questions: partQuestions
      });

      // Thêm các sections theo tag
      tagGroups.forEach((questions, tagName) => {
        // Sort theo questionNumber
        questions.sort((a: any, b: any) => a.questionNumber - b.questionNumber);

        // Tính thống kê
        const correct = questions.filter((q: any) => q.isCorrect === true).length;
        const wrong = questions.filter((q: any) => q.isCorrect === false && !q.isSkipped).length;
        const skipped = questions.filter((q: any) => q.isSkipped).length;
        const total = questions.length;
        const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

        sections.push({
          name: ` ${tagName}`,
          correct,
          wrong,
          skipped,
          accuracy,
          questions: questions.map((q: any) => q.questionNumber)
        });
      });

      partDetails.push({
        partName: partKey.replace('_', ' '),
        partKey: partKey,
        sections: sections
      });
    });

    // Sort parts theo thứ tự
    partDetails.sort((a, b) => {
      const numA = parseInt(a.partKey.replace('PART_', ''));
      const numB = parseInt(b.partKey.replace('PART_', ''));
      return numA - numB;
    });

    // Xác định parts đã làm
    const partsTaken = apiData.partsTaken || [];
    const listeningParts = partsTaken.filter((p: string) => ['PART_1', 'PART_2', 'PART_3', 'PART_4'].includes(p));
    const readingParts = partsTaken.filter((p: string) => ['PART_5', 'PART_6', 'PART_7'].includes(p));
    const customParts = partsTaken.filter((p: string) => !['PART_1', 'PART_2', 'PART_3', 'PART_4', 'PART_5', 'PART_6', 'PART_7'].includes(p));

    const hasListeningParts = listeningParts.length > 0;
    const hasReadingParts = readingParts.length > 0;
    const hasCustomParts = customParts.length > 0;
    const isFullTest = hasListeningParts && hasReadingParts;

    // Tính số câu Listening và Reading từ parts thực tế
    let listeningTotal = 0;
    let readingTotal = 0;

    partDetails.forEach(part => {
      const totalQuestions = part.sections.reduce((sum, s) => sum + s.questions.length, 0);

      if (listeningParts.includes(part.partKey)) {
        listeningTotal += totalQuestions;
      } else if (readingParts.includes(part.partKey)) {
        readingTotal += totalQuestions;
      }
    });

    // Format thời gian
    const formatTime = (seconds: number) => {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    // Format ngày giờ
    const formatDateTime = (createdDate?: string) => {
      if (!createdDate) return new Date().toLocaleString('vi-VN');
      return new Date(createdDate).toLocaleString('vi-VN');
    };

    // 🔹 Tạo lại questionIdMap với questionNumber MỚI
    const finalQuestionIdMap: Record<number, string> = {};
    Object.values(answerDetails).forEach((detail: any) => {
      let displayQuestionNumber = detail.questionNumber;

      if (detail.questionGroupId && questionGroupOrders.size > 0) {
        const baseOrder = questionGroupOrders.get(detail.questionGroupId);
        if (baseOrder !== undefined) {
          // ✅ CÔNG THỨC ĐÚNG
          displayQuestionNumber = baseOrder + (detail.questionNumber - 1);
        }
      }

      finalQuestionIdMap[displayQuestionNumber] = detail.questionId;
    });

      console.log("answers");
      console.log(answers);
      console.log("finalQuestionIdMap");
      console.log(finalQuestionIdMap);

    return {
      testName: apiData.summaryInfo?.testsetName || apiData.testsetName || apiData.testName || 'Bài test',
      testMode: isFullTest ? 'test' : 'practice',
      attemptDate: formatDateTime(apiData.createdDate),
      completionTime: formatTime(apiData.completionTime || 0),
      // studentName: 'Học viên',
      isFullTest: isFullTest,
      hasListening: hasListeningParts,
      hasReading: hasReadingParts,
      hasCustom: hasCustomParts,
      summary: {
        totalQuestions: apiData.correctAnswers + apiData.incorrectAnswers + apiData.unansweredQuestions,
        correctAnswers: apiData.correctAnswers,
        wrongAnswers: apiData.incorrectAnswers,
        skippedAnswers: apiData.unansweredQuestions,
        accuracy: apiData.correctAnswers > 0
            ? Math.round((apiData.correctAnswers / (apiData.correctAnswers + apiData.incorrectAnswers + apiData.unansweredQuestions)) * 100)
            : 0,
        score: apiData.totalScore,
        listeningScore: apiData.listeningScore,
        readingScore: apiData.readingScore,
        listeningCorrect: apiData.lcCorrectAnswers || 0,
        listeningTotal: listeningTotal,
        readingCorrect: apiData.rcCorrectAnswers || 0,
        readingTotal: readingTotal
      },
      partDetails,
      answers,
      questionIdMap: finalQuestionIdMap,
    };
  };

  const togglePartExpand = (partKey: string) => {
    setExpandedParts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(partKey)) {
        newSet.delete(partKey);
      } else {
        newSet.add(partKey);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
        <div style={{ backgroundColor: '#f9fafb', minHeight: '100vh', padding: '24px' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            {/* Header Card Skeleton */}
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              padding: '32px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
              marginBottom: '24px'
            }}>
              {/* Back Button Skeleton */}
              <div style={{
                width: '100px',
                height: '20px',
                backgroundColor: '#e5e7eb',
                borderRadius: '4px',
                marginBottom: '12px'
              }} className="animate-pulse" />

              {/* Title Skeleton */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{
                  width: '60%',
                  height: '32px',
                  backgroundColor: '#e5e7eb',
                  borderRadius: '8px',
                  marginBottom: '8px'
                }} className="animate-pulse" />
                <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                  <div style={{
                    width: '150px',
                    height: '16px',
                    backgroundColor: '#e5e7eb',
                    borderRadius: '4px'
                  }} className="animate-pulse" />
                  <div style={{
                    width: '200px',
                    height: '16px',
                    backgroundColor: '#e5e7eb',
                    borderRadius: '4px'
                  }} className="animate-pulse" />
                </div>
              </div>

              {/* Score Cards Skeleton */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '16px',
                marginBottom: '24px'
              }}>
                <div style={{
                  height: '160px',
                  backgroundColor: '#e5e7eb',
                  borderRadius: '12px'
                }} className="animate-pulse" />
                <div style={{
                  height: '160px',
                  backgroundColor: '#e5e7eb',
                  borderRadius: '12px'
                }} className="animate-pulse" />
              </div>

              {/* Statistics Skeleton */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '16px',
                marginBottom: '24px'
              }}>
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} style={{
                      height: '90px',
                      backgroundColor: '#e5e7eb',
                      borderRadius: '8px'
                    }} className="animate-pulse" />
                ))}
              </div>

              {/* Accuracy Bar Skeleton */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{
                    width: '100px',
                    height: '16px',
                    backgroundColor: '#e5e7eb',
                    borderRadius: '4px'
                  }} className="animate-pulse" />
                  <div style={{
                    width: '50px',
                    height: '16px',
                    backgroundColor: '#e5e7eb',
                    borderRadius: '4px'
                  }} className="animate-pulse" />
                </div>
                <div style={{
                  width: '100%',
                  height: '12px',
                  backgroundColor: '#e5e7eb',
                  borderRadius: '9999px'
                }} className="animate-pulse" />
              </div>
            </div>

            {/* Tabs Card Skeleton */}
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              overflow: 'hidden'
            }}>
              {/* Tab Headers Skeleton */}
              <div style={{
                display: 'flex',
                gap: '16px',
                padding: '14px 24px',
                borderBottom: '1px solid #e5e7eb',
                backgroundColor: '#fafafa'
              }}>
                <div style={{
                  width: '180px',
                  height: '20px',
                  backgroundColor: '#e5e7eb',
                  borderRadius: '4px'
                }} className="animate-pulse" />
                <div style={{
                  width: '150px',
                  height: '20px',
                  backgroundColor: '#e5e7eb',
                  borderRadius: '4px'
                }} className="animate-pulse" />
              </div>

              {/* Tab Content Skeleton */}
              <div style={{ padding: '24px' }}>
                {[1, 2, 3].map((i) => (
                    <div key={i} style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '14px 16px',
                      marginBottom: '12px',
                      backgroundColor: '#fafafa'
                    }}>
                      <div style={{
                        width: '200px',
                        height: '20px',
                        backgroundColor: '#e5e7eb',
                        borderRadius: '4px'
                      }} className="animate-pulse" />
                    </div>
                ))}
              </div>
            </div>
          </div>

          <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
        </div>
    );
  }

  if (error || !resultData) {
    return (
        <div style={{ backgroundColor: '#f9fafb', minHeight: '100vh', padding: '24px' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              padding: '48px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>
                Không thể tải kết quả
              </h2>
              <p style={{ color: '#6b7280', marginBottom: '24px' }}>
                {error || 'Đã có lỗi xảy ra khi tải dữ liệu'}
              </p>
              <button
                  onClick={() => {
                    if (classId) {
                      navigate(`/class/${classId}/excercise/${slug}`);
                    } else {
                      navigate(`/tests/${slug}`);
                    }
                  }}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#3b82f6',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
              >
                Quay lại bài test
              </button>
            </div>
          </div>
        </div>
    );
  }

  return (
      <div style={{backgroundColor: '#f9fafb', minHeight: '100vh', padding: '24px'}}>
        <div style={{maxWidth: '1280px', margin: '0 auto'}}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            padding: '32px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
            marginBottom: '24px'
          }}>
            {/*{classId && (*/}

            {/*)}*/}
            <button
                onClick={() => {
                  if (classId) {
                    navigate(`/class/${classId}/excercise/${slug}`);
                  } else {
                    navigate(`/tests/${slug}`);
                  }
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'none',
                  border: 'none',
                  color: '#333',
                  fontSize: '15px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  padding: 0,
                  marginBottom: '12px',
                  transition: 'color 0.2s ease'
                }}
            >
              <ChevronLeft size={18}/>
              <span>Quay lại</span>
            </button>

            {/* Test Name */}
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '2rem', fontWeight: 700, color: '#111827', margin: 0 }}>
                {resultData.testName}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px', fontSize: '14px', color: '#6b7280' }}>
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  <Clock size={16} style={{ marginRight: '4px', color: '#6b7280' }} />
                  <span>Thời gian: {resultData.completionTime}</span>
                </span>
                <span>{resultData.attemptDate}</span>
              </div>
            </div>

            {/* Score Cards */}
            {resultData.isFullTest && resultData.summary.score !== null && resultData.summary.score > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                  {/* Tổng điểm */}
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', fontWeight: 500, color: '#16a34a', textTransform: 'uppercase'}}>
                      Tổng điểm
                    </div>
                    <div style={{ fontSize: '48px', fontWeight: 700, color: '#16a34a'}}>
                      {resultData.summary.score}
                    </div>
                    <div style={{ fontSize: '15px', color: '#16a34a', fontWeight: 500 }}>/ 990</div>
                  </div>

                  {/* Listening + Reading */}
                  <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px' }}>
                    {/*<div style={{ fontSize: '20px', fontWeight: 500, color: '#374151', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>*/}
                    {/*  Chi tiết điểm phần*/}
                    {/*</div>*/}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                      <div style={{ flex: 1, background: '#fff', borderRadius: '8px', padding: '12px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                        <div style={{ fontSize: '15px', color: '#6b7280', marginBottom: '4px' }}>Listening</div>
                        <div style={{ fontSize: '24px', fontWeight: 600, color: '#1f2937' }}>
                          {resultData.summary.listeningScore || 0}
                        </div>
                        <div style={{ fontSize: '15px', color: '#9ca3af' }}>/ 495</div>
                      </div>
                      <div style={{ flex: 1, background: '#fff', borderRadius: '8px', padding: '12px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                        <div style={{ fontSize: '15px', color: '#6b7280', marginBottom: '4px' }}>Reading</div>
                        <div style={{ fontSize: '24px', fontWeight: 600, color: '#1f2937' }}>
                          {resultData.summary.readingScore || 0}
                        </div>
                        <div style={{ fontSize: '15px', color: '#9ca3af' }}>/ 495</div>
                      </div>
                    </div>
                  </div>
                </div>
            )}

            {/* Statistics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '12px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
                <div style={{ color: '#6b7280', fontSize: '16px', marginBottom: '4px' }}>Tổng câu</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#1f2937' }}>{resultData.summary.totalQuestions}</div>
              </div>

              <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '12px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
                <div style={{ color: '#16a34a', fontSize: '16px', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={18} style={{ marginRight: '4px' }} />
                  Đúng
                </div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#16a34a' }}>{resultData.summary.correctAnswers}</div>
              </div>

              <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '12px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
                <div style={{ color: '#dc2626', fontSize: '16px', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <XCircle size={18} style={{ marginRight: '4px' }} />
                  Sai
                </div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#dc2626' }}>{resultData.summary.wrongAnswers}</div>
              </div>

              <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '12px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
                <div style={{ color: '#6b7280', fontSize: '16px', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Circle size={18} style={{ marginRight: '4px' }} />
                  Bỏ qua
                </div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#6b7280' }}>{resultData.summary.skippedAnswers}</div>
              </div>
            </div>

            {/* Accuracy Bar */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>Độ chính xác</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>{resultData.summary.accuracy}%</span>
              </div>
              <div style={{ width: '100%', background: '#e5e7eb', borderRadius: '9999px', height: '12px', overflow: 'hidden' }}>
                <div
                    style={{
                      height: '12px',
                      borderRadius: '9999px',
                      transition: 'all 500ms',
                      width: `${resultData.summary.accuracy}%`,
                      background: 'linear-gradient(90deg, rgba(52,211,153,1) 0%, rgba(16,185,129,1) 100%)'
                    }}
                />
              </div>
            </div>
          </div>

          <div style={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            overflow: 'hidden'
          }}>
            <div style={{display: 'flex', borderBottom: '1px solid #e5e7eb'}}>
              <button
                  onClick={() => setActiveTab('overview')}
                  style={{
                    flex: 1,
                    padding: '14px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: activeTab === 'overview' ? '#b91c1c' : '#6b7280',
                    borderBottom: activeTab === 'overview' ? '2px solid #b91c1c' : 'none',
                    cursor: 'pointer',
                    fontWeight: 500,
                    fontSize: '14px'
                  }}
              >
                Tổng quan theo phần
              </button>
              <button
                  onClick={() => setActiveTab('details')}
                  style={{
                    flex: 1,
                    padding: '14px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: activeTab === 'details' ? '#b91c1c' : '#6b7280',
                    borderBottom: activeTab === 'details' ? '2px solid #b91c1c' : 'none',
                    cursor: 'pointer',
                    fontWeight: 500,
                    fontSize: '14px'
                  }}
              >
                Chi tiết từng câu
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              {activeTab === 'overview' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {resultData.partDetails.map((part: PartData) => (
                        <div key={part.partKey} style={{
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          overflow: 'hidden'
                        }}>
                          <button
                              onClick={() => togglePartExpand(part.partKey)}
                              style={{
                                width: '100%',
                                padding: '14px 16px',
                                backgroundColor: '#f9fafb',
                                border: 'none',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                cursor: 'pointer',
                                fontSize: '15px',
                                fontWeight: 600,
                                color: '#111827'
                              }}
                          >
                            <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                              <span>{part.partName}</span>
                              <span style={{
                                fontSize: '14px',
                                fontWeight: 500,
                                color: '#6b7280'
                              }}>
                                {part.sections[0].correct}/{part.sections[0].correct + part.sections[0].wrong + part.sections[0].skipped}
                              </span>
                            </div>
                            <ChevronDown
                                size={18}
                                style={{
                                  transform: expandedParts.has(part.partKey) ? 'rotate(180deg)' : 'rotate(0deg)',
                                  transition: 'transform 200ms',
                                  color: '#6b7280'
                                }}
                            />
                          </button>

                          {expandedParts.has(part.partKey) && (
                              <div style={{overflowX: 'auto'}}>
                                <table style={{width: '100%', fontSize: '13px'}}>
                                  <thead>
                                  <tr style={{backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb'}}>
                                    <th style={{
                                      padding: '10px 16px',
                                      textAlign: 'left',
                                      fontWeight: 600,
                                      color: '#374151',
                                      fontSize: '13px',
                                      width: '300px',
                                      minWidth: '250px'
                                    }}>
                                      Phân loại câu hỏi
                                    </th>
                                    <th style={{
                                      padding: '10px 12px',
                                      textAlign: 'center',
                                      fontWeight: 600,
                                      color: '#374151',
                                      fontSize: '13px',
                                      width: '80px',
                                      minWidth: '50px'
                                    }}>
                                      Đúng
                                    </th>
                                    <th style={{
                                      padding: '10px 12px',
                                      textAlign: 'center',
                                      fontWeight: 600,
                                      color: '#374151',
                                      fontSize: '13px',
                                      width: '80px',
                                      minWidth: '50px'
                                    }}>
                                      Sai
                                    </th>
                                    <th style={{
                                      padding: '10px 12px',
                                      textAlign: 'center',
                                      fontWeight: 600,
                                      color: '#374151',
                                      fontSize: '13px',
                                      width: '80px',
                                      minWidth: '60px'
                                    }}>
                                      Bỏ qua
                                    </th>
                                    <th style={{
                                      padding: '10px 16px',
                                      textAlign: 'left',
                                      fontWeight: 600,
                                      color: '#374151',
                                      fontSize: '13px',
                                      minWidth: '250px'
                                    }}>
                                      Danh sách câu hỏi
                                    </th>
                                  </tr>
                                  </thead>
                                  <tbody>
                                  {part.sections.map((section, idx) => (
                                      <tr key={idx} style={{
                                        borderBottom: idx < part.sections.length - 1 ? '1px solid #f3f4f6' : 'none',
                                        backgroundColor: '#fff'
                                      }}>
                                        <td style={{
                                          padding: '12px 16px',
                                          color: '#111827',
                                          fontWeight: 500,
                                          fontSize: '13px',
                                          width: '300px',
                                          minWidth: '200px'
                                        }}>
                                          {section.name}
                                        </td>
                                        <td style={{
                                          padding: '12px',
                                          textAlign: 'center',
                                          color: '#10b981',
                                          fontWeight: 700,
                                          fontSize: '14px',
                                          width: '80px',
                                          minWidth: '50px'
                                        }}>
                                          {section.correct}
                                        </td>
                                        <td style={{
                                          padding: '12px',
                                          textAlign: 'center',
                                          color: '#ef4444',
                                          fontWeight: 700,
                                          fontSize: '14px',
                                          width: '80px',
                                          minWidth: '50px'
                                        }}>
                                          {section.wrong}
                                        </td>
                                        <td style={{
                                          padding: '12px',
                                          textAlign: 'center',
                                          color: '#6b7280',
                                          fontWeight: 700,
                                          fontSize: '14px',
                                          width: '80px',
                                          minWidth: '70px'
                                        }}>
                                          {section.skipped}
                                        </td>
                                        <td style={{
                                          padding: '12px 16px',
                                          minWidth: '250px'
                                        }}>
                                          {section.name !== 'Tất cả câu hỏi' && (
                                              <div style={{
                                                display: 'flex',
                                                flexWrap: 'wrap',
                                                gap: '6px',
                                                alignItems: 'center',
                                                maxHeight: '150px',
                                                overflowY: 'auto',
                                                overflowX: 'hidden',
                                                paddingRight: '4px'
                                              }}>
                                                {section.questions.map((qNum) => {
                                                  const answer = resultData.answers.find((a: AnswerDisplay) => a.questionNumber === qNum);
                                                  return (
                                                      <QuestionBox
                                                          key={qNum}
                                                          number={qNum}
                                                          isCorrect={answer?.isCorrect}
                                                          size="small"
                                                          onClick={() => setSelectedQuestionNumber(qNum)}
                                                      />
                                                  );
                                                })}
                                              </div>
                                          )}
                                        </td>
                                      </tr>
                                  ))}
                                  </tbody>
                                </table>
                              </div>
                          )}
                        </div>
                    ))}
                  </div>
              )}

              {activeTab === 'details' && (
                  <div>
                    {resultData.partDetails.map((part: PartData) => (
                        <div key={part.partKey} style={{marginBottom: '24px'}}>
                          <h3 style={{
                            fontSize: '16px',
                            fontWeight: 700,
                            color: '#111827',
                            marginBottom: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            {part.partName}
                          </h3>

                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(35px, 1fr))',
                            gap: '6px'
                          }}>
                            {resultData.answers
                                .filter((a: AnswerDisplay) => part.sections.some(s => s.questions.includes(a.questionNumber)))
                                .map((answer: AnswerDisplay) => (
                                    <QuestionBox
                                        key={answer.questionNumber}
                                        number={answer.questionNumber}
                                        isCorrect={answer.isCorrect}
                                        size="small"
                                        onClick={() => setSelectedQuestionNumber(answer.questionNumber)}
                                    />
                                ))}
                          </div>
                        </div>
                    ))}
                  </div>
              )}


            </div>
          </div>

          {/* Comment Section */}
          {attemptId && attemptId !== 'latest' && (
              <TestResultCommentSection
                  testResultId={attemptId}
                  classId={classId ? parseInt(classId) : undefined}
              />
          )}
        </div>

        <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
        `}</style>

        {selectedQuestionNumber && (
            <QuestionDetailModal
                questionNumber={selectedQuestionNumber}
                attemptId={attemptId}
                userAnswers={Object.fromEntries(
                    resultData.answers.map((a: AnswerDisplay) => [a.questionNumber, a.userAnswer])
                )}
                onClose={() => setSelectedQuestionNumber(null)}
            />
        )}
      </div>
  );
};

export default TestResultDetailPage;