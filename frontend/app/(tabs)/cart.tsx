import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
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

export default function CartScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCart = async () => {
    if (!user) return;
    
    try {
      console.log('🟢 Cart screen focused - refreshing cart data');
      setLoading(true);
      const items = await cartService.getUserCart(user.uid);
      console.log('🛒 Fetched cart items:', items.length);
      setCartItems(items);
    } catch (error) {
      console.error('Error fetching cart:', error);
      Alert.alert('Error', 'Gagal memuat keranjang');
    } finally {
      setLoading(false);
    }
  };

  // Auto refresh when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      fetchCart();
    }, [user])
  );

  const removeFromCart = async (productId: string) => {
    if (!user) return;

    Alert.alert(
      'Hapus Item',
      'Apakah Anda yakin ingin menghapus item ini dari keranjang?',
      [
        {
          text: 'Batal',
          style: 'cancel',
        },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🔴 Delete TouchableOpacity pressed for item:', productId);
              await cartService.removeFromCart(user.uid, productId);
              
              // Update local state
              setCartItems(prev => prev.filter(item => item.productId !== productId));
              
              Alert.alert('Berhasil', 'Item dihapus dari keranjang');
            } catch (error) {
              console.error('Error removing from cart:', error);
              Alert.alert('Error', 'Gagal menghapus item');
            }
          },
        },
      ]
    );
  };

  const updateQuantity = async (productId: string, newQuantity: number) => {
    if (!user || newQuantity < 1) return;

    try {
      await cartService.updateCartItemQuantity(user.uid, productId, newQuantity);
      
      // Update local state
      setCartItems(prev => 
        prev.map(item => 
          item.productId === productId 
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
    } catch (error) {
      console.error('Error updating quantity:', error);
      Alert.alert('Error', 'Gagal mengupdate jumlah item');
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.harga * item.quantity), 0);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert('Keranjang Kosong', 'Tambahkan produk ke keranjang terlebih dahulu');
      return;
    }
    
    router.push('/checkout');
  };

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartItem}>
      <View style={styles.productImageContainer}>
        {item.gambar ? (
          <Image source={{ uri: item.gambar }} style={styles.productImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <MaterialIcons name="image" size={40} color="#C7C7CC" />
          </View>
        )}
      </View>

      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.nama}
        </Text>
        
        <Text style={styles.productPrice}>
          {formatPrice(item.harga)}
        </Text>
        
        {item.stok !== undefined && (
          <Text style={styles.stockInfo}>
            Stok: {item.stok}
          </Text>
        )}

        <View style={styles.quantityContainer}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => updateQuantity(item.productId, item.quantity - 1)}
            disabled={item.quantity <= 1}
          >
            <MaterialIcons 
              name="remove" 
              size={20} 
              color={item.quantity <= 1 ? '#C7C7CC' : '#007AFF'} 
            />
          </TouchableOpacity>
          
          <Text style={styles.quantityText}>{item.quantity}</Text>
          
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => updateQuantity(item.productId, item.quantity + 1)}
            disabled={item.stok ? item.quantity >= item.stok : false}
          >
            <MaterialIcons 
              name="add" 
              size={20} 
              color={(item.stok && item.quantity >= item.stok) ? '#C7C7CC' : '#007AFF'} 
            />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => removeFromCart(item.productId)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        activeOpacity={0.6}
      >
        <MaterialIcons name="delete" size={18} color="#FF3B30" />
      </TouchableOpacity>
    </View>
  );

  const renderEmptyCart = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="shopping-cart" size={80} color="#C7C7CC" />
      <Text style={styles.emptyTitle}>Keranjang Kosong</Text>
      <Text style={styles.emptySubtitle}>
        Mulai berbelanja dan tambahkan produk ke keranjang Anda
      </Text>
      <TouchableOpacity
        style={styles.shopButton}
        onPress={() => router.push('/(tabs)/')}
      >
        <MaterialIcons name="shopping-bag" size={20} color="#fff" />
        <Text style={styles.shopButtonText}>Mulai Belanja</Text>
      </TouchableOpacity>
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

  if (cartItems.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        {renderEmptyCart()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Keranjang Belanja</Text>
        <Text style={styles.itemCount}>{cartItems.length} item</Text>
      </View>

      {/* Cart Items */}
      <FlatList
        data={cartItems}
        renderItem={renderCartItem}
        keyExtractor={(item) => item.id || item.productId}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />

      {/* Total & Checkout */}
      <View style={styles.checkoutContainer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatPrice(calculateTotal())}</Text>
        </View>
        
        <TouchableOpacity
          style={styles.checkoutButton}
          onPress={handleCheckout}
        >
          <MaterialIcons name="shopping-cart-checkout" size={20} color="#fff" />
          <Text style={styles.checkoutButtonText}>Lanjut ke Pembayaran</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  listContainer: {
    padding: 10,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    marginVertical: 5,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 15,
  },
  itemDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  productPrice: {
    fontSize: 14,
    color: '#888',
    marginVertical: 5,
  },
  productQuantity: {
    fontSize: 14,
    color: '#555',
  },
  removeButton: {
    padding: 10,
  },
  removeButtonText: {
    color: 'red',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#888',
  },
});

export default CartScreen;
