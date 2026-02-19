import axiosInstance from './axiosInstance';
import { API_BASE_URL } from './api';

const sparringService = {
    // =========================================================================
    // Professional Availability System
    // =========================================================================

    // Professional: Availability Management
    createAvailability: async (data) => {
        const response = await axiosInstance.post(`${API_BASE_URL}/sparring/availability`, data);
        return response.data;
    },

    getMyAvailability: async () => {
        const response = await axiosInstance.get(`${API_BASE_URL}/sparring/availability/my`);
        return response.data;
    },

    updateAvailability: async (id, data) => {
        const response = await axiosInstance.put(`${API_BASE_URL}/sparring/availability/${id}`, data);
        return response.data;
    },

    deleteAvailability: async (id) => {
        const response = await axiosInstance.delete(`${API_BASE_URL}/sparring/availability/${id}`);
        return response.data;
    },

    // Non-Professional: Browsing Professionals
    getProfessionalsWithAvailability: async (city = '') => {
        const params = city ? `?city=${city}` : '';
        const response = await axiosInstance.get(`${API_BASE_URL}/sparring/professionals${params}`);
        return response.data;
    },

    getProAvailability: async (proId) => {
        const response = await axiosInstance.get(`${API_BASE_URL}/sparring/professionals/${proId}/availability`);
        return response.data;
    },

    getAvailableProsForSlot: async (date, startTime, endTime, city) => {
        const params = new URLSearchParams({ date, startTime, endTime, city }).toString();
        const response = await axiosInstance.get(`${API_BASE_URL}/sparring/available-pros?${params}`);
        return response.data;
    },

    // Non-Professional: Request a Slot
    sendSparringRequest: async (data) => {
        const response = await axiosInstance.post(`${API_BASE_URL}/sparring/request`, data);
        return response.data;
    },

    getMySentRequests: async () => {
        const response = await axiosInstance.get(`${API_BASE_URL}/sparring/requests/my`);
        return response.data;
    },

    // Professional: Incoming Requests
    getIncomingRequests: async () => {
        const response = await axiosInstance.get(`${API_BASE_URL}/sparring/requests/incoming`);
        return response.data;
    },

    acceptRequest: async (requestId) => {
        const response = await axiosInstance.put(`${API_BASE_URL}/sparring/requests/${requestId}/accept`);
        return response.data;
    },

    rejectRequest: async (requestId) => {
        const response = await axiosInstance.put(`${API_BASE_URL}/sparring/requests/${requestId}/reject`);
        return response.data;
    }
};

export default sparringService;
