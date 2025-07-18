import { Kafka, EachMessagePayload } from 'kafkajs';
import kafkaConfig from '../config/kafkaConfig';

const kafka = new Kafka({
    clientId: kafkaConfig.clientId,
    brokers: kafkaConfig.brokers
});

const consumer = kafka.consumer({ groupId: kafkaConfig.groupId });

const runKafkaConsumer = async () => {
    try {
        await consumer.connect();
        console.log('Kafka Consumer Connected!');

        await consumer.subscribe({ topic: 'user-created', fromBeginning: false });
        await consumer.subscribe({ topic: 'order-processed', fromBeginning: false });

        await consumer.run({
            eachMessage: async ({ topic, partition, message }: EachMessagePayload) => {
                if (!message.value) {
                    console.warn(`Received null message from topic ${topic}, partition ${partition}`);
                    return;
                }
                const messageValue = message.value.toString();
                console.log(`Received message from topic ${topic}: ${messageValue}`);

                try {
                    const parsedMessage = JSON.parse(messageValue);
                    switch (topic) {
                        case '':
                            break;
                        default:
                            console.warn(`No handler for topic: ${topic}`);
                    }
                } catch (error: any) {
                    console.error(`Error processing message from topic ${topic}: ${error.message}`);
                }
            },
        });

        process.on('SIGINT', async () => {
            console.log('Closing Kafka Consumer...');
            await consumer.disconnect();
            console.log('Kafka Consumer Disconnected.');
        });

    } catch (error: any) {
        console.error('Failed to connect or run Kafka Consumer:', error.message);
    }
};

export default runKafkaConsumer;