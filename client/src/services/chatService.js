import axiosInstance from './axiosInstance';
import { API_BASE_URL } from './api';

const chatService = {
    // Conversation Management
    getConversations: async () => {
        const response = await axiosInstance.get(`${API_BASE_URL}/chat/conversations`);
        return response.data;
    },

    getConversation: async (id) => {
        const response = await axiosInstance.get(`${API_BASE_URL}/chat/conversations/${id}`);
        return response.data;
    },

    createConversation: async (data) => {
        const response = await axiosInstance.post(`${API_BASE_URL}/chat/conversations`, data);
        return response.data;
    },

    updateConversation: async (id, data) => {
        const response = await axiosInstance.put(`${API_BASE_URL}/chat/conversations/${id}`, data);
        return response.data;
    },

    deleteConversation: async (id) => {
        const response = await axiosInstance.delete(`${API_BASE_URL}/chat/conversations/${id}`);
        return response.data;
    },

    clearConversation: async (id) => {
        const response = await axiosInstance.post(`${API_BASE_URL}/chat/conversations/${id}/clear`);
        return response.data;
    },

    // Message Operations
    sendMessage: async (conversationId, message) => {
        const response = await axiosInstance.post(`${API_BASE_URL}/chat/conversations/${conversationId}/messages`, { message });
        return response.data;
    }
};

export default chatService;
