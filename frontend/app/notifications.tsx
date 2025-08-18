import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';

interface OrderNotification {
  id: string;
  orderId: string;
  title: string;
  message: string;
  status: string;
  timestamp: number;
  read: boolean;
  type: 'order_status' | 'payment_status' | 'general';
  orderData?: any;
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const { markAllAsRead } = useNotifications();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      setupOrderNotificationsListener();
    }
  }, [user]);

  const setupOrderNotificationsListener = () => {
    if (!user?.uid) return;

    setLoading(true);
    console.log('📱 Setting up real-time order notifications listener...');

    // Try multiple queries to find orders with different field structures
    const queries = [
      // Try customerId field with created_at ordering
      query(
        collection(db, 'orders'),
        where('customerId', '==', user.uid),
        orderBy('created_at', 'desc')
      ),
      // Try userId field with created_at ordering
      query(
        collection(db, 'orders'),
        where('userId', '==', user.uid),
        orderBy('created_at', 'desc')
      ),
      // Try customerId field with updated_at ordering
      query(
        collection(db, 'orders'),
        where('customerId', '==', user.uid),
        orderBy('updated_at', 'desc')
      ),
      // Try userId field with updated_at ordering
      query(
        collection(db, 'orders'),
        where('userId', '==', user.uid),
        orderBy('updated_at', 'desc')
      ),
      // Fallback: simple query without ordering
      query(
        collection(db, 'orders'),
        where('customerId', '==', user.uid)
      )
    ];

    let unsubscribeFunction = null;

    // Try each query until one works
    const tryQuery = async (queryIndex = 0) => {
      if (queryIndex >= queries.length) {
        console.error('❌ All notification queries failed');
        setLoading(false);
        Alert.alert('Error', 'Gagal memuat notifikasi pesanan. Pastikan koneksi internet Anda stabil.');
        return;
      }

      const currentQuery = queries[queryIndex];
      console.log(`🔍 Trying notification query ${queryIndex + 1}/${queries.length}`);

      try {
        unsubscribeFunction = onSnapshot(
          currentQuery,
          (snapshot) => {
            console.log(`✅ Query ${queryIndex + 1} succeeded! Found ${snapshot.docs.length} orders`);
            
            const orderNotifications: OrderNotification[] = [];
            
            snapshot.forEach((doc) => {
              const orderData = doc.data();
              const orderId = doc.id;
              
              // Create notification based on order status
              if (orderData.status || orderData.paymentStatus) {
                const notification = createNotificationFromOrder(orderId, orderData);
                if (notification) {
                  orderNotifications.push(notification);
                }
              }
            });

            // Sort notifications by timestamp (newest first)
            const sortedNotifications = orderNotifications.sort((a, b) => b.timestamp - a.timestamp);
            
            setNotifications(sortedNotifications);
            setLoading(false);
            
            console.log(`✅ Loaded ${sortedNotifications.length} order notifications`);
          },
          (error) => {
            console.warn(`⚠️ Query ${queryIndex + 1} failed:`, error.code, error.message);
            
            // If this query failed, try the next one
            if (queryIndex < queries.length - 1) {
              setTimeout(() => tryQuery(queryIndex + 1), 500);
            } else {
              console.error('❌ All notification queries failed');
              setLoading(false);
              Alert.alert('Error', 'Gagal memuat notifikasi pesanan');
            }
          }
        );
      } catch (error) {
        console.warn(`⚠️ Query ${queryIndex + 1} setup failed:`, error);
        setTimeout(() => tryQuery(queryIndex + 1), 500);
      }
    };

    // Start trying queries
    tryQuery();

    return unsubscribeFunction;
  };

  const createNotificationFromOrder = (orderId: string, orderData: any): OrderNotification | null => {
    const status = orderData.status?.toLowerCase();
    const paymentStatus = orderData.paymentStatus?.toLowerCase();
    
    // Handle various timestamp formats
    let timestamp = Date.now(); // Default to current time
    
    if (orderData.updated_at) {
      if (typeof orderData.updated_at === 'string') {
        timestamp = new Date(orderData.updated_at).getTime();
      } else if (orderData.updated_at.seconds) {
        timestamp = orderData.updated_at.seconds * 1000;
      } else if (orderData.updated_at.toDate) {
        timestamp = orderData.updated_at.toDate().getTime();
      }
    } else if (orderData.created_at) {
      if (typeof orderData.created_at === 'string') {
        timestamp = new Date(orderData.created_at).getTime();
      } else if (orderData.created_at.seconds) {
        timestamp = orderData.created_at.seconds * 1000;
      } else if (orderData.created_at.toDate) {
        timestamp = orderData.created_at.toDate().getTime();
      }
    } else if (orderData.createdAt) {
      if (typeof orderData.createdAt === 'string') {
        timestamp = new Date(orderData.createdAt).getTime();
      } else if (orderData.createdAt.seconds) {
        timestamp = orderData.createdAt.seconds * 1000;
      } else if (orderData.createdAt.toDate) {
        timestamp = orderData.createdAt.toDate().getTime();
      }
    }
    
    // Make sure timestamp is valid
    if (isNaN(timestamp)) {
      timestamp = Date.now();
    }
    
    let title = '';
    let message = '';
    let type: 'order_status' | 'payment_status' | 'general' = 'order_status';
    
    // Generate notification based on order status
    switch (status) {
      case 'confirmed':
        title = '✅ Pesanan Dikonfirmasi';
        message = `Pesanan #${orderId.slice(-6)} telah dikonfirmasi dan sedang diproses`;
        break;
      case 'processing':
        title = '⚙️ Pesanan Diproses';
        message = `Pesanan #${orderId.slice(-6)} sedang disiapkan oleh penjual`;
        break;
      case 'shipped':
        title = '🚚 Pesanan Dikirim';
        message = `Pesanan #${orderId.slice(-6)} dalam perjalanan ke alamat Anda`;
        break;
      case 'delivered':
        title = '📦 Pesanan Sampai';
        message = `Pesanan #${orderId.slice(-6)} telah sampai di tujuan`;
        break;
      case 'cancelled':
        title = '❌ Pesanan Dibatalkan';
        message = `Pesanan #${orderId.slice(-6)} telah dibatalkan`;
        break;
      case 'pending':
        title = '⏳ Pesanan Menunggu';
        message = `Pesanan #${orderId.slice(-6)} sedang menunggu konfirmasi`;
        break;
      default:
        // Check payment status if order status is not available
        if (paymentStatus) {
          type = 'payment_status';
          switch (paymentStatus) {
            case 'paid':
              title = '💰 Pembayaran Dikonfirmasi';
              message = `Pembayaran untuk pesanan #${orderId.slice(-6)} telah dikonfirmasi`;
              break;
            case 'pending':
              title = '⏳ Menunggu Pembayaran';
              message = `Silakan selesaikan pembayaran untuk pesanan #${orderId.slice(-6)}`;
              break;
            case 'unpaid':
              title = '💳 Belum Dibayar';
              message = `Pesanan #${orderId.slice(-6)} masih menunggu pembayaran`;
              break;
            case 'failed':
              title = '❌ Pembayaran Gagal';
              message = `Pembayaran untuk pesanan #${orderId.slice(-6)} gagal diproses`;
              break;
            default:
              return null;
          }
        } else {
          return null;
        }
    }
    
    return {
      id: `${orderId}_${status || paymentStatus}_${timestamp}`,
      orderId,
      title,
      message,
      status: status || paymentStatus || 'unknown',
      timestamp,
      read: false, // All notifications start as unread
      type,
      orderData
    };
  };

  const handleNotificationPress = async (notification: OrderNotification) => {
    try {
      // Mark notification as read (you can implement this in Firestore if needed)
      setNotifications(prev => 
        prev.map(n => 
          n.id === notification.id ? { ...n, read: true } : n
        )
      );
      
      // Navigate to order details
      if (notification.orderId) {
        router.push(`/order/confirmation/${notification.orderId}`);
      }
    } catch (error) {
      console.error('Error handling notification press:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
      
      // You can also update read status in Firestore if you store notifications there
      markAllAsRead();
      
      Alert.alert('Sukses', 'Semua notifikasi telah ditandai sudah dibaca');
    } catch (error) {
      console.error('Error marking all as read:', error);
      Alert.alert('Error', 'Gagal menandai notifikasi sebagai dibaca');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // The listener will automatically update the data
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
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
    if (days === 1) return 'Kemarin';
    if (days < 7) return `${days} hari lalu`;
    return new Date(timestamp).toLocaleDateString('id-ID');
  };

  const getNotificationIcon = (type: string, status: string) => {
    if (type === 'payment_status') {
      switch (status) {
        case 'paid': return 'payment';
        case 'pending': return 'schedule';
        case 'failed': return 'error';
        default: return 'account-balance-wallet';
      }
    }
    
    switch (status) {
      case 'confirmed': return 'check-circle';
      case 'processing': return 'settings';
      case 'shipped': return 'local-shipping';
      case 'delivered': return 'inbox';
      case 'cancelled': return 'cancel';
      case 'pending': return 'schedule';
      default: return 'notifications';
    }
  };

  const getNotificationColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'paid': return '#4CAF50';
      case 'processing': return '#FF9800';
      case 'shipped': return '#2196F3';
      case 'delivered': return '#4CAF50';
      case 'cancelled':
      case 'failed': return '#F44336';
      case 'pending': return '#9E9E9E';
      default: return '#666';
    }
  };

  const renderNotification = ({ item }: { item: OrderNotification }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !item.read && styles.unreadNotification
      ]}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.7}
    >
      <View style={[
        styles.notificationIcon,
        { backgroundColor: getNotificationColor(item.status) + '20' }
      ]}>
        <MaterialIcons
          name={getNotificationIcon(item.type, item.status) as any}
          size={24}
          color={getNotificationColor(item.status)}
        />
      </View>
      
      <View style={styles.notificationContent}>
        <Text style={[
          styles.notificationTitle,
          !item.read && styles.unreadText
        ]}>
          {item.title}
        </Text>
        <Text style={styles.notificationMessage} numberOfLines={2}>
          {item.message}
        </Text>
        <Text style={styles.notificationTime}>
          {formatTimestamp(item.timestamp)}
        </Text>
      </View>
      
      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color="#1a1a1a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifikasi</Text>
          <View style={{ width: 24 }} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Memuat notifikasi pesanan...</Text>
        </View>
      </View>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifikasi Pesanan</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={styles.markAllRead}>Tandai Semua</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Notifications List */}
      {notifications.length > 0 ? (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.notificationsList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="notifications-none" size={64} color="#C7C7CC" />
          <Text style={styles.emptyTitle}>Tidak ada notifikasi pesanan</Text>
          <Text style={styles.emptyDescription}>
            Notifikasi update status pesanan Anda akan muncul di sini
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
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
    alignItems: 'flex-start',
  },
  unreadNotification: {
    backgroundColor: '#F8F9FF',
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
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
    marginTop: 8,
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