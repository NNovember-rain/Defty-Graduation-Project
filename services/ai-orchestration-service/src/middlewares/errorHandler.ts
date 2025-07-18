import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../utils/httpErrors';

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
    const error = new HttpError(`Not Found - ${req.originalUrl}`, 404);
    next(error);
};

export const errorHandler = (err: HttpError, req: Request, res: Response, next: NextFunction) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    console.error(`Error ${statusCode}: ${message}`);
    if (process.env.NODE_ENV === 'development' && err.stack) {
        console.error(err.stack);
    }

    res.status(statusCode).json({
        success: false,
        message: message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};