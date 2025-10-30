import React, { useState, useEffect, useCallback } from 'react';
import { Typography, Spin } from 'antd';
import { 
  type FeedbackTeacherResponse,
  getLastSubmissionExamMode,
  type LastSubmissionResponse
} from '../../../shared/services/submissionService';
import './FeedbackPanel.scss';

const { Text } = Typography;

interface FeedbackPanelProps {
  classId: number;
  assignmentId: number;
  // Prop để trigger reload khi có submission mới
  refreshTrigger?: number;
  // Prop để nhận submission data từ parent (tránh gọi API 2 lần)
  submissionData?: LastSubmissionResponse | null;
}

const FeedbackPanel: React.FC<FeedbackPanelProps> = ({
  classId,
  assignmentId,
  refreshTrigger = 0,
  submissionData
}) => {
  const [feedback, setFeedback] = useState<FeedbackTeacherResponse[]>([]);
  const [lastSubmission, setLastSubmission] = useState<LastSubmissionResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const currentScore = lastSubmission?.score !== undefined && lastSubmission?.score !== null 
    ? lastSubmission.score 
    : undefined;

  const loadFeedbackData = useCallback(async () => {
    // Nếu có submissionData từ parent, ưu tiên dùng (đã được load từ parent)
    if (submissionData !== undefined) {
      setLastSubmission(submissionData);
      if (submissionData?.feedbackTeacherResponse) {
        setFeedback(submissionData.feedbackTeacherResponse);
      } else {
        setFeedback([]);
      }
      return;
    }
    
    // Fallback: Nếu không có submissionData từ parent, call API
    setLoading(true);
    setError('');
    
    try {
      const submission = await getLastSubmissionExamMode(classId, assignmentId);
      setLastSubmission(submission);
      
      if (submission?.feedbackTeacherResponse) {
        setFeedback(submission.feedbackTeacherResponse);
      } else {
        setFeedback([]);
      }
    } catch (err: any) {
      console.error('Error loading feedback data:', err);
      setError('Không thể tải dữ liệu');
      setFeedback([]);
      setLastSubmission(null);
    } finally {
      setLoading(false);
    }
  }, [classId, assignmentId, submissionData]);

  useEffect(() => {
    loadFeedbackData();
  }, [loadFeedbackData, refreshTrigger]);

  return (
    <div className="feedback-panel">
      <div className="feedback-panel__header">
        <h3 className="feedback-panel__title">Đánh giá</h3>
      </div>

      <div className="feedback-panel__content">
        {loading ? (
          <div className="feedback-panel__loading">
            <Spin />
            <Text style={{ marginTop: 8, color: '#b0b0b0' }}>
              Đang tải thông tin...
            </Text>
          </div>
        ) : error ? (
          <div className="feedback-panel__error">
            <Text style={{ color: '#ff4d4f' }}>{error}</Text>
          </div>
        ) : (
          <>
            {/* Submission Status */}
            <div className="feedback-panel__section">
              <div className="feedback-panel__section-title">
                Trạng thái nộp bài
              </div>
              <div className="feedback-panel__status">
                {lastSubmission ? (
                  <>
                    <Text style={{ color: '#52c41a', fontSize: '14px' }}>
                      ✅ Đã nộp bài
                    </Text>
                    <Text style={{ 
                      display: 'block', 
                      fontSize: '12px', 
                      color: '#888', 
                      marginTop: 4 
                    }}>
                      {new Date(lastSubmission.createdDate).toLocaleString('vi-VN')}
                    </Text>
                  </>
                ) : (
                  <Text style={{ color: '#faad14', fontSize: '14px' }}>
                    ⏳ Chưa nộp bài
                  </Text>
                )}
              </div>
            </div>

            {/* Score Section */}
            <div className="feedback-panel__section">
              <div className="feedback-panel__section-title">
                Điểm số
              </div>
              <div className="feedback-panel__score-display">
                <div className="feedback-panel__score-value">
                  {currentScore !== undefined ? (
                    <>
                      <span className="score-number">{currentScore}</span>
                      <span className="score-divider">/</span>
                      <span className="score-total">10</span>
                    </>
                  ) : (
                    <span className="score-empty">--</span>
                  )}
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div className="feedback-panel__section feedback-panel__section--comments">
              <div className="feedback-panel__section-title">
                Nhận xét của giáo viên
              </div>
              <div className={`feedback-panel__comments ${feedback.length === 0 ? 'feedback-panel__comments--empty' : ''}`}>
                {feedback.length > 0 ? (
                  <Text className="feedback-panel__comment-text">
                    {feedback[0].content}
                  </Text>
                ) : (
                  <Text style={{ color: '#888', fontStyle: 'italic' }}>
                    Chưa có nhận xét
                  </Text>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FeedbackPanel;
