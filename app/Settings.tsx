import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
} from "react-native";
import { getAuth, signOut } from "firebase/auth";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { Ionicons } from "@expo/vector-icons"; // Import Ionicons for the notification icon
import { useRouter } from "expo-router"; // Import useRouter for navigation
import NotificationBell from "../components/NotificationBell"; // Adjust the import path as needed

const { width } = Dimensions.get("window");

export default function SettingsScreen() {
  const [expiryThreshold, setExpiryThreshold] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMenuOpen, setMenuOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-width)).current;
  const router = useRouter(); // Initialize router

  useEffect(() => {
    // Fetch the current expiry threshold from Firebase if available
    const fetchThreshold = async () => {
      const user = getAuth().currentUser;
      if (user) {
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);
        const threshold = userDoc.data()?.expiryThreshold || 30; // Default to 30 days
        setExpiryThreshold(threshold.toString()); // Set the state with the fetched value
      }
    };
    fetchThreshold();
  }, []);

  const toggleMenu = () => {
    setMenuOpen(!isMenuOpen);
    Animated.timing(slideAnim, {
      toValue: isMenuOpen ? -width : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleMenuSelect = async (page) => {
    setMenuOpen(false);
    Animated.timing(slideAnim, {
      toValue: -width,
      duration: 300,
      useNativeDriver: true,
    }).start();

    if (page === "Log out") {
      try {
        await signOut(getAuth());
        console.log("User signed out");
        router.push("/"); // Redirect to the login screen
      } catch (error) {
        console.error("Error signing out:", error);
      }
    } else {
      const paths = {
        Recipes: "/home",
        Appliances: "/screens/Appliances",
        AIRecipes: "/screens/AIRecipes",
        Freezer: "/screens/Freezer",
        Fridge: "/screens/Fridge",
        Pantry: "/screens/Pantry",
        Spices: "/screens/Spices",
      };
      router.push({
        pathname: paths[page] || "/",
      });
    }
  };

  const handleSaveThreshold = async () => {
    const thresholdNumber = Number(expiryThreshold);
    if (!expiryThreshold || isNaN(thresholdNumber) || thresholdNumber <= 0) {
      Alert.alert("Error", "Please enter a valid number of days.");
      return;
    }

    setIsLoading(true);
    const user = getAuth().currentUser;
    if (user) {
      try {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, { expiryThreshold: thresholdNumber });
        Alert.alert("Success", "Expiry threshold updated.");
      } catch (error) {
        console.error("Error saving threshold:", error);
        Alert.alert("Error", "Failed to save expiry threshold.");
      }
    }
    setIsLoading(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.hamburger} onPress={toggleMenu}>
        <View style={styles.line} />
        <View style={styles.line} />
        <View style={styles.line} />
      </TouchableOpacity>

      <NotificationBell />

      <Animated.View
        style={[
          styles.menuContainer,
          { transform: [{ translateX: slideAnim }] },
        ]}
      >
        <TouchableOpacity
          style={styles.firstMenuItem}
          onPress={() => handleMenuSelect("Recipes")}
        >
          <Text style={styles.menuText}>Recipes</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleMenuSelect("AIRecipes")}>
          <Text style={styles.menuText}>AI Recipes</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleMenuSelect("Pantry")}>
          <Text style={styles.menuText}>Pantry</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleMenuSelect("Fridge")}>
          <Text style={styles.menuText}>Fridge</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleMenuSelect("Freezer")}>
          <Text style={styles.menuText}>Freezer</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleMenuSelect("Spices")}>
          <Text style={styles.menuText}>Spices</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleMenuSelect("Appliances")}>
          <Text style={styles.menuText}>Appliances</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleMenuSelect("Log out")}>
          <Text style={styles.menuText}>Log out</Text>
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.card}>
        <Text style={styles.header}>Set Expiry Threshold</Text>
        <Text style={styles.subHeader}>
          Notify me when items are older than:
        </Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={expiryThreshold}
          onChangeText={setExpiryThreshold}
          placeholder="Number of days"
        />
        {isLoading ? (
          <ActivityIndicator size="large" color="#007BFF" />
        ) : (
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveThreshold}
            disabled={isLoading}
          >
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ADD8E6", // Soft blue background
    padding: 20,
  },
  hamburger: {
    position: "absolute",
    top: 40,
    left: 20,
    zIndex: 2, // Ensure the hamburger icon is above other elements
  },
  notificationIcon: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 2, // Ensure the notification icon is above other elements
  },
  line: {
    width: 30,
    height: 4,
    backgroundColor: "#fff",
    marginVertical: 4,
  },
  menuContainer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: width * 0.75,
    backgroundColor: "#4C5D6B", // Match the color scheme from HomeScreen
    padding: 20,
    zIndex: 3, // Ensure the menu is above other elements
    elevation: 5,
  },
  firstMenuItem: {
    paddingTop: 40,
  },
  menuText: {
    fontSize: 18,
    color: "#fff", // Match the text color from HomeScreen
    marginVertical: 10,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 15,
    width: "90%",
    padding: 25,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
    alignItems: "center", // Center content horizontally
    justifyContent: "center", // Center content vertically
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center", // Center text
  },
  subHeader: {
    fontSize: 18,
    color: "#555",
    marginBottom: 15,
    textAlign: "center", // Center text
  },
  input: {
    width: "100%",
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 10,
    paddingLeft: 15,
    fontSize: 16,
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: "#007BFF", // Blue color for the button
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    width: "100%",
  },
  saveButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});
