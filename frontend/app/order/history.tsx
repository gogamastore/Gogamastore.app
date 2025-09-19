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
  const [selectedFilter, setSelectedFilter] = useState('pending');
  const [statusCounts, setStatusCounts] = useState(ORDER_STATUS_FILTERS);

  useEffect(() => {
    console.log('🔄 Order History useEffect triggered');
    console.log('👤 User state:', user ? 'authenticated' : 'not authenticated');
    
    if (user) {
      console.log('✅ User authenticated, fetching orders...');
      fetchOrders();
    } else {
      console.log('❌ No authenticated user, skipping fetch');
      setLoading(false);
    }
  }, [user]);

  const fetchOrders = async () => {
    if (!user) {
      console.log('❌ No user in fetchOrders, returning');
      return;
    }
    
    console.log('🔍 Starting fetchOrders...');
    console.log('👤 User UID:', user.uid);
    console.log('📧 User Email:', user.email);
    
    try {
      setLoading(true);
      console.log('🔍 Fetching orders for user:', user.uid);
      console.log('📱 User auth object:', user);
      
      const data = await orderService.getUserOrders(user.uid);
      console.log('📋 Orders fetched successfully');
      console.log('📦 Number of orders:', data.length);
      console.log('📄 Orders data:', JSON.stringify(data, null, 2));
      
      setOrders(data);
      filterOrders(data, selectedFilter);
      updateStatusCounts(data);
      
      if (data.length === 0) {
        console.log('❌ No orders found for user:', user.uid);
        console.log('💡 Check Firestore rules and order documents structure');
      } else {
        console.log('✅ Orders loaded successfully');
      }
    } catch (error) {
      console.error('❌ Error fetching orders:', error);
      console.error('❌ Error details:', error.message);
      console.error('❌ Error stack:', error.stack);
      
      Alert.alert(
        'Error', 
        'Gagal memuat riwayat pesanan. Silakan coba lagi.\n\nDetail: ' + error.message
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const updateStatusCounts = (orders: Order[]) => {
    const counts = { ...ORDER_STATUS_FILTERS.reduce((acc, item) => ({ ...acc, [item.key]: 0 }), {}) };
    
    orders.forEach(order => {
      // Normalize status to lowercase for consistent comparison
      const normalizedStatus = order.status ? order.status.toLowerCase() : '';
      
      switch (normalizedStatus) {
        case 'pending':
          counts.pending = (counts.pending || 0) + 1;
          break;
        case 'processing':
          counts.confirmed = (counts.confirmed || 0) + 1;
          break;
        case 'shipped':
          counts.shipped = (counts.shipped || 0) + 1;
          break;
        case 'delivered':
          counts.completed = (counts.completed || 0) + 1;
          break;
        case 'cancelled':
          counts.cancelled = (counts.cancelled || 0) + 1;
          break;
        // Legacy status support
        case 'confirmed':
          counts.confirmed = (counts.confirmed || 0) + 1;
          break;
        case 'completed':
          counts.completed = (counts.completed || 0) + 1;
          break;
        default:
          console.log('📊 Unknown status found:', order.status);
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
    const filtered = orders.filter(order => {
      // Normalize status to lowercase for consistent comparison
      const normalizedStatus = order.status ? order.status.toLowerCase() : '';
      
      switch (filter) {
        case 'pending':
          return normalizedStatus === 'pending';
        case 'confirmed':
          // Map to "processing" status from Firebase
          return normalizedStatus === 'processing' || normalizedStatus === 'confirmed';
        case 'shipped':
          return normalizedStatus === 'shipped';
        case 'completed':
          // Map to "delivered" status from Firebase
          return normalizedStatus === 'delivered' || normalizedStatus === 'completed';
        case 'cancelled':
          return normalizedStatus === 'cancelled';
        default:
          return normalizedStatus === 'pending'; // default to pending if unknown filter
      }
    });
    setFilteredOrders(filtered);
  };

  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
    filterOrders(orders, filter);
  };

  const formatPrice = (price: string | number) => {
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
      default: return '#8E8E93';
    }
  };

  const getStatusText = (status: string) => {
    // Normalize status to lowercase for consistent comparison
    const normalizedStatus = status ? status.toLowerCase() : '';
    
    switch (normalizedStatus) {
      case 'pending': return 'Belum Proses';
      case 'processing': return 'Diproses';
      case 'shipped': return 'Dikirim';
      case 'delivered': return 'Selesai';
      case 'cancelled': return 'Dibatalkan';
      // Legacy status support
      case 'confirmed': return 'Diproses';
      case 'completed': return 'Selesai';
      default: return 'Status Tidak Diketahui';
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
  };

  const handleCancelOrder = (order: Order) => {
    if (order.status !== 'pending') {
      Alert.alert('Error', 'Hanya pesanan dengan status "Belum Proses" yang dapat dibatalkan');
      return;
    }

    Alert.alert(
      'Batalkan Pesanan',
      `Apakah Anda yakin ingin membatalkan pesanan #${order.id.slice(-8).toUpperCase()}? 

Pesanan akan dibatalkan dan stok produk akan dikembalikan otomatis.

Tindakan ini tidak dapat dibatalkan.`,
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
              console.log('🚫 Cancelling order and restoring stock:', order.id);
              console.log('📦 Products in order:', order.products);
              console.log('📊 Order details:', {
                orderId: order.id,
                status: order.status,
                productsCount: order.products?.length || 0,
                products: order.products?.map(p => ({
                  productId: p.productId,
                  name: p.name,
                  quantity: p.quantity
                }))
              });
              
              // Use the new function that cancels order and restores stock
              const result = await orderService.cancelOrderAndRestoreStock(order.id);
              console.log('✅ Cancel order result:', result);
              
              Alert.alert(
                'Pesanan Dibatalkan', 
                'Pesanan Anda telah berhasil dibatalkan dan stok produk telah dikembalikan.',
                [{ text: 'OK' }]
              );
              
              // Refresh orders after cancellation
              await fetchOrders();
            } catch (error) {
              console.error('❌ Error cancelling order:', error);
              console.error('❌ Error details:', {
                message: error.message,
                stack: error.stack,
                orderId: order.id
              });
              
              let errorMessage = 'Gagal membatalkan pesanan. Silakan coba lagi.';
              
              if (error.message.includes('already cancelled')) {
                errorMessage = 'Pesanan sudah dibatalkan sebelumnya.';
              } else if (error.message.includes('shipped') || error.message.includes('delivered')) {
                errorMessage = 'Tidak dapat membatalkan pesanan yang sudah dikirim atau sampai.';
              } else if (error.message.includes('Order not found')) {
                errorMessage = 'Pesanan tidak ditemukan.';
              }
              
              Alert.alert('Error', errorMessage);
            }
          },
        },
      ]
    );
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
        {/* Tombol Batalkan Pesanan dihilangkan - Admin yang bertindak untuk membatalkan */}
        <View style={{ flex: 1 }} />
        <MaterialIcons name="chevron-right" size={20} color="#C7C7CC" />
      </View>
    </TouchableOpacity>
  );

  const renderStatusFilter = () => (
    <View style={styles.filtersContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContent}
        style={styles.filtersScrollView}
      >
        {statusCounts.map((filter) => {
          // Set different widths for different tabs
          let tabWidth = 75; // default width
          if (filter.key === 'pending') {
            tabWidth = 90; // wider for "Belum Proses"
          } else if (filter.key === 'cancelled') {
            tabWidth = 82; // wider for "Dibatalkan"
          } else {
            tabWidth = 68; // smaller for others: "Diproses", "Dikirim", "Selesai"
          }
          
          return (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterTab,
                { width: tabWidth },
                selectedFilter === filter.key && styles.filterTabActive,
              ]}
              onPress={() => handleFilterChange(filter.key)}
            >
              <Text style={[
                styles.filterLabel,
                selectedFilter === filter.key && styles.filterLabelActive,
              ]}>
                {filter.label}
              </Text>
              <Text style={[
                styles.filterCount,
                selectedFilter === filter.key && styles.filterCountActive,
              ]}>
                {filter.count}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="receipt-long" size={64} color="#C7C7CC" />
      <Text style={styles.emptyTitle}>
        {selectedFilter === 'all' ? 'Belum Ada Pesanan' : 'Tidak ada pesanan di kategori ini'}
      </Text>
      <Text style={styles.emptyDescription}>
        {selectedFilter === 'all' ? 
          'Pesanan yang Anda buat akan muncul di sini. Mulai berbelanja sekarang!' : 
          'Pesanan yang Anda buat akan muncul di sini'
        }
      </Text>
      {selectedFilter === 'all' && (
        <TouchableOpacity 
          style={styles.shopButton}
          onPress={() => router.replace('/(tabs)/')}
        >
          <MaterialIcons name="shopping-cart" size={20} color="#fff" />
          <Text style={styles.shopButtonText}>Mulai Belanja</Text>
        </TouchableOpacity>
      )}
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
        <View style={{ width: 24 }} />
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
    paddingVertical: 8,
    height: 70,
  },
  filtersScrollView: {
    flex: 1,
  },
  filtersContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  filterTab: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    marginRight: 6,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    height: 50,
  },
  filterTabActive: {
    backgroundColor: '#007AFF',
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 2,
    numberOfLines: 1,
  },
  filterLabelActive: {
    color: '#fff',
  },
  filterCount: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8E8E93',
    backgroundColor: '#fff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 20,
    textAlign: 'center',
    overflow: 'hidden',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cancelOrderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  cancelOrderText: {
    fontSize: 12,
    color: '#FF3B30',
    fontWeight: '600',
    marginLeft: 4,
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
    marginBottom: 24,
  },
  shopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  shopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});