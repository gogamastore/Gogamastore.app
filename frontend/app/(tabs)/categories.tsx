import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  startAfter, 
  endBefore,
  limitToLast 
} from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface Product {
  id: string;
  nama: string;
  harga: number;
  gambar?: string;
  stok?: number;
  deskripsi?: string;
}

export default function KatalogScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastDoc, setLastDoc] = useState(null);
  const [firstDoc, setFirstDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  
  const PRODUCTS_PER_PAGE = 100;

  useEffect(() => {
    loadInitialProducts();
  }, [loadInitialProducts]);

  const loadInitialProducts = useCallback(async () => {
    setLoading(true);
    try {
      console.log('📋 Loading initial products for catalog...');
      
      // Query: Order by nama (alphabetical), then by stock (out of stock last)
      // For now, we'll do client-side sorting since Firestore has limitations on multiple orderBy
      const q = query(
        collection(db, 'products'),
        orderBy('nama', 'asc'),
        limit(PRODUCTS_PER_PAGE)
      );
      
      const querySnapshot = await getDocs(q);
      const productsList = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        productsList.push({
          id: doc.id,
          nama: data.name || data.nama || '',
          harga: data.price || data.harga || 0,
          gambar: data.image || data.gambar || '',
          stok: data.stock || data.stok || 0,
          deskripsi: data.description || data.deskripsi || '',
        });
      });
      
      // Client-side sort: Products with stock first, then alphabetical
      const sortedProducts = sortProducts(productsList);
      
      setProducts(sortedProducts);
      
      // Set pagination markers
      const docs = querySnapshot.docs;
      if (docs.length > 0) {
        setFirstDoc(docs[0]);
        setLastDoc(docs[docs.length - 1]);
        setHasMore(docs.length === PRODUCTS_PER_PAGE);
      } else {
        setHasMore(false);
      }
      
      console.log('✅ Initial products loaded:', sortedProducts.length);
      
    } catch (error) {
      console.error('❌ Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNextPage = async () => {
    if (!hasMore || loadingMore || !lastDoc) return;
    
    setLoadingMore(true);
    try {
      console.log('📋 Loading next page...');
      
      const q = query(
        collection(db, 'products'),
        orderBy('nama', 'asc'),
        startAfter(lastDoc),
        limit(PRODUCTS_PER_PAGE)
      );
      
      const querySnapshot = await getDocs(q);
      const newProducts = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        newProducts.push({
          id: doc.id,
          nama: data.name || data.nama || '',
          harga: data.price || data.harga || 0,
          gambar: data.image || data.gambar || '',
          stok: data.stock || data.stok || 0,
          deskripsi: data.description || data.deskripsi || '',
        });
      });
      
      // Sort new products and append
      const sortedNewProducts = sortProducts(newProducts);
      setProducts(prev => [...prev, ...sortedNewProducts]);
      
      // Update pagination markers
      const docs = querySnapshot.docs;
      if (docs.length > 0) {
        setLastDoc(docs[docs.length - 1]);
        setHasMore(docs.length === PRODUCTS_PER_PAGE);
        setCurrentPage(prev => prev + 1);
      } else {
        setHasMore(false);
      }
      
      console.log('✅ Next page loaded:', sortedNewProducts.length);
      
    } catch (error) {
      console.error('❌ Error loading next page:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const loadPreviousPage = async () => {
    if (currentPage <= 1 || loadingMore || !firstDoc) return;
    
    setLoadingMore(true);
    try {
      console.log('📋 Loading previous page...');
      
      const q = query(
        collection(db, 'products'),
        orderBy('nama', 'asc'),
        endBefore(firstDoc),
        limitToLast(PRODUCTS_PER_PAGE)
      );
      
      const querySnapshot = await getDocs(q);
      const previousProducts = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        previousProducts.push({
          id: doc.id,
          nama: data.name || data.nama || '',
          harga: data.price || data.harga || 0,
          gambar: data.image || data.gambar || '',
          stok: data.stock || data.stok || 0,
          deskripsi: data.description || data.deskripsi || '',
        });
      });
      
      // Sort and replace current products
      const sortedPreviousProducts = sortProducts(previousProducts);
      setProducts(sortedPreviousProducts);
      
      // Update pagination markers
      const docs = querySnapshot.docs;
      if (docs.length > 0) {
        setFirstDoc(docs[0]);
        setLastDoc(docs[docs.length - 1]);
        setCurrentPage(prev => prev - 1);
      }
      
      console.log('✅ Previous page loaded:', sortedPreviousProducts.length);
      
    } catch (error) {
      console.error('❌ Error loading previous page:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const sortProducts = (productsList: Product[]) => {
    return productsList.sort((a, b) => {
      const aStock = a.stok || 0;
      const bStock = b.stok || 0;
      
      // If both have stock or both are out of stock, sort by name
      if ((aStock > 0 && bStock > 0) || (aStock === 0 && bStock === 0)) {
        return (a.nama || '').localeCompare(b.nama || '');
      }
      
      // Products with stock come first
      return bStock - aStock;
    });
  };

  const navigateToProduct = (productId: string) => {
    router.push(`/product/${productId}`);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const filteredProducts = products.filter(product =>
    (product.nama || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.deskripsi || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity style={styles.productCard} onPress={() => navigateToProduct(item.id)}>
      <View style={styles.imageContainer}>
        {item.gambar ? (
          <Image
            source={{ uri: item.gambar }}
            style={styles.productImage}
            
          />
        ) : (
          <View style={styles.placeholderImage}>
            <MaterialIcons name="image" size={40} color="#C7C7CC" />
          </View>
        )}
        {item.stok === 0 && (
          <View style={styles.outOfStockBadge}>
            <Text style={styles.outOfStockText}>Habis</Text>
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
        <Text style={styles.stockInfo}>
          Stok: {item.stok || 0}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Memuat katalog produk...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Search */}
      <View style={styles.header}>
        <Text style={styles.title}>Katalog Produk</Text>
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari produk..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#8E8E93"
          />
        </View>
        <Text style={styles.productCount}>
          Menampilkan {filteredProducts.length} produk (halaman {currentPage})
        </Text>
      </View>

      {/* Products Grid */}
      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.productsContainer}
        onEndReached={loadNextPage}
        onEndReachedThreshold={0.5}
        ListFooterComponent={() => (
          loadingMore ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingMoreText}>Memuat produk lainnya...</Text>
            </View>
          ) : null
        )}
      />

      {/* Pagination Controls */}
      <View style={styles.paginationContainer}>
        <TouchableOpacity
          style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
          onPress={loadPreviousPage}
          disabled={currentPage === 1 || loadingMore}
        >
          <MaterialIcons 
            name="arrow-back" 
            size={20} 
            color={currentPage === 1 ? "#C7C7CC" : "#007AFF"} 
          />
          <Text style={[
            styles.paginationText, 
            currentPage === 1 && styles.paginationTextDisabled
          ]}>
            Sebelumnya
          </Text>
        </TouchableOpacity>
        
        <Text style={styles.pageIndicator}>
          Halaman {currentPage}
        </Text>
        
        <TouchableOpacity
          style={[styles.paginationButton, !hasMore && styles.paginationButtonDisabled]}
          onPress={loadNextPage}
          disabled={!hasMore || loadingMore}
        >
          <Text style={[
            styles.paginationText, 
            !hasMore && styles.paginationTextDisabled
          ]}>
            Selanjutnya
          </Text>
          <MaterialIcons 
            name="arrow-forward" 
            size={20} 
            color={!hasMore ? "#C7C7CC" : "#007AFF"} 
          />
        </TouchableOpacity>
      </View>
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#1a1a1a',
  },
  productCount: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  productsContainer: {
    padding: 16,
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
  },
  imageContainer: {
    height: 120,
    backgroundColor: '#f8f9fa',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  outOfStockBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  outOfStockText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
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
  stockInfo: {
    fontSize: 12,
    color: '#8E8E93',
  },
  loadingMore: {
    padding: 20,
    alignItems: 'center',
  },
  loadingMoreText: {
    marginTop: 8,
    fontSize: 14,
    color: '#8E8E93',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  paginationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  paginationButtonDisabled: {
    backgroundColor: '#f8f8f8',
  },
  paginationText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    marginHorizontal: 4,
  },
  paginationTextDisabled: {
    color: '#C7C7CC',
  },
  pageIndicator: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
});
