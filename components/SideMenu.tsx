import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  StyleSheet,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import { getAuth, signOut } from "firebase/auth";
import ProfileHeader from "./ProfileHeader";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const SideMenu = ({ onClose }) => {
  const router = useRouter();
  const currentPath = usePathname();
  const [isMyFoodOpen, setIsMyFoodOpen] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const auth = getAuth();

  // Check if a path matches the current route
  const isActive = (path) => {
    return currentPath === path;
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
    outputRange: ["0deg", "90deg"],
  });

  const handleMenuSelect = async (page) => {
    onClose(); // Close the menu after selection

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
        ReceiptScanner: "/screens/ReceiptScanner",
        ProfileSettings: "/screens/ProfileSettings",
        Settings: "/Settings",
      };

      const path = paths[page] || "/home";
      router.push(path);
    }
  };

  return (
    <View style={styles.menuContainer}>
      {/* Add ProfileHeader at the top */}
      <View style={styles.profileHeaderContainer}>
  <ProfileHeader />
  {/* Add pencil icon to the bottom-right of the profile image */}
  <TouchableOpacity
    style={styles.editProfileIcon}
    onPress={() => handleMenuSelect("ProfileSettings")}
  >
    <Ionicons name="pencil" size={16} color="#fff" />
  </TouchableOpacity>
</View>

      <TouchableOpacity
        style={[styles.menuItem, isActive("/home") && styles.activeMenuItem]}
        onPress={() => handleMenuSelect("Home")}
      >
        <Ionicons name="home" size={22} color="#fff" style={styles.menuIcon} />
        <Text
          style={[styles.menuText, isActive("/home") && styles.activeMenuText]}
        >
          Home
        </Text>
      </TouchableOpacity>
      
<TouchableOpacity
  style={[
    styles.menuItem,
    isActive("/screens/AIRecipes") && styles.activeMenuItem,
  ]}
  onPress={() => handleMenuSelect("AIRecipes")}
>
  {/* Changed to lightning bolt icon */}
  <Ionicons name="flash" size={22} color="#fff" style={styles.menuIcon} />
  <Text style={styles.menuText}>Smart Recipes</Text>
</TouchableOpacity>

{/* My Food dropdown section */}
<View style={styles.menuItemWithSubmenu}>
  <TouchableOpacity style={styles.menuItemMain} onPress={toggleMyFood}>
    <View style={styles.menuItem}>
      {/* Changed to basket icon */}
      <Ionicons name="restaurant" size={22} color="#fff" style={styles.menuIcon} />
      <Text style={styles.menuText}>My Food</Text>
    </View>
  </TouchableOpacity>
  <TouchableOpacity onPress={toggleMyFood} style={styles.triangleButton}>
    <Animated.View style={{ transform: [{ rotate }] }}>
      <Ionicons name="chevron-forward" size={20} color="#fff" />
    </Animated.View>
  </TouchableOpacity>
</View>

{/* Submenu items */}
{isMyFoodOpen && (
  <View style={styles.submenuContainer}>
    <TouchableOpacity
      style={[
        styles.submenuItem,
        isActive("/screens/Pantry") && styles.activeMenuItem,
      ]}
      onPress={() => handleMenuSelect("Pantry")}
    >
      {/* Changed to basket icon */}
      <Ionicons name="basket" size={18} color="#fff" style={styles.submenuIcon} />
      <Text style={styles.submenuText}>Pantry</Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={[
        styles.submenuItem,
        isActive("/screens/Fridge") && styles.activeMenuItem,
      ]}
      onPress={() => handleMenuSelect("Fridge")}
    >
      {/* Changed to snowflake icon */}
      <Ionicons name="snow" size={18} color="#fff" style={styles.submenuIcon} />
      <Text style={styles.submenuText}>Fridge</Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={[
        styles.submenuItem,
        isActive("/screens/Freezer") && styles.activeMenuItem,
      ]}
      onPress={() => handleMenuSelect("Freezer")}
    >
      {/* Changed to ice cube icon */}
      <Ionicons name="cube" size={18} color="#fff" style={styles.submenuIcon} />
      <Text style={styles.submenuText}>Freezer</Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={[
        styles.submenuItem,
        isActive("/screens/Spices") && styles.activeMenuItem,
      ]}
      onPress={() => handleMenuSelect("Spices")}
    >
      {/* Changed to salt shaker icon */}
      <MaterialCommunityIcons name="shaker" size={18} color="#fff" style={styles.submenuIcon} />
      <Text style={styles.submenuText}>Spices</Text>
    </TouchableOpacity>

    <TouchableOpacity
  style={[
    styles.submenuItem,
    isActive("/screens/Appliances") && styles.activeMenuItem,
  ]}
  onPress={() => handleMenuSelect("Appliances")}
>
  {/* Changed to fridge icon */}
  <MaterialCommunityIcons name="fridge" size={18} color="#fff" style={styles.submenuIcon} />
  <Text style={styles.submenuText}>Appliances</Text>
</TouchableOpacity>
  </View>
)}

      <TouchableOpacity
        style={[
          styles.menuItem,
          isActive("/screens/History") && styles.activeMenuItem,
        ]}
        onPress={() => handleMenuSelect("History")}
      >
        <Ionicons name="time" size={22} color="#fff" style={styles.menuIcon} />
        <Text style={styles.menuText}>History</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.menuItem,
          isActive("/screens/Bookmarked") && styles.activeMenuItem,
        ]}
        onPress={() => handleMenuSelect("Bookmarked")}
      >
        <Ionicons
          name="bookmark"
          size={22}
          color="#fff"
          style={styles.menuIcon}
        />
        <Text style={styles.menuText}>Bookmarked</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.menuItem,
          isActive("/screens/ReceiptScanner") && styles.activeMenuItem,
        ]}
        onPress={() => handleMenuSelect("ReceiptScanner")}
      >
        <Ionicons name="scan" size={22} color="#fff" style={styles.menuIcon} />
        <Text style={styles.menuText}>Receipt Scanner</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.menuItem,
          isActive("/Settings") && styles.activeMenuItem,
        ]}
        onPress={() => handleMenuSelect("Settings")}
      >
        <Ionicons
          name="settings"
          size={22}
          color="#fff"
          style={styles.menuIcon}
        />
        <Text style={styles.menuText}>Settings</Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={() => handleMenuSelect("Log out")}
      >
        <Ionicons
          name="log-out"
          size={22}
          color="#ff6b6b"
          style={styles.menuIcon}
        />
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>
    </View>
  );
};

const AnimatedSideMenu = ({ isMenuOpen, onClose, onSelectMenuItem }) => {
  const slideAnim = useRef(new Animated.Value(-width)).current;

  // Update the SideMenu to pass the onSelectMenuItem prop
  const handleMenuSelect = (menuItem) => {
    if (onSelectMenuItem) {
      onSelectMenuItem(menuItem);
    } else {
      onClose();
    }
  };

  React.useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isMenuOpen ? 0 : -width,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isMenuOpen]);

  return (
    <Animated.View
      style={[
        styles.animatedMenuContainer,
        { transform: [{ translateX: slideAnim }] },
      ]}
    >
      <SideMenu onClose={onClose} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  menuContainer: {
    flex: 1,
    backgroundColor: "#4C5D6B",
    padding: 0,
    paddingTop: 0,
  },
  animatedMenuContainer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: width * 0.55,
    backgroundColor: "#4C5D6B",
    zIndex: 2,
  },
  profileHeaderContainer: {
    padding: 20,
    paddingTop: 0,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  editProfileIcon: {
    position: "absolute", // Position it relative to the profile header container
    bottom: 7, // Adjust to align with the bottom of the profile image
    right: 10, // Adjust to align with the right of the profile image
    backgroundColor: "#4C5D6B", // Optional: Add a background color to match the menu
    borderRadius: 50, // Make it circular
    padding: 10, // Add padding for better touch area
  },
  editProfileButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
    paddingVertical: 5,
  },
  editProfileText: {
    color: "#fff",
    fontSize: 14,
    marginLeft: 5,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  activeMenuItem: {
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  menuIcon: {
    marginRight: 12,
  },
  menuText: {
    fontSize: 16,
    color: "#fff",
  },
  activeMenuText: {
    fontWeight: "bold",
  },
  menuItemWithSubmenu: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: 15,
  },
  menuItemMain: {
    flex: 1,
  },
  triangleButton: {
    padding: 10,
  },
  submenuContainer: {
    backgroundColor: "rgba(0,0,0,0.15)",
    paddingTop: 5,
    paddingBottom: 5,
  },
  submenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 30,
  },
  submenuIcon: {
    marginRight: 10,
  },
  submenuText: {
    fontSize: 15,
    color: "#fff",
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    marginVertical: 10,
    marginHorizontal: 20,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: "auto",
    marginBottom: 30,
  },
  logoutText: {
    fontSize: 16,
    color: "#ff6b6b",
  },
});

export default AnimatedSideMenu;