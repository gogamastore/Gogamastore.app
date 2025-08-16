import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { productService } from '../../services/firestoreService';

interface TrendingProduct {
  id: string;
  productId: string;
}

interface Product {
  id: string;
  nama: string;
  harga: number;
  gambar?: string;
  stok?: number;
  deskripsi?: string;
}

export default function TrendingScreen() {
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrendingProducts();
  }, []);

  const fetchTrendingProducts = async () => {
    try {
      console.log('🔥 Fetching trending products...');
      
      // Step 1: Get trending product IDs from /trending_products collection
      const trendingRef = collection(db, 'trending_products');
      const trendingSnapshot = await getDocs(trendingRef);
      
      if (trendingSnapshot.empty) {
        console.log('⚠️ No trending products found in Firebase');
        setLoading(false);
        return;
      }
      
      const trendingData: TrendingProduct[] = trendingSnapshot.docs.map(doc => ({
        id: doc.id,
        productId: doc.data().productId,
        ...doc.data()
      }));
      
      console.log('📋 Found trending product IDs:', trendingData);
      
      // Step 2: Get product details for each trending product ID using productService
      const productPromises = trendingData.map(async (trending) => {
        try {
          console.log('🔍 Fetching product data for ID:', trending.productId);
          const productData = await productService.getProductById(trending.productId);
          
          console.log('📦 Product data from service:', {
            id: productData.id,
            nama: productData.nama,
            harga: productData.harga,
            gambar: productData.gambar,
            hasImage: !!productData.gambar
          });
          
          return productData;
        } catch (error) {
          console.error(`❌ Error fetching product ${trending.productId}:`, error);
          return null;
        }
      });
      
      const products = await Promise.all(productPromises);
      const validProducts = products.filter(product => product !== null) as Product[];
      
      console.log('✅ Loaded trending products:', validProducts.length);
      console.log('📋 Products with images:', validProducts.filter(p => p.gambar).length);
      console.log('📋 Products details:', validProducts.map(p => ({ 
        id: p.id, 
        nama: p.nama, 
        harga: p.harga,
        hasImage: !!p.gambar
      })));
      setTrendingProducts(validProducts);
      
    } catch (error) {
      console.error('❌ Error fetching trending products:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number | string | undefined) => {
    // Handle various price formats
    if (price === undefined || price === null) {
      return 'Harga tidak tersedia';
    }
    
    let numPrice: number;
    
    if (typeof price === 'string') {
      // Remove any existing currency formatting and parse
      const cleanPrice = price.replace(/[Rp\s\.,]/g, '');
      numPrice = parseInt(cleanPrice) || 0;
    } else if (typeof price === 'number') {
      numPrice = price;
    } else {
      console.warn('⚠️ Invalid price format:', price);
      return 'Harga tidak valid';
    }
    
    if (isNaN(numPrice) || numPrice <= 0) {
      console.warn('⚠️ Invalid price value:', price);
      return 'Harga tidak tersedia';
    }
    
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(numPrice);
  };

  const handleProductPress = (productId: string) => {
    router.push(`/product/${productId}`);
  };

  const renderTrendingProduct = ({ item, index }: { item: Product; index: number }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => handleProductPress(item.id)}
      activeOpacity={0.7}
    >
      {/* Trending Badge */}
      <View style={styles.trendingBadge}>
        <MaterialIcons name="trending-up" size={16} color="#fff" />
        <Text style={styles.trendingRank}>#{index + 1}</Text>
      </View>

      {/* Product Image */}
      <View style={styles.productImageContainer}>
        {item.gambar ? (
          <Image 
            source={{ uri: item.gambar }} 
            style={styles.productImage} 
            onLoad={() => console.log('✅ Image loaded successfully:', item.gambar)}
            onError={(error) => console.log('❌ Image load error:', error, 'URL:', item.gambar)}
          />
        ) : (
          <View style={styles.placeholderImage}>
            <MaterialIcons name="image" size={40} color="#C7C7CC" />
            <Text style={{ fontSize: 10, color: '#999', textAlign: 'center', marginTop: 4 }}>
              No Image
            </Text>
          </View>
        )}
      </View>

      {/* Product Info */}
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.nama || item.name || 'Nama produk tidak tersedia'}
        </Text>
        
        <Text style={styles.productPrice}>
          {formatPrice(item.harga || item.price)}
        </Text>
        
        {(item.stok !== undefined || item.stock !== undefined) && (
          <Text style={styles.productStock}>
            Stok: {item.stok || item.stock || 0}
          </Text>
        )}
        
        <View style={styles.trendingIndicator}>
          <MaterialIcons name="local-fire-department" size={14} color="#FF6B35" />
          <Text style={styles.trendingText}>Produk Trending</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="trending-up" size={64} color="#C7C7CC" />
      <Text style={styles.emptyTitle}>Belum Ada Produk Trending</Text>
      <Text style={styles.emptySubtitle}>
        Produk trending akan muncul di sini berdasarkan popularitas dan penjualan
      </Text>
      <TouchableOpacity 
        style={styles.refreshButton}
        onPress={fetchTrendingProducts}
      >
        <MaterialIcons name="refresh" size={20} color="#007AFF" />
        <Text style={styles.refreshButtonText}>Refresh</Text>
      </TouchableOpacity>
    </View>
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
      {/* Header */}
      <View style={styles.header}>
        <MaterialIcons name="trending-up" size={24} color="#FF6B35" />
        <Text style={styles.headerTitle}>Produk Trending</Text>
        <TouchableOpacity onPress={fetchTrendingProducts} style={styles.refreshHeaderButton}>
          <MaterialIcons name="refresh" size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Trending Products List */}
      {trendingProducts.length > 0 ? (
        <>
          <View style={styles.statsContainer}>
            <Text style={styles.statsText}>
              {trendingProducts.length} produk sedang trending saat ini
            </Text>
          </View>
          
          <FlatList
            data={trendingProducts}
            renderItem={renderTrendingProduct}
            keyExtractor={(item) => item.id}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.productsContainer}
            columnWrapperStyle={styles.productRow}
          />
        </>
      ) : (
        renderEmptyState()
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
    color: '#8E8E93',
    textAlign: 'center',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    flex: 1,
    marginLeft: 12,
  },
  refreshHeaderButton: {
    padding: 4,
  },
  statsContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  statsText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  productsContainer: {
    padding: 16,
  },
  productRow: {
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
    position: 'relative',
  },
  trendingBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  trendingRank: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  productImageContainer: {
    height: 120,
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
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
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  productStock: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 8,
  },
  trendingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  trendingText: {
    fontSize: 10,
    color: '#FF6B35',
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#C7C7CC',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  refreshButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: 12,
  },
});