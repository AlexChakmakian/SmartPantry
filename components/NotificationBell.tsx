import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons"; // Import Ionicons for the notification icon
import checkForExpiredItems from "./checkForExpiredItem"; // Adjust the import path as needed

interface Notification {
  name: string;
  location: string;
}

const NotificationBell = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const fetchExpiredItems = async () => {
      const expiredItems = await checkForExpiredItems();
      const formattedItems = expiredItems.map((item) => ({
        name: item.name || "",
        location: item.location || "",
      }));
      setNotifications(formattedItems);
    };

    fetchExpiredItems();
  }, []);

  const handleNotificationPress = () => {
    if (notifications.length === 0) {
      Alert.alert("Notifications", "You have no new notifications.");
    } else {
      Alert.alert(
        "Notifications",
        `You have ${notifications.length} expired items:\n${notifications
          .map((item) => `${item.name} (${item.location})`)
          .join("\n ")}`
      );
    }
  };

  return (
    <TouchableOpacity
      style={styles.notificationIcon}
      onPress={handleNotificationPress}
    >
      <Ionicons name="notifications-outline" size={30} color="#fff" />
      {notifications.length > 0 && (
        <View style={styles.notificationBadge}>
          <Text style={styles.notificationBadgeText}>
            {notifications.length}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  notificationIcon: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 2,
  },
  notificationBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "red",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
});

export default NotificationBell;