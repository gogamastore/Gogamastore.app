const { createUserWithEmailAndPassword, updateProfile } = require('firebase/auth');
const { doc, setDoc } = require('firebase/firestore');
const { auth, db } = require('./lib/firebase');

async function createTestUser() {
  try {
    console.log('🔐 Creating test user...');
    
    const testEmail = 'test@gogama.com';
    const testPassword = 'password123';
    const testName = 'Test User';
    const testWhatsapp = '08123456789';
    
    // Create user with email and password
    const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
    
    // Update display name
    await updateProfile(firebaseUser, {
      displayName: testName
    });

    // Save additional user data to Firestore
    await setDoc(doc(db, 'user', firebaseUser.uid), {
      name: testName,
      email: testEmail,
      whatsapp: testWhatsapp,
      role: 'reseller',
      photoURL: '',
      addresses: {},
      createdAt: new Date()
    });

    console.log('✅ Test user created successfully:', {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName
    });
    
    console.log('🔑 Login credentials:');
    console.log('- Email:', testEmail);
    console.log('- Password:', testPassword);
    
  } catch (error) {
    console.error('❌ Error creating test user:', error);
  }
}

createTestUser();