import { api } from '../../context/AuthContext';

export function formatMessageTime(data) {
    if (!data) return '';
    return new Date(data).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
}

export async function getStreamToken() {
    const response = await api.get("/api/messages/users/token");
    console.log("The response of getStreamToken(): ", response.data?.streamToken);
    return response.data;
}
