import express, { Application, Request, Response, NextFunction } from 'express';
import routes from './routes';
import { notFoundHandler, errorHandler } from './middlewares/errorHandler';

const API_PREFIX = process.env.API_PREFIX || 'ai-orchestration';

const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`Request received: ${req.method} ${req.url} at ${new Date().toISOString()}`);
    next();
});

app.use(API_PREFIX, routes);

app.get('/', (req: Request, res: Response) => {
    res.status(200).send('AI Orchestration Service is running!');
});

app.use(notFoundHandler);

app.use(errorHandler);

export default app;