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
  image: string;
}

interface CustomerDetails {
  name: string;
  address: string;
  whatsapp: string;
}

interface Order {
  id: string;
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
  paymentProofUrl: string;
  date: any;
  created_at: string;
  updated_at: string;
}

const ORDER_STATUS_FILTERS = [
  { key: 'all', label: 'Semua', count: 0 },
  { key: 'pending', label: 'Belum', count: 0 },
  { key: 'confirmed', label: 'Proses', count: 0 },
  { key: 'shipped', label: 'Kirim', count: 0 },
  { key: 'completed', label: 'Selesai', count: 0 },
  { key: 'cancelled', label: 'Batal', count: 0 },
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
      setOrders(data);
      filterOrders(data, selectedFilter);
      updateStatusCounts(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      Alert.alert('Error', 'Gagal memuat riwayat pesanan');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const updateStatusCounts = (orders: Order[]) => {
    const counts = { ...ORDER_STATUS_FILTERS.reduce((acc, item) => ({ ...acc, [item.key]: 0 }), {}) };
    
    orders.forEach(order => {
      counts.all = (counts.all || 0) + 1;
      switch (order.status) {
        case 'pending':
          counts.pending = (counts.pending || 0) + 1;
          break;
        case 'confirmed':
        case 'processing':
          counts.confirmed = (counts.confirmed || 0) + 1;
          break;
        case 'shipped':
          counts.shipped = (counts.shipped || 0) + 1;
          break;
        case 'completed':
          counts.completed = (counts.completed || 0) + 1;
          break;
        case 'cancelled':
          counts.cancelled = (counts.cancelled || 0) + 1;
          break;
        default:
          counts.pending = (counts.pending || 0) + 1;
      }
    });

    const updatedCounts = ORDER_STATUS_FILTERS.map(filter => ({
      ...filter,
      count: counts[filter.key] || 0
    }));
    
    setStatusCounts(updatedCounts);
  };

  const filterOrders = (orders: Order[], filter: string) => {
    if (filter === 'all') {
      setFilteredOrders(orders);
    } else {
      const filtered = orders.filter(order => {
        switch (filter) {
          case 'pending':
            return order.status === 'pending';
          case 'confirmed':
            return order.status === 'confirmed' || order.status === 'processing';
          case 'shipped':
            return order.status === 'shipped';
          case 'completed':
            return order.status === 'completed';
          case 'cancelled':
            return order.status === 'cancelled';
          default:
            return true;
        }
      });
      setFilteredOrders(filtered);
    }
  };

  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
    filterOrders(orders, filter);
  };

  const formatPrice = (price: string | number) => {
    if (typeof price === 'string') {
      // If already formatted (e.g., "Rp 930.000"), return as is
      return price;
    }
    
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (date: any) => {
    if (!date) return '';
    
    let dateObj;
    if (date.toDate) {
      dateObj = date.toDate();
    } else if (date instanceof Date) {
      dateObj = date;
    } else {
      dateObj = new Date(date);
    }
    
    return dateObj.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FF9500';
      case 'confirmed': case 'processing': return '#007AFF';
      case 'shipped': return '#5856D6';
      case 'completed': return '#34C759';
      case 'cancelled': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Belum Proses';
      case 'confirmed': case 'processing': return 'Diproses';
      case 'shipped': return 'Dikirim';
      case 'completed': return 'Selesai';
      case 'cancelled': return 'Dibatalkan';
      default: return 'Unknown';
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
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

  const renderOrderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => router.push(`/order/confirmation/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderId}>#{item.id.slice(-8).toUpperCase()}</Text>
          <Text style={styles.orderDate}>{formatDate(item.date)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      <View style={styles.orderContent}>
        <Text style={styles.customerName}>{item.customer}</Text>
        <Text style={styles.orderSummary}>
          {item.products.length} produk • {formatPrice(item.total)}
        </Text>
        <Text style={styles.paymentMethod}>
          {item.paymentMethod === 'cod' ? 'COD' : 'Transfer Bank'}
        </Text>
      </View>

      <View style={styles.orderFooter}>
        <MaterialIcons name="chevron-right" size={20} color="#C7C7CC" />
      </View>
    </TouchableOpacity>
  );

  const renderStatusFilter = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.filtersContainer}
      contentContainerStyle={styles.filtersContent}
    >
      {statusCounts.map((filter) => (
        <TouchableOpacity
          key={filter.key}
          style={[
            styles.filterTab,
            selectedFilter === filter.key && styles.filterTabActive
          ]}
          onPress={() => handleFilterChange(filter.key)}
        >
          <Text style={[
            styles.filterLabel,
            selectedFilter === filter.key && styles.filterLabelActive
          ]}>
            {filter.label}
          </Text>
          <Text style={[
            styles.filterCount,
            selectedFilter === filter.key && styles.filterCountActive
          ]}>
            {filter.count}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

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
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#1a1a1a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Riwayat Pesanan</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Memuat pesanan...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Riwayat Pesanan</Text>
      </View>

      <View style={styles.subHeader}>
        <Text style={styles.subHeaderTitle}>Pesanan Saya</Text>
        <Text style={styles.subHeaderDescription}>
          Lihat semua riwayat transaksi Anda di sini.
        </Text>
      </View>

      {renderStatusFilter()}

      {filteredOrders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="receipt-long" size={64} color="#C7C7CC" />
          <Text style={styles.emptyTitle}>Tidak ada pesanan di kategori ini</Text>
          <Text style={styles.emptyDescription}>
            Pesanan yang Anda buat akan muncul di sini
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
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
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  subHeader: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  subHeaderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subHeaderDescription: {
    fontSize: 14,
    color: '#666',
  },
  filtersContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  filtersContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterTab: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
    marginRight: 3,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    minWidth: 45,
    maxWidth: 50,
  },
  filterTabActive: {
    backgroundColor: '#007AFF',
  },
  filterLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  filterLabelActive: {
    color: '#fff',
  },
  filterCount: {
    fontSize: 9,
    fontWeight: '600',
    color: '#8E8E93',
    backgroundColor: '#fff',
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 6,
    minWidth: 14,
    textAlign: 'center',
    marginTop: 2,
  },
  filterCountActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  orderContent: {
    marginBottom: 12,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  orderSummary: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  paymentMethod: {
    fontSize: 12,
    color: '#8E8E93',
  },
  orderFooter: {
    alignItems: 'flex-end',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
  },
});