import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { productService } from '../../services/firestoreService';

interface Product {
  id: string;
  nama: string;
  deskripsi: string;
  harga: number;
  gambar: string;
  kategori: string;
  stok: number;
  trendingOrder?: number;
}

export default function TrendingScreen() {
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTrendingProducts();
  }, []);

  const fetchTrendingProducts = async () => {
    setLoading(true);
    try {
      console.log('📈 Fetching trending products...');
      const data = await productService.getTrendingProducts();
      setTrendingProducts(data);
      console.log('✅ Trending products loaded:', data.length);
    } catch (error) {
      console.error('Error fetching trending products:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTrendingProducts();
    setRefreshing(false);
  };

  const navigateToProduct = (productId: string) => {
    router.push(`/product/${productId}`);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity 
      style={styles.productCard}
      onPress={() => navigateToProduct(item.id)}
      activeOpacity={0.7}
    >
      <Image source={{ uri: item.gambar }} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.nama}
        </Text>
        <Text style={styles.productDescription} numberOfLines={2}>
          {item.deskripsi}
        </Text>
        <Text style={styles.productPrice}>{formatPrice(item.harga)}</Text>
        <Text style={[
          styles.productStock,
          { color: item.stok === 0 ? '#FF3B30' : '#666' }
        ]}>
          {item.stok === 0 ? 'Stok: Habis' : `Stok: ${item.stok}`}
        </Text>
        
        <View style={styles.productActions}>
          <TouchableOpacity
            style={styles.viewDetailButton}
            onPress={() => navigateToProduct(item.id)}
          >
            <MaterialIcons name="visibility" size={16} color="#007AFF" />
            <Text style={styles.viewDetailText}>Lihat Detail</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Memuat produk trending...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Produk Trending</Text>
        <Text style={styles.subtitle}>Produk terpopuler saat ini</Text>
      </View>

      <FlatList
        data={trendingProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.productsContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="trending-up" size={64} color="#C7C7CC" />
            <Text style={styles.emptyTitle}>Belum Ada Produk Trending</Text>
            <Text style={styles.emptySubtitle}>
              Produk trending akan muncul di sini
            </Text>
          </View>
        )}
      />
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
    color: '#8E8E93',
    textAlign: 'center',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
  },
  productsContainer: {
    padding: 16,
  },
  productCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    marginHorizontal: '1%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#f0f0f0',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
    lineHeight: 18,
  },
  productDescription: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 8,
    lineHeight: 16,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  productStock: {
    fontSize: 12,
    marginBottom: 8,
  },
  productActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewDetailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#f0f8ff',
    borderRadius: 6,
  },
  viewDetailText: {
    fontSize: 12,
    color: '#007AFF',
    marginLeft: 4,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#C7C7CC',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
