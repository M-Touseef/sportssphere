export const API_BASE_URL = import.meta.env.REACT_APP_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:5001';

export const API_ENDPOINTS = {
    // Auth
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
    LOGOUT: `${API_BASE_URL}/auth/logout`,

    // Users
    // Users
    USER_PROFILE: `${API_BASE_URL}/auth/me`,
    UPDATE_PROFILE: `${API_BASE_URL}/auth/updatedetails`,
    COMPLETE_PROFILE: `${API_BASE_URL}/auth/complete-profile`,
    SELECT_ROLE: `${API_BASE_URL}/auth/select-role`,
    GET_USER_BY_ID: `${API_BASE_URL}/users/profile`,

    // Courts
    COURTS: `${API_BASE_URL}/courts`,
    COURT_AVAILABILITY: `${API_BASE_URL}/courts/availability`,
    BOOK_COURT: `${API_BASE_URL}/bookings`,

    // Coaches
    COACHES: `${API_BASE_URL}/coaches`,
    COACH_SESSIONS: `${API_BASE_URL}/sessions/coach`,
    PUBLISH_SESSION: `${API_BASE_URL}/sessions/publish`,
    AVAILABLE_SESSIONS: `${API_BASE_URL}/sessions/available`, // + /coachId
    REQUEST_SESSION: `${API_BASE_URL}/sessions`, // + /sessionId/request

    // Tournaments
    TOURNAMENTS: `${API_BASE_URL}/tournaments`,
    REGISTER_TOURNAMENT: `${API_BASE_URL}/tournaments/register`,
    TOURNAMENT_BRACKETS: `${API_BASE_URL}/tournaments/brackets`,

    // Sparring
    SPARRING_REQUESTS: `${API_BASE_URL}/sparring`,
    MATCH_SPARRING: `${API_BASE_URL}/sparring/match`,

    // AI Chatbot
    CHATBOT: `${AI_SERVICE_URL}/api/chat`,
};
