import { StreamChat } from 'stream-chat';
import 'dotenv/config';

let streamClientInstance = null;

const getStreamClient = () => {
    if (streamClientInstance) return streamClientInstance;

    const apiKey = process.env.STREAM_API_KEY || process.env.STEAM_API_KEY;
    const apiSecret = process.env.STREAM_API_SECRET || process.env.STEAM_API_SECRET;

    if (!apiKey || !apiSecret) {
        console.warn("Stream API key or secret is missing");
        return null;
    }

    try {
        streamClientInstance = StreamChat.getInstance(apiKey, apiSecret);
        return streamClientInstance;
    } catch (err) {
        console.error("Failed to initialize StreamChat client:", err.message);
        return null;
    }
};

export const upsertStreamUser = async (userData) => {
    try {
        const client = getStreamClient();
        if (!client) return userData;
        await client.upsertUsers([userData]);
        return userData;
    } catch (error) {
        console.error("Error upserting Stream user:", error.message);
    }
};

export const generateStreamToken = (userId) => {
    try {
        const client = getStreamClient();
        if (!client) return null;
        const userIdStr = userId.toString();
        const streamToken = client.createToken(userIdStr);
        return streamToken;     
    } catch (error) {
        console.error("Error generating Stream token:", error.message);
        return null;
    }
};