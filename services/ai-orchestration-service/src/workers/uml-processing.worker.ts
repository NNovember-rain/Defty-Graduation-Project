import { Job } from 'bull';
import logger from '../config/logger';
import umlProcessingQueue from '../queues/uml-processing.queue';
// import { processPdfWithAI, AIValidationError, FileProcessingError, parseStructuredError } from '../services/pdf-processor.service';
import { publishMessage } from '../kafka/producer';
import { UmlInput } from '../types/uml.types';
import {processUmlWithAI} from "../services/plantuml-processor.service";

const KAFKA_TOPIC_UML_SUBMISSION_PROCESSED = process.env.KAFKA_TOPIC_UML_SUBMISSION_PROCESSED || 'test_set.completed';
const QUEUE_CONCURRENCY = parseInt(process.env.QUEUE_CONCURRENCY || '50');

umlProcessingQueue.process(
    QUEUE_CONCURRENCY,
    async (job: Job<UmlInput>) => {
        logger.info({
            message: 'Worker picked up job',
            event_type: 'worker_job_start',
            jobId: job.id
        });

        try {
            const data = await processUmlWithAI(job.data);

            // Publish result to Kafka
            await publishMessage(KAFKA_TOPIC_UML_SUBMISSION_PROCESSED, {
                submissionId: job.data.id,
                status: 'success',
                data
            });

            logger.info({
                message: 'Worker completed job',
                event_type: 'worker_job_completed',
                jobId: job.id
            });

            return data;
        } catch (error: any) {
            // if (error instanceof AIValidationError) {
            //     const parsedError = parseStructuredError(error.errorMessage);
            //
            //     await publishMessage(KAFKA_TOPIC_UML_SUBMISSION_PROCESSED, {
            //         submissionId: job.data.id,
            //         status: 'failed',
            //         ...parsedError
            //     });
            //
            //     logger.warn({
            //         message: 'AI validation failed - not a valid TOEIC test',
            //         event_type: 'worker_validation_failed',
            //         jobId: job.id,
            //         submissionId: job.data.id,
            //         error: parsedError.error
            //     });
            //
            //     return { validationFailed: true };
            // }
            //
            // if (error instanceof FileProcessingError) {
            //     await publishMessage(KAFKA_TOPIC_UML_SUBMISSION_PROCESSED, {
            //         submissionId: job.data.id,
            //         status: 'failed',
            //         error: error.message
            //     });
            //
            //     logger.error({
            //         message: 'File processing failed - file issue',
            //         event_type: 'worker_file_error',
            //         jobId: job.id,
            //         submissionId: job.data.id,
            //         error_message: error.message
            //     });
            //
            //     return { fileError: true };
            // }

            await publishMessage(KAFKA_TOPIC_UML_SUBMISSION_PROCESSED, {
                submissionId: job.data.id,
                status: 'failed',
                error: error.message || 'Lỗi không xác định'
            });

            logger.error({
                message: 'Worker failed job',
                event_type: 'worker_job_failed',
                submissionId: job.data.id,
                error_message: error.message
            });

            throw error;
        }
    });

logger.info({ message: 'UML processing worker started', event_type: 'worker_started' });

export default umlProcessingQueue;