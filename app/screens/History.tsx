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
import { Ionicons as Icon } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getAuth, signOut } from "firebase/auth";
import {
  getRecipeHistory,
  clearRecipeHistory,
  removeRecipeFromHistory,
} from "@/firebase/recipeHistoryService";
import {
  GestureHandlerRootView,
  Swipeable,
} from "react-native-gesture-handler";
import AnimatedSideMenu from "@/components/SideMenu";
import { LinearGradient } from "expo-linear-gradient";

const API_KEY = "b90e71d18a854a71b40b917b255177a3";
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
  const rotateAnim = useRef(new Animated.Value(0)).current;

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
        // Use the image from history if API doesn't return one
        image: detailedRecipe.image || recipe.image,
        calories: Math.round(
          nutritionData.nutrients.find(
            (nutrient) => nutrient.name === "Calories"
          )?.amount || 0
        ),
        servingSize: nutritionData.weightPerServing,
      });
    } catch (error) {
      console.error("Error fetching recipe details:", error);
      // Set fallback data if API call fails
      setRecipeDetails({
        ...recipe,
        extendedIngredients: [],
        instructions: "Failed to load detailed instructions.",
        calories: 0,
        servingSize: { amount: 0, unit: "" },
      });
      Alert.alert("Error", "Failed to load complete recipe details");
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
    // Animated.timing(slideAnim, {
    //   toValue: isMenuOpen ? -width : 0,
    //   duration: 300,
    //   useNativeDriver: true,
    // }).start();
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

  const renderRightActions = (id) => (
    <View style={styles.deleteButtonContainer}>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => {
          Alert.alert(
            "Delete Item",
            "Are you sure you want to remove this recipe from history?",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Delete",
                style: "destructive",
                onPress: () => handleRemoveItem(id),
              },
            ]
          );
        }}
      >
        <Icon name="trash-outline" size={24} color="#fff" />
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

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
        <Text style={styles.title}>Viewing History</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : (
          <ScrollView contentContainerStyle={styles.scrollViewContent}>
            {historyItems.length > 0 ? (
              historyItems.map((item, index) => (
                <Swipeable
                  key={index}
                  renderRightActions={() => renderRightActions(item.id)}
                  containerStyle={styles.swipeableContainer}
                >
                  <TouchableOpacity
                    style={styles.recipeCardContainer}
                    onPress={() => handleRecipePress(item)}
                    activeOpacity={0.9}
                  >
                    <View style={styles.recipeCard}>
                      <View style={styles.imageContainer}>
                        {item.image ? (
                          <Image
                            source={{ uri: item.image }}
                            style={styles.recipeImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={styles.placeholder} />
                        )}
                        <LinearGradient
                          colors={["transparent", "rgba(0,0,0,0.8)"]}
                          style={styles.imageOverlay}
                        />
                        <Text style={styles.imageTitle}>{item.title}</Text>
                        <Text style={styles.imageDescription}>
                          Viewed: {formatDate(item.timestamp)}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </Swipeable>
              ))
            ) : (
              <Text style={styles.emptyText}>No viewing history</Text>
            )}
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
                {loadingRecipe ? (
                  <ActivityIndicator
                    size="large"
                    color="#0000ff"
                    style={styles.modalLoader}
                  />
                ) : recipeDetails ? (
                  <ScrollView
                    contentContainerStyle={styles.modalScrollViewContent}
                    showsVerticalScrollIndicator={true}
                  >
                    <Text style={styles.modalTitle}>{recipeDetails.title}</Text>
                    {recipeDetails.image && (
                      <Image
                        source={{ uri: recipeDetails.image }}
                        style={styles.modalImage}
                      />
                    )}
                    <Text style={styles.sectionTitle}>Ingredients 🥕:</Text>
                    <View style={styles.ingredientsContainer}>
                      {recipeDetails.extendedIngredients?.length > 0 ? (
                        recipeDetails.extendedIngredients.map(
                          (ingredient, index) => (
                            <Text key={index} style={styles.ingredientItem}>
                              <Text style={{ fontWeight: "bold" }}>•</Text>{" "}
                              {ingredient.original}
                            </Text>
                          )
                        )
                      ) : (
                        <Text style={styles.ingredientItem}>
                          No ingredients available
                        </Text>
                      )}
                    </View>
                    <Text style={styles.sectionTitle}>Instructions 👨‍🍳:</Text>
                    <View style={styles.instructionsContainer}>
                      {recipeDetails.analyzedInstructions?.length > 0 ? (
                        recipeDetails.analyzedInstructions[0].steps.map(
                          (step, idx) => (
                            <View key={idx} style={styles.instructionRow}>
                              <Text style={styles.stepNumber}>{idx + 1}.</Text>
                              <Text style={styles.instructionText}>
                                {step.step}
                              </Text>
                            </View>
                          )
                        )
                      ) : recipeDetails.instructions ? (
                        <Text style={styles.instructionText}>
                          {formatInstructions(recipeDetails.instructions)}
                        </Text>
                      ) : (
                        <Text style={styles.instructionText}>
                          No instructions available
                        </Text>
                      )}
                    </View>
                    <View style={{ height: 60 }} />
                  </ScrollView>
                ) : (
                  <Text style={styles.errorText}>
                    Failed to load recipe details
                  </Text>
                )}
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
        <AnimatedSideMenu
          isMenuOpen={isMenuOpen}
          onClose={() => setMenuOpen(false)}
        />
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  scrollViewContent: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 20,
    paddingBottom: 50,
  },

  swipeableContainer: {
    width: width * 0.92,
    marginVertical: 6,
  },

  recipeCardContainer: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    backgroundColor: "#fff",
  },

  recipeCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    overflow: "hidden",
    padding: 0,
  },

  imageContainer: {
    width: "100%",
    height: 150,
    position: "relative",
  },

  recipeImage: {
    width: "100%",
    height: "100%",
  },

  placeholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#E0E0E0",
  },

  imageOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "100%",
  },

  imageTitle: {
    position: "absolute",
    bottom: 30,
    left: 15,
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    zIndex: 2,
  },

  imageDescription: {
    position: "absolute",
    bottom: 10,
    left: 15,
    paddingRight: 15,
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    zIndex: 2,
    opacity: 0.9,
  },

  deleteButtonContainer: {
    width: 80,
    height: "100%",
  },

  deleteButton: {
    backgroundColor: "#FF3B30",
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
  },

  deleteButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },

  emptyText: {
    fontSize: 18,
    color: "#555",
    marginTop: 30,
    textAlign: "center",
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
    backgroundColor: "#C1E0EC",
  },
  logo: {
    width: 85,
    height: 85,
    marginBottom: 10,
    marginTop: -40,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
    zIndex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
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
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
    textAlign: "center",
  },
  modalImage: {
    width: "100%",
    height: 150,
    borderRadius: 10,
    marginBottom: 5,
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
    zIndex: 0,
  },
  errorText: {
    fontSize: 16,
    color: "#FF3B30",
    textAlign: "center",
    marginVertical: 20,
  },
  modalLoader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 10,
    color: "#333",
    textAlign: "center",
  },

  ingredientsContainer: {
    width: "100%",
    paddingHorizontal: 10,
  },

  ingredientItem: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 5,
    textAlign: "left",
  },

  instructionsContainer: {
    width: "100%",
    paddingHorizontal: 10,
  },

  instructionRow: {
    flexDirection: "row",
    marginBottom: 8,
    alignItems: "flex-start",
  },

  stepNumber: {
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 8,
    color: "#333",
  },

  instructionText: {
    fontSize: 16,
    lineHeight: 22,
    flex: 1,
    color: "#333",
  },

  // closeButton: {
  //   backgroundColor: "#007BFF",
  //   paddingVertical: 8,
  //   paddingHorizontal: 20,
  //   borderRadius: 5,
  //   marginTop: 10,
  //   alignSelf: "center",
  // },

  // closeButtonText: {
  //   color: "#FFF",
  //   fontWeight: "bold",
  //   fontSize: 16,
  // },
});
