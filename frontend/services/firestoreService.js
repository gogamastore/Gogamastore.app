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

// Categories Service
export const categoryService = {
  // Get all categories
  async getAllCategories() {
    try {
      const querySnapshot = await getDocs(collection(db, 'categories'));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting categories:', error);
      throw error;
    }
  }
};

// Cart Service
export const cartService = {
  // Get user cart
  async getUserCart(userId) {
    try {
      const cartRef = doc(db, 'carts', userId);
      const cartSnap = await getDoc(cartRef);
      
      if (cartSnap.exists()) {
        return { id: cartSnap.id, ...cartSnap.data() };
      } else {
        // Create empty cart if doesn't exist
        const emptyCart = {
          user_id: userId,
          items: [],
          total: 0,
          updated_at: new Date().toISOString()
        };
        await setDoc(cartRef, emptyCart);
        return { id: userId, ...emptyCart };
      }
    } catch (error) {
      console.error('Error getting cart:', error);
      throw error;
    }
  },

  // Add item to cart
  async addToCart(userId, product, quantity = 1) {
    try {
      const cartRef = doc(db, 'carts', userId);
      const cartSnap = await getDoc(cartRef);
      
      let cart;
      if (cartSnap.exists()) {
        cart = cartSnap.data();
      } else {
        cart = {
          user_id: userId,
          items: [],
          total: 0,
          updated_at: new Date().toISOString()
        };
      }

      // Check if item already exists in cart
      const existingItemIndex = cart.items.findIndex(item => item.product_id === product.id);
      
      if (existingItemIndex > -1) {
        // Update quantity if item exists
        cart.items[existingItemIndex].quantity += quantity;
      } else {
        // Add new item
        cart.items.push({
          product_id: product.id,
          nama: product.nama,
          harga: product.harga,
          gambar: product.gambar,
          quantity: quantity
        });
      }

      // Calculate total
      cart.total = cart.items.reduce((total, item) => total + (item.harga * item.quantity), 0);
      cart.updated_at = new Date().toISOString();

      await setDoc(cartRef, cart);
      return { id: userId, ...cart };
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  },

  // Remove item from cart
  async removeFromCart(userId, productId) {
    try {
      const cartRef = doc(db, 'carts', userId);
      const cartSnap = await getDoc(cartRef);
      
      if (!cartSnap.exists()) {
        throw new Error('Cart not found');
      }

      const cart = cartSnap.data();
      
      // Remove item
      cart.items = cart.items.filter(item => item.product_id !== productId);
      
      // Recalculate total
      cart.total = cart.items.reduce((total, item) => total + (item.harga * item.quantity), 0);
      cart.updated_at = new Date().toISOString();

      await setDoc(cartRef, cart);
      return { id: userId, ...cart };
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  },

  // Clear cart
  async clearCart(userId) {
    try {
      const cartRef = doc(db, 'carts', userId);
      const emptyCart = {
        user_id: userId,
        items: [],
        total: 0,
        updated_at: new Date().toISOString()
      };
      await setDoc(cartRef, emptyCart);
      return { id: userId, ...emptyCart };
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  }
};

// User Service
export const userService = {
  // Get user profile
  async getUserProfile(userId) {
    try {
      const userRef = doc(db, 'users', userId);
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
      const userRef = doc(db, 'users', userId);
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

// Initialize sample data (call this once to populate Firestore)
export const initializeSampleData = async () => {
  try {
    // Sample categories
    const categories = [
      { nama: 'Elektronik', created_at: new Date().toISOString() },
      { nama: 'Fashion', created_at: new Date().toISOString() },
      { nama: 'Makanan', created_at: new Date().toISOString() },
      { nama: 'Kesehatan', created_at: new Date().toISOString() }
    ];

    // Add categories
    for (const category of categories) {
      const categoryRef = doc(db, 'categories', category.nama);
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

    console.log('Sample data initialized successfully');
  } catch (error) {
    console.error('Error initializing sample data:', error);
  }
};