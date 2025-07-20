import { Kafka, EachMessagePayload } from 'kafkajs';
import kafkaConfig from '../config/kafkaConfig';
import { handleUseCaseDiagram, handleClassDiagram } from './messageHandlers/umlDiagram.handler'; // NEW: Import handlers

const kafka = new Kafka({
    clientId: kafkaConfig.clientId,
    brokers: kafkaConfig.brokers
});

const consumer = kafka.consumer({ groupId: kafkaConfig.groupId });

const runKafkaConsumer = async () => {
    try {
        await consumer.connect();
        console.log('Kafka Consumer Connected!');

        await consumer.subscribe({ topic: 'umlDiagram', fromBeginning: false });

        await consumer.run({
            eachMessage: async ({ topic, partition, message }: EachMessagePayload) => {
                if (!message.value) {
                    console.warn(`Received null message from topic ${topic}, partition ${partition}`);
                    return;
                }
                const messageValue = message.value.toString();

                try {
                    const parsedMessage = JSON.parse(messageValue);

                    // CHỌN HANDLER PHÙ HỢP TẠI ĐÂY
                    switch (parsedMessage.umlType) {
                        case 'use-case':
                            await handleUseCaseDiagram(parsedMessage);
                            break;
                        case 'class':
                            await handleClassDiagram(parsedMessage);
                            break;
                        default:
                            console.warn(`No handler for umlType: ${parsedMessage.umlType}`);
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