import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useAuth } from './AuthContext';
import pushNotificationService from '../services/pushNotificationService';
import orderNotificationService from '../services/orderNotificationService';

interface Notification {
  id: string;
  title: string;
  body: string;
  data?: any;
  timestamp: number;
  read: boolean;
  type: 'order_update' | 'general';
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  expoPushToken: string | null;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  expoPushToken: null,
  markAsRead: () => {},
  markAllAsRead: () => {},
  addNotification: () => {},
});

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    registerForPushNotificationsAsync();
    
    // Listen for incoming notifications
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('📱 Notification received:', notification);
      
      const newNotification: Notification = {
        id: Math.random().toString(36).substr(2, 9),
        title: notification.request.content.title || 'New Notification',
        body: notification.request.content.body || '',
        data: notification.request.content.data,
        timestamp: Date.now(),
        read: false,
        type: notification.request.content.data?.type || 'general',
      };
      
      addNotification(newNotification);
    });

    // Listen for notification taps
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('📱 Notification tapped:', response);
      
      // Handle notification tap action here
      const notificationData = response.notification.request.content.data;
      if (notificationData?.orderId) {
        // Navigate to order details
        console.log('Navigate to order:', notificationData.orderId);
      }
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, []);

  // Initialize with some sample notifications for demo
  useEffect(() => {
    if (user) {
      // Add sample notifications when user logs in
      const sampleNotifications: Notification[] = [
        {
          id: '1',
          title: 'Pesanan Dikonfirmasi',
          body: 'Pesanan #12345 telah dikonfirmasi dan sedang diproses',
          data: { orderId: '12345', type: 'order_update' },
          timestamp: Date.now() - 3600000, // 1 hour ago
          read: false,
          type: 'order_update',
        },
        {
          id: '2',
          title: 'Produk Baru Tersedia',
          body: 'Lihat koleksi produk terbaru yang telah ditambahkan',
          data: { type: 'general' },
          timestamp: Date.now() - 7200000, // 2 hours ago
          read: false,
          type: 'general',
        },
      ];
      
      setNotifications(sampleNotifications);
    }
  }, [user]);

  const registerForPushNotificationsAsync = async () => {
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('❌ Failed to get push token for push notification!');
        return;
      }

      const token = (await Notifications.getExpoPushTokenAsync({
        projectId: 'your-expo-project-id', // Replace with your Expo project ID
      })).data;
      
      console.log('✅ Expo push token:', token);
      setExpoPushToken(token);
      
      // TODO: Send token to your server to associate with user
      if (user) {
        console.log('📡 Registering push token for user:', user.uid);
        // You can save this token to Firebase or your backend
      }

    } catch (error) {
      console.error('❌ Error getting push notification token:', error);
    }
  };

  const addNotification = (newNotification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const notification: Notification = {
      ...newNotification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      read: false,
    };
    
    setNotifications(prev => [notification, ...prev]);
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    expoPushToken,
    markAsRead,
    markAllAsRead,
    addNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};