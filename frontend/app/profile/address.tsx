import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/firestoreService';

interface Address {
  id: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  province: string;
  isDefault: boolean;
  created_at: string;
}

export default function AddressManagementScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<Address | null>(null);

  useEffect(() => {
    if (user) {
      loadAddresses();
    }
  }, [user]);

  // Refresh addresses when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('🏠 Address screen focused - refreshing addresses');
      if (user) {
        loadAddresses();
      }
    }, [user])
  );

  const loadAddresses = async () => {
    if (!user) return;

    try {
      console.log('🏠 Loading addresses for user:', user.uid);
      const userAddresses = await userService.getUserAddresses(user.uid);
      console.log('📍 Loaded addresses:', userAddresses);
      setAddresses(userAddresses);
    } catch (error) {
      console.error('Error loading addresses:', error);
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = () => {
    router.push('/profile/add-address');
  };

  const handleEditAddress = (addressId: string) => {
    router.push(`/profile/${addressId}`);
  };

  const handleDeleteAddress = (address: Address) => {
    console.log('🗑️ handleDeleteAddress called for address:', address.name);
    
    if (address.isDefault) {
      // Show non-deletable default address info
      setAddressToDelete(address);
      setDeleteModalVisible(true);
      return;
    }

    // Show delete confirmation modal
    setAddressToDelete(address);
    setDeleteModalVisible(true);
  };

  const handleDeleteConfirm = async () => {
    if (!addressToDelete) return;
    
    try {
      console.log('🗑️ Confirmed delete for address:', addressToDelete.name);
      setDeleteModalVisible(false);
      
      await userService.deleteUserAddress(user!.uid, addressToDelete.id);
      setAddresses(prev => prev.filter(addr => addr.id !== addressToDelete.id));
      
      console.log('✅ Address deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting address:', error);
      setDeleteModalVisible(false);
    }
  };

  const handleDeleteCancel = () => {
    console.log('❌ Address delete cancelled by user');
    setDeleteModalVisible(false);
    setAddressToDelete(null);
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      await userService.setDefaultAddress(user!.uid, addressId);
      setAddresses(prev => prev.map(addr => ({
        ...addr,
        isDefault: addr.id === addressId
      })));
      console.log('✅ Default address updated successfully');
    } catch (error) {
      console.error('Error setting default address:', error);
    }
  };

  const renderAddressCard = ({ item }: { item: Address }) => (
    <View style={styles.addressCard}>
      <View style={styles.addressHeader}>
        <View style={styles.addressInfo}>
          <Text style={styles.addressName}>{item.name}</Text>
          {item.isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultText}>Utama</Text>
            </View>
          )}
        </View>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => showAddressMenu(item)}
        >
          <MaterialIcons name="more-vert" size={20} color="#8E8E93" />
        </TouchableOpacity>
      </View>

      <Text style={styles.addressPhone}>{item.phone}</Text>
      <Text style={styles.addressDetails}>
        {item.address}
      </Text>
      <Text style={styles.addressLocation}>
        {item.city}, {item.province} {item.postalCode}
      </Text>

      <View style={styles.addressActions}>
        {!item.isDefault && (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleSetDefault(item.id)}
          >
            <MaterialIcons name="star-border" size={16} color="#007AFF" />
            <Text style={styles.actionButtonText}>Jadikan Utama</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleEditAddress(item.id)}
        >
          <MaterialIcons name="edit" size={16} color="#007AFF" />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteActionButton]}
          onPress={() => {
            console.log('🗑️ Delete address button pressed for:', item.name);
            handleDeleteAddress(item);
          }}
          activeOpacity={0.7}
        >
          <MaterialIcons name="delete" size={16} color="#FF3B30" />
          <Text style={[styles.actionButtonText, styles.deleteActionButtonText]}>Hapus</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const showAddressMenu = (address: Address) => {
    // Direct action - just trigger the appropriate function
    // Simplified approach instead of multiple menu options
    if (address.isDefault) {
      handleEditAddress(address.id);
    } else {
      // For non-default addresses, could show edit as default action
      handleEditAddress(address.id);
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="location-on" size={64} color="#C7C7CC" />
      <Text style={styles.emptyTitle}>Belum Ada Alamat</Text>
      <Text style={styles.emptyDescription}>
        Tambahkan alamat pengiriman untuk memudahkan proses checkout
      </Text>
      <TouchableOpacity style={styles.addFirstButton} onPress={handleAddAddress}>
        <MaterialIcons name="add" size={20} color="#fff" />
        <Text style={styles.addFirstButtonText}>Tambah Alamat Pertama</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#1a1a1a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Alamat Pengiriman</Text>
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
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Alamat Pengiriman</Text>
        <TouchableOpacity onPress={handleAddAddress} style={styles.addButton}>
          <MaterialIcons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {addresses.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
          <View style={styles.subHeader}>
            <Text style={styles.subHeaderTitle}>Alamat Tersimpan</Text>
            <Text style={styles.subHeaderDescription}>
              Kelola alamat pengiriman Anda di sini
            </Text>
          </View>

          <FlatList
            data={addresses}
            renderItem={renderAddressCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />

          <View style={styles.addButtonContainer}>
            <TouchableOpacity style={styles.floatingAddButton} onPress={handleAddAddress}>
              <MaterialIcons name="add" size={20} color="#fff" />
              <Text style={styles.floatingAddButtonText}>Tambah Alamat Baru</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
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
  addButton: {
    padding: 4,
  },
  subHeader: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  subHeaderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subHeaderDescription: {
    fontSize: 14,
    color: '#666',
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
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
  addressCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  addressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  addressName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginRight: 8,
  },
  defaultBadge: {
    backgroundColor: '#32D74B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  menuButton: {
    padding: 4,
  },
  addressPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  addressDetails: {
    fontSize: 14,
    color: '#1a1a1a',
    lineHeight: 20,
    marginBottom: 4,
  },
  addressLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  addressActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F0F8FF',
    marginRight: 8,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
    marginLeft: 4,
  },
  deleteActionButton: {
    backgroundColor: '#FFF0F0',
  },
  deleteActionButtonText: {
    color: '#FF3B30',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  addFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  addFirstButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  addButtonContainer: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
  },
  floatingAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  floatingAddButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});