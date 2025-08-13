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
  // Get all products
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
      const docRef = doc(db, 'products', productId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          // Map fields to match our app expectations
          nama: data.name || data.nama || '',
          deskripsi: data.description || data.deskripsi || '',
          gambar: data.image || data.gambar || '',
          kategori: data.category || data.kategori || '',
          harga: this.parsePrice(data.price || data.harga),
          stok: data.stock || data.stok || 99 // default stock if not specified
        };
      } else {
        throw new Error('Product not found');
      }
    } catch (error) {
      console.error('Error getting product:', error);
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

  // Helper function to parse price from string format
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
        const item = { id: doc.id, ...doc.data() };
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
      const orderRef = await addDoc(collection(db, 'orders'), {
        ...orderData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      return orderRef.id;
    } catch (error) {
      console.error('Error creating order:', error);
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

  // Get user orders
  async getUserOrders(userId) {
    try {
      const q = query(
        collection(db, 'orders'), 
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting user orders:', error);
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

  // Update payment status
  async updatePaymentStatus(orderId, paymentStatus) {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        paymentStatus,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating payment status:', error);
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

// Initialize sample data - Updated to match your structure
export const initializeSampleData = async () => {
  // This function is no longer used as data should come from existing Firebase collections
  // Banners should be managed from /banners/{bannerId} collection
  // Brands should be managed from /brands/{brandId} collection
  // Products should be managed from /products/{productId} collection
  // Categories should be managed from /product_categories/{categoryId} collection
  console.log('Sample data initialization disabled - using existing Firebase data');
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

// Payment Proof Service - New service for payment proof uploads
export const paymentProofService = {
  // Upload payment proof to Firebase Storage
  async uploadPaymentProof(orderId, imageUri, fileName) {
    try {
      // This would typically use Firebase Storage SDK
      // For now, we'll structure it for future implementation
      const uploadData = {
        orderId: orderId,
        fileName: fileName,
        uploadPath: `/payment_proofs/${fileName}`,
        uploadedAt: new Date().toISOString(),
        status: 'uploaded'
      };

      // Save upload record to Firestore
      const proofRef = await addDoc(collection(db, 'payment_proofs'), uploadData);
      
      // Update order with payment proof reference
      await updateDoc(doc(db, 'orders', orderId), {
        paymentProofId: proofRef.id,
        paymentProofUploaded: true,
        updated_at: new Date().toISOString()
      });

      return proofRef.id;
    } catch (error) {
      console.error('Error uploading payment proof:', error);
      throw error;
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
  }
};