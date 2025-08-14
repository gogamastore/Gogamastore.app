import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const getStatusIcon = (status: string) => {
  console.log('🎯 getStatusIcon called with status:', status);
  
  const statusLower = status ? status.toLowerCase() : '';
  console.log('🎯 statusLower:', statusLower);
  
  switch (statusLower) {
    case 'pending':
      return { name: 'schedule', color: '#FF9500' };
    case 'confirmed':
      return { name: 'check-circle', color: '#34C759' }; 
    case 'processing':
    case 'proses':
      return { name: 'sync', color: '#007AFF' };
    case 'shipped':
    case 'dikirim':
      return { name: 'local-shipping', color: '#5856D6' };  
    case 'delivered':
    case 'selesai':
      return { name: 'done-all', color: '#34C759' };
    case 'cancelled':
    case 'dibatalkan':
      return { name: 'cancel', color: '#FF3B30' };
    default:
      console.log('🎯 Using default icon for status:', status);
      return { name: 'info', color: '#666' };
  }
};

const getSuccessMessage = (status: string) => {
  console.log('🎯 getSuccessMessage called with status:', status);
  
  const statusLower = status ? status.toLowerCase() : '';
  console.log('🎯 statusLower:', statusLower);
  
  switch (statusLower) {
    case 'pending':
      return {
        title: 'Pesanan Berhasil Dibuat!',
        subtitle: 'Terima kasih atas pesanan Anda. Kami akan segera memproses pesanan ini.'
      };
    case 'processing':
    case 'proses':
      console.log('🎯 Returning processing message');
      return {
        title: 'Pesanan Berhasil di Proses',
        subtitle: 'Terima kasih atas pesanan Anda. Kami akan segera mengirim pesanan ini.'
      };
    case 'shipped':
    case 'dikirim':
      console.log('🎯 Returning shipped message');
      return {
        title: 'Pesanan Berhasil di Kirim',
        subtitle: 'Terima kasih atas pesanan Anda.'
      };
    case 'delivered':
    case 'selesai':
      console.log('🎯 Returning delivered message');
      return {
        title: 'Pesanan Berhasil di Terima',
        subtitle: 'Terima kasih atas pesanan Anda.'
      };
    case 'cancelled':
    case 'dibatalkan':
      console.log('🎯 Returning cancelled message');
      return {
        title: 'Pesanan Berhasil di Batalkan',
        subtitle: 'Silahkan membuat pesanan baru.'
      };
    default:
      console.log('🎯 Using default message for status:', status);
      return {
        title: 'Pesanan Berhasil Dibuat!',
        subtitle: 'Terima kasih atas pesanan Anda. Kami akan segera memproses pesanan ini.'
      };
  }
};

export default function DebugStatus() {
  const testStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>DEBUG STATUS TESTING</Text>
      
      {testStatuses.map((status) => {
        const icon = getStatusIcon(status);
        const message = getSuccessMessage(status);
        
        return (
          <View key={status} style={styles.statusTest}>
            <View style={styles.statusHeader}>
              <MaterialIcons name={icon.name} size={32} color={icon.color} />
              <Text style={styles.statusName}>{status.toUpperCase()}</Text>
            </View>
            <Text style={styles.statusTitle}>{message.title}</Text>
            <Text style={styles.statusSubtitle}>{message.subtitle}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  statusTest: {
    marginBottom: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#666',
  },
});