import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { db } from '../lib/firebase';

// Firebase Cloud Messaging configuration
const FCM_CONFIG = {
  vapidKey: 'BGH13OU1jN6TJk-VER5xNxMlEcdLgeoKfIw-TUCp0bTfEymMlPD6sTGKQOya3T8lQdUmUwti8hkpki7O6SWAgWg',
  privateKey: 'aT13fqvQBpY_hZgFNdoqQv6G6QY7_1ru6jtZp96sEGc',
};

class PushNotificationService {
  constructor() {
    this.expoPushToken = null;
    this.fcmToken = null;
    this.setupNotifications();
  }

  async setupNotifications() {
    try {
      // Configure notification behavior
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });

      // Register for push notifications
      await this.registerForPushNotifications();
    } catch (error) {
      console.error('❌ Error setting up notifications:', error);
    }
  }

  async registerForPushNotifications() {
    try {
      // Check if device supports push notifications
      if (!this.isDeviceSupported()) {
        console.log('❌ Push notifications are not supported on this device');
        return null;
      }

      // Set up notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('order_updates', {
          name: 'Order Updates',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#007AFF',
          sound: 'default',
          description: 'Notifikasi untuk update pesanan',
        });

        await Notifications.setNotificationChannelAsync('general', {
          name: 'General Notifications',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250],
          lightColor: '#007AFF',
          sound: 'default',
          description: 'Notifikasi umum aplikasi',
        });
      }

      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('❌ Push notification permission denied');
        return null;
      }

      console.log('✅ Push notification permission granted');

      // Get Expo push token
      const expoPushToken = await this.getExpoPushToken();
      this.expoPushToken = expoPushToken;

      console.log('🔑 Expo Push Token obtained:', expoPushToken);
      
      return expoPushToken;
    } catch (error) {
      console.error('❌ Error registering for push notifications:', error);
      return null;
    }
  }

  async getExpoPushToken() {
    try {
      // For Expo managed workflow, use project ID from app.json
      const projectId = 'orderflow-r7jsk'; // Your Firebase project ID
      
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });

      return tokenData.data;
    } catch (error) {
      console.error('❌ Error getting Expo push token:', error);
      throw error;
    }
  }

  isDeviceSupported() {
    return Platform.OS === 'ios' || Platform.OS === 'android';
  }

  async savePushTokenToFirestore(userId, token) {
    try {
      if (!userId || !token) {
        console.log('❌ Missing userId or token for saving to Firestore');
        return;
      }

      const userRef = doc(db, 'user', userId);
      await updateDoc(userRef, {
        pushTokens: arrayUnion(token),
        lastTokenUpdate: new Date(),
      });

      console.log('✅ Push token saved to Firestore for user:', userId);
    } catch (error) {
      console.error('❌ Error saving push token to Firestore:', error);
      throw error;
    }
  }

  // Send local notification (for testing)
  async sendLocalNotification(title, body, data = {}) {
    try {
      const channelId = data.type === 'order_update' ? 'order_updates' : 'general';
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
        },
        trigger: null, // Send immediately
        identifier: `local_${Date.now()}`,
        ...(Platform.OS === 'android' && { channelId }),
      });

      console.log('✅ Local notification sent:', title);
    } catch (error) {
      console.error('❌ Error sending local notification:', error);
    }
  }

  // Send push notification via Expo's push service
  async sendPushNotification(expoPushToken, title, body, data = {}) {
    try {
      if (!expoPushToken) {
        console.log('❌ No push token available');
        return;
      }

      const message = {
        to: expoPushToken,
        sound: 'default',
        title,
        body,
        data,
        channelId: data.type === 'order_update' ? 'order_updates' : 'general',
      };

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const responseData = await response.json();
      console.log('✅ Push notification sent:', responseData);
      
      return responseData;
    } catch (error) {
      console.error('❌ Error sending push notification:', error);
      throw error;
    }
  }

  // Simulate order update notification
  async sendOrderUpdateNotification(orderId, status, pushToken = null) {
    const token = pushToken || this.expoPushToken;
    
    const statusMessages = {
      'confirmed': 'Pesanan Anda telah dikonfirmasi',
      'processing': 'Pesanan Anda sedang diproses',
      'shipped': 'Pesanan Anda telah dikirim',
      'delivered': 'Pesanan Anda telah diterima',
      'cancelled': 'Pesanan Anda telah dibatalkan',
    };

    const title = 'Update Pesanan';
    const body = statusMessages[status] || `Status pesanan #${orderId} telah berubah`;
    
    const data = {
      type: 'order_update',
      orderId,
      status,
      timestamp: Date.now(),
    };

    // Send local notification for immediate feedback
    await this.sendLocalNotification(title, body, data);
    
    // Send push notification if token available
    if (token) {
      await this.sendPushNotification(token, title, body, data);
    }
  }

  // Setup notification listeners
  setupNotificationListeners() {
    // Listen for notifications received while app is foregrounded
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('📱 Notification received:', notification);
      
      // Handle foreground notification
      this.handleNotificationReceived(notification);
    });

    // Listen for user interaction with notifications
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('📱 Notification response:', response);
      
      // Handle notification tap
      this.handleNotificationResponse(response);
    });

    return {
      notificationListener,
      responseListener,
    };
  }

  handleNotificationReceived(notification) {
    // Custom logic for handling received notifications
    const { title, body, data } = notification.request.content;
    
    console.log('📨 Handling notification:', { title, body, data });
    
    // You can dispatch custom events or update global state here
  }

  handleNotificationResponse(response) {
    const { data } = response.notification.request.content;
    
    console.log('👆 User tapped notification with data:', data);
    
    // Handle navigation based on notification type
    if (data?.type === 'order_update' && data?.orderId) {
      console.log('📦 Navigate to order:', data.orderId);
      // Navigation logic will be handled by the component using this service
      return { type: 'navigate_to_order', orderId: data.orderId };
    }
    
    return { type: 'general' };
  }

  // Clean up listeners
  removeNotificationListeners(listeners) {
    if (listeners) {
      Notifications.removeNotificationSubscription(listeners.notificationListener);
      Notifications.removeNotificationSubscription(listeners.responseListener);
    }
  }

  // Get current notification settings
  async getNotificationSettings() {
    try {
      const settings = await Notifications.getPermissionsAsync();
      return {
        granted: settings.status === 'granted',
        ...settings,
      };
    } catch (error) {
      console.error('❌ Error getting notification settings:', error);
      return { granted: false };
    }
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();
export default pushNotificationService;