import React, { useState, useEffect } from "react";
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
} from "../firebase/pantryService"; // Import updated pantry service
import Icon from "react-native-vector-icons/Ionicons"; // Import the Icon
import { getAuth } from "firebase/auth"; // For accessing the current user's auth state

export default function ItemList({ itemType }) {
  const [items, setItems] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [newItemName, setNewItemName] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const user = getAuth().currentUser;
        if (user) {
          const items = await getItemsFromDatabase(itemType, user.uid); // Pass user ID to fetch items
          setItems(items);
        } else {
          Alert.alert("Error", "User not authenticated");
        }
      } catch (e) {
        console.error(`Error retrieving items from ${itemType}:`, e);
      }
    };
    fetchItems();
  }, [itemType]); // Re-run when itemType changes

  const addItem = async () => {
    if (newItemName.trim() && newItemQuantity.trim()) {
      const newItem = {
        name: newItemName,
        quantity: newItemQuantity,
        dateAdded: new Date().toISOString(), // Ensure this is a valid ISO string
      };

      const user = getAuth().currentUser; // Get the current user

      if (user) {
        try {
          // Add the item to Firestore under the user's pantry
          await addItemToDatabase(itemType, user.uid, newItem); // Passing the correct object
          setItems([
            ...items,
            {
              id: (items.length + 1).toString(),
              name: newItemName,
              quantity: newItemQuantity,
              dateAdded: newItem.dateAdded,
            },
          ]);
          setNewItemName("");
          setNewItemQuantity("");
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
    setNewItemQuantity(item.quantity);
    setModalVisible(true);
  };

  const updateItem = async () => {
    if (newItemName.trim() && newItemQuantity.trim() && editingItem) {
      const updatedItem = {
        name: newItemName,
        quantity: newItemQuantity,
      };
      const user = getAuth().currentUser;
      if (user) {
        try {
          await updateItemFromDatabase(
            itemType,
            user.uid,
            editingItem.id,
            updatedItem
          ); // Pass user ID to update item
          setItems(
            items.map((item) =>
              item.id === editingItem.id ? { ...item, ...updatedItem } : item
            )
          );
          setModalVisible(false);
          setNewItemName("");
          setNewItemQuantity("");
        } catch (e) {
          console.error(`Error updating item in ${itemType}:`, e);
        }
      }
    }
  };

  const deleteItem = async (id) => {
    const user = getAuth().currentUser; // Get the current authenticated user
    if (user) {
      try {
        setLoading(true);
        await deleteItemFromDatabase(itemType, user.uid, id); // Pass user ID and item ID to delete
        setItems((prevItems) => prevItems.filter((item) => item.id !== id)); // Remove item from local state
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

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.header}>
            {itemType.charAt(0).toUpperCase() + itemType.slice(1)} Items
          </Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              setEditingItem(null); // Reset the editingItem to null for adding a new item
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
                placeholderTextColor="#000000"
                value={newItemName}
                onChangeText={setNewItemName}
              />
              <TextInput
                style={[styles.input, styles.blackText]}
                placeholder="Enter quantity"
                placeholderTextColor="#000000"
                value={newItemQuantity}
                onChangeText={setNewItemQuantity}
              />

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
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  // The same styles you used before, including itemContainer, itemRow, itemLabel, etc.
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#ADD8E6",
  },
  // ... other styles
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#004080", // Deep blue header text
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
    borderLeftColor: "#007BFF", // Accent line for style
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
