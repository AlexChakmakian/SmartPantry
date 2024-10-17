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
    router.push('/create-account'); // CREATE ACCOUNT PAGE SHOULD BE THIS NAME
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
        placeholderTextColor="#777" // Optional: color for placeholder text
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

      {/* Sign in with Google Button (Graphic) */}
      <TouchableOpacity style={styles.googleSignInButton}>
        <Image 
          source={require('C:/Users/Kinga/StickerSmash/assets/sign-in-with-google.png')} // Path to your Google Sign-In button image
          style={styles.googleSignInImage}
        />
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
    width: 125,  // Size of logo ADJUST HERE
    height: 125,
    marginBottom: 70, //Space between logo and login bars
  },
  input: {
    height: 40,
    borderColor: 'white',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    width: '100%',
    marginBottom: 20,
    // No background color  
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
  googleSignInButton: {
    marginTop: 10, // Space between "Create Account" and the Google Sign-In button
  },
  googleSignInImage: {
    width: 160,  // Adjust width of Google Sign-In button
    height: 50,  // Adjust height of Google Sign-In button
    resizeMode: 'contain', // Keeps the aspect ratio of the image
  },
});