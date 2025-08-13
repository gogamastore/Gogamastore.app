import { initializeApp, getApps } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyAUU71TYtfCIqTKwj1SHlbVhqqgbfEHx6U",
  authDomain: "orderflow-r7jsk.firebaseapp.com",
  projectId: "orderflow-r7jsk",
  storageBucket: "orderflow-r7jsk.firebasestorage.app",
  messagingSenderId: "954515661623",
  appId: "1:954515661623:web:19d89bf3722600e02ef0b2"
};

console.log('🔥 Firebase Configuration:');
console.log('- Project ID:', firebaseConfig.projectId);
console.log('- Auth Domain:', firebaseConfig.authDomain);
console.log('- API Key (first 10 chars):', firebaseConfig.apiKey.substring(0, 10) + '...');

// Initialize Firebase
let app;
if (getApps().length === 0) {
  console.log('🚀 Initializing Firebase app...');
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase app initialized successfully');
} else {
  console.log('♻️ Using existing Firebase app');
  app = getApps()[0];
}

// Initialize Firebase Auth with persistence
let auth;
try {
  console.log('🔐 Initializing Firebase Auth with AsyncStorage persistence...');
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
  console.log('✅ Firebase Auth initialized successfully');
} catch (error) {
  console.log('⚠️ Auth already initialized, getting existing instance...');
  auth = getAuth(app);
}

// Initialize Firestore
console.log('📱 Initializing Firestore...');
const db = getFirestore(app);
console.log('✅ Firestore initialized successfully');

// Initialize Storage
console.log('💾 Initializing Firebase Storage...');
const storage = getStorage(app);
console.log('✅ Firebase Storage initialized successfully');

export { auth, db, storage };
export default app;