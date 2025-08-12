import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Firebase imports
import { auth, db } from '../../lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';

export default function FirebaseDebugScreen() {
  const [debugInfo, setDebugInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const addDebug = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugInfo(prev => `[${timestamp}] ${message}\n${prev}`);
  };

  const testFirebaseConfig = async () => {
    setLoading(true);
    addDebug('🔥 Starting Firebase Configuration Test...');
    
    try {
      // Test Firebase Auth initialization
      addDebug(`✅ Firebase Auth initialized: ${auth.app.name}`);
      addDebug(`✅ Auth Config - Project ID: ${auth.app.options.projectId}`);
      addDebug(`✅ Auth Config - API Key: ${auth.app.options.apiKey.substring(0, 10)}...`);
      addDebug(`✅ Auth Config - Auth Domain: ${auth.app.options.authDomain}`);
      
      // Test Firestore initialization  
      addDebug(`✅ Firestore initialized: ${db.app.name}`);
      addDebug(`✅ Firestore Project: ${db._delegate._databaseId.projectId}`);
      
    } catch (error) {
      addDebug(`❌ Firebase Config Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testAuthentication = async () => {
    setLoading(true);
    addDebug('🔐 Testing Firebase Authentication...');
    
    try {
      const testEmail = `test${Date.now()}@gogama.store`;
      const testPassword = 'test123456';
      
      addDebug(`📝 Creating user with email: ${testEmail}`);
      
      // Try to create user
      const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
      const user = userCredential.user;
      
      addDebug(`✅ User created successfully!`);
      addDebug(`✅ User ID: ${user.uid}`);
      addDebug(`✅ User Email: ${user.email}`);
      
      // Test Firestore write permission
      addDebug('📝 Testing Firestore write permission...');
      await setDoc(doc(db, 'users', user.uid), {
        nama_lengkap: 'Test User',
        email: testEmail,
        created_at: new Date().toISOString()
      });
      
      addDebug('✅ Firestore write successful!');
      
      // Test Firestore read permission
      addDebug('📖 Testing Firestore read permission...');
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        addDebug('✅ Firestore read successful!');
        addDebug(`✅ User data: ${JSON.stringify(userDoc.data())}`);
      } else {
        addDebug('❌ User document not found after creation');
      }
      
    } catch (error) {
      addDebug(`❌ Authentication Error: ${error.code}`);
      addDebug(`❌ Error Message: ${error.message}`);
      
      if (error.code === 'auth/email-already-in-use') {
        addDebug('ℹ️ Email already in use, trying to login instead...');
        try {
          const loginResult = await signInWithEmailAndPassword(auth, 'test@gogama.store', 'test123456');
          addDebug(`✅ Login successful: ${loginResult.user.uid}`);
        } catch (loginError) {
          addDebug(`❌ Login failed: ${loginError.message}`);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const testFirestorePermissions = async () => {
    setLoading(true);
    addDebug('📊 Testing Firestore Collections Access...');
    
    try {
      // Test reading categories
      addDebug('📖 Testing categories collection read...');
      const categoriesRef = collection(db, 'categories');
      const categoriesSnap = await getDocs(categoriesRef);
      
      addDebug(`✅ Categories read successful - Found ${categoriesSnap.size} documents`);
      
      // Test reading products
      addDebug('📖 Testing products collection read...');
      const productsRef = collection(db, 'products');
      const productsSnap = await getDocs(productsRef);
      
      addDebug(`✅ Products read successful - Found ${productsSnap.size} documents`);
      
    } catch (error) {
      addDebug(`❌ Firestore Permission Error: ${error.code}`);
      addDebug(`❌ Error Message: ${error.message}`);
      
      if (error.code === 'permission-denied') {
        addDebug('❌ Permission denied - Check Firestore security rules');
        addDebug('ℹ️ Make sure you are authenticated before reading data');
      }
    } finally {
      setLoading(false);
    }
  };

  const testCurrentUser = async () => {
    setLoading(true);
    addDebug('👤 Testing Current User State...');
    
    try {
      const currentUser = auth.currentUser;
      
      if (currentUser) {
        addDebug('✅ User is signed in:');
        addDebug(`✅ UID: ${currentUser.uid}`);
        addDebug(`✅ Email: ${currentUser.email}`);
        addDebug(`✅ Email Verified: ${currentUser.emailVerified}`);
      } else {
        addDebug('❌ No user currently signed in');
        addDebug('ℹ️ Try registering or logging in first');
      }
      
    } catch (error) {
      addDebug(`❌ Current User Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const clearDebug = () => {
    setDebugInfo('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Firebase Debug Console</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]} 
          onPress={testFirebaseConfig}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test Firebase Config</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.successButton]} 
          onPress={testCurrentUser}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Check Current User</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.warningButton]} 
          onPress={testAuthentication}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test Authentication</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.infoButton]} 
          onPress={testFirestorePermissions}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test Firestore Access</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.dangerButton]} 
          onPress={clearDebug}
        >
          <Text style={styles.buttonText}>Clear Debug</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.debugContainer}>
        <Text style={styles.debugTitle}>Debug Output:</Text>
        <ScrollView style={styles.debugScrollView}>
          <Text style={styles.debugText}>{debugInfo || 'No debug info yet...'}</Text>
        </ScrollView>
      </View>
      
      {loading && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Testing...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    minWidth: '48%',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  successButton: {
    backgroundColor: '#34C759',
  },
  warningButton: {
    backgroundColor: '#FF9500',
  },
  infoButton: {
    backgroundColor: '#5856D6',
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
  debugContainer: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    padding: 12,
  },
  debugTitle: {
    color: '#00ff00',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
  },
  debugScrollView: {
    flex: 1,
  },
  debugText: {
    color: '#00ff00',
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});