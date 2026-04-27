import api from './axiosInstance';

const PROFESSIONAL_URL = '/professional';
const SPARRING_URL = '/sparring';

// Profile Management
export const createProfile = async (profileData) => {
    const response = await api.post(`${PROFESSIONAL_URL}/profile`, profileData);
    return response.data;
};

export const getMyProfile = async () => {
    const response = await api.get(`${PROFESSIONAL_URL}/profile/me`);
    return response.data;
};

export const updateProfile = async (profileData) => {
    const response = await api.put(`${PROFESSIONAL_URL}/profile`, profileData);
    return response.data;
};

export const getPublicProfile = async (id) => {
    const response = await api.get(`${PROFESSIONAL_URL}/${id}`);
    return response.data;
};

export const getAllProfessionals = async (params) => {
    const response = await api.get(`${PROFESSIONAL_URL}/list`, { params });
    return response.data;
};

export const rateProfessional = async (id, rating) => {
    const response = await api.post(`${PROFESSIONAL_URL}/${id}/rate`, { rating });
    return response.data;
};

// Availability Management
// Recurring Availability
export const addRecurringSlot = async (slotData) => {
    const response = await api.post(`${SPARRING_URL}/availability/recurring`, slotData);
    return response.data;
};

export const getMyRecurringAvailability = async () => {
    const response = await api.get(`${SPARRING_URL}/availability/recurring/my`);
    return response.data;
};

export const removeRecurringSlot = async (slotId) => {
    const response = await api.delete(`${SPARRING_URL}/availability/recurring/${slotId}`);
    return response.data;
};

export const updateRecurringSlot = async (slotId, slotData) => {
    const response = await api.put(`${SPARRING_URL}/availability/recurring/${slotId}`, slotData);
    return response.data;
};

// Legacy / Overrides
export const createAvailability = async (availabilityData) => {
    const response = await api.post(`${SPARRING_URL}/availability`, availabilityData);
    return response.data;
};

export const getMyAvailability = async () => {
    const response = await api.get(`${SPARRING_URL}/availability/my`);
    return response.data;
};

export const updateAvailability = async (id, data) => {
    const response = await api.put(`${SPARRING_URL}/availability/${id}`, data);
    return response.data;
};

export const deleteAvailability = async (id) => {
    const response = await api.delete(`${SPARRING_URL}/availability/${id}`);
    return response.data;
};

export const toggleAvailability = async (id) => {
    const response = await api.patch(`${SPARRING_URL}/availability/${id}/toggle`);
    return response.data;
};

export const getAvailableProsForSlot = async (filters) => {
    const response = await api.get(`${SPARRING_URL}/available-pros`, { params: filters });
    return response.data;
};

// Request Management
export const getIncomingRequests = async () => {
    const response = await api.get(`${SPARRING_URL}/requests/incoming`);
    return response.data;
};

export const acceptRequest = async (id) => {
    const response = await api.put(`${SPARRING_URL}/requests/${id}/accept`);
    return response.data;
};

export const rejectRequest = async (id) => {
    const response = await api.put(`${SPARRING_URL}/requests/${id}/reject`);
    return response.data;
};
