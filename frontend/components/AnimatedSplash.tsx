import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, Image } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

const { width, height } = Dimensions.get('window');

interface AnimatedSplashProps {
  onAnimationFinish: () => void;
}

export default function AnimatedSplash({ onAnimationFinish }: AnimatedSplashProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Keep splash screen visible while loading
    SplashScreen.preventAutoHideAsync();
    
    // Auto hide after animation duration
    const timer = setTimeout(() => {
      handleAnimationFinish();
    }, 3000); // 3 seconds - adjust based on your GIF duration

    return () => clearTimeout(timer);
  }, []);

  const handleAnimationFinish = () => {
    // Hide splash screen and trigger callback
    SplashScreen.hideAsync();
    onAnimationFinish();
  };

  return (
    <View style={styles.container}>
      {/* GOGAMA GIF Animation */}
      <Image
        source={require('../assets/splash-animation.gif')}
        style={styles.animation}
        resizeMode="contain"
        onLoad={() => setIsLoaded(true)}
      />
      
      {/* Optional: Add brand text or tagline below GIF */}
      {/* 
      <View style={styles.brandContainer}>
        <Text style={styles.brandText}>GOGAMA STORE</Text>
        <Text style={styles.tagline}>Your Shopping Destination</Text>
      </View>
      */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // White background to match GIF
    justifyContent: 'center',
    alignItems: 'center',
  },
  animation: {
    width: width * 0.6, // 60% of screen width
    height: width * 0.6, // Square aspect ratio
    maxWidth: 300,
    maxHeight: 300,
  },
  brandContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  brandText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF3333', // Red color matching your GIF
    marginBottom: 8,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});