import { Router } from 'express';
import {
    createPromptController,
    getPromptByIdController,
    getPromptsController,
    updatePromptController,
    deletePromptController,
    bulkDeletePromptsController,
    togglePromptActiveStatusController // Import the new controller
} from '../controllers/prompt.controller';

const router = Router();

router.post('/', createPromptController);

router.get('/', getPromptsController);

router.get('/:id', getPromptByIdController);

router.patch('/:id', updatePromptController);

// NEW: Route to toggle active status
router.patch('/:id/toggle-active', togglePromptActiveStatusController);

router.delete('/bulk', bulkDeletePromptsController);

router.delete('/:id', deletePromptController);

export default router;