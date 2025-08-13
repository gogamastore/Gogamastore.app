import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../../contexts/AuthContext';
import { orderService, paymentProofService } from '../../../services/firestoreService';

export default function UploadProofScreen() {
  const { orderId } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [orderData, setOrderData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [existingProof, setExistingProof] = useState<any>(null);

  useEffect(() => {
    if (orderId) {
      fetchOrderAndProofData();
    }
  }, [orderId]);

  const fetchOrderAndProofData = async () => {
    try {
      const [orderData, proofData] = await Promise.all([
        orderService.getOrderById(orderId as string),
        paymentProofService.getPaymentProofByOrderId(orderId as string)
      ]);
      
      setOrderData(orderData);
      setExistingProof(proofData);
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

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Aplikasi memerlukan akses ke galeri untuk memilih foto bukti pembayaran'
      );
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    Alert.alert(
      'Pilih Sumber Foto',
      'Pilih dari mana Anda ingin mengambil foto bukti pembayaran',
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Galeri', onPress: () => openGallery() },
        { text: 'Kamera', onPress: () => openCamera() },
      ]
    );
  };

  const openGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image from gallery:', error);
      Alert.alert('Error', 'Gagal mengambil foto dari galeri');
    }
  };

  const openCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Aplikasi memerlukan akses kamera');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Gagal mengambil foto dari kamera');
    }
  };

  const uploadProof = async () => {
    if (!selectedImage || !orderData) {
      Alert.alert('Error', 'Silakan pilih foto bukti pembayaran terlebih dahulu');
      return;
    }

    setUploading(true);

    try {
      // Generate filename with timestamp
      const timestamp = new Date().getTime();
      const fileName = `proof_${orderId}_${timestamp}.jpg`;

      // Upload to Firebase Storage (payment proof service will handle this)
      await paymentProofService.uploadPaymentProof(
        orderId as string,
        selectedImage,
        fileName
      );

      // Update payment status to indicate proof has been uploaded
      await orderService.updatePaymentStatus(orderId as string, 'pending_verification');

      Alert.alert(
        'Berhasil!',
        'Bukti pembayaran berhasil diunggah. Tim kami akan segera memverifikasi pembayaran Anda.',
        [
          {
            text: 'OK',
            onPress: () => router.replace(`/payment/pending/${orderId}`),
          },
        ]
      );
    } catch (error) {
      console.error('Error uploading proof:', error);
      Alert.alert('Error', 'Gagal mengunggah bukti pembayaran. Silakan coba lagi.');
    } finally {
      setUploading(false);
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
        <Text style={styles.headerTitle}>Unggah Bukti Pembayaran</Text>
        <View style={styles.headerSpace} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order Info */}
        <View style={styles.orderInfo}>
          <Text style={styles.sectionTitle}>Informasi Pesanan</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nomor Pesanan:</Text>
            <Text style={styles.infoValue}>#{orderId}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Total Pembayaran:</Text>
            <Text style={styles.infoValue}>{formatPrice(orderData.grandTotal)}</Text>
          </View>
        </View>

        {/* Upload Instructions */}
        <View style={styles.instructionsSection}>
          <Text style={styles.sectionTitle}>Panduan Upload</Text>
          <View style={styles.instructionItem}>
            <MaterialIcons name="photo-camera" size={20} color="#007AFF" />
            <Text style={styles.instructionText}>
              Foto harus jelas dan mudah dibaca
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <MaterialIcons name="receipt" size={20} color="#007AFF" />
            <Text style={styles.instructionText}>
              Pastikan nominal transfer dan nomor rekening terlihat
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <MaterialIcons name="access-time" size={20} color="#007AFF" />
            <Text style={styles.instructionText}>
              Verifikasi membutuhkan waktu maksimal 3 jam kerja
            </Text>
          </View>
        </View>

        {/* Image Upload Section */}
        <View style={styles.uploadSection}>
          <Text style={styles.sectionTitle}>Bukti Pembayaran</Text>
          
          {existingProof ? (
            <View style={styles.existingProofContainer}>
              <MaterialIcons name="check-circle" size={24} color="#34C759" />
              <Text style={styles.existingProofText}>
                Bukti pembayaran sudah diunggah pada{' '}
                {new Date(existingProof.uploadedAt).toLocaleString('id-ID')}
              </Text>
            </View>
          ) : (
            <View style={styles.imageUploadContainer}>
              {selectedImage ? (
                <View style={styles.selectedImageContainer}>
                  <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
                  <TouchableOpacity
                    style={styles.changeImageButton}
                    onPress={pickImage}
                  >
                    <MaterialIcons name="edit" size={20} color="#007AFF" />
                    <Text style={styles.changeImageText}>Ganti Foto</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={pickImage}
                >
                  <MaterialIcons name="add-photo-alternate" size={48} color="#C7C7CC" />
                  <Text style={styles.uploadButtonText}>Pilih Foto Bukti Pembayaran</Text>
                  <Text style={styles.uploadButtonSubtext}>
                    Tap untuk memilih dari galeri atau ambil foto baru
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Upload Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>Tips Upload</Text>
          <View style={styles.tipItem}>
            <Text style={styles.tipNumber}>1</Text>
            <Text style={styles.tipText}>
              Screenshot dari aplikasi mobile banking atau foto struk ATM
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipNumber}>2</Text>
            <Text style={styles.tipText}>
              Pastikan semua informasi transfer terlihat jelas
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipNumber}>3</Text>
            <Text style={styles.tipText}>
              Hapus informasi pribadi sensitif seperti saldo rekening
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Upload Button */}
      {!existingProof && (
        <View style={styles.bottomAction}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!selectedImage || uploading) && styles.submitButtonDisabled
            ]}
            onPress={uploadProof}
            disabled={!selectedImage || uploading}
          >
            {uploading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <MaterialIcons name="cloud-upload" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>Unggah Bukti Pembayaran</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
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
  orderInfo: {
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  instructionsSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 14,
    color: '#1a1a1a',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  uploadSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  existingProofContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F0F9F0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#34C759',
  },
  existingProofText: {
    fontSize: 14,
    color: '#1a1a1a',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  imageUploadContainer: {
    marginTop: 8,
  },
  selectedImageContainer: {
    alignItems: 'center',
  },
  selectedImage: {
    width: 200,
    height: 300,
    borderRadius: 8,
    marginBottom: 16,
  },
  changeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
  },
  changeImageText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  uploadButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderStyle: 'dashed',
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 12,
  },
  uploadButtonSubtext: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  tipsSection: {
    backgroundColor: '#fff',
    padding: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#1a1a1a',
    flex: 1,
    lineHeight: 20,
  },
  bottomAction: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
});