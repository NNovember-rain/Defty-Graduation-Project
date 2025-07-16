const mongoURI: string = process.env.MONGO_URI || 'mongodb://localhost:27017/ai-orchestration-db';

const dbConfig = {
    mongoURI: mongoURI,
};

export default dbConfig;