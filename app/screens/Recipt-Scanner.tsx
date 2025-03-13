import React, { useState, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView, Animated, Alert, TextInput, Modal, Image } from "react-native";
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';
import { useRouter } from "expo-router";
import { getAuth, signOut } from "firebase/auth";
import Icon from 'react-native-vector-icons/Ionicons';
import { Ionicons } from '@expo/vector-icons'; // Import Ionicons for the chevron icon

const { width, height } = Dimensions.get('window');

const GOOGLE_API_KEY = "AIzaSyAXsWcZNxwtjW6DbI25VXJ7rb2mv-vipIg";

export default function ReciptScanner() {
  const [items, setItems] = useState<{ name: string, quantity: string }[]>([]);
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isMyFoodOpen, setIsMyFoodOpen] = useState(false); // State for My Food dropdown
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedItem, setEditedItem] = useState<{ name: string, quantity: string }>({ name: "", quantity: "" });
  const [modalVisible, setModalVisible] = useState(false);
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
        router.push("/"); 
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

  const pickImageAndProcess = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
      alert("You've refused to allow this app to access your camera!");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const imageUri = result.assets[0].uri;

      const fileName = imageUri.split('/').pop();
      const newPath = `${FileSystem.documentDirectory}assets/images/${fileName}`;

      try {
        await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}assets/images`, { intermediates: true });
        await FileSystem.moveAsync({
          from: imageUri,
          to: newPath,
        });
        await performOCR(newPath);
      } catch (error) {
        console.error("Error saving image:", error);
      }
    }
  };

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
      parseItems(ocrText);
    } catch (error) {
      console.error("Error performing OCR:", error);
    }
  };

  const parseItems = (text: string) => {
    const lines = text.split("\n");
    const parsedItems = lines.map(line => {
      if (line.trim() === "") {
        return { name: "Placeholder", quantity: "0" };
      }
      const parts = line.split(" ");
      const name = parts.slice(0, -1).join(" ");
      const quantity = parts[parts.length - 1];
      return { name, quantity };
    });
    setItems(parsedItems);
  };

  const editItem = (index: number) => {
    setEditingIndex(index);
    setEditedItem(items[index]);
    setModalVisible(true);
  };

  const saveEdit = () => {
    if (editingIndex !== null) {
      const updatedItems = [...items];
      updatedItems[editingIndex] = editedItem;
      setItems(updatedItems);
      setEditingIndex(null);
      setEditedItem({ name: "", quantity: "" });
      setModalVisible(false);
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

      <TouchableOpacity style={styles.hamburger} onPress={toggleMenu}>
        <View style={styles.line} />
        <View style={styles.line} />
        <View style={styles.line} />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Receipt Scanner</Text>
        <TouchableOpacity style={styles.button} onPress={pickImageAndProcess}>
          <Text style={styles.buttonText}>Scan Receipt!</Text>
        </TouchableOpacity>
        <ScrollView style={styles.itemsContainer}>
          {items.map((item, index) => (
            <View key={index} style={styles.itemContainer}>
              <View style={styles.itemRow}>
                <Text style={styles.itemLabel}>Item: </Text>
                <Text style={styles.itemName}>{item.name}</Text>
              </View>
              <View style={styles.itemRow}>
                <Text style={styles.itemLabel}>Qty: </Text>
                <Text style={styles.itemQuantity}>{item.quantity}</Text>
              </View>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => editItem(index)}
              >
                <Icon name="pencil" size={18} color="#007BFF" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalView}>
              <Text style={styles.modalText}>
                {editingIndex !== null ? "Edit Item" : "Add New Item"}
              </Text>
              <TextInput
                style={[styles.input, styles.blackText]}
                placeholder="Enter item name"
                placeholderTextColor="#000000"
                value={editedItem.name}
                onChangeText={(text) => setEditedItem({ ...editedItem, name: text })}
              />
              <TextInput
                style={[styles.input, styles.blackText]}
                placeholder="Enter quantity"
                placeholderTextColor="#000000"
                value={editedItem.quantity}
                onChangeText={(text) => setEditedItem({ ...editedItem, quantity: text })}
              />

              <TouchableOpacity
                style={styles.modalAddButton}
                onPress={saveEdit}
              >
                <Text style={styles.modalAddButtonText}>
                  {editingIndex !== null ? "Update" : "Add"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>

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
    padding: 20,
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
  content: {
    flex: 1,
    alignItems: 'center',
    marginTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
  },
  button: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#000',
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
  },
  itemsContainer: {
    flex: 1,
    marginTop: 20,
    width: width * 0.8,
    backgroundColor: '#ADD8E6',
    borderRadius: 10,
    padding: 10,
  },
  itemContainer: {
    padding: 20,
    marginVertical: 8,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
    borderLeftWidth: 5,
    borderLeftColor: "#007BFF", // Accent line for style
    position: 'relative',
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4, // Adds some spacing between each row for better readability
  },
  itemLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#555",
  },
  itemName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
  itemQuantity: {
    fontSize: 18,
    fontWeight: "500",
    color: "#007BFF",
  },
  editButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 50,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  editContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  input: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
  },
  hamburger: {
    position: "absolute",
    top: 40,
    left: 20,
    zIndex: 3, // Increased to be above everything, including the menu
  },
  line: {
    width: 30,
    height: 4,
    backgroundColor: "#fff",
    marginVertical: 4,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    width: 300,
    padding: 20,
    backgroundColor: "white",
    borderRadius: 10,
    alignItems: "center",
  },
  modalText: {
    fontSize: 20,
    marginBottom: 15,
  },
  blackText: {
    color: "#000000", // Make the font black
  },
  modalAddButton: {
    backgroundColor: "#007BFF",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  modalAddButtonText: {
    color: "#ffffff",
  },
  modalCancelButton: {
    padding: 10,
  },
  modalCancelButtonText: {
    color: "#007BFF",
  },
  // Menu styles
  menuContainer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: width * 0.4,
    backgroundColor: "#4C5D6B",
    padding: 20,
    paddingTop: 40,
    zIndex: 2, // Above the overlay but below the hamburger button
  },
  firstMenuItem: {
    paddingTop: 40,
  },
  menuText: {
    fontSize: 18,
    color: "#fff",
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
  logoutText: {
    fontSize: 18,
    color: 'red',
    marginVertical: 10,
  },
});