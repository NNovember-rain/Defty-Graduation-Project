import express, { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes';
import { notFoundHandler, errorHandler } from './middlewares/errorHandler';

const API_PREFIX = process.env.API_PREFIX || 'ai-orchestration';

const app: Application = express();

app.use(helmet());
app.use(morgan('dev'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(API_PREFIX, routes);

app.get('/', (req: Request, res: Response) => {
    res.status(200).send('AI Orchestration Service is running!');
});

app.use(notFoundHandler);

app.use(errorHandler);

export default app;