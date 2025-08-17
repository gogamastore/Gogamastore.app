#!/bin/bash
# Temporary script to handle file editing with parentheses in path

TARGET_FILE="/app/frontend/app/(tabs)/index.tsx"

# Create backup
cp "$TARGET_FILE" "$TARGET_FILE.backup"

# Use sed to replace the content
sed -i '429,438c\
      <View style={styles.productsSection}>\
        <View style={styles.sectionContainer}>\
          <View style={styles.sectionHeader}>\
            <View style={styles.titleRow}>\
              <Text style={styles.sectionTitle}>Produk Trending</Text>\
              <TouchableOpacity\
                style={styles.topViewAllButton}\
                onPress={handleViewAllProducts}\
                activeOpacity={0.7}\
              >\
                <Text style={styles.topViewAllText}>Lihat Semua Produk</Text>\
                <MaterialIcons name="arrow-forward" size={16} color="#007AFF" />\
              </TouchableOpacity>\
            </View>\
            <Text style={styles.sectionSubtitle}>200 produk trending terpopuler</Text>\
            <Text style={styles.productsCount}>\
              {filteredProducts.length} produk\
            </Text>\
          </View>\
        </View>' "$TARGET_FILE"

echo "Edit completed"