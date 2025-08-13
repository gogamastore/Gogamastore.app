import React, { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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

export default function AddAddressScreen() {
  const router = useRouter();
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
  const [saving, setSaving] = useState(false);

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

  const handleSave = async () => {
    console.log('🔄 HandleSave called');
    
    if (!validateForm()) {
      console.log('❌ Form validation failed');
      return;
    }
    
    if (!user) {
      console.log('❌ No user found');
      Alert.alert('Error', 'User tidak ditemukan. Silakan login ulang.');
      return;
    }

    console.log('✅ Starting save process for user:', user.uid);
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

      console.log('📝 Saving address data:', addressData);
      
      const result = await userService.addUserAddress(user.uid, addressData);
      console.log('✅ Address saved successfully, ID:', result);
      
      Alert.alert('Berhasil', 'Alamat berhasil ditambahkan', [
        { text: 'OK', onPress: () => {
          console.log('🔙 Navigating back after success');
          router.back();
        }}
      ]);
    } catch (error) {
      console.error('❌ Error saving address:', error);
      console.error('❌ Error stack:', error.stack);
      Alert.alert('Error', 'Gagal menambahkan alamat.\n\nDetail: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    console.log('🔙 HandleBack called');
    
    const hasData = Object.values(form).some(value => 
      typeof value === 'string' ? value.trim() : value
    );
    
    console.log('📝 Form has data:', hasData);
    
    if (hasData) {
      Alert.alert(
        'Batalkan Perubahan',
        'Apakah Anda yakin ingin keluar? Data yang dimasukkan akan hilang.',
        [
          { text: 'Tetap di sini', style: 'cancel' },
          { 
            text: 'Keluar', 
            onPress: () => {
              console.log('🔙 User confirmed exit, navigating back');
              router.back();
            }
          }
        ]
      );
    } else {
      console.log('🔙 No data, navigating back directly');
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tambah Alamat</Text>
        <TouchableOpacity 
          onPress={handleSave}
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          disabled={saving}
        >
          <Text style={[styles.saveButtonText, saving && styles.saveButtonTextDisabled]}>
            {saving ? 'Menyimpan...' : 'Simpan'}
          </Text>
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