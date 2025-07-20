// src/controllers/prompt.controller.ts

import { Request, Response, NextFunction } from 'express';
import * as promptService from '../services/prompt.service';

/**
 * @desc Create a new prompt
 * @route POST /api/v1/prompts
 * @access Private
 */
export const createPromptController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const newPrompt = await promptService.createPrompt(req.body);
        res.status(201).json({
            success: true,
            message: 'Prompt created successfully',
            data: newPrompt
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc Get a single prompt by ID
 * @route GET /api/v1/prompts/:id
 * @access Private
 */
export const getPromptByIdController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const prompt = await promptService.getPromptByIdSafe(id); // Use safe function to validate ID
        res.status(200).json({
            success: true,
            message: 'Prompt retrieved successfully',
            data: prompt
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc Get all prompts with pagination and optional filters
 * @route GET /api/v1/prompts
 * @access Private
 */
export const getPromptsController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const name = req.query.name as string;
        const umlType = req.query.umlType as 'use-case' | 'class'; // Get umlType from query
        const isActive = req.query.isActive ? req.query.isActive === 'true' : undefined; // Get isActive from query
        const sortBy = req.query.sortBy as string;
        const sortOrder = req.query.sortOrder as 'asc' | 'desc';

        const result = await promptService.getPrompts({ page, limit, name, umlType, isActive, sortBy, sortOrder });
        res.status(200).json({
            success: true,
            message: 'Prompts retrieved successfully',
            data: result.prompts,
            meta: {
                total: result.total,
                page: result.page,
                limit: result.limit,
                totalPages: Math.ceil(result.total / result.limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc Update an existing prompt by ID
 * @route PATCH /api/v1/prompts/:id
 * @access Private
 */
export const updatePromptController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const updatedPrompt = await promptService.updatePromptSafe(id, req.body);
        res.status(200).json({
            success: true,
            message: 'Prompt updated successfully',
            data: updatedPrompt
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc Delete a prompt by ID (soft delete)
 * @route DELETE /api/v1/prompts/:id
 * @access Private
 */
export const deletePromptController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const deletedPrompt = await promptService.deletePromptSafe(id);
        res.status(200).json({
            success: true,
            message: 'Prompt deleted successfully (soft delete)',
            data: deletedPrompt
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc Bulk delete multiple prompts by IDs (soft delete)
 * @route DELETE /api/v1/prompts/bulk
 * @access Private
 */
export const bulkDeletePromptsController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const ids = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or empty array of IDs provided.'
            });
        }
        await promptService.deletePromptsByIds(ids as string[]);
        res.status(200).json({
            success: true,
            message: `Successfully deleted ${ids.length} prompts.`,
            data: null
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc Toggle the active status of a prompt
 * @route PATCH /api/v1/prompts/:id/toggle-active
 * @access Private
 */
export const togglePromptActiveStatusController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        if (typeof isActive !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'isActive field must be a boolean.'
            });
        }

        const updatedPrompt = await promptService.togglePromptActiveStatus(id, isActive);
        res.status(200).json({
            success: true,
            message: `Prompt status updated to ${isActive}.`,
            data: updatedPrompt
        });
    } catch (error) {
        next(error);
    }
};