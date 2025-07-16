import app from './app';
import dotenv from 'dotenv';
import connectDB from './config/db';
import runKafkaConsumer from './kafka/consumer';

dotenv.config();
(async () => {
    try {
        await connectDB();
        await runKafkaConsumer();

        const PORT = process.env.PORT || 3000;

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
            console.log(`Access it at http://localhost:${PORT}`);
        });

    } catch (error: any) {
        console.error('Failed to start application:', error.message);
        process.exit(1);
    }
})();


process.on('uncaughtException', (err: Error) => {
    console.error('UNCAUGHT EXCEPTION! Shutting down...', err.name, err.message, err.stack);
    process.exit(1);
});

process.on('unhandledRejection', (reason: {} | null | undefined, promise: Promise<any>) => {
    console.error('UNHANDLED REJECTION! Shutting down...', reason);
    process.exit(1);
});