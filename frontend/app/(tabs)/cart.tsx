import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { getCartItems, removeFromCart } from '../../services/firestoreService';
import { useFocusEffect } from '@react-navigation/native';

const CartScreen = () => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCartItems = async () => {
    if (user) {
      try {
        setLoading(true);
        const items = await getCartItems(user.uid);
        setCartItems(items);
      } catch (error) {
        console.error("Failed to fetch cart items:", error);
        Alert.alert("Error", "Gagal memuat item keranjang.");
      } finally {
        setLoading(false);
      }
    }
  };

  // useFocusEffect akan menjalankan fetch data setiap kali layar ini dibuka
  useFocusEffect(
    useCallback(() => {
      fetchCartItems();
    }, [user])
  );

  // Fungsi untuk menangani penghapusan item
  const handleRemoveItem = async (itemId) => {
    if (!user) return;

    try {
      // 1. Hapus item dari Firestore
      await removeFromCart(user.uid, itemId);

      // 2. Perbarui state lokal untuk langsung menghilangkan item dari UI
      setCartItems(currentItems => currentItems.filter(item => item.id !== itemId));
      
      Alert.alert("Sukses", "Item telah dihapus dari keranjang.");

    } catch (error) {
      console.error("Failed to remove item:", error);
      Alert.alert("Error", "Gagal menghapus item.");
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.cartItem}>
      <Image source={{ uri: item.productImage }} style={styles.productImage} />
      <View style={styles.itemDetails}>
        <Text style={styles.productName}>{item.productName}</Text>
        <Text style={styles.productPrice}>Rp {item.productPrice.toLocaleString()}</Text>
        <Text style={styles.productQuantity}>Jumlah: {item.quantity}</Text>
      </View>
      <TouchableOpacity onPress={() => handleRemoveItem(item.id)} style={styles.removeButton}>
        <Text style={styles.removeButtonText}>Hapus</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" style={{ flex: 1, justifyContent: 'center' }} />;
  }

  if (cartItems.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Keranjang belanja Anda kosong.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={cartItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

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
