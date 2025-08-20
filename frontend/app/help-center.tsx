import React, { useState } from 'react';
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

interface FAQItem {
  question: string;
  answer: string;
}

export default function HelpCenterScreen() {
  const router = useRouter();
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const faqData: FAQItem[] = [
    {
      question: 'Bagaimana cara menjadi reseller?',
      answer: 'Untuk menjadi reseller, silakan daftar melalui aplikasi dengan memilih opsi "Daftar sebagai Reseller". Isi formulir pendaftaran dengan lengkap dan tunggu verifikasi dari tim kami. Setelah disetujui, Anda dapat mulai menjual produk dengan mendapatkan komisi dari setiap penjualan.'
    },
    {
      question: 'Bagaimana cara melacak pesanan saya?',
      answer: 'Anda dapat melacak pesanan melalui menu "Riwayat Pesanan" di profil Anda. Setiap pesanan akan menampilkan status terkini mulai dari konfirmasi, proses, pengiriman, hingga sampai tujuan. Anda juga akan mendapat notifikasi untuk setiap perubahan status pesanan.'
    },
    {
      question: 'Berapa lama waktu pengiriman?',
      answer: 'Waktu pengiriman bervariasi tergantung lokasi dan metode pengiriman yang dipilih:\n\n• Dalam kota: 1-2 hari kerja\n• Luar kota (Pulau Jawa): 2-4 hari kerja\n• Luar Pulau Jawa: 3-7 hari kerja\n\nWaktu dapat lebih lama pada hari libur nasional atau kondisi cuaca ekstrem.'
    },
    {
      question: 'Apa saja metode pembayaran yang diterima?',
      answer: 'Kami menerima berbagai metode pembayaran:\n\n• Transfer Bank (BCA, Mandiri, BNI, BRI)\n• E-Wallet (OVO, GoPay, DANA, ShopeePay)\n• Virtual Account\n• COD (Cash on Delivery) untuk area tertentu\n\nPilih metode yang paling nyaman untuk Anda saat checkout.'
    },
    {
      question: 'Bagaimana cara mengembalikan produk?',
      answer: 'Untuk pengembalian produk:\n\n1. Hubungi customer service dalam 7 hari setelah produk diterima\n2. Produk masih dalam kondisi asli dan belum digunakan\n3. Sertakan bukti pembelian dan foto produk\n4. Tim kami akan memverifikasi dan memberikan instruksi lebih lanjut\n\nBiaya return ditanggung pembeli kecuali produk cacat/salah kirim.'
    },
    {
      question: 'Apakah ada garansi untuk produk?',
      answer: 'Garansi produk bervariasi tergantung jenis dan brand:\n\n• Elektronik: Garansi resmi dari distributor/brand\n• Fashion: Garansi kualitas 7 hari\n• Kosmetik: Garansi original dan tanggal expired\n\nDetail garansi dapat dilihat di deskripsi produk atau hubungi customer service.'
    }
  ];

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  const handleContactEmail = () => {
    Linking.openURL('mailto:official@gogama.store').catch(() => {
      Alert.alert('Error', 'Tidak dapat membuka aplikasi email');
    });
  };

  const handleContactPhone = () => {
    Linking.openURL('tel:+6289636052501').catch(() => {
      Alert.alert('Error', 'Tidak dapat membuka aplikasi telepon');
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pusat Bantuan</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Privacy Policy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kebijakan Privasi – Gogama.Store</Text>
          <Text style={styles.lastUpdated}>Terakhir diperbarui: 21 Agustus 2025</Text>

          <View style={styles.policySection}>
            <Text style={styles.policyTitle}>1. Pendahuluan</Text>
            <Text style={styles.policyText}>
              Selamat datang di Gogama.Store. Kami menghargai privasi Anda dan berkomitmen untuk melindungi data pribadi yang Anda berikan saat menggunakan aplikasi ini. Kebijakan ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi informasi Anda.
            </Text>
          </View>

          <View style={styles.policySection}>
            <Text style={styles.policyTitle}>2. Informasi yang Kami Kumpulkan</Text>
            <Text style={styles.policyText}>Kami dapat mengumpulkan data berikut:</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>Informasi Akun:</Text> Nama, alamat email, nomor telepon, dan alamat pengiriman.</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>Data Transaksi:</Text> Riwayat pembelian, metode pembayaran (hanya data transaksi, bukan detail kartu).</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>Data Teknis:</Text> Alamat IP, jenis perangkat, sistem operasi, dan aktivitas penggunaan aplikasi.</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>Konten yang Diberikan Pengguna:</Text> Ulasan, komentar, atau pesan yang dikirimkan ke kami.</Text>
          </View>

          <View style={styles.policySection}>
            <Text style={styles.policyTitle}>3. Penggunaan Informasi</Text>
            <Text style={styles.policyText}>Data yang dikumpulkan digunakan untuk:</Text>
            <Text style={styles.bulletPoint}>• Memproses pesanan dan pengiriman.</Text>
            <Text style={styles.bulletPoint}>• Memberikan dukungan pelanggan.</Text>
            <Text style={styles.bulletPoint}>• Mengirimkan informasi promo, penawaran khusus, atau pembaruan produk.</Text>
            <Text style={styles.bulletPoint}>• Meningkatkan keamanan dan pengalaman pengguna di aplikasi.</Text>
          </View>

          <View style={styles.policySection}>
            <Text style={styles.policyTitle}>4. Perlindungan Data</Text>
            <Text style={styles.policyText}>Kami menerapkan langkah-langkah keamanan teknis dan administratif untuk melindungi data Anda, termasuk:</Text>
            <Text style={styles.bulletPoint}>• Enkripsi data selama transmisi.</Text>
            <Text style={styles.bulletPoint}>• Pembatasan akses hanya untuk staf yang berwenang.</Text>
            <Text style={styles.bulletPoint}>• Penyimpanan data di server dengan standar keamanan tinggi.</Text>
          </View>

          <View style={styles.policySection}>
            <Text style={styles.policyTitle}>5. Pembagian Informasi</Text>
            <Text style={styles.policyText}>Kami tidak menjual atau membagikan data pribadi Anda kepada pihak ketiga, kecuali:</Text>
            <Text style={styles.bulletPoint}>• Diperlukan untuk memproses pesanan (contoh: jasa kurir).</Text>
            <Text style={styles.bulletPoint}>• Diminta oleh hukum atau peraturan yang berlaku.</Text>
            <Text style={styles.bulletPoint}>• Diperlukan untuk melindungi hak dan keamanan pengguna atau perusahaan.</Text>
          </View>

          <View style={styles.policySection}>
            <Text style={styles.policyTitle}>6. Hak Pengguna</Text>
            <Text style={styles.policyText}>Anda berhak untuk:</Text>
            <Text style={styles.bulletPoint}>• Mengakses dan memperbarui data pribadi Anda.</Text>
            <Text style={styles.bulletPoint}>• Meminta penghapusan data sesuai hukum yang berlaku.</Text>
            <Text style={styles.bulletPoint}>• Menolak menerima promosi atau newsletter.</Text>
          </View>

          <View style={styles.policySection}>
            <Text style={styles.policyTitle}>7. Cookie & Pelacakan</Text>
            <Text style={styles.policyText}>
              Aplikasi ini dapat menggunakan cookie atau teknologi serupa untuk:
            </Text>
            <Text style={styles.bulletPoint}>• Menyimpan preferensi pengguna.</Text>
            <Text style={styles.bulletPoint}>• Menganalisis perilaku penggunaan.</Text>
            <Text style={styles.policyText}>
              Anda dapat menonaktifkan cookie melalui pengaturan perangkat, namun beberapa fitur mungkin tidak berfungsi optimal.
            </Text>
          </View>

          <View style={styles.policySection}>
            <Text style={styles.policyTitle}>8. Perubahan Kebijakan</Text>
            <Text style={styles.policyText}>
              Kami dapat memperbarui kebijakan privasi ini dari waktu ke waktu. Perubahan akan diumumkan melalui aplikasi atau email sebelum berlaku.
            </Text>
          </View>

          <View style={styles.policySection}>
            <Text style={styles.policyTitle}>9. Kontak</Text>
            <Text style={styles.policyText}>
              Jika Anda memiliki pertanyaan atau keluhan terkait kebijakan ini, silakan hubungi kami di:
            </Text>
            
            <TouchableOpacity style={styles.contactItem} onPress={handleContactEmail}>
              <MaterialIcons name="email" size={20} color="#007AFF" />
              <Text style={styles.contactText}>official@gogama.store</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.contactItem} onPress={handleContactPhone}>
              <MaterialIcons name="phone" size={20} color="#007AFF" />
              <Text style={styles.contactText}>+6289636052501</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pertanyaan yang Sering Diajukan (FAQ)</Text>
          
          <View style={styles.faqContainer}>
            {faqData.map((item, index) => (
              <View key={index} style={styles.faqItem}>
                <TouchableOpacity
                  style={styles.faqQuestion}
                  onPress={() => toggleFAQ(index)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.faqQuestionText}>{item.question}</Text>
                  <MaterialIcons
                    name={expandedFAQ === index ? "keyboard-arrow-up" : "keyboard-arrow-down"}
                    size={24}
                    color="#666"
                    style={[
                      styles.faqIcon,
                      expandedFAQ === index && styles.faqIconExpanded
                    ]}
                  />
                </TouchableOpacity>
                
                {expandedFAQ === index && (
                  <View style={styles.faqAnswer}>
                    <Text style={styles.faqAnswerText}>{item.answer}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Contact Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Butuh Bantuan Lebih Lanjut?</Text>
          <Text style={styles.contactDescription}>
            Tim customer service kami siap membantu Anda 24/7. Jangan ragu untuk menghubungi kami:
          </Text>
          
          <View style={styles.contactContainer}>
            <TouchableOpacity style={styles.contactButton} onPress={handleContactEmail}>
              <MaterialIcons name="email" size={24} color="#007AFF" />
              <View style={styles.contactButtonText}>
                <Text style={styles.contactButtonTitle}>Email Support</Text>
                <Text style={styles.contactButtonSubtitle}>official@gogama.store</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#C7C7CC" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactButton} onPress={handleContactPhone}>
              <MaterialIcons name="phone" size={24} color="#007AFF" />
              <View style={styles.contactButtonText}>
                <Text style={styles.contactButtonTitle}>Telepon / WhatsApp</Text>
                <Text style={styles.contactButtonSubtitle}>+62 896-3605-2501</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#C7C7CC" />
            </TouchableOpacity>
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
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
    lineHeight: 28,
  },
  lastUpdated: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 24,
  },
  policySection: {
    marginBottom: 24,
  },
  policyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
    lineHeight: 24,
  },
  policyText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
    marginBottom: 8,
  },
  bulletPoint: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
    marginBottom: 4,
    marginLeft: 8,
  },
  boldText: {
    fontWeight: '600',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 8,
    fontWeight: '500',
  },
  faqContainer: {
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  faqQuestionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    flex: 1,
    lineHeight: 24,
  },
  faqIcon: {
    marginLeft: 12,
    transform: [{ rotate: '0deg' }],
  },
  faqIconExpanded: {
    transform: [{ rotate: '180deg' }],
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  faqAnswerText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
  contactDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 20,
  },
  contactContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 4,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 4,
    borderRadius: 8,
  },
  contactButtonText: {
    flex: 1,
    marginLeft: 12,
  },
  contactButtonTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  contactButtonSubtitle: {
    fontSize: 14,
    color: '#666',
  },
});