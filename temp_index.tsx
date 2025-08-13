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
      {/* Promotional Banners */}
      {banners.length > 0 && (
        <View style={styles.bannersSection}>
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
          <Text style={styles.sectionTitle}>Brand Favoritmu</Text>
          <View style={styles.brandsGrid}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.brandsScrollContainer}
            style={styles.brandsScrollView}
          >
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
                      <MaterialIcons name="business" size={20} color="#666" />
                    </View>
                  )}
                  <Text style={styles.brandName}>
                    {brand.nama || brand.name || brand.title || 'Unknown Brand'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
