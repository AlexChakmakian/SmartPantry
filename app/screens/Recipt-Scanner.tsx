import React, { useState, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image, TextInput, ScrollView, Animated } from "react-native";
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';
import { useRouter } from "expo-router";
import { getAuth, signOut } from "firebase/auth";
import { Ionicons } from '@expo/vector-icons'; // Import Ionicons for the chevron icon

const { width } = Dimensions.get('window');

const GOOGLE_API_KEY = "ask cody"; // Replace with your actual API key

export default function ReciptScanner() {
  const [image, setImage] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState<string | null>(null);
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isMyFoodOpen, setIsMyFoodOpen] = useState(false); // State for My Food dropdown
  const slideAnim = useRef(new Animated.Value(-width)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const auth = getAuth();

  const toggleMenu = () => {
    setMenuOpen(!isMenuOpen);
    Animated.timing(slideAnim, {
      toValue: isMenuOpen ? -width : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const toggleMyFood = () => {
    setIsMyFoodOpen(!isMyFoodOpen);
    Animated.timing(rotateAnim, {
      toValue: isMyFoodOpen ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg']
  });

  const handleMenuSelect = async (page) => {
    setMenuOpen(false);
    Animated.timing(slideAnim, {
      toValue: -width,
      duration: 300,
      useNativeDriver: true,
    }).start();

    if (page === "Log out") {
      try {
        await signOut(auth);
        console.log("User signed out");
        router.push("/"); // Redirect to the login screen
      } catch (error) {
        console.error("Error signing out:", error);
      }
    } else {
      const paths = {
        Home: "/home",
        AIRecipes: "/screens/AIRecipes",
        Pantry: "/screens/Pantry",
        Fridge: "/screens/Fridge",
        Freezer: "/screens/Freezer",
        Spices: "/screens/Spices",
        Appliances: "/screens/Appliances",
        History: "/screens/History",
        Bookmarked: "/screens/Bookmarked",
        ReciptScanner: "/screens/Recipt-Scanner",
        Settings: "/screens/Settings",
      };
      router.push({
        pathname: paths[page] || "/",
      });
    }
  };

  // Function to handle image selection and OCR processing
  const pickImageAndProcess = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      alert("You've refused to allow this app to access your media library!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false, // Set editing to false to avoid deprecation warnings
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {  // Use 'cancelled' instead of 'canceled'
      const imageUri = result.assets[0].uri;
      setImage(imageUri);

      // Move the image to a local file path
      const fileName = imageUri.split('/').pop();
      const newPath = `${FileSystem.documentDirectory}assets/images/${fileName}`;

      try {
        await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}assets/images`, { intermediates: true });
        await FileSystem.moveAsync({
          from: imageUri,
          to: newPath,
        });
        // Call performOCR with the new image path
        await performOCR(newPath);
      } catch (error) {
        console.error("Error saving image:", error);
      }
    }
  };

  // Function to perform OCR using Google Vision API
  const performOCR = async (imageUri: string) => {
    const base64Image = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    try {
      const response = await axios.post(
        `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_API_KEY}`,
        {
          requests: [
            {
              image: {
                content: base64Image,
              },
              features: [
                {
                  type: "TEXT_DETECTION",
                },
              ],
            },
          ],
        }
      );

      const ocrText = response.data.responses[0].fullTextAnnotation?.text || "No text found";
      setOcrText(ocrText);
    } catch (error) {
      console.error("Error performing OCR:", error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Add overlay to close menu when clicking anywhere on the screen */}
      {isMenuOpen && (
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={toggleMenu}
        />
      )}
      
      {/* Hamburger menu button that always stays on top */}
      <TouchableOpacity style={styles.hamburger} onPress={toggleMenu}>
        <View style={styles.line} />
        <View style={styles.line} />
        <View style={styles.line} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Receipt Scanner</Text>
        <TouchableOpacity style={styles.button} onPress={pickImageAndProcess}>
          <Text style={styles.buttonText}>Scan Receipt!</Text>
        </TouchableOpacity>
        {image && <Image source={{ uri: image }} style={styles.image} />}
        {ocrText && (
          <TextInput
            style={styles.ocrText}
            multiline
            editable={false}
            value={ocrText}
          />
        )}
      </ScrollView>

      <Animated.View
        style={[
          styles.menuContainer,
          { transform: [{ translateX: slideAnim }] },
        ]}
      >
        <TouchableOpacity
          style={styles.firstMenuItem}
          onPress={() => handleMenuSelect("Home")}
        >
          <Text style={styles.menuText}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => handleMenuSelect("AIRecipes")}>
          <Text style={styles.menuText}>AI Recipes</Text>
        </TouchableOpacity>
        
        {/* My Food dropdown section */}
        <View style={styles.menuItemWithSubmenu}>
          <TouchableOpacity style={styles.menuItemMain} onPress={toggleMyFood}>
            <Text style={styles.menuText}>My Food</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleMyFood} style={styles.triangleButton}>
            <Animated.View style={{ transform: [{ rotate }] }}>
              <Ionicons name="chevron-forward" size={20} color="#fff" />
            </Animated.View>
          </TouchableOpacity>
        </View>
        
        {/* Submenu items */}
        {isMyFoodOpen && (
          <>
            <TouchableOpacity onPress={() => handleMenuSelect("Pantry")}>
              <Text style={[styles.menuText, styles.submenuItem]}>Pantry</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleMenuSelect("Fridge")}>
              <Text style={[styles.menuText, styles.submenuItem]}>Fridge</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleMenuSelect("Freezer")}>
              <Text style={[styles.menuText, styles.submenuItem]}>Freezer</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleMenuSelect("Spices")}>
              <Text style={[styles.menuText, styles.submenuItem]}>Spices</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleMenuSelect("Appliances")}>
              <Text style={[styles.menuText, styles.submenuItem]}>Appliances</Text>
            </TouchableOpacity>
          </>
        )}
        
        {/* Regular menu items */}
        <TouchableOpacity onPress={() => handleMenuSelect("History")}>
          <Text style={styles.menuText}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleMenuSelect("Bookmarked")}>
          <Text style={styles.menuText}>Bookmarked</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleMenuSelect("ReciptScanner")}>
          <Text style={styles.menuText}>Receipt Scanner</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleMenuSelect("Settings")}>
          <Text style={styles.menuText}>Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleMenuSelect("Log out")}>
          <Text style={[styles.menuText, styles.logoutText]}>Log out</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ADD8E6',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    padding: 20,
    paddingTop: 250, // Reduced padding to move content higher up
  },
  menuOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
    zIndex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
  },
  button: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#000',
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
  },
  image: {
    marginTop: 20,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: 10,
  },
  ocrText: {
    marginTop: 20,
    width: width * 0.8,
    height: 200,
    borderColor: '#000',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    backgroundColor: '#fff',
  },
  hamburger: {
    position: "absolute",
    top: 40,
    left: 20,
    zIndex: 3,
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
    width: width * 0.4,
    backgroundColor: "#4C5D6B",
    padding: 20,
    paddingTop: 40,
    zIndex: 2,
  },
  firstMenuItem: {
    paddingTop: 40,
  },
  menuText: {
    fontSize: 18,
    color: "#fff",
    marginVertical: 10,
  },
  logoutText: {
    fontSize: 18,
    color: 'red',
    marginVertical: 10,
  },
  // Menu dropdown styles
  menuItemWithSubmenu: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginRight: 10,
  },
  menuItemMain: {
    flex: 1,
  },
  triangleButton: {
    padding: 5,
  },
  submenuItem: {
    paddingLeft: 20,
    fontSize: 16,
  },
  rightPadding: {
    paddingLeft: 20,
  },
  dropdownContainer: {
    paddingLeft: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 5,
    marginVertical: 5,
  },
  dropdownText: {
    fontSize: 16,
    paddingLeft: 5,
  },
});