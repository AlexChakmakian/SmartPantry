import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Image,
  TouchableOpacity,
  Modal,
  Dimensions,
  Animated,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { getAuth, signOut } from "firebase/auth";
import {
  getRecipeHistory,
  clearRecipeHistory,
} from "../../firebase/recipeHistoryService";
import SideMenu from "@/components/SideMenu";

const API_KEY = "b90e71d18a854a71b40b917b255177a3"; // Your API key
const { width, height } = Dimensions.get("window");

export default function History() {
  const router = useRouter();
  const [recipeHistory, setRecipeHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [recipeDetails, setRecipeDetails] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const slideAnim = useRef(new Animated.Value(-width)).current;

  const auth = getAuth();

  useEffect(() => {
    fetchRecipeHistory();
  }, []);

  const fetchRecipeHistory = async () => {
    setHistoryLoading(true);
    try {
      const history = await getRecipeHistory();
      setRecipeHistory(history);
    } catch (error) {
      console.error("Error fetching recipe history:", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleClearHistory = async () => {
    Alert.alert(
      "Clear History",
      "Are you sure you want to clear your recipe history?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            try {
              await clearRecipeHistory();
              setRecipeHistory([]);
              Alert.alert("Success", "Recipe history cleared.");
            } catch (error) {
              console.error("Error clearing history:", error);
              Alert.alert("Error", "Failed to clear recipe history.");
            }
          },
        },
      ]
    );
  };

  const fetchRecipeDetails = async (recipeId) => {
    setIsLoadingDetails(true);
    try {
      // Fetch detailed recipe information
      const recipeResponse = await fetch(
        `https://api.spoonacular.com/recipes/${recipeId}/information?apiKey=${API_KEY}`
      );
      const detailedRecipe = await recipeResponse.json();

      // Get nutrition information
      const nutritionResponse = await fetch(
        `https://api.spoonacular.com/recipes/${recipeId}/nutritionWidget.json?apiKey=${API_KEY}`
      );
      const nutritionData = await nutritionResponse.json();

      // Combine the data
      const combinedData = {
        ...detailedRecipe,
        calories: Math.round(
          nutritionData.nutrients.find(
            (nutrient) => nutrient.name === "Calories"
          )?.amount || 0
        ),
        servingSize: nutritionData.weightPerServing || { amount: 0, unit: "g" },
        estimatedServings:
          detailedRecipe.servings > 1
            ? `${detailedRecipe.servings - 1}-${detailedRecipe.servings}`
            : "1",
      };

      return combinedData;
    } catch (error) {
      console.error("Error fetching recipe details:", error);
      return null;
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleRecipePress = async (recipe) => {
    setSelectedRecipe(recipe);
    setRecipeDetails(null);
    setModalVisible(true);

    // Fetch full recipe details when a history item is clicked
    const details = await fetchRecipeDetails(recipe.id);
    if (details) {
      setRecipeDetails(details);
    } else {
      Alert.alert(
        "Error",
        "Could not retrieve recipe details. This might be due to API limits or connectivity issues."
      );
    }
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
        AIRecipes: "/screens/AIRecipes",
        Appliances: "/screens/Appliances",
        Freezer: "/screens/Freezer",
        Fridge: "/screens/Fridge",
        Pantry: "/screens/Pantry",
        Spices: "/screens/Spices",
        Bookmarked: "/screens/Bookmarked",
        ReciptScanner: "/screens/Recipt-Scanner",
      };
      router.push({
        pathname: paths[page] || "/home",
      });
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.hamburger} onPress={toggleMenu}>
        <View style={styles.line} />
        <View style={styles.line} />
        <View style={styles.line} />
      </TouchableOpacity>

      <Text style={styles.title}>Recipe History</Text>

      {historyLoading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          {recipeHistory.length > 0 ? (
            recipeHistory.map((recipe, index) => (
              <TouchableOpacity
                key={index}
                style={styles.recipeContainer}
                onPress={() => handleRecipePress(recipe)}
              >
                <Text style={styles.recipeTitle}>{recipe.title}</Text>
                {recipe.image && (
                  <Image
                    source={{ uri: recipe.image }}
                    style={styles.recipeImage}
                  />
                )}
                <Text style={styles.timestampText}>
                  Viewed: {formatDate(recipe.timestamp)}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No recipe history found.</Text>
              <Text style={styles.emptySubtext}>
                View recipes in the AI Recipes section to see your history here.
              </Text>
            </View>
          )}
          <View style={styles.spacer} />
        </ScrollView>
      )}

      {recipeHistory.length > 0 && (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={handleClearHistory}
        >
          <Text style={styles.clearButtonText}>Clear History</Text>
        </TouchableOpacity>
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
                  <Image
                    source={{ uri: selectedRecipe.image }}
                    style={styles.modalImage}
                  />
                )}

                {isLoadingDetails ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#0066cc" />
                    <Text style={styles.loadingText}>
                      Loading recipe details...
                    </Text>
                  </View>
                ) : recipeDetails ? (
                  <>
                    <Text style={styles.modalText}>
                      Calories: {recipeDetails.calories} cal
                    </Text>
                    <Text style={styles.modalText}>
                      Serving Size: {recipeDetails.servingSize.amount}{" "}
                      {recipeDetails.servingSize.unit}
                    </Text>
                    <Text style={styles.modalText}>Ingredients:</Text>
                    {recipeDetails.extendedIngredients &&
                      recipeDetails.extendedIngredients.map(
                        (ingredient, index) => (
                          <Text key={index} style={styles.modalText}>
                            {ingredient.original}
                          </Text>
                        )
                      )}
                    <Text style={styles.modalText}>Instructions:</Text>
                    <Text style={styles.modalText}>
                      {formatInstructions(recipeDetails.instructions)}
                    </Text>
                  </>
                ) : (
                  <Text style={styles.modalText}>
                    Recipe details could not be loaded. Please try again later.
                  </Text>
                )}
              </ScrollView>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
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
        <SideMenu onSelectMenuItem={handleMenuSelect} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 50,
    backgroundColor: "#ADD8E6",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginTop: 20,
    marginBottom: 10,
  },
  scrollViewContent: {
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 15,
    paddingBottom: 80,
    width: "100%",
  },
  recipeContainer: {
    marginBottom: 20,
    alignItems: "center",
    width: "100%",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  recipeTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  recipeImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },
  timestampText: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
    marginTop: 5,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  spacer: {
    height: 50,
  },
  clearButton: {
    position: "absolute",
    bottom: 20,
    backgroundColor: "#e74c3c",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  clearButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "90%",
    height: height * 0.75,
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  modalScrollViewContent: {
    alignItems: "center",
    paddingHorizontal: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  modalImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginBottom: 15,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 8,
    alignSelf: "flex-start",
  },
  closeButton: {
    backgroundColor: "#007BFF",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 15,
  },
  closeButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
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
});
