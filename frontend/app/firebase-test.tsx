import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function FirebaseTestScreen() {
  const [status, setStatus] = useState('Initializing...');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev.slice(-5), message]); // Keep last 6 logs
  };

  useEffect(() => {
    testFirebaseConnection();
  }, []);

  const testFirebaseConnection = async () => {
    try {
      addLog('🔥 Starting Firebase connection test...');
      
      // Test 1: Firebase Auth instance
      if (auth) {
        addLog('✅ Firebase Auth: Available');
        addLog(`🔐 Current user: ${auth.currentUser ? auth.currentUser.email : 'None'}`);
      } else {
        addLog('❌ Firebase Auth: Not Available');
      }

      // Test 2: Firestore connection
      if (db) {
        addLog('✅ Firebase Firestore: Available');
        
        try {
          const testCollection = collection(db, 'products');
          const snapshot = await getDocs(testCollection);
          addLog(`📱 Products collection: ${snapshot.size} documents`);
        } catch (error) {
          addLog(`❌ Firestore query failed: ${error.message}`);
        }
      } else {
        addLog('❌ Firebase Firestore: Not Available');
      }

      setStatus('Firebase connection test completed');
      
    } catch (error) {
      addLog(`❌ Firebase test failed: ${error.message}`);
      setStatus('Firebase connection test failed');
    }
  };

  const testLogin = async () => {
    try {
      addLog('🔐 Testing login...');
      
      const email = 'test@gogama.store';
      const password = 'test123456';
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      addLog(`✅ Login successful: ${userCredential.user.email}`);
      
    } catch (error) {
      addLog(`❌ Login failed: ${error.code} - ${error.message}`);
      
      if (error.code === 'auth/user-not-found') {
        // Try to create test user
        try {
          addLog('👤 Creating test user...');
          const newUser = await createUserWithEmailAndPassword(auth, 'test@gogama.store', 'test123456');
          addLog(`✅ Test user created: ${newUser.user.email}`);
        } catch (createError) {
          addLog(`❌ User creation failed: ${createError.message}`);
        }
      }
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Firebase Connection Test</Text>
      <Text style={styles.status}>{status}</Text>
      
      <View style={styles.logContainer}>
        <Text style={styles.logTitle}>Debug Logs:</Text>
        {logs.map((log, index) => (
          <Text key={index} style={styles.logText}>{log}</Text>
        ))}
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={testFirebaseConnection}>
          <Text style={styles.buttonText}>Test Connection</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.loginButton]} onPress={testLogin}>
          <Text style={styles.buttonText}>Test Login</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={clearLogs}>
          <Text style={styles.buttonText}>Clear Logs</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#1a1a1a',
  },
  status: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  logContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  logTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1a1a1a',
  },
  logText: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 4,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 4,
  },
  loginButton: {
    backgroundColor: '#34C759',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});