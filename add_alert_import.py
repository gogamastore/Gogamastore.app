#!/usr/bin/env python3

# Read the file
with open('/app/frontend/app/(tabs)/profile.tsx', 'r') as f:
    content = f.read()

# Define the old import string
old_import = '''import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';'''

# Define the new import string with Alert added
new_import = '''import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  ScrollView,
  Image,
  Alert,
} from 'react-native';'''

# Perform the replacement
if old_import in content:
    new_content = content.replace(old_import, new_import)
    
    # Write the updated content back to the file
    with open('/app/frontend/app/(tabs)/profile.tsx', 'w') as f:
        f.write(new_content)
    
    print("✅ Successfully added Alert to imports")
else:
    print("❌ Old import string not found in the file")