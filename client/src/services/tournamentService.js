import axiosInstance from './axiosInstance';
import { API_BASE_URL } from './api';

/** Build query string — omit empty values so the API applies filters correctly. */
export const buildTournamentQueryParams = (filters = {}) => {
    const params = new URLSearchParams();
    const area = typeof filters.area === 'string' ? filters.area.trim() : '';
    if (area) params.set('area', area);
    if (filters.status) params.set('status', filters.status);
    if (filters.category) params.set('category', filters.category);
    // Only restrict to future start dates when browsing all statuses (not when filtering by status)
    if (!filters.status && filters.upcoming === 'true') {
        params.set('upcoming', 'true');
    }
    return params.toString();
};

export const getTournaments = async (filters = {}) => {
    const query = buildTournamentQueryParams(filters);
    const url = query ? `${API_BASE_URL}/tournaments?${query}` : `${API_BASE_URL}/tournaments`;
    const response = await axiosInstance.get(url);
    return response.data;
};

export const getTournament = async (id) => {
    const response = await axiosInstance.get(`${API_BASE_URL}/tournaments/${id}`);
    return response.data;
};

export const createTournament = async (tournamentData) => {
    const response = await axiosInstance.post(`${API_BASE_URL}/tournaments`, tournamentData);
    return response.data;
};

export const updateTournament = async (id, tournamentData) => {
    const response = await axiosInstance.put(`${API_BASE_URL}/tournaments/${id}`, tournamentData);
    return response.data;
};

export const deleteTournament = async (id) => {
    const response = await axiosInstance.delete(`${API_BASE_URL}/tournaments/${id}`);
    return response.data;
};

export const publishTournament = async (id) => {
    const response = await axiosInstance.put(`${API_BASE_URL}/tournaments/${id}/publish`);
    return response.data;
};

export const getMyTournaments = async () => {
    const response = await axiosInstance.get(`${API_BASE_URL}/tournaments/my/organized`);
    return response.data;
};

export const registerForTournament = async (id, registrationData) => {
    const response = await axiosInstance.post(`${API_BASE_URL}/tournaments/${id}/register`, registrationData);
    return response.data;
};

export const getTournamentRegistrations = async (id, category = null) => {
    const params = category ? `?category=${category}` : '';
    const response = await axiosInstance.get(`${API_BASE_URL}/tournaments/${id}/registrations${params}`);
    return response.data;
};

export const getMyRegistrations = async () => {
    const response = await axiosInstance.get(`${API_BASE_URL}/tournaments/my/registrations`);
    return response.data;
};

export const withdrawRegistration = async (registrationId) => {
    const response = await axiosInstance.put(`${API_BASE_URL}/tournaments/registrations/${registrationId}/withdraw`);
    return response.data;
};

export const generateBrackets = async (id, category) => {
    const response = await axiosInstance.post(`${API_BASE_URL}/tournaments/${id}/generate-brackets`, { category });
    return response.data;
};

export const getTournamentMatches = async (id, filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await axiosInstance.get(`${API_BASE_URL}/tournaments/${id}/matches?${params}`);
    return response.data;
};

export const submitMatchResult = async (matchId, result) => {
    const response = await axiosInstance.put(`${API_BASE_URL}/matches/${matchId}/result`, result);
    return response.data;
};

export const getLeaderboard = async (id, category) => {
    const response = await axiosInstance.get(`${API_BASE_URL}/tournaments/${id}/leaderboard?category=${category}`);
    return response.data;
};

const tournamentService = {
    getTournaments,
    getTournament,
    createTournament,
    updateTournament,
    deleteTournament,
    publishTournament,
    getMyTournaments,
    registerForTournament,
    getTournamentRegistrations,
    getMyRegistrations,
    withdrawRegistration,
    generateBrackets,
    getTournamentMatches,
    submitMatchResult,
    getLeaderboard
};

export default tournamentService;
