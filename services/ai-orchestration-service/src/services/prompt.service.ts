import Prompt, { IPrompt } from '../models/prompt.model';
import { HttpError } from '../utils/httpErrors';
import {FilterQuery, SortOrder} from 'mongoose';

interface GetPromptsOptions {
    page?: number;
    limit?: number;
    name?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

interface GetPromptsResult {
    prompts: IPrompt[];
    total: number;
    page: number;
    limit: number;
}

export const createPrompt = async (data: IPrompt): Promise<IPrompt> => {
    try {
        const prompt = new Prompt(data);
        await prompt.save();
        return prompt;
    } catch (error: any) {
        if (error.code === 11000) {
            throw new HttpError(`Prompt with name '${data.name}' already exists.`, 409);
        }
        throw new HttpError(`Failed to create prompt: ${error.message}`, 500);
    }
};

export const getPromptById = async (id: string): Promise<IPrompt> => {
    try {
        const prompt = await Prompt.findOne({ _id: id, isDeleted: false });
        if (!prompt) {
            throw new HttpError('Prompt not found', 404);
        }
        return prompt;
    } catch (error: any) {
        if (error instanceof HttpError) {
            throw error;
        }
        throw new HttpError(`Failed to retrieve prompt: ${error.message}`, 500);
    }
};

export const getPrompts = async (options: GetPromptsOptions = {}): Promise<GetPromptsResult> => {
    const { page = 1, limit = 10, name, sortBy, sortOrder } = options;
    const skip = (page - 1) * limit;

    const query: FilterQuery<IPrompt> = {
        isDeleted: false
    };
    if (name) {
        query.name = new RegExp(name, 'i');
    }

    const sort: { [key: string]: SortOrder } = {};
    if (sortBy) {
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    }

    try {
        const [prompts, total] = await Promise.all([
            Prompt.find(query).sort(sort).skip(skip).limit(limit),
            Prompt.countDocuments(query)
        ]);

        return {
            prompts,
            total,
            page,
            limit
        };
    } catch (error: any) {
        throw new HttpError(`Failed to retrieve prompts: ${error.message}`, 500);
    }
};

export const updatePrompt = async (id: string, data: Partial<IPrompt>): Promise<IPrompt> => {
    try {
        const prompt = await Prompt.findByIdAndUpdate(id, data, {
            new: true,
            runValidators: true
        });

        if (!prompt) {
            throw new HttpError('Prompt not found for update', 404);
        }

        return prompt;
    } catch (error: any) {
        if (error instanceof HttpError) {
            throw error;
        }
        if (error.code === 11000) {
            throw new HttpError(`Prompt with name '${data.name}' already exists.`, 409);
        }
        throw new HttpError(`Failed to update prompt: ${error.message}`, 500);
    }
};

export const deletePrompt = async (id: string): Promise<IPrompt> => {
    try {
        const prompt = await Prompt.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
        if (!prompt) {
            throw new HttpError('Prompt not found for deletion', 404);
        }
        return prompt;
    } catch (error: any) {
        if (error instanceof HttpError) {
            throw error;
        }
        throw new HttpError(`Failed to delete prompt: ${error.message}`, 500);
    }
};

export const deletePromptsByIds = async (ids: string[]): Promise<void> => {
    try {
        await Prompt.updateMany(
            { _id: { $in: ids } },
            { $set: { isDeleted: true } }
        );
    } catch (error: any) {
        throw new HttpError(`Failed to bulk delete prompts: ${error.message}`, 500);
    }
};

// Utility function để validate ObjectId
export const isValidObjectId = (id: string): boolean => {
    return /^[0-9a-fA-F]{24}$/.test(id);
};

// Enhanced version với validation
export const getPromptByIdSafe = async (id: string): Promise<IPrompt> => {
    if (!isValidObjectId(id)) {
        throw new HttpError('Invalid prompt ID format', 400);
    }

    return getPromptById(id);
};

export const updatePromptSafe = async (id: string, data: Partial<IPrompt>): Promise<IPrompt> => {
    if (!isValidObjectId(id)) {
        throw new HttpError('Invalid prompt ID format', 400);
    }

    return updatePrompt(id, data);
};

export const deletePromptSafe = async (id: string): Promise<IPrompt> => {
    if (!isValidObjectId(id)) {
        throw new HttpError('Invalid prompt ID format', 400);
    }

    return deletePrompt(id);
};