import React, { useState, useRef } from "react";
import {
  Text,
  View,
  StyleSheet,
  TextInput,
  Alert,
  TouchableOpacity,
  Animated,
  ImageBackground,
} from "react-native";
import { useRouter } from "expo-router";
import AuthButton from "../components/authButton";
import GoogleSignInButton from "../components/googleSignInButton";
import CreateAccountButton from "../components/createAccountButton";
import { loginWithEmailAndPassword } from "../firebase/authService";

export default function Index() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const scaleValue = useRef(new Animated.Value(1)).current; // For the jump animation
  const translateYValue = useRef(new Animated.Value(0)).current; // For the fall animation
  const tapCount = useRef(0); // To count the number of taps
  const lastTapTime = useRef(0); // To track the time between taps

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
    router.push("/ResetPassword"); // Navigate to Forgot Password screen
  };

  const handleCreateAccount = () => {
    router.push("/register");
  };

  const handleLogoPress = () => {
    // Jump animation
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Easter egg logic: Detect 5 fast taps
    const now = Date.now();
    if (now - lastTapTime.current < 300) {
      // If the time between taps is less than 300ms
      tapCount.current += 1;
    } else {
      tapCount.current = 1; // Reset tap count if too slow
    }
    lastTapTime.current = now;

    if (tapCount.current === 5) {
      tapCount.current = 0; // Reset tap count
      triggerFallAnimation();
    }
  };

  const triggerFallAnimation = () => {
    // Fall animation
    Animated.sequence([
      Animated.timing(translateYValue, {
        toValue: 1000, // Move the logo down by 1000 units
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(translateYValue, {
        toValue: -1000, // Move the logo above the screen instantly
        duration: 0,
        useNativeDriver: true,
      }),
      Animated.timing(translateYValue, {
        toValue: 0, // Bring the logo back to its original position from the top
        duration: 250,
        delay: 600, // Add 0.xxx second delay before returning
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require("../assets/images/foodBackground.png")}
        style={styles.background}
      >
        <View style={styles.overlay} />
        <View style={styles.innerContainer}>
          <TouchableOpacity onPress={handleLogoPress}>
            <Animated.Image
              source={require("../assets/Logo.png")}
              style={[
                styles.logo,
                {
                  transform: [
                    { scale: scaleValue }, // Jump animation
                    { translateY: translateYValue }, // Fall animation
                  ],
                },
              ]}
            />
          </TouchableOpacity>
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
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ADD8E6", // Background color
  },
  background: {
    flex: 1,
    resizeMode: "cover",
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#ADD8E6",
    opacity: 0.5, // Adjust the opacity as needed
  },
  innerContainer: {
    flex: 1,
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
    borderWidth: 1.5,
    borderRadius: 5,
    paddingHorizontal: 10,
    width: 300, // Set a fixed width for the input fields
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: "white",
    marginTop: -15,
    marginBottom: 20,
    fontSize: 12,
  },
});