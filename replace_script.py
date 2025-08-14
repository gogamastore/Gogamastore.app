#!/usr/bin/env python3

import re

# Read the file
with open('/app/frontend/app/(tabs)/categories.tsx', 'r') as f:
    content = f.read()

# Define the old string to replace
old_str = """      // Step 2: Get product details for each trending product ID
      const productPromises = trendingData.map(async (trending) => {
        try {
          const productRef = doc(db, 'products', trending.productId);
          const productSnap = await getDoc(productRef);
          
          if (productSnap.exists()) {
            return {
              id: productSnap.id,
              ...productSnap.data()
            } as Product;
          }
          return null;
        } catch (error) {
          console.error(`Error fetching product ${trending.productId}:`, error);
          return null;
        }
      });
      
      const products = await Promise.all(productPromises);
      const validProducts = products.filter(product => product !== null) as Product[];
      
      console.log('✅ Loaded trending products:', validProducts.length);
      setTrendingProducts(validProducts);"""

# Define the new string
new_str = """      // Step 2: Get product details for each trending product ID
      const productPromises = trendingData.map(async (trending) => {
        try {
          const productRef = doc(db, 'products', trending.productId);
          const productSnap = await getDoc(productRef);
          
          if (productSnap.exists()) {
            const productData = productSnap.data();
            console.log('📦 Product data:', productData);
            
            return {
              id: productSnap.id,
              ...productData
            } as Product;
          } else {
            console.warn(`⚠️ Product not found: ${trending.productId}`);
          }
          return null;
        } catch (error) {
          console.error(`❌ Error fetching product ${trending.productId}:`, error);
          return null;
        }
      });
      
      const products = await Promise.all(productPromises);
      const validProducts = products.filter(product => product !== null) as Product[];
      
      console.log('✅ Loaded trending products:', validProducts.length);
      console.log('📋 Products details:', validProducts.map(p => ({ id: p.id, nama: p.nama, harga: p.harga })));
      setTrendingProducts(validProducts);"""

# Perform the replacement
if old_str in content:
    new_content = content.replace(old_str, new_str)
    
    # Write the updated content back to the file
    with open('/app/frontend/app/(tabs)/categories.tsx', 'w') as f:
        f.write(new_content)
    
    print("✅ Replacement successful!")
else:
    print("❌ Old string not found in file")
    print("Searching for partial matches...")
    
    # Try to find the beginning of the section
    if "// Step 2: Get product details for each trending product ID" in content:
        print("Found the comment, but full block doesn't match")
    else:
        print("Comment not found")