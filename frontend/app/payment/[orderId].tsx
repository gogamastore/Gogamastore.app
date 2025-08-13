import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { orderService, bankAccountService, paymentProofService, cartService } from '../../services/firestoreService';

interface PaymentMethod {
  id: string;
  name: string;
  type: 'bank_transfer' | 'cod' | 'digital_wallet';
  icon: string;
  description: string;
  processingTime: string;
  fee: number;
  isActive: boolean;
}

const paymentMethods: PaymentMethod[] = [
  {
    id: 'bri_transfer',
    name: 'Transfer Bank BRI',
    type: 'bank_transfer',
    icon: '🏦',
    description: 'Transfer ke rekening Bank BRI',
    processingTime: '1-24 jam',
    fee: 0,
    isActive: true,
  },
  {
    id: 'bni_transfer',
    name: 'Transfer Bank BNI',
    type: 'bank_transfer',
    icon: '🏛️',
    description: 'Transfer ke rekening Bank BNI',
    processingTime: '1-24 jam',
    fee: 0,
    isActive: true,
  },
  {
    id: 'cod',
    name: 'COD (Bayar di Tempat)',
    type: 'cod',
    icon: '💵',
    description: 'Bayar tunai saat barang diterima',
    processingTime: 'Langsung diproses',
    fee: 5000,
    isActive: true,
  },
  {
    id: 'dana',
    name: 'DANA',
    type: 'digital_wallet',
    icon: '📱',
    description: 'Transfer via DANA',
    processingTime: 'Instan',
    fee: 2500,
    isActive: true,
  },
  {
    id: 'gopay',
    name: 'GoPay',
    type: 'digital_wallet',
    icon: '🟢',
    description: 'Transfer via GoPay',
    processingTime: 'Instan',
    fee: 2500,
    isActive: true,
  },
];


export default function PaymentScreen() {
  const { orderId } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [orderData, setOrderData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    if (orderId) {
      fetchOrderData();
    }
  }, [orderId]);

  const fetchOrderData = async () => {
    try {
      const [orderData, bankAccountsData] = await Promise.all([
        orderService.getOrderById(orderId as string),
        bankAccountService.getActiveBankAccounts()
      ]);
      
      console.log('Order data:', orderData);
      console.log('Bank accounts data:', bankAccountsData);
      
      setOrderData(orderData);
      setBankAccounts(bankAccountsData);
      
      if (orderData.items.length === 0) {
        Alert.alert('Keranjang Kosong', 'Tidak ada produk di keranjang Anda', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    } catch (error) {
      console.error('Error fetching order data:', error);
      Alert.alert('Error', 'Gagal memuat data pesanan');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const calculateTotalWithFee = () => {
    // All payment methods are now free
    return (orderData?.total || 0);
  };

  const getSelectedMethodFee = () => {
    // All payment methods are now free
    return 0;
  };

  const copyToClipboard = (text: string, label: string) => {
    Clipboard.setString(text);
    Alert.alert('Berhasil', `${label} berhasil disalin ke clipboard`);
  };

  const processPayment = async () => {
    if (!selectedMethod || !orderData) return;
    
    console.log('🟡 Starting processPayment with method:', selectedMethod);
    setProcessing(true);
    
    try {
      const selectedBankAccount = bankAccounts.find(account => account.id === selectedMethod);
      console.log('🟡 Found bank account:', selectedBankAccount);
      
      // Update payment method in order (no duplicate order creation)
      console.log('🟡 Updating payment method...');
      await orderService.updatePaymentMethod(orderId as string, {
        method: selectedMethod,
        bankAccount: selectedBankAccount || null,
        status: selectedMethod === 'cod' ? 'pending_cod' : 'pending_transfer',
        fee: 0, // All methods are now free
      });
      console.log('✅ Payment method updated');
      
      // Update order status to confirmed
      console.log('🟡 Updating order status...');
      await orderService.updateOrderStatus(orderId as string, 'confirmed');
      console.log('✅ Order status updated');
      
      // Set payment status based on method
      if (selectedMethod === 'cod') {
        console.log('🟡 Setting COD payment status...');
        await orderService.updatePaymentStatus(orderId as string, 'unpaid'); // Status "belum bayar"
      } else {
        console.log('🟡 Setting bank transfer payment status...');
        await orderService.updatePaymentStatus(orderId as string, 'pending'); // Status "menunggu pembayaran"
      }
      console.log('✅ Payment status updated');
      
      // Clear cart after order is confirmed
      if (user) {
        console.log('🟡 Clearing cart...');
        await cartService.clearCart(user.uid);
        console.log('✅ Cart cleared');
      }
      
      // Navigate to order history instead of payment instructions
      console.log('🟡 Navigating to order history...');
      console.log('🟡 Current processing state:', processing);
      console.log('🟡 User state:', user ? 'authenticated' : 'not authenticated');
      
      try {
        // First attempt: Immediate navigation
        console.log('🟡 Attempting immediate navigation');
        router.replace('/order/history');
        
        // Second attempt: Delayed navigation as backup
        setTimeout(() => {
          console.log('🟡 Backup navigation attempt after 1 second');
          router.push('/(tabs)');
          setTimeout(() => {
            router.push('/order/history');
          }, 100);
        }, 1000);
        
        // Third attempt: Force navigation with window.location if on web
        setTimeout(() => {
          console.log('🟡 Final navigation attempt');
          if (typeof window !== 'undefined') {
            console.log('🟡 Using window.location for web navigation');
            window.location.href = '/order/history';
          }
        }, 2000);
        
      } catch (navigationError) {
        console.error('🔴 Navigation error:', navigationError);
        Alert.alert(
          'Pesanan Berhasil Dibuat', 
          'Pesanan Anda berhasil dibuat. Silakan periksa di menu Pesanan.',
          [
            { text: 'OK', onPress: () => router.push('/(tabs)') }
          ]
        );
      }
      
      console.log('✅ Navigation triggered');
      
    } catch (error) {
      console.error('❌ Error processing order:', error);
      Alert.alert('Error', `Gagal membuat pesanan: ${error.message}`);
    } finally {
      setProcessing(false);
    }
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

  if (!orderData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error" size={64} color="#FF3B30" />
          <Text style={styles.errorText}>Data pesanan tidak ditemukan</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Kembali</Text>
          </TouchableOpacity>
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
        <Text style={styles.headerTitle}>Pilih Pembayaran</Text>
        <View style={styles.headerSpace} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order Summary */}
        <View style={styles.orderSummary}>
          <Text style={styles.sectionTitle}>Ringkasan Pesanan</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Pesanan</Text>
            <Text style={styles.summaryValue}>{formatPrice(orderData.total || 0)}</Text>
          </View>
          
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Pembayaran</Text>
            <Text style={styles.totalValue}>{formatPrice(calculateTotalWithFee())}</Text>
          </View>
        </View>

        {/* Payment Methods */}
        <View style={styles.paymentMethods}>
          <Text style={styles.sectionTitle}>Metode Pembayaran</Text>
          
          {/* Bank Transfer */}
          <View style={styles.methodCategory}>
            <Text style={styles.categoryTitle}>Transfer Bank</Text>
            {bankAccounts.map((account) => (
              <TouchableOpacity
                key={account.id}
                style={[
                  styles.methodCard,
                  selectedMethod === account.id && styles.methodCardSelected
                ]}
                onPress={() => setSelectedMethod(account.id)}
              >
                <View style={styles.methodInfo}>
                  <Text style={styles.methodIcon}>🏦</Text>
                  <View style={styles.methodDetails}>
                    <Text style={styles.methodName}>{account.bankName}</Text>
                    <Text style={styles.methodDescription}>
                      Transfer ke rekening {account.bankName}
                    </Text>
                    <Text style={styles.methodTime}>1-24 jam</Text>
                  </View>
                </View>
                <View style={styles.methodRight}>
                  <Text style={styles.methodFee}>Gratis</Text>
                  <View style={[
                    styles.radioButton,
                    selectedMethod === account.id && styles.radioButtonSelected
                  ]}>
                    {selectedMethod === account.id && (
                      <View style={styles.radioButtonInner} />
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* COD */}
          <View style={styles.methodCategory}>
            <Text style={styles.categoryTitle}>Bayar di Tempat</Text>
            
            <TouchableOpacity
              style={[
                styles.methodCard,
                selectedMethod === 'cod' && styles.methodCardSelected
              ]}
              onPress={() => setSelectedMethod('cod')}
            >
              <View style={styles.methodInfo}>
                <Text style={styles.methodIcon}>💵</Text>
                <View style={styles.methodDetails}>
                  <Text style={styles.methodName}>COD (Bayar di Tempat)</Text>
                  <Text style={styles.methodDescription}>Bayar tunai saat barang diterima</Text>
                  <Text style={styles.methodTime}>Langsung diproses</Text>
                </View>
              </View>
              <View style={styles.methodRight}>
                <Text style={styles.methodFee}>Gratis</Text>
                <View style={[
                  styles.radioButton,
                  selectedMethod === 'cod' && styles.radioButtonSelected
                ]}>
                  {selectedMethod === 'cod' && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Payment Button */}
      <View style={styles.bottomAction}>
        <TouchableOpacity
          style={[
            styles.paymentButton,
            !selectedMethod && styles.paymentButtonDisabled
          ]}
          onPress={processPayment}
          disabled={!selectedMethod || processing}
        >
          {processing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <MaterialIcons name="shopping-cart" size={20} color="#fff" />
              <Text style={styles.paymentButtonText}>
                Buat Pesanan
              </Text>
            </>
          )}
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
  headerSpace: {
    width: 24,
  },
  content: {
    flex: 1,
  },
  orderSummary: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
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
  paymentMethods: {
    backgroundColor: '#fff',
    padding: 16,
  },
  methodCategory: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    marginBottom: 8,
  },
  methodCardSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  methodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  methodIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  methodDetails: {
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  methodDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  methodTime: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  methodRight: {
    alignItems: 'flex-end',
  },
  methodFee: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: '#007AFF',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007AFF',
  },
  bottomAction: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  paymentButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  paymentButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
});