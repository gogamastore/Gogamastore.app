import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { orderService } from '../../services/firestoreService';

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface Order {
  id: string;
  customerId: string;
  customer: string;
  products: OrderItem[];
  total: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  date: any;
  customerDetails: {
    name: string;
    address: string;
    whatsapp: string;
  };
  shippingMethod: string;
  shippingFee: number;
  subtotal: number;
}

const ORDER_STATUS_FILTERS = [
  { key: 'all', label: 'Semua', count: 0 },
  { key: 'pending', label: 'Belum Proses', count: 0 },
  { key: 'confirmed', label: 'Diproses', count: 0 },
  { key: 'shipped', label: 'Dikirim', count: 0 },
  { key: 'completed', label: 'Selesai', count: 0 },
  { key: 'cancelled', label: 'Dibatalkan', count: 0 },
];

export default function OrderHistoryScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [statusCounts, setStatusCounts] = useState(ORDER_STATUS_FILTERS);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;
    
    try {
      const data = await orderService.getUserOrders(user.uid);
      setOrders(data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch (error) {
      console.error('Error fetching orders:', error);
      Alert.alert('Error', 'Gagal memuat riwayat pesanan');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
  };

  const formatPrice = (price: number) => {
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
    switch (status) {
      case 'pending':
        return 'Menunggu Konfirmasi';
      case 'confirmed':
        return 'Pesanan Dikonfirmasi';
      case 'processing':
        return 'Sedang Diproses';
      case 'shipped':
        return 'Sedang Dikirim';
      case 'delivered':
        return 'Pesanan Selesai';
      case 'cancelled':
        return 'Pesanan Dibatalkan';
      default:
        return 'Status Tidak Diketahui';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return '#34C759';
      case 'pending':
        return '#FF9500';
      case 'failed':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Sudah Dibayar';
      case 'pending':
        return 'Menunggu Pembayaran';
      case 'failed':
        return 'Pembayaran Gagal';
      default:
        return 'Status Tidak Diketahui';
    }
  };

  const renderOrderItem = ({ item }: { item: Order }) => {
    const statusIcon = getStatusIcon(item.status);
    const paymentColor = getPaymentStatusColor(item.paymentStatus);
    
    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => router.push(`/order/confirmation/${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.orderHeader}>
          <View style={styles.orderIdContainer}>
            <Text style={styles.orderIdLabel}>Pesanan</Text>
            <Text style={styles.orderId} numberOfLines={1}>
              #{item.id.slice(-8).toUpperCase()}
            </Text>
          </View>
          
          <View style={styles.orderDate}>
            <Text style={styles.orderDateText}>
              {new Date(item.created_at).toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              })}
            </Text>
          </View>
        </View>

        <View style={styles.orderContent}>
          {/* Items Summary */}
          <View style={styles.itemsSummary}>
            <Text style={styles.itemsCount}>
              {item.items.length} produk
            </Text>
            <Text style={styles.firstItemName} numberOfLines={1}>
              {item.items[0]?.nama}
              {item.items.length > 1 && ` +${item.items.length - 1} lainnya`}
            </Text>
          </View>

          {/* Status */}
          <View style={styles.statusContainer}>
            <View style={styles.orderStatusRow}>
              <MaterialIcons 
                name={statusIcon.name as any} 
                size={16} 
                color={statusIcon.color} 
              />
              <Text style={[styles.statusText, { color: statusIcon.color }]}>
                {getStatusText(item.status)}
              </Text>
            </View>
            
            <View style={styles.paymentStatusRow}>
              <MaterialIcons 
                name="payment" 
                size={16} 
                color={paymentColor} 
              />
              <Text style={[styles.paymentStatusText, { color: paymentColor }]}>
                {getPaymentStatusText(item.paymentStatus)}
              </Text>
            </View>
          </View>

          {/* Total and Action */}
          <View style={styles.orderFooter}>
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>
                {formatPrice(item.grandTotal)}
              </Text>
            </View>
            
            <TouchableOpacity
              style={styles.detailButton}
              onPress={() => router.push(`/order/confirmation/${item.id}`)}
            >
              <Text style={styles.detailButtonText}>Lihat Detail</Text>
              <MaterialIcons name="chevron-right" size={16} color="#007AFF" />
            </TouchableOpacity>
          </View>

          {/* Shipping Info */}
          <View style={styles.shippingInfo}>
            <MaterialIcons name="local-shipping" size={14} color="#666" />
            <Text style={styles.shippingText}>
              {item.shippingOption.name} • {item.shippingOption.estimatedDays}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="shopping-bag" size={64} color="#C7C7CC" />
      <Text style={styles.emptyTitle}>Belum Ada Pesanan</Text>
      <Text style={styles.emptySubtitle}>
        Pesanan yang Anda buat akan tampil di sini
      </Text>
      <TouchableOpacity 
        style={styles.shopButton}
        onPress={() => router.replace('/(tabs)/')}
      >
        <MaterialIcons name="shopping-cart" size={20} color="#fff" />
        <Text style={styles.shopButtonText}>Mulai Belanja</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color="#1a1a1a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Riwayat Pesanan</Text>
          <View style={styles.headerSpace} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Riwayat Pesanan</Text>
        <View style={styles.headerSpace} />
      </View>

      {/* Orders List */}
      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
      />
    </SafeAreaView>
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
  headerSpace: {
    width: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  orderIdContainer: {
    flex: 1,
  },
  orderIdLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  orderId: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  orderDate: {
    alignItems: 'flex-end',
  },
  orderDateText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  orderContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  itemsSummary: {
    marginBottom: 12,
  },
  itemsCount: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  firstItemName: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  orderStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  paymentStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentStatusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalContainer: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  detailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F0F8FF',
  },
  detailButtonText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
    marginRight: 4,
  },
  shippingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  shippingText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  shopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});