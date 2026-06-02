import axiosInstance from './axiosInstance';
import { API_ENDPOINTS } from './api';

// Note: axiosInstance already has interceptors and default headers configured.

const authService = {
    // Register user
    register: async (userData) => {
        const response = await axiosInstance.post(API_ENDPOINTS.REGISTER, userData);
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
        }
        return response.data;
    },

    // Login user
    login: async (credentials) => {
        const response = await axiosInstance.post(API_ENDPOINTS.LOGIN, credentials);
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
        }
        return response.data;
    },

    // Logout user
    logout: () => {
        localStorage.removeItem('token');
    },

    // Get current user profile
    getCurrentUser: async () => {
        const response = await axiosInstance.get(API_ENDPOINTS.USER_PROFILE); // This should point to /auth/me
        return response.data;
    },

    // Update user profile
    updateProfile: async (userData) => {
        const response = await axiosInstance.put(API_ENDPOINTS.UPDATE_PROFILE, userData); // This should point to /auth/updatedetails
        return response.data;
    },

    updateProfilePicture: async (file) => {
        const formData = new FormData();
        formData.append('profilePicture', file);

        const response = await axiosInstance.put(API_ENDPOINTS.UPDATE_PROFILE_PICTURE, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // Complete user profile setup
    completeProfile: async (userData) => {
        // Use put or post? Usually PUT for update, but this is a specific action. 
        // I will use PUT as it updates the user.
        // Also it might send files so content-type header usually handled by axios if specific data is FormData.
        const response = await axiosInstance.put(API_ENDPOINTS.COMPLETE_PROFILE, userData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // Select user role
    selectRole: async (roleData) => {
        const response = await axiosInstance.put(API_ENDPOINTS.SELECT_ROLE, roleData);
        return response.data;
    }
};

export default authService;
