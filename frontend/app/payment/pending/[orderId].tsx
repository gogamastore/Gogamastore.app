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

export default function PaymentPendingScreen() {
  const { orderId } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [orderData, setOrderData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      fetchOrderData();
    }
  }, [orderId]);

  const fetchOrderData = async () => {
    try {
      const data = await orderService.getOrderById(orderId as string);
      setOrderData(data);
    } catch (error) {
      console.error('Error fetching order:', error);
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/')}>
          <MaterialIcons name="home" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Status Pembayaran</Text>
        <TouchableOpacity onPress={() => router.push('/order/history')}>
          <MaterialIcons name="history" size={24} color="#1a1a1a" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Section */}
        <View style={styles.statusSection}>
          <View style={styles.statusIcon}>
            <MaterialIcons name="schedule" size={64} color="#FF9500" />
          </View>
          <Text style={styles.statusTitle}>Menunggu Verifikasi</Text>
          <Text style={styles.statusSubtitle}>
            Pembayaran Anda sedang diverifikasi oleh sistem kami
          </Text>
        </View>

        {/* Order Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informasi Pesanan</Text>
          <View style={styles.orderInfoRow}>
            <Text style={styles.orderInfoLabel}>Nomor Pesanan</Text>
            <Text style={styles.orderInfoValue}>{orderData.id}</Text>
          </View>
          <View style={styles.orderInfoRow}>
            <Text style={styles.orderInfoLabel}>Total Pembayaran</Text>
            <Text style={styles.orderInfoValue}>{formatPrice(orderData.grandTotal)}</Text>
          </View>
          <View style={styles.orderInfoRow}>
            <Text style={styles.orderInfoLabel}>Status Pembayaran</Text>
            <View style={styles.statusContainer}>
              <MaterialIcons name="schedule" size={16} color="#FF9500" />
              <Text style={[styles.statusText, { color: '#FF9500' }]}>
                Menunggu Verifikasi
              </Text>
            </View>
          </View>
          <View style={styles.orderInfoRow}>
            <Text style={styles.orderInfoLabel}>Waktu Transfer</Text>
            <Text style={styles.orderInfoValue}>
              {new Date().toLocaleString('id-ID')}
            </Text>
          </View>
        </View>

        {/* Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status Pesanan</Text>
          <View style={styles.timeline}>
            <View style={styles.timelineItem}>
              <View style={[styles.timelineIcon, styles.timelineIconCompleted]}>
                <MaterialIcons name="check" size={16} color="#fff" />
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Pesanan Dibuat</Text>
                <Text style={styles.timelineTime}>
                  {new Date(orderData.created_at).toLocaleString('id-ID')}
                </Text>
              </View>
            </View>

            <View style={styles.timelineItem}>
              <View style={[styles.timelineIcon, styles.timelineIconActive]}>
                <MaterialIcons name="schedule" size={16} color="#fff" />
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Menunggu Verifikasi Pembayaran</Text>
                <Text style={styles.timelineTime}>Sedang diproses...</Text>
              </View>
            </View>

            <View style={styles.timelineItem}>
              <View style={styles.timelineIcon}>
                <MaterialIcons name="inventory" size={16} color="#C7C7CC" />
              </View>
              <View style={styles.timelineContent}>
                <Text style={[styles.timelineTitle, styles.timelineInactive]}>
                  Sedang Dikemas
                </Text>
                <Text style={[styles.timelineTime, styles.timelineInactive]}>
                  Menunggu pembayaran
                </Text>
              </View>
            </View>

            <View style={styles.timelineItem}>
              <View style={styles.timelineIcon}>
                <MaterialIcons name="local-shipping" size={16} color="#C7C7CC" />
              </View>
              <View style={styles.timelineContent}>
                <Text style={[styles.timelineTitle, styles.timelineInactive]}>
                  Sedang Dikirim
                </Text>
                <Text style={[styles.timelineTime, styles.timelineInactive]}>
                  Menunggu pembayaran
                </Text>
              </View>
            </View>

            <View style={styles.timelineItem}>
              <View style={styles.timelineIcon}>
                <MaterialIcons name="done-all" size={16} color="#C7C7CC" />
              </View>
              <View style={styles.timelineContent}>
                <Text style={[styles.timelineTitle, styles.timelineInactive]}>
                  Pesanan Selesai
                </Text>
                <Text style={[styles.timelineTime, styles.timelineInactive]}>
                  Menunggu pembayaran
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Verification Process */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Proses Verifikasi</Text>
          <View style={styles.verificationInfo}>
            <View style={styles.verificationItem}>
              <MaterialIcons name="schedule" size={20} color="#FF9500" />
              <Text style={styles.verificationText}>
                Verifikasi pembayaran biasanya membutuhkan waktu 1-3 jam kerja
              </Text>
            </View>
            <View style={styles.verificationItem}>
              <MaterialIcons name="notifications" size={20} color="#007AFF" />
              <Text style={styles.verificationText}>
                Anda akan menerima notifikasi setelah pembayaran berhasil diverifikasi
              </Text>
            </View>
            <View style={styles.verificationItem}>
              <MaterialIcons name="support" size={20} color="#34C759" />
              <Text style={styles.verificationText}>
                Hubungi customer service jika tidak ada konfirmasi dalam 24 jam
              </Text>
            </View>
          </View>
        </View>

        {/* Contact Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Butuh Bantuan?</Text>
          <TouchableOpacity style={styles.supportButton}>
            <MaterialIcons name="support" size={20} color="#007AFF" />
            <Text style={styles.supportButtonText}>Hubungi Customer Service</Text>
            <MaterialIcons name="chevron-right" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => router.push('/order/history')}
        >
          <MaterialIcons name="history" size={20} color="#007AFF" />
          <Text style={styles.secondaryButtonText}>Lihat Semua Pesanan</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={() => router.replace('/(tabs)/')}
        >
          <MaterialIcons name="shopping-cart" size={20} color="#fff" />
          <Text style={styles.primaryButtonText}>Belanja Lagi</Text>
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
  statusSection: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 8,
  },
  statusIcon: {
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  statusSubtitle: {
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
  timeline: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  timelineIconCompleted: {
    backgroundColor: '#34C759',
  },
  timelineIconActive: {
    backgroundColor: '#FF9500',
  },
  timelineContent: {
    flex: 1,
    paddingTop: 4,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  timelineTime: {
    fontSize: 14,
    color: '#666',
  },
  timelineInactive: {
    color: '#C7C7CC',
  },
  verificationInfo: {
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    padding: 16,
  },
  verificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  verificationText: {
    fontSize: 14,
    color: '#1a1a1a',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  supportButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
    marginLeft: 12,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
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
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
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
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
});