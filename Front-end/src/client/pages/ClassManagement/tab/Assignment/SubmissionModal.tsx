import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Button, Typography, Spin, Image } from 'antd';
import { Editor } from '@monaco-editor/react';
import { MdPlayArrow } from 'react-icons/md';
import { deflate } from 'pako';
import { 
  createSubmission, 
  type SubmissionRequest,
  getFeedbackTeacher,
  type FeedbackTeacherResponse,
  getSubmissionHistory,
  type SubmissionHistoryResponse
} from '../../../../../shared/services/submissionService';
import { useNotification } from '../../../../../shared/notification/useNotification';
import type { IAssignment } from '../../../../../shared/services/assignmentService';
import './SubmissionModal.scss';

const { Title, Text } = Typography;

interface SubmissionModalProps {
  visible: boolean;
  onCancel: () => void;
  assignment: IAssignment;
  classId: number;
}

// PlantUML helper functions
const plantUmlEncTable = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_";

function _append3bytes(b1: number, b2: number, b3: number) {
  const c1 = b1 >> 2;
  const c2 = ((b1 & 0x3) << 4) | (b2 >> 4);
  const c3 = ((b2 & 0xF) << 2) | (b3 >> 6);
  const c4 = b3 & 0x3F;
  return (
    plantUmlEncTable.charAt(c1) +
    plantUmlEncTable.charAt(c2) +
    plantUmlEncTable.charAt(c3) +
    plantUmlEncTable.charAt(c4)
  );
}

function plantUmlEncode(bytes: Uint8Array) {
  let r = "";
  for (let i = 0; i < bytes.length; i += 3) {
    if (i + 2 === bytes.length) r += _append3bytes(bytes[i], bytes[i + 1], 0);
    else if (i + 1 === bytes.length) r += _append3bytes(bytes[i], 0, 0);
    else r += _append3bytes(bytes[i], bytes[i + 1], bytes[i + 2]);
  }
  return r;
}

function plantUmlSvgUrl(uml: string) {
  const data = new TextEncoder().encode(uml);
  const deflated = deflate(data, { level: 9, raw: true });
  const encoded = plantUmlEncode(deflated);
  return `https://www.plantuml.com/plantuml/svg/${encoded}`;
}

const initialPlantUml = `@startuml
' Nhập code PlantUML của bạn ở đây
class Example {
  +String name
  +int value
  +doSomething()
}
@enduml`;

const SubmissionModal: React.FC<SubmissionModalProps> = ({
  visible,
  onCancel,
  assignment,
  classId
}) => {
  const { message } = useNotification();
  
  // State for code editor
  const [code, setCode] = useState<string>(initialPlantUml);
  
  // State for preview
  const [previewImageSrc, setPreviewImageSrc] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [previewError, setPreviewError] = useState<string>('');
  const [showPreview, setShowPreview] = useState<boolean>(false);
  
  // State for submission
  const [submitting, setSubmitting] = useState<boolean>(false);
  
  // State for feedback and score
  const [feedback, setFeedback] = useState<FeedbackTeacherResponse[]>([]);
  const [submissionHistory, setSubmissionHistory] = useState<SubmissionHistoryResponse[]>([]);
  const [loadingFeedback, setLoadingFeedback] = useState<boolean>(false);
  
  // Current score from feedback
  const currentScore = feedback.length > 0 ? feedback[0]?.score : undefined;

  // Generate preview like in ProblemDetail
  const renderWithKroki = useCallback(async (uml: string) => {
    if (!uml.trim()) {
      setSvgMarkup(null);
      setImageUrl(null);
      setPreviewError('');
      return;
    }

    setPreviewLoading(true);
    setPreviewError('');
    setSvgMarkup(null);
    setImageUrl(null);

    try {
      const res = await fetch("https://kroki.io/plantuml/svg", {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: uml,
      });

      if (!res.ok) {
        setPreviewError(`Lỗi render: ${res.status}`);
        setImageUrl(plantUmlSvgUrl(uml)); // fallback
        return;
      }

      const svg = await res.text();
      setSvgMarkup(svg);
      setImageUrl(null);
    } catch (error: any) {
      setPreviewError('Render thất bại');
      setSvgMarkup(null);
      setImageUrl(plantUmlSvgUrl(uml)); // fallback
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  // Handle run preview - show image in modal
  const handleRunPreview = async () => {
    if (!code.trim()) return;

    setPreviewLoading(true);
    setPreviewError('');
    setPreviewImageSrc(null);

    try {
      const res = await fetch("https://kroki.io/plantuml/svg", {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: code,
      });

      if (!res.ok) {
        setPreviewError(`Lỗi render: ${res.status}`);
        // Show fallback image
        const fallbackUrl = plantUmlSvgUrl(code);
        setPreviewImageSrc(fallbackUrl);
        setShowPreview(true);
        return;
      }

      const svg = await res.text();
      // Convert SVG to base64 and show in preview
      const base64Svg = `data:image/svg+xml;base64,${btoa(svg)}`;
      setPreviewImageSrc(base64Svg);
      setShowPreview(true);
    } catch (error: any) {
      setPreviewError('Render thất bại');
      // Show fallback image
      const fallbackUrl = plantUmlSvgUrl(code);
      setPreviewImageSrc(fallbackUrl);
      setShowPreview(true);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Load submission history and feedback
  const loadSubmissionData = useCallback(async () => {
    if (!assignment?.id) return;
    
    setLoadingFeedback(true);
    try {
      // Get submission history
      const historyResponse = await getSubmissionHistory(assignment.id, { page: 0, size: 1 });
      setSubmissionHistory(historyResponse.content);
      
      // If there's a submission, get feedback
      if (historyResponse.content.length > 0) {
        const latestSubmission = historyResponse.content[0];
        const feedbackResponse = await getFeedbackTeacher(latestSubmission.id);
        setFeedback(feedbackResponse);
      }
    } catch (error) {
      console.error('Error loading submission data:', error);
    } finally {
      setLoadingFeedback(false);
    }
  }, [assignment?.id]);

  // Load data when modal opens
  useEffect(() => {
    if (visible) {
      loadSubmissionData();
    }
  }, [visible, loadSubmissionData]);

  // Handle submission
  const handleSubmit = async () => {
    if (!code.trim()) {
      message.error("Vui lòng nhập code PlantUML!");
      return;
    }

    setSubmitting(true);
    try {
      const submissionData: SubmissionRequest = {
        classId,
        assignmentId: assignment.id,
        studentPlantUmlCode: code,
        examMode: true // Exam mode as requested
      };

      await createSubmission(submissionData);
      message.success("Nộp bài thành công!");
      
      // Reload submission data
      await loadSubmissionData();
      
    } catch (error: any) {
      console.error('Submission error:', error);
      message.error(error.message || "Có lỗi xảy ra khi nộp bài!");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setCode(initialPlantUml);
    setPreviewImageSrc(null);
    setShowPreview(false);
    setPreviewError('');
    setFeedback([]);
    setSubmissionHistory([]);
    onCancel();
  };

  return (
    <Modal
      title={assignment?.title || ''}
      open={visible}
      onCancel={handleClose}
      footer={null}
      width="80vw"
      style={{ top: 40 }}
      className="submission-modal"
      destroyOnClose
    >
      <div className="submission-content">
        <div className="submission-main">
          {/* Code Editor Section */}
          <div className="submission-editor-section">
            <div className="section-header-with-button">
              <Title level={5} className="section-header">
                Code PlantUML
              </Title>
              <button
                className="play-icon-btn"
                onClick={handleRunPreview}
                disabled={previewLoading}
                type="button"
              >
                {previewLoading ? <Spin size="small" /> : <MdPlayArrow />}
              </button>
            </div>
            <div className="code-editor-container">
              <Editor
                height="100%"
                defaultLanguage="text"
                value={code}
                onChange={(value) => setCode(value || '')}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 14,
                  lineNumbers: 'on',
                  wordWrap: 'on',
                  automaticLayout: true,
                  folding: true,
                  padding: { top: 0, bottom: 0 },
                  lineNumbersMinChars: 4
                }}
              />
            </div>
          </div>

          {/* Feedback Section */}
          <div className="submission-feedback-section">
            {loadingFeedback ? (
              <div style={{ textAlign: 'center' }}>
                <Spin />
                <Text style={{ display: 'block', marginTop: 8 }}>
                  Đang tải thông tin...
                </Text>
              </div>
            ) : (
              <>
                {/* Score Section */}
                <div className="score-section">
                  <div className="score-label">Điểm số</div>
                  <div className="score-value">
                    {currentScore !== undefined ? (
                      <>
                        {currentScore}
                        <span className="score-divider">/</span>
                        10
                      </>
                    ) : (
                      '--'
                    )}
                  </div>
                </div>

                {/* Comments Section */}
                <div className="comments-section">
                  <div className="comments-header">Nhận xét của giáo viên</div>
                  <div className={`comments-content ${feedback.length === 0 ? 'no-comments' : ''}`}>
                    {feedback.length > 0 ? (
                      <Text className="comment-text">
                        {feedback[0].content}
                      </Text>
                    ) : (
                      <Text>Chưa có nhận xét</Text>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="submission-actions">
          <div className="action-buttons">
            <Button onClick={handleClose}>
              Hủy
            </Button>
            <Button 
              type="primary" 
              onClick={handleSubmit}
              loading={submitting}
              disabled={!code.trim() || submitting}
            >
              {submitting ? 'Đang nộp...' : 'Nộp bài'}
            </Button>
          </div>
        </div>
      </div>

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
    </Modal>
  );
};

export default SubmissionModal;