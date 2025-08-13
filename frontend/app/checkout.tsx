import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { cartService, orderService } from '../services/firestoreService';

interface CartItem {
  product_id: string;
  nama: string;
  harga: number;
  gambar: string;
  quantity: number;
}

interface Cart {
  id: string;
  user_id: string;
  items: CartItem[];
  total: number;
}

interface DeliveryInfo {
  recipientName: string;
  phoneNumber: string;
  address: string;
  city: string;
  postalCode: string;
  specialInstructions: string;
}

interface ShippingOption {
  id: string;
  name: string;
  price: number;
  estimatedDays: string;
  description: string;
}

const shippingOptions: ShippingOption[] = [
  {
    id: 'courier',
    name: 'Pengiriman oleh Kurir',
    price: 15000,
    estimatedDays: '1-3 hari',
    description: 'Pengiriman menggunakan kurir, harga mulai dari Rp 15.000/koli'
  },
  {
    id: 'pickup',
    name: 'Ambil di Toko',
    price: 0,
    estimatedDays: 'Hari ini',
    description: 'Ambil sendiri di toko, tidak ada biaya pengiriman'
  }
];

export default function CheckoutScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedShipping, setSelectedShipping] = useState<string>('courier');
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo>({
    recipientName: '',
    phoneNumber: '',
    address: '',
    city: '',
    postalCode: '',
    specialInstructions: ''
  });

  useEffect(() => {
    if (user) {
      fetchCart();
    }
  }, [user]);

  const fetchCart = async () => {
    if (!user) return;
    
    try {
      const data = await cartService.getUserCart(user.uid);
      setCart(data);
      
      if (data.items.length === 0) {
        Alert.alert('Keranjang Kosong', 'Tidak ada produk di keranjang Anda', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      Alert.alert('Error', 'Gagal memuat keranjang belanja');
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

  const getSelectedShippingOption = () => {
    return shippingOptions.find(option => option.id === selectedShipping);
  };

  const calculateSubtotal = () => {
    return cart?.total || 0;
  };

  const calculateShippingCost = () => {
    const shipping = getSelectedShippingOption();
    return shipping?.price || 0;
  };

  const calculateGrandTotal = () => {
    return calculateSubtotal() + calculateShippingCost();
  };

  const validateForm = () => {
    const { recipientName, phoneNumber, address, city, postalCode } = deliveryInfo;
    
    if (!recipientName.trim()) {
      Alert.alert('Error', 'Nama penerima wajib diisi');
      return false;
    }
    
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Nomor telepon wajib diisi');
      return false;
    }
    
    if (!address.trim()) {
      Alert.alert('Error', 'Alamat pengiriman wajib diisi');
      return false;
    }
    
    if (!city.trim()) {
      Alert.alert('Error', 'Kota wajib diisi');
      return false;
    }
    
    if (!postalCode.trim()) {
      Alert.alert('Error', 'Kode pos wajib diisi');
      return false;
    }
    
    return true;
  };

  const processOrder = async () => {
    if (!validateForm()) {
      return;
    }
    
    if (!cart) {
      Alert.alert('Error', 'Data keranjang tidak ditemukan');
      return;
    }
    
    if (!user) {
      Alert.alert('Error', 'Anda harus login terlebih dahulu');
      return;
    }
    
    try {
      setProcessing(true);
      
      // Prepare order data according to your Firestore structure
      const selectedShippingOption = getSelectedShippingOption();
      const subtotal = calculateSubtotal();
      const shippingCost = calculateShippingCost();
      const total = subtotal + shippingCost;
      
      const orderData = {
        customer: deliveryInfo.recipientName,
        customerDetails: {
          name: deliveryInfo.recipientName,
          address: deliveryInfo.address + ', ' + deliveryInfo.city + ', ' + deliveryInfo.postalCode,
          whatsapp: deliveryInfo.phoneNumber
        },
        customerId: user.uid,
        date: new Date(),
        paymentMethod: "", // Will be set in payment screen
        paymentProofUrl: "",
        paymentStatus: "Pending",
        productIds: cart.items.map(item => item.product_id || item.id),
        products: cart.items.map(item => ({
          productId: item.product_id || item.id,
          name: item.nama,
          price: item.harga,
          quantity: item.quantity,
          image: item.gambar
        })),
        shippingFee: shippingCost,
        shippingMethod: selectedShippingOption?.name || 'Pengiriman oleh Kurir',
        status: "Pending",
        subtotal: subtotal,
        total: total
      };
      
      const orderId = await orderService.createOrder(orderData);
      
      // Clear cart and go directly to order history
      await cartService.clearCart(user.uid);
      router.replace('/order/history');
      
    } catch (error) {
      console.error('Error processing order:', error);
      Alert.alert('Error', `Gagal memproses pesanan: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const updateDeliveryInfo = (field: keyof DeliveryInfo, value: string) => {
    setDeliveryInfo(prev => ({
      ...prev,
      [field]: value
    }));
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

  if (!cart || cart.items.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <MaterialIcons name="shopping-cart" size={64} color="#C7C7CC" />
          <Text style={styles.emptyTitle}>Keranjang Kosong</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Kembali Belanja</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color="#1a1a1a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={styles.headerSpace} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Order Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ringkasan Pesanan</Text>
            {cart.items.map((item) => (
              <View key={item.product_id} style={styles.orderItem}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.nama}
                  </Text>
                  <Text style={styles.itemQuantity}>
                    {item.quantity}x {formatPrice(item.harga)}
                  </Text>
                </View>
                <Text style={styles.itemTotal}>
                  {formatPrice(item.harga * item.quantity)}
                </Text>
              </View>
            ))}
          </View>

          {/* Shipping Options */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pilih Pengiriman</Text>
            {shippingOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.shippingOption,
                  selectedShipping === option.id && styles.shippingOptionSelected
                ]}
                onPress={() => setSelectedShipping(option.id)}
              >
                <View style={styles.shippingInfo}>
                  <Text style={styles.shippingName}>{option.name}</Text>
                  <Text style={styles.shippingDescription}>{option.description}</Text>
                  <Text style={styles.shippingDays}>{option.estimatedDays}</Text>
                </View>
                <Text style={styles.shippingPrice}>{formatPrice(option.price)}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Delivery Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informasi Pengiriman</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nama Penerima *</Text>
              <TextInput
                style={styles.textInput}
                value={deliveryInfo.recipientName}
                onChangeText={(value) => updateDeliveryInfo('recipientName', value)}
                placeholder="Masukkan nama penerima"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nomor Telepon *</Text>
              <TextInput
                style={styles.textInput}
                value={deliveryInfo.phoneNumber}
                onChangeText={(value) => updateDeliveryInfo('phoneNumber', value)}
                placeholder="08xxxxxxxxxx"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Alamat Lengkap *</Text>
              <TextInput
                style={[styles.textInput, styles.multilineInput]}
                value={deliveryInfo.address}
                onChangeText={(value) => updateDeliveryInfo('address', value)}
                placeholder="Jalan, RT/RW, Kelurahan, Kecamatan"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 2 }]}>
                <Text style={styles.inputLabel}>Kota *</Text>
                <TextInput
                  style={styles.textInput}
                  value={deliveryInfo.city}
                  onChangeText={(value) => updateDeliveryInfo('city', value)}
                  placeholder="Nama kota"
                />
              </View>
              
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                <Text style={styles.inputLabel}>Kode Pos *</Text>
                <TextInput
                  style={styles.textInput}
                  value={deliveryInfo.postalCode}
                  onChangeText={(value) => updateDeliveryInfo('postalCode', value)}
                  placeholder="12345"
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Catatan Khusus</Text>
              <TextInput
                style={[styles.textInput, styles.multilineInput]}
                value={deliveryInfo.specialInstructions}
                onChangeText={(value) => updateDeliveryInfo('specialInstructions', value)}
                placeholder="Instruksi khusus untuk pengiriman (opsional)"
                multiline
                numberOfLines={2}
              />
            </View>
          </View>
        </ScrollView>

        {/* Checkout Summary */}
        <View style={styles.checkoutSummary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatPrice(calculateSubtotal())}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Pengiriman</Text>
            <Text style={styles.summaryValue}>{formatPrice(calculateShippingCost())}</Text>
          </View>
          
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Pembayaran</Text>
            <Text style={styles.totalValue}>{formatPrice(calculateGrandTotal())}</Text>
          </View>

          {/* Buat Pesanan Button - Native HTML */}
          <div 
            style={{
              backgroundColor: '#007AFF',
              padding: '16px',
              borderRadius: '8px',
              margin: '16px 0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onClick={async () => {
              console.log('🛒 Buat Pesanan clicked from checkout!');
              try {
                await processOrder();
              } catch (error) {
                console.error('Order creation error:', error);
                alert('Error: ' + error.message);
              }
            }}
          >
            <span style={{ 
              color: 'white', 
              fontSize: '18px', 
              fontWeight: '600' 
            }}>
              {processing ? '⏳ Memproses...' : '🛒 Buat Pesanan'}
            </span>
          </div>

          <TouchableOpacity
            style={[styles.checkoutButton, processing && styles.checkoutButtonDisabled]}
            onPress={processOrder}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <MaterialIcons name="payment" size={20} color="#fff" />
                <Text style={styles.checkoutButtonText}>
                  Lanjut ke Pembayaran
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    marginBottom: 24,
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
  shippingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    marginBottom: 12,
  },
  shippingOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  shippingInfo: {
    flex: 1,
  },
  shippingName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  shippingDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  shippingDays: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  shippingPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  checkoutSummary: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
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
  checkoutButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  checkoutButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
});