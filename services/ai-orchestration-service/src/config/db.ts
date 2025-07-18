import mongoose from 'mongoose';
import dbConfig from './dbConfig';

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(dbConfig.mongoURI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        mongoose.connection.on('connected', () => {
            console.log('Mongoose default connection open to ' + conn.connection.host);
        });

        mongoose.connection.on('error', (err) => {
            console.error('Mongoose default connection error: ' + err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('Mongoose default connection disconnected');
        });

        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log('Mongoose default connection disconnected through app termination');
            process.exit(0);
        });

    } catch (err: any) {
        console.error(`Error connecting to MongoDB: ${err.message}`);
        process.exit(1);
    }
};

export default connectDB;