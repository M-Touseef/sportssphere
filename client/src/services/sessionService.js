import axiosInstance from './axiosInstance';
import { API_ENDPOINTS, API_BASE_URL } from './api';

const sessionService = {
    // Publish a session (Coach)
    publishSession: async (sessionData) => {
        const response = await axiosInstance.post(API_ENDPOINTS.PUBLISH_SESSION, sessionData);
        return response.data;
    },

    // Get available sessions for a coach (Player)
    getAvailableSessions: async (coachId) => {
        const response = await axiosInstance.get(`${API_ENDPOINTS.AVAILABLE_SESSIONS}/${coachId}`);
        return response.data;
    },

    // Request a session (Player)
    requestSession: async (sessionId) => {
        const response = await axiosInstance.post(`${API_ENDPOINTS.REQUEST_SESSION}/${sessionId}/request`);
        return response.data;
    },

    // Get coach's defined sessions
    getCoachSessions: async () => {
        const response = await axiosInstance.get(API_ENDPOINTS.COACH_SESSIONS);
        return response.data;
    },

    // Get player's requested sessions
    getMySessions: async () => {
        const response = await axiosInstance.get(`${API_BASE_URL}/sessions/my`);
        return response.data;
    },

    // Cancel a session
    cancelSession: async (sessionId) => {
        const response = await axiosInstance.put(`${API_BASE_URL}/sessions/${sessionId}/cancel`);
        return response.data;
    },

    // Confirm a session (Coach)
    confirmSession: async (sessionId) => {
        const response = await axiosInstance.put(`${API_BASE_URL}/sessions/${sessionId}/confirm`);
        return response.data;
    },

    // Reject a session (Coach)
    rejectSession: async (sessionId) => {
        const response = await axiosInstance.put(`${API_BASE_URL}/sessions/${sessionId}/reject`);
        return response.data;
    },

    // Recurring Session Logic
    getCoachRealizedAvailability: async (coachProfileId) => {
        const response = await axiosInstance.get(`${API_BASE_URL}/sessions/available/recurring/${coachProfileId}`);
        return response.data;
    },

    requestRecurringSession: async (data) => {
        const response = await axiosInstance.post(`${API_BASE_URL}/sessions/request/recurring`, data);
        return response.data;
    },
    payCourtFee: async (sessionId) => {
        const response = await axiosInstance.put(`${API_BASE_URL}/sessions/${sessionId}/pay-court-fee`);
        return response.data;
    }
};

export default sessionService;
