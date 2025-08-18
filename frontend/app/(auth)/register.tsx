import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';

export default function RegisterScreen() {
  const [formData, setFormData] = useState({
    nama_lengkap: '',
    email: '',
    nomor_whatsapp: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleRegister = async () => {
    if (!formData.nama_lengkap || !formData.email || !formData.nomor_whatsapp || !formData.password) {
      Alert.alert('Error', 'Mohon isi semua field');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password harus minimal 6 karakter');
      return;
    }

    setLoading(true);
    try {
      await register(
        formData.nama_lengkap,
        formData.email.toLowerCase(),
        formData.nomor_whatsapp,
        formData.password
      );
      
      Alert.alert('Berhasil', 'Registrasi berhasil! Anda sekarang sudah login.');
      // Navigation will be handled by AuthContext
    } catch (error) {
      console.error('Register error:', error);
      let errorMessage = 'Registrasi gagal';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Email sudah terdaftar';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email tidak valid';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password terlalu lemah';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Koneksi internet bermasalah';
          break;
        default:
          errorMessage = error.message || 'Terjadi kesalahan';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={{
                uri: 'https://firebasestorage.googleapis.com/v0/b/orderflow-r7jsk.firebasestorage.app/o/ic_gogama_logo.png?alt=media&token=firebase-shop',
              }}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.appName}>Daftar Reseller</Text>
          </View>

          {/* Register Form */}
          <View style={styles.formContainer}>
            <Text style={styles.title}>Buat akun baru untuk mulai berbelanja.</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Nama Lengkap</Text>
              <TextInput
                style={styles.input}
                value={formData.nama_lengkap}
                onChangeText={(value) => handleInputChange('nama_lengkap', value)}
                placeholder="Masukkan nama lengkap Anda"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                placeholder="Masukkan email Anda"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Nomor WhatsApp</Text>
              <TextInput
                style={styles.input}
                value={formData.nomor_whatsapp}
                onChangeText={(value) => handleInputChange('nomor_whatsapp', value)}
                placeholder="Masukkan nomor WhatsApp"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={formData.password}
                onChangeText={(value) => handleInputChange('password', value)}
                placeholder="Masukkan password (min. 6 karakter)"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity
              style={[styles.registerButton, loading && styles.registerButtonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              <Text style={styles.registerButtonText}>
                {loading ? 'Mendaftar...' : 'Daftar dengan Email'}
              </Text>
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Sudah punya akun? </Text>
              <Link href="/(auth)/login" style={styles.loginLink}>
                <Text style={styles.loginLinkText}>Login di sini</Text>
              </Link>
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
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  formContainer: {
    width: '100%',
  },
  title: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  registerButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginVertical: 24,
  },
  registerButtonDisabled: {
    backgroundColor: '#ccc',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: '#666',
  },
  loginLink: {
    marginLeft: 4,
  },
  loginLinkText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
});