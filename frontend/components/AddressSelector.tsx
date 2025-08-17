import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/firestoreService';

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

interface AddressSelectorProps {
  onAddressSelect: (address: Address) => void;
  selectedAddress?: Address | null;
  style?: any;
}

export default function AddressSelector({ 
  onAddressSelect, 
  selectedAddress,
  style 
}: AddressSelectorProps) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user && modalVisible) {
      loadAddresses();
    }
  }, [user, modalVisible]);

  const loadAddresses = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      console.log('📍 Loading saved addresses for checkout...');
      const userAddresses = await userService.getUserAddresses(user.uid);
      
      // Sort addresses: default first, then by created date
      const sortedAddresses = userAddresses.sort((a, b) => {
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      
      setAddresses(sortedAddresses);
      console.log(`✅ Loaded ${sortedAddresses.length} saved addresses`);
    } catch (error) {
      console.error('❌ Error loading addresses:', error);
      Alert.alert('Error', 'Gagal memuat alamat tersimpan');
    } finally {
      setLoading(false);
    }
  };

  const handleAddressSelect = (address: Address) => {
    onAddressSelect(address);
    setModalVisible(false);
  };

  const renderAddress = ({ item }: { item: Address }) => (
    <TouchableOpacity
      style={[
        styles.addressItem,
        selectedAddress?.id === item.id && styles.selectedAddress
      ]}
      onPress={() => handleAddressSelect(item)}
      activeOpacity={0.7}
    >
      <View style={styles.addressHeader}>
        <View style={styles.addressTitleRow}>
          <Text style={styles.addressName}>{item.name}</Text>
          {item.isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultBadgeText}>Utama</Text>
            </View>
          )}
        </View>
        <Text style={styles.addressPhone}>{item.phone}</Text>
      </View>
      
      <Text style={styles.addressText} numberOfLines={2}>
        {item.address}
      </Text>
      
      <Text style={styles.addressLocation}>
        {item.city}, {item.province} {item.postalCode}
      </Text>
      
      {selectedAddress?.id === item.id && (
        <View style={styles.selectedIcon}>
          <MaterialIcons name="check-circle" size={24} color="#007AFF" />
        </View>
      )}
    </TouchableOpacity>
  );

  const formatSelectedAddress = () => {
    if (!selectedAddress) return 'Pilih alamat pengiriman';
    
    return `${selectedAddress.name} - ${selectedAddress.address}, ${selectedAddress.city}`;
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={styles.selectorButton}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <View style={styles.selectorContent}>
          <MaterialIcons name="location-on" size={24} color="#007AFF" />
          <View style={styles.selectorText}>
            <Text style={styles.selectorLabel}>Alamat Tersimpan</Text>
            <Text 
              style={[
                styles.selectorValue,
                !selectedAddress && styles.placeholder
              ]} 
              numberOfLines={2}
            >
              {formatSelectedAddress()}
            </Text>
          </View>
          <MaterialIcons name="expand-more" size={24} color="#666" />
        </View>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <MaterialIcons name="close" size={24} color="#1a1a1a" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Pilih Alamat Pengiriman</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Content */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Memuat alamat tersimpan...</Text>
            </View>
          ) : addresses.length > 0 ? (
            <FlatList
              data={addresses}
              renderItem={renderAddress}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.addressList}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="location-off" size={64} color="#C7C7CC" />
              <Text style={styles.emptyTitle}>Tidak ada alamat tersimpan</Text>
              <Text style={styles.emptyDescription}>
                Tambahkan alamat di halaman Profil > Alamat Pengiriman
              </Text>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  selectorButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    padding: 16,
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectorText: {
    flex: 1,
    marginLeft: 12,
  },
  selectorLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  selectorValue: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  placeholder: {
    color: '#999',
    fontStyle: 'italic',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
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
  },
  addressList: {
    paddingVertical: 8,
  },
  addressItem: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    position: 'relative',
  },
  selectedAddress: {
    borderColor: '#007AFF',
    borderWidth: 2,
    backgroundColor: '#F8F9FF',
  },
  addressHeader: {
    marginBottom: 8,
  },
  addressTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  addressName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    flex: 1,
  },
  defaultBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  defaultBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  addressPhone: {
    fontSize: 14,
    color: '#666',
  },
  addressText: {
    fontSize: 14,
    color: '#1a1a1a',
    lineHeight: 20,
    marginBottom: 4,
  },
  addressLocation: {
    fontSize: 14,
    color: '#666',
  },
  selectedIcon: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});