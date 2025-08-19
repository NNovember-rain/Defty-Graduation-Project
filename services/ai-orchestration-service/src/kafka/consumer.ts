import { Kafka, EachMessagePayload } from 'kafkajs';
import kafkaConfig from '../config/kafkaConfig';
import {handleUseCaseDiagram, handleClassDiagram, UmlDiagramMessage} from './messageHandlers/umlDiagram.handler'; // NEW: Import handlers

const kafka = new Kafka({
    clientId: kafkaConfig.clientId,
    brokers: kafkaConfig.brokers
});

const consumer = kafka.consumer({ groupId: kafkaConfig.groupId });

const runKafkaConsumer = async () => {
    try {
        await consumer.connect();
        console.log('Kafka Consumer Connected!');

        await consumer.subscribe({
            topics: ['umlDiagram.submission'],
            fromBeginning: false
        });

        await consumer.run({
            eachMessage: async ({ topic, partition, message }: EachMessagePayload) => {
                if (!message.value) {
                    console.warn(`Received null message from topic ${topic}, partition ${partition}`);
                    return;
                }
                const messageValue = message.value.toString();

                try {
                    switch (topic) {
                        case 'umlDiagram.submission':
                            const parsedMessage: UmlDiagramMessage = JSON.parse(messageValue);
                            switch (parsedMessage.typeUmlName) {
                                case 'use-case':
                                    await handleUseCaseDiagram(parsedMessage);
                                    break;
                                case 'class':
                                    await handleClassDiagram(parsedMessage);
                                    break;
                                default:
                                    console.warn(`No handler for umlType: ${parsedMessage.typeUmlName}`);
                            }
                            break;

                        default:
                            break;
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