import { Request, Response } from 'express';
import * as umlService from '../services/uml-knowledge-base.service';
import { createUMLDocument } from '../models/bge-m3/uml-knowledge-base.model';

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
        const umlDoc = createUMLDocument({ ...req.body, id: req.params.id });
        await umlService.updateDocument(umlDoc);
        res.json({ success: true, data: umlDoc });
    } catch (error) {
        res.status(400).json({ success: false, error: (error as Error).message });
    }
};

export const deleteDocument = async (req: Request, res: Response) => {
    try {
        await umlService.deleteDocument(req.params.id);
        res.json({ success: true, message: 'Document deleted' });
    } catch (error) {
        res.status(400).json({ success: false, error: (error as Error).message });
    }
};

export const searchDocuments = async (req: Request, res: Response) => {
    try {
        const { query, limit = 5, filters } = req.body;

        if (!query) {
            return res.status(400).json({ success: false, error: 'Query is required' });
        }

        const results = await umlService.search(query, limit, filters);
        res.json({ success: true, data: results });
    } catch (error) {
        res.status(400).json({ success: false, error: (error as Error).message });
    }
};

export const retrieveContext = async (req: Request, res: Response) => {
    try {
        const { query, topK = 3, filters } = req.body;

        if (!query) {
            return res.status(400).json({ success: false, error: 'Query is required' });
        }

        const context = await umlService.retrieve(query, topK, filters);
        res.json({ success: true, data: { context } });
    } catch (error) {
        res.status(400).json({ success: false, error: (error as Error).message });
    }
};