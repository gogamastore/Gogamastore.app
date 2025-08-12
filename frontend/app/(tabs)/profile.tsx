import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { userService, initializeSampleData } from '../../services/firestoreService';

interface UserProfile {
  id: string;
  nama_lengkap: string;
  email: string;
  nomor_whatsapp: string;
  created_at: string;
}

export default function ProfileScreen() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      const profile = await userService.getUserProfile(user.uid);
      setUserProfile({
        id: profile.id,
        nama_lengkap: profile.nama_lengkap || user.displayName || '',
        email: profile.email || user.email || '',
        nomor_whatsapp: profile.nomor_whatsapp || '',
        created_at: profile.created_at || new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Use auth user data as fallback
      setUserProfile({
        id: user.uid,
        nama_lengkap: user.displayName || '',
        email: user.email || '',
        nomor_whatsapp: '',
        created_at: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Konfirmasi Logout',
      'Apakah Anda yakin ingin keluar?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Keluar',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Logout error:', error);
            }
          },
        },
      ]
    );
  };

  const handleInitializeSampleData = async () => {
    Alert.alert(
      'Initialize Sample Data',
      'Apakah Anda ingin menambahkan data sample produk dan kategori?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya',
          onPress: async () => {
            try {
              await initializeSampleData();
              Alert.alert('Berhasil', 'Data sample berhasil ditambahkan');
            } catch (error) {
              console.error('Error initializing sample data:', error);
              Alert.alert('Error', 'Gagal menambahkan data sample');
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const menuItems = [
    {
      title: 'Edit Profil',
      icon: 'edit',
      onPress: () => Alert.alert('Info', 'Fitur edit profil akan segera tersedia'),
    },
    {
      title: 'Riwayat Pesanan',
      icon: 'history',
      onPress: () => Alert.alert('Info', 'Fitur riwayat pesanan akan segera tersedia'),
    },
    {
      title: 'Alamat',
      icon: 'location-on',
      onPress: () => Alert.alert('Info', 'Fitur pengaturan alamat akan segera tersedia'),
    },
    {
      title: 'Initialize Sample Data',
      icon: 'data-usage',
      onPress: handleInitializeSampleData,
    },
    {
      title: 'Bantuan',
      icon: 'help',
      onPress: () => Alert.alert('Bantuan', 'Hubungi customer service untuk bantuan'),
    },
    {
      title: 'Tentang Aplikasi',
      icon: 'info',
      onPress: () => Alert.alert('Tentang', 'Gogama Store - Aplikasi Reseller v1.0.0\nPowered by Firebase'),
    },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profil</Text>
        </View>

        {/* User Info Section */}
        {userProfile && (
          <View style={styles.userSection}>
            <View style={styles.userAvatar}>
              <MaterialIcons name="person" size={48} color="#007AFF" />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{userProfile.nama_lengkap}</Text>
              <Text style={styles.userEmail}>{userProfile.email}</Text>
              {userProfile.nomor_whatsapp && (
                <Text style={styles.userPhone}>{userProfile.nomor_whatsapp}</Text>
              )}
              <Text style={styles.joinDate}>
                Bergabung sejak {formatDate(userProfile.created_at)}
              </Text>
            </View>
          </View>
        )}

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <View style={styles.menuItemLeft}>
                <MaterialIcons 
                  name={item.icon as any} 
                  size={24} 
                  color="#666" 
                />
                <Text style={styles.menuItemTitle}>{item.title}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#C7C7CC" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <MaterialIcons name="logout" size={20} color="#fff" />
            <Text style={styles.logoutButtonText}>Keluar</Text>
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <View style={styles.versionSection}>
          <Text style={styles.versionText}>Gogama Store v1.0.0 - Firebase Edition</Text>
        </View>
      </ScrollView>
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
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  userSection: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  userAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  joinDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  menuSection: {
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemTitle: {
    fontSize: 16,
    color: '#1a1a1a',
    marginLeft: 12,
  },
  logoutSection: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF3B30',
    paddingVertical: 16,
    borderRadius: 12,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  versionSection: {
    alignItems: 'center',
    paddingBottom: 32,
  },
  versionText: {
    fontSize: 12,
    color: '#8E8E93',
  },
});