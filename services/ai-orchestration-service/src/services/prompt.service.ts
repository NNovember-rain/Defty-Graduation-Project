import Prompt, { IPrompt } from '../models/prompt.model';
import { HttpError } from '../utils/httpErrors';
import { FilterQuery, SortOrder } from 'mongoose';

interface GetPromptsOptions {
    page?: number;
    limit?: number;
    name?: string;
    umlType?: 'use-case' | 'class';
    isActive?: boolean;
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
        const promptData = { ...data, version: '1.0' };
        const prompt = new Prompt(promptData);
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
    const { page = 1, limit = 10, name, umlType, isActive, sortBy, sortOrder } = options;
    const skip = (page - 1) * limit;

    const query: FilterQuery<IPrompt> = {
        isDeleted: false
    };
    if (name) {
        query.name = new RegExp(name, 'i');
    }
    if (umlType) {
        query.umlType = umlType;
    }
    if (isActive !== undefined) {
        query.isActive = isActive;
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
        // Find the existing prompt to compare values
        const existingPrompt = await Prompt.findById(id);
        if (!existingPrompt) {
            throw new HttpError('Prompt not found for update', 404);
        }

        const updateData: Partial<IPrompt> = { ...data };

        // Prevent manual version updates
        delete updateData.version;

        // Check if templateString or umlType has changed to increment version
        let shouldIncrementVersion = false;
        if (updateData.templateString && updateData.templateString !== existingPrompt.templateString) {
            shouldIncrementVersion = true;
        }
        if (updateData.umlType && updateData.umlType !== existingPrompt.umlType) {
            shouldIncrementVersion = true;
        }

        if (shouldIncrementVersion) {
            updateData.version = incrementVersion(existingPrompt.version || '0.0');
        }

        // Perform the update
        const updatedPrompt = await Prompt.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true
        });

        if (!updatedPrompt) {
            // This case should be rare since we already found the prompt, but good practice to check
            throw new HttpError('Prompt not found for update', 404);
        }

        return updatedPrompt;
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

export const togglePromptActiveStatus = async (id: string, isActive: boolean): Promise<IPrompt> => {
    if (!isValidObjectId(id)) {
        throw new HttpError('Invalid prompt ID format', 400);
    }

    try {
        // Find the prompt to update to get its umlType
        const promptToUpdate = await Prompt.findById(id);
        if (!promptToUpdate) {
            throw new HttpError('Prompt not found', 404);
        }

        if (isActive) {
            // Deactivate all other prompts with the same umlType
            await Prompt.updateMany(
                { umlType: promptToUpdate.umlType, _id: { $ne: id } },
                { isActive: false }
            );
        }

        // Update the requested prompt
        const updatedPrompt = await Prompt.findByIdAndUpdate(
            id,
            { isActive: isActive },
            { new: true }
        );

        if (!updatedPrompt) {
            throw new HttpError('Failed to update prompt status', 500);
        }

        return updatedPrompt;
    } catch (error: any) {
        if (error instanceof HttpError) {
            throw error;
        }
        throw new HttpError(`Failed to update prompt status: ${error.message}`, 500);
    }
};

// Utility function to validate ObjectId
export const isValidObjectId = (id: string): boolean => {
    return /^[0-9a-fA-F]{24}$/.test(id);
};

// Enhanced version with validation
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

// Function to increment the version number in major.minor format
const incrementVersion = (currentVersion: string): string => {
    const parts = currentVersion.split('.').map(Number);
    let major = parts[0] || 0;
    let minor = parts[1] || 0;

    if (minor < 9) {
        minor += 1;
    } else {
        major += 1;
        minor = 0;
    }
    return `${major}.${minor}`;
};