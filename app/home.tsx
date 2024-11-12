import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
  FlatList,
} from "react-native";
import { addItem, getItems } from "../firebase/pantryService"; // Import the getItems & addItems function
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");

const HomeScreen = () => {
  const router = useRouter(); // Create a router instance
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState("Home");
  const [showConfigurePage, setShowConfigurePage] = useState(false);
  const [items, setItems] = useState([]); // State to store items
  const slideAnim = useRef(new Animated.Value(-width)).current;

  const toggleMenu = () => {
    setMenuOpen(!isMenuOpen);
    Animated.timing(slideAnim, {
      toValue: isMenuOpen ? -width : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleMenuSelect = (page: string) => {
    setShowConfigurePage(false); // Hide Configure page when selecting a menu item

    // Close the side menu and animate it to slide away
    setMenuOpen(false);
    Animated.timing(slideAnim, {
      toValue: -width, // Slide the menu back out
      duration: 300,
      useNativeDriver: true,
    }).start();

    // For "Recipes," just update the selectedMenu without navigating
    if (page === "Recipes") {
      setSelectedMenu(page);
    } else {
      // For other pages, push to the respective route
      setSelectedMenu(page);
      router.push({
        pathname: `/screens/${page}`, // Navigate directly to the page
      });
    }
  };

  const handleConfigurePantry = () => {
    setSelectedMenu("");
    setShowConfigurePage(true);
  };

  const handleAddSampleItem = async () => {
    const sampleItem = {
      name: "Milk",
      quantity: 1,
      unit: "gallon",
      expiryDate: "2024-11-10",
      category: "Dairy",
    };

    try {
      await addItem("fridge", sampleItem);
      console.log("Sample item added to fridge");
    } catch (e) {
      console.error("Error adding sample item:", e);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.hamburger} onPress={toggleMenu}>
        <View style={styles.line} />
        <View style={styles.line} />
        <View style={styles.line} />
      </TouchableOpacity>

      <Image source={require("../assets/Logo.png")} style={styles.logo} />

      <View style={styles.contentContainer}>
        {!showConfigurePage && selectedMenu === "Home" && (
          <Text style={styles.contentText}>Welcome to your Smart Pantry!</Text>
        )}
        {!showConfigurePage && selectedMenu === "Recipes" && (
          <Text style={styles.contentText}>Your Recipes</Text>
        )}
        {!showConfigurePage &&
          (selectedMenu === "Pantry" ||
            selectedMenu === "Fridge" ||
            selectedMenu === "Freezer" ||
            selectedMenu === "Spices" ||
            selectedMenu === "Appliances") && (
            <View>
              <Text style={styles.contentText}>
                Your {selectedMenu.toLowerCase()} items:
              </Text>
              <FlatList
                data={items}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.itemCard}>
                    <Text style={styles.itemText}>Name: {item.name}</Text>
                    <Text style={styles.itemText}>
                      Quantity: {item.quantity} {item.unit}
                    </Text>
                    {item.expiryDate && (
                      <Text style={styles.itemText}>
                        Expires: {item.expiryDate}
                      </Text>
                    )}
                  </View>
                )}
              />
            </View>
          )}
        {!showConfigurePage && selectedMenu === "Log out" && (
          <Text style={styles.contentText}>Logging out...</Text>
        )}
      </View>

      {showConfigurePage ? (
        <View style={styles.configureContainer}>
          <Text style={styles.configureText}>Pantry Configuration</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.circleButton}
          onPress={handleConfigurePantry}
        >
          <Text style={styles.buttonText}>Configure</Text>
          <Text style={styles.buttonText}>Pantry 🍽️</Text>
        </TouchableOpacity>
      )}

      <Animated.View
        style={[
          styles.menuContainer,
          { transform: [{ translateX: slideAnim }] },
        ]}
      >
        <Text style={styles.menuText}></Text>
        <TouchableOpacity onPress={() => handleMenuSelect("Recipes")}>
          <Text style={styles.menuText}>Recipes</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleMenuSelect("Pantry")}>
          <Text style={styles.menuText}>Pantry</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleMenuSelect("Fridge")}>
          <Text style={styles.menuText}>Fridge</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleMenuSelect("Freezer")}>
          <Text style={styles.menuText}>Freezer</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleMenuSelect("Spices")}>
          <Text style={styles.menuText}>Spices</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleMenuSelect("Appliances")}>
          <Text style={styles.menuText}>Appliances</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleMenuSelect("Log out")}>
          <Text style={styles.menuText}>Log out</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleAddSampleItem}
          style={styles.addButton}
        >
          <Text style={styles.buttonText}>Add Sample Item to Fridge</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ADD8E6", paddingTop: 20 },
  logo: { width: 80, height: 80, alignSelf: "center", marginTop: -5 },
  hamburger: { position: "absolute", top: 40, left: 20, zIndex: 1 },
  line: { width: 30, height: 4, backgroundColor: "#fff", marginVertical: 4 },
  circleButton: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#AFDFE6",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginTop: 100,
    borderColor: "#fff",
    borderWidth: 3,
    borderStyle: "dashed",
  },
  buttonText: { color: "#fff", fontSize: 18 },
  menuContainer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: width * 0.4,
    backgroundColor: "#4C5D6B",
    padding: 20,
    paddingTop: 60,
    zIndex: 0,
  },
  addButton: {
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },

  menuText: { fontSize: 18, color: "#fff", marginVertical: 10 },
  contentContainer: { marginTop: 50, alignItems: "center" },
  contentText: { fontSize: 18, color: "#333" },
  configureContainer: {
    alignItems: "center",
    marginTop: 30,
    padding: 20,
    backgroundColor: "#E0F7FA",
    borderRadius: 10,
  },
  configureText: { fontSize: 16, color: "#333" },
  itemCard: {
    padding: 15,
    marginVertical: 10,
    borderRadius: 8,
    backgroundColor: "#f8f8f8",
    elevation: 3,
  },
  itemText: {
    fontSize: 16,
    color: "#333",
  },
});

export default HomeScreen;
