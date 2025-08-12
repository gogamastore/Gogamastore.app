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
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
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
        return { id: docSnap.id, ...docSnap.data() };
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
        where('kategori', '==', categoryName)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting products by category:', error);
      throw error;
    }
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
      const cartItemRef = doc(db, 'user', userId, 'cart', productId);
      await deleteDoc(cartItemRef);
      
      // Return updated cart
      return await this.getUserCart(userId);
    } catch (error) {
      console.error('Error removing from cart:', error);
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

// Orders Service - New service based on your rules
export const orderService = {
  // Get user orders
  async getUserOrders(userId) {
    try {
      const q = query(
        collection(db, 'orders'),
        where('customerId', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting orders:', error);
      throw error;
    }
  },

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
  }
};

// Initialize sample data - Updated to match your structure
export const initializeSampleData = async () => {
  try {
    // Sample categories - use product_categories collection
    const categories = [
      { nama: 'Elektronik', created_at: new Date().toISOString() },
      { nama: 'Fashion', created_at: new Date().toISOString() },
      { nama: 'Makanan', created_at: new Date().toISOString() },
      { nama: 'Kesehatan', created_at: new Date().toISOString() }
    ];

    // Add categories to product_categories collection
    for (const category of categories) {
      const categoryRef = doc(db, 'product_categories', category.nama);
      await setDoc(categoryRef, category);
    }

    // Sample products
    const products = [
      {
        nama: 'Smartphone Android',
        deskripsi: 'Smartphone terbaru dengan kamera canggih',
        harga: 2500000,
        gambar: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        kategori: 'Elektronik',
        stok: 50,
        created_at: new Date().toISOString()
      },
      {
        nama: 'T-Shirt Cotton',
        deskripsi: 'T-Shirt berbahan cotton premium',
        harga: 150000,
        gambar: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        kategori: 'Fashion',
        stok: 100,
        created_at: new Date().toISOString()
      },
      {
        nama: 'Vitamin C 1000mg',
        deskripsi: 'Suplemen vitamin C untuk daya tahan tubuh',
        harga: 85000,
        gambar: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        kategori: 'Kesehatan',
        stok: 200,
        created_at: new Date().toISOString()
      },
      {
        nama: 'Snack Sehat',
        deskripsi: 'Camilan sehat rendah gula',
        harga: 25000,
        gambar: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        kategori: 'Makanan',
        stok: 150,
        created_at: new Date().toISOString()
      }
    ];

    // Add products
    for (const product of products) {
      await addDoc(collection(db, 'products'), product);
    }

    // Sample brands
    const brands = [
      { nama: 'Samsung', logo: '', created_at: new Date().toISOString() },
      { nama: 'Apple', logo: '', created_at: new Date().toISOString() },
      { nama: 'Nike', logo: '', created_at: new Date().toISOString() }
    ];

    for (const brand of brands) {
      await addDoc(collection(db, 'brands'), brand);
    }

    console.log('Sample data initialized successfully with correct structure');
  } catch (error) {
    console.error('Error initializing sample data:', error);
  }
};