import React, { useState } from "react";
import { Text, View, StyleSheet, TextInput, Alert } from "react-native";
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
      <AuthButton onPress={handleCreateAccount} title="Create Account" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ADD8E6",
    alignItems: "center",
    justifyContent: "center",
    padding: 35,
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
