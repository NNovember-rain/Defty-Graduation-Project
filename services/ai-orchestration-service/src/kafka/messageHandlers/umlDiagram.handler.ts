import { getPrompts } from "../../services/prompt.service";
import { IPrompt } from "../../models/prompt.model";
import generateAIContent from "../../client/googleAiApi"; // Your updated service
import logger from "../../config/logger";
import { getErrorMessage, getErrorStack } from "../../utils/errorHandler";
import sendFeedBack from "../../client/feedbackServiceApi";
import {checkToken} from "../../middlewares/auth.middleware";

export interface UmlDiagramMessage {
    id: number;
    typeUmlName: string;
    contentAssignment: string;
    solutionPlantUmlCode: string;
    studentPlantUmlCode: string;
    acessToken: string; // FIXME
}

const fillTemplate = (template: string, data: any): string => {
    let filledTemplate = template;
    for (const key in data) {
        const placeholder = `{{${key}}}`;
        const regex = new RegExp(placeholder, 'g');
        filledTemplate = filledTemplate.replace(regex, data[key]);
    }
    return filledTemplate;
};

export const handleUseCaseDiagram = async (message: UmlDiagramMessage) => {
    try {
        logger.info({
            message: 'Bắt đầu xử lý yêu cầu sơ đồ Use-Case.',
            event_type: 'request_start',
            input: message,
        });

        console.log("check token");
        checkToken(message.acessToken); // FIXME

        const useCasePromptResult = await getPrompts({
            umlType: "use-case",
            isActive: true
        });

        if (useCasePromptResult.prompts.length === 0) {
            logger.warn({
                message: "Không tìm thấy prompt 'use-case' đang hoạt động.",
                event_type: 'prompt_not_found',
                umlType: 'use-case'
            });
            // Consider sending feedback to the user about missing prompts.
            return;
        }

        const useCasePrompt: IPrompt = useCasePromptResult.prompts[0];
        const finalPromptString = fillTemplate(useCasePrompt.templateString, {
            plantumlCode: message.studentPlantUmlCode,
            samplePlantumlCode: message.solutionPlantUmlCode
        });

        const aiModel = 'gemini-2.5-flash';
        // IMPORTANT: Fetch API key securely, e.g., from environment variables
        const apiKey = process.env.GOOGLE_AI_API_KEY || "YOUR_DEFAULT_API_KEY_IF_NEEDED";

        // Call the updated generateAIContent service
        const aiGeneratedText = await generateAIContent(finalPromptString, apiKey, aiModel);

        console.log(aiGeneratedText);

        if (aiGeneratedText === undefined || aiGeneratedText.trim() === '') {
            logger.warn({
                message: 'AI API returned no content for Use-Case diagram.',
                event_type: 'ai_no_content',
                input: message,
                ai_model: aiModel,
                prompt: finalPromptString
            });
            // Handle cases where AI doesn't return any text (e.g., send empty feedback or an error message).
            await sendFeedBack(message.id, "AI could not generate content for this diagram.", message.acessToken);
            return;
        }

        // Log the successful AI content generation
        logger.info({
            message: 'Tạo nội dung AI thành công.',
            event_type: 'ai_content_generated',
            task: 'create_use_case_diagram',
            ai_model: aiModel,
            prompt: {
                name: useCasePrompt.name,
                version: useCasePrompt.version,
                final_string: finalPromptString
            },
            input: message,
            ai_response: aiGeneratedText, // Directly log the generated text
        });

        // Send feedback to your internal service
        await sendFeedBack(message.id, aiGeneratedText, message.acessToken);
        logger.info({
            message: `Feedback for Use-Case diagram ID ${message.id} sent successfully.`,
            event_type: 'feedback_sent_success',
            submissionId: message.id
        });

    } catch (error: unknown) {
        logger.error({
            message: 'Lỗi khi xử lý sơ đồ Use-Case.',
            event_type: 'process_error',
            error_message: getErrorMessage(error),
            stack: getErrorStack(error),
            input: message,
        });
        // If an error occurs during AI generation, send a failure feedback
        await sendFeedBack(message.id, "AI generation failed for this diagram.", message.acessToken);
    }
};

export const handleClassDiagram = async (message: UmlDiagramMessage) => {
    try {
        logger.info({
            message: 'Bắt đầu xử lý yêu cầu sơ đồ Class.',
            event_type: 'request_start',
            input: message,
        });

        console.log("check token");
        checkToken(message.acessToken);

        const classPromptResult = await getPrompts({
            umlType: "class",
            isActive: true
        });

        if (classPromptResult.prompts.length === 0) {
            logger.warn({
                message: "Không tìm thấy prompt 'class' đang hoạt động.",
                event_type: 'prompt_not_found',
                umlType: 'class'
            });
            // Consider sending feedback to the user about missing prompts.
            return;
        }

        const classPrompt: IPrompt = classPromptResult.prompts[0];
        const finalPromptString = fillTemplate(classPrompt.templateString, {
            plantumlCode: message.studentPlantUmlCode,
            samplePlantumlCode: message.solutionPlantUmlCode
        });

        const aiModel = 'gemini-2.5-flash';
        // IMPORTANT: Fetch API key securely, e.g., from environment variables
        const apiKey = process.env.GOOGLE_AI_API_KEY || "YOUR_DEFAULT_API_KEY_IF_NEEDED";

        // Call the updated generateAIContent service
        const aiGeneratedText = await generateAIContent(finalPromptString, apiKey, aiModel);

        if (aiGeneratedText === undefined || aiGeneratedText.trim() === '') {
            logger.warn({
                message: 'AI API returned no content for Class diagram.',
                event_type: 'ai_no_content',
                input: message,
                ai_model: aiModel,
                prompt: finalPromptString
            });
            // Handle cases where AI doesn't return any text.
            await sendFeedBack(message.id, "AI could not generate content for this diagram.", message.acessToken);
            return;
        }

        logger.info({
            message: 'Tạo nội dung AI thành công.',
            event_type: 'ai_content_generated',
            task: 'create_class_diagram',
            ai_model: aiModel,
            prompt: {
                name: classPrompt.name,
                version: classPrompt.version,
                final_string: finalPromptString
            },
            input: message,
            ai_response: aiGeneratedText, // Directly log the generated text
        });

        // Send feedback to your internal service
        await sendFeedBack(message.id, aiGeneratedText, message.acessToken);
        logger.info({
            message: `Feedback for Class diagram ID ${message.id} sent successfully.`,
            event_type: 'feedback_sent_success',
            submissionId: message.id
        });

    } catch (error: unknown) {
        logger.error({
            message: 'Lỗi khi xử lý sơ đồ Class.',
            event_type: 'process_error',
            error_message: getErrorMessage(error),
            stack: getErrorStack(error),
            input: message,
        });
        // If an error occurs during AI generation, send a failure feedback
        await sendFeedBack(message.id, "AI generation failed for this diagram.", message.acessToken);
    }
};