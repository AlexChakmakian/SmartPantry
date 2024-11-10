import React, { useState } from "react";
import { Text, View, StyleSheet, TextInput, Alert, Image } from "react-native";
import { useRouter } from "expo-router";
import AuthButton from "../components/authButton";
import { registerWithEmailAndPassword } from "../firebase/authService"; // Firebase create account logic

export default function CreateAccount() {
  const [email, setEmail] = useState(""); // Email input
  const [password, setPassword] = useState(""); // Password input
  const [confirmPassword, setConfirmPassword] = useState(""); // Confirm password
  const router = useRouter(); // Use router for navigation

  const handleCreateAccount = async () => {
    try {
      if (!email || !password || !confirmPassword) {
        Alert.alert("All fields are required");
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert("Passwords do not match");
        return;
      }

      await registerWithEmailAndPassword(email, password); // Create a new user with Firebase
      Alert.alert("Account created successfully!");
      router.push("/home"); // Navigate to the home screen after successful registration
    } catch (error) {
      Alert.alert("Error", error.message); // Show error message if there's an issue
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/Logo.png')} // Adjust the path to your logo image
        style={styles.logo}
        resizeMode="contain" // This ensures the logo maintains its aspect ratio
      />
      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#777"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#777"
          value={password}
          onChangeText={setPassword}
          autoCapitalize="none"
          secureTextEntry
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor="#777"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          autoCapitalize="none"
          secureTextEntry
        />
        <AuthButton onPress={handleCreateAccount} title="               Create Account" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ADD8E6",
    alignItems: "center",
    justifyContent: "flex-start", // Changed to flex-start to move items up
    padding: 35,
  },
  logo: {
    width: 125, // Adjust width as needed
    height: 125, // Adjust height as needed
    marginBottom: 20, // Spacing between logo and text fields
  },
  formContainer: {
    width: "100%", // Ensure full width for input fields
    paddingTop: 20, // Additional padding above the form
  },
  input: {
    height: 40,
    borderColor: "white",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    width: "100%",
    marginBottom: 20,
  },
}); 