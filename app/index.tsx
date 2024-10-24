import React, { useState } from "react";
import { Text, View, StyleSheet, TextInput, Image, Alert } from "react-native";
import { useRouter } from "expo-router";
import AuthButton from "../components/authButton";
import GoogleSignInButton from "../components/googleSignInButton";
import CreateAccountButton from "../components/createAccountButton";
import { loginWithEmailAndPassword } from "../firebase/authService"; // Import Firebase auth logic

export default function Index() {
  const [username, setUsername] = useState(""); // For username
  const [password, setPassword] = useState(""); // For password
  const router = useRouter(); // Use router from expo-router

  const handleLogin = async () => {
    try {
      if (username && password) {
        await loginWithEmailAndPassword(username, password); // Login with email/password
        router.push("/home"); // Navigate to Home screen
      } else {
        Alert.alert("Please enter both username and password");
      }
    } catch (error) {
      Alert.alert("Login failed", error.message);
    }
  };

  const handleCreateAccount = () => {
    router.push("/register"); // Navigate to Create Account screen
  };

  return (
    <View style={styles.container}>
      <Image
        source={require("C:/Users/chine/Documents/repos/SmartPantry/assets/Logo.png")}
        style={styles.logo}
      />
      <TextInput
        style={styles.input}
        placeholder="Username"
        placeholderTextColor="#777"
        value={username}
        onChangeText={setUsername}
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
      <AuthButton onPress={handleLogin} title="Login" />
      <CreateAccountButton onPress={handleCreateAccount} />
      <GoogleSignInButton onPress={() => Alert.alert("Google Sign-In")} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ADD8E6",
    alignItems: "center",
    justifyContent: "flex-start",
    padding: 35,
  },
  logo: {
    width: 125,
    height: 125,
    marginBottom: 70,
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
