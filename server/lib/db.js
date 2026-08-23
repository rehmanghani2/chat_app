import mongoose from "mongoose";

let isConnected = false;

export const connectDB = async () => {
    if (isConnected || mongoose.connection.readyState >= 1) {
        return;
    }

    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error("MONGODB_URI environment variable is missing!");
        return;
    }

    try {
        const mongoUrl = uri.endsWith('/chat-app') || uri.includes('/chat-app?') ? uri : `${uri.replace(/\/$/, '')}/chat-app`;
        await mongoose.connect(mongoUrl);
        isConnected = true;
        console.log('Database connected successfully');
    } catch (error) {
        console.error("DB Connection Error:", error.message);
    }
};