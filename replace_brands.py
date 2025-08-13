#!/usr/bin/env python3

import re

# Read the file
with open('/app/frontend/app/(tabs)/index.tsx', 'r') as f:
    content = f.read()

# Define the old text to replace
old_text = '''      {/* Brand Directory */}
      {brands.length > 0 && (
        <View style={styles.brandsSection}>
          <Text style={styles.sectionTitle}>Brand Favoritmu</Text>
          <View style={styles.brandsGrid}>
            {brands.map((brand) => {
              console.log('Rendering brand:', brand);
              return (
                <TouchableOpacity key={brand.id} style={styles.brandCard}>
                  {(brand.logoUrl || brand.logo || brand.gambar || brand.image) ? (
                    <Image 
                      source={{ uri: brand.logoUrl || brand.logo || brand.gambar || brand.image }} 
                      style={styles.brandLogo}
                      resizeMode="contain"
                      onError={() => console.log('Brand image failed to load:', brand)}
                      onLoad={() => console.log('Brand image loaded:', brand)}
                    />
                  ) : (
                    <View style={styles.brandLogoPlaceholder}>
                      <MaterialIcons name="business" size={32} color="#666" />
                    </View>
                  )}
                  <Text style={styles.brandName}>
                    {brand.nama || brand.name || brand.title || 'Unknown Brand'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}'''

# Define the new text
new_text = '''      {/* Brand Directory */}
      {brands.length > 0 && (
        <View style={styles.brandsSection}>
          <Text style={styles.sectionTitle}>Brand Favoritmu</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.brandsScrollContainer}
            style={styles.brandsScrollView}
          >
            {brands.map((brand) => {
              console.log('Rendering brand:', brand);
              return (
                <TouchableOpacity key={brand.id} style={styles.brandCard}>
                  {(brand.logoUrl || brand.logo || brand.gambar || brand.image) ? (
                    <Image 
                      source={{ uri: brand.logoUrl || brand.logo || brand.gambar || brand.image }} 
                      style={styles.brandLogo}
                      resizeMode="contain"
                      onError={() => console.log('Brand image failed to load:', brand)}
                      onLoad={() => console.log('Brand image loaded:', brand)}
                    />
                  ) : (
                    <View style={styles.brandLogoPlaceholder}>
                      <MaterialIcons name="business" size={20} color="#666" />
                    </View>
                  )}
                  <Text style={styles.brandName}>
                    {brand.nama || brand.name || brand.title || 'Unknown Brand'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}'''

# Replace the text
if old_text in content:
    content = content.replace(old_text, new_text)
    print("Replacement successful!")
else:
    print("Old text not found!")

# Also update the styles
old_styles = '''  brandsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  brandCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },'''

new_styles = '''  brandsScrollView: {
    paddingHorizontal: 16,
  },
  brandsScrollContainer: {
    paddingRight: 16,
  },
  brandCard: {
    width: 100,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginRight: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },'''

if old_styles in content:
    content = content.replace(old_styles, new_styles)
    print("Styles replacement successful!")
else:
    print("Old styles not found!")

# Write the file back
with open('/app/frontend/app/(tabs)/index.tsx', 'w') as f:
    f.write(content)

print("File updated successfully!")