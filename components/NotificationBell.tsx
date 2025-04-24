import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import checkForExpiredItems from "./checkForExpiredItem";
import { useRouter } from "expo-router";
import { deleteItem } from "../firebase/pantryService";
import { getAuth } from "firebase/auth";
import {
  GestureHandlerRootView,
  Swipeable,
} from "react-native-gesture-handler";

const { width } = Dimensions.get("window");

interface Notification {
  name: string;
  location: string;
  expirationDate: Date;
  id: string; // Add unique identifier
  priority?: "high" | "medium" | "low";
}

const NotificationBell = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-width)).current; // Change to full width
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  useEffect(() => {
    const fetchExpiredItems = async () => {
      const expiredItems = await checkForExpiredItems();
      const formattedItems = expiredItems.map((item) => ({
        name: item.name || "",
        location: item.location || "",
        expirationDate: item.expirationDate || new Date(),
        id: item.id || Math.random().toString(),
      }));
      setNotifications(formattedItems);
    };

    fetchExpiredItems();
  }, []);

  const getTimeSinceExpiration = (expirationDate: Date) => {
    const now = new Date();
    const diff = now.getTime() - expirationDate.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Expired today";
    if (days === 1) return "Expired yesterday";
    return `Expired ${days} days ago`;
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    closeNotifications();
  };

  const closeNotifications = () => {
    // Ensure animations complete before updating state
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -width,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsOpen(false); // Update state after animation
    });
  };

  const openNotifications = () => {
    setIsOpen(true); // Set state before animation
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const toggleNotifications = () => {
    if (isOpen) {
      closeNotifications();
    } else {
      openNotifications();
    }
  };

  const getPriorityColor = (priority?: "high" | "medium" | "low") => {
    switch (priority) {
      case "high":
        return "rgba(220, 53, 69, 0.1)"; // Light red
      case "medium":
        return "rgba(255, 193, 7, 0.1)"; // Light yellow
      case "low":
        return "rgba(40, 167, 69, 0.1)"; // Light green
      default:
        return "#cfe6f5"; // Default blue
    }
  };

  const getLocationIcon = (location: string) => {
    switch (location.toLowerCase()) {
      case "pantry":
        return "nutrition-outline";
      case "fridge":
        return "snow-outline";
      case "freezer":
        return "cube-outline";
      case "spices":
        return "leaf-outline";
      default:
        return "file-tray-outline";
    }
  };

  const handleViewDetails = (item: Notification) => {
    closeNotifications();
    const location = item.location.toLowerCase();
    // Validate location against known valid paths
    if (["pantry", "fridge", "freezer", "spices"].includes(location)) {
      router.push({
        pathname: `/screens/${
          location.charAt(0).toUpperCase() + location.slice(1)
        }`,
        // Use the item ID as a parameter to highlight the item
        params: { highlightId: item.id },
      });
    }
  };

  const handleDeleteItem = async (item: Notification) => {
    const user = getAuth().currentUser;
    if (!user) {
      Alert.alert("Error", "You must be logged in to delete items");
      return;
    }

    Alert.alert(
      "Delete Item",
      `Are you sure you want to delete ${item.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Use the deleteItem function from pantryService
              await deleteItem(item.location.toLowerCase(), user.uid, item.id);

              // Remove from local notifications
              dismissNotification(item.id);

              Alert.alert("Success", "Item deleted successfully");
            } catch (error) {
              console.error("Error deleting item:", error);
              Alert.alert("Error", "Failed to delete item");
            }
          },
        },
      ]
    );
  };

  const renderRightActions = (item: Notification) => (
    <View style={styles.deleteButtonContainer}>
      <TouchableOpacity
        style={styles.deleteButton}
        // onPress={() => {
        //   Alert.alert(
        //     "Delete Item",
        //     `Are you sure you want to delete ${item.name}?`,
        //     [
        //       {
        //         text: "Cancel",
        //         style: "cancel",
        //       },
        //       {
        //         text: "Delete",
        //         style: "destructive",
        //         onPress: () => handleDeleteItem(item),
        //       },
        //     ]
        //   );
        // }}
        onPress={() => handleDeleteItem(item)}
      >
        <Ionicons name="trash-outline" size={24} color="#fff" />
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <>
      <TouchableOpacity
        style={styles.notificationIcon}
        onPress={toggleNotifications}
        activeOpacity={0.7}
      >
        <Ionicons
          name={isOpen ? "notifications" : "notifications-outline"}
          size={30}
          color="#fff"
        />
        {notifications.length > 0 && (
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationBadgeText}>
              {notifications.length}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Backdrop - Only render when isOpen */}
      {isOpen && (
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: fadeAnim,
              display: isOpen ? "flex" : "none", // Add display control
            },
          ]}
          pointerEvents={isOpen ? "auto" : "none"}
          onTouchEnd={closeNotifications} // Use closeNotifications instead
        />
      )}

      {/* Notification Panel - Only render when isOpen */}
      {isOpen && (
        <Animated.View
          style={[
            styles.notificationPanel,
            {
              transform: [{ translateX: slideAnim }],
              display: isOpen ? "flex" : "none", // Add display control
            },
          ]}
        >
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Notifications</Text>
            <View style={styles.headerButtons}>
              {notifications.length > 0 && (
                <TouchableOpacity
                  onPress={clearAllNotifications}
                  style={styles.clearAllButton}
                >
                  <Text style={styles.clearAllText}>Clear All</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={closeNotifications}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.notificationList}>
            {notifications.length > 0 ? (
              <GestureHandlerRootView>
                {notifications.map((item) => (
                  <Swipeable
                    key={item.id}
                    renderRightActions={() => renderRightActions(item)}
                  >
                    <TouchableOpacity onPress={() => handleViewDetails(item)}>
                      <Animated.View
                        style={[
                          styles.notificationItem,
                          { backgroundColor: getPriorityColor(item.priority) },
                        ]}
                      >
                        <View style={styles.itemIconContainer}>
                          <Ionicons
                            name={getLocationIcon(item.location)}
                            size={24}
                            color="#007BFF"
                          />
                        </View>
                        <View style={styles.itemContent}>
                          <Text style={styles.itemName}>{item.name}</Text>
                          <Text style={styles.itemLocation}>
                            {item.location}
                          </Text>
                          <Text style={styles.expiredText}>
                            {getTimeSinceExpiration(item.expirationDate)}
                          </Text>
                        </View>
                      </Animated.View>
                    </TouchableOpacity>
                  </Swipeable>
                ))}
              </GestureHandlerRootView>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />
                <Text style={styles.emptyStateText}>No expired items!</Text>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  // deleteButtonContainer: {
  //   width: 100,
  //   height: "100%",
  // },
  // deleteButton: {
  //   backgroundColor: "#FF3B30",
  //   justifyContent: "center",
  //   alignItems: "center",
  //   flex: 1,
  //   borderRadius: 12,
  //   marginVertical: 8,
  // },
  // deleteButtonText: {
  //   color: "#fff",
  //   fontWeight: "bold",
  //   fontSize: 14,
  //   marginTop: 4,
  // },
  notificationItem: {
    flexDirection: "row",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#fff",
  },
  notificationIcon: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 100, // Increase zIndex to ensure it's above other elements
    padding: 10, // Add padding for better touch area
  },
  notificationBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#ff4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 999, // Just below panel but above other content
  },
  notificationPanel: {
    position: "absolute",
    top: 0,
    right: 0,
    width: width * 0.7, // Make panel wider
    height: "100%",
    backgroundColor: "#fff",
    zIndex: 1000, // Increase zIndex
    shadowColor: "#000",
    shadowOffset: {
      width: -2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
  closeButton: {
    padding: 10, // Add padding for better touch area
    marginRight: -10, // Offset padding
  },
  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 50,
    backgroundColor: "#f8f9fa",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  panelTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  notificationList: {
    flex: 1,
  },
  itemIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f8ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  itemLocation: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  expiredText: {
    fontSize: 12,
    color: "#ff4444",
    fontWeight: "500",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  clearAllButton: {
    marginRight: 15,
    padding: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
  },
  clearAllText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "500",
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  dismissButton: {
    padding: 4,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginTop: 8,
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#007BFF",
    borderRadius: 4,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  deleteButton: {
    //backgroundColor: "#FF3B30",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 8,
  },
  deleteButtonContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    backgroundColor: "#FF3B30",
  },
});

export default NotificationBell;
