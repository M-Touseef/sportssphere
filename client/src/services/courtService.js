import axiosInstance from './axiosInstance';
import { API_ENDPOINTS } from './api';

export const getCourts = async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await axiosInstance.get(`${API_ENDPOINTS.COURTS}?${params}`);
    return response.data;
};

export const getCourt = async (id) => {
    const response = await axiosInstance.get(`${API_ENDPOINTS.COURTS}/${id}`);
    return response.data;
};

export const getAvailability = async (id, date) => {
    const response = await axiosInstance.get(`${API_ENDPOINTS.COURTS}/${id}/availability?date=${date}`);
    return response.data;
};

export const createBooking = async (bookingData) => {
    const response = await axiosInstance.post(`${API_ENDPOINTS.BOOK_COURT}`, bookingData);
    return response.data;
};

export const createCourt = async (courtData) => {
    const response = await axiosInstance.post(API_ENDPOINTS.COURTS, courtData);
    return response.data;
};

export const getMyCourts = async () => {
    const response = await axiosInstance.get(`${API_ENDPOINTS.COURTS}/my/all`);
    return response.data;
};

export const getCoachingRequestsForMyCourts = async () => {
    const response = await axiosInstance.get(`${API_ENDPOINTS.COURTS}/my/coaching-requests`);
    return response.data;
};

export const updateCourt = async (id, courtData) => {
    const response = await axiosInstance.put(`${API_ENDPOINTS.COURTS}/${id}`, courtData);
    return response.data;
};

export const deleteCourt = async (id) => {
    const response = await axiosInstance.delete(`${API_ENDPOINTS.COURTS}/${id}`);
    return response.data;
};

export const getMyBookings = async () => {
    const response = await axiosInstance.get(`${API_ENDPOINTS.BOOK_COURT}/my`);
    return response.data;
};

export const cancelBooking = async (id) => {
    const response = await axiosInstance.put(`${API_ENDPOINTS.BOOK_COURT}/${id}/cancel`);
    return response.data;
};

export const confirmPayment = async (id) => {
    const response = await axiosInstance.put(`${API_ENDPOINTS.BOOK_COURT}/${id}/pay`);
    return response.data;
};

const courtService = {
    getCourts,
    getAllCourts: getCourts, // Alias for compatibility
    getCourt,
    getAvailability,
    createBooking,
    getMyBookings,
    cancelBooking,
    confirmPayment,
    getMyCourts,
    deleteCourt,
    createCourt,
    updateCourt,
    getCoachingRequestsForMyCourts
};

export const getAllCourts = getCourts;

export default courtService;
