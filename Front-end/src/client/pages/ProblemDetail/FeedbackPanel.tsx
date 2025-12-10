import React, { useState, useEffect, useCallback } from 'react';
import { Typography, Spin, Button, Input, message, Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { 
  type FeedbackTeacherResponse,
  getLastSubmissionExamMode,
  type LastSubmissionResponse,
  type FeedbackTeacherRequest,
  addFeedbackTeacher,
  getFeedbackTeacher
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

  // Student comment states
  const [studentComments, setStudentComments] = useState<FeedbackTeacherResponse[]>([]);
  const [commentContent, setCommentContent] = useState<string>('');
  const [savingComment, setSavingComment] = useState<boolean>(false);

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

  const loadStudentComments = useCallback(async () => {
    if (!lastSubmission?.id) return;
    try {
      const response = await getFeedbackTeacher(lastSubmission.id);
      setStudentComments(response);
    } catch (error) {
      console.error('Failed to load student comments:', error);
    }
  }, [lastSubmission?.id]);

  const saveStudentComment = useCallback(async () => {
    if (!lastSubmission?.id || !commentContent.trim()) return;
    
    setSavingComment(true);
    try {
      const request: FeedbackTeacherRequest = {
        content: commentContent,
        submissionId: lastSubmission.id
      };
      await addFeedbackTeacher(request);
      message.success('Comment saved successfully');
      setCommentContent('');
      await loadStudentComments();
    } catch (error) {
      console.error('Failed to save comment:', error);
      message.error('Failed to save comment');
    } finally {
      setSavingComment(false);
    }
  }, [lastSubmission?.id, commentContent, loadStudentComments]);

  useEffect(() => {
    loadFeedbackData();
  }, [loadFeedbackData, refreshTrigger]);

  useEffect(() => {
    if (lastSubmission?.id) {
      loadStudentComments();
    }
  }, [lastSubmission?.id, loadStudentComments]);

  return (
    <div className="feedback-panel">
      <div className="feedback-panel__header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h3 className="feedback-panel__title">Trạng thái:</h3>
          <div className="feedback-panel__header-content">
            {currentScore !== undefined ? (
              <>
                <span className="score-number">{currentScore}</span>
                <span className="score-divider">/</span>
                <span className="score-total">10</span>
                <span className="status-spacer">•</span>
              </>
            ) : null}
            <span className="status-text">
              {lastSubmission ? '✅ Đã nộp' : '⏳ Chưa nộp'}
            </span>
          </div>
        </div>
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
            {/* Score Section */}
            <div className="feedback-panel__section">
              <div className="feedback-panel__section-title">
                Điểm số:
              </div>
              <div className="feedback-panel__status">
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
            </div>

            {/* Student Comments Section */}
            <div className="feedback-panel__section feedback-panel__section--student-comments">
              <div className="feedback-panel__section-title">
                Nhận xét:
              </div>
              <div className="feedback-panel__student-comments">
                {/* Display existing student comments */}
                {studentComments.length > 0 ? (
                  <div className="feedback-panel__existing-comments">
                    {studentComments.map((comment, index) => (
                      <div key={comment.id || index} className="feedback-panel__student-comment-item">
                        <div className="feedback-panel__comment-header">
                          <Avatar 
                            size={32} 
                            src={comment.imageUrl} 
                            icon={!comment.imageUrl && <UserOutlined />}
                            style={{ backgroundColor: '#02b128' }}
                          />
                          <div className="feedback-panel__comment-user-info">
                            <Text className="feedback-panel__comment-user-name">
                              {comment.fullName || 'Người dùng'}
                            </Text>
                            <Text className="feedback-panel__comment-date">
                              {comment.createdDate ? new Date(comment.createdDate).toLocaleString('vi-VN') : ''}
                            </Text>
                          </div>
                        </div>
                        <Text className="feedback-panel__student-comment-text">
                          {comment.content}
                        </Text>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="feedback-panel__empty-comments">
                    <Text style={{ color: '#888', fontSize: '13px' }}>
                      Chỉ bạn và giáo viên của bạn mới nhìn thấy các nhận xét riêng tư
                    </Text>
                  </div>
                )}
              </div>

              {/* Input for new comment - outside the comments container */}
              <div className="feedback-panel__comment-input-container">
                <Input.TextArea
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder="Nhập nhận xét của bạn về bài làm này..."
                  rows={2}
                  maxLength={500}
                  className="feedback-panel__comment-input"
                  style={{
                    resize: 'none',
                    borderRadius: '8px',
                    border: '1px solid #d9d9d9'
                  }}
                />
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginTop: '8px' 
                }}>
                  <Text style={{ fontSize: '12px', color: '#888' }}>
                    {commentContent.length}/500 ký tự
                  </Text>
                  <Button
                    type="primary"
                    size="small"
                    onClick={saveStudentComment}
                    loading={savingComment}
                    disabled={!commentContent.trim() || savingComment}
                    style={{
                      backgroundColor: '#02b128',
                      borderColor: '#02b128',
                      borderRadius: '6px'
                    }}
                  >
                    {savingComment ? 'Đang lưu...' : 'Gửi nhận xét'}
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FeedbackPanel;
