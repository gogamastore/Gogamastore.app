#!/usr/bin/env python3

import re

# Read the file
with open('/app/frontend/app/(tabs)/profile.tsx', 'r') as f:
    content = f.read()

# Define the old string to replace
old_str = '''  const handleLogout = async () => {
    console.log('🚪 handleLogout called');
    
    Alert.alert(
      'Keluar dari Akun',
      'Apakah Anda yakin ingin keluar dari akun?',
      [
        {
          text: 'Batal',
          style: 'cancel',
          onPress: () => console.log('❌ Logout cancelled by user')
        },
        {
          text: 'Keluar',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🚪 User confirmed logout, starting process...');
              
              // Call logout from AuthContext
              await logout();
              console.log('✅ AuthContext logout completed');
              
              // Force navigation to login screen
              console.log('🔄 Attempting navigation to login screen...');
              router.replace('/(auth)/login');
              console.log('✅ Navigation command executed');
              
            } catch (error) {
              console.error('❌ Logout error:', error);
              Alert.alert('Error', 'Gagal keluar dari akun. Silakan coba lagi.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };'''

# Define the new string
new_str = '''  const handleLogout = async () => {
    console.log('🚪 handleLogout called');
    
    // Show custom modal instead of Alert.alert
    setLogoutModalVisible(true);
  };

  const confirmLogout = async () => {
    try {
      console.log('🚪 User confirmed logout, starting process...');
      setLogoutModalVisible(false);
      
      // Call logout from AuthContext
      await logout();
      console.log('✅ AuthContext logout completed');
      
      // Force navigation to login screen
      console.log('🔄 Attempting navigation to login screen...');
      router.replace('/(auth)/login');
      console.log('✅ Navigation command executed');
      
    } catch (error) {
      console.error('❌ Logout error:', error);
      setLogoutModalVisible(false);
    }
  };

  const cancelLogout = () => {
    console.log('❌ Logout cancelled by user');
    setLogoutModalVisible(false);
  };'''

# Perform the replacement
if old_str in content:
    new_content = content.replace(old_str, new_str)
    
    # Write the updated content back to the file
    with open('/app/frontend/app/(tabs)/profile.tsx', 'w') as f:
        f.write(new_content)
    
    print("✅ Successfully replaced the handleLogout function")
else:
    print("❌ Old string not found in the file")
    print("Searching for partial matches...")
    
    # Try to find the function start
    if "const handleLogout = async () => {" in content:
        print("✅ Found function start")
    else:
        print("❌ Function start not found")