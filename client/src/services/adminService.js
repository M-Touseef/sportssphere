import axiosInstance from './axiosInstance';
import { API_BASE_URL } from './api';

export const getStats = async () => {
    const response = await axiosInstance.get(`${API_BASE_URL}/admin/stats`);
    return response.data;
};

export const getAllUsers = async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.role) params.append('role', filters.role);
    if (filters.verified) params.append('verified', filters.verified);
    if (filters.search) params.append('search', filters.search);

    const response = await axiosInstance.get(`${API_BASE_URL}/admin/users`, { params });
    return response.data;
};

export const getPendingUsers = async () => {
    const response = await axiosInstance.get(`${API_BASE_URL}/admin/users/pending`);
    return response.data;
};

export const getUserDetails = async (id) => {
    const response = await axiosInstance.get(`${API_BASE_URL}/admin/users/${id}`);
    return response.data;
};

export const updateUser = async (id, data) => {
    const response = await axiosInstance.put(`${API_BASE_URL}/admin/users/${id}`, data);
    return response.data;
};

export const approveUser = async (id) => {
    const response = await axiosInstance.put(`${API_BASE_URL}/admin/users/${id}/approve`);
    return response.data;
};

export const rejectUser = async (id, reason) => {
    const response = await axiosInstance.put(`${API_BASE_URL}/admin/users/${id}/reject`, { reason });
    return response.data;
};

export const getAllBookings = async () => {
    const response = await axiosInstance.get(`${API_BASE_URL}/admin/bookings`);
    return response.data;
};

export const getAllTournaments = async () => {
    const response = await axiosInstance.get(`${API_BASE_URL}/admin/tournaments`);
    return response.data;
};

export const deleteTournament = async (id) => {
    const response = await axiosInstance.delete(`${API_BASE_URL}/admin/tournaments/${id}`);
    return response.data;
};

export const getAllCourts = async () => {
    const response = await axiosInstance.get(`${API_BASE_URL}/admin/courts`);
    return response.data;
};

export const deleteCourt = async (id) => {
    const response = await axiosInstance.delete(`${API_BASE_URL}/admin/courts/${id}`);
    return response.data;
};

const adminService = {
    getStats,
    getAllUsers,
    getPendingUsers,
    getUserDetails,
    updateUser,
    approveUser,
    rejectUser,
    getAllBookings,
    getAllTournaments,
    deleteTournament,
    getAllCourts,
    deleteCourt
};

export default adminService;
