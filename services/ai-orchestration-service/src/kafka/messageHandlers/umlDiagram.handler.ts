import { getPrompts } from "../../services/prompt.service";
import { IPrompt } from "../../models/prompt.model";
import generateAIContent from "../../client/googleAiApi";
import logger from "../../config/logger";
import {getErrorMessage, getErrorStack} from "../../utils/errorHandler"; // Import logger

interface UmlDiagramMessage {
    umlType: string;
    plantumlCode: string;
    samplePlantumlCode: string;
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
        // Log sự kiện bắt đầu xử lý với dữ liệu đầu vào
        logger.info({
            message: 'Bắt đầu xử lý yêu cầu sơ đồ Use-Case.',
            event_type: 'request_start',
            input: message,
        });

        const useCasePromptResult = await getPrompts({
            umlType: "use-case",
            isActive: true
        });

        if (useCasePromptResult.prompts.length === 0) {
            // Log cảnh báo khi không tìm thấy prompt
            logger.warn({
                message: "Không tìm thấy prompt 'use-case' đang hoạt động.",
                event_type: 'prompt_not_found',
                umlType: 'use-case'
            });
            return;
        }

        const useCasePrompt: IPrompt = useCasePromptResult.prompts[0];
        const finalPromptString = fillTemplate(useCasePrompt.templateString, {
            plantumlCode: message.plantumlCode,
            samplePlantumlCode: message.samplePlantumlCode
        });

        const aiModel = 'gemini-2.5-flash';
        const response = await generateAIContent(finalPromptString, "apikey", aiModel);

        // Log sự kiện thành công với đầy đủ thông tin cần thiết
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
            ai_response: response,
        });
    } catch (error: unknown) {
        logger.error({
            message: 'Lỗi khi xử lý sơ đồ Use-Case.',
            event_type: 'process_error',
            error_message: getErrorMessage(error),
            stack: getErrorStack(error),
            input: message,
        });
    }
};

// Logic tương tự cho hàm handleClassDiagram
export const handleClassDiagram = async (message: UmlDiagramMessage) => {
    try {
        logger.info({
            message: 'Bắt đầu xử lý yêu cầu sơ đồ Class.',
            event_type: 'request_start',
            input: message,
        });

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
            return;
        }

        const classPrompt: IPrompt = classPromptResult.prompts[0];
        const finalPromptString = fillTemplate(classPrompt.templateString, {
            plantumlCode: message.plantumlCode,
            samplePlantumlCode: message.samplePlantumlCode
        });

        const aiModel = 'gemini-2.5-flash';
        const response = await generateAIContent(finalPromptString, "apikey", aiModel);

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
            ai_response: response,
        });
    } catch (error: unknown) {
        logger.error({
            message: 'Lỗi khi xử lý sơ đồ Class.',
            event_type: 'process_error',
            error_message: getErrorMessage(error),
            stack: getErrorStack(error),
            input: message,
        });
    }
};