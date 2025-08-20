import React, { useState, useEffect } from 'react';
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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { brandService, promotionService, cartService } from '../../services/firestoreService';

const { width } = Dimensions.get('window');
const numColumns = 2;
const itemWidth = (width - 48) / numColumns; // 48 = margins and gaps

interface Brand {
  id: string;
  name: string;
  logoUrl: string;
  description?: string;
}

interface Product {
  id: string;
  nama: string;
  deskripsi: string;
  gambar: string;
  kategori: string;
  harga: number;
  stok: number;
  brandId: string;
}

interface Promotion {
  id: string;
  discountPrice: number;
  discountPercentage: number;
  promoText: string;
  active: boolean;
}

export default function BrandDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  
  const brandId = params.brandId as string;
  
  // Component state
  const [brand, setBrand] = useState<Brand | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [promotions, setPromotions] = useState<Record<string, Promotion>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addingToCart, setAddingToCart] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (brandId) {
      loadBrandData();
    }
  }, [brandId]);

  const loadBrandData = async () => {
    try {
      setLoading(true);
      console.log('🏢 Loading brand data for brandId:', brandId);

      // Step 1: Get brand details
      const brandData = await brandService.getBrandById(brandId);
      setBrand(brandData);
      console.log('✅ Brand data loaded:', brandData.name);

      // Step 2: Get products for this brand
      const productsData = await brandService.getProductsByBrandId(brandId);
      setProducts(productsData);
      console.log(`✅ Loaded ${productsData.length} products for brand`);

      // Step 3: Check for promotions
      if (productsData.length > 0) {
        const productIds = productsData.map(p => p.id);
        const promotionsData = await promotionService.checkProductPromotions(productIds);
        setPromotions(promotionsData);
        console.log(`✅ Checked promotions for ${Object.keys(promotionsData).length} products`);
      }

    } catch (error) {
      console.error('❌ Error loading brand data:', error);
      Alert.alert('Error', 'Gagal memuat data brand. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBrandData();
    setRefreshing(false);
  };

  const formatPrice = (price: number, originalPrice?: number) => {
    const formatNumber = (num: number) => {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(num);
    };

    if (originalPrice && originalPrice > price) {
      return {
        discountPrice: formatNumber(price),
        originalPrice: formatNumber(originalPrice),
        hasDiscount: true
      };
    }

    return {
      discountPrice: formatNumber(price),
      originalPrice: null,
      hasDiscount: false
    };
  };

  const handleAddToCart = async (product: Product) => {
    if (!user) {
      Alert.alert('Error', 'Silakan login terlebih dahulu');
      return;
    }

    if (product.stok <= 0) {
      Alert.alert('Stok Habis', 'Produk ini sedang tidak tersedia');
      return;
    }

    setAddingToCart(prev => ({ ...prev, [product.id]: true }));

    try {
      await cartService.addToCart(user.uid, product, 1);
      Alert.alert('Berhasil', `${product.nama} ditambahkan ke keranjang`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert('Error', 'Gagal menambahkan ke keranjang');
    } finally {
      setAddingToCart(prev => ({ ...prev, [product.id]: false }));
    }
  };

  const renderProductItem = ({ item }: { item: Product }) => {
    const promotion = promotions[item.id];
    const hasPromo = !!promotion;
    const displayPrice = hasPromo ? promotion.discountPrice : item.harga;
    const priceInfo = formatPrice(displayPrice, hasPromo ? item.harga : undefined);
    const isAddingToCart = addingToCart[item.id];

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => router.push(`/product/${item.id}`)}
        activeOpacity={0.7}
      >
        {/* Product Image */}
        <View style={styles.imageContainer}>
          {item.gambar ? (
            <Image 
              source={{ uri: item.gambar }} 
              style={styles.productImage}
              onError={(error) => {
                console.log('❌ Failed to load image for product:', item.nama, 'URL:', item.gambar, 'Error:', error);
              }}
              onLoad={() => {
                console.log('✅ Successfully loaded image for product:', item.nama);
              }}
            />
          ) : (
            <View style={[styles.productImage, styles.placeholderImage]}>
              <MaterialIcons name="image" size={40} color="#ccc" />
              <Text style={styles.placeholderText}>Tidak ada gambar</Text>
            </View>
          )}
          
          {/* Promo Badge */}
          {hasPromo && (
            <View style={styles.promoBadge}>
              <Text style={styles.promoBadgeText}>{promotion.promoText}</Text>
            </View>
          )}
          
          {/* Stock Badge */}
          {item.stok <= 0 && (
            <View style={styles.stockBadge}>
              <Text style={styles.stockBadgeText}>Habis</Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.nama}
          </Text>
          
          <Text style={styles.productCategory} numberOfLines={1}>
            {item.kategori}
          </Text>

          {/* Price */}
          <View style={styles.priceContainer}>
            <Text style={styles.currentPrice}>
              {priceInfo.discountPrice}
            </Text>
            {priceInfo.hasDiscount && (
              <Text style={styles.originalPrice}>
                {priceInfo.originalPrice}
              </Text>
            )}
          </View>

          {/* Stock Info */}
          <Text style={styles.stockText}>
            Stok: {item.stok > 0 ? item.stok : 'Habis'}
          </Text>

          {/* Add to Cart Button */}
          <TouchableOpacity
            style={[
              styles.addToCartButton,
              (item.stok <= 0 || isAddingToCart) && styles.addToCartButtonDisabled
            ]}
            onPress={() => handleAddToCart(item)}
            disabled={item.stok <= 0 || isAddingToCart}
          >
            {isAddingToCart ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <MaterialIcons name="add-shopping-cart" size={16} color="#fff" />
                <Text style={styles.addToCartText}>
                  {item.stok <= 0 ? 'Habis' : 'Tambah'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContent}>
      {/* Brand Info */}
      {brand && (
        <View style={styles.brandInfoCard}>
          <View style={styles.brandLogoContainer}>
            {brand.logoUrl ? (
              <Image source={{ uri: brand.logoUrl }} style={styles.brandLogo} />
            ) : (
              <View style={[styles.brandLogo, styles.brandLogoPlaceholder]}>
                <MaterialIcons name="store" size={32} color="#666" />
              </View>
            )}
          </View>
          
          <View style={styles.brandTextInfo}>
            <Text style={styles.brandName}>{brand.name}</Text>
            {brand.description && (
              <Text style={styles.brandDescription} numberOfLines={2}>
                {brand.description}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Products Header */}
      <View style={styles.productsHeader}>
        <Text style={styles.productsTitle}>
          Produk {brand?.name || 'Brand'} ({products.length})
        </Text>
        <Text style={styles.productsSubtitle}>
          Temukan produk berkualitas dari brand favorit Anda
        </Text>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="inventory-2" size={64} color="#C7C7CC" />
      <Text style={styles.emptyTitle}>Belum Ada Produk</Text>
      <Text style={styles.emptyDescription}>
        Brand ini belum memiliki produk yang tersedia saat ini
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#1a1a1a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detail Brand</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Memuat produk brand...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{brand?.name || 'Detail Brand'}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Products List */}
      <FlatList
        ListHeaderComponent={renderHeader}
        data={products}
        renderItem={renderProductItem}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.productsList}
        columnWrapperStyle={numColumns > 1 ? styles.row : undefined}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    flex: 1,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  headerContent: {
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  brandInfoCard: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
  },
  brandLogoContainer: {
    marginRight: 16,
  },
  brandLogo: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  brandLogoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandTextInfo: {
    flex: 1,
  },
  brandName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  brandDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  productsHeader: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  productsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  productsSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  productsList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  productCard: {
    width: itemWidth,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  productImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 10,
    color: '#ccc',
    marginTop: 4,
    textAlign: 'center',
  },
  promoBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  promoBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  stockBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#8E8E93',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  stockBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
    lineHeight: 20,
  },
  productCategory: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  priceContainer: {
    marginBottom: 8,
  },
  currentPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  originalPrice: {
    fontSize: 12,
    color: '#8E8E93',
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  stockText: {
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
    borderRadius: 8,
    gap: 4,
  },
  addToCartButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  addToCartText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});