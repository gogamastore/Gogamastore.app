// Test function to verify Firestore permissions for updating orders
// Add this to your firestoreService.js temporarily for debugging

export const testOrderUpdate = async (orderId, testData = {}) => {
  try {
    console.log('🧪 Testing order update permissions for orderId:', orderId);
    
    // Check authentication first
    const { auth } = await import('../lib/firebase');
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('User not authenticated. Please login first.');
    }
    
    console.log('🔐 User authenticated:', currentUser.uid);
    
    // Try to read the order first
    const orderRef = doc(db, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);
    
    if (!orderSnap.exists()) {
      console.log('❌ Order document does not exist:', orderId);
      return { success: false, error: 'Order not found' };
    }
    
    console.log('📋 Current order data:', orderSnap.data());
    
    // Try to update the order document
    const testUpdateData = {
      testField: 'test_value_' + Date.now(),
      testUpdatedAt: new Date().toISOString(),
      ...testData
    };
    
    console.log('🔄 Attempting to update order with test data:', testUpdateData);
    
    await updateDoc(orderRef, testUpdateData);
    
    console.log('✅ Order update successful');
    
    // Verify the update
    const verificationSnap = await getDoc(orderRef);
    if (verificationSnap.exists()) {
      const verifiedData = verificationSnap.data();
      console.log('🔍 Verification - Updated data:', {
        testField: verifiedData.testField,
        testUpdatedAt: verifiedData.testUpdatedAt
      });
    }
    
    return { success: true, message: 'Order update test passed' };
    
  } catch (error) {
    console.error('❌ Order update test failed:', error);
    
    // Specific error handling
    if (error.code === 'permission-denied') {
      console.error('🔒 Permission denied - check Firestore security rules');
      console.error('💡 Current user may not have permission to update this order');
    }
    
    return { success: false, error: error.message, code: error.code };
  }
};

// Test function specifically for paymentProofUrl update
export const testPaymentProofUpdate = async (orderId, mockDownloadURL) => {
  const testData = {
    paymentProofUrl: mockDownloadURL || 'https://test-url.com/test-image.jpg',
    paymentStatus: 'proof_uploaded',
    paymentProofUploaded: true,
    paymentProofFileName: 'test-payment-proof.jpg',
    paymentProofId: 'test-proof-id-' + Date.now()
  };
  
  return await testOrderUpdate(orderId, testData);
};