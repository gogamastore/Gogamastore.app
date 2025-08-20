import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface ContactItem {
  title: string;
  url: string;
  icon: string;
  iconColor: string;
}

export default function ContactScreen() {
  const router = useRouter();

  const handleLinkPress = (url: string, title: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', `Tidak dapat membuka ${title}`);
    });
  };

  const socialMediaContacts: ContactItem[] = [
    {
      title: 'manafidh_kosmetik',
      url: 'https://www.instagram.com/manafidh_kosmetik/',
      icon: 'camera-alt',
      iconColor: '#E4405F'
    },
    {
      title: 'manafidh_kosmetik',
      url: 'https://www.facebook.com/admin.myqueen',
      icon: 'facebook',
      iconColor: '#1877F2'
    },
    {
      title: 'Gallery Makassar',
      url: 'https://www.tiktok.com/@gallery.makassar',
      icon: 'music-note',
      iconColor: '#000000'
    },
    {
      title: 'manafidh_kosmetik',
      url: 'https://shope.ee/6Kbmbbr5pA',
      icon: 'shopping-bag',
      iconColor: '#FF6C37'
    }
  ];

  const grosirContacts: ContactItem[] = [
    {
      title: 'WA Komplain Shopee',
      url: 'http://wa.me/6289506991107',
      icon: 'chat',
      iconColor: '#25D366'
    },
    {
      title: 'Admin Grosir 1',
      url: 'http://wa.me/6288705707321',
      icon: 'chat',
      iconColor: '#25D366'
    },
    {
      title: 'Admin Grosir 2',
      url: 'http://wa.me/6289503674236',
      icon: 'chat',
      iconColor: '#25D366'
    },
    {
      title: 'WA Lowongan Kerja',
      url: 'http://wa.me/6289636052501',
      icon: 'work',
      iconColor: '#25D366'
    }
  ];

  const offlineStore: ContactItem[] = [
    {
      title: 'Maps : Gallery Makassar',
      url: 'https://maps.app.goo.gl/BQmTCJBcVRaeU7wi9',
      icon: 'place',
      iconColor: '#4285F4'
    }
  ];

  const renderContactSection = (title: string, contacts: ContactItem[], backgroundColor: string) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      
      <View style={[styles.contactsContainer, { backgroundColor }]}>
        {contacts.map((contact, index) => (
          <TouchableOpacity
            key={index}
            style={styles.contactItem}
            onPress={() => handleLinkPress(contact.url, contact.title)}
            activeOpacity={0.7}
          >
            <View style={styles.contactIconContainer}>
              <View style={[styles.iconBackground, { backgroundColor: contact.iconColor }]}>
                <MaterialIcons name={contact.icon as any} size={24} color="#fff" />
              </View>
            </View>
            
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>{contact.title}</Text>
              <Text style={styles.contactSubtitle}>Tap untuk membuka</Text>
            </View>
            
            <MaterialIcons name="chevron-right" size={24} color="#C7C7CC" />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroContent}>
            <View style={styles.logoContainer}>
              <MaterialIcons name="store" size={48} color="#fff" />
            </View>
            <Text style={styles.heroTitle}>Gogama Store</Text>
            <Text style={styles.heroSubtitle}>Hubungi kami melalui berbagai platform</Text>
          </View>
        </View>

        {/* Social Media Contacts */}
        {renderContactSection('Akun Official Kami :', socialMediaContacts, '#f8f9fa')}

        {/* Grosir Contacts */}
        {renderContactSection('Hubungi Kami Untuk Join Grosir :', grosirContacts, '#f0fff4')}

        {/* Offline Store */}
        {renderContactSection('Offline Store :', offlineStore, '#fff5f5')}

        {/* Customer Service Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Customer Service 24/7</Text>
          </View>
          
          <View style={[styles.contactsContainer, { backgroundColor: '#e6f3ff' }]}>
            <TouchableOpacity
              style={styles.contactItem}
              onPress={() => handleLinkPress('mailto:official@gogama.store', 'Email')}
              activeOpacity={0.7}
            >
              <View style={styles.contactIconContainer}>
                <View style={[styles.iconBackground, { backgroundColor: '#007AFF' }]}>
                  <MaterialIcons name="email" size={24} color="#fff" />
                </View>
              </View>
              
              <View style={styles.contactInfo}>
                <Text style={styles.contactTitle}>official@gogama.store</Text>
                <Text style={styles.contactSubtitle}>Email support</Text>
              </View>
              
              <MaterialIcons name="chevron-right" size={24} color="#C7C7CC" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactItem}
              onPress={() => handleLinkPress('tel:+6289636052501', 'Telepon')}
              activeOpacity={0.7}
            >
              <View style={styles.contactIconContainer}>
                <View style={[styles.iconBackground, { backgroundColor: '#34C759' }]}>
                  <MaterialIcons name="phone" size={24} color="#fff" />
                </View>
              </View>
              
              <View style={styles.contactInfo}>
                <Text style={styles.contactTitle}>+62 896-3605-2501</Text>
                <Text style={styles.contactSubtitle}>Telepon / WhatsApp</Text>
              </View>
              
              <MaterialIcons name="chevron-right" size={24} color="#C7C7CC" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Operational Hours */}
        <View style={styles.section}>
          <Text style={styles.sectionTitleDark}>Jam Operasional</Text>
          
          <View style={styles.operationalContainer}>
            <View style={styles.operationalItem}>
              <Text style={styles.operationalDay}>Senin - Jumat</Text>
              <Text style={styles.operationalTime}>08:00 - 17:00 WITA</Text>
            </View>
            
            <View style={styles.operationalItem}>
              <Text style={styles.operationalDay}>Sabtu</Text>
              <Text style={styles.operationalTime}>08:00 - 15:00 WITA</Text>
            </View>
            
            <View style={styles.operationalItem}>
              <Text style={styles.operationalDay}>Minggu</Text>
              <Text style={styles.operationalTime}>Tutup</Text>
            </View>
          </View>
          
          <View style={styles.noteContainer}>
            <MaterialIcons name="info" size={16} color="#666" />
            <Text style={styles.noteText}>
              WhatsApp Customer Service tersedia 24/7 untuk pertanyaan mendesak
            </Text>
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  heroSection: {
    paddingHorizontal: 24,
    paddingVertical: 40,
    alignItems: 'center',
    backgroundColor: '#2aadc4', // Gradient replacement
  },
  heroContent: {
    alignItems: 'center',
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    marginTop: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#2aadc4', // Gradient replacement
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  sectionTitleDark: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    paddingVertical: 16,
  },
  contactsContainer: {
    paddingVertical: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229, 229, 234, 0.3)',
  },
  contactIconContainer: {
    marginRight: 16,
  },
  iconBackground: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  contactSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  operationalContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  operationalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  operationalDay: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  operationalTime: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F8F9FA',
    gap: 8,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});