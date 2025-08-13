import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ToastAndroid,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/firestoreService';

interface AddressForm {
  name: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  province: string;
  isDefault: boolean;
}

export default function EditAddressScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  
  const [form, setForm] = useState<AddressForm>({
    name: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    province: '',
    isDefault: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user && id) {
      loadAddress();
    }
  }, [user, id]);

  const loadAddress = async () => {
    if (!user || !id) return;

    try {
      console.log('📝 Loading address for edit, ID:', id);
      const addresses = await userService.getUserAddresses(user.uid);
      const addressToEdit = addresses.find(addr => addr.id === id);
      
      if (addressToEdit) {
        console.log('✅ Address found:', addressToEdit);
        setForm({
          name: addressToEdit.name || '',
          phone: addressToEdit.phone || '',
          address: addressToEdit.address || '',
          city: addressToEdit.city || '',
          postalCode: addressToEdit.postalCode || '',
          province: addressToEdit.province || '',
          isDefault: addressToEdit.isDefault || false,
        });
      } else {
        console.log('❌ Address not found');
        Alert.alert('Error', 'Alamat tidak ditemukan');
        router.back();
      }
    } catch (error) {
      console.error('❌ Error loading address:', error);
      Alert.alert('Error', 'Gagal memuat data alamat');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof AddressForm, value: string | boolean) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      Alert.alert('Error', 'Nama penerima harus diisi');
      return false;
    }
    if (!form.phone.trim()) {
      Alert.alert('Error', 'Nomor telepon harus diisi');
      return false;
    }
    if (!form.address.trim()) {
      Alert.alert('Error', 'Alamat lengkap harus diisi');
      return false;
    }
    if (!form.city.trim()) {
      Alert.alert('Error', 'Kota harus diisi');
      return false;
    }
    if (!form.postalCode.trim()) {
      Alert.alert('Error', 'Kode pos harus diisi');
      return false;
    }
    if (!form.province.trim()) {
      Alert.alert('Error', 'Provinsi harus diisi');
      return false;
    }
    return true;
  };

  // Function to show success toast
  const showSuccessToast = (message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.showWithGravity(
        message,
        ToastAndroid.LONG,
        ToastAndroid.BOTTOM,
      );
    } else {
      Alert.alert('Berhasil', message);
    }
  };

  const handleSave = async () => {
    console.log('🔄 HandleSave called for address ID:', id);
    
    if (!validateForm()) {
      console.log('❌ Form validation failed');
      return;
    }
    
    if (!user || !id) {
      console.log('❌ No user or address ID found');
      Alert.alert('Error', 'Data tidak valid. Silakan coba lagi.');
      return;
    }

    console.log('✅ Starting update process');
    setSaving(true);
    
    try {
      const addressData = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        postalCode: form.postalCode.trim(),
        province: form.province.trim(),
        isDefault: form.isDefault
      };

      console.log('📝 Updating address data:', addressData);
      
      await userService.updateUserAddress(user.uid, id as string, addressData);
      console.log('✅ Address updated successfully');
      
      // Show success toast
      showSuccessToast('✅ Alamat berhasil diperbarui!');
      
      // Navigate back to address list after short delay
      setTimeout(() => {
        console.log('🔙 Navigating back to address list');
        router.replace('/profile/address');
      }, 1500);
      
    } catch (error) {
      console.error('❌ Error updating address:', error);
      Alert.alert('Error', 'Gagal memperbarui alamat.\n\nDetail: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !id) return;

    Alert.alert(
      'Hapus Alamat',
      'Apakah Anda yakin ingin menghapus alamat ini? Tindakan ini tidak dapat dibatalkan.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              console.log('🗑️ Deleting address ID:', id);
              await userService.deleteUserAddress(user.uid, id as string);
              console.log('✅ Address deleted successfully');
              
              showSuccessToast('✅ Alamat berhasil dihapus!');
              
              setTimeout(() => {
                router.replace('/profile/address');
              }, 1500);
            } catch (error) {
              console.error('❌ Error deleting address:', error);
              Alert.alert('Error', 'Gagal menghapus alamat: ' + error.message);
            } finally {
              setDeleting(false);
            }
          }
        }
      ]
    );
  };

  const handleBack = () => {
    console.log('🔙 HandleBack called');
    router.replace('/profile/address');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#1a1a1a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Alamat</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Memuat alamat...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Alamat</Text>
        <TouchableOpacity 
          onPress={handleSave}
          style={[styles.saveButton, (saving || deleting) && styles.saveButtonDisabled]}
          disabled={saving || deleting}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Text style={[styles.saveButtonText, (saving || deleting) && styles.saveButtonTextDisabled]}>
              Simpan
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nama Penerima *</Text>
              <TextInput
                style={styles.textInput}
                value={form.name}
                onChangeText={(value) => handleInputChange('name', value)}
                placeholder="Nama lengkap penerima"
                placeholderTextColor="#8E8E93"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nomor Telepon *</Text>
              <TextInput
                style={styles.textInput}
                value={form.phone}
                onChangeText={(value) => handleInputChange('phone', value)}
                placeholder="08123456789"
                placeholderTextColor="#8E8E93"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Alamat Lengkap *</Text>
              <TextInput
                style={[styles.textInput, styles.textAreaInput]}
                value={form.address}
                onChangeText={(value) => handleInputChange('address', value)}
                placeholder="Jalan, nomor rumah, RT/RW, kelurahan, kecamatan"
                placeholderTextColor="#8E8E93"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Kota *</Text>
              <TextInput
                style={styles.textInput}
                value={form.city}
                onChangeText={(value) => handleInputChange('city', value)}
                placeholder="Nama kota"
                placeholderTextColor="#8E8E93"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Provinsi *</Text>
              <TextInput
                style={styles.textInput}
                value={form.province}
                onChangeText={(value) => handleInputChange('province', value)}
                placeholder="Nama provinsi"
                placeholderTextColor="#8E8E93"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Kode Pos *</Text>
              <TextInput
                style={styles.textInput}
                value={form.postalCode}
                onChangeText={(value) => handleInputChange('postalCode', value)}
                placeholder="12345"
                placeholderTextColor="#8E8E93"
                keyboardType="numeric"
                maxLength={5}
              />
            </View>

            <TouchableOpacity 
              style={styles.defaultOption}
              onPress={() => handleInputChange('isDefault', !form.isDefault)}
            >
              <View style={styles.checkboxContainer}>
                <View style={[styles.checkbox, form.isDefault && styles.checkboxActive]}>
                  {form.isDefault && (
                    <MaterialIcons name="check" size={16} color="#fff" />
                  )}
                </View>
                <Text style={styles.defaultLabel}>Jadikan alamat utama</Text>
              </View>
              <Text style={styles.defaultDescription}>
                Alamat utama akan dipilih secara otomatis saat checkout
              </Text>
            </TouchableOpacity>
          </View>

          {/* Delete Button */}
          <View style={styles.deleteSection}>
            <TouchableOpacity 
              style={[styles.deleteButton, deleting && styles.deleteButtonDisabled]} 
              onPress={handleDelete}
              disabled={deleting || saving}
            >
              {deleting ? (
                <ActivityIndicator size="small" color="#FF3B30" />
              ) : (
                <MaterialIcons name="delete" size={20} color="#FF3B30" />
              )}
              <Text style={[styles.deleteButtonText, deleting && styles.deleteButtonTextDisabled]}>
                {deleting ? 'Menghapus...' : 'Hapus Alamat'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoSection}>
            <View style={styles.infoBox}>
              <MaterialIcons name="info" size={20} color="#007AFF" />
              <Text style={styles.infoText}>
                Pastikan alamat yang Anda masukkan akurat dan lengkap untuk memastikan pengiriman berjalan lancar.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
  saveButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  saveButtonTextDisabled: {
    color: '#8E8E93',
  },
  content: {
    flex: 1,
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
  formSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1a1a1a',
    backgroundColor: '#fff',
  },
  textAreaInput: {
    height: 80,
    paddingTop: 12,
  },
  defaultOption: {
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#C7C7CC',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  defaultLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  defaultDescription: {
    fontSize: 14,
    color: '#666',
    marginLeft: 32,
  },
  deleteSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  deleteButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  deleteButtonTextDisabled: {
    color: '#8E8E93',
  },
  infoSection: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#F0F8FF',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  infoText: {
    fontSize: 14,
    color: '#007AFF',
    lineHeight: 20,
    marginLeft: 12,
    flex: 1,
  },
});