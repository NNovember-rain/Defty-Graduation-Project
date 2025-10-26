import Bull, { Queue, Job } from 'bull';
import logger from '../config/logger';
import {UmlInput} from "../types/uml.types";

const QUEUE_NAME = process.env.QUEUE_NAME || 'ai-uml-processing';
const QUEUE_MAX_ATTEMPTS = parseInt(process.env.QUEUE_MAX_ATTEMPTS || '3');
const QUEUE_BACKOFF_DELAY = parseInt(process.env.QUEUE_BACKOFF_DELAY || '5000');
const QUEUE_REMOVE_ON_COMPLETE = parseInt(process.env.QUEUE_REMOVE_ON_COMPLETE || '100');
const QUEUE_REMOVE_ON_FAIL = parseInt(process.env.QUEUE_REMOVE_ON_FAIL || '500');
const QUEUE_JOB_TIMEOUT = parseInt(process.env.QUEUE_JOB_TIMEOUT || '900000');

export const umlProcessingQueue: Queue<UmlInput> = new Bull(QUEUE_NAME, {
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD
    },
    defaultJobOptions: {
        attempts: QUEUE_MAX_ATTEMPTS,
        backoff: { type: 'exponential', delay: QUEUE_BACKOFF_DELAY },
        removeOnComplete: QUEUE_REMOVE_ON_COMPLETE,
        removeOnFail: QUEUE_REMOVE_ON_FAIL,
        timeout: QUEUE_JOB_TIMEOUT
    }
});

// Event listeners
umlProcessingQueue.on('completed', (job: Job, result: any) => {
    logger.info({
        message: 'UML processing job completed',
        event_type: 'queue_job_completed',
        jobId: job.id,
        uploadId: job.data.uploadId
    });
});

umlProcessingQueue.on('failed', (job: Job | undefined, error: Error) => {
    logger.error({
        message: 'UML processing job failed',
        event_type: 'queue_job_failed',
        jobId: job?.id,
        uploadId: job?.data.uploadId,
        error_message: error.message
    });
});

export default umlProcessingQueue;