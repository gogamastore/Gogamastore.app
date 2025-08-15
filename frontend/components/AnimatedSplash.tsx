import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Image, Platform } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

const { width, height } = Dimensions.get('window');

interface AnimatedSplashProps {
  onAnimationFinish: () => void;
}

export default function AnimatedSplash({ onAnimationFinish }: AnimatedSplashProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Keep native splash screen visible while loading
    SplashScreen.preventAutoHideAsync();
    
    // Start animation after a short delay
    const initTimer = setTimeout(() => {
      setIsLoaded(true);
      
      // Auto finish animation after GIF duration
      const animationTimer = setTimeout(() => {
        handleAnimationFinish();
      }, 3000); // 3 seconds for GIF animation

      return () => clearTimeout(animationTimer);
    }, Platform.OS === 'android' ? 500 : 100); // Longer delay for Android APK

    return () => clearTimeout(initTimer);
  }, []);

  const handleAnimationFinish = () => {
    // Hide splash screen and trigger callback
    SplashScreen.hideAsync();
    onAnimationFinish();
  };

  if (!isLoaded) {
    // Return empty view while waiting for initialization
    return (
      <View style={[styles.container, { backgroundColor: '#FFFFFF' }]}>
        {/* Optional: Show static logo while loading */}
        <Image
          source={require('../assets/images/app-icon.png')}
          style={styles.staticLogo}
          resizeMode="contain"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* GOGAMA GIF Animation */}
      <Image
        source={require('../assets/splash-animation.gif')}
        style={styles.animation}
        resizeMode="contain"
        onLoad={() => console.log('✅ Animated splash GIF loaded')}
        onError={(error) => console.error('❌ Error loading animated splash:', error)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // White background to match native splash
    justifyContent: 'center',
    alignItems: 'center',
  },
  staticLogo: {
    width: width * 0.4, // 40% of screen width
    height: width * 0.4, // Square aspect ratio
    maxWidth: 200,
    maxHeight: 200,
  },
  animation: {
    width: width * 0.6, // 60% of screen width
    height: width * 0.6, // Square aspect ratio
    maxWidth: 300,
    maxHeight: 300,
  },
});