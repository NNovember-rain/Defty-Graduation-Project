import { Job } from 'bull';
import logger from '../config/logger';
import umlProcessingQueue from '../queues/uml-processing.queue';
import { publishMessage } from '../kafka/producer';
import { UmlInput } from '../types/uml.types';
import {
    AIValidationError,
    processUmlWithAI,
    UmlProcessingError,
    parseStructuredError
} from '../services/plantuml-processor-services';
import sendFeedBack from "../client/feedback-service.client";

const KAFKA_TOPIC_UML_SUBMISSION_PROCESSED = process.env.KAFKA_TOPIC_UML_SUBMISSION_PROCESSED || 'uml_submission.processed';
const QUEUE_CONCURRENCY = parseInt(process.env.QUEUE_CONCURRENCY || '50');

umlProcessingQueue.process(
    QUEUE_CONCURRENCY,
    async (job: Job<UmlInput>) => {
        logger.info({
            message: 'Worker picked up UML job',
            event_type: 'worker_job_start',
            jobId: job.id,
            submissionId: job.data.id,
            typeUmlName: job.data.typeUmlName
        });

        try {
            const data = await processUmlWithAI(job.data);
            if (!data) {
                throw new UmlProcessingError('Type miss match');
            }

            // await publishMessage(KAFKA_TOPIC_UML_SUBMISSION_PROCESSED, {
            //     submissionId: job.data.id,
            //     typeUmlName: job.data.typeUmlName,
            //     status: 'success',
            //     data
            // });

            // await sendFeedBack(job.data.id, data, 'gemini');

            logger.info({
                message: 'Worker completed UML job',
                event_type: 'worker_job_completed',
                jobId: job.id,
                submissionId: job.data.id,
                typeUmlName: job.data.typeUmlName
            });

            return data;
        } catch (error: any) {
            if (error instanceof AIValidationError) {
                const parsedError = parseStructuredError(error.errorMessage);

                await publishMessage(KAFKA_TOPIC_UML_SUBMISSION_PROCESSED, {
                    submissionId: job.data.id,
                    typeUmlName: job.data.typeUmlName,
                    status: 'failed',
                    ...parsedError
                });

                logger.warn({
                    message: 'AI validation failed - invalid UML structure',
                    event_type: 'worker_validation_failed',
                    jobId: job.id,
                    submissionId: job.data.id,
                    typeUmlName: job.data.typeUmlName,
                    error: parsedError.error
                });

                return { validationFailed: true };
            }

            if (error instanceof UmlProcessingError) {
                await publishMessage(KAFKA_TOPIC_UML_SUBMISSION_PROCESSED, {
                    submissionId: job.data.id,
                    typeUmlName: job.data.typeUmlName,
                    status: 'failed',
                    error: error.message
                });

                logger.error({
                    message: 'UML processing failed - input issue',
                    event_type: 'worker_processing_error',
                    jobId: job.id,
                    submissionId: job.data.id,
                    typeUmlName: job.data.typeUmlName,
                    error_message: error.message
                });

                return { processingError: true };
            }

            await publishMessage(KAFKA_TOPIC_UML_SUBMISSION_PROCESSED, {
                submissionId: job.data.id,
                typeUmlName: job.data.typeUmlName,
                status: 'failed',
                error: error.message || 'Lỗi không xác định',
                retryable: true
            });

            logger.error({
                message: 'Worker failed UML job - will retry',
                event_type: 'worker_job_failed',
                jobId: job.id,
                submissionId: job.data.id,
                typeUmlName: job.data.typeUmlName,
                error_message: error.message,
                error_stack: error.stack
            });

            throw error;
        }
    });

logger.info({
    message: 'UML processing worker started',
    event_type: 'worker_started',
    concurrency: QUEUE_CONCURRENCY
});

export default umlProcessingQueue;