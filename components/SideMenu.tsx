import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import ProfileHeader from "./ProfileHeader";

interface SideMenuProps {
  onSelectMenuItem: (menuItem: string) => void;
}

const SideMenu = ({ onSelectMenuItem }: SideMenuProps) => {
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

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => onSelectMenuItem("Pantry")}
      >
        <Text style={styles.menuText}>Pantry</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => onSelectMenuItem("Fridge")}
      >
        <Text style={[styles.menuText, styles.rightPadding]}>Fridge</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => onSelectMenuItem("Freezer")}
      >
        <Text style={[styles.menuText, styles.rightPadding]}>Freezer</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => onSelectMenuItem("Spices")}
      >
        <Text style={[styles.menuText, styles.rightPadding]}>Spices</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => onSelectMenuItem("Appliances")}
      >
        <Text style={[styles.menuText, styles.rightPadding]}>Appliances</Text>
      </TouchableOpacity>

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
