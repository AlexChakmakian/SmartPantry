import React, { useState } from "react";
import { Text, View, StyleSheet, TextInput, Image, Alert, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import AuthButton from "../components/authButton";
import GoogleSignInButton from "../components/googleSignInButton";
import CreateAccountButton from "../components/createAccountButton";
import { loginWithEmailAndPassword } from "../firebase/authService";

export default function Index() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    try {
      if (username && password) {
        await loginWithEmailAndPassword(username, password);
        router.push("/home");
      } else {
        Alert.alert("Please enter both username and password");
      }
    } catch (error) {
      Alert.alert("Login failed, incorrect username or password");
    }
  };

  const handleForgotPassword = () => {
    router.push("/forgot-password"); // Navigate to Forgot Password screen
  };

  const handleCreateAccount = () => {
    router.push("/register");
  };

  return (
    <View style={styles.container}>
      <Image source={require("../assets/Logo.png")} style={styles.logo} />
      <TextInput
        style={styles.input}
        placeholder="Email"
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
      <TouchableOpacity onPress={handleForgotPassword}>
        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
      </TouchableOpacity>
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
    marginBottom: 60,
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
  forgotPasswordText: {
    color: "white",
    marginTop: -15,
    marginBottom: 20,
    fontSize: 12,

  },
});