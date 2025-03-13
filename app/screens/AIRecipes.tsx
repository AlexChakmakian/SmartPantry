import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Image, TouchableOpacity, Modal, Dimensions, Animated } from "react-native";
import { useRouter } from "expo-router";
import { getAuth, signOut } from "firebase/auth"; // Import Firebase auth functions
import { getItems } from "../../firebase/pantryService"; // Import the getItems function from pantryService
import { Ionicons } from '@expo/vector-icons'; // Import Ionicons for the bookmark and chevron icons

const API_KEY = "968acb5051ae4bb6ae3358446d08f8fb";
const { width, height } = Dimensions.get('window');

export default function AIRecipes() {
  const router = useRouter();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [emoji, setEmoji] = useState("");
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isMyFoodOpen, setIsMyFoodOpen] = useState(false); // State for My Food dropdown
  const [bookmarkedRecipes, setBookmarkedRecipes] = useState({}); // Track bookmarked recipes by ID
  const slideAnim = useRef(new Animated.Value(-width)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const emojis = ["📝", "🍔", "🥗", "🌮", "🍝", "🍕", "🍳","🥞", "🍜", "🍰", "🍪", "🍩"];

  const auth = getAuth();

  useEffect(() => {
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    setEmoji(randomEmoji);
  }, []);

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const fetchRecipes = async () => {
    setLoading(true);
    try {
      // Randomize the emoji
      const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
      setEmoji(randomEmoji);

      // Fetch ingredients from Firebase
      const ingredients = await getItems('pantry');
      console.log("Fetched ingredients from Firebase:", ingredients); // Debugging line
      const ingredientNames = ingredients.map(item => item.name).join(',');
      console.log("Ingredients:", ingredientNames); // Debugging line

      // Fetch recipes from Spoonacular API using the ingredients
      const response = await fetch(`https://api.spoonacular.com/recipes/findByIngredients?apiKey=${API_KEY}&ingredients=${ingredientNames}&number=20`);
      const data = await response.json();
      console.log("Spoonacular response:", data); // Debugging line

      if (response.status === 401) {
        console.error("Unauthorized: Check your Spoonacular API key.");
        setRecipes([]);
        return;
      }

      if (data.status === 'failure') {
        console.error("Error fetching recipes:", data.message);
        setRecipes([]);
        return;
      }

      // Fetch detailed information for each recipe
      const detailedRecipes = await Promise.all(data.map(async (recipe, index) => {
        const recipeResponse = await fetch(`https://api.spoonacular.com/recipes/${recipe.id}/information?apiKey=${API_KEY}`);
        const detailedRecipe = await recipeResponse.json();
        console.log("Detailed recipe:", detailedRecipe); // Debugging line
        await delay(1000); // Add a delay to avoid hitting the rate limit
        return detailedRecipe;
      }));

      console.log("Detailed recipes:", detailedRecipes); // Debugging line
      setRecipes(detailedRecipes);
    } catch (error) {
      console.error("Error fetching recipes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  const handleRecipePress = (recipe) => {
    setSelectedRecipe(recipe);
    setModalVisible(true);
  };

  const formatInstructions = (instructions) => {
    if (!instructions) return "No instructions available.";
    return instructions
      .replace(/<\/?[^>]+(>|$)/g, "\n") // Replace HTML tags with new lines
  };

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

  const toggleBookmark = (recipeId, e) => {
    if (e) {
      e.stopPropagation(); // Prevent triggering the parent onPress
    }
    setBookmarkedRecipes(prev => ({
      ...prev,
      [recipeId]: !prev[recipeId]
    }));
  };

  const isBookmarked = (recipeId) => {
    return bookmarkedRecipes[recipeId] || false;
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
        ReciptScanner: "/screens/Recipt-Scanner",
        Settings: "/screens/Settings",
      };
      router.push({
        pathname: paths[page] || "/",
      });
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

      <Image source={require("../../assets/Logo.png")} style={styles.logo} />
      <Text style={styles.title}>Your Recipes {emoji}</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          {recipes.length > 0 ? (
            recipes.map((recipe, index) => (
              <TouchableOpacity key={index} style={styles.recipeContainer} onPress={() => handleRecipePress(recipe)}>
                <View style={styles.recipeHeader}>
                  <Text style={styles.recipeTitle}>{recipe.title}</Text>
                  <TouchableOpacity onPress={(e) => toggleBookmark(recipe.id, e)}>
                    <Ionicons 
                      name={isBookmarked(recipe.id) ? "bookmark" : "bookmark-outline"} 
                      size={24} 
                      color={isBookmarked(recipe.id) ? "gold" : "#333"} 
                    />
                  </TouchableOpacity>
                </View>
                {recipe.image && (
                  <Image source={{ uri: recipe.image }} style={styles.recipeImage} />
                )}
              </TouchableOpacity>
            ))
          ) : (
            <Text>Limit reached. Please try again later!</Text>
          )}
          <View style={styles.spacer} />
        </ScrollView>
      )}

      <TouchableOpacity style={styles.resetButton} onPress={fetchRecipes}>
        <Text style={styles.resetButtonText}>Get New Recipes</Text>
      </TouchableOpacity>

      {selectedRecipe && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <TouchableOpacity 
                style={styles.modalBookmarkIcon} 
                onPress={() => toggleBookmark(selectedRecipe.id)}
              >
                <Ionicons 
                  name={isBookmarked(selectedRecipe.id) ? "bookmark" : "bookmark-outline"} 
                  size={30} 
                  color={isBookmarked(selectedRecipe.id) ? "gold" : "#000"} 
                />
              </TouchableOpacity>
              
              <ScrollView contentContainerStyle={styles.modalScrollViewContent}>
                <Text style={styles.modalTitle}>{selectedRecipe.title}</Text>
                {selectedRecipe.image && (
                  <Image source={{ uri: selectedRecipe.image }} style={styles.modalImage} />
                )}
                <Text style={styles.modalText}>Ingredients 🥕:</Text>
                {selectedRecipe.extendedIngredients && selectedRecipe.extendedIngredients.map((ingredient, index) => (
                  <Text key={index} style={styles.modalText}>{ingredient.original}</Text>
                ))}
                <Text style={styles.modalText}>{"\n"}Instructions 📝:</Text>
                <Text style={styles.modalText}>{formatInstructions(selectedRecipe.instructions)}</Text>
              </ScrollView>
              <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

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
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 50,
    backgroundColor: '#ADD8E6',
  },
  // Add overlay style for closing menu when tapping anywhere
  menuOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
    zIndex: 1,
  },
  logo: {
    width: 85,
    height: 85,
    marginBottom: 10,
    marginTop: -40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollViewContent: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingBottom: 50,
  },
  recipeContainer: {
    marginTop: 20,
    alignItems: 'center',
    width: '90%',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  recipeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  recipeImage: {
    width: '100%',
    height: 250,
    borderRadius: 10,
  },
  recipeInfo: {
    fontSize: 16,
    color: '#333',
    marginTop: 5,
  },
  spacer: {
    height: 50,
  },
  resetButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 20,
    marginBottom: 20,
  },
  resetButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    height: height * 0.75,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalScrollViewContent: {
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    paddingRight: 40,
  },
  modalImage: {
    width: '100%',
    height: 150,
    borderRadius: 10,
    marginBottom: 5,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 5,
  },
  closeButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginTop: 10,
    alignSelf: 'center',
  },
  closeButtonText: {
    color: '#FFF',
    fontSize: 16,
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
  rightPadding: {
    paddingLeft: 20,
  },
  modalBookmarkIcon: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 1,
  },
});