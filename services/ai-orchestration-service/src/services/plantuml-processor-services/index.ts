import {UmlInput} from "../../types/uml.types";
import {processUseCaseUmlWithAI} from "./use-case";
import logger from "../../config/logger";
import {getErrorMessage} from "../../utils/errorHandler";

export class AIValidationError extends Error {
    public readonly errorMessage: string;
    constructor(errorMessage: string) {
        super(errorMessage);
        this.name = 'AIValidationError';
        this.errorMessage = errorMessage;
    }
}

export class UmlProcessingError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'UmlProcessingError';
    }
}

export const parseStructuredError = (errorText: string): {
    error: string;
    reason?: string;
    details?: string;
} => {
    const lines = errorText.trim().split('\n').map(l => l.trim()).filter(l => l);

    let error = '';
    let reason = '';
    let details = '';

    for (const line of lines) {
        if (line.startsWith('ERROR:')) {
            error = line.substring(6).trim();
        } else if (line.startsWith('Reason:')) {
            reason = line.substring(7).trim();
        } else if (line.startsWith('Details:')) {
            details = line.substring(8).trim();
        }
    }

    // If no structure found, treat whole text as error
    if (!error) {
        error = errorText;
    }

    const result: any = { error };
    if (reason) result.reason = reason;
    if (details) result.details = details;

    return result;
};

export const parseJsonResponse = <T>(response: string, umlId: number, step: string): T => {
    logger.info({
        message: 'Starting JSON parse',
        event_type: 'json_parse_start',
        step,
        umlId,
        responseLength: response.length
    });

    if (response.trim().startsWith('ERROR:')) {
        throw new AIValidationError(response.trim());
    }

    let cleaned = response.trim();
    if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }

    try {
        const parsed = JSON.parse(cleaned.trim());
        logger.info({
            message: 'JSON parsed successfully',
            event_type: 'json_parse_success',
            step,
            umlId
        });
        return parsed;
    } catch (error) {
        logger.error({
            message: 'Failed to parse JSON',
            event_type: 'json_parse_error',
            step,
            umlId,
            error_message: getErrorMessage(error)
        });
        throw new Error(`JSON parse failed: ${getErrorMessage(error)}`);
    }
};

export const processUmlWithAI = async (
    input: UmlInput
): Promise<void> => {
    switch (input.typeUmlName) {
        case "use-case":
            await processUseCaseUmlWithAI(input);
            break;

        default:
            break;
    }
}