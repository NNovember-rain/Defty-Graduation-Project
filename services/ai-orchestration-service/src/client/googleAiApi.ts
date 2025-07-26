import { GoogleGenAI } from "@google/genai";
import logger from "../config/logger";
import { getErrorMessage, getErrorStack } from "../utils/errorHandler"; // Thêm dòng này

const generateAIContent = async (
    prompt_content: string,
    apiKey: string,
    model: string = "gemini-2.5-flash"
): Promise<string | undefined> => {
    if (!apiKey) {
        throw new Error("API key is required.");
    }

    try {
        const ai = new GoogleGenAI({ apiKey: apiKey });
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt_content
        });
        return response.text;
    } catch (error: unknown) {
        logger.error({
            message: "Lỗi khi gọi API Google GenAI.",
            event_type: "api_call_failed",
            error_message: getErrorMessage(error),
            stack: getErrorStack(error),
            ai_model: model,
            prompt_content: prompt_content.substring(0, 200) + '...'
        });
        throw new Error("Failed to generate AI content. Please check the API key and input.");
    }
};

export default generateAIContent;