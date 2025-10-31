import {EachMessagePayload} from "kafkajs";
import logger from "../../config/logger";
import {UmlInput} from "../../types/uml.types";
import umlProcessingQueue from "../../queues/uml-processing.queue";

export const handleUmlSubmission = async (payload: EachMessagePayload) => {
    const { topic, partition, message } = payload;
    const startTime = Date.now();

    try {
        const data: UmlInput = JSON.parse(message.value?.toString() || '{}');

        logger.info({
            message: 'Received message from Kafka',
            event_type: 'kafka_message_received',
            topic,
            partition,
            offset: message.offset,
            submissionId: data.id
        });

        await umlProcessingQueue.add(data, {
            priority: 1
        });

        const duration = Date.now() - startTime;

        logger.info({
            message: 'Message queued successfully',
            event_type: 'kafka_message_queued',
            submissionId: data.id,
            durationMs: duration
        });
    } catch (error: any) {
        logger.error({
            message: 'Failed to queue message',
            event_type: 'kafka_queue_error',
            error_message: error.message
        });

        throw error;
    }
}