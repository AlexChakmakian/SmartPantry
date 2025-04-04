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
  removeRecipeFromHistory,
} from "@/firebase/recipeHistoryService";
import {
  GestureHandlerRootView,
  Swipeable,
} from "react-native-gesture-handler";
import AnimatedSideMenu from "@/components/SideMenu";

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
    <TouchableOpacity
      style={styles.deleteButton}
      onPress={() => {
        Alert.alert(
          "Delete Item",
          "Are you sure you want to remove this recipe from history?",
          [
            {
              text: "Cancel",
              style: "cancel",
            },
            {
              text: "Delete",
              style: "destructive",
              onPress: () => handleRemoveItem(id),
            },
          ]
        );
      }}
    >
      <Text style={styles.deleteButtonText}>Delete</Text>
    </TouchableOpacity>
  );

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
      router.push({
        pathname: paths[page] || "/home",
      });
    }
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
                >
                  <TouchableOpacity
                    style={styles.recipeContainer}
                    onPress={() => handleRecipePress(item)}
                  >
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
                  </TouchableOpacity>
                </Swipeable>
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
                        <Text style={styles.modalText}>
                          Calories: {recipeDetails.calories} cal
                        </Text>
                        <Text style={styles.modalText}>
                          Serving Size:{" "}
                          {recipeDetails.servingSize?.amount || ""}{" "}
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
  // Add overlay style for closing menu when tapping anywhere
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
  scrollViewContent: {
    alignItems: "center",
    paddingVertical: 20,
    paddingBottom: 50,
  },
  recipeContainer: {
    marginTop: 10,
    marginBottom: 10,
    alignItems: "center",
    minHeight: 200,
    width: "95%",
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
    height: 150,
    borderRadius: 10,
    marginBottom: 10,
  },
  deleteButton: {
    backgroundColor: "#FF3B30",
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    height: "100%",
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
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
    height: height * 0.75,
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  modalScrollViewContent: {
    alignItems: "center",
    // width: "100%",
    // paddingHorizontal: 10,
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
  modalLoader: {
    marginVertical: 30,
  },
});
