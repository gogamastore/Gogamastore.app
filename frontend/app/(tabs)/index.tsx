import React, { useEffect, useState, useCallback, useRef } from 'react';
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
import { productService, categoryService, bannerService, brandService } from '../../services/firestoreService';
import { useRouter } from 'expo-router';

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
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const bannerScrollRef = useRef<ScrollView>(null);
  const bannerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  const PRODUCTS_PER_PAGE = 25;
  useEffect(() => {
    loadInitialData();
  }, []);

  // Auto-slide banner effect
  useEffect(() => {
    if (banners.length > 1) {
      // Clear any existing interval
      if (bannerIntervalRef.current) {
        clearInterval(bannerIntervalRef.current);
      }

      // Set new interval for auto-slide
      bannerIntervalRef.current = setInterval(() => {
        setCurrentBannerIndex(prevIndex => {
          const nextIndex = (prevIndex + 1) % banners.length;
          
          // Scroll to next banner
          if (bannerScrollRef.current) {
            bannerScrollRef.current.scrollTo({
              x: nextIndex * width, // Use full screen width
              y: 0,
              animated: true,
            });
          }
          
          return nextIndex;
        });
      }, 6000); // 6 seconds interval
    }

    // Cleanup interval on component unmount or when banners change
    return () => {
      if (bannerIntervalRef.current) {
        clearInterval(bannerIntervalRef.current);
      }
    };
  }, [banners]);

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
      
      // Sort products: available stock first, out of stock last
      const sortedData = data.sort((a, b) => {
        const aStock = a.stok || 0;
        const bStock = b.stok || 0;
        
        // If both have stock or both are out of stock, sort by name
        if ((aStock > 0 && bStock > 0) || (aStock === 0 && bStock === 0)) {
          return (a.nama || '').localeCompare(b.nama || '');
        }
        
        // Products with stock come first
        return bStock - aStock;
      });
      
      setProducts(sortedData);
      setCurrentPage(1); // Reset to first page when products change
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
      console.log('Fetched brands data:', data);
      setBrands(data);
    } catch (error) {
      console.error('Error fetching brands:', error);
      // Don't show error for brands as it's not critical
    }
  };

  const fetchBanners = async () => {
    try {
      const data = await bannerService.getAllBanners();
      console.log('Fetched banners data:', data);
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

  const navigateToProduct = (productId: string) => {
    router.push(`/product/${productId}`);
  };


  const filteredProducts = products.filter(product =>
    (product.nama || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.deskripsi || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate pagination
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const endIndex = startIndex + PRODUCTS_PER_PAGE;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
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


      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
      {/* Debug Info */}
      <View style={{ padding: 16, backgroundColor: '#f0f0f0' }}>
        <Text style={{ fontSize: 12, color: '#666' }}>
          Debug: Banners: {banners.length}, Brands: {brands.length}
        </Text>
      </View>
      
      {/* Promotional Banners */}
      {banners.length > 0 && (
        <View style={styles.bannersSection}>
          <Text style={styles.sectionTitle}>Penawaran Spesial ({banners.length})</Text>
          <ScrollView 
            ref={bannerScrollRef}
            horizontal 
            showsHorizontalScrollIndicator={false}
            pagingEnabled={true}
            style={styles.bannersContainer}
            scrollEnabled={false} // Disable manual scroll for auto-slide
          >
            {banners.map((banner, index) => {
              console.log('Rendering banner:', banner);
              return (
                <TouchableOpacity key={banner.id} style={styles.bannerCard}>
                  <Image 
                    source={{ uri: banner.imageUrl || banner.image || banner.gambar || banner.url || '' }} 
                    style={styles.bannerImage}
                    resizeMode="cover"
                    onError={() => console.log('Banner image failed to load:', banner)}
                    onLoad={() => console.log('Banner image loaded:', banner)}
                  />
                  <View style={styles.bannerOverlay}>
                    <Text style={styles.bannerTitle}>
                      {banner.title || banner.judul || banner.nama || 'No Title'}
                    </Text>
                    {(banner.description || banner.subtitle || banner.deskripsi) && (
                      <Text style={styles.bannerSubtitle}>
                        {banner.description || banner.subtitle || banner.deskripsi}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          
          {/* Banner Indicators */}
          {banners.length > 1 && (
            <View style={styles.bannerIndicators}>
              {banners.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.bannerIndicator,
                    currentBannerIndex === index && styles.bannerIndicatorActive
                  ]}
                />
              ))}
            </View>
          )}
        </View>
      )}

      {/* Brand Directory */}
      {brands.length > 0 && (
        <View style={styles.brandsSection}>
          <Text style={styles.sectionTitle}>Brand Terpercaya ({brands.length})</Text>
          <View style={styles.brandsGrid}>
            {brands.map((brand) => {
              console.log('Rendering brand:', brand);
              return (
                <TouchableOpacity key={brand.id} style={styles.brandCard}>
                  {(brand.logoUrl || brand.logo || brand.gambar || brand.image) ? (
                    <Image 
                      source={{ uri: brand.logoUrl || brand.logo || brand.gambar || brand.image }} 
                      style={styles.brandLogo}
                      resizeMode="contain"
                      onError={() => console.log('Brand image failed to load:', brand)}
                      onLoad={() => console.log('Brand image loaded:', brand)}
                    />
                  ) : (
                    <View style={styles.brandLogoPlaceholder}>
                      <MaterialIcons name="business" size={32} color="#666" />
                    </View>
                  )}
                  <Text style={styles.brandName}>
                    {brand.nama || brand.name || brand.title || 'Unknown Brand'}
                  </Text>
                </TouchableOpacity>
              );
            })}
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
        <View style={styles.productsSectionHeader}>
          <Text style={styles.sectionTitle}>
            {selectedCategory ? `Produk ${selectedCategory}` : 'Semua Produk'}
          </Text>
          <Text style={styles.productsCount}>
            {filteredProducts.length} produk
          </Text>
        </View>
        
        {/* Product Grid */}
        <FlatList
          data={currentProducts}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.productsContainer}
          scrollEnabled={false} // Disable FlatList scroll since we're in ScrollView
        />

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <View style={styles.paginationContainer}>
            {/* Page Info */}
            <Text style={styles.pageInfo}>
              Halaman {currentPage} dari {totalPages}
            </Text>
            
            {/* Page Navigation */}
            <View style={styles.paginationControls}>
              <TouchableOpacity
                style={[
                  styles.paginationButton,
                  currentPage === 1 && styles.paginationButtonDisabled
                ]}
                onPress={goToPreviousPage}
                disabled={currentPage === 1}
              >
                <MaterialIcons 
                  name="chevron-left" 
                  size={20} 
                  color={currentPage === 1 ? "#C7C7CC" : "#007AFF"} 
                />
              </TouchableOpacity>

              {/* Page Numbers */}
              <View style={styles.pageNumbers}>
                {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
                  let pageNumber;
                  if (totalPages <= 5) {
                    pageNumber = index + 1;
                  } else {
                    const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
                    pageNumber = start + index;
                  }
                  
                  return (
                    <TouchableOpacity
                      key={pageNumber}
                      style={[
                        styles.pageNumberButton,
                        currentPage === pageNumber && styles.pageNumberButtonActive
                      ]}
                      onPress={() => goToPage(pageNumber)}
                    >
                      <Text style={[
                        styles.pageNumberText,
                        currentPage === pageNumber && styles.pageNumberTextActive
                      ]}>
                        {pageNumber}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={[
                  styles.paginationButton,
                  currentPage === totalPages && styles.paginationButtonDisabled
                ]}
                onPress={goToNextPage}
                disabled={currentPage === totalPages}
              >
                <MaterialIcons 
                  name="chevron-right" 
                  size={20} 
                  color={currentPage === totalPages ? "#C7C7CC" : "#007AFF"} 
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
      </ScrollView>
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
    borderRadius: 37.5, // Half of 75 for circular shape
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
  productActions: {
    marginTop: 8,
  },
  viewDetailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  viewDetailText: {
    color: '#007AFF',
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
    width: width - 32, // Full width minus padding
    height: 140,
    marginHorizontal: 16,
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
  bannerIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
  },
  bannerIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 4,
  },
  bannerIndicatorActive: {
    backgroundColor: '#007AFF',
    width: 20,
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
    width: 75,
    height: 75,
    marginBottom: 8,
  },
  brandLogoPlaceholder: {
    width: 75,
    height: 75,
    backgroundColor: '#E5E5EA',
    borderRadius: 37.5, // Half of 75 for circular shape
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
  productsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  productsCount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  paginationContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    alignItems: 'center',
  },
  pageInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  paginationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paginationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  paginationButtonDisabled: {
    backgroundColor: '#f0f0f0',
    borderColor: '#E5E5EA',
  },
  pageNumbers: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  pageNumberButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  pageNumberButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  pageNumberText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  pageNumberTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
});