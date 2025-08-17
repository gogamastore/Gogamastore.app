import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { cartService } from '../services/firestoreService';

interface TopHeaderProps {
  title?: string;
}

export default function TopHeader({ title = 'Gogama Store' }: TopHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const [cartCount, setCartCount] = useState(0);

  // Hide header on cart page
  if (pathname === '/(tabs)/cart' || pathname === '/cart') {
    return null;
  }

  // Fetch cart count when screen gains focus
  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchCartCount();
      }
    }, [user])
  );

  useEffect(() => {
    if (user) {
      fetchCartCount();
    }
  }, [user]);

  const fetchCartCount = async () => {
    if (!user) return;
    
    try {
      const cartData = await cartService.getUserCart(user.uid);
      const itemCount = cartData?.items?.reduce((total, item) => total + item.quantity, 0) || 0;
      setCartCount(itemCount);
    } catch (error) {
      console.error('Error fetching cart count:', error);
      setCartCount(0);
    }
  };

  const handleCartPress = () => {
    // Navigate to cart tab in bottom navigation
    router.push('/(tabs)/cart');
  };

  const handleNotificationPress = () => {
    // TODO: Navigate to notification screen or show notification panel
    console.log('Notification pressed');
    // For now, we can create a simple notification list screen
  };

  const Badge = ({ count, style }: { count: number; style?: any }) => {
    if (count === 0) return null;
    
    return (
      <View style={[styles.badge, style]}>
        <Text style={styles.badgeText}>
          {count > 99 ? '99+' : count.toString()}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.header}>
        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
        </View>

        {/* Right icons */}
        <View style={styles.iconsContainer}>
          {/* Notification Icon */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleNotificationPress}
            activeOpacity={0.7}
          >
            <MaterialIcons name="notifications" size={24} color="#1a1a1a" />
            <Badge count={unreadCount} />
          </TouchableOpacity>

          {/* Cart Icon */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleCartPress}
            activeOpacity={0.7}
          >
            <MaterialIcons name="shopping-cart" size={24} color="#1a1a1a" />
            <Badge count={cartCount} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  iconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconButton: {
    position: 'relative',
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});