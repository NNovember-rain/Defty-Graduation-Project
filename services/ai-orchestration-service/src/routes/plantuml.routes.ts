import { Router } from 'express';
import {
    addDocuments,
    searchContext,
    findSimilar,
    getDocument,
    deleteDocument,
    deleteDocumentsBySource,
    getStats,
    healthCheck,
    buildRAGPrompt
} from '../controllers/plantuml.controller';

const router = Router();

router.post('/documents', addDocuments);
router.post('/search', searchContext);
router.post('/similar', findSimilar);
router.get('/documents/:id', getDocument);
router.delete('/documents/:id', deleteDocument);
router.delete('/documents/source/:source', deleteDocumentsBySource);
router.get('/stats', getStats);
router.post('/prompt', buildRAGPrompt);
router.get('/health', healthCheck);

export default router;