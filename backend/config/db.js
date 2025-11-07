import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/workwell-ai';

        await mongoose.connect(mongoURI);

        console.log('MongoDB Connected Successfully');
    } catch (error) {
        console.error('MongoDB Connection Error:', error.message);
        // Don't exit process, continue with in-memory fallback
        console.log('Running without MongoDB - using in-memory data');
    }
};

export default connectDB;
