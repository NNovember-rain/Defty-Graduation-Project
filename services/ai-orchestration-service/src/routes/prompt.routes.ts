import { Router } from 'express';
import {
    createPromptController,
    getPromptByIdController,
    getPromptsController,
    updatePromptController,
    deletePromptController,
    bulkDeletePromptsController
} from '../controllers/prompt.controller';

const router = Router();

router.post('/', createPromptController);

router.get('/', getPromptsController);

router.get('/:id', getPromptByIdController);

router.patch('/:id', updatePromptController);

router.delete('/bulk', bulkDeletePromptsController);

router.delete('/:id', deletePromptController);

export default router;