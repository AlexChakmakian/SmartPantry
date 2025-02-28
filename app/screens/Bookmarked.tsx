import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Image, TouchableOpacity, Modal, Dimensions, Animated } from "react-native";
import { useRouter } from "expo-router";
import { getAuth, signOut } from "firebase/auth";
import { getItems } from "../../firebase/pantryService";

const API_KEY = "b90e71d18a854a71b40b917b255177a3";
const { width, height } = Dimensions.get('window');

export default function History() {
  const router = useRouter();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isMenuOpen, setMenuOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-width)).current;

  const auth = getAuth();

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    setLoading(true);
    try {
      const ingredients = await getItems('pantry');
      const ingredientNames = ingredients.map(item => item.name).join(',');

      const response = await fetch(`https://api.spoonacular.com/recipes/findByIngredients?apiKey=${API_KEY}&ingredients=${ingredientNames}&number=20`);
      const data = await response.json();

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

      const detailedRecipes = await Promise.all(data.map(async (recipe) => {
        const recipeResponse = await fetch(`https://api.spoonacular.com/recipes/${recipe.id}/information?apiKey=${API_KEY}`);
        const detailedRecipe = await recipeResponse.json();
        return detailedRecipe;
      }));

      setRecipes(detailedRecipes);
    } catch (error) {
      console.error("Error fetching recipes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecipePress = (recipe) => {
    setSelectedRecipe(recipe);
    setModalVisible(true);
  };

  const formatInstructions = (instructions) => {
    if (!instructions) return "No instructions available.";
    return instructions.replace(/<\/?[^>]+(>|$)/g, "\n");
  };

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
        router.push("/");
      } catch (error) {
        console.error("Error signing out:", error);
      }
    } else {
      const paths = {
        Home: "/home",
        Appliances: "/screens/Appliances",
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
    <View style={styles.container}>
      <TouchableOpacity style={styles.hamburger} onPress={toggleMenu}>
        <View style={styles.line} />
        <View style={styles.line} />
        <View style={styles.line} />
      </TouchableOpacity>

      <Text style={styles.title}>Recipe History</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          {recipes.length > 0 ? (
            recipes.map((recipe, index) => (
              <TouchableOpacity key={index} style={styles.recipeContainer} onPress={() => handleRecipePress(recipe)}>
                <Text style={styles.recipeTitle}>{recipe.title}</Text>
                {recipe.image && (
                  <Image source={{ uri: recipe.image }} style={styles.recipeImage} />
                )}
              </TouchableOpacity>
            ))
          ) : (
            <Text>No recipes found.</Text>
          )}
          <View style={styles.spacer} />
        </ScrollView>
      )}

      {selectedRecipe && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <ScrollView contentContainerStyle={styles.modalScrollViewContent}>
                <Text style={styles.modalTitle}>{selectedRecipe.title}</Text>
                {selectedRecipe.image && (
                  <Image source={{ uri: selectedRecipe.image }} style={styles.modalImage} />
                )}
                <Text style={styles.modalText}>Ingredients:</Text>
                {selectedRecipe.extendedIngredients && selectedRecipe.extendedIngredients.map((ingredient, index) => (
                  <Text key={index} style={styles.modalText}>{ingredient.original}</Text>
                ))}
                <Text style={styles.modalText}>Instructions:</Text>
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
        <TouchableOpacity onPress={() => handleMenuSelect("AIRecipes")} disabled>
          <Text style={styles.menuText}>AI Recipes</Text>
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
  recipeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  recipeImage: {
    width: '100%',
    height: 250,
    borderRadius: 10,
  },
  spacer: {
    height: 50,
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
    fontSize: 18,
    color: 'red',
    marginVertical: 10,
  },
    rightPadding: {
    paddingLeft: 20, // Adjust the value as needed
  },
});