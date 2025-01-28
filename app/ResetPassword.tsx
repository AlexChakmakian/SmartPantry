import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { getAuth, sendPasswordResetEmail } from "firebase/auth";

const ResetPassword = () => {
  const [email, setEmail] = useState('');

  const handleForgotPassword = () => {
    if (email) {
      const auth = getAuth();
      sendPasswordResetEmail(auth, email)
        .then(() => {
          Alert.alert('Password Reset', 'Password reset email sent successfully.');
        })
        .catch((error) => {
          const errorMessage = error.message;
          Alert.alert('Error', errorMessage);
        });
    } else {
      Alert.alert('Error', 'Please enter your email address.');
    }
  };

  return (
    <View style={styles.container}>
      <Image source={require("../assets/Logo.png")} style={styles.logo} />
      <Text style={styles.title}>Reset Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your email"
        placeholderTextColor="#FFF" // Set placeholder text color to white
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TouchableOpacity style={styles.button} onPress={handleForgotPassword}>
        <Text style={styles.buttonText}>Reset Password</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ADD8E6',
  },
  logo: {
    width: 125,
    height: 125,
    marginTop: 40, // Adjust this value to move the logo higher
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderColor: '#FFF', // Set border color to white
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    width: '100%',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007BFF', // Set button background color
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: 'center', // Center the text inside the button
  },
  buttonText: {
    color: '#FFF', // Set button text color to white
    fontSize: 18,
  },
});

export default ResetPassword;