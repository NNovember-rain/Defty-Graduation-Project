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
        const prompt = await promptService.getPromptByIdSafe(id); // Sử dụng hàm safe để validate ID
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
 * @desc Get all prompts with pagination and optional name filter
 * @route GET /api/v1/prompts
 * @access Private
 */
export const getPromptsController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const name = req.query.name as string;

        const result = await promptService.getPrompts({ page, limit, name });
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
 * @desc Delete a prompt by ID
 * @route DELETE /api/v1/prompts/:id
 * @access Private
 */
export const deletePromptController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const deletedPrompt = await promptService.deletePromptSafe(id);
        res.status(200).json({
            success: true,
            message: 'Prompt deleted successfully',
            data: deletedPrompt
        });
    } catch (error) {
        next(error);
    }
};