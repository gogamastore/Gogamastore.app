import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  setDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';

// Products Service
export const productService = {
  // Get trending products from trending_products collection for homepage - limit 200
  async getTrendingProductsForHomepage(limit = 200) {
    try {
      console.log('🏆 Fetching trending products from trending_products collection...');
      
      // Get trending product IDs from trending_products collection
      const trendingQuery = query(
        collection(db, 'trending_products'),
        orderBy('trendingId', 'asc') // Order by trendingId for consistent sorting
      );
      
      const trendingSnapshot = await getDocs(trendingQuery);
      
      if (trendingSnapshot.empty) {
        console.log('⚠️ No trending_products found, using fallback...');
        return await this.getFallbackProducts(limit);
      }
      
      // Extract product IDs from trending_products
      const productIds = [];
      trendingSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.productId) {
          productIds.push(data.productId);
        }
      });
      
      console.log(`📋 Found ${productIds.length} trending product IDs`);
      
      if (productIds.length === 0) {
        console.log('⚠️ No valid productIds found, using fallback...');
        return await this.getFallbackProducts(limit);
      }
      
      // Get product details for each trending product ID
      const trendingProducts = [];
      
      for (const productId of productIds.slice(0, limit)) {
        try {
          const productRef = doc(db, 'products', productId);
          const productDoc = await getDoc(productRef);
          
          if (productDoc.exists()) {
            const productData = productDoc.data();
            trendingProducts.push({
              id: productDoc.id,
              nama: productData.name || productData.nama || '',
              deskripsi: productData.description || productData.deskripsi || '',
              harga: productData.price || productData.harga || 0,
              gambar: productData.image || productData.gambar || '',
              kategori: productData.category || productData.kategori || '',
              stok: productData.stock || productData.stok || 0,
              isTrending: true // Mark as trending product
            });
          } else {
            console.log(`⚠️ Product not found for ID: ${productId}`);
          }
        } catch (error) {
          console.error(`❌ Error fetching product ${productId}:`, error);
        }
      }
      
      console.log(`✅ Trending products loaded: ${trendingProducts.length} products`);
      console.log(`📈 First 3 trending products:`, trendingProducts.slice(0, 3).map(p => p.nama));
      
      return trendingProducts;
      
    } catch (error) {
      console.error('❌ Error fetching trending products for homepage:', error);
      return await this.getFallbackProducts(limit);
    }
  },

  // Fallback function to get products sorted by name when trending_products is not available
  async getFallbackProducts(limit = 200) {
    try {
      console.log('🔄 Using fallback: products sorted by name...');
      const fallbackQuery = query(
        collection(db, 'products'),
        orderBy('nama', 'asc')
      );
      
      const fallbackSnapshot = await getDocs(fallbackQuery);
      const fallbackProducts = [];
      
      fallbackSnapshot.forEach((doc) => {
        const data = doc.data();
        fallbackProducts.push({
          id: doc.id,
          nama: data.name || data.nama || '',
          deskripsi: data.description || data.deskripsi || '',
          harga: data.price || data.harga || 0,
          gambar: data.image || data.gambar || '',
          kategori: data.category || data.kategori || '',
          stok: data.stock || data.stok || 0,
          isTrending: false
        });
      });
      
      return fallbackProducts.slice(0, limit);
    } catch (fallbackError) {
      console.error('❌ Fallback also failed:', fallbackError);
      return [];
    }
  },

  // Get best selling products (most ordered) for homepage - limit 200
  async getBestSellingProducts(limit = 200) {
    try {
      console.log('🏆 Fetching best selling products for homepage...');
      
      // First, let's get order data to calculate product popularity
      const ordersQuery = query(collection(db, 'orders'));
      const ordersSnapshot = await getDocs(ordersQuery);
      
      // Count product orders
      const productOrderCount = {};
      
      ordersSnapshot.forEach((doc) => {
        const orderData = doc.data();
        if (orderData.items && Array.isArray(orderData.items)) {
          orderData.items.forEach((item) => {
            const productId = item.productId || item.id;
            const quantity = item.quantity || 1;
            
            if (productId) {
              productOrderCount[productId] = (productOrderCount[productId] || 0) + quantity;
            }
          });
        }
      });
      
      console.log('📊 Product order counts calculated:', Object.keys(productOrderCount).length, 'unique products');
      
      // Get all products
      const productsQuery = query(collection(db, 'products'));
      const productsSnapshot = await getDocs(productsQuery);
      
      const allProducts = [];
      productsSnapshot.forEach((doc) => {
        const data = doc.data();
        allProducts.push({
          id: doc.id,
          nama: data.name || data.nama || '',
          deskripsi: data.description || data.deskripsi || '',
          harga: data.price || data.harga || 0,
          gambar: data.image || data.gambar || '',
          kategori: data.category || data.kategori || '',
          stok: data.stock || data.stok || 0,
          orderCount: productOrderCount[doc.id] || 0 // Add order count
        });
      });
      
      // Sort by order count (descending), then by name (ascending) as fallback
      const sortedProducts = allProducts.sort((a, b) => {
        if (b.orderCount !== a.orderCount) {
          return b.orderCount - a.orderCount; // Higher order count first
        }
        return (a.nama || '').localeCompare(b.nama || ''); // Alphabetical fallback
      });
      
      // Limit to specified number (default 200)
      const limitedProducts = sortedProducts.slice(0, limit);
      
      console.log(`✅ Best selling products loaded: ${limitedProducts.length} products`);
      console.log(`📈 Top 5 best sellers:`, limitedProducts.slice(0, 5).map(p => ({ name: p.nama, orders: p.orderCount })));
      
      return limitedProducts;
    } catch (error) {
      console.error('❌ Error fetching best selling products:', error);
      
      // Fallback: get products sorted by name if order data fails
      try {
        console.log('🔄 Using fallback: products sorted by name...');
        const fallbackQuery = query(
          collection(db, 'products'),
          orderBy('nama', 'asc')
        );
        
        const fallbackSnapshot = await getDocs(fallbackQuery);
        const fallbackProducts = [];
        
        fallbackSnapshot.forEach((doc) => {
          const data = doc.data();
          fallbackProducts.push({
            id: doc.id,
            nama: data.name || data.nama || '',
            deskripsi: data.description || data.deskripsi || '',
            harga: data.price || data.harga || 0,
            gambar: data.image || data.gambar || '',
            kategori: data.category || data.kategori || '',
            stok: data.stock || data.stok || 0,
            orderCount: 0
          });
        });
        
        return fallbackProducts.slice(0, limit);
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
        return [];
      }
    }
  },

  // Get trending products from trending_products collection
  async getTrendingProducts() {
    try {
      console.log('📈 Fetching trending products from Firestore...');
      
      // First try to get from trending_products collection
      const trendingQuery = query(
        collection(db, 'trending_products'), 
        orderBy('order', 'asc') // Order by priority/order field
      );
      
      const querySnapshot = await getDocs(trendingQuery);
      
      if (querySnapshot.empty) {
        console.log('⚠️  No trending_products collection found, using fallback from products...');
        // Fallback: get first 10 products from products collection
        const fallbackQuery = query(
          collection(db, 'products'),
          orderBy('nama', 'asc')
        );
        
        const fallbackSnapshot = await getDocs(fallbackQuery);
        const fallbackProducts = [];
        
        fallbackSnapshot.forEach((doc) => {
          const data = doc.data();
          fallbackProducts.push({
            id: doc.id,
            nama: data.name || data.nama || '',
            deskripsi: data.description || data.deskripsi || '',
            harga: data.price || data.harga || 0,
            gambar: data.image || data.gambar || '',
            kategori: data.category || data.kategori || '',
            stok: data.stock || data.stok || 0,
          });
        });
        
        console.log('✅ Fallback products loaded:', fallbackProducts.length);
        return fallbackProducts.slice(0, 10); // Limit to 10 products
      }
      
      const trendingProducts = [];
      for (const docSnapshot of querySnapshot.docs) {
        const trendingData = docSnapshot.data();
        
        // Get actual product data using trendingId (productId)
        if (trendingData.trendingId || trendingData.productId) {
          try {
            const productId = trendingData.trendingId || trendingData.productId;
            const productRef = doc(db, 'products', productId);
            const productDoc = await getDoc(productRef);
            if (productDoc.exists()) {
              const productData = productDoc.data();
              trendingProducts.push({
                id: productDoc.id,
                ...productData,
                // Map fields to match our app expectations
                nama: productData.name || productData.nama || '',
                deskripsi: productData.description || productData.deskripsi || '',
                harga: productData.price || productData.harga || 0,
                gambar: productData.image || productData.gambar || '',
                kategori: productData.category || productData.kategori || '',
                stok: productData.stock || productData.stok || 0,
                // Add trending metadata
                trendingOrder: trendingData.order || 0
              });
            }
          } catch (productError) {
            console.warn('⚠️  Product not found for trending item:', trendingData.trendingId || trendingData.productId);
          }
        }
      }
      
      console.log('✅ Trending products loaded:', trendingProducts.length);
      return trendingProducts;
    } catch (error) {
      console.error('❌ Error fetching trending products:', error);
      
      // Final fallback: return empty array
      return [];
    }
  },

  // Get all products with pagination (for katalog)
  async getAllProducts() {
    try {
      const querySnapshot = await getDocs(collection(db, 'products'));
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Map fields to match our app expectations
          nama: data.name || '',
          deskripsi: data.description || '',
          gambar: data.image || '',
          kategori: data.category || '',
          harga: this.parsePrice(data.price),
          stok: typeof data.stock !== 'undefined' ? data.stock : 0 // Use actual stock value, default to 0 if not specified
        };
      });
    } catch (error) {
      console.error('Error getting products:', error);
      throw error;
    }
  },

  // Get product by ID
  async getProductById(productId) {
    try {
      console.log('📦 Fetching product by ID:', productId);
      const docRef = doc(db, 'products', productId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          nama: data.name || data.nama,
          deskripsi: data.description || data.deskripsi,
          gambar: data.image || data.gambar,
          harga: this.parsePrice(data.price || data.harga),
          stok: typeof (data.stock || data.stok) !== 'undefined' ? (data.stock || data.stok) : 0
        };
      } else {
        throw new Error('Product not found');
      }
    } catch (error) {
      console.error('Error getting product by ID:', error);
      throw error;
    }
  },

  // Update product stock - NEW FUNCTION for order processing
  async updateProductStock(productId, quantityToDeduct) {
    try {
      console.log(`📦 Updating stock for product ${productId}, deducting ${quantityToDeduct}`);
      
      const productRef = doc(db, 'products', productId);
      const productSnap = await getDoc(productRef);
      
      if (!productSnap.exists()) {
        throw new Error(`Product ${productId} not found`);
      }
      
      const productData = productSnap.data();
      const currentStock = productData.stock || productData.stok || 0;
      
      console.log(`📊 Current stock for ${productId}: ${currentStock}`);
      
      if (currentStock < quantityToDeduct) {
        throw new Error(`Insufficient stock for product ${productData.name || productData.nama}. Available: ${currentStock}, Required: ${quantityToDeduct}`);
      }
      
      const newStock = currentStock - quantityToDeduct;
      
      // Update both possible field names for compatibility
      const updateData = {
        stock: newStock,
        stok: newStock,
        updated_at: new Date().toISOString()
      };
      
      await updateDoc(productRef, updateData);
      
      console.log(`✅ Stock updated for ${productId}: ${currentStock} -> ${newStock}`);
      return newStock;
      
    } catch (error) {
      console.error(`❌ Error updating stock for product ${productId}:`, error);
      throw error;
    }
  },

  // Restore product stock when order is cancelled - NEW FUNCTION
  async restoreProductStock(productId, quantityToRestore) {
    try {
      console.log(`📦 Restoring stock for product ${productId}, adding back ${quantityToRestore}`);
      
      const productRef = doc(db, 'products', productId);
      const productSnap = await getDoc(productRef);
      
      if (!productSnap.exists()) {
        console.warn(`⚠️ Product ${productId} not found, skipping stock restore`);
        return 0; // Don't throw error, just skip
      }
      
      const productData = productSnap.data();
      const currentStock = productData.stock || productData.stok || 0;
      const newStock = currentStock + quantityToRestore;
      
      console.log(`📊 Restoring stock for ${productId}: ${currentStock} -> ${newStock} (+${quantityToRestore})`);
      
      // Update both possible field names for compatibility
      const updateData = {
        stock: newStock,
        stok: newStock,
        updated_at: new Date().toISOString()
      };
      
      await updateDoc(productRef, updateData);
      
      console.log(`✅ Stock restored for ${productId}: ${currentStock} -> ${newStock}`);
      return newStock;
      
    } catch (error) {
      console.error(`❌ Error restoring stock for product ${productId}:`, error);
      throw error;
    }
  },

  // Batch update stocks for multiple products - For order processing
  async batchUpdateStock(products) {
    try {
      console.log('📦 Starting batch stock update for', products.length, 'products');
      
      const results = [];
      
      // Process each product sequentially to ensure stock validation
      for (const product of products) {
        try {
          const newStock = await this.updateProductStock(product.productId, product.quantity);
          results.push({
            productId: product.productId,
            success: true,
            newStock,
            quantityDeducted: product.quantity
          });
        } catch (error) {
          console.error(`❌ Failed to update stock for ${product.productId}:`, error);
          results.push({
            productId: product.productId,
            success: false,
            error: error.message,
            quantityRequested: product.quantity
          });
          
          // If any product fails, throw error to stop the process
          throw new Error(`Stock update failed for ${product.name || product.productId}: ${error.message}`);
        }
      }
      
      console.log('✅ Batch stock update completed successfully');
      return results;
      
    } catch (error) {
      console.error('❌ Batch stock update failed:', error);
      throw error;
    }
  },

  // Get products by category
  async getProductsByCategory(categoryName) {
    try {
      const q = query(
        collection(db, 'products'),
        where('category', '==', categoryName)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Map fields to match our app expectations
        nama: doc.data().name,
        deskripsi: doc.data().description,
        gambar: doc.data().image,
        kategori: doc.data().category,
        harga: this.parsePrice(doc.data().price)
      }));
    } catch (error) {
      console.error('Error getting products by category:', error);
      throw error;
    }
  },

  parsePrice(priceString) {
    if (typeof priceString === 'number') return priceString;
    if (typeof priceString === 'string') {
      // Remove "Rp", dots, commas and convert to number
      return parseInt(priceString.replace(/[Rp\s\.,]/g, '')) || 0;
    }
    return 0;
  }
};

// Categories Service - Updated to use existing category structure 
export const categoryService = {
  // Get unique categories from products
  async getAllCategories() {
    try {
      const querySnapshot = await getDocs(collection(db, 'products'));
      const categories = new Set();
      
      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.category) {
          categories.add(data.category);
        }
      });
      
      // Convert to array format
      return Array.from(categories).map(cat => ({
        id: cat,
        nama: cat.charAt(0).toUpperCase() + cat.slice(1) // Capitalize first letter
      }));
    } catch (error) {
      console.error('Error getting categories:', error);
      throw error;
    }
  }
};

// Cart Service - Updated to use user/{userId}/cart/{productId} structure
export const cartService = {
  // Get user cart
  async getUserCart(userId) {
    try {
      const cartRef = collection(db, 'user', userId, 'cart');
      const cartSnap = await getDocs(cartRef);
      
      let items = [];
      let total = 0;
      
      cartSnap.forEach(doc => {
        const itemData = doc.data();
        const item = { 
          id: doc.id, 
          productId: doc.id, // Use document ID as productId for consistency
          product_id: itemData.product_id, // Original field for backward compatibility
          ...itemData 
        };
        items.push(item);
        total += item.harga * item.quantity;
      });
      
      return {
        id: userId,
        user_id: userId,
        items: items,
        total: total,
        updated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting cart:', error);
      throw error;
    }
  },

  // Add item to cart
  async addToCart(userId, product, quantity = 1) {
    try {
      const cartItemRef = doc(db, 'user', userId, 'cart', product.id);
      const cartItemSnap = await getDoc(cartItemRef);
      
      if (cartItemSnap.exists()) {
        // Update quantity if item exists
        const currentData = cartItemSnap.data();
        await updateDoc(cartItemRef, {
          quantity: currentData.quantity + quantity,
          updated_at: new Date().toISOString()
        });
      } else {
        // Add new item
        await setDoc(cartItemRef, {
          product_id: product.id,
          nama: product.nama,
          harga: product.harga,
          gambar: product.gambar,
          quantity: quantity,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
      
      // Return updated cart
      return await this.getUserCart(userId);
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  },

  // Remove item from cart
  async removeFromCart(userId, productId) {
    try {
      console.log('Removing from cart:', { userId, productId });
      const cartItemRef = doc(db, 'user', userId, 'cart', productId);
      await deleteDoc(cartItemRef);
      console.log('Successfully removed from cart');
      
      // Return updated cart
      const updatedCart = await this.getUserCart(userId);
      console.log('Updated cart after removal:', updatedCart);
      return updatedCart;
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  },

  // Update item quantity in cart
  async updateCartItemQuantity(userId, productId, newQuantity) {
    try {
      const cartItemRef = doc(db, 'user', userId, 'cart', productId);
      await updateDoc(cartItemRef, {
        quantity: newQuantity,
        updated_at: new Date().toISOString()
      });
      
      return await this.getUserCart(userId);
    } catch (error) {
      console.error('Error updating cart item quantity:', error);
      throw error;
    }
  },

  // Clear cart
  async clearCart(userId) {
    try {
      const cartRef = collection(db, 'user', userId, 'cart');
      const cartSnap = await getDocs(cartRef);
      
      const deletePromises = cartSnap.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      return {
        id: userId,
        user_id: userId,
        items: [],
        total: 0,
        updated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  }
};

// User Service - Updated to use user collection (not users)
export const userService = {
  // Get user profile
  async getUserProfile(userId) {
    try {
      const userRef = doc(db, 'user', userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        return { id: userSnap.id, ...userSnap.data() };
      } else {
        throw new Error('User not found');
      }
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  },

  // Update user profile
  async updateUserProfile(userId, updateData) {
    try {
      const userRef = doc(db, 'user', userId);
      await updateDoc(userRef, {
        ...updateData,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },

  // Address management - Updated to use subcollection structure
  async getUserAddresses(userId) {
    try {
      console.log('🏠 Fetching addresses for userId:', userId);
      
      // Get addresses from subcollection: user/{userId}/addresses/{addressId}
      const addressesRef = collection(db, 'user', userId, 'addresses');
      const addressesSnapshot = await getDocs(addressesRef);
      
      const addresses = [];
      addressesSnapshot.forEach((doc) => {
        addresses.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log('📍 Found addresses from subcollection:', addresses.length);
      return addresses;
    } catch (error) {
      console.error('Error getting user addresses:', error);
      throw error;
    }
  },

  async addUserAddress(userId, addressData) {
    try {
      console.log('➕ Adding address for userId:', userId, 'with data:', addressData);
      
      // Create new address in subcollection: user/{userId}/addresses/{addressId}
      const addressesRef = collection(db, 'user', userId, 'addresses');
      
      // Check if this should be the default address
      const currentAddresses = await this.getUserAddresses(userId);
      const shouldBeDefault = addressData.isDefault || currentAddresses.length === 0;
      
      // If setting as default, update existing addresses to non-default
      if (shouldBeDefault && currentAddresses.length > 0) {
        const updatePromises = currentAddresses.map(async (addr) => {
          if (addr.isDefault) {
            const addrRef = doc(db, 'user', userId, 'addresses', addr.id);
            await updateDoc(addrRef, { isDefault: false });
          }
        });
        await Promise.all(updatePromises);
      }
      
      // Create new address document
      const newAddressData = {
        label: addressData.label || 'Alamat Baru',
        name: addressData.name,
        phone: addressData.phone,
        address: addressData.address,
        city: addressData.city,
        postalCode: addressData.postalCode,
        province: addressData.province,
        isDefault: shouldBeDefault,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Add to Firestore subcollection
      const docRef = await addDoc(addressesRef, newAddressData);
      
      console.log('✅ Address added successfully with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error adding user address:', error);
      throw error;
    }
  },

  async updateUserAddress(userId, addressId, addressData) {
    try {
      console.log('📝 Updating address:', addressId, 'for userId:', userId);
      
      // Reference to specific address document in subcollection
      const addressRef = doc(db, 'user', userId, 'addresses', addressId);
      
      // If setting as default, update other addresses to non-default
      if (addressData.isDefault) {
        const currentAddresses = await this.getUserAddresses(userId);
        const updatePromises = currentAddresses
          .filter(addr => addr.id !== addressId && addr.isDefault)
          .map(async (addr) => {
            const addrRef = doc(db, 'user', userId, 'addresses', addr.id);
            await updateDoc(addrRef, { isDefault: false });
          });
        await Promise.all(updatePromises);
      }
      
      // Update the specific address
      await updateDoc(addressRef, {
        ...addressData,
        updated_at: new Date().toISOString()
      });
      
      console.log('✅ Address updated successfully');
    } catch (error) {
      console.error('Error updating user address:', error);
      throw error;
    }
  },

  async deleteUserAddress(userId, addressId) {
    try {
      console.log('🗑️ Deleting address:', addressId, 'for userId:', userId);
      
      // Reference to specific address document in subcollection
      const addressRef = doc(db, 'user', userId, 'addresses', addressId);
      await deleteDoc(addressRef);
      
      console.log('✅ Address deleted successfully');
    } catch (error) {
      console.error('Error deleting user address:', error);
      throw error;
    }
  },

  async setDefaultAddress(userId, addressId) {
    try {
      console.log('⭐ Setting default address:', addressId, 'for userId:', userId);
      
      // First, set all addresses to non-default
      const currentAddresses = await this.getUserAddresses(userId);
      const updatePromises = currentAddresses.map(async (addr) => {
        const addrRef = doc(db, 'user', userId, 'addresses', addr.id);
        await updateDoc(addrRef, { isDefault: addr.id === addressId });
      });
      
      await Promise.all(updatePromises);
      
      console.log('✅ Default address updated successfully');
    } catch (error) {
      console.error('Error setting default address:', error);
      throw error;
    }
  }
};

// Brands Service - New service based on your rules
export const brandService = {
  async getAllBrands() {
    try {
      const querySnapshot = await getDocs(collection(db, 'brands'));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting brands:', error);
      throw error;
    }
  },

  // Get brand by ID
  async getBrandById(brandId) {
    try {
      console.log('🏢 Fetching brand details for brandId:', brandId);
      const docRef = doc(db, 'brands', brandId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const brandData = {
          id: docSnap.id,
          ...docSnap.data()
        };
        console.log('✅ Brand data retrieved:', brandData);
        return brandData;
      } else {
        throw new Error('Brand not found');
      }
    } catch (error) {
      console.error('Error getting brand by ID:', error);
      throw error;
    }
  },

  // Get products by brand ID
  async getProductsByBrandId(brandId) {
    try {
      console.log('📦 Fetching products for brandId:', brandId);
      const q = query(
        collection(db, 'products'),
        where('brandId', '==', brandId)
      );
      const querySnapshot = await getDocs(q);
      
      const products = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('📦 Raw product data:', data);
        
        // Get image with multiple fallbacks
        const imageUrl = data.image || data.gambar || data.imageUrl || data.photo || data.thumbnail || '';
        console.log(`📷 Image URL for product ${doc.id}:`, imageUrl);
        
        return {
          id: doc.id,
          ...data,
          // Map fields to match our app expectations
          nama: data.name || data.nama || '',
          deskripsi: data.description || data.deskripsi || '',
          gambar: imageUrl,
          kategori: data.category || data.kategori || '',
          harga: this.parsePrice(data.price || data.harga),
          stok: typeof (data.stock || data.stok) !== 'undefined' ? (data.stock || data.stok) : 0
        };
      });
      
      console.log(`✅ Found ${products.length} products for brand ${brandId}`);
      return products;
    } catch (error) {
      console.error('Error getting products by brand ID:', error);
      throw error;
    }
  },

  // Parse price helper function (moved from productService for brand service use)
  parsePrice(priceString) {
    if (typeof priceString === 'number') return priceString;
    if (typeof priceString === 'string') {
      // Remove "Rp", dots, commas and convert to number
      return parseInt(priceString.replace(/[Rp\s\.,]/g, '')) || 0;
    }
    return 0;
  }
};

// Banners Service - New service based on your rules
export const bannerService = {
  async getAllBanners() {
    try {
      const querySnapshot = await getDocs(collection(db, 'banners'));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting banners:', error);
      throw error;
    }
  }
};

// Order Service - New service for order management
export const orderService = {
  // Create new order
  async createOrder(orderData) {
    try {
      console.log('📦 Creating new order with data:', orderData);
      
      // Enhanced order data dengan payment status dan payment method
      const enhancedOrderData = {
        ...orderData,
        paymentStatus: 'Unpaid', // Default payment status (changed from 'pending')
        paymentMethod: orderData.paymentMethod || 'bank_transfer', // Add payment method
        paymentProofUrl: '', // Empty until uploaded
        paymentProofId: '', // Reference to payment_proofs collection  
        paymentProofUploaded: false,
        paymentProofFileName: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const docRef = await addDoc(collection(db, 'orders'), enhancedOrderData);
      console.log('✅ Order created successfully with ID:', docRef.id);
      
      return {
        success: true,
        orderId: docRef.id,
        ...enhancedOrderData
      };
    } catch (error) {
      console.error('❌ Error creating order:', error);
      throw error;
    }
  },

  // Get order by ID
  async getOrderById(orderId) {
    try {
      const docRef = doc(db, 'orders', orderId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        throw new Error('Order not found');
      }
    } catch (error) {
      console.error('Error getting order:', error);
      throw error;
    }
  },

  // Create sample order for development (helper method)
  async createSampleOrderIfNeeded(userId) {
    try {
      console.log('🔧 Creating sample order for development');
      
      const sampleOrder = {
        id: `sample-${Date.now()}`,
        userId: userId,
        customerId: userId,
        customer: 'Sample Customer',
        customerDetails: {
          name: 'Sample Customer',
          address: 'Sample Address',
          whatsapp: '+6281234567890'
        },
        products: [
          {
            productId: 'sample-product-1',
            name: 'Sample Product',
            price: 100000,
            quantity: 1,
            image: ''
          }
        ],
        total: 'Rp 100.000',
        subtotal: 100000,
        shippingFee: 0,
        shippingMethod: 'Ambil di Toko',
        status: 'pending',
        paymentStatus: 'unpaid',
        paymentMethod: 'cod',
        date: new Date(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      return [sampleOrder];
    } catch (error) {
      console.error('❌ Error creating sample order:', error);
      return [];
    }
  },

  // Get user orders with improved error handling
  async getUserOrders(userId) {
    try {
      console.log('🔍 Fetching orders for userId:', userId);
      
      // Validate userId
      if (!userId) {
        console.error('❌ No userId provided');
        return [];
      }
      
      // Try both possible field names for user identification
      const queries = [
        query(collection(db, 'orders'), where('userId', '==', userId)),
        query(collection(db, 'orders'), where('customerId', '==', userId)),
        query(collection(db, 'orders'), where('user.uid', '==', userId)) // nested field
      ];
      
      let allOrders = [];
      let hasPermissionError = false;
      
      for (const q of queries) {
        try {
          console.log('🔍 Trying query:', q);
          const querySnapshot = await getDocs(q);
          const orders = querySnapshot.docs.map(doc => {
            const data = doc.data();
            console.log('📦 Found order:', { id: doc.id, status: data.status, customer: data.customer });
            return { id: doc.id, ...data };
          });
          allOrders = allOrders.concat(orders);
        } catch (error) {
          console.warn('⚠️ Query failed:', error.code, error.message);
          if (error.code === 'permission-denied') {
            hasPermissionError = true;
          }
        }
      }
      
      // Remove duplicates based on order ID
      const uniqueOrders = allOrders.filter((order, index, self) => 
        index === self.findIndex(o => o.id === order.id)
      );
      
      console.log('📋 Total unique orders found:', uniqueOrders.length);
      
      // If no orders found and we have permission errors, provide helpful message
      if (uniqueOrders.length === 0 && hasPermissionError) {
        console.error('🔒 Firebase permission denied for orders collection');
        console.error('💡 This may indicate Firebase security rules need adjustment');
        
        // Try to create sample data for development
        if (process.env.NODE_ENV === 'development') {
          console.log('🔧 Development mode: attempting to create sample order');
          return await this.createSampleOrderIfNeeded(userId);
        }
      }
      
      return uniqueOrders;
    } catch (error) {
      console.error('❌ Error getting user orders:', error);
      
      // Provide specific error messages based on Firebase error codes
      if (error.code === 'permission-denied') {
        console.error('🔒 Permission denied - check Firebase security rules');
        console.error('💡 Rules should allow authenticated users to read their own orders');
      } else if (error.code === 'unavailable') {
        console.error('🌐 Firebase service unavailable - network issue');
      } else if (error.code === 'unauthenticated') {
        console.error('🔐 User not authenticated - login required');
      }
      
      throw error;
    }
  },

  // Update order status
  async updateOrderStatus(orderId, status) {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  },

  // Cancel order and restore product stock
  async cancelOrderAndRestoreStock(orderId) {
    try {
      console.log('🚫 Cancelling order and restoring stock for order:', orderId);
      
      // Step 1: Get order details
      const orderRef = doc(db, 'orders', orderId);
      const orderSnap = await getDoc(orderRef);
      
      if (!orderSnap.exists()) {
        throw new Error('Order not found');
      }
      
      const orderData = orderSnap.data();
      console.log('📋 Order data retrieved:', orderData);
      
      // Check if order can be cancelled
      if (orderData.status === 'cancelled') {
        throw new Error('Order is already cancelled');
      }
      
      if (orderData.status === 'delivered' || orderData.status === 'shipped') {
        throw new Error('Cannot cancel order that has been shipped or delivered');
      }
      
      // Step 2: Prepare products for stock restoration
      const productsToRestore = orderData.products || [];
      
      if (productsToRestore.length === 0) {
        console.warn('⚠️ No products found in order to restore stock');
      } else {
        console.log('📦 Products to restore stock:', productsToRestore);
        
        // Step 3: Restore stock for each product
        for (const product of productsToRestore) {
          try {
            await productService.restoreProductStock(product.productId, product.quantity);
            console.log(`✅ Stock restored for ${product.productId}: +${product.quantity}`);
          } catch (stockError) {
            console.error(`❌ Failed to restore stock for ${product.productId}:`, stockError);
            // Continue with other products even if one fails
          }
        }
      }
      
      // Step 4: Update order status to cancelled
      await updateDoc(orderRef, {
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
        stockRestored: true,
        stockRestoredAt: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      console.log('✅ Order cancelled and stock restored successfully');
      return {
        success: true,
        orderId,
        productsRestored: productsToRestore.length,
        message: 'Order cancelled and stock restored successfully'
      };
      
    } catch (error) {
      console.error('❌ Error cancelling order and restoring stock:', error);
      throw error;
    }
  },

  // Update payment status
  async updatePaymentStatus(orderId, paymentStatus) {
    try {
      console.log('💳 Updating payment status:', { orderId, paymentStatus });
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        paymentStatus,
        updated_at: new Date().toISOString()
      });
      console.log('✅ Payment status updated successfully');
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  },

  // Verify payment proof (admin function) - changes from proof_uploaded to paid
  async verifyPaymentProof(orderId, isApproved = true) {
    try {
      console.log('🔍 Verifying payment proof:', { orderId, isApproved });
      const orderRef = doc(db, 'orders', orderId);
      
      const newPaymentStatus = isApproved ? 'paid' : 'pending';
      
      await updateDoc(orderRef, {
        paymentStatus: newPaymentStatus,
        paymentVerified: isApproved,
        paymentVerifiedAt: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      console.log(`✅ Payment proof ${isApproved ? 'approved' : 'rejected'} for order:`, orderId);
      
      return {
        success: true,
        orderId,
        newPaymentStatus,
        isApproved
      };
    } catch (error) {
      console.error('Error verifying payment proof:', error);
      throw error;
    }
  },

  // Update payment method
  async updatePaymentMethod(orderId, paymentData) {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        paymentMethod: paymentData,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating payment method:', error);
      throw error;
    }
  }
};

// Promotions Service - New service for checking promotions/discounts
export const promotionService = {
  // Check if products have active promotions
  async checkProductPromotions(productIds) {
    try {
      console.log('🎉 Checking promotions for products:', productIds);
      
      if (!productIds || productIds.length === 0) {
        return {};
      }

      // Get all promotions
      const promotionsQuery = query(collection(db, 'promotions'));
      const promotionsSnapshot = await getDocs(promotionsQuery);
      
      const activePromotions = {};
      const currentDate = new Date();
      
      promotionsSnapshot.forEach((doc) => {
        const promoData = doc.data();
        
        // Check if promotion is active
        const startDate = promoData.startDate?.toDate() || new Date(promoData.startDate);
        const endDate = promoData.endDate?.toDate() || new Date(promoData.endDate);
        const isActive = promoData.active && currentDate >= startDate && currentDate <= endDate;
        
        if (isActive && promoData.productIds && Array.isArray(promoData.productIds)) {
          // Check which products are in this promotion
          promoData.productIds.forEach(productId => {
            if (productIds.includes(productId)) {
              activePromotions[productId] = {
                id: doc.id,
                ...promoData,
                discountPrice: promoData.discountPrice || 0,
                discountPercentage: promoData.discountPercentage || 0,
                promoText: promoData.promoText || 'Promo'
              };
            }
          });
        }
      });
      
      console.log(`✅ Found promotions for ${Object.keys(activePromotions).length} products`);
      return activePromotions;
    } catch (error) {
      console.error('Error checking product promotions:', error);
      return {};
    }
  },

  // Get single promotion by ID
  async getPromotionById(promoId) {
    try {
      const docRef = doc(db, 'promotions', promoId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error getting promotion by ID:', error);
      return null;
    }
  }
};

// Bank Account Service - New service for dynamic bank account management
export const bankAccountService = {
  // Get all bank accounts
  async getActiveBankAccounts() {
    try {
      const querySnapshot = await getDocs(collection(db, 'bank_accounts'));
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting bank accounts:', error);
      throw error;
    }
  },

  // Get bank account by ID
  async getBankAccountById(accountId) {
    try {
      const docRef = doc(db, 'bank_accounts', accountId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        throw new Error('Bank account not found');
      }
    } catch (error) {
      console.error('Error getting bank account:', error);
      throw error;
    }
  }
};

// Payment Proof Service - Enhanced service for payment proof uploads with Firebase Storage
export const paymentProofService = {
  // Upload payment proof to Firebase Storage
  async uploadPaymentProof(orderId, imageUri, fileName) {
    try {
      console.log('📤 Starting payment proof upload:', { orderId, fileName });
      
      // Check authentication first
      const { auth } = await import('../lib/firebase');
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error('User not authenticated. Please login first.');
      }
      
      console.log('🔐 User authenticated:', currentUser.uid);
      
      if (!imageUri || !orderId || !fileName) {
        throw new Error('Missing required parameters for upload');
      }
      
      // Convert image to blob for Firebase Storage upload
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      console.log('📁 Image converted to blob, size:', blob.size);
      
      // Create Firebase Storage reference
      const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
      const { storage } = await import('../lib/firebase');
      
      // Upload path: /payment_proofs/{fileName} with user context
      const safeFileName = `${currentUser.uid}_${orderId}_${fileName}`;
      const storageRef = ref(storage, `payment_proofs/${safeFileName}`);
      
      console.log('🔄 Uploading to Firebase Storage with path:', `payment_proofs/${safeFileName}`);
      
      // Upload file to Firebase Storage with metadata
      const metadata = {
        contentType: blob.type || 'image/jpeg',
        customMetadata: {
          'orderId': orderId,
          'userId': currentUser.uid,
          'uploadedAt': new Date().toISOString()
        }
      };
      
      const snapshot = await uploadBytes(storageRef, blob, metadata);
      console.log('✅ File uploaded successfully:', snapshot.metadata.name);
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('🔗 Download URL obtained:', downloadURL);
      
      // Update order document with paymentProofUrl DIRECTLY (no separate collection)
      console.log('📝 Updating order document directly with paymentProofUrl:', {
        orderId: orderId,
        downloadURL: downloadURL
      });
      
      let updateSuccess = false;
      let updateError = null;
      
      // Direct update to order document only
      try {
        const orderRef = doc(db, 'orders', orderId);
        
        // First verify the order exists and user has access
        const orderSnap = await getDoc(orderRef);
        if (!orderSnap.exists()) {
          throw new Error('Order document not found');
        }
        
        const orderData = orderSnap.data();
        console.log('📋 Found order data:', {
          orderId: orderId,
          userId: orderData.userId,
          customerId: orderData.customerId,
          currentUser: currentUser.uid,
          hasAccess: orderData.userId === currentUser.uid || orderData.customerId === currentUser.uid,
          currentPaymentProofUrl: orderData.paymentProofUrl,
          newPaymentProofUrl: downloadURL,
          paymentProofUrlWillChange: orderData.paymentProofUrl !== downloadURL
        });
        
        // Check if user matches customerId (required by rules)
        if (orderData.customerId !== currentUser.uid) {
          throw new Error(`User ${currentUser.uid} is not the customerId (${orderData.customerId}) for this order`);
        }
        
        console.log('✅ User access verified: customerId matches current user');
        
        // ONLY UPDATE paymentProofUrl as per Firestore Rules
        console.log('🔄 Attempting order update with paymentProofUrl:', {
          orderId: orderId,
          paymentProofUrl: downloadURL
        });
        
        await updateDoc(orderRef, {
          paymentProofUrl: downloadURL  // Only this field - directly in order document
        });
        
        console.log('✅ Order updated successfully - paymentProofUrl saved directly');
        updateSuccess = true;
        
        // Verify the update
        const updatedOrderSnap = await getDoc(orderRef);
        if (updatedOrderSnap.exists()) {
          const updatedData = updatedOrderSnap.data();
          console.log('🔍 Verification - Updated order data:', {
            paymentProofUrl: updatedData.paymentProofUrl,
            paymentStatus: updatedData.paymentStatus
          });
          
          // Double check that paymentProofUrl is actually set
          if (updatedData.paymentProofUrl && updatedData.paymentProofUrl !== '') {
            console.log('✅ CONFIRMED: paymentProofUrl successfully saved directly to order document');
          } else {
            console.error('❌ FAILED: paymentProofUrl is still empty in order document');
            updateSuccess = false;
            updateError = 'paymentProofUrl not saved to order document';
          }
        }
        
      } catch (error) {
        updateError = error;
        console.error('❌ Direct order update failed:', error);
        
        if (error.code === 'permission-denied') {
          console.error('🔒 Permission denied - Firestore security rules may be blocking this update');
          console.error('💡 User ID:', currentUser.uid);
          console.error('💡 Order ID:', orderId);
        }
      }
      
      if (!updateSuccess) {
        // If update failed, still return success for storage upload
        // but indicate the database update issue
        console.warn('⚠️  Storage upload successful but database update failed');
        console.warn('⚠️  Error:', updateError?.message || updateError);
        
        return {
          success: true,
          downloadURL: downloadURL,
          fileName: safeFileName,
          originalFileName: fileName,
          warning: 'File uploaded successfully but order database update failed',
          updateError: updateError?.message || updateError
        };
      }
      
      return {
        success: true,
        downloadURL: downloadURL,
        fileName: safeFileName,
        originalFileName: fileName
      };
      
    } catch (error) {
      console.error('❌ Error uploading payment proof:', error);
      
      // Provide specific error messages
      if (error.code === 'storage/unauthorized') {
        throw new Error('Tidak memiliki izin untuk mengunggah file. Silakan login ulang.');
      } else if (error.code === 'storage/quota-exceeded') {
        throw new Error('Kuota storage penuh. Silakan hubungi admin.');
      } else if (error.code === 'storage/invalid-format') {
        throw new Error('Format file tidak didukung. Gunakan format JPG, PNG, atau WEBP.');
      } else {
        throw new Error(`Gagal mengunggah bukti pembayaran: ${error.message}`);
      }
    }
  },

  // Get payment proof by order ID
  async getPaymentProofByOrderId(orderId) {
    try {
      const q = query(collection(db, 'payment_proofs'), where('orderId', '==', orderId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting payment proof:', error);
      throw error;
    }
  },

  // Check if order has payment proof - enhanced version
  async hasPaymentProof(orderId) {
    try {
      // Check order document first
      const orderRef = doc(db, 'orders', orderId);
      const orderSnap = await getDoc(orderRef);
      
      if (orderSnap.exists()) {
        const orderData = orderSnap.data();
        const hasProofInOrder = !!orderData.paymentProofUploaded;
        
        if (hasProofInOrder) {
          return {
            hasProof: true,
            proofUrl: orderData.paymentProofUrl || null,
            fileName: orderData.paymentProofFileName || null,
            proofId: orderData.paymentProofId || null
          };
        }
      }
      
      // Fallback: check payment_proofs collection
      const proofData = await this.getPaymentProofByOrderId(orderId);
      if (proofData) {
        return {
          hasProof: true,
          proofUrl: proofData.storageUrl || null,
          fileName: proofData.fileName || null,
          proofId: proofData.id
        };
      }
      
      return { hasProof: false, proofUrl: null, fileName: null, proofId: null };
    } catch (error) {
      console.error('Error checking payment proof:', error);
      return { hasProof: false, proofUrl: null, fileName: null, proofId: null };
    }
  }
};