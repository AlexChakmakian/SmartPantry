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
import { getBookmarks, removeBookmark } from "@/firebase/bookmarkService";
import { addRecipeToHistory } from "@/firebase/recipeHistoryService";
import AnimatedSideMenu from "@/components/SideMenu";
import { Ionicons } from "@expo/vector-icons";
import {
  Swipeable,
  GestureHandlerRootView,
} from "react-native-gesture-handler";

const API_KEY = "ea48a472f7df4ebd9c8c5301c6f0b042";
const { width, height } = Dimensions.get("window");

export default function Bookmarked() {
  const router = useRouter();
  const [bookmarkedItems, setBookmarkedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [recipeDetails, setRecipeDetails] = useState(null);
  const [loadingRecipe, setLoadingRecipe] = useState(false);
  const slideAnim = useRef(new Animated.Value(-width)).current;

  const auth = getAuth();

  const fetchBookmarks = async () => {
    setLoading(true);
    try {
      const bookmarks = await getBookmarks();
      console.log("Bookmarked items:", bookmarks);
      setBookmarkedItems(bookmarks);
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const handleRecipePress = async (recipe) => {
    setSelectedRecipe(recipe);
    setModalVisible(true);
    setLoadingRecipe(true);

    try {
      // Add to recipe history
      addRecipeToHistory({
        id: recipe.id,
        title: recipe.title,
        image: recipe.image,
      }).catch((err) => console.error("Failed to log recipe to history", err));

      // First, fetch basic recipe information
      const response = await fetch(
        `https://api.spoonacular.com/recipes/${recipe.id}/information?apiKey=${API_KEY}`
      );
      const detailedRecipe = await response.json();

      // Log the structure to see what we're getting
      console.log("Recipe details structure:", Object.keys(detailedRecipe));

      // Initialize recipeDetails with the info we already have
      let recipeInfo = {
        ...detailedRecipe,
        calories: 0,
        servingSize: { amount: 0, unit: "g" },
      };

      try {
        // Now try to fetch nutrition data separately
        const nutritionResponse = await fetch(
          `https://api.spoonacular.com/recipes/${recipe.id}/nutritionWidget.json?apiKey=${API_KEY}`
        );

        // Check if the response is OK
        if (nutritionResponse.ok) {
          const nutritionData = await nutritionResponse.json();
          console.log("Nutrition data structure:", Object.keys(nutritionData));

          // Safely extract calories
          if (
            nutritionData.nutrients &&
            Array.isArray(nutritionData.nutrients)
          ) {
            const calorieInfo = nutritionData.nutrients.find(
              (nutrient) => nutrient.name === "Calories"
            );

            if (calorieInfo && typeof calorieInfo.amount === "number") {
              recipeInfo.calories = Math.round(calorieInfo.amount);
            }
          } else if (nutritionData.calories) {
            // Some API versions might return calories directly
            recipeInfo.calories = Math.round(nutritionData.calories);
          }

          // Safely extract serving size
          if (nutritionData.weightPerServing) {
            recipeInfo.servingSize = nutritionData.weightPerServing;
          }
        } else {
          console.log(
            "Nutrition API returned error status:",
            nutritionResponse.status
          );
        }
      } catch (nutritionError) {
        // If nutrition data fails, we can still show the recipe without it
        console.error("Error fetching nutrition data:", nutritionError);
        // Continue with the basic recipe info we already have
      }

      // Update state with our combined data
      setRecipeDetails(recipeInfo);
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
  };

  const handleRemoveBookmark = async (id) => {
    try {
      await removeBookmark(id);
      setBookmarkedItems(bookmarkedItems.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Error removing bookmark:", error);
      Alert.alert("Error", "Failed to remove bookmark");
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
        AIRecipes: "/screens/AIRecipes",
        History: "/screens/History",
        Pantry: "/screens/Pantry",
        Fridge: "/screens/Fridge",
        Freezer: "/screens/Freezer",
        Spices: "/screens/Spices",
      };
      router.push({
        pathname: paths[page] || "/home",
      });
    }
  };

  const renderRightActions = (recipeId) => {
    return (
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={() => handleRemoveBookmark(recipeId)}
      >
        <Ionicons name="trash-outline" size={24} color="#fff" />
        <Text style={styles.deleteActionText}>Delete</Text>
      </TouchableOpacity>
    );
  };

  const isBookmarked = (id) => {
    return bookmarkedItems.some((item) => item.id === id);
  };

  const toggleBookmark = async (id) => {
    // Since we're in the bookmarked screen, this would just remove the bookmark
    await handleRemoveBookmark(id);
    setModalVisible(false);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
        <Text style={styles.title}>Bookmarked Recipes</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : (
          <ScrollView contentContainerStyle={styles.scrollViewContent}>
            {bookmarkedItems.length > 0 ? (
              bookmarkedItems.map((item, index) => (
                <Swipeable
                  key={index}
                  renderRightActions={() => renderRightActions(item.id)}
                >
                  <TouchableOpacity
                    style={styles.recipeContainer}
                    onPress={() => handleRecipePress(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.recipeTitle}>{item.title}</Text>
                    {item.image && (
                      <Image
                        source={{ uri: item.image }}
                        style={styles.recipeImage}
                      />
                    )}
                    <Text style={styles.recipeInfo}>
                      Bookmarked: {formatDate(item.timestamp)}
                    </Text>
                    <View style={styles.swipeIndicator}>
                      <Ionicons name="chevron-back" size={16} color="#ccc" />
                    </View>
                  </TouchableOpacity>
                </Swipeable>
              ))
            ) : (
              <Text style={styles.emptyText}>No bookmarked recipes</Text>
            )}

            {bookmarkedItems.length > 0 && (
              <Text style={styles.instructionText}>
                Tip: Tap a recipe to view details or swipe left to delete
              </Text>
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
                <TouchableOpacity
                  style={styles.modalBookmarkIcon}
                  onPress={() => toggleBookmark(selectedRecipe.id)}
                >
                  <Ionicons
                    name={
                      isBookmarked(selectedRecipe.id)
                        ? "bookmark"
                        : "bookmark-outline"
                    }
                    size={30}
                    color={isBookmarked(selectedRecipe.id) ? "gold" : "#000"}
                  />
                </TouchableOpacity>

                <ScrollView
                  contentContainerStyle={styles.modalScrollViewContent}
                >
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

                        {/* Safely display calories */}
                        <Text style={styles.modalText}>
                          Calories:{" "}
                          {recipeDetails.calories > 0
                            ? `${recipeDetails.calories} cal`
                            : "Not available"}
                        </Text>

                        {/* Safely display serving size */}
                        <Text style={styles.modalText}>
                          Serving Size:{" "}
                          {recipeDetails.servingSize?.amount
                            ? `${recipeDetails.servingSize.amount} ${
                                recipeDetails.servingSize.unit || ""
                              }`
                            : "Not available"}
                        </Text>

                        <Text style={styles.modalText}>Ingredients:</Text>
                        {recipeDetails.extendedIngredients &&
                        recipeDetails.extendedIngredients.length > 0 ? (
                          recipeDetails.extendedIngredients.map(
                            (ingredient, index) => (
                              <Text key={index} style={styles.modalText}>
                                • {ingredient.original}
                              </Text>
                            )
                          )
                        ) : (
                          <Text style={styles.modalText}>
                            No ingredient information available
                          </Text>
                        )}

                        <Text style={styles.modalText}>Instructions:</Text>
                        <Text style={styles.modalText}>
                          {formatInstructions(recipeDetails.instructions) ||
                            "No instructions available"}
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

        {/* <Animated.View
        style={[
          styles.menuContainer,
          { transform: [{ translateX: slideAnim }] },
        ]}
      >
        <SideMenu onSelectMenuItem={handleMenuSelect} />
      </Animated.View> */}
        {/* Animated Side Menu */}
        <AnimatedSideMenu
          isMenuOpen={isMenuOpen}
          onClose={() => setMenuOpen(false)}
        />
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  deleteAction: {
    backgroundColor: "#DC3545",
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    height: "100%",
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },
  deleteActionText: {
    color: "#fff",
    fontWeight: "bold",
    marginTop: 4,
  },
  swipeIndicator: {
    position: "absolute",
    right: 10,
    top: "50%",
    marginTop: -8,
    opacity: 0.5,
  },
  instructionText: {
    fontSize: 14,
    color: "#555",
    fontStyle: "italic",
    marginTop: 20,
    marginBottom: 10,
    opacity: 0.8,
  },
  menuOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
    zIndex: 1,
  },

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
  recipeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 10,
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
    height: 150,
    borderRadius: 10,
    marginBottom: 10,
  },
  recipeInfo: {
    fontSize: 16,
    color: "#555",
    marginBottom: 10,
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
    height: height * 0.75,
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  modalScrollViewContent: {
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  modalImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 5,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
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
    zIndex: 5,
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
  modalLoader: {
    marginVertical: 30,
  },
});
