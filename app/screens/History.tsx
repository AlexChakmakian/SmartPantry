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
import { Ionicons } from "@expo/vector-icons";
import SideMenu from "@/components/SideMenu";
import {
  getRecipeHistory,
  clearRecipeHistory,
  removeRecipeFromHistory,
} from "@/firebase/recipeHistoryService";

const API_KEY = "ac72e349e8f84948a669a045f2e972d9";
const { width, height } = Dimensions.get("window");

export default function History() {
  const router = useRouter();
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [recipeDetails, setRecipeDetails] = useState(null);
  const [loadingRecipe, setLoadingRecipe] = useState(false);
  const slideAnim = useRef(new Animated.Value(-width)).current;

  const auth = getAuth();

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const history = await getRecipeHistory();
      console.log("History items:", history);
      setHistoryItems(history);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleRecipePress = async (recipe) => {
    setSelectedRecipe(recipe);
    setModalVisible(true);
    setLoadingRecipe(true);

    try {
      const response = await fetch(
        `https://api.spoonacular.com/recipes/${recipe.id}/information?apiKey=${API_KEY}`
      );
      const detailedRecipe = await response.json();

      const nutritionResponse = await fetch(
        `https://api.spoonacular.com/recipes/${recipe.id}/nutritionWidget.json?apiKey=${API_KEY}`
      );
      const nutritionData = await nutritionResponse.json();

      setRecipeDetails({
        ...detailedRecipe,
        calories: Math.round(
          nutritionData.nutrients.find(
            (nutrient) => nutrient.name === "Calories"
          )?.amount || 0
        ),
        servingSize: nutritionData.weightPerServing,
      });
    } catch (error) {
      console.error("Error fetching recipe details:", error);
      Alert.alert("Error", "Failed to load recipe details");
    } finally {
      setLoadingRecipe(false);
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
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

  const handleClearHistory = async () => {
    Alert.alert(
      "Clear History",
      "Are you sure you want to clear your viewing history?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Clear",
          onPress: async () => {
            try {
              await clearRecipeHistory();
              setHistoryItems([]);
            } catch (error) {
              console.error("Error clearing history:", error);
              Alert.alert("Error", "Failed to clear history");
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const handleRemoveItem = async (id) => {
    try {
      await removeRecipeFromHistory(id);
      setHistoryItems(historyItems.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Error removing item from history:", error);
      Alert.alert("Error", "Failed to remove item from history");
    }
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
        AIRecipes: "/screens/AIRecipes",
      };
      router.push({
        pathname: paths[page] || "/home",
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

      <Image source={require("../../assets/Logo.png")} style={styles.logo} />
      <Text style={styles.title}>Viewing History</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          {historyItems.length > 0 ? (
            historyItems.map((item, index) => (
              <View key={index} style={styles.recipeContainer}>
                <Text style={styles.recipeTitle}>{item.title}</Text>
                {item.image && (
                  <Image
                    source={{ uri: item.image }}
                    style={styles.recipeImage}
                  />
                )}
                <Text style={styles.recipeInfo}>
                  Viewed: {formatDate(item.timestamp)}
                </Text>
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.viewButton}
                    onPress={() => handleRecipePress(item)}
                  >
                    <Text style={styles.buttonText}>View</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveItem(item.id)}
                  >
                    <Text style={styles.buttonText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No viewing history</Text>
          )}
          <View style={styles.spacer} />
        </ScrollView>
      )}

      {historyItems.length > 0 && (
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
                {loadingRecipe ? (
                  <ActivityIndicator
                    size="large"
                    color="#0000ff"
                    style={styles.modalLoader}
                  />
                ) : (
                  recipeDetails && (
                    <>
                      <Text style={styles.modalTitle}>
                        {recipeDetails.title}
                      </Text>
                      {recipeDetails.image && (
                        <Image
                          source={{ uri: recipeDetails.image }}
                          style={styles.modalImage}
                        />
                      )}
                      <Text style={styles.modalText}>
                        Calories: {recipeDetails.calories} cal
                      </Text>
                      <Text style={styles.modalText}>
                        Serving Size: {recipeDetails.servingSize?.amount || ""}{" "}
                        {recipeDetails.servingSize?.unit || ""}
                      </Text>
                      <Text style={styles.modalText}>Ingredients:</Text>
                      {recipeDetails.extendedIngredients &&
                        recipeDetails.extendedIngredients.map(
                          (ingredient, index) => (
                            <Text key={index} style={styles.modalText}>
                              • {ingredient.original}
                            </Text>
                          )
                        )}
                      <Text style={styles.modalText}>Instructions:</Text>
                      <Text style={styles.modalText}>
                        {formatInstructions(recipeDetails.instructions)}
                      </Text>
                    </>
                  )
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
  logo: {
    width: 85,
    height: 85,
    marginBottom: 10,
    marginTop: -40,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  scrollViewContent: {
    alignItems: "center",
    paddingVertical: 20,
    paddingBottom: 50,
  },
  recipeContainer: {
    marginTop: 10,
    marginBottom: 10,
    alignItems: "center",
    width: "90%",
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
  recipeInfo: {
    fontSize: 16,
    color: "#555",
    marginBottom: 10,
  },
  recipeImage: {
    width: "100%",
    height: 250, // Increase the height of the recipe image
    borderRadius: 10,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 10,
  },
  viewButton: {
    backgroundColor: "#007BFF",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 5,
    minWidth: 100,
    alignItems: "center",
  },
  removeButton: {
    backgroundColor: "#DC3545",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 5,
    minWidth: 100,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  spacer: {
    height: 50,
  },
  clearButton: {
    backgroundColor: "#DC3545",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 5,
    marginBottom: 20,
  },
  clearButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  emptyText: {
    fontSize: 18,
    color: "#555",
    marginTop: 30,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "90%",
    height: height * 0.75, // Set the height to 75% of the screen height
    backgroundColor: "#fff",
    padding: 10, // Reduced padding
    borderRadius: 10,
    alignItems: "center",
  },
  modalScrollViewContent: {
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5, // Reduced margin
    paddingRight: 40, // Add right padding to make room for the bookmark icon
  },
  modalImage: {
    width: "100%",
    height: 150, // Reduced height
    borderRadius: 10,
    marginBottom: 5, // Reduced margin
  },
  modalText: {
    fontSize: 16,
    marginBottom: 5,
  },
  closeButton: {
    backgroundColor: "#007BFF",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 10,
    alignSelf: "center",
  },
  closeButtonText: {
    color: "#FFF",
    fontWeight: "bold",
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
  modalLoader: {
    marginVertical: 30,
  },
});
