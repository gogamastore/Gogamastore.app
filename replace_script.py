#!/usr/bin/env python3

import re

# Read the file
with open('/app/frontend/app/(tabs)/index.tsx', 'r') as f:
    content = f.read()

# Define the old and new strings
old_str = '''        <Text style={styles.productPrice}>{formatPrice(item.harga)}</Text>
        <Text style={styles.productStock}>Stok: {item.stok}</Text>'''

new_str = '''        <Text style={styles.productPrice}>{formatPrice(item.harga)}</Text>
        <Text style={[
          styles.productStock,
          { color: item.stok === 0 ? '#FF3B30' : '#666' }
        ]}>
          {item.stok === 0 ? 'Stok: Habis' : `Stok: ${item.stok}`}
        </Text>'''

# Perform the replacement
if old_str in content:
    new_content = content.replace(old_str, new_str)
    
    # Write the updated content back to the file
    with open('/app/frontend/app/(tabs)/index.tsx', 'w') as f:
        f.write(new_content)
    
    print("Replacement successful!")
else:
    print("Old string not found in file")
    print("Looking for:")
    print(repr(old_str))