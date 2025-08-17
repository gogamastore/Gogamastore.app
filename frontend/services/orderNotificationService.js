import { doc, updateDoc, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import pushNotificationService from './pushNotificationService';

class OrderNotificationService {
  constructor() {
    this.listeners = new Map(); // Track active listeners by user ID
  }

  // Listen for order status changes
  subscribeToOrderUpdates(userId, onOrderUpdate) {
    try {
      // Remove existing listener if any
      this.unsubscribeFromOrderUpdates(userId);

      console.log('🔔 Setting up order notification listener for user:', userId);

      // Create a query to listen to user's orders
      const ordersQuery = query(
        db.collection('orders'),
        where('customerId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      // Set up real-time listener
      const unsubscribe = onSnapshot(
        ordersQuery,
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'modified') {
              const orderData = { id: change.doc.id, ...change.doc.data() };
              
              console.log('📦 Order status changed:', orderData);
              
              // Send push notification for status updates
              this.sendOrderStatusNotification(orderData);
              
              // Call the callback with order data
              if (onOrderUpdate) {
                onOrderUpdate(orderData);
              }
            }
          });
        },
        (error) => {
          console.error('❌ Error listening to order updates:', error);
        }
      );

      // Store the unsubscribe function
      this.listeners.set(userId, unsubscribe);

      return unsubscribe;
    } catch (error) {
      console.error('❌ Error setting up order notifications:', error);
      return null;
    }
  }

  // Stop listening for order updates
  unsubscribeFromOrderUpdates(userId) {
    const listener = this.listeners.get(userId);
    if (listener) {
      console.log('🔕 Removing order notification listener for user:', userId);
      listener();
      this.listeners.delete(userId);
    }
  }

  // Send notification when order status changes
  async sendOrderStatusNotification(orderData) {
    const { id: orderId, status, paymentStatus } = orderData;
    
    try {
      let title = 'Update Pesanan';
      let body = '';
      let notificationType = 'order_update';

      // Determine notification message based on status
      switch (status?.toLowerCase()) {
        case 'confirmed':
          title = '✅ Pesanan Dikonfirmasi';
          body = `Pesanan #${orderId.slice(-6)} telah dikonfirmasi dan sedang diproses`;
          break;
        case 'processing':
          title = '⚙️ Pesanan Diproses';
          body = `Pesanan #${orderId.slice(-6)} sedang disiapkan`;
          break;
        case 'shipped':
          title = '🚚 Pesanan Dikirim';
          body = `Pesanan #${orderId.slice(-6)} dalam perjalanan ke alamat Anda`;
          break;
        case 'delivered':
          title = '📦 Pesanan Sampai';
          body = `Pesanan #${orderId.slice(-6)} telah sampai di tujuan`;
          break;
        case 'cancelled':
          title = '❌ Pesanan Dibatalkan';
          body = `Pesanan #${orderId.slice(-6)} telah dibatalkan`;
          break;
        default:
          body = `Status pesanan #${orderId.slice(-6)} telah berubah menjadi ${status}`;
      }

      // Also handle payment status changes
      if (paymentStatus) {
        switch (paymentStatus?.toLowerCase()) {
          case 'paid':
            title = '💰 Pembayaran Dikonfirmasi';
            body = `Pembayaran untuk pesanan #${orderId.slice(-6)} telah dikonfirmasi`;
            break;
          case 'pending':
            title = '⏳ Menunggu Pembayaran';
            body = `Silakan selesaikan pembayaran untuk pesanan #${orderId.slice(-6)}`;
            break;
          case 'failed':
            title = '❌ Pembayaran Gagal';
            body = `Pembayaran untuk pesanan #${orderId.slice(-6)} gagal diproses`;
            break;
        }
      }

      const notificationData = {
        type: notificationType,
        orderId,
        status,
        paymentStatus,
        timestamp: Date.now(),
      };

      // Send local notification immediately
      await pushNotificationService.sendLocalNotification(title, body, notificationData);

      // If we have the user's push token, send remote notification too
      // This would typically be retrieved from the user's profile in Firebase
      console.log('📱 Order notification sent:', { title, body, orderId });

    } catch (error) {
      console.error('❌ Error sending order notification:', error);
    }
  }

  // Manually trigger order update notification (for testing)
  async triggerTestNotification(orderId, status = 'confirmed') {
    const testOrderData = {
      id: orderId || 'TEST123',
      status: status,
      paymentStatus: 'pending',
      customerId: 'test-user',
      createdAt: new Date(),
    };

    await this.sendOrderStatusNotification(testOrderData);
  }

  // Send notification for new order creation
  async sendNewOrderNotification(orderData) {
    const { id: orderId, total } = orderData;
    
    const title = '🛒 Pesanan Berhasil Dibuat';
    const body = `Pesanan #${orderId.slice(-6)} sebesar ${this.formatPrice(total)} telah dibuat`;
    
    const notificationData = {
      type: 'order_update',
      orderId,
      status: 'created',
      timestamp: Date.now(),
    };

    await pushNotificationService.sendLocalNotification(title, body, notificationData);
  }

  // Utility function to format price
  formatPrice(price) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  }

  // Clean up all listeners
  cleanup() {
    console.log('🧹 Cleaning up order notification listeners');
    this.listeners.forEach((unsubscribe, userId) => {
      unsubscribe();
    });
    this.listeners.clear();
  }

  // Get order notification settings
  async getOrderNotificationSettings(userId) {
    try {
      // This could be stored in user preferences
      // For now, return default settings
      return {
        orderUpdates: true,
        paymentUpdates: true,
        deliveryUpdates: true,
        promotions: false, // Can be toggled by user
      };
    } catch (error) {
      console.error('❌ Error getting notification settings:', error);
      return {
        orderUpdates: true,
        paymentUpdates: true,
        deliveryUpdates: true,
        promotions: false,
      };
    }
  }

  // Update notification settings
  async updateOrderNotificationSettings(userId, settings) {
    try {
      // Save to user's profile or preferences collection
      const userRef = doc(db, 'user', userId);
      await updateDoc(userRef, {
        notificationSettings: settings,
        updatedAt: new Date(),
      });

      console.log('✅ Notification settings updated for user:', userId);
      return true;
    } catch (error) {
      console.error('❌ Error updating notification settings:', error);
      return false;
    }
  }
}

// Export singleton instance
export const orderNotificationService = new OrderNotificationService();
export default orderNotificationService;