import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import ProfileHeader from "./ProfileHeader";
import { Ionicons } from "@expo/vector-icons";

interface SideMenuProps {
  onSelectMenuItem: (menuItem: string) => void;
}

const SideMenu = ({ onSelectMenuItem }: SideMenuProps) => {
  const [isMyFoodOpen, setIsMyFoodOpen] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;

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
    outputRange: ["0deg", "90deg"],
  });

  return (
    <View style={styles.container}>
      <ProfileHeader />

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => onSelectMenuItem("Home")}
      >
        <Text style={styles.menuText}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => onSelectMenuItem("AIRecipes")}
      >
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
          <TouchableOpacity
            style={styles.submenuItem}
            onPress={() => onSelectMenuItem("Pantry")}
          >
            <Text style={styles.submenuText}>Pantry</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.submenuItem}
            onPress={() => onSelectMenuItem("Fridge")}
          >
            <Text style={styles.submenuText}>Fridge</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.submenuItem}
            onPress={() => onSelectMenuItem("Freezer")}
          >
            <Text style={styles.submenuText}>Freezer</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.submenuItem}
            onPress={() => onSelectMenuItem("Spices")}
          >
            <Text style={styles.submenuText}>Spices</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.submenuItem}
            onPress={() => onSelectMenuItem("Appliances")}
          >
            <Text style={styles.submenuText}>Appliances</Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => onSelectMenuItem("History")}
      >
        <Text style={styles.menuText}>History</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => onSelectMenuItem("Bookmarked")}
      >
        <Text style={styles.menuText}>Bookmarked</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => onSelectMenuItem("ReceiptScanner")}
      >
        <Text style={styles.menuText}>Receipt Scanner</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => onSelectMenuItem("Settings")}
      >
        <Text style={styles.menuText}>Settings</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => onSelectMenuItem("ProfileSettings")}
      >
        <Text style={styles.menuText}>Profile Settings</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.menuItem, styles.logoutItem]}
        onPress={() => onSelectMenuItem("Log out")}
      >
        <Text style={[styles.menuText, styles.logoutText]}>Log out</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#4C5D6B",
  },
  menuItem: {
    paddingVertical: 10,
  },
  menuText: {
    fontSize: 18,
    color: "#fff",
  },
  // Menu dropdown styles
  menuItemWithSubmenu: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginRight: 10,
    paddingVertical: 10,
  },
  menuItemMain: {
    flex: 1,
  },
  triangleButton: {
    padding: 5,
  },
  submenuItem: {
    paddingVertical: 8,
    paddingLeft: 20,
  },
  submenuText: {
    fontSize: 16,
    color: "#fff",
  },
  rightPadding: {
    paddingLeft: 20,
  },
  logoutItem: {
    marginTop: "auto",
    paddingBottom: 30,
  },
  logoutText: {
    color: "red",
  },
});

export default SideMenu;
