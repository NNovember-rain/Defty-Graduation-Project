import logger from "../config/logger";
import { getErrorMessage, getErrorStack } from "../utils/errorHandler";

/**
 * Validate và parse AI response thành feedback object
 */
const parseAiResponseToFeedback = (aiResponse: string): any => {
    let extractedJson = aiResponse.trim();

    try {
        // Case 1: Response có thể wrap trong ```json blocks
        const jsonBlockMatch = extractedJson.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonBlockMatch) {
            extractedJson = jsonBlockMatch[1].trim();
        }

        // Case 2: Response có thể có text trước/sau JSON
        const jsonObjectMatch = extractedJson.match(/\{[\s\S]*\}/);
        if (jsonObjectMatch) {
            extractedJson = jsonObjectMatch[0];
        }

        // Parse JSON
        const feedbackObject = JSON.parse(extractedJson);

        // Validate required fields
        if (typeof feedbackObject !== 'object' ||
            !feedbackObject.hasOwnProperty('isValid') ||
            !feedbackObject.hasOwnProperty('analysisResult')) {
            throw new Error("Invalid feedback object structure");
        }

        return feedbackObject;

    } catch (parseError) {
        // Nếu không thể parse hoặc validate, tạo object error với format chuẩn
        logger.warn({
            message: "Could not parse AI response as valid JSON feedback",
            event_type: "ai_response_parsing_failed",
            ai_response: aiResponse,
            extracted_json: extractedJson,
            error_message: getErrorMessage(parseError)
        });

        return {
            isValid: false,
            analysisResult: aiResponse, // Sử dụng text gốc làm analysis result
            errors: [
                {
                    type: "ai_generation_error",
                    description: aiResponse,
                    line: null
                }
            ],
            missingElements: [],
            recommendations: ["Vui lòng thử lại với biểu đồ UML khác hoặc kiểm tra lại cú pháp PlantUML."],
            correctedCode: null
        };
    }
};

const sendFeedBack = async (
    id: number,
    aiResponse: string,
    token: string
) => {
    if (!id) {
        throw new Error("ID key is required.");
    }

    try {
        const url = 'http://localhost:8086/feedback';

        // Parse AI response thành feedback object
        const feedbackObject = parseAiResponseToFeedback(aiResponse);

        const payload = {
            submissionsId: id,
            feedback: feedbackObject // Gửi object thay vì string
        };

        const feedbackResponse = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
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