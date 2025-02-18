import React, { createContext, useContext, useCallback } from 'react';
import { toast } from 'sonner';

type NotificationType = 'success' | 'error';

interface NotificationContextType {
  showNotification: (message: string, type: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const showNotification = useCallback((message: string, type: NotificationType) => {
    if (type === 'success') {
      toast.success(message);
    } else {
      toast.error(message);
    }
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};