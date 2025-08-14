import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TEMPORARY: Mock user for testing
    console.log('🔧 TEMPORARY: Using mock user for testing');
    const mockUser = {
      uid: 'test-user-123',
      email: 'test@gogama.com',
      displayName: 'Test User',
      name: 'Test User',
      whatsapp: '08123456789',
      role: 'reseller'
    };
    
    setTimeout(() => {
      setUser(mockUser);
      setLoading(false);
      console.log('✅ Mock user set, loading complete');
    }, 1000);
    
    // Original auth logic (commented out for testing)
    /*
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Get additional user data from Firestore
        const userDoc = await getDoc(doc(db, 'user', firebaseUser.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};
        
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          ...userData
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
    */
  }, []);

  const register = async (nama_lengkap, email, nomor_whatsapp, password) => {
    try {
      // Create user with email and password
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update display name
      await updateProfile(firebaseUser, {
        displayName: nama_lengkap
      });

      // Save additional user data to Firestore
      await setDoc(doc(db, 'user', firebaseUser.uid), {
        name: nama_lengkap,  // menggunakan 'name' bukan 'nama_lengkap'
        email,
        whatsapp: nomor_whatsapp,  // menggunakan 'whatsapp' bukan 'nomor_whatsapp'
        role: 'reseller',  // default role reseller
        photoURL: '',  // empty photoURL initially
        addresses: {},  // empty addresses initially
        createdAt: new Date()  // menggunakan timestamp
      });

      return firebaseUser;
    } catch (error) {
      throw error;
    }
  };

  const login = async (email, password) => {
    try {
      console.log('🔐 Attempting login for:', email);
      console.log('🔥 Firebase Auth instance:', auth ? 'Available' : 'Not Available');
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      console.log('✅ Login successful!', {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName
      });
      
      return user;
    } catch (error) {
      console.error('❌ Login error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      
      // Enhanced error handling with specific Firebase error codes
      if (error.code === 'auth/configuration-not-found') {
        console.error('🔥 Firebase configuration issue detected!');
        console.error('- Check Firebase project settings');
        console.error('- Verify API keys and project ID');
      } else if (error.code === 'auth/network-request-failed') {
        console.error('🌐 Network issue detected!');
        console.error('- Check internet connection');
        console.error('- Verify Firebase project is active');
      }
      
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 Starting logout process...');
      await signOut(auth);
      console.log('✅ Logout successful');
      
      // Force redirect to login after logout
      setTimeout(() => {
        console.log('🔄 Redirecting to login screen...');
        // This will be handled by the auth state change listener
      }, 100);
      
    } catch (error) {
      console.error('❌ Logout error:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    register,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};