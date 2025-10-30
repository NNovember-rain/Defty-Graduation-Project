import { Request, Response } from 'express';
import * as umlService from '../services/uml-knowledge-base.service';
import { createUMLDocument } from '../models/qdrant/uml-knowledge-base.model';

export const createDocument = async (req: Request, res: Response) => {
    try {
        const umlDoc = createUMLDocument(req.body);
        await umlService.indexDocument(umlDoc);
        res.status(201).json({ success: true, data: umlDoc });
    } catch (error) {
        res.status(400).json({ success: false, error: (error as Error).message });
    }
};

export const updateDocument = async (req: Request, res: Response) => {
    try {
        const exists = await umlService.documentExists(req.params.id);
        if (!exists) {
            return res.status(404).json({
                success: false,
                error: 'Document not found'
            });
        }

        const umlDoc = createUMLDocument({
            ...req.body,
            id: req.params.id,
            updatedAt: new Date()
        });

        await umlService.updateDocument(umlDoc);
        res.json({ success: true, data: umlDoc });
    } catch (error) {
        const statusCode = (error as Error).message.includes('not found') ? 404 : 400;
        res.status(statusCode).json({
            success: false,
            error: (error as Error).message
        });
    }
};

export const deleteDocument = async (req: Request, res: Response) => {
    try {
        const exists = await umlService.documentExists(req.params.id);
        if (!exists) {
            return res.status(404).json({
                success: false,
                error: 'Document not found'
            });
        }

        await umlService.deleteDocument(req.params.id);
        res.json({ success: true, message: 'Document deleted' });
    } catch (error) {
        res.status(400).json({ success: false, error: (error as Error).message });
    }
};

export const searchDocuments = async (req: Request, res: Response) => {
    try {
        const { query, limit = 5, filters } = req.body;

        if (!query || typeof query !== 'string' || query.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Query is required and must be a non-empty string'
            });
        }

        const validatedLimit = Math.max(1, Math.min(Number(limit) || 5, 100));

        const results = await umlService.search(query.trim(), validatedLimit, filters);
        res.json({
            success: true,
            data: results,
            meta: {
                query: query.trim(),
                limit: validatedLimit,
                count: results.length
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: (error as Error).message
        });
    }
};

export const retrieveContext = async (req: Request, res: Response) => {
    try {
        const { query, topK = 3, filters } = req.body;

        if (!query || typeof query !== 'string' || query.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Query is required and must be a non-empty string'
            });
        }

        const validatedTopK = Math.max(1, Math.min(Number(topK) || 3, 20));

        const context = await umlService.retrieve(query.trim(), validatedTopK, filters);

        res.json({
            success: true,
            data: {
                context,
                query: query.trim(),
                sources: validatedTopK
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: (error as Error).message
        });
    }
};

export const getDocument = async (req: Request, res: Response) => {
    try {
        const exists = await umlService.documentExists(req.params.id);
        if (!exists) {
            return res.status(404).json({
                success: false,
                error: 'Document not found'
            });
        }

        const results = await umlService.search('', 100, {});
        const document = results.find(r => r.payload.documentId === req.params.id);

        if (!document) {
            return res.status(404).json({
                success: false,
                error: 'Document not found'
            });
        }

        res.json({ success: true, data: document.payload });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: (error as Error).message
        });
    }
};