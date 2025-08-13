import React, { useEffect, useState } from 'react';
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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/firestoreService';
import * as ImagePicker from 'expo-image-picker';
import { storage } from '../../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface UserProfile {
  name: string;
  email: string;
  whatsapp: string;
  photoURL: string;
  role: string;
}

export default function ProfileSettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: '',
    whatsapp: '',
    photoURL: '',
    role: 'reseller'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const userData = await userService.getUserProfile(user.uid);
      setProfile({
        name: userData.name || userData.nama_lengkap || '',
        email: userData.email || user.email || '',
        whatsapp: userData.whatsapp || userData.nomor_whatsapp || '',
        photoURL: userData.photoURL || '',
        role: userData.role || 'reseller'
      });
    } catch (error) {
      console.error('Error loading profile:', error);
      // Use auth user data as fallback
      setProfile(prev => ({
        ...prev,
        name: user.displayName || '',
        email: user.email || '',
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (!user || !isDirty) return;

    setSaving(true);
    try {
      await userService.updateUserProfile(user.uid, {
        name: profile.name,
        email: profile.email,
        whatsapp: profile.whatsapp,
        photoURL: profile.photoURL,
        role: profile.role,
        // Legacy field support
        nama_lengkap: profile.name,
        nomor_whatsapp: profile.whatsapp,
      });

      setIsDirty(false);
      Alert.alert('Berhasil', 'Profil berhasil diperbarui');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Gagal memperbarui profil');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async () => {
    try {
      // Request permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photo library to upload a profile picture.');
        return;
      }

      // Show image picker options
      Alert.alert(
        'Pilih Foto Profil',
        'Pilih sumber foto:',
        [
          { text: 'Batal', style: 'cancel' },
          { text: 'Galeri', onPress: () => pickFromGallery() },
          { text: 'Kamera', onPress: () => pickFromCamera() }
        ]
      );
    } catch (error) {
      console.error('Error in photo upload:', error);
      Alert.alert('Error', 'Gagal mengakses galeri foto');
    }
  };

  const pickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImageToFirebase(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking from gallery:', error);
      Alert.alert('Error', 'Gagal memilih foto dari galeri');
    }
  };

  const pickFromCamera = async () => {
    try {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      if (!cameraPermission.granted) {
        Alert.alert('Permission Required', 'Please allow access to your camera.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImageToFirebase(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking from camera:', error);
      Alert.alert('Error', 'Gagal mengambil foto dari kamera');
    }
  };

  const uploadImageToFirebase = async (imageUri: string) => {
    if (!user) return;

    setUploadingPhoto(true);
    try {
      console.log('📸 Starting photo upload for user:', user.uid);
      
      // Convert image to blob
      const response = await fetch(imageUri);
      const blob = await response.blob();

      // Create storage reference with the correct path structure
      const timestamp = Date.now();
      const fileName = `profile_${timestamp}.jpg`;
      const storageRef = ref(storage, `profile_pictures/${user.uid}/${fileName}`);
      
      console.log('☁️ Uploading to Firebase Storage:', storageRef.fullPath);

      // Upload file
      const snapshot = await uploadBytes(storageRef, blob);
      console.log('✅ Photo uploaded successfully');

      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('🔗 Download URL generated:', downloadURL);

      // Update profile with new photo URL
      setProfile(prev => ({ ...prev, photoURL: downloadURL }));
      setIsDirty(true);

      Alert.alert('Berhasil', 'Foto profil berhasil diupload. Jangan lupa simpan perubahan.');
    } catch (error) {
      console.error('❌ Error uploading photo:', error);
      Alert.alert('Error', 'Gagal mengupload foto. Silakan coba lagi.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleBack = () => {
    if (isDirty) {
      Alert.alert(
        'Perubahan Belum Disimpan',
        'Apakah Anda yakin ingin keluar tanpa menyimpan perubahan?',
        [
          { text: 'Batal', style: 'cancel' },
          { text: 'Keluar', onPress: () => router.back() }
        ]
      );
    } else {
      router.back();
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#1a1a1a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pengaturan Profil</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Memuat profil...</Text>
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
        <Text style={styles.headerTitle}>Pengaturan Profil</Text>
        <TouchableOpacity 
          onPress={handleSave}
          style={[styles.saveButton, (!isDirty || saving) && styles.saveButtonDisabled]}
          disabled={!isDirty || saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Text style={[styles.saveButtonText, (!isDirty || saving) && styles.saveButtonTextDisabled]}>
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
          {/* Profile Photo Section */}
          <View style={styles.photoSection}>
            <View style={styles.photoContainer}>
              <View style={styles.photoPlaceholder}>
                {profile.photoURL ? (
                  <Image 
                    source={{ uri: profile.photoURL }} 
                    style={styles.profileImage}
                    onError={(error) => {
                      console.log('❌ Error loading profile image:', error);
                    }}
                  />
                ) : (
                  <MaterialIcons name="person" size={48} color="#007AFF" />
                )}
              </View>
              <TouchableOpacity 
                style={styles.photoEditButton}
                onPress={handlePhotoUpload}
                disabled={uploadingPhoto}
              >
                {uploadingPhoto ? (
                  <ActivityIndicator size="small" color="#007AFF" />
                ) : (
                  <MaterialIcons name="camera-alt" size={16} color="#007AFF" />
                )}
              </TouchableOpacity>
            </View>
            <Text style={styles.photoText}>Foto Profil</Text>
            <Text style={styles.photoSubtext}>
              {uploadingPhoto ? 'Mengupload foto...' : 'Gunakan foto yang jelas dan profesional'}
            </Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nama Lengkap *</Text>
              <TextInput
                style={styles.textInput}
                value={profile.name}
                onChangeText={(value) => handleInputChange('name', value)}
                placeholder="Masukkan nama lengkap"
                placeholderTextColor="#8E8E93"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email *</Text>
              <TextInput
                style={[styles.textInput, styles.textInputDisabled]}
                value={profile.email}
                placeholder="email@example.com"
                placeholderTextColor="#8E8E93"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={false}
              />
              <Text style={styles.helperText}>Email tidak dapat diubah</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>WhatsApp *</Text>
              <TextInput
                style={styles.textInput}
                value={profile.whatsapp}
                onChangeText={(value) => handleInputChange('whatsapp', value)}
                placeholder="628123456789"
                placeholderTextColor="#8E8E93"
                keyboardType="phone-pad"
              />
              <Text style={styles.helperText}>Gunakan format: 628xxx (tanpa spasi atau tanda hubung)</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Role</Text>
              <View style={styles.roleContainer}>
                <MaterialIcons name="verified-user" size={20} color="#32D74B" />
                <Text style={styles.roleText}>{profile.role === 'reseller' ? 'Reseller' : profile.role}</Text>
              </View>
              <Text style={styles.helperText}>Role tidak dapat diubah</Text>
            </View>
          </View>

          {/* Info Section */}
          <View style={styles.infoSection}>
            <View style={styles.infoBox}>
              <MaterialIcons name="info" size={20} color="#007AFF" />
              <Text style={styles.infoText}>
                Pastikan informasi yang Anda masukkan akurat. Data ini akan digunakan untuk komunikasi dan pengiriman pesanan.
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
  photoSection: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 16,
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  photoPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F0F8FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E3F2FD',
  },
  photoEditButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  photoText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  photoSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
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
  textInputDisabled: {
    backgroundColor: '#F8F9FA',
    color: '#8E8E93',
  },
  helperText: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F0FFF4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  roleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
    marginLeft: 8,
    textTransform: 'capitalize',
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