import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const checkLoggedIn = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const response = await authService.getCurrentUser();
                    // authService.getCurrentUser() returns response.data which is the user object wrapped in data property?
                    // Check authService.js: returns response.data.
                    // Check authController.js: response.data of getMe is { success: true, data: user }.
                    // So authService.getCurrentUser() returns { success: true, data: user }.
                    // Note: authService.getCurrentUser code:
                    //     const response = await axiosInstance.get(API_ENDPOINTS.USER_PROFILE);
                    //     return response.data;
                    // So yes, it returns the body.

                    // So setUser(response.data.data) ??? or setUser(response.data) if the service unwrraps it?
                    // authService returns response.data.
                    // Backend returns { success: true, data: user }.
                    // So response.data in authService is { success: true, data: user }.
                    // So we need response.data.data. Or response.data if authService unwraps it.

                    // Wait, let's look at `login` in AuthContext above.
                    // const response = await authService.login(credentials);
                    // setUser(response.user);
                    // authService.login returns response.data.
                    // Backend login returns { success: true, token, user: {...} }.
                    // So response.user is correct there.

                    // authService.getCurrentUser returns response.data from backend { success: true, data: user }.
                    // So response.data is the user object in the response body? No.
                    // If authService returns response.data (the body), then we access .data on it.
                    // So setUser(response.data).
                    setUser(response.data);
                } catch (err) {
                    console.error('Error fetching user:', err);
                    localStorage.removeItem('token');
                    setUser(null);
                }
            }
            setLoading(false);
        };

        checkLoggedIn();
    }, []);

    const login = async (credentials) => {
        setLoading(true);
        setError(null);
        try {
            const response = await authService.login(credentials);
            setUser(response.user);
            setLoading(false);
            return response;
        } catch (err) {
            setLoading(false);
            const message = err.response?.data?.error || err.response?.data?.message || 'Login failed';
            setError(message);
            throw new Error(message);
        }
    };

    const register = async (userData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await authService.register(userData);
            setUser(response.user);
            setLoading(false);
            return response;
        } catch (err) {
            setLoading(false);
            const message = err.response?.data?.error || err.response?.data?.message || 'Registration failed';
            setError(message);
            throw new Error(message);
        }
    };

    const logout = useCallback(() => {
        authService.logout();
        setUser(null);
        navigate('/', { replace: true });
    }, [navigate]);

    const updateProfile = async (userData) => {
        setLoading(true);
        try {
            const response = await authService.updateProfile(userData);
            setUser(response.data);
            setLoading(false);
            return response;
        } catch (err) {
            setLoading(false);
            throw err;
        }
    };

    const completeProfile = async (userData) => {
        setLoading(true);
        try {
            const response = await authService.completeProfile(userData);
            setUser(response.user);
            setLoading(false);
            return response;
        } catch (err) {
            setLoading(false);
            throw err;
        }
    };

    const selectRole = async (roleData) => {
        setLoading(true);
        try {
            const response = await authService.selectRole(roleData);
            setUser(response.user);
            setLoading(false);
            return response;
        } catch (err) {
            setLoading(false);
            throw err;
        }
    };

    const value = {
        user,
        loading,
        error,
        login,
        register,
        logout,
        updateProfile,
        completeProfile,
        selectRole,
        isAuthenticated: !!user,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
