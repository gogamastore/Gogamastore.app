import React, { useState, useEffect } from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';
import AnimatedSplash from '../components/AnimatedSplash';

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Prepare app resources here if needed
    const prepareApp = async () => {
      try {
        // Add any app initialization logic here
        // For example: preload fonts, check auth state, etc.
        console.log('🚀 App initialization started');
        
        // Simulate initialization time
        await new Promise(resolve => setTimeout(resolve, 100));
        
        setIsReady(true);
        console.log('✅ App initialization completed');
      } catch (error) {
        console.error('❌ App initialization error:', error);
        setIsReady(true); // Still set ready to prevent infinite loading
      }
    };

    prepareApp();
  }, []);

  const onAnimationFinish = () => {
    console.log('🎬 Splash animation finished, showing main app');
    setShowSplash(false);
  };

  // Show splash screen (only in development or if explicitly enabled)
  if (showSplash && isReady) {
    return <AnimatedSplash onAnimationFinish={onAnimationFinish} />;
  }

  // Show loading if app is not ready
  if (!isReady) {
    return null; // Native splash will show during this time
  }

  // Show main app
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </AuthProvider>
  );
}