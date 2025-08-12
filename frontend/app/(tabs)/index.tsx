import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { productService, categoryService, cartService, bannerService, brandService } from '../../services/firestoreService';

interface Product {
  id: string;
  nama: string;
  deskripsi: string;
  harga: number;
  gambar: string;
  kategori: string;
  stok: number;
}

interface Category {
  id: string;
  nama: string;
}

interface Brand {
  id: string;
  nama: string;
  logo?: string;
}

interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  link?: string;
}

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    await Promise.all([fetchProducts(), fetchCategories(), fetchBrands(), fetchBanners()]);
    setLoading(false);
  };

  const fetchProducts = async () => {
    try {
      let data;
      if (selectedCategory) {
        data = await productService.getProductsByCategory(selectedCategory);
      } else {
        data = await productService.getAllProducts();
      }
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      Alert.alert('Error', 'Gagal memuat produk');
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await categoryService.getAllCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      Alert.alert('Error', 'Gagal memuat kategori');
    }
  };

  const fetchBrands = async () => {
    try {
      const data = await brandService.getAllBrands();
      setBrands(data);
    } catch (error) {
      console.error('Error fetching brands:', error);
      // Don't show error for brands as it's not critical
    }
  };

  const fetchBanners = async () => {
    try {
      const data = await bannerService.getAllBanners();
      setBanners(data);
    } catch (error) {
      console.error('Error fetching banners:', error);
      // Don't show error for banners as it's not critical
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  }, []);

  const handleCategorySelect = (categoryName: string) => {
    setSelectedCategory(categoryName === selectedCategory ? '' : categoryName);
  };

  const addToCart = async (product: Product) => {
    if (!user) {
      Alert.alert('Error', 'Anda harus login terlebih dahulu');
      return;
    }

    try {
      await cartService.addToCart(user.uid, product, 1);
      Alert.alert('Berhasil', 'Produk ditambahkan ke keranjang');
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert('Error', 'Gagal menambahkan ke keranjang');
    }
  };

  const filteredProducts = products.filter(product =>
    (product.nama || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.deskripsi || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <View style={styles.productCard}>
      <Image source={{ uri: item.gambar }} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.nama}
        </Text>
        <Text style={styles.productDescription} numberOfLines={2}>
          {item.deskripsi}
        </Text>
        <Text style={styles.productPrice}>{formatPrice(item.harga)}</Text>
        <Text style={styles.productStock}>Stok: {item.stok}</Text>
        <TouchableOpacity
          style={styles.addToCartButton}
          onPress={() => addToCart(item)}
        >
          <MaterialIcons name="add-shopping-cart" size={16} color="#fff" />
          <Text style={styles.addToCartText}>Tambah ke Keranjang</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCategory = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={[
        styles.categoryChip,
        selectedCategory === item.nama && styles.categoryChipSelected,
      ]}
      onPress={() => handleCategorySelect(item.nama)}
    >
      <Text
        style={[
          styles.categoryChipText,
          selectedCategory === item.nama && styles.categoryChipTextSelected,
        ]}
      >
        {item.nama}
      </Text>
    </TouchableOpacity>
  );

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

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
        <Text style={styles.headerTitle}>Gogama Store</Text>
        <MaterialIcons name="notifications" size={24} color="#1a1a1a" />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color="#8E8E93" />
        <TextInput
          style={styles.searchInput}
          placeholder="Cari produk..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Promotional Banners */}
      {banners.length > 0 && (
        <View style={styles.bannersSection}>
          <Text style={styles.sectionTitle}>Penawaran Spesial</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.bannersContainer}
          >
            {banners.map((banner, index) => (
              <TouchableOpacity key={banner.id} style={styles.bannerCard}>
                <Image 
                  source={{ uri: banner.image }} 
                  style={styles.bannerImage}
                  resizeMode="cover"
                />
                <View style={styles.bannerOverlay}>
                  <Text style={styles.bannerTitle}>{banner.title}</Text>
                  {banner.subtitle && (
                    <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Brand Directory */}
      {brands.length > 0 && (
        <View style={styles.brandsSection}>
          <Text style={styles.sectionTitle}>Brand Terpercaya</Text>
          <View style={styles.brandsGrid}>
            {brands.map((brand) => (
              <TouchableOpacity key={brand.id} style={styles.brandCard}>
                {brand.logo ? (
                  <Image 
                    source={{ uri: brand.logo }} 
                    style={styles.brandLogo}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.brandLogoPlaceholder}>
                    <MaterialIcons name="business" size={24} color="#666" />
                  </View>
                )}
                <Text style={styles.brandName}>{brand.nama}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Categories */}
      <View style={styles.categoriesSection}>
        <TouchableOpacity
          style={[
            styles.categoryChip,
            !selectedCategory && styles.categoryChipSelected,
          ]}
          onPress={() => setSelectedCategory('')}
        >
          <Text
            style={[
              styles.categoryChipText,
              !selectedCategory && styles.categoryChipTextSelected,
            ]}
          >
            Semua Kategori
          </Text>
        </TouchableOpacity>
        
        <FlatList
          data={categories}
          renderItem={renderCategory}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
        />
        
        <TouchableOpacity
          style={styles.resetButton}
          onPress={() => setSelectedCategory('')}
        >
          <Text style={styles.resetButtonText}>Reset</Text>
        </TouchableOpacity>
      </View>

      {/* Products */}
      <View style={styles.productsSection}>
        <Text style={styles.sectionTitle}>
          {selectedCategory ? `Produk ${selectedCategory}` : 'Semua Produk'}
        </Text>
        
        <FlatList
          data={filteredProducts}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.productsContainer}
        />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#1a1a1a',
  },
  categoriesSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    backgroundColor: '#fff',
  },
  categoriesContainer: {
    paddingHorizontal: 16,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  categoryChipSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#666',
  },
  categoryChipTextSelected: {
    color: '#fff',
    fontWeight: '500',
  },
  resetButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  productsSection: {
    flex: 1,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  productsContainer: {
    paddingHorizontal: 16,
  },
  productCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 4,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f0f0f0',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 12,
    color: '#666',
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
    color: '#666',
    marginBottom: 8,
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  addToCartText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  bannersSection: {
    paddingVertical: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  bannersContainer: {
    paddingHorizontal: 16,
  },
  bannerCard: {
    width: 280,
    height: 140,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 12,
  },
  bannerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  bannerSubtitle: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.9,
  },
  brandsSection: {
    paddingVertical: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  brandsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  brandCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  brandLogo: {
    width: 40,
    height: 40,
    marginBottom: 8,
  },
  brandLogoPlaceholder: {
    width: 40,
    height: 40,
    backgroundColor: '#E5E5EA',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  brandName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1a1a1a',
    textAlign: 'center',
  },
});