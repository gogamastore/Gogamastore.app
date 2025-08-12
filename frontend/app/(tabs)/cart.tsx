import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface CartItem {
  product_id: string;
  nama: string;
  harga: number;
  gambar: string;
  quantity: number;
}

interface Cart {
  id: string;
  user_id: string;
  items: CartItem[];
  total: number;
}

export default function CartScreen() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/cart`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCart(data);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCart();
    setRefreshing(false);
  }, []);

  const removeFromCart = async (productId: string) => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/cart/remove/${productId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchCart(); // Refresh cart
        Alert.alert('Berhasil', 'Item dihapus dari keranjang');
      } else {
        Alert.alert('Error', 'Gagal menghapus item');
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
      Alert.alert('Error', 'Terjadi kesalahan');
    }
  };

  const confirmRemoveItem = (item: CartItem) => {
    Alert.alert(
      'Konfirmasi',
      `Hapus ${item.nama} dari keranjang?`,
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Hapus', style: 'destructive', onPress: () => removeFromCart(item.product_id) },
      ]
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleCheckout = () => {
    if (!cart || cart.items.length === 0) {
      Alert.alert('Keranjang Kosong', 'Tambahkan produk ke keranjang terlebih dahulu');
      return;
    }

    Alert.alert(
      'Checkout',
      `Total pembayaran: ${formatPrice(cart.total)}\n\nFitur checkout akan segera tersedia.`,
      [{ text: 'OK' }]
    );
  };

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartItem}>
      <Image source={{ uri: item.gambar }} style={styles.itemImage} />
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={2}>
          {item.nama}
        </Text>
        <Text style={styles.itemPrice}>{formatPrice(item.harga)}</Text>
        <View style={styles.quantityRow}>
          <Text style={styles.quantityLabel}>Jumlah: {item.quantity}</Text>
          <Text style={styles.subtotal}>
            {formatPrice(item.harga * item.quantity)}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => confirmRemoveItem(item)}
      >
        <MaterialIcons name="delete" size={20} color="#FF3B30" />
      </TouchableOpacity>
    </View>
  );

  const renderEmptyCart = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="shopping-cart" size={64} color="#C7C7CC" />
      <Text style={styles.emptyTitle}>Keranjang Kosong</Text>
      <Text style={styles.emptyDescription}>
        Belum ada produk di keranjang Anda
      </Text>
    </View>
  );

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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Keranjang Belanja</Text>
        {cart && cart.items.length > 0 && (
          <Text style={styles.itemCount}>{cart.items.length} item</Text>
        )}
      </View>

      {/* Cart Items or Empty State */}
      {cart && cart.items.length > 0 ? (
        <>
          <FlatList
            data={cart.items}
            renderItem={renderCartItem}
            keyExtractor={(item) => item.product_id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={styles.cartContainer}
          />

          {/* Checkout Section */}
          <View style={styles.checkoutSection}>
            <View style={styles.totalSection}>
              <Text style={styles.totalLabel}>Total Pembayaran:</Text>
              <Text style={styles.totalAmount}>{formatPrice(cart.total)}</Text>
            </View>
            <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
              <Text style={styles.checkoutButtonText}>Checkout</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.contentContainer}>
          {renderEmptyCart()}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  itemCount: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  contentContainer: {
    flex: 1,
  },
  cartContainer: {
    padding: 16,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  quantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityLabel: {
    fontSize: 14,
    color: '#666',
  },
  subtotal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  removeButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  checkoutSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    color: '#666',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  checkoutButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});