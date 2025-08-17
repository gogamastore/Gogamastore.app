#!/bin/bash
# Temporary script to add styles

TARGET_FILE="/app/frontend/app/(tabs)/index.tsx"

# Add the new styles after line 824
sed -i '824a\
  sectionContainer: {\
    marginHorizontal: 16,\
    marginBottom: 16,\
  },\
  sectionHeader: {\
    marginBottom: 16,\
  },\
  titleRow: {\
    flexDirection: '\''row'\'',\
    justifyContent: '\''space-between'\'',\
    alignItems: '\''center'\'',\
    marginBottom: 8,\
  },\
  topViewAllButton: {\
    flexDirection: '\''row'\'',\
    alignItems: '\''center'\'',\
    backgroundColor: '\''transparent'\'',\
    paddingHorizontal: 12,\
    paddingVertical: 6,\
    borderRadius: 16,\
    borderWidth: 1,\
    borderColor: '\''#007AFF'\'',\
  },\
  topViewAllText: {\
    fontSize: 12,\
    fontWeight: '\''500'\'',\
    color: '\''#007AFF'\'',\
    marginRight: 4,\
  },' "$TARGET_FILE"

echo "Styles added"