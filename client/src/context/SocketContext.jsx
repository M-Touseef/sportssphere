/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo } from 'react';
import { io } from 'socket.io-client';
import { useLocation } from 'react-router-dom';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const location = useLocation();
    const shouldEnableSocket = location.pathname === '/chatbot';

    // Configure socket URL (same as API base without /api)
    // Assuming API is at http://localhost:5000/api
    const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    const token = localStorage.getItem('token');
    const socket = useMemo(() => {
        if (!shouldEnableSocket || !token) return null;

        return io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket'],
            reconnection: true,
            autoConnect: false
        });
    }, [SOCKET_URL, shouldEnableSocket, token]);

    useEffect(() => {
        if (!socket) {
            return undefined;
        }

        const handlePageHide = () => {
            socket.disconnect();
        };

        socket.on('connect', () => {
            console.log('Socket connected');
        });

        socket.on('connect_error', (err) => {
            console.error('Socket connection error:', err);
        });

        socket.connect();
        window.addEventListener('pagehide', handlePageHide);

        return () => {
            window.removeEventListener('pagehide', handlePageHide);
            socket.disconnect();
        };
    }, [socket]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
