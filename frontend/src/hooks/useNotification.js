import { useState, useCallback } from 'react';

const useNotification = () => {
  const [notification, setNotification] = useState({
    isVisible: false,
    message: '',
    type: 'success',
    duration: 3000
  });

  const showNotification = useCallback((message, type = 'success', duration = 3000) => {
    setNotification({
      isVisible: true,
      message,
      type,
      duration
    });
  }, []);

  const hideNotification = useCallback(() => {
    setNotification(prev => ({
      ...prev,
      isVisible: false
    }));
  }, []);

  const showSuccess = useCallback((message, duration = 3000) => {
    showNotification(message, 'success', duration);
  }, [showNotification]);

  const showError = useCallback((message, duration = 4000) => {
    showNotification(message, 'error', duration);
  }, [showNotification]);

  const showWarning = useCallback((message, duration = 3500) => {
    showNotification(message, 'warning', duration);
  }, [showNotification]);

  const showInfo = useCallback((message, duration = 3000) => {
    showNotification(message, 'info', duration);
  }, [showNotification]);

  return {
    notification,
    showNotification,
    hideNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};

export default useNotification;

