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
  Keyboard,
  TouchableWithoutFeedback,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getAuth } from "firebase/auth";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { useRouter } from "expo-router";
import NotificationBell from "../components/NotificationBell";
import AnimatedSideMenu from "@/components/SideMenu";
import { useTheme } from "@/context/ThemeContext";
import { lightTheme, darkTheme } from "@/styles/theme";

const { width } = Dimensions.get("window");

export default function SettingsScreen() {
  const [expiryThreshold, setExpiryThreshold] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [bellKey, setBellKey] = useState(0);

  const { isDarkMode, toggleTheme } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

  useEffect(() => {
    const fetchThreshold = async () => {
      const user = getAuth().currentUser;
      if (user) {
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);
        const threshold = userDoc.data()?.expiryThreshold || 30;
        setExpiryThreshold(threshold.toString());
      }
    };
    fetchThreshold();
  }, []);

  useEffect(() => {
    console.log("Current theme:", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  const toggleMenu = () => setMenuOpen((open) => !open);

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
        setBellKey((k) => k + 1);
      } catch (error) {
        console.error("Error saving threshold:", error);
        Alert.alert("Error", "Failed to save expiry threshold.");
      }
    }
    setIsLoading(false);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {isMenuOpen && (
          <TouchableOpacity
            style={styles.menuOverlay}
            activeOpacity={1}
            onPress={toggleMenu}
          />
        )}

        <TouchableOpacity style={styles.hamburger} onPress={toggleMenu}>
          <View style={styles.line} />
          <View style={styles.line} />
          <View style={styles.line} />
        </TouchableOpacity>

        <NotificationBell key={bellKey} />

        <AnimatedSideMenu
          isMenuOpen={isMenuOpen}
          onClose={() => setMenuOpen(false)}
        />

        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.header, { color: theme.text }]}>Settings</Text>

          {/* Dark Mode Toggle */}
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Ionicons
                name={isDarkMode ? "moon" : "sunny"}
                size={24}
                color={theme.text}
              />
              <Text style={[styles.settingText, { color: theme.text }]}>
                {isDarkMode ? "Dark Mode" : "Light Mode"}
              </Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={(value) => {
                console.log("Switch toggled to:", value);
                toggleTheme();
              }}
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={isDarkMode ? "#f5dd4b" : "#f4f3f4"}
            />
          </View>

          <Text style={[styles.subHeader, { color: theme.textSecondary }]}>
            Notify me when items are older than:
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: theme.border,
                  color: theme.text,
                  backgroundColor: theme.surface,
                },
              ]}
              keyboardType="numeric"
              value={expiryThreshold}
              onChangeText={setExpiryThreshold}
              placeholder="Number of days"
              placeholderTextColor={theme.textSecondary}
            />
            <Text style={[styles.unitText, { color: theme.text }]}>days</Text>
          </View>

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
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  menuOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
    zIndex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#C1E0EC",
    padding: 20,
  },
  hamburger: {
    position: "absolute",
    top: 40,
    left: 20,
    zIndex: 5,
  },
  line: {
    width: 30,
    height: 4,
    backgroundColor: "#fff",
    marginVertical: 4,
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
    alignItems: "center",
    justifyContent: "center",
    marginTop: -85,
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  subHeader: {
    fontSize: 18,
    color: "#555",
    marginBottom: 15,
    textAlign: "center",
  },
  inputContainer: {
    width: "100%",
    position: "relative",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 10,
    paddingLeft: 15,
    paddingRight: 60,
    fontSize: 16,
  },
  unitText: {
    position: "absolute",
    right: 15,
    top: 14,
    color: "#000",
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: "#007BFF",
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
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    width: "100%",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    marginBottom: 20,
  },
  settingContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingText: {
    fontSize: 16,
    marginLeft: 10,
  },
});
