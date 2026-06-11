import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

const AuthContext = createContext(null);
const TOKEN_KEY = 'token';
const USER_CACHE_KEY = 'auth_user';

const readCachedUser = () => {
    try {
        const raw = localStorage.getItem(USER_CACHE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        localStorage.removeItem(USER_CACHE_KEY);
        return null;
    }
};

const cacheUser = (user) => {
    try {
        if (user) {
            localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
        } else {
            localStorage.removeItem(USER_CACHE_KEY);
        }
    } catch {
        /* ignore cache write errors */
    }
};

export const AuthProvider = ({ children }) => {
    const navigate = useNavigate();
    const cachedUser = readCachedUser();
    const [user, setUser] = useState(cachedUser);
    const [loading, setLoading] = useState(() => Boolean(localStorage.getItem(TOKEN_KEY) && !cachedUser));
    const [error, setError] = useState(null);

    useEffect(() => {
        const checkLoggedIn = async () => {
            const token = localStorage.getItem(TOKEN_KEY);
            if (token) {
                try {
                    const response = await authService.getCurrentUser();
                    setUser(response.data);
                    cacheUser(response.data);
                } catch (err) {
                    console.error('Error fetching user:', err);
                    localStorage.removeItem(TOKEN_KEY);
                    localStorage.removeItem(USER_CACHE_KEY);
                    setUser(null);
                }
            } else {
                cacheUser(null);
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
            cacheUser(response.user);
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
            cacheUser(response.user);
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
        cacheUser(null);
        navigate('/', { replace: true });
    }, [navigate]);

    const updateProfile = async (userData) => {
        setLoading(true);
        try {
            const response = await authService.updateProfile(userData);
            setUser(response.data);
            cacheUser(response.data);
            setLoading(false);
            return response;
        } catch (err) {
            setLoading(false);
            throw err;
        }
    };

    const updateProfilePicture = async (file) => {
        setLoading(true);
        try {
            const response = await authService.updateProfilePicture(file);
            setUser(response.user);
            cacheUser(response.user);
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
            cacheUser(response.user);
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
            cacheUser(response.user);
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
        updateProfilePicture,
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
