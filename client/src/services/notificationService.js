import axiosInstance from './axiosInstance';
import { API_BASE_URL } from './api';

const BASE_PATH = '/notifications';

export const fetchNotifications = async () => {
  const response = await axiosInstance.get(BASE_PATH);
  return response.data.notifications || [];
};

export const markNotificationRead = async (id) => {
  const response = await axiosInstance.patch(`${BASE_PATH}/${id}/read`);
  return response.data.notification;
};

export const markAllNotificationsRead = async () => {
  const response = await axiosInstance.patch(`${BASE_PATH}/mark-all-read`);
  return response.data;
};


