import { useEffect, useState, useCallback, useRef } from 'react';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../services/notificationService';
import { useAuth } from '../context/AuthContext';

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);

  const loadNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchNotifications();
      if (isMounted.current) {
        setNotifications(data);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      if (isMounted.current) {
        console.error('Failed to load notifications', err);
        setError(err);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [user]);

  useEffect(() => {
    isMounted.current = true;
    loadNotifications();
    return () => {
      isMounted.current = false;
    };
  }, [loadNotifications]);

  useEffect(() => {
    if (!user) return undefined;
    const intervalMs = 30000;
    const id = setInterval(() => loadNotifications(), intervalMs);
    return () => clearInterval(id);
  }, [user, loadNotifications]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible') loadNotifications();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [loadNotifications]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const hasUnread = unreadCount > 0;

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to mark all notifications as read', err);
    }
  };

  const handleMarkSingleRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to mark notification as read', err);
    }
  };

  return {
    notifications,
    loading,
    error,
    hasUnread,
    unreadCount,
    reload: loadNotifications,
    markAllRead: handleMarkAllRead,
    markNotificationRead: handleMarkSingleRead,
  };
};


