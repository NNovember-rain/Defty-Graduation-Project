import logger from "../config/logger";
import { getErrorMessage, getErrorStack } from "../utils/errorHandler";

const sendFeedBack = async (
    id: number,
    aiResponse: string,
    aiModalName: string
) => {
    if (!id) {
        throw new Error("ID key is required.");
    }

    try {
        const url = 'http://localhost:8086/submission/feedback/llm';

        const payload = {
            submissionId: id,
            feedback: aiResponse,
            aiModalName: aiModalName
        };

        logger.info("payload: -------------", payload);

        const feedbackResponse = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        if (!feedbackResponse.ok) {
            let errorDetails = `HTTP error! status: ${feedbackResponse.status}`;
            try {
                const errorData = await feedbackResponse.json();
                errorDetails += ` - Details: ${JSON.stringify(errorData)}`;
            } catch (parseError) {
                logger.warn({
                    message: `Could not parse error response from ${url}: ${getErrorMessage(parseError)}`,
                    event_type: "api_response_parsing_failed"
                });
            }
            throw new Error(`Failed to send feedback: ${errorDetails}`);
        }

        console.log("Feedback sent successfully.");

    } catch (error: unknown) {
        logger.error({
            message: "Error calling feedback API.",
            event_type: "feedback_api_call_failed",
            error_message: getErrorMessage(error),
            stack: getErrorStack(error)
        });
        throw new Error(`Failed to send feedback. ${getErrorMessage(error)}`);
    }
};

export default sendFeedBack;