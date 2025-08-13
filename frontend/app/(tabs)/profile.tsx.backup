import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { userService, orderService } from '../../services/firestoreService';
import { useRouter } from 'expo-router';

interface UserProfile {
  id: string;
  nama_lengkap: string;
  email: string;
  nomor_whatsapp: string;
  created_at: string;
  photoURL?: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);
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
      console.log('📱 Loading profile data from Firebase for user:', user.uid);
      const profile = await userService.getUserProfile(user.uid);
      console.log('📄 Profile data retrieved:', profile);
      
      setUserProfile({
        id: profile.id || user.uid,
        nama_lengkap: profile.name || profile.nama_lengkap || user.displayName || '',
        email: profile.email || user.email || '',
        nomor_whatsapp: profile.whatsapp || profile.nomor_whatsapp || '',
        created_at: profile.created_at || new Date().toISOString(),
        photoURL: profile.photoURL || user.photoURL || ''
      });
      
      console.log('✅ Profile loaded successfully with photo:', profile.photoURL || user.photoURL || 'No photo');
    } catch (error) {
      console.error('❌ Error fetching profile:', error);
      // Use auth user data as fallback
      setUserProfile({
        id: user.uid,
        nama_lengkap: user.displayName || '',
        email: user.email || '',
        nomor_whatsapp: '',
        created_at: new Date().toISOString(),
        photoURL: user.photoURL || ''
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

  const menuItems = [
    {
      title: 'Profil Saya',
      subtitle: 'Kelola profil dan informasi pribadi',
      icon: 'person',
      iconColor: '#007AFF',
      backgroundColor: '#F0F8FF',
      onPress: () => router.push('/profile/settings'),
    },
    {
      title: 'Riwayat Pesanan',
      subtitle: 'Lihat status dan riwayat pemesanan',
      icon: 'history',
      iconColor: '#FF6B35',
      backgroundColor: '#FFF4F0',
      onPress: () => router.push('/order/history'),
    },
    {
      title: 'Alamat Pengiriman',
      subtitle: 'Kelola alamat untuk pengiriman',
      icon: 'location-on',
      iconColor: '#32D74B',
      backgroundColor: '#F0FFF4',
      onPress: () => router.push('/profile/address'),
    },
    {
      title: 'Pusat Bantuan',
      subtitle: 'FAQ dan dukungan pelanggan',
      icon: 'help-outline',
      iconColor: '#5856D6',
      backgroundColor: '#F5F4FF',
      onPress: () => Alert.alert('Bantuan', 'Hubungi customer service untuk bantuan'),
    },
    {
      title: 'Tentang Aplikasi',
      subtitle: 'Informasi aplikasi dan versi',
      icon: 'info-outline',
      iconColor: '#8E8E93',
      backgroundColor: '#F8F9FA',
      onPress: () => Alert.alert('Tentang', 'Gogama Store - Aplikasi Reseller v1.0.0\nPowered by Firebase'),
    },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Memuat profil...</Text>
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

        {/* User Profile Card */}
        {userProfile && (
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarCircle}>
                {userProfile.photoURL ? (
                  <Image 
                    source={{ uri: userProfile.photoURL }} 
                    style={styles.profileImage}
                    onError={(error) => {
                      console.log('❌ Error loading profile image:', error);
                    }}
                  />
                ) : (
                  <MaterialIcons name="person" size={32} color="#007AFF" />
                )}
              </View>
              <View style={styles.statusBadge}>
                <MaterialIcons name="verified" size={16} color="#32D74B" />
              </View>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{userProfile.nama_lengkap || 'Pengguna'}</Text>
              <Text style={styles.profileEmail}>{userProfile.email}</Text>
              {userProfile.nomor_whatsapp && (
                <View style={styles.phoneContainer}>
                  <MaterialIcons name="phone" size={14} color="#8E8E93" />
                  <Text style={styles.profilePhone}>{userProfile.nomor_whatsapp}</Text>
                </View>
              )}
              <View style={styles.membershipContainer}>
                <MaterialIcons name="star" size={14} color="#FFD60A" />
                <Text style={styles.membershipText}>Member Premium</Text>
              </View>
            </View>
          </View>
        )}

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Pesanan</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Favorit</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Review</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemContent}>
                <View style={[styles.iconContainer, { backgroundColor: item.backgroundColor }]}>
                  <MaterialIcons 
                    name={item.icon as any} 
                    size={22} 
                    color={item.iconColor} 
                  />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuItemTitle}>{item.title}</Text>
                  <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#C7C7CC" />
            </TouchableOpacity>
          ))}
        </View>
        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <MaterialIcons name="logout" size={20} color="#FF3B30" />
            <Text style={styles.logoutButtonText}>Keluar dari Akun</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footerSection}>
          <Text style={styles.appVersion}>Gogama Store v1.0.0</Text>
          <Text style={styles.poweredBy}>Powered by Firebase & React Native</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1D1D1F',
    textAlign: 'center',
  },
  profileCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F0F8FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E3F2FD',
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  statusBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1D1D1F',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  profilePhone: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 4,
  },
  membershipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  membershipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF8F00',
    marginLeft: 4,
  },
  statsContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 20,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#F2F2F7',
  },
  menuSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
  },
  logoutSection: {
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  logoutButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  footerSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  appVersion: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 4,
  },
  poweredBy: {
    fontSize: 12,
    color: '#C7C7CC',
  },
});
