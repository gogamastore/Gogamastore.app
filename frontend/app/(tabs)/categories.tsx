import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Category {
  id: string;
  nama: string;
  gambar?: string;
}

interface Product {
  id: string;
  nama: string;
  kategori: string;
}

export default function CategoriesScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([fetchCategories(), fetchProducts()]);
    setLoading(false);
  };

  const fetchCategories = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/categories`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/products`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const getProductCountByCategory = (categoryName: string) => {
    return products.filter(product => product.kategori === categoryName).length;
  };

  const handleCategoryPress = (categoryName: string) => {
    // Navigate to home screen with category filter
    router.navigate('/(tabs)');
    // You can implement category navigation here
  };

  const renderCategory = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={() => handleCategoryPress(item.nama)}
    >
      <View style={styles.categoryIcon}>
        <MaterialIcons 
          name={getCategoryIcon(item.nama)} 
          size={32} 
          color="#007AFF" 
        />
      </View>
      <View style={styles.categoryInfo}>
        <Text style={styles.categoryName}>{item.nama}</Text>
        <Text style={styles.categoryCount}>
          {getProductCountByCategory(item.nama)} produk
        </Text>
      </View>
      <MaterialIcons name="chevron-right" size={24} color="#C7C7CC" />
    </TouchableOpacity>
  );

  const getCategoryIcon = (categoryName: string) => {
    const safeCategoryName = (categoryName || '').toLowerCase();
    switch (safeCategoryName) {
      case 'elektronik':
        return 'devices';
      case 'fashion':
        return 'checkroom';
      case 'makanan':
        return 'restaurant';
      case 'kesehatan':
        return 'local-hospital';
      default:
        return 'category';
    }
  };

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
        <Text style={styles.headerTitle}>Kategori Produk</Text>
      </View>

      {/* Categories List */}
      <FlatList
        data={categories}
        renderItem={renderCategory}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
      />

      {/* All Products Option */}
      <TouchableOpacity
        style={[styles.categoryCard, styles.allProductsCard]}
        onPress={() => router.navigate('/(tabs)')}
      >
        <View style={styles.categoryIcon}>
          <MaterialIcons name="apps" size={32} color="#34C759" />
        </View>
        <View style={styles.categoryInfo}>
          <Text style={styles.categoryName}>Semua Produk</Text>
          <Text style={styles.categoryCount}>{products.length} produk</Text>
        </View>
        <MaterialIcons name="chevron-right" size={24} color="#C7C7CC" />
      </TouchableOpacity>
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
  categoriesContainer: {
    padding: 16,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
  allProductsCard: {
    borderColor: '#34C759',
    borderWidth: 1,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    backgroundColor: '#f0f8ff',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 14,
    color: '#8E8E93',
  },
});