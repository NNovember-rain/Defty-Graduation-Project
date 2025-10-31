import { Kafka, Producer } from 'kafkajs';
import kafkaConfig from '../config/kafkaConfig';
import logger from '../config/logger';

const kafka = new Kafka({
    clientId: kafkaConfig.clientId,
    brokers: kafkaConfig.brokers
});

let producer: Producer | null = null;

export const initProducer = async (): Promise<void> => {
    if (producer) return;

    producer = kafka.producer();
    await producer.connect();

    logger.info({ message: 'Kafka Producer connected', event_type: 'kafka_producer_connected' });
};

export const publishMessage = async (topic: string, message: any): Promise<void> => {
    if (!producer) {
        await initProducer();
    }

    try {
        await producer!.send({
            topic,
            messages: [{ value: JSON.stringify(message) }]
        });

        logger.info({
            message: 'Message published to Kafka',
            event_type: 'kafka_message_published',
            topic,
            uploadId: message.uploadId
        });
    } catch (error: any) {
        logger.error({
            message: 'Failed to publish message',
            event_type: 'kafka_publish_error',
            topic,
            error_message: error.message
        });

        throw error;
    }
};

export const closeProducer = async (): Promise<void> => {
    if (producer) {
        await producer.disconnect();
        producer = null;
    }
};