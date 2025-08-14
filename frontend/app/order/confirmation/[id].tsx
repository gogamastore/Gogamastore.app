import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../../contexts/AuthContext';
import { orderService, paymentProofService } from '../../../services/firestoreService';

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
  const [paymentProofImage, setPaymentProofImage] = useState<string | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [hasExistingProof, setHasExistingProof] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);

  useEffect(() => {
    if (id && user) {
      fetchOrder();
      checkExistingPaymentProof();
    }
  }, [id, user]);

  const fetchOrder = async () => {
    if (!id || !user) return;
    
    try {
      console.log('📋 Fetching order data for ID:', id);
      const orderData = await orderService.getOrderById(id as string);
      setOrder(orderData);
      
      // Check if order has payment proof URL and set states accordingly
      if (orderData.paymentProofUrl) {
        console.log('🖼️ Found existing payment proof URL:', orderData.paymentProofUrl);
        setPaymentProofImage(orderData.paymentProofUrl);
        setHasExistingProof(true);
      } else {
        console.log('🔍 No payment proof URL found for this order');
        setPaymentProofImage(null);
        setHasExistingProof(false);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkExistingPaymentProof = async () => {
    if (!id) return;
    
    try {
      const proofStatus = await paymentProofService.hasPaymentProof(id as string);
      setHasExistingProof(proofStatus.hasProof);
      if (proofStatus.hasProof && proofStatus.proofUrl) {
        setPaymentProofImage(proofStatus.proofUrl);
      }
    } catch (error) {
      console.error('Error checking payment proof:', error);
    }
  };

  const pickPaymentProofImage = async () => {
    try {
      // Request permission to access media library
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        console.log('❌ Permission denied for image picker');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPaymentProofImage(result.assets[0].uri);
        console.log('✅ Payment proof image selected:', result.assets[0].uri);
        
        // Auto upload if order exists
        if (order) {
          await uploadPaymentProof(result.assets[0].uri);
        }
      }
    } catch (error) {
      console.error('❌ Error picking image:', error);
      Alert.alert('Error', 'Gagal memilih gambar. Silakan coba lagi.');
    }
  };

  const uploadPaymentProof = async (imageUri: string) => {
    if (!order || !imageUri) return;
    
    try {
      setUploadingProof(true);
      console.log('🔄 Starting payment proof upload for order:', order.id);
      
      const fileName = `payment_proof_${order.id}_${Date.now()}.jpg`;
      
      const result = await paymentProofService.uploadPaymentProof(
        order.id, 
        imageUri, 
        fileName
      );
      
      console.log('📤 Upload result:', result);
      
      if (result.success) {
        // Update local state immediately
        setHasExistingProof(true);
        setPaymentProofImage(result.downloadURL);
        
        console.log('✅ Payment proof uploaded successfully:', {
          downloadURL: result.downloadURL,
          proofId: result.proofId,
          fileName: result.fileName
        });
        
        // Show success notification
        Alert.alert(
          'Upload Berhasil!',
          'Bukti pembayaran berhasil diunggah. Silakan menunggu konfirmasi dari admin.',
          [{ text: 'OK' }]
        );
        
        // Refresh order data to get updated paymentProofUrl from Firebase
        setTimeout(async () => {
          console.log('🔄 Refreshing order data to verify paymentProofUrl...');
          await fetchOrder();
          
          // Additional verification - check if paymentProofUrl is set
          if (order?.paymentProofUrl && order.paymentProofUrl !== '') {
            console.log('✅ SUCCESS: paymentProofUrl verified in database:', order.paymentProofUrl);
          } else {
            console.warn('⚠️  WARNING: paymentProofUrl still empty in database after refresh');
          }
        }, 2000); // Give Firebase more time to update
      } else {
        throw new Error('Upload tidak berhasil');
      }
    } catch (error) {
      console.error('❌ Error uploading payment proof:', error);
      
      // Show error notification
      Alert.alert(
        'Upload Gagal',
        error.message || 'Gagal mengunggah bukti pembayaran. Silakan coba lagi.',
        [{ text: 'OK' }]
      );
      
      // Reset image if upload failed
      setPaymentProofImage(null);
      setHasExistingProof(false);
    } finally {
      setUploadingProof(false);
    }
  };

  const removePaymentProofImage = () => {
    if (!hasExistingProof) {
      setPaymentProofImage(null);
    } else {
      console.log('ℹ️ Cannot remove already uploaded payment proof');
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
    console.log('🎯 getStatusIcon called with status:', status);
    
    const statusLower = status ? status.toLowerCase() : '';
    console.log('🎯 statusLower:', statusLower);
    
    switch (statusLower) {
      case 'pending':
        return { name: 'schedule', color: '#FF9500' };
      case 'confirmed':
        return { name: 'check-circle', color: '#34C759' }; 
      case 'processing':
      case 'proses':
        return { name: 'sync', color: '#007AFF' };
      case 'shipped':
      case 'dikirim':
        return { name: 'local-shipping', color: '#5856D6' };  
      case 'delivered':
      case 'selesai':
        return { name: 'done-all', color: '#34C759' };
      case 'cancelled':
      case 'dibatalkan':
        return { name: 'cancel', color: '#FF3B30' };
      default:
        console.log('🎯 Using default icon for status:', status);
        return { name: 'info', color: '#666' };
    }
  };

  const getStatusText = (status: string) => {
    console.log('🎯 getStatusText called with status:', status);
    
    const statusLower = status ? status.toLowerCase() : '';
    
    switch (statusLower) {
      case 'pending':
        return 'Menunggu Konfirmasi';
      case 'confirmed':
        return 'Dikonfirmasi';
      case 'processing':
      case 'proses':
        return 'Diproses';
      case 'shipped':
      case 'dikirim':
        return 'Dikirim';
      case 'delivered':
      case 'selesai':
        return 'Selesai';
      case 'cancelled':
      case 'dibatalkan':
        return 'Dibatalkan';
      default:
        return status;
    }
  };

  const getSuccessMessage = (status: string) => {
    console.log('🎯 getSuccessMessage called with status:', status);
    
    const statusLower = status ? status.toLowerCase() : '';
    console.log('🎯 statusLower:', statusLower);
    
    switch (statusLower) {
      case 'pending':
        return {
          title: 'Pesanan Berhasil Dibuat!',
          subtitle: 'Terima kasih atas pesanan Anda. Kami akan segera memproses pesanan ini.'
        };
      case 'processing':
      case 'proses':
        console.log('🎯 Returning processing message');
        return {
          title: 'Pesanan Berhasil di Proses',
          subtitle: 'Terima kasih atas pesanan Anda. Kami akan segera mengirim pesanan ini.'
        };
      case 'shipped':
      case 'dikirim':
        console.log('🎯 Returning shipped message');
        return {
          title: 'Pesanan Berhasil di Kirim',
          subtitle: 'Terima kasih atas pesanan Anda.'
        };
      case 'delivered':
      case 'selesai':
        console.log('🎯 Returning delivered message');
        return {
          title: 'Pesanan Berhasil di Terima',
          subtitle: 'Terima kasih atas pesanan Anda.'
        };
      case 'cancelled':
      case 'dibatalkan':
        console.log('🎯 Returning cancelled message');
        return {
          title: 'Pesanan Berhasil di Batalkan',
          subtitle: 'Silahkan membuat pesanan baru.'
        };
      default:
        console.log('🎯 Using default message for status:', status);
        return {
          title: 'Pesanan Berhasil Dibuat!',
          subtitle: 'Terima kasih atas pesanan Anda. Kami akan segera memproses pesanan ini.'
        };
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
    if (!(order?.status === 'pending' || order?.status === 'waiting_payment' || order?.paymentStatus === 'pending')) {
      console.log('❌ Cannot cancel order with current status:', order?.status, order?.paymentStatus);
      return;
    }

    // Show custom cancel modal
    setCancelModalVisible(true);
  };

  const confirmCancelOrder = async () => {
    if (!order) return;
    
    try {
      console.log('🚫 Cancelling order:', order.id);
      setCancelModalVisible(false);
      
      await orderService.updateOrderStatus(order.id, 'cancelled');
      
      console.log('✅ Order cancelled successfully');
      router.replace('/order/history');
    } catch (error) {
      console.error('❌ Error cancelling order:', error);
      setCancelModalVisible(false);
    }
  };

  const cancelCancelOrder = () => {
    console.log('❌ Order cancel cancelled by user');
    setCancelModalVisible(false);
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

  // Debug logging for order status
  console.log('🎯 ORDER DEBUG INFO:', {
    orderId: order.id,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentProofUrl: order.paymentProofUrl,
    hasPaymentStatus: !!order.paymentStatus,
    canCancel: (order.status === 'pending' || order.status === 'waiting_payment' || order.paymentStatus === 'pending')
  });

  // Debug payment status specifically
  console.log('💳 PAYMENT STATUS DEBUG:', {
    paymentStatus: order.paymentStatus,
    typeOfPaymentStatus: typeof order.paymentStatus,
    isUndefined: order.paymentStatus === undefined,
    isNull: order.paymentStatus === null,
    isEmpty: order.paymentStatus === '',
    shouldShowUpload: order.paymentStatus === 'pending' || !order.paymentStatus,
    actualFirebasePaymentStatus: order.paymentStatus,
    paymentProofUrl: order.paymentProofUrl,
    hasPaymentProofUrl: !!order.paymentProofUrl
  });

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
            <MaterialIcons 
              name={getStatusIcon(order.status).name} 
              size={64} 
              color={getStatusIcon(order.status).color} 
            />
          </View>
          <Text style={styles.successTitle}>{getSuccessMessage(order.status).title}</Text>
          <Text style={styles.successSubtitle}>
            {getSuccessMessage(order.status).subtitle}
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

        {/* Enhanced Payment Proof Section - Show for relevant order statuses */}
        {(['pending', 'belum_proses', 'processing', 'diproses', 'shipped', 'dikirim', 'delivered', 'selesai'].includes(order.status?.toLowerCase())) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bukti Pembayaran</Text>
            
            {/* Payment Status Indicator */}
            <View style={styles.paymentStatusContainer}>
              <MaterialIcons 
                name={
                  (order.paymentStatus === 'paid') ? 'check-circle' : 
                  (order.paymentStatus === 'proof_uploaded') ? 'upload' : 'schedule'
                } 
                size={20} 
                color={
                  (order.paymentStatus === 'paid') ? '#34C759' : 
                  (order.paymentStatus === 'proof_uploaded') ? '#007AFF' : '#FF9500'
                } 
              />
              <Text style={[
                styles.paymentStatusText, 
                { color: (order.paymentStatus === 'paid') ? '#34C759' : '#FF9500' }
              ]}>
                Status Pembayaran: {
                  order.paymentStatus === 'Paid' ? 'Lunas' : 
                  order.paymentStatus === 'Unpaid' ? 'Belum Bayar' :
                  order.paymentStatus === 'paid' ? 'Lunas' :  // Legacy support
                  order.paymentStatus === 'pending' ? 'Belum Bayar' :  // Legacy support
                  !order.paymentStatus ? 'Belum Bayar' : 'Belum Bayar'
                }
              </Text>
            </View>
            
            {/* Show existing payment proof if already uploaded */}
            {(order.paymentProofUrl && order.paymentProofUrl !== '') && (
              <View style={styles.existingProofContainer}>
                <Text style={styles.existingProofTitle}>Bukti Pembayaran yang Sudah Diunggah:</Text>
                <View style={styles.existingProofImageContainer}>
                  <Image source={{ uri: order.paymentProofUrl }} style={styles.existingProofImage} />
                  <View style={styles.proofStatusBadge}>
                    <MaterialIcons 
                      name={(order.paymentStatus === 'paid') ? 'verified' : 'pending'} 
                      size={16} 
                      color="#fff" 
                    />
                    <Text style={styles.proofStatusBadgeText}>
                      {(order.paymentStatus === 'paid') ? 'Diterima' : 'Menunggu Verifikasi'}
                    </Text>
                  </View>
                </View>
              </View>
            )}
            
            {/* Show upload section if payment status is Unpaid AND no existing proof URL */}
            {(order.paymentStatus !== 'Paid' && order.paymentStatus !== 'paid' && (!order.paymentProofUrl || order.paymentProofUrl === '')) && (
              <View style={styles.uploadSection}>
                <Text style={styles.uploadSectionTitle}>Unggah Bukti Pembayaran</Text>
                <Text style={styles.uploadSectionSubtitle}>
                  Silakan unggah bukti transfer pembayaran Anda untuk mempercepat proses verifikasi pesanan
                </Text>
                
                {paymentProofImage ? (
                  <View style={styles.selectedImageContainer}>
                    <Image source={{ uri: paymentProofImage }} style={styles.selectedImage} />
                    {!hasExistingProof && (
                      <TouchableOpacity 
                        style={styles.removeImageButton} 
                        onPress={removePaymentProofImage}
                      >
                        <MaterialIcons name="close" size={16} color="#FF3B30" />
                      </TouchableOpacity>
                    )}
                    
                    {/* Upload Button */}
                    {!uploadingProof && !hasExistingProof && (
                      <TouchableOpacity 
                        style={styles.uploadConfirmButton}
                        onPress={() => uploadPaymentProof(paymentProofImage)}
                      >
                        <MaterialIcons name="cloud-upload" size={20} color="#fff" />
                        <Text style={styles.uploadConfirmButtonText}>Unggah Sekarang</Text>
                      </TouchableOpacity>
                    )}
                    
                    {/* Uploading Indicator */}
                    {uploadingProof && (
                      <View style={styles.uploadingContainer}>
                        <ActivityIndicator size="small" color="#007AFF" />
                        <Text style={styles.uploadingText}>Mengunggah bukti pembayaran...</Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={styles.selectImageButton} 
                    onPress={pickPaymentProofImage}
                    disabled={uploadingProof}
                  >
                    <MaterialIcons name="photo-library" size={24} color="#007AFF" />
                    <Text style={styles.selectImageButtonText}>
                      Pilih Gambar dari Galeri
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            
            {/* Information for paid status */}
            {order.paymentStatus === 'paid' && (
              <View style={styles.paidStatusInfo}>
                <MaterialIcons name="info" size={20} color="#007AFF" />
                <Text style={styles.paidStatusInfoText}>
                  Pembayaran Anda telah dikonfirmasi. Pesanan sedang diproses.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Cancel Order Section - For Orders that can be cancelled */}
        {(order.status === 'pending' || order.paymentStatus === 'Unpaid' || !order.paymentStatus || order.paymentStatus === '') && order.paymentStatus !== 'Paid' && order.paymentStatus !== 'paid' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Batalkan Pesanan</Text>
            <TouchableOpacity 
              style={styles.cancelOrderSection}
              onPress={handleCancelOrder}
            >
              <MaterialIcons name="cancel" size={20} color="#FF3B30" />
              <Text style={styles.cancelOrderSectionText}>
                Batalkan pesanan ini jika Anda sudah tidak memerlukan produk ini lagi.
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {(order.status === 'pending' || order.paymentStatus === 'pending' || !order.paymentStatus || order.paymentStatus === '' || order.paymentStatus === 'proof_uploaded') && order.paymentStatus !== 'paid' && (
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

      {/* Cancel Order Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={cancelModalVisible}  
        onRequestClose={cancelCancelOrder}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Batalkan Pesanan</Text>
            <Text style={styles.modalMessage}>
              Apakah Anda yakin ingin membatalkan pesanan ini? Tindakan ini tidak dapat dibatalkan.
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={cancelCancelOrder}
              >
                <Text style={styles.cancelButtonText}>Batal</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]} 
                onPress={confirmCancelOrder}
              >
                <Text style={styles.confirmButtonText}>Ya, Batalkan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  cancelOrderSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  cancelOrderSectionText: {
    fontSize: 14,
    color: '#FF3B30',
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
  // Payment Proof Styles
  paymentProofContainer: {
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  paymentProofDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
    textAlign: 'center',
  },
  paymentProofSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    borderRadius: 8,
    backgroundColor: '#F0F8FF',
  },
  uploadButtonText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 8,
    fontWeight: '500',
  },
  selectedImageContainer: {
    position: 'relative',
    alignSelf: 'center',
    marginBottom: 12,
  },
  selectedImage: {
    width: 200,
    height: 120,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  proofStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  proofStatusText: {
    fontSize: 14,
    color: '#34C759',
    marginLeft: 8,
    fontWeight: '500',
  },
  uploadConfirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    marginTop: 12,
  },
  uploadConfirmButtonText: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 8,
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButton: {
    backgroundColor: '#FF3B30',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Enhanced Payment Proof Styles
  paymentStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    marginBottom: 16,
  },
  paymentStatusText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  existingProofContainer: {
    marginBottom: 20,
  },
  existingProofTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  existingProofImageContainer: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  existingProofImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
  },
  proofStatusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  proofStatusBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  uploadSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  uploadSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  uploadSectionSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  selectImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderStyle: 'dashed',
  },
  selectImageButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    marginTop: 12,
  },
  uploadingText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 8,
  },
  paidStatusInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    marginTop: 12,
  },
  paidStatusInfoText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 8,
    lineHeight: 20,
    flex: 1,
  },
});