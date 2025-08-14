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
      // Add any app initialization logic here
      // For example: preload fonts, check auth state, etc.
      setIsReady(true);
    };

    prepareApp();
  }, []);

  const onAnimationFinish = () => {
    setShowSplash(false);
  };

  // Show splash screen
  if (showSplash && isReady) {
    return <AnimatedSplash onAnimationFinish={onAnimationFinish} />;
  }

  // Show loading if app is not ready
  if (!isReady) {
    return null; // or a simple loading view
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