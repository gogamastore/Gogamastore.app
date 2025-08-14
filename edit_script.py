#!/usr/bin/env python3

import re

# Read the file
with open('/app/frontend/app/(tabs)/index.tsx', 'r') as f:
    content = f.read()

# Define the old string to replace
old_str = """  categoryChipTextSelected: {
    color: '#fff',
    fontWeight: '500',
  },
  resetButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  productsSection: {"""

# Define the new string
new_str = """  categoryChipTextSelected: {
    color: '#fff',
    fontWeight: '500',
  },
  productsSection: {"""

# Perform the replacement
if old_str in content:
    new_content = content.replace(old_str, new_str)
    
    # Write the modified content back to the file
    with open('/app/frontend/app/(tabs)/index.tsx', 'w') as f:
        f.write(new_content)
    
    print("✅ Successfully replaced the text")
    print(f"Old string found and replaced")
else:
    print("❌ Old string not found in the file")
    print("Searching for similar patterns...")
    
    # Let's check if the pattern exists with slight variations
    lines = content.split('\n')
    for i, line in enumerate(lines):
        if 'categoryChipTextSelected' in line:
            print(f"Found categoryChipTextSelected at line {i+1}")
            # Print surrounding context
            start = max(0, i-2)
            end = min(len(lines), i+20)
            for j in range(start, end):
                marker = ">>> " if j == i else "    "
                print(f"{marker}{j+1}: {lines[j]}")
            break