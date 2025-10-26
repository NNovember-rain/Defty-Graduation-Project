import React from "react";
import { Button, Spin, Typography } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import {
    type FeedbackAIResponse
} from "../../../shared/services/submissionService";
import "./SubmissionFeedbackAI.scss";

const { Title, Text } = Typography;

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
                    <div>
                        <Spin size="large" />
                        <Text>Đang tải phản hồi...</Text>
                    </div>
                ) : error ? (
                    <div>
                        <Text type="danger">{error}</Text>
                    </div>
                ) : feedbackData ? (
                    <>
                        <div>
                            <Title level={4}>
                                Phản hồi từ AI - {feedbackData.aiModalName}
                            </Title>
                            <Text>
                                ID: {feedbackData.id} | Submission: #{feedbackData.submissionId}
                            </Text>
                        </div>
                        {feedbackData.feedback && Object.keys(feedbackData.feedback).length > 0 ? (
                            <div>
                                <pre>{JSON.stringify(feedbackData.feedback, null, 2)}</pre>
                            </div>
                        ) : (
                            <div>
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