import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Clipboard,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../../contexts/AuthContext';
import { orderService } from '../../../services/firestoreService';

const bankAccounts = {
  bri_transfer: {
    bankName: 'Bank BRI',
    accountNumber: '1234-5678-9012-3456',
    accountName: 'GOGAMA STORE',
    bankCode: '002',
    logo: '🏦',
  },
  bni_transfer: {
    bankName: 'Bank BNI',
    accountNumber: '9876-5432-1098-7654',
    accountName: 'GOGAMA STORE',
    bankCode: '009',
    logo: '🏛️',
  },
  dana: {
    bankName: 'DANA',
    accountNumber: '081234567890',
    accountName: 'GOGAMA STORE',
    logo: '📱',
  },
  gopay: {
    bankName: 'GoPay',
    accountNumber: '081234567890',
    accountName: 'GOGAMA STORE',
    logo: '🟢',
  },
};

export default function PaymentInstructionsScreen() {
  const { orderId, method } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [orderData, setOrderData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [confirmingPayment, setConfirmingPayment] = useState(false);

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

  const copyToClipboard = (text: string, label: string) => {
    Clipboard.setString(text);
    Alert.alert('Berhasil', `${label} berhasil disalin ke clipboard`);
  };

  const sharePaymentInfo = async () => {
    const bankData = bankAccounts[method as keyof typeof bankAccounts];
    if (!bankData || !orderData) return;

    const message = `
Informasi Pembayaran Gogama Store

${bankData.bankName}
No. Rekening: ${bankData.accountNumber}
Atas Nama: ${bankData.accountName}

Total Pembayaran: ${formatPrice(orderData.grandTotal)}
No. Pesanan: ${orderId}

Mohon transfer sesuai dengan nominal yang tertera dan kirim bukti transfer.
    `;

    try {
      await Share.share({
        message: message.trim(),
        title: 'Informasi Pembayaran',
      });
    } catch (error) {
      console.error('Error sharing payment info:', error);
    }
  };

  const confirmPayment = async () => {
    Alert.alert(
      'Konfirmasi Pembayaran',
      'Apakah Anda sudah melakukan transfer sesuai dengan nominal yang tertera?',
      [
        { text: 'Belum', style: 'cancel' },
        {
          text: 'Sudah Transfer',
          onPress: async () => {
            setConfirmingPayment(true);
            try {
              // Update payment status to pending verification
              await orderService.updatePaymentStatus(orderId as string, 'pending_verification');
              
              // Navigate to payment success/pending page
              router.replace(`/payment/pending/${orderId}`);
            } catch (error) {
              console.error('Error confirming payment:', error);
              Alert.alert('Error', 'Gagal mengkonfirmasi pembayaran');
            } finally {
              setConfirmingPayment(false);
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

  if (!orderData || !method || !bankAccounts[method as keyof typeof bankAccounts]) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error" size={64} color="#FF3B30" />
          <Text style={styles.errorText}>Informasi pembayaran tidak ditemukan</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Kembali</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const bankData = bankAccounts[method as keyof typeof bankAccounts];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Instruksi Pembayaran</Text>
        <TouchableOpacity onPress={sharePaymentInfo}>
          <MaterialIcons name="share" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Payment Amount */}
        <View style={styles.amountSection}>
          <Text style={styles.amountLabel}>Total Pembayaran</Text>
          <Text style={styles.amountValue}>{formatPrice(orderData.grandTotal)}</Text>
          <Text style={styles.orderIdText}>No. Pesanan: {orderId}</Text>
        </View>

        {/* Bank Information */}
        <View style={styles.bankInfo}>
          <View style={styles.bankHeader}>
            <Text style={styles.bankLogo}>{bankData.logo}</Text>
            <Text style={styles.bankName}>{bankData.bankName}</Text>
          </View>

          <View style={styles.accountDetails}>
            <View style={styles.accountRow}>
              <Text style={styles.accountLabel}>Nomor Rekening</Text>
              <View style={styles.accountValueContainer}>
                <Text style={styles.accountValue}>{bankData.accountNumber}</Text>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={() => copyToClipboard(bankData.accountNumber, 'Nomor rekening')}
                >
                  <MaterialIcons name="content-copy" size={16} color="#007AFF" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.accountRow}>
              <Text style={styles.accountLabel}>Atas Nama</Text>
              <View style={styles.accountValueContainer}>
                <Text style={styles.accountValue}>{bankData.accountName}</Text>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={() => copyToClipboard(bankData.accountName, 'Nama penerima')}
                >
                  <MaterialIcons name="content-copy" size={16} color="#007AFF" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.accountRow}>
              <Text style={styles.accountLabel}>Jumlah Transfer</Text>
              <View style={styles.accountValueContainer}>
                <Text style={[styles.accountValue, styles.transferAmount]}>
                  {formatPrice(orderData.grandTotal)}
                </Text>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={() => copyToClipboard(orderData.grandTotal.toString(), 'Jumlah transfer')}
                >
                  <MaterialIcons name="content-copy" size={16} color="#007AFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsSection}>
          <Text style={styles.sectionTitle}>Cara Transfer</Text>
          
          <View style={styles.stepContainer}>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepText}>
                Buka aplikasi mobile banking atau ATM terdekat
              </Text>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepText}>
                Pilih menu Transfer ke {bankData.bankName}
              </Text>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepText}>
                Masukkan nomor rekening: {bankData.accountNumber}
              </Text>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>4</Text>
              </View>
              <Text style={styles.stepText}>
                Masukkan jumlah transfer: {formatPrice(orderData.grandTotal)}
              </Text>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>5</Text>
              </View>
              <Text style={styles.stepText}>
                Konfirmasi dan lakukan transfer
              </Text>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>6</Text>
              </View>
              <Text style={styles.stepText}>
                Tekan tombol "Sudah Transfer" di bawah setelah transfer berhasil
              </Text>
            </View>
          </View>
        </View>

        {/* Important Notes */}
        <View style={styles.notesSection}>
          <Text style={styles.sectionTitle}>Catatan Penting</Text>
          <View style={styles.noteItem}>
            <MaterialIcons name="access-time" size={16} color="#FF9500" />
            <Text style={styles.noteText}>
              Lakukan pembayaran dalam 24 jam, atau pesanan akan dibatalkan otomatis
            </Text>
          </View>
          <View style={styles.noteItem}>
            <MaterialIcons name="info" size={16} color="#007AFF" />
            <Text style={styles.noteText}>
              Transfer sesuai nominal yang tertera untuk mempercepat verifikasi
            </Text>
          </View>
          <View style={styles.noteItem}>
            <MaterialIcons name="support" size={16} color="#34C759" />
            <Text style={styles.noteText}>
              Hubungi customer service jika ada kesulitan dalam proses transfer
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push(`/payment/upload/${orderId}`)}
        >
          <MaterialIcons name="cloud-upload" size={20} color="#007AFF" />
          <Text style={styles.secondaryButtonText}>Upload Bukti</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.primaryButton, confirmingPayment && styles.primaryButtonDisabled]}
          onPress={confirmPayment}
          disabled={confirmingPayment}
        >
          {confirmingPayment ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <MaterialIcons name="check" size={20} color="#fff" />
              <Text style={styles.primaryButtonText}>Sudah Transfer</Text>
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
  content: {
    flex: 1,
  },
  amountSection: {
    backgroundColor: '#007AFF',
    paddingVertical: 32,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  amountLabel: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  orderIdText: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
  },
  bankInfo: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  bankHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  bankLogo: {
    fontSize: 32,
    marginRight: 16,
  },
  bankName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  accountDetails: {
    marginBottom: 8,
  },
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  accountLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  accountValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2,
    justifyContent: 'flex-end',
  },
  accountValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginRight: 8,
  },
  transferAmount: {
    color: '#007AFF',
    fontSize: 18,
  },
  copyButton: {
    padding: 4,
  },
  instructionsSection: {
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
  stepContainer: {
    paddingLeft: 8,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  stepText: {
    fontSize: 14,
    color: '#1a1a1a',
    lineHeight: 20,
    flex: 1,
  },
  notesSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  noteText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
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
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    marginRight: 8,
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#34C759',
    borderRadius: 8,
    marginLeft: 8,
  },
  primaryButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
});