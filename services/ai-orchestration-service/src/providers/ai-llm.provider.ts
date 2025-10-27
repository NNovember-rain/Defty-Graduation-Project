import axios from 'axios';
import logger from "../config/logger";
import path from "path";
import fsSync from "fs";

// Provider types
type AIProvider = 'gemini' | 'openai' | 'claude' | 'azure-openai';

interface Provider {
    endpoint: string,
    model?: string,
    maxTokens: number,
    supportsTopK: boolean,
    headerKey: string
}

// Environment Variables
const AI_PROVIDER = (process.env.AI_PROVIDER || 'gemini') as AIProvider;
const AI_API_KEY = process.env.AI_API_KEY;
const AI_API_ENDPOINT = process.env.AI_API_ENDPOINT;
const MAX_OUTPUT_TOKENS = parseInt(process.env.AI_MAX_OUTPUT_TOKENS || '100000');
const AI_TEMPERATURE = parseFloat(process.env.AI_TEMPERATURE || '0.1');
const AI_TOP_P = parseFloat(process.env.AI_TOP_P || '0.95');
const AI_TOP_K = parseInt(process.env.AI_TOP_K || '40');
const API_TIMEOUT = parseInt(process.env.AI_API_TIMEOUT || '600000');
const MAX_RETRIES = parseInt(process.env.AI_MAX_RETRIES || '3');
const AI_RESPONSE_LOG_DIR = process.env.AI_RESPONSE_LOG_DIR || 'logs/ai_responses';

// Provider-specific configurations
const PROVIDER_CONFIGS = {
    gemini: {
        endpoint: AI_API_ENDPOINT || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent',
        maxTokens: 1000000, // Gemini 2.0 supports up to 1M output tokens
        supportsTopK: true,
        headerKey: 'x-goog-api-key'
    },
    openai: {
        endpoint: AI_API_ENDPOINT || 'https://api.openai.com/v1/chat/completions',
        model: process.env.AI_MODEL || 'gpt-4o', // gpt-4o, gpt-4-turbo, gpt-3.5-turbo
        maxTokens: 16384, // GPT-4 Turbo max output
        supportsTopK: false,
        headerKey: 'Authorization'
    },
    claude: {
        endpoint: AI_API_ENDPOINT || 'https://api.anthropic.com/v1/messages',
        model: process.env.AI_MODEL || 'claude-3-5-sonnet-20241022', // claude-3-opus, claude-3-sonnet
        maxTokens: 8192, // Claude 3.5 max output (can request up to 200K with special access)
        supportsTopK: true,
        headerKey: 'x-api-key'
    },
    'azure-openai': {
        endpoint: AI_API_ENDPOINT || 'https://YOUR-RESOURCE.openai.azure.com/openai/deployments/YOUR-DEPLOYMENT/chat/completions?api-version=2024-02-15-preview',
        maxTokens: 16384,
        supportsTopK: false,
        headerKey: 'api-key'
    }
};

// ============================================================================
// BUILD REQUEST BODY
// ============================================================================

const buildRequestBody = (promptContent: string, provider: AIProvider) => {
    const config: Provider = PROVIDER_CONFIGS[provider];
    const effectiveMaxTokens = Math.min(MAX_OUTPUT_TOKENS, config.maxTokens);

    switch (provider) {
        case 'gemini':
            return {
                contents: [{
                    parts: [{ text: promptContent }]
                }],
                generationConfig: {
                    maxOutputTokens: effectiveMaxTokens,
                    temperature: AI_TEMPERATURE,
                    topP: AI_TOP_P,
                    topK: AI_TOP_K
                }
            };

        case 'openai':
        case 'azure-openai':
            return {
                model: config.model,
                messages: [
                    {
                        role: 'user',
                        content: promptContent
                    }
                ],
                max_tokens: effectiveMaxTokens,
                temperature: AI_TEMPERATURE,
                top_p: AI_TOP_P
                // Note: OpenAI doesn't support top_k
            };

        case 'claude':
            return {
                model: config.model,
                max_tokens: effectiveMaxTokens,
                temperature: AI_TEMPERATURE,
                top_p: AI_TOP_P,
                top_k: config.supportsTopK ? AI_TOP_K : undefined,
                messages: [
                    {
                        role: 'user',
                        content: promptContent
                    }
                ]
            };

        default:
            throw new Error(`Unsupported AI provider: ${provider}`);
    }
};

// ============================================================================
// BUILD REQUEST HEADERS
// ============================================================================

const buildRequestHeaders = (provider: AIProvider) => {
    const config = PROVIDER_CONFIGS[provider];

    if (!AI_API_KEY) {
        throw new Error('AI_API_KEY not configured');
    }

    const headers: Record<string, string> = {
        'Content-Type': 'application/json'
    };

    switch (provider) {
        case 'gemini':
            headers[config.headerKey] = AI_API_KEY;
            break;

        case 'openai':
        case 'azure-openai':
            headers[config.headerKey] = provider === 'openai'
                ? `Bearer ${AI_API_KEY}`
                : AI_API_KEY;
            break;

        case 'claude':
            headers[config.headerKey] = AI_API_KEY;
            headers['anthropic-version'] = '2023-06-01';
            break;
    }

    return headers;
};

// ============================================================================
// EXTRACT TEXT FROM RESPONSE
// ============================================================================

const extractTextFromResponse = (response: any, provider: AIProvider): string => {
    let text: string | null = null;
    let finishReason: string | undefined;

    switch (provider) {
        case 'gemini':
            text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
            finishReason = response.data?.candidates?.[0]?.finishReason;
            break;

        case 'openai':
        case 'azure-openai':
            text = response.data?.choices?.[0]?.message?.content;
            finishReason = response.data?.choices?.[0]?.finish_reason;
            break;

        case 'claude':
            text = response.data?.content?.[0]?.text;
            finishReason = response.data?.stop_reason;
            break;
    }

    if (!text) {
        throw new Error(`AI response is empty. Provider: ${provider}`);
    }

    // Check for truncation
    const isTruncated =
        finishReason === 'MAX_TOKENS' || // Gemini
        finishReason === 'length' ||     // OpenAI
        finishReason === 'max_tokens';   // Claude

    if (isTruncated) {
        throw new Error(`Response truncated at ${MAX_OUTPUT_TOKENS} tokens`);
    }

    return text;
};

const saveResponseToFile = (text: string, umlId: number, step: string): void => {
    try {
        const logDir = path.join(process.cwd(), AI_RESPONSE_LOG_DIR);
        if (!fsSync.existsSync(logDir)) {
            fsSync.mkdirSync(logDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `response-${step}-${umlId}-${timestamp}.log`;
        const filePath = path.join(logDir, filename);

        fsSync.writeFileSync(filePath, text, 'utf-8');

        logger.info({
            message: 'AI response saved to file',
            event_type: 'ai_response_saved',
            step,
            filePath,
            responseLength: text.length
        });
    } catch (error: any) {
        logger.error({
            message: 'Failed to save AI response',
            event_type: 'ai_response_save_error',
            step,
            error_message: error.message
        });
    }
};

// ============================================================================
// UNIFIED AI API CALL
// ============================================================================

export const callAIApi = async (
    promptContent: string,
    umlId: number,
    step: string
): Promise<string> => {
    const provider = AI_PROVIDER;
    const config = PROVIDER_CONFIGS[provider];

    if (!AI_API_KEY) {
        throw new Error('AI_API_KEY not configured');
    }

    let lastError: Error | null = null;
    const RETRY_DELAYS = [2000, 5000, 10000];

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            logger.info({
                message: `Calling AI API (attempt ${attempt}/${MAX_RETRIES})`,
                event_type: 'ai_api_call_start',
                provider,
                step,
                attempt,
                umlId,
                promptLength: promptContent.length,
                endpoint: config.endpoint
            });

            const startTime = Date.now();

            const response = await axios.post(
                config.endpoint,
                buildRequestBody(promptContent, provider),
                {
                    headers: buildRequestHeaders(provider),
                    timeout: API_TIMEOUT
                }
            );

            const duration = Date.now() - startTime;
            const text = extractTextFromResponse(response, provider);

            logger.info({
                message: 'AI API call successful',
                event_type: 'ai_api_call_success',
                provider,
                step,
                umlId,
                durationMs: duration,
                responseLength: text.length
            });

            // Save response to file
            saveResponseToFile(text, umlId, step);

            return text;

        } catch (error: any) {
            lastError = error;

            const isTimeout = error.code === 'ECONNABORTED' || error.message?.includes('timeout');
            const isRateLimit = error.response?.status === 429;
            const statusCode = error.response?.status;

            logger.warn({
                message: `AI API call failed (attempt ${attempt}/${MAX_RETRIES})`,
                event_type: 'ai_api_call_failed',
                provider,
                step,
                umlId,
                attempt,
                error_message: error.message,
                status_code: statusCode,
                isTimeout,
                isRateLimit,
                willRetry: attempt < MAX_RETRIES
            });

            // Log error details
            if (error.response?.data) {
                logger.error({
                    message: 'AI API error response',
                    event_type: 'ai_api_error_response',
                    provider,
                    step,
                    umlId,
                    statusCode,
                    errorData: JSON.stringify(error.response.data).substring(0, 500)
                });
            }

            // Retry logic
            if (attempt < MAX_RETRIES) {
                const delay = RETRY_DELAYS[attempt - 1];
                logger.info({
                    message: `Waiting before retry`,
                    event_type: 'ai_api_retry_wait',
                    umlId,
                    delayMs: delay,
                    nextAttempt: attempt + 1
                });
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    logger.error({
        message: 'AI API failed after all retries',
        event_type: 'ai_api_call_exhausted',
        provider,
        step,
        umlId,
        totalAttempts: MAX_RETRIES,
        finalError: lastError?.message
    });

    throw new Error(`AI API (${provider}) failed after ${MAX_RETRIES} attempts: ${lastError?.message}`);
};