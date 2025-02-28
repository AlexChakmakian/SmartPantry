import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  ScrollView,
} from "react-native";
import {
  GestureHandlerRootView,
  Swipeable,
} from "react-native-gesture-handler";
import {
  addItem as addItemToDatabase,
  getItems as getItemsFromDatabase,
  deleteItem as deleteItemFromDatabase,
  updateItem as updateItemFromDatabase,
} from "../firebase/pantryService";
import Icon from "react-native-vector-icons/Ionicons";
import { getAuth, signOut } from "firebase/auth";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");

// Custom dropdown component to replace Picker
const CustomDropdown = ({ selectedValue, onValueChange, options }) => {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.dropdownContainer}>
      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => setVisible(true)}
      >
        <Text style={styles.dropdownButtonText}>{selectedValue}</Text>
        <Icon name="chevron-down" size={18} color="#333" />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity
          style={styles.dropdownOverlay}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <View style={styles.dropdownModal}>
            <ScrollView>
              {options.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.dropdownItem,
                    selectedValue === option && styles.dropdownItemSelected,
                  ]}
                  onPress={() => {
                    onValueChange(option);
                    setVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      selectedValue === option && styles.dropdownItemTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default function ItemList({ itemType }) {
  const [items, setItems] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [newItemName, setNewItemName] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState("");
  const [newItemUnit, setNewItemUnit] = useState("lbs");
  const [loading, setLoading] = useState(false);
  const [isMenuOpen, setMenuOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-width)).current;

  const router = useRouter();
  const auth = getAuth();

  // Available unit options
  const unitOptions = [
    "lbs", "oz", "g", "kg", "cups", 
    "tbsp", "tsp", "ml", "L", "pcs"
  ];

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const user = getAuth().currentUser;
        if (user) {
          const items = await getItemsFromDatabase(itemType, user.uid);
          setItems(items);
        } else {
          Alert.alert("Error", "User not authenticated");
        }
      } catch (e) {
        console.error(`Error retrieving items from ${itemType}:`, e);
      }
    };
    fetchItems();
  }, [itemType]);

  const addItem = async () => {
    if (newItemName.trim() && newItemQuantity.trim()) {
      const newItem = {
        name: newItemName,
        quantity: `${newItemQuantity} ${newItemUnit}`,
        dateAdded: new Date().toISOString(),
      };

      const user = getAuth().currentUser;

      if (user) {
        try {
          await addItemToDatabase(itemType, user.uid, newItem);
          setItems([
            ...items,
            {
              id: (items.length + 1).toString(),
              name: newItemName,
              quantity: newItem.quantity,
              dateAdded: newItem.dateAdded,
            },
          ]);
          setNewItemName("");
          setNewItemQuantity("");
          setNewItemUnit("lbs");
          setModalVisible(false);
        } catch (e) {
          console.error(`Error adding item to ${itemType}:`, e);
        }
      }
    }
  };

  const editItem = (item) => {
    setEditingItem(item);
    setNewItemName(item.name);
    
    const parts = item.quantity.split(' ');
    if (parts.length >= 2) {
      setNewItemQuantity(parts[0]);
      setNewItemUnit(parts[1]);
    } else {
      setNewItemQuantity(item.quantity);
      setNewItemUnit("lbs");
    }
    
    setModalVisible(true);
  };

  const updateItem = async () => {
    if (newItemName.trim() && newItemQuantity.trim() && editingItem) {
      const updatedItem = {
        name: newItemName,
        quantity: `${newItemQuantity} ${newItemUnit}`,
        dateAdded: editingItem.dateAdded
      };
      const user = getAuth().currentUser;
      if (user) {
        try {
          await updateItemFromDatabase(
            itemType,
            user.uid,
            editingItem.id,
            updatedItem
          );
          setItems(
            items.map((item) =>
              item.id === editingItem.id ? { ...item, ...updatedItem } : item
            )
          );
          setModalVisible(false);
          setNewItemName("");
          setNewItemQuantity("");
          setNewItemUnit("lbs");
        } catch (e) {
          console.error(`Error updating item in ${itemType}:`, e);
        }
      }
    }
  };

  const deleteItem = async (id) => {
    const user = getAuth().currentUser;
    if (user) {
      try {
        setLoading(true);
        await deleteItemFromDatabase(itemType, user.uid, id);
        setItems((prevItems) => prevItems.filter((item) => item.id !== id));
        setLoading(false);
      } catch (e) {
        console.error(`Error deleting item from ${itemType}:`, e);
        setLoading(false);
      }
    } else {
      console.error("User not authenticated");
    }
  };

  const renderRightActions = (id) => (
    <TouchableOpacity
      style={styles.deleteButton}
      onPress={() => {
        Alert.alert(
          "Delete Item",
          "Are you sure you want to delete this item?",
          [
            {
              text: "Cancel",
              style: "cancel",
            },
            {
              text: "Delete",
              style: "destructive",
              onPress: () => deleteItem(id),
            },
          ]
        );
      }}
    >
      <Text style={styles.deleteButtonText}>Delete</Text>
    </TouchableOpacity>
  );

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
        await signOut(auth);
        console.log("User signed out");
        router.push("/");
      } catch (error) {
        console.error("Error signing out:", error);
      }
    } else {
      const paths = {
        Home: "/home",
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

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.hamburger} onPress={toggleMenu}>
          <View style={styles.line} />
          <View style={styles.line} />
          <View style={styles.line} />
        </TouchableOpacity>

        <Image source={require("../assets/Logo.png")} style={styles.logo} />

        <View style={styles.headerContainer}>
          <Text style={styles.header}>
            {itemType.charAt(0).toUpperCase() + itemType.slice(1)} Items
          </Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              setEditingItem(null);
              setNewItemName("");
              setNewItemQuantity("");
              setNewItemUnit("lbs");
              setModalVisible(true);
            }}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>
        {loading && (
          <ActivityIndicator
            size="large"
            color="#007BFF"
            style={{ marginBottom: 10 }}
          />
        )}
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const formattedDate = new Date(item.dateAdded).toLocaleDateString(
              "en-US",
              {
                month: "short",
                day: "numeric",
                year: "numeric",
              }
            );
            return (
              <Swipeable renderRightActions={() => renderRightActions(item.id)}>
                <View style={styles.itemContainer}>
                  <View style={styles.itemRow}>
                    <Text style={styles.itemLabel}>Item: </Text>
                    <Text style={styles.itemName}>{item.name}</Text>
                  </View>
                  <View style={styles.itemRow}>
                    <Text style={styles.itemLabel}>Qty: </Text>
                    <Text style={styles.itemQuantity}>{item.quantity}</Text>
                  </View>
                  <View style={styles.itemRow}>
                    <Text style={styles.itemLabel}>Date added: </Text>
                    <Text style={styles.itemDate}>{formattedDate}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => editItem(item)}
                  >
                    <Icon name="pencil" size={18} color="#007BFF" />
                  </TouchableOpacity>
                </View>
              </Swipeable>
            );
          }}
        />
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalView}>
              <Text style={styles.modalText}>
                {editingItem ? "Edit Item" : "Add New Item"}
              </Text>
              <TextInput
                style={[styles.input, styles.blackText]}
                placeholder="Enter item name"
                placeholderTextColor="#999999"
                value={newItemName}
                onChangeText={setNewItemName}
              />
              <View style={styles.quantityUnitContainer}>
                <TextInput
                  style={[styles.quantityInput, styles.blackText]}
                  placeholder="Quantity"
                  placeholderTextColor="#999999"
                  value={newItemQuantity}
                  onChangeText={setNewItemQuantity}
                  keyboardType="numeric"
                />
                
                {/* Replace Picker with our CustomDropdown */}
                <CustomDropdown
                  selectedValue={newItemUnit}
                  onValueChange={(value) => setNewItemUnit(value)}
                  options={unitOptions}
                />
              </View>

              <TouchableOpacity
                style={styles.modalAddButton}
                onPress={editingItem ? updateItem : addItem}
              >
                <Text style={styles.modalAddButtonText}>
                  {editingItem ? "Update" : "Add"}
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
        <TouchableOpacity onPress={() => handleMenuSelect("Pantry")}>
          <Text style={styles.menuText}>Pantry</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleMenuSelect("Fridge")}>
          <Text style={[styles.menuText, styles.rightPadding]}>Fridge</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleMenuSelect("Freezer")}>
          <Text style={[styles.menuText, styles.rightPadding]}>Freezer</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleMenuSelect("Spices")}>
          <Text style={[styles.menuText, styles.rightPadding]}>Spices</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleMenuSelect("Appliances")}>
          <Text style={[styles.menuText, styles.rightPadding]}>Appliances</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleMenuSelect("History")}>
          <Text style={[styles.menuText]}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleMenuSelect("Bookmarked")}>
          <Text style={[styles.menuText]}>Bookmarked</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleMenuSelect("ReciptScanner")}>
          <Text style={styles.menuText}>Receipt Scanner</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleMenuSelect("Log out")}>
          <Text style={[styles.menuText, styles.logoutText]}>Log out</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#ADD8E6",
  },
  logo: {
    width: 85,
    height: 85,
    alignSelf: "center",
    marginTop: -10,
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
  firstMenuItem: {
    paddingTop: 40,
  },
  menuText: {
    fontSize: 18,
    color: "#fff",
    marginVertical: 10,
  },
  logoutText: {
    color: 'red',
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#004080",
  },
  addButton: {
    backgroundColor: "#007BFF",
    padding: 10,
    borderRadius: 5,
  },
  addButtonText: {
    color: "#ffffff",
    fontSize: 20,
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
    borderLeftColor: "#007BFF",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
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
  itemDate: {
    fontSize: 16,
    color: "#666",
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
    color: "#333",
    fontWeight: "bold",
  },
  input: {
    width: "100%",
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    marginBottom: 15,
  },
  blackText: {
    color: "#000000",
  },
  quantityUnitContainer: {
    flexDirection: "row",
    width: "100%",
    marginBottom: 15,
    justifyContent: "space-between",
  },
  quantityInput: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    marginRight: 10,
  },
  // Custom dropdown styles
  dropdownContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    backgroundColor: "#f9f9f9",
  },
  dropdownButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 10,
    height: 40,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: "#000",
  },
  dropdownOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  dropdownModal: {
    width: "70%",
    maxHeight: "50%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 10,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dropdownItemSelected: {
    backgroundColor: "#e6f7ff",
  },
  dropdownItemText: {
    fontSize: 16,
    color: "#333",
  },
  dropdownItemTextSelected: {
    color: "#007BFF",
    fontWeight: "bold",
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
    fontSize: 16,
  },
  modalCancelButton: {
    padding: 10,
  },
  modalCancelButtonText: {
    color: "#007BFF",
    fontSize: 16,
  },
  deleteButton: {
    backgroundColor: "#FF3B30",
    justifyContent: "center",
    alignItems: "center",
    width: 100,
    height: "100%",
    borderRadius: 12,
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  logoutText: {
    fontSize: 18,
    color: 'red',
    marginVertical: 10,
  },
  rightPadding: {
    paddingLeft: 20, // Adjust the value as needed
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
});