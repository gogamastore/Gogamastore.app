import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
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
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { cartService } from '../../services/firestoreService';

interface CartItem {
  id: string;
  productId: string;
  nama: string;
  harga: number;
  quantity: number;
  gambar?: string;
  stok?: number;
}

interface Cart {
  id: string;
  user_id: string;
  items: CartItem[];
  total: number;
  updated_at: string;
}

export default function CartScreen() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<CartItem | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      fetchCart();
    }
  }, [user]);

  // Auto-refresh cart when screen gains focus
  useFocusEffect(
    useCallback(() => {
      if (user) {
        console.log('🟢 Cart screen focused - refreshing cart data');
        fetchCart();
      }
    }, [user])
  );

  const fetchCart = async () => {
    if (!user) return;
    
    try {
      const data = await cartService.getUserCart(user.uid);
      setCart(data);
    } catch (error) {
      console.error('Error fetching cart:', error);
      Alert.alert('Error', 'Gagal memuat keranjang');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCart();
    setRefreshing(false);
  }, [user]);

  const removeFromCart = async (productId: string) => {
    if (!user) return;

    console.log('🔴 removeFromCart called with productId:', productId);
    
    try {
      await cartService.removeFromCart(user.uid, productId);
      console.log('✅ Item removed from cart');
      
      // Refresh cart data
      await fetchCart();
      Alert.alert('Berhasil', 'Item dihapus dari keranjang');
    } catch (error) {
      console.error('❌ Error removing from cart:', error);
      Alert.alert('Error', 'Gagal menghapus item');
    }
  };

  const updateQuantity = async (productId: string, newQuantity: number) => {
    if (!user || newQuantity < 1) {
      console.log('❌ updateQuantity failed:', { user: !!user, newQuantity });
      return;
    }

    try {
      console.log('🔄 Updating quantity:', productId, 'to', newQuantity);
      console.log('🔄 User context:', { uid: user.uid, email: user.email });
      
      // Use the service to update quantity directly
      await cartService.updateCartItemQuantity(user.uid, productId, newQuantity);
      console.log('✅ cartService.updateCartItemQuantity completed');
      
      // Refresh cart data
      await fetchCart();
      console.log('✅ Quantity updated and cart refreshed successfully');
    } catch (error) {
      console.error('❌ Error updating quantity:', error);
      console.error('❌ Error details:', { message: error.message, code: error.code });
      Alert.alert('Error', 'Gagal mengupdate jumlah item: ' + error.message);
    }
  };

  const incrementQuantity = (productId: string, currentQuantity: number) => {
    updateQuantity(productId, currentQuantity + 1);
  };

  const decrementQuantity = (productId: string, currentQuantity: number) => {
    if (currentQuantity > 1) {
      updateQuantity(productId, currentQuantity - 1);
    }
  };

  const confirmRemoveItem = (productName: string, productId: string) => {
    console.log('🔴 confirmRemoveItem called for:', productName);
    
    // Set item to delete and show modal
    setItemToDelete({ name: productName, id: productId });
    setDeleteModalVisible(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    
    try {
      console.log('🗑️ Confirmed delete for:', itemToDelete.name);
      setDeleteModalVisible(false);
      
      // Remove from cart
      await removeFromCart(itemToDelete.id);
      
      console.log('✅ Item deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting item:', error);
      setDeleteModalVisible(false);
    }
  };

  const handleDeleteCancel = () => {
    console.log('❌ Delete cancelled by user');
    setDeleteModalVisible(false);
    setItemToDelete(null);
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

    router.push('/checkout');
  };

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartItem}>
      <Image source={{ uri: item.gambar }} style={styles.itemImage} />
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={2}>
          {item.nama}
        </Text>
        <Text style={styles.itemPrice}>{formatPrice(item.harga)}</Text>
        
        {/* Quantity Controls */}
        <View style={styles.quantityContainer}>
          <View style={styles.quantityControls}>
            <TouchableOpacity
              style={[
                styles.quantityButton,
                item.quantity <= 1 && styles.quantityButtonDisabled
              ]}
              onPress={() => {
                console.log('➖ Decrement button pressed for:', item.nama);
                updateQuantity(item.productId, item.quantity - 1);
              }}
              disabled={item.quantity <= 1}
            >
              <MaterialIcons 
                name="remove" 
                size={20} 
                color={item.quantity <= 1 ? "#C7C7CC" : "#007AFF"} 
              />
            </TouchableOpacity>
            
            <View style={styles.quantityDisplay}>
              <Text style={styles.quantityText}>{item.quantity}</Text>
            </View>
            
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => {
                console.log('➕ Increment button pressed for:', item.nama);
                updateQuantity(item.productId, item.quantity + 1);
              }}
            >
              <MaterialIcons name="add" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.subtotal}>
            {formatPrice(item.harga * item.quantity)}
          </Text>
        </View>
      </View>
      
      {/* React Native Delete Button */}
      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={() => {
          console.log('🗑️ Delete button pressed for:', item.nama);
          confirmRemoveItem(item.nama, item.productId);
        }}
        activeOpacity={0.7}
      >
        <MaterialIcons name="delete" size={18} color="#fff" />
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
          <Text style={styles.loadingText}>Memuat keranjang...</Text>
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
            keyExtractor={(item) => item.productId}
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
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
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
  removeButtonEnhanced: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 48,
    height: 48,
    backgroundColor: '#FF3B30',
    borderRadius: 24,
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  quantityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quantityButtonDisabled: {
    backgroundColor: '#f0f0f0',
    shadowOpacity: 0,
    elevation: 0,
  },
  quantityDisplay: {
    minWidth: 40,
    paddingHorizontal: 12,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  deleteButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 48,
    height: 48,
    backgroundColor: '#FF3B30',
    borderRadius: 24,
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});