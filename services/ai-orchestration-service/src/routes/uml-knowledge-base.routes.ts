import { Router } from 'express';
import {
    createDocument,
    updateDocument,
    deleteDocument,
    searchDocuments,
    retrieveContext, getDocument
} from '../controllers/uml-knowledge-base.controller';

const router = Router();

router.post('/documents', createDocument);
router.get('/documents/:id', getDocument);
router.put('/documents/:id', updateDocument);
router.delete('/documents/:id', deleteDocument);
router.post('/search', searchDocuments);
router.post('/retrieve', retrieveContext);

export default router;