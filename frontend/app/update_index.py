#!/usr/bin/env python3

import re

# Read the original file
with open('(tabs)/index.tsx', 'r') as f:
    content = f.read()

# Add Firebase imports after the firestoreService import
old_import = "import { productService, bannerService, brandService } from '../../services/firestoreService';"
new_import = """import { productService, bannerService, brandService } from '../../services/firestoreService';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';"""

content = content.replace(old_import, new_import)

# Define the old fetchProducts function
old_function = """  const fetchProducts = async () => {
    try {
      console.log('🏠 Loading trending products for homepage from trending_products collection...');
      
      // Use new getTrendingProductsForHomepage function - limit to 200 products
      const data = await productService.getTrendingProductsForHomepage(200);
      
      setProducts(data);
      setCurrentPage(1); // Reset to first page when products change
      console.log('✅ Trending products loaded successfully for homepage');
    } catch (error) {
      console.error('Error loading trending products:', error);
      Alert.alert('Error', 'Gagal memuat produk trending');
    }
  };"""

# Define the new fetchProducts function
new_function = """  const fetchProducts = async () => {
    try {
      console.log('🏠 Loading trending products for homepage from trending_products collection...');
      
      // Use the same method as trending tab - direct Firebase call
      const trendingRef = collection(db, 'trending_products');
      const trendingSnapshot = await getDocs(trendingRef);
      
      if (trendingSnapshot.empty) {
        console.log('⚠️ No trending products found, using fallback...');
        // Fallback to all products sorted by name
        const fallbackData = await productService.getAllProducts();
        const sortedData = fallbackData.sort((a, b) => (a.nama || '').localeCompare(b.nama || ''));
        setProducts(sortedData.slice(0, 200));
        setCurrentPage(1);
        console.log('✅ Fallback products loaded for homepage');
        return;
      }
      
      const trendingData = trendingSnapshot.docs.map(doc => ({
        id: doc.id,
        productId: doc.data().productId,
        ...doc.data()
      }));
      
      console.log('📋 Found trending product IDs:', trendingData.length);
      
      // Get product details using the same method as trending tab
      const productPromises = trendingData.slice(0, 200).map(async (trending) => {
        try {
          console.log('🔍 Fetching product data for ID:', trending.productId);
          const productData = await productService.getProductById(trending.productId);
          
          if (productData) {
            return {
              id: productData.id,
              nama: productData.nama,
              deskripsi: productData.deskripsi,
              harga: productData.harga,
              gambar: productData.gambar,
              kategori: productData.kategori,
              stok: productData.stok,
              isTrending: true
            };
          }
          return null;
        } catch (error) {
          console.error(`❌ Error fetching product ${trending.productId}:`, error);
          return null;
        }
      });
      
      const resolvedProducts = await Promise.all(productPromises);
      const validProducts = resolvedProducts.filter(product => product !== null);
      
      setProducts(validProducts);
      setCurrentPage(1);
      console.log('✅ Trending products loaded successfully for homepage:', validProducts.length);
      
    } catch (error) {
      console.error('Error loading trending products:', error);
      Alert.alert('Error', 'Gagal memuat produk trending');
    }
  };"""

# Replace the function
content = content.replace(old_function, new_function)

# Write the updated content back to the file
with open('(tabs)/index.tsx', 'w') as f:
    f.write(content)

print("File updated successfully!")