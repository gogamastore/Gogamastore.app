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
import { orderService, bankAccountService, paymentProofService } from '../../services/firestoreService';

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

const bankAccounts = {
  bri_transfer: {
    bankName: 'Bank BRI',
    accountNumber: '1234-5678-9012-3456',
    accountName: 'GOGAMA STORE',
    bankCode: '002',
  },
  bni_transfer: {
    bankName: 'Bank BNI',
    accountNumber: '9876-5432-1098-7654',
    accountName: 'GOGAMA STORE',
    bankCode: '009',
  },
};

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
    const selectedMethodData = paymentMethods.find(m => m.id === selectedMethod);
    const fee = selectedMethodData?.fee || 0;
    return (orderData?.grandTotal || 0) + fee;
  };

  const copyToClipboard = (text: string, label: string) => {
    Clipboard.setString(text);
    Alert.alert('Berhasil', `${label} berhasil disalin ke clipboard`);
  };

  const processPayment = async () => {
    if (!selectedMethod || !orderData) return;
    
    setProcessing(true);
    
    try {
      const selectedBankAccount = bankAccounts.find(account => account.id === selectedMethod);
      
      // Update payment method in order
      await orderService.updatePaymentMethod(orderId as string, {
        method: selectedMethod,
        bankAccount: selectedBankAccount || null,
        status: selectedMethod === 'cod' ? 'pending_cod' : 'pending_transfer',
        fee: selectedMethod === 'cod' ? 5000 : (selectedMethod.includes('dana') || selectedMethod.includes('gopay') ? 2500 : 0),
      });
      
      if (selectedMethod === 'cod') {
        // For COD, confirm order but keep payment status as "belum bayar"
        await orderService.updateOrderStatus(orderId as string, 'confirmed');
        await orderService.updatePaymentStatus(orderId as string, 'unpaid'); // Status "belum bayar"
        router.replace(`/payment/success/${orderId}?method=cod`);
      } else if (selectedBankAccount) {
        // For bank transfers, show payment instructions
        router.push(`/payment/instructions/${orderId}?method=${selectedMethod}`);
      } else if (selectedMethod.includes('dana') || selectedMethod.includes('gopay')) {
        // For digital wallets, show payment instructions
        router.push(`/payment/instructions/${orderId}?method=${selectedMethod}`);
      }
      
    } catch (error) {
      console.error('Error processing payment:', error);
      Alert.alert('Error', 'Gagal memproses pembayaran. Silakan coba lagi.');
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
            <Text style={styles.summaryValue}>{formatPrice(orderData.grandTotal)}</Text>
          </View>
          {selectedMethod && paymentMethods.find(m => m.id === selectedMethod)?.fee > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Biaya Admin</Text>
              <Text style={styles.summaryValue}>
                {formatPrice(paymentMethods.find(m => m.id === selectedMethod)?.fee || 0)}
              </Text>
            </View>
          )}
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
            {paymentMethods
              .filter(method => method.type === 'bank_transfer')
              .map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.methodCard,
                    selectedMethod === method.id && styles.methodCardSelected
                  ]}
                  onPress={() => setSelectedMethod(method.id)}
                >
                  <View style={styles.methodInfo}>
                    <Text style={styles.methodIcon}>{method.icon}</Text>
                    <View style={styles.methodDetails}>
                      <Text style={styles.methodName}>{method.name}</Text>
                      <Text style={styles.methodDescription}>{method.description}</Text>
                      <Text style={styles.methodTime}>{method.processingTime}</Text>
                    </View>
                  </View>
                  <View style={styles.methodRight}>
                    <Text style={styles.methodFee}>
                      {method.fee === 0 ? 'Gratis' : formatPrice(method.fee)}
                    </Text>
                    <View style={[
                      styles.radioButton,
                      selectedMethod === method.id && styles.radioButtonSelected
                    ]}>
                      {selectedMethod === method.id && (
                        <View style={styles.radioButtonInner} />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
          </View>

          {/* Digital Wallets */}
          <View style={styles.methodCategory}>
            <Text style={styles.categoryTitle}>Dompet Digital</Text>
            {paymentMethods
              .filter(method => method.type === 'digital_wallet')
              .map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.methodCard,
                    selectedMethod === method.id && styles.methodCardSelected
                  ]}
                  onPress={() => setSelectedMethod(method.id)}
                >
                  <View style={styles.methodInfo}>
                    <Text style={styles.methodIcon}>{method.icon}</Text>
                    <View style={styles.methodDetails}>
                      <Text style={styles.methodName}>{method.name}</Text>
                      <Text style={styles.methodDescription}>{method.description}</Text>
                      <Text style={styles.methodTime}>{method.processingTime}</Text>
                    </View>
                  </View>
                  <View style={styles.methodRight}>
                    <Text style={styles.methodFee}>
                      {method.fee === 0 ? 'Gratis' : formatPrice(method.fee)}
                    </Text>
                    <View style={[
                      styles.radioButton,
                      selectedMethod === method.id && styles.radioButtonSelected
                    ]}>
                      {selectedMethod === method.id && (
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
            {paymentMethods
              .filter(method => method.type === 'cod')
              .map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.methodCard,
                    selectedMethod === method.id && styles.methodCardSelected
                  ]}
                  onPress={() => setSelectedMethod(method.id)}
                >
                  <View style={styles.methodInfo}>
                    <Text style={styles.methodIcon}>{method.icon}</Text>
                    <View style={styles.methodDetails}>
                      <Text style={styles.methodName}>{method.name}</Text>
                      <Text style={styles.methodDescription}>{method.description}</Text>
                      <Text style={styles.methodTime}>{method.processingTime}</Text>
                    </View>
                  </View>
                  <View style={styles.methodRight}>
                    <Text style={styles.methodFee}>
                      {method.fee === 0 ? 'Gratis' : formatPrice(method.fee)}
                    </Text>
                    <View style={[
                      styles.radioButton,
                      selectedMethod === method.id && styles.radioButtonSelected
                    ]}>
                      {selectedMethod === method.id && (
                        <View style={styles.radioButtonInner} />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
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
              <MaterialIcons name="payment" size={20} color="#fff" />
              <Text style={styles.paymentButtonText}>
                Lanjutkan Pembayaran
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