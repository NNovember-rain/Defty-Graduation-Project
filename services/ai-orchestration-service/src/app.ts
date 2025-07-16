import express, { Application, Request, Response, NextFunction } from 'express';
import routes from './routes';
import { notFoundHandler, errorHandler } from './middlewares/errorHandler';

const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`Request received: ${req.method} ${req.url} at ${new Date().toISOString()}`);
    next();
});

app.use('/api/v1', routes);

app.get('/', (req: Request, res: Response) => {
    res.status(200).send('AI Orchestration Service is running!');
});

app.use(notFoundHandler);

app.use(errorHandler);

export default app;