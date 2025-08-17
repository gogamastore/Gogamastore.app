import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useNotifications } from '../contexts/NotificationContext';
import pushNotificationService from '../services/pushNotificationService';
import orderNotificationService from '../services/orderNotificationService';

export default function NotificationsScreen() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const router = useRouter();

  const handleNotificationPress = (notification: any) => {
    // Mark as read
    markAsRead(notification.id);
    
    // Handle navigation based on notification type
    if (notification.data?.orderId) {
      router.push(`/order/confirmation/${notification.data.orderId}`);
    }
  };

  const handleTestNotification = async () => {
    try {
      // Send a test local notification
      await pushNotificationService.sendLocalNotification(
        'Test Notification',
        'This is a test notification from the app',
        { type: 'general', test: true }
      );
      
      Alert.alert('Success', 'Test notification sent!');
    } catch (error) {
      console.error('Error sending test notification:', error);
      Alert.alert('Error', 'Failed to send test notification');
    }
  };

  const handleTestOrderNotification = async () => {
    try {
      await orderNotificationService.triggerTestNotification('TEST123', 'confirmed');
      Alert.alert('Success', 'Test order notification sent!');
    } catch (error) {
      console.error('Error sending test order notification:', error);
      Alert.alert('Error', 'Failed to send test order notification');
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Baru saja';
    if (minutes < 60) return `${minutes} menit lalu`;
    if (hours < 24) return `${hours} jam lalu`;
    return `${days} hari lalu`;
  };

  const renderNotification = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !item.read && styles.unreadNotification
      ]}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.notificationIcon}>
        <MaterialIcons
          name={item.type === 'order_update' ? 'shopping-bag' : 'info'}
          size={24}
          color={item.type === 'order_update' ? '#007AFF' : '#666'}
        />
      </View>
      
      <View style={styles.notificationContent}>
        <Text style={[
          styles.notificationTitle,
          !item.read && styles.unreadText
        ]}>
          {item.title}
        </Text>
        <Text style={styles.notificationBody} numberOfLines={2}>
          {item.body}
        </Text>
        <Text style={styles.notificationTime}>
          {formatTimestamp(item.timestamp)}
        </Text>
      </View>
      
      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifikasi</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={styles.markAllRead}>Tandai Semua</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Test Buttons */}
      <View style={styles.testSection}>
        <Text style={styles.testTitle}>Test Notifications:</Text>
        <View style={styles.testButtons}>
          <TouchableOpacity 
            style={styles.testButton}
            onPress={handleTestNotification}
          >
            <Text style={styles.testButtonText}>Test General</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.testButton}
            onPress={handleTestOrderNotification}
          >
            <Text style={styles.testButtonText}>Test Order Update</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Notifications List */}
      {notifications.length > 0 ? (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.notificationsList}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="notifications-none" size={64} color="#C7C7CC" />
          <Text style={styles.emptyTitle}>Tidak ada notifikasi</Text>
          <Text style={styles.emptyDescription}>
            Notifikasi untuk pesanan dan update lainnya akan muncul di sini
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    flex: 1,
    textAlign: 'center',
  },
  markAllRead: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  testSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  testTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  testButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  testButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  notificationsList: {
    paddingVertical: 8,
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  unreadNotification: {
    backgroundColor: '#F8F9FF',
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  unreadText: {
    fontWeight: 'bold',
  },
  notificationBody: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    marginLeft: 8,
    alignSelf: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});