import api from './axiosInstance';

export const getCoaches = async (filters) => {
    const response = await api.get('/coaches', { params: filters });
    return response.data;
};

export const getCoachProfile = async (id) => {
    const response = await api.get(`/coaches/${id}`);
    return response.data;
};

export const getCoachAvailability = async (id) => {
    const response = await api.get(`/coaches/${id}/availability`);
    return response.data;
};

export const createOrUpdateProfile = async (profileData) => {
    const response = await api.post('/coaches/profile', profileData);
    return response.data;
};

export const getMyProfile = async () => {
    const response = await api.get('/coaches/me');
    return response.data;
};

const coachService = {
    getCoaches,
    getCoachProfile,
    getCoachAvailability,
    createOrUpdateProfile,
    getMyProfile,
    addAvailabilitySlot: async (data) => {
        const response = await api.post('/coaches/availability', data);
        return response.data;
    },
    removeAvailabilitySlot: async (id) => {
        const response = await api.delete(`/coaches/availability/${id}`);
        return response.data;
    }
};

export default coachService;
