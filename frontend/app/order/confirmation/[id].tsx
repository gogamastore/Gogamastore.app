import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../../contexts/AuthContext';
import { orderService } from '../../../services/firestoreService';

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface CustomerDetails {
  name: string;
  address: string;
  whatsapp: string;
}

interface Order {
  id: string;
  userId: string;
  customerId: string;
  customer: string;
  customerDetails: CustomerDetails;
  products: OrderItem[];
  productIds: string[];
  total: string; // Format: "Rp 930.000"
  subtotal: number;
  shippingFee: number;
  shippingMethod: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  paymentProofUrl?: string;
  date: any;
  created_at: string;
  updated_at: string;
}

export default function OrderConfirmationScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && user) {
      fetchOrder();
    }
  }, [id, user]);

  const fetchOrder = async () => {
    try {
      const orderData = await orderService.getOrderById(id as string);
      setOrder(orderData);
    } catch (error) {
      console.error('Error fetching order:', error);
      Alert.alert('Error', 'Gagal memuat data pesanan', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/') }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number | string) => {
    // Handle both number and string formats
    if (typeof price === 'string') {
      // If already formatted (e.g., "Rp 930.000"), return as is
      if (price.includes('Rp')) return price;
      
      // Try to parse the string as number
      const numPrice = parseInt(price.replace(/[Rp\s\.,]/g, '')) || 0;
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(numPrice);
    }
    
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return { name: 'hourglass-empty', color: '#FF9500' };
      case 'confirmed':
        return { name: 'check-circle', color: '#34C759' };
      case 'processing':
        return { name: 'settings', color: '#007AFF' };
      case 'shipped':
        return { name: 'local-shipping', color: '#007AFF' };
      case 'delivered':
        return { name: 'done-all', color: '#34C759' };
      case 'cancelled':
        return { name: 'cancel', color: '#FF3B30' };
      default:
        return { name: 'help', color: '#8E8E93' };
    }
  };

  const getStatusText = (status: string) => {
    // Normalize status to lowercase for consistent comparison
    const normalizedStatus = status ? status.toLowerCase() : '';
    
    switch (normalizedStatus) {
      case 'pending':
        return 'Belum Proses';
      case 'processing':
        return 'Diproses';
      case 'shipped':
        return 'Dikirim';
      case 'delivered':
        return 'Selesai';
      case 'cancelled':
        return 'Dibatalkan';
      // Legacy status support
      case 'confirmed':
        return 'Diproses';
      case 'completed':
        return 'Selesai';
      default:
        return 'Belum Proses'; // Default to pending instead of unknown
    }
  };

  const getStatusColor = (status: string) => {
    // Normalize status to lowercase for consistent comparison
    const normalizedStatus = status ? status.toLowerCase() : '';
    
    switch (normalizedStatus) {
      case 'pending': return '#FF9500';
      case 'processing': return '#007AFF';
      case 'shipped': return '#5856D6';
      case 'delivered': return '#34C759';
      case 'cancelled': return '#FF3B30';
      // Legacy status support
      case 'confirmed': return '#007AFF';
      case 'completed': return '#34C759';
      default: return '#FF9500'; // Default to pending color
    }
  };

  const handleCancelOrder = () => {
    if (order?.status !== 'pending') {
      Alert.alert('Error', 'Hanya pesanan dengan status "Menunggu Konfirmasi" yang dapat dibatalkan');
      return;
    }

    Alert.alert(
      'Batalkan Pesanan',
      'Apakah Anda yakin ingin membatalkan pesanan ini? Tindakan ini tidak dapat dibatalkan.',
      [
        {
          text: 'Batal',
          style: 'cancel',
        },
        {
          text: 'Ya, Batalkan',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🚫 Cancelling order:', order.id);
              await orderService.updateOrderStatus(order.id, 'cancelled');
              Alert.alert(
                'Pesanan Dibatalkan', 
                'Pesanan Anda telah berhasil dibatalkan',
                [
                  {
                    text: 'OK',
                    onPress: () => router.replace('/order/history')
                  }
                ]
              );
            } catch (error) {
              console.error('Error cancelling order:', error);
              Alert.alert('Error', 'Gagal membatalkan pesanan. Silakan coba lagi.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error" size={64} color="#FF3B30" />
          <Text style={styles.errorText}>Pesanan tidak ditemukan</Text>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.replace('/(tabs)/')}
          >
            <Text style={styles.backButtonText}>Kembali ke Beranda</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const statusIcon = getStatusIcon(order.status);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/')}>
          <MaterialIcons name="home" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Konfirmasi Pesanan</Text>
        <TouchableOpacity onPress={() => router.push('/order/history')}>
          <MaterialIcons name="history" size={24} color="#1a1a1a" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Success Message */}
        <View style={styles.successSection}>
          <View style={styles.successIcon}>
            <MaterialIcons name="check-circle" size={64} color="#34C759" />
          </View>
          <Text style={styles.successTitle}>Pesanan Berhasil Dibuat!</Text>
          <Text style={styles.successSubtitle}>
            Terima kasih atas pesanan Anda. Kami akan segera memproses pesanan ini.
          </Text>
        </View>

        {/* Order Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informasi Pesanan</Text>
          <View style={styles.orderInfoRow}>
            <Text style={styles.orderInfoLabel}>Nomor Pesanan</Text>
            <Text style={styles.orderInfoValue}>{order.id}</Text>
          </View>
          <View style={styles.orderInfoRow}>
            <Text style={styles.orderInfoLabel}>Status</Text>
            <View style={styles.statusContainer}>
              <MaterialIcons 
                name={statusIcon.name as any} 
                size={16} 
                color={statusIcon.color} 
              />
              <Text style={[styles.statusText, { color: statusIcon.color }]}>
                {getStatusText(order.status)}
              </Text>
            </View>
          </View>
          <View style={styles.orderInfoRow}>
            <Text style={styles.orderInfoLabel}>Tanggal Pesanan</Text>
            <Text style={styles.orderInfoValue}>
              {new Date(order.created_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>
        </View>

        {/* Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Produk Dipesan</Text>
          {order.products && order.products.map((item) => (
            <View key={item.productId} style={styles.orderItem}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={styles.itemQuantity}>
                  {item.quantity}x {formatPrice(item.price)}
                </Text>
              </View>
              <Text style={styles.itemTotal}>
                {formatPrice(item.price * item.quantity)}
              </Text>
            </View>
          ))}
        </View>

        {/* Delivery Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informasi Pengiriman</Text>
          <View style={styles.deliveryInfo}>
            <Text style={styles.deliveryName}>{order.customerDetails.name}</Text>
            <Text style={styles.deliveryPhone}>{order.customerDetails.whatsapp}</Text>
            <Text style={styles.deliveryAddress}>
              {order.customerDetails.address}
            </Text>
          </View>
          
          <View style={styles.shippingMethod}>
            <MaterialIcons name="local-shipping" size={20} color="#007AFF" />
            <View style={styles.shippingInfo}>
              <Text style={styles.shippingName}>{order.shippingMethod}</Text>
              <Text style={styles.shippingTime}>
                {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Transfer Bank'}
              </Text>
            </View>
          </View>
        </View>

        {/* Payment Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ringkasan Pembayaran</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatPrice(order.subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Pengiriman</Text>
            <Text style={styles.summaryValue}>
              {order.shippingFee > 0 ? formatPrice(order.shippingFee) : 'Gratis'}
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Pembayaran</Text>
            <Text style={styles.totalValue}>{formatPrice(order.total)}</Text>
          </View>
        </View>

        {/* Next Steps */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Langkah Selanjutnya</Text>
          <View style={styles.nextStep}>
            <MaterialIcons name="info" size={20} color="#007AFF" />
            <Text style={styles.nextStepText}>
              Kami akan mengirimkan konfirmasi dan update status pesanan melalui notifikasi aplikasi.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {order.status === 'pending' && (
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={handleCancelOrder}
          >
            <MaterialIcons name="cancel" size={20} color="#FF3B30" />
            <Text style={styles.cancelButtonText}>Batalkan Pesanan</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[styles.secondaryButton, order.status === 'pending' && styles.buttonHalf]}
          onPress={() => router.push('/order/history')}
        >
          <MaterialIcons name="history" size={20} color="#007AFF" />
          <Text style={styles.secondaryButtonText}>Lihat Riwayat</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.primaryButton, order.status === 'pending' && styles.buttonHalf]}
          onPress={() => router.replace('/(tabs)/')}
        >
          <MaterialIcons name="home" size={20} color="#fff" />
          <Text style={styles.primaryButtonText}>Kembali Belanja</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  content: {
    flex: 1,
  },
  successSection: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 8,
  },
  successIcon: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 24,
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  orderInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  orderInfoLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  orderInfoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
    flex: 1,
    textAlign: 'right',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 12,
    color: '#666',
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  deliveryInfo: {
    marginBottom: 16,
  },
  deliveryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  deliveryPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  deliveryAddress: {
    fontSize: 14,
    color: '#1a1a1a',
    lineHeight: 20,
    marginBottom: 4,
  },
  deliveryCity: {
    fontSize: 14,
    color: '#1a1a1a',
    marginBottom: 8,
  },
  deliveryInstructions: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  shippingMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
  },
  shippingInfo: {
    marginLeft: 12,
  },
  shippingName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  shippingTime: {
    fontSize: 12,
    color: '#007AFF',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    marginTop: 8,
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  nextStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
  },
  nextStepText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 12,
    lineHeight: 20,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  cancelButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#FF3B30',
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#FFF5F5',
  },
  cancelButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  buttonHalf: {
    flex: 0.5,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    marginRight: 8,
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    marginLeft: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});