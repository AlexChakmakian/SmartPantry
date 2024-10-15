import React, { useState } from 'react';
import { Text, View, StyleSheet, TextInput, TouchableOpacity, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';

export default function Index() {
  const [username, setUsername] = useState('');
  const router = useRouter(); // Use router from expo-router

  const handleLogin = () => {
    if (username) {
      router.push('/home'); // Navigate to Home screen
    } else {
      Alert.alert('Please enter a username');
    }
  };

  const handleCreateAccount = () => {
    router.push('/create-account'); // REATE ACCOUNT PAGE SHOULD BE THIS NAME
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('C:/Users/Kinga/StickerSmash/assets/Logo.png')} // Logo path
        style={styles.logo}
      />
      <TextInput
        style={styles.input}
        placeholder="Username" // Placeholder text
        placeholderTextColor="#888" // Optional: color for placeholder text
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      {/* Create an Account Text */}
      <TouchableOpacity onPress={handleCreateAccount}>
        <Text style={styles.createAccountText}>Create Account</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ADD8E6',
    alignItems: 'center',
    justifyContent: 'flex-start', // Keep items at the top
    padding: 35,
  },
  logo: {
    width: 100,  // Adjust the size of the logo as needed
    height: 100,
    marginBottom: 80, // Decrease this value to move the logo higher
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    width: '100%',
    marginBottom: 20,
    backgroundColor: '#fff', // Optional: make input fields have a white background
  },
  loginButton: {
    borderColor: '#fff', // White border color
    borderWidth: 2, // Border thickness
    borderRadius: 5, // Rounded corners
    paddingVertical: 10, // Vertical padding for the button
    paddingHorizontal: 20, // Horizontal padding for the button
    marginBottom: 20, // Space below the button
  },
  buttonText: {
    color: '#fff', // White text color for the button
    fontSize: 18, // Font size for the button text
  },
  createAccountText: {
      color: '#ffffff', // create account text
      fontSize: 14,
  },
});