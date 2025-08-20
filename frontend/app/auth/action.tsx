import React, { useState, useEffect } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { sendPasswordResetEmail, confirmPasswordReset, checkActionCode } from 'firebase/auth';
import { auth } from '../../lib/firebase';

type ActionMode = 'resetPassword' | 'recoverEmail' | 'verifyEmail' | 'sendReset';

export default function AuthActionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Parse URL parameters
  const mode = (params.mode as ActionMode) || 'sendReset';
  const oobCode = params.oobCode as string;
  const apiKey = params.apiKey as string;
  const continueUrl = params.continueUrl as string;
  const lang = params.lang as string || 'id';

  // Component state
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validatingCode, setValidatingCode] = useState(false);
  const [codeValid, setCodeValid] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    // If we have an action code, validate it
    if (oobCode && mode !== 'sendReset') {
      validateActionCode();
    }
  }, [oobCode, mode]);

  const validateActionCode = async () => {
    setValidatingCode(true);
    try {
      const info = await checkActionCode(auth, oobCode);
      setCodeValid(true);
      setUserEmail(info.data.email || '');
      console.log('✅ Action code is valid');
    } catch (error) {
      console.error('❌ Invalid action code:', error);
      setCodeValid(false);
      Alert.alert(
        'Link Tidak Valid',
        'Link reset password tidak valid atau sudah kedaluwarsa. Silakan minta link baru.',
        [
          { text: 'OK', onPress: () => router.replace('/(auth)/login') }
        ]
      );
    } finally {
      setValidatingCode(false);
    }
  };

  const handleSendResetEmail = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Mohon masukkan alamat email');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Format email tidak valid');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.toLowerCase(), {
        url: continueUrl || 'https://gogama-store.firebaseapp.com', // Your app's domain
        handleCodeInApp: false,
      });

      Alert.alert(
        'Email Terkirim',
        `Link reset password telah dikirim ke ${email}. Periksa inbox email Anda dan ikuti instruksi untuk reset password.`,
        [
          { text: 'OK', onPress: () => router.replace('/(auth)/login') }
        ]
      );
    } catch (error) {
      console.error('❌ Send reset email error:', error);
      let errorMessage = 'Gagal mengirim email reset password';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'Email tidak terdaftar';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Format email tidak valid';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Terlalu banyak permintaan. Coba lagi nanti';
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

  const handleResetPassword = async () => {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert('Error', 'Mohon isi semua field');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password harus minimal 6 karakter');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Konfirmasi password tidak sesuai');
      return;
    }

    setLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      
      Alert.alert(
        'Berhasil',
        'Password berhasil diubah! Silakan login dengan password baru Anda.',
        [
          { text: 'OK', onPress: () => router.replace('/(auth)/login') }
        ]
      );
    } catch (error) {
      console.error('❌ Reset password error:', error);
      let errorMessage = 'Gagal mengubah password';
      
      switch (error.code) {
        case 'auth/expired-action-code':
          errorMessage = 'Link reset password sudah kedaluwarsa';
          break;
        case 'auth/invalid-action-code':
          errorMessage = 'Link reset password tidak valid';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Akun telah dinonaktifkan';
          break;
        case 'auth/user-not-found':
          errorMessage = 'Pengguna tidak ditemukan';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password terlalu lemah';
          break;
        default:
          errorMessage = error.message || 'Terjadi kesalahan';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Render loading state while validating code
  if (validatingCode) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Memvalidasi link reset password...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Render reset password form (when user clicks link from email)
  if (mode === 'resetPassword' && oobCode && codeValid) {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Header */}
            <View style={styles.headerContainer}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <MaterialIcons name="arrow-back" size={24} color="#1a1a1a" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Reset Password</Text>
              <View style={{ width: 24 }} />
            </View>

            {/* Logo */}
            <View style={styles.logoContainer}>
              <Image
                source={{
                  uri: 'https://firebasestorage.googleapis.com/v0/b/orderflow-r7jsk.firebasestorage.app/o/ic_gogama_logo.png?alt=media&token=firebase-shop',
                }}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.appName}>Gogama Store</Text>
            </View>

            {/* Form */}
            <View style={styles.formContainer}>
              <Text style={styles.title}>Buat password baru untuk akun Anda</Text>
              
              {userEmail && (
                <View style={styles.emailInfo}>
                  <Text style={styles.emailInfoText}>Email: {userEmail}</Text>
                </View>
              )}

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password Baru</Text>
                <TextInput
                  style={styles.input}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Masukkan password baru (min. 6 karakter)"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Konfirmasi Password</Text>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Ulangi password baru"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <TouchableOpacity
                style={[styles.actionButton, loading && styles.actionButtonDisabled]}
                onPress={handleResetPassword}
                disabled={loading}
              >
                <Text style={styles.actionButtonText}>
                  {loading ? 'Mengubah Password...' : 'Ubah Password'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Render send reset email form (default)
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.headerContainer}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <MaterialIcons name="arrow-back" size={24} color="#1a1a1a" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Lupa Password</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={{
                uri: 'https://firebasestorage.googleapis.com/v0/b/orderflow-r7jsk.firebasestorage.app/o/ic_gogama_logo.png?alt=media&token=firebase-shop',
              }}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.appName}>Gogama Store</Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <Text style={styles.title}>
              Masukkan email Anda dan kami akan mengirimkan link untuk reset password
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Masukkan email Anda"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity
              style={[styles.actionButton, loading && styles.actionButtonDisabled]}
              onPress={handleSendResetEmail}
              disabled={loading}
            >
              <Text style={styles.actionButtonText}>
                {loading ? 'Mengirim Email...' : 'Kirim Link Reset'}
              </Text>
            </TouchableOpacity>

            <View style={styles.backToLoginContainer}>
              <Text style={styles.backToLoginText}>Sudah ingat password? </Text>
              <Link href="/(auth)/login" style={styles.backToLoginLink}>
                <Text style={styles.backToLoginLinkText}>Kembali ke Login</Text>
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
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    textAlign: 'center',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
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
  emailInfo: {
    backgroundColor: '#F0F8FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  emailInfoText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
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
  actionButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginVertical: 24,
  },
  actionButtonDisabled: {
    backgroundColor: '#ccc',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backToLoginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backToLoginText: {
    fontSize: 14,
    color: '#666',
  },
  backToLoginLink: {
    marginLeft: 4,
  },
  backToLoginLinkText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
});