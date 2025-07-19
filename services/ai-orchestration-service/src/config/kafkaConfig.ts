const kafkaConfig = {
    brokers: process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(',') : ['localhost:9092'],
    clientId: process.env.KAFKA_CLIENT_ID || 'ai-orchestration-service',
    groupId: process.env.KAFKA_GROUP_ID || 'ai-orchestration-group',
};

export default kafkaConfig;