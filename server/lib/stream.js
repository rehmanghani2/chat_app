import {StreamChat} from 'stream-chat';
import 'dotenv/config'

const apiKey = process.env.STEAM_API_KEY || process.env.STREAM_API_KEY;
const apiSecret = process.env.STEAM_API_SECRET || process.env.STREAM_API_SECRET;

if(!apiKey || !apiSecret) {
    console.error("Stream API key or secret is missing");
}
const streamClient = StreamChat.getInstance(apiKey, apiSecret);

export const upsertStreamUser = async (userData) => {
    try {
        await streamClient.upsertUsers([userData]);
        return userData;
    } catch (error) {
        console.error("Error upserting Stream user:", error);
    }
};

// todo 
export const generateStreamToken = (userId) => {
    try {
        // ensure userId is string
        const userIdStr = userId.toString();
        const streamToken =  streamClient.createToken(userIdStr);
        console.log("Stream token gereated in server", streamClient.createToken(userIdStr))
        return streamToken;     
    } catch (error) {
        console.log("Error generating Stream token: ", error);
    }
};