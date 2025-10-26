import { Kafka, EachMessagePayload, ConsumerConfig } from 'kafkajs';
import kafkaConfig from '../config/kafkaConfig';
import logger from '../config/logger';
import {handleUmlSubmission} from "./consumer/uml-handler.consumer";

const kafka = new Kafka({
    clientId: kafkaConfig.clientId,
    brokers: kafkaConfig.brokers
});

const consumerConfig: ConsumerConfig = {
    groupId: kafkaConfig.groupId,
    sessionTimeout: parseInt(process.env.KAFKA_SESSION_TIMEOUT || '300000'),
    heartbeatInterval: parseInt(process.env.KAFKA_HEARTBEAT_INTERVAL || '3000')
};

const consumer = kafka.consumer({ groupId: kafkaConfig.groupId });

const KAFKA_TOPIC_UML_HANDLER = process.env.KAFKA_TOPIC_UML_HANDLER || 'umlDiagram.submission';
const KAFKA_SUBSCRIBE_FROM_BEGINNING = process.env.KAFKA_SUBSCRIBE_FROM_BEGINNING === 'true';

const runKafkaConsumer = async () => {
    try {
        await consumer.connect();
        logger.info({ message: 'Kafka Consumer connected', event_type: 'kafka_consumer_connected' });

        await consumer.subscribe({
            topics: [KAFKA_TOPIC_UML_HANDLER],
            fromBeginning: KAFKA_SUBSCRIBE_FROM_BEGINNING
        });

        await consumer.run({
            eachMessage: async (payload: EachMessagePayload) => {
                const { topic, message } = payload;

                if (!message.value) {
                    logger.warn({ message: 'Received null message', event_type: 'kafka_null_message', topic });
                    return;
                }

                try {
                    switch (topic) {
                        case KAFKA_TOPIC_UML_HANDLER:
                            await handleUmlSubmission(payload);
                            break;

                        default:
                            logger.warn({ message: 'Unhandled topic', event_type: 'kafka_unhandled_topic', topic });
                            break;
                    }
                } catch (error: any) {
                    logger.error({
                        message: 'Error processing message',
                        event_type: 'kafka_message_error',
                        topic,
                        error_message: error.message
                    });
                }
            },
        });

        process.on('SIGINT', async () => {
            logger.info({ message: 'Closing Kafka Consumer', event_type: 'kafka_consumer_closing' });
            await consumer.disconnect();
        });

    } catch (error: any) {
        logger.error({
            message: 'Failed to run Kafka Consumer',
            event_type: 'kafka_consumer_error',
            error_message: error.message
        });
    }
};

export default runKafkaConsumer;