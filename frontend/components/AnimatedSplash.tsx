import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import LottieView from 'lottie-react-native';
import * as SplashScreen from 'expo-splash-screen';

const { width, height } = Dimensions.get('window');

interface AnimatedSplashProps {
  onAnimationFinish: () => void;
}

export default function AnimatedSplash({ onAnimationFinish }: AnimatedSplashProps) {
  const animationRef = useRef<LottieView>(null);

  useEffect(() => {
    // Keep splash screen visible while loading
    SplashScreen.preventAutoHideAsync();
    
    // Start animation
    if (animationRef.current) {
      animationRef.current.play();
    }
  }, []);

  const handleAnimationFinish = () => {
    // Hide splash screen and trigger callback
    SplashScreen.hideAsync();
    onAnimationFinish();
  };

  return (
    <View style={styles.container}>
      {/* You can use either Lottie animation OR simple animated logo */}
      
      {/* Option 1: Lottie Animation (if you have .json file) */}
      {/* 
      <LottieView
        ref={animationRef}
        source={require('../assets/animations/splash-animation.json')}
        style={styles.animation}
        autoPlay
        loop={false}
        onAnimationFinish={handleAnimationFinish}
        resizeMode="contain"
      />
      */}
      
      {/* Option 2: Simple Logo with React Native Animation (fallback) */}
      <View style={styles.logoContainer}>
        {/* Your logo here with React Native Animated */}
        <View style={styles.placeholder}>
          {/* Placeholder for logo - you can replace with actual logo */}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Your brand color
    justifyContent: 'center',
    alignItems: 'center',
  },
  animation: {
    width: width * 0.8,
    height: height * 0.4,
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: 150,
    height: 150,
    backgroundColor: '#E0E0E0',
    borderRadius: 75,
    // Add your logo styling here
  },
});