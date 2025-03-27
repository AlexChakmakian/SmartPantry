import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Animated,
  TextInput,
  Modal,
  Image,
  Alert,
  GestureResponderEvent,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import axios from "axios";
import { useRouter } from "expo-router";
import { getAuth, signOut } from "firebase/auth";
import Icon from "react-native-vector-icons/Ionicons";
import SideMenu from "../../components/SideMenu"; // Import the SideMenu component
import { addItem } from "@/firebase/pantryService"; // Import your database utility function

const { width, height } = Dimensions.get("window");
const auth = getAuth(); // Define auth at the module level for use

const GOOGLE_API_KEY = "AIzaSyCYRdOSDaXUIt8SQyO9KHru4ofsB4XwA8g";

export default function ReceiptScanner() {
  const [items, setItems] = useState<{ name: string; quantity: string }[]>([]);
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedItem, setEditedItem] = useState<{
    name: string;
    quantity: string;
    price?: string;
    category?: string;
  }>({ name: "", quantity: "", category: "Other" });
  const [modalVisible, setModalVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-width)).current;
  const router = useRouter();
  const [showAddToPantryOptions, setShowAddToPantryOptions] = useState(false);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  // Toggle menu function - controls both state and animation
  const toggleMenu = () => {
    setMenuOpen(!isMenuOpen);
    Animated.timing(slideAnim, {
      toValue: isMenuOpen ? -width : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  // Handle menu selection
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
        ReceiptScanner: "/screens/ReceiptScanner",
        Settings: "/screens/Settings",
      };
      router.push({
        pathname: paths[page] || "/home",
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

      const fileName = imageUri.split("/").pop();
      const newPath = `${FileSystem.documentDirectory}assets/images/${fileName}`;

      try {
        await FileSystem.makeDirectoryAsync(
          `${FileSystem.documentDirectory}assets/images`,
          { intermediates: true }
        );
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

      const ocrText =
        response.data.responses[0].fullTextAnnotation?.text || "No text found";
      parseItems(ocrText);
    } catch (error) {
      console.error("Error performing OCR:", error);
    }
  };

  // Enhanced parsing function for receipt OCR
  const parseItems = (text: string) => {
    // Split the text into lines
    const lines = text.split("\n").filter((line) => line.trim() !== "");

    // Common patterns to ignore (headers, footers, totals, etc.)
    const ignorePatterns = [
      /total/i,
      /subtotal/i,
      /tax/i,
      /change/i,
      /cash/i,
      /credit card/i,
      /store/i,
      /receipt/i,
      /thank you/i,
      /welcome/i,
      /date/i,
      /time/i,
      /^\d+\/\d+\/\d+$/, // Date format
      /^\d+:\d+$/, // Time format
      /^\$?\d+\.\d{2}$/, // Just a price like $10.99
    ];

    // Regular expressions for price and quantity detection
    const priceRegex = /\$?(\d+\.\d{2})/;
    const quantityRegex = /(\d+)\s*(x|oz|lb|lbs|g|kg|ml|l|pkg|pack|each)/i;

    // Process each line to extract product information
    const parsedItems = [];

    lines.forEach((line) => {
      // Skip lines that match ignore patterns
      if (ignorePatterns.some((pattern) => pattern.test(line))) {
        return;
      }

      // Extract and remove price
      let price = "";
      const priceMatch = line.match(priceRegex);
      if (priceMatch) {
        price = priceMatch[0];
        line = line.replace(priceRegex, "").trim();
      }

      // Extract quantity
      let quantity = "";
      const quantityMatch = line.match(quantityRegex);
      if (quantityMatch) {
        quantity = quantityMatch[0];
        line = line.replace(quantityRegex, "").trim();
      } else {
        // If no explicit quantity format, look for numbers at the beginning
        const numericStart = line.match(/^(\d+(\.\d+)?)/);
        if (numericStart) {
          quantity = numericStart[0];
          line = line.replace(/^(\d+(\.\d+)?)/, "").trim();
        } else {
          // Default quantity if none detected
          quantity = "1";
        }
      }

      // Clean up the item name - remove common receipt abbreviations
      const name = line
        .replace(/\s{2,}/g, " ") // Replace multiple spaces with one
        .replace(/[^a-zA-Z0-9\s]/g, "") // Remove special characters
        .trim();

      // Only add items with valid names
      if (name && name.length > 1) {
        parsedItems.push({
          name,
          quantity,
          price,
          category: guessFoodCategory(name), // Try to guess the food category
        });
      }
    });

    setItems(parsedItems);
  };

  // Simple function to guess food category based on keywords
  const guessFoodCategory = (itemName) => {
    const lowerName = itemName.toLowerCase();

    const categories = {
      Pantry: [
        "pasta",
        "rice",
        "cereal",
        "flour",
        "sugar",
        "oil",
        "vinegar",
        "sauce",
        "can",
        "soup",
        "beans",
        "chips",
        "snack",
        "cookie",
        "crackers",
        "nuts",
        "dried",
      ],
      Fridge: [
        "milk",
        "yogurt",
        "cheese",
        "butter",
        "cream",
        "juice",
        "eggs",
        "bacon",
        "sausage",
        "deli",
        "tofu",
        "salad",
        "dressing",
      ],
      Freezer: [
        "frozen",
        "ice cream",
        "pizza",
        "dessert",
        "fish fillet",
        "shrimp",
        "seafood",
      ],
      Spices: [
        "spice",
        "pepper",
        "salt",
        "herb",
        "cinnamon",
        "oregano",
        "basil",
        "thyme",
        "curry",
        "cumin",
      ],
      // Produce: [
      //   "apple",
      //   "banana",
      //   "orange",
      //   "fruit",
      //   "vegetable",
      //   "tomato",
      //   "potato",
      //   "onion",
      //   "lettuce",
      //   "carrot",
      //   "broccoli",
      //   "cucumber",
      //   "pepper",
      //   "garlic",
      //   "ginger",
      // ],
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some((keyword) => lowerName.includes(keyword))) {
        return category;
      }
    }

    return "Other";
  };

  // Add function to add selected items to pantry
  const addSelectedItemsToPantry = async (storageLocation) => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Error", "User not authenticated");
      return;
    }

    try {
      for (const index of selectedItems) {
        const item = items[index];

        // Create an item object for the database
        const newItem = {
          name: item.name,
          quantity: item.quantity,
          dateAdded: new Date().toISOString(),
        };

        // Add to the selected storage location
        await addItem(storageLocation, user.uid, newItem);
      }

      Alert.alert(
        "Success",
        `Added ${selectedItems.length} items to ${storageLocation}`
      );
      setSelectedItems([]);
      setShowAddToPantryOptions(false);
    } catch (error) {
      console.error(`Error adding items to ${storageLocation}:`, error);
      Alert.alert("Error", "Failed to add items to storage");
    }
  };

  // Function to toggle item selection
  const toggleItemSelection = (index) => {
    setSelectedItems((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const editItem = (index: number, event?: GestureResponderEvent) => {
    if (event) {
      event.stopPropagation(); // Prevent the item selection toggle
    }

    setEditingIndex(index);
    setEditedItem({ ...items[index] }); // Copy all properties
    setModalVisible(true);
  };

  const saveEdit = () => {
    if (editingIndex !== null) {
      const updatedItems = [...items];
      updatedItems[editingIndex] = editedItem;
      setItems(updatedItems);
      setEditingIndex(null);
      setEditedItem({ name: "", quantity: "", price: "", category: "Other" });
      setModalVisible(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Hamburger menu button */}
      <TouchableOpacity style={styles.hamburger} onPress={toggleMenu}>
        <View style={styles.line} />
        <View style={styles.line} />
        <View style={styles.line} />
      </TouchableOpacity>

      {/* App logo */}
      <Image source={require("../../assets/Logo.png")} style={styles.logo} />

      <View style={styles.content}>
        <Text style={styles.title}>Receipt Scanner</Text>
        <TouchableOpacity style={styles.button} onPress={pickImageAndProcess}>
          <Text style={styles.buttonText}>Scan Receipt!</Text>
        </TouchableOpacity>
        {items.length > 0 && (
          <View style={styles.actionBar}>
            <Text style={styles.resultsText}>{items.length} items found</Text>
            {selectedItems.length > 0 ? (
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowAddToPantryOptions(true)}
              >
                <Text style={styles.addButtonText}>
                  Add {selectedItems.length} to Pantry
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.selectHint}>Tap items to select</Text>
            )}
          </View>
        )}
        <ScrollView style={styles.itemsContainer}>
          {items.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.itemContainer,
                selectedItems.includes(index) && styles.selectedItem,
                { borderLeftColor: getCategoryColor(item.category) },
              ]}
              onPress={() => toggleItemSelection(index)}
            >
              <View style={styles.itemHeader}>
                <Text style={styles.itemName}>{item.name}</Text>
                {item.category && (
                  <View
                    style={[
                      styles.categoryTag,
                      { backgroundColor: getCategoryColor(item.category, 0.2) },
                    ]}
                  >
                    <Text style={styles.categoryText}>{item.category}</Text>
                  </View>
                )}
              </View>

              <View style={styles.itemDetails}>
                <View style={styles.itemRow}>
                  <Text style={styles.itemLabel}>Qty: </Text>
                  <Text style={styles.itemQuantity}>{item.quantity}</Text>
                </View>

                {item.price && (
                  <View style={styles.itemRow}>
                    <Text style={styles.itemLabel}>Price: </Text>
                    <Text style={styles.itemPrice}>{item.price}</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={styles.editButton}
                onPress={() => editItem(index)}
              >
                <Icon name="pencil" size={18} color="#007BFF" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {/* Edit modal  */}

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalView}>
              <Text style={styles.modalTitle}>
                {editingIndex !== null ? "Edit Item" : "Add Item"}
              </Text>

              <TextInput
                style={[styles.input, styles.blackText]}
                placeholder="Item name"
                placeholderTextColor="#999"
                value={editedItem.name}
                onChangeText={(text) =>
                  setEditedItem({ ...editedItem, name: text })
                }
              />

              <TextInput
                style={[styles.input, styles.blackText]}
                placeholder="Quantity"
                placeholderTextColor="#999"
                value={editedItem.quantity}
                onChangeText={(text) =>
                  setEditedItem({ ...editedItem, quantity: text })
                }
                keyboardType="default"
              />

              {editedItem.price !== undefined && (
                <TextInput
                  style={[styles.input, styles.blackText]}
                  placeholder="Price"
                  placeholderTextColor="#999"
                  value={editedItem.price}
                  onChangeText={(text) =>
                    setEditedItem({ ...editedItem, price: text })
                  }
                  keyboardType="decimal-pad"
                />
              )}

              {editedItem.category !== undefined && (
                <View style={styles.categoryPickerContainer}>
                  <Text style={styles.categoryPickerLabel}>Category:</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.categoryScroll}
                  >
                    {[
                      "Pantry",
                      "Fridge",
                      "Freezer",
                      "Spices",
                      // "Produce",
                      "Other",
                    ].map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.categoryOption,
                          editedItem.category === cat &&
                            styles.categoryOptionSelected,
                          {
                            backgroundColor: getCategoryColor(
                              cat,
                              editedItem.category === cat ? 0.3 : 0.1
                            ),
                          },
                        ]}
                        onPress={() =>
                          setEditedItem({ ...editedItem, category: cat })
                        }
                      >
                        <Text
                          style={[
                            styles.categoryOptionText,
                            editedItem.category === cat &&
                              styles.categoryOptionTextSelected,
                          ]}
                        >
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              <View style={styles.modalButtonContainer}>
                <TouchableOpacity
                  style={styles.modalAddButton}
                  onPress={saveEdit}
                >
                  <Text style={styles.modalAddButtonText}>Save Changes</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        {/* Storage options modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showAddToPantryOptions}
          onRequestClose={() => setShowAddToPantryOptions(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalView}>
              <Text style={styles.modalTitle}>Add to Storage</Text>
              <Text style={styles.modalSubtitle}>
                Select where to add {selectedItems.length} item(s)
              </Text>

              <TouchableOpacity
                style={styles.storageButton}
                onPress={() => addSelectedItemsToPantry("pantry")}
              >
                <Icon name="cube" size={24} color="#007BFF" />
                <Text style={styles.storageButtonText}>Pantry</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.storageButton}
                onPress={() => addSelectedItemsToPantry("fridge")}
              >
                <Icon name="restaurant" size={24} color="#00A651" />
                <Text style={styles.storageButtonText}>Fridge</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.storageButton}
                onPress={() => addSelectedItemsToPantry("freezer")}
              >
                <Icon name="snow" size={24} color="#00B2E3" />
                <Text style={styles.storageButtonText}>Freezer</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.storageButton}
                onPress={() => addSelectedItemsToPantry("spices")}
              >
                <Icon name="flame" size={24} color="#FE5000" />
                <Text style={styles.storageButtonText}>Spices</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddToPantryOptions(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
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
        <SideMenu onSelectMenuItem={handleMenuSelect} />
      </Animated.View>
    </View>
  );
}

// Utility function to get category color
const getCategoryColor = (category, opacity = 1) => {
  const colors = {
    Pantry: `rgba(0, 123, 255, ${opacity})`,
    Fridge: `rgba(0, 166, 81, ${opacity})`,
    Freezer: `rgba(0, 178, 227, ${opacity})`,
    Spices: `rgba(254, 80, 0, ${opacity})`,
    // Produce: `rgba(86, 186, 69, ${opacity})`,
    Other: `rgba(128, 128, 128, ${opacity})`,
  };
  return colors[category] || colors["Other"];
};

// Add these styles
const additionalStyles = {
  actionBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: width * 0.8,
    marginTop: 10,
    marginBottom: 5,
  },
  resultsText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  selectHint: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
  addButton: {
    backgroundColor: "#007BFF",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  selectedItem: {
    backgroundColor: "#e6f7ff",
    borderWidth: 2,
    borderColor: "#007BFF",
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  itemDetails: {
    flexDirection: "column",
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: "rgba(0, 123, 255, 0.2)",
  },
  categoryText: {
    fontSize: 12,
    color: "#007BFF",
    fontWeight: "500",
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: "500",
    color: "#28a745",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#333",
  },
  modalSubtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 15,
    textAlign: "center",
  },
  storageButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    width: "100%",
  },
  storageButtonText: {
    fontSize: 18,
    marginLeft: 15,
    color: "#333",
  },
  cancelButton: {
    padding: 10,
    marginTop: 5,
  },
  cancelButtonText: {
    color: "#dc3545",
    fontSize: 16,
    fontWeight: "500",
  },
};

// Add these styles
const modalStyles = {
  modalButtonContainer: {
    flexDirection: "column",
    width: "100%",
    marginTop: 10,
  },
  categoryPickerContainer: {
    width: "100%",
    marginBottom: 15,
  },
  categoryPickerLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#333",
    alignSelf: "flex-start",
  },
  categoryScroll: {
    flexDirection: "row",
    width: "100%",
  },
  categoryOption: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  categoryOptionSelected: {
    borderColor: "#007BFF",
  },
  categoryOptionText: {
    fontSize: 14,
    color: "#333",
  },
  categoryOptionTextSelected: {
    fontWeight: "bold",
    color: "#007BFF",
  },
  input: {
    height: 50,
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
};

// Merge with existing styles
const styles = StyleSheet.create({
  ...additionalStyles,
  modalButtonContainer: {
    flexDirection: "column",
    width: "100%",
    marginTop: 10,
  },
  categoryPickerContainer: {
    width: "100%",
    marginBottom: 15,
  },
  categoryPickerLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#333",
    alignSelf: "flex-start",
  },
  categoryScroll: {
    flexDirection: "row",
    width: "100%",
  },
  categoryOption: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  categoryOptionSelected: {
    borderColor: "#007BFF",
  },
  categoryOptionText: {
    fontSize: 14,
    color: "#333",
  },
  categoryOptionTextSelected: {
    fontWeight: "bold",
    color: "#007BFF",
  },
  input: {
    height: 50,
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },

  // Main container styles
  container: {
    flex: 1,
    backgroundColor: "#ADD8E6",
    padding: 20,
  },
  content: {
    flex: 1,
    alignItems: "center",
    marginTop: 40, // Add space for the logo
  },
  logo: {
    width: 85,
    height: 85,
    alignSelf: "center",
    marginTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  button: {
    marginTop: 15,
    padding: 10,
    backgroundColor: "#007BFF",
    borderRadius: 5,
    paddingHorizontal: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  itemsContainer: {
    flex: 1,
    marginTop: 20,
    width: width * 0.8,
    backgroundColor: "#ADD8E6",
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
    position: "relative",
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
    position: "absolute",
    bottom: 10,
    right: 10,
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 50,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  editContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#ccc",
  },
  input: {
    width: "100%",
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: "#007BFF",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 18,
  },
  hamburger: {
    position: "absolute",
    top: 40,
    left: 20,
    zIndex: 1,
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
    width: "100%",
    alignItems: "center",
  },
  modalAddButtonText: {
    color: "#ffffff",
    fontWeight: "bold",
  },
  modalCancelButton: {
    padding: 10,
  },
  modalCancelButtonText: {
    color: "#007BFF",
  },
  // Menu container styles
  menuContainer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: width * 0.4,
    backgroundColor: "#4C5D6B",
    padding: 20,
    paddingTop: 40,
    zIndex: 0,
  },
  actionBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: width * 0.8,
    marginTop: 10,
    padding: 10,
    backgroundColor: "#ffffff",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  resultsText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  addButton: {
    backgroundColor: "#007BFF",
    padding: 10,
    borderRadius: 5,
  },
  addButtonText: {
    color: "#ffffff",
    fontWeight: "bold",
  },
  selectHint: {
    fontSize: 14,
    color: "#555",
  },
  selectedItem: {
    backgroundColor: "#E0F7FA",
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryTag: {
    padding: 5,
    borderRadius: 5,
  },
  categoryText: {
    fontSize: 12,
    color: "#333",
  },
  itemDetails: {
    marginTop: 10,
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: "500",
    color: "#007BFF",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 16,
    color: "#555",
    marginBottom: 20,
  },
  storageButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#ffffff",
    borderRadius: 5,
    marginBottom: 10,
    width: "100%",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  storageButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 10,
  },
  cancelButton: {
    padding: 10,
    backgroundColor: "#ffffff",
    borderRadius: 5,
    width: "100%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  cancelButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#007BFF",
  },
});
