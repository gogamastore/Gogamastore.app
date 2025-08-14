import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

export default function Index() {
  const { user, loading } = useAuth();
  const [timeoutReached, setTimeoutReached] = useState(false);

  useEffect(() => {
    console.log('🔍 Index.tsx - Auth state:', { user: !!user, loading });
    
    // TEMPORARY: FORCE redirect to tabs for testing
    console.log('🔧 TEMPORARY: FORCE redirecting to tabs');
    setTimeout(() => {
      router.replace('/(tabs)');
    }, 100);
    
    return; // Skip all auth logic
    
    // Original auth logic (commented out for testing)
    /*
    if (!loading) {
      console.log('🔄 Auth loading complete, routing...');
      if (user) {
        console.log('✅ User authenticated, redirecting to tabs');
        router.replace('/(tabs)');
      } else {
        console.log('🔐 User not authenticated, redirecting to login');
        router.replace('/(auth)/login');
      }
    }
    */
  }, []);

  // Timeout fallback - if loading takes too long, force redirect to login
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.log('⏰ Loading timeout reached, forcing redirect to login');
        setTimeoutReached(true);
        // TEMPORARY: Disabled timeout redirect for testing
        // router.replace('/(auth)/login');
      }
    }, 8000); // 8 second timeout

    return () => clearTimeout(timeout);
  }, [loading]);

  if (loading && !timeoutReached) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});