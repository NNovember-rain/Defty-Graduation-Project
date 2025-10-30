import React from "react";
import { Button, Spin, Typography } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
    type FeedbackAIResponse
} from "../../../shared/services/submissionService";
import "./SubmissionFeedbackAI.scss";

const { Text } = Typography;

interface SubmissionFeedbackAIProps {
    feedbackData: FeedbackAIResponse | null;
    loading: boolean;
    error: string | null;
    onBack: () => void;
}

const SubmissionFeedbackAI: React.FC<SubmissionFeedbackAIProps> = ({
                                                                       feedbackData,
                                                                       loading,
                                                                       error,
                                                                       onBack
                                                                   }) => {
    console.log(feedbackData?.feedback?.feedback);

    return (
        <div className="submission-feedback-ai">
            <Button
                type="link"
                icon={<ArrowLeftOutlined />}
                onClick={onBack}
                className="submission-feedback-ai__back-btn"
            >
                Quay lại danh sách
            </Button>

            <div className="submission-feedback-ai__content">
                {loading ? (
                    <div className="submission-feedback-ai__loading">
                        <Spin size="large" />
                        <Text>Đang tải phản hồi...</Text>
                    </div>
                ) : error ? (
                    <div className="submission-feedback-ai__error">
                        <Text type="danger">{error}</Text>
                    </div>
                ) : feedbackData ? (
                    <>
                        {feedbackData.feedback && feedbackData.feedback.feedback ? (
                            <div className="submission-feedback-ai__markdown-wrapper">
                                <div className="submission-feedback-ai__markdown">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {feedbackData.feedback.feedback}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        ) : (
                            <div className="submission-feedback-ai__empty">
                                <Text>
                                    Chưa có phản hồi từ AI hoặc AI đang xử lý bài nộp này.
                                </Text>
                            </div>
                        )}
                    </>
                ) : null}
            </div>
        </div>
    );
};

export default SubmissionFeedbackAI;