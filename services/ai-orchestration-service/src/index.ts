import './config/dotenvConfig';
import app from './app';
import connectDB from './config/db';
import runKafkaConsumer from './kafka/consumer';
import { initProducer } from './kafka/producer';
import './workers/uml-processing.worker';
import logger from './config/logger';

(async () => {
    try {
        logger.info({ message: 'Starting application', event_type: 'app_start' });

        await connectDB();

        // Initialize Kafka Producer
        await initProducer();

        // Start Kafka Consumer
        await runKafkaConsumer();

        const PORT = process.env.PORT || 3000;

        app.listen(PORT, () => {
            logger.info({
                message: 'Server started',
                event_type: 'server_started',
                port: PORT,
            });
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });
    } catch (error: any) {
        logger.error({
            message: 'Failed to start application',
            event_type: 'app_start_error',
            error_message: error.message,
        });
        process.exit(1);
    }
})();

// --- Handle fatal errors ---
process.on('uncaughtException', (err: Error) => {
    logger.error({
        message: 'Uncaught exception',
        event_type: 'uncaught_exception',
        error_name: err.name,
        error_message: err.message,
        stack: err.stack,
    });
    process.exit(1);
});

process.on('unhandledRejection', (reason: any) => {
    logger.error({
        message: 'Unhandled rejection',
        event_type: 'unhandled_rejection',
        reason: reason?.message || reason,
    });
    process.exit(1);
});