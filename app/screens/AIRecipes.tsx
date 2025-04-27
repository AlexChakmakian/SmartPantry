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
  TextInput,
  TouchableWithoutFeedback,
} from "react-native";
import { useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import { getItems } from "../../firebase/pantryService";
import { Ionicons } from "@expo/vector-icons";
import { addRecipeToHistory } from "@/firebase/recipeHistoryService";
import {
  addBookmark,
  removeBookmark,
  isRecipeBookmarked,
} from "@/firebase/bookmarkService";
import AnimatedSideMenu from "@/components/SideMenu";
import { LinearGradient } from "expo-linear-gradient";

const API_KEY = "b90e71d18a854a71b40b917b255177a3";
const { width, height } = Dimensions.get("window");

const CUISINES = [
  "All",
  "African",
  "Asian",
  "American",
  "British",
  "Cajun",
  "Caribbean",
  "Chinese",
  "Eastern European",
  "European",
  "French",
  "German",
  "Greek",
  "Indian",
  "Irish",
  "Italian",
  "Japanese",
  "Jewish",
  "Korean",
  "Latin American",
  "Mediterranean",
  "Mexican",
  "Middle Eastern",
  "Nordic",
  "Southern",
  "Spanish",
  "Thai",
  "Vietnamese",
];

export default function AIRecipes() {
  const router = useRouter();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [emoji, setEmoji] = useState("");
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [bookmarkedRecipes, setBookmarkedRecipes] = useState({});
  const [selectedCuisine, setSelectedCuisine] = useState("All");
  const [showCuisineDropdown, setShowCuisineDropdown] = useState(false);

  // Craving functionality state
  const [cravings, setCravings] = useState([]);
  const [cravingModalVisible, setCravingModalVisible] = useState(false);
  const [cravingInput, setCravingInput] = useState("");

  const slideAnim = useRef(new Animated.Value(-width)).current;

  const emojis = [
    "📝",
    "🍔",
    "🥗",
    "🌮",
    "🍝",
    "🍕",
    "🍳",
    "🥞",
    "🍜",
    "🍰",
    "🍪",
    "🍩",
  ];

  const auth = getAuth();

  useEffect(() => {
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    setEmoji(randomEmoji);
  }, []);

  useEffect(() => {
    console.log("Recipes state:", recipes);
  }, [recipes]);

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const getMatchLevel = (percentage) => {
    const adjustedPercentage = Math.min(100, percentage + 15);
    if (adjustedPercentage >= 80) return "perfect";
    if (adjustedPercentage >= 50) return "close";
    return "missing";
  };

  const fetchRecipes = async () => {
    setLoading(true);
    try {
      const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
      setEmoji(randomEmoji);

      const pantryItems = (await getItems("pantry")) || [];
      const fridgeItems = (await getItems("fridge")) || [];
      const freezerItems = (await getItems("freezer")) || [];
      const spicesItems = (await getItems("spices")) || [];
      const allIngredients = [
        ...pantryItems,
        ...fridgeItems,
        ...freezerItems,
        ...spicesItems,
      ];

      // Merge existing ingredients with cravings
      const existingIngredientNames = allIngredients.map((item) => item.name);
      const combinedIngredients = [...existingIngredientNames, ...cravings];
      const ingredientNames = combinedIngredients.join(",");

      console.log("Ingredients for API:", ingredientNames);

      let apiUrl = `https://api.spoonacular.com/recipes/complexSearch?apiKey=${API_KEY}&includeIngredients=${ingredientNames}&fillIngredients=true&addRecipeInformation=true&number=6&sort=max-used-ingredients&instructionsRequired=true`;
      if (selectedCuisine !== "All") {
        apiUrl += `&cuisine=${selectedCuisine}`;
      }
      console.log("Fetching recipes with URL:", apiUrl);
      const response = await fetch(apiUrl);
      if (!response.ok) {
        console.error(`API responded with status: ${response.status}`);
        const textResponse = await response.text();
        console.error("API error response:", textResponse);
        setRecipes([]);
        setLoading(false);
        return;
      }
      const responseText = await response.text();
      console.log(
        "API response text first 100 chars:",
        responseText.substring(0, 100)
      );
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse JSON response:", e);
        console.error("Response text:", responseText);
        setRecipes([]);
        setLoading(false);
        return;
      }
      if (response.status === 401) {
        console.error("Unauthorized: Check your Spoonacular API key.");
        setRecipes([]);
        return;
      }
      if (data.status === "failure") {
        console.error("Error fetching recipes:", data.message);
        setRecipes([]);
        return;
      }
      if (data.results && data.results.length > 0) {
        // Filter out recipes that don't have an image
        const recipesWithImage = data.results.filter((recipe) => recipe.image);
        const processedRecipes = recipesWithImage.map((recipe) => {
          const usedCount = recipe.usedIngredientCount || 0;
          const missedCount = recipe.missedIngredientCount || 0;
          const totalCount = usedCount + missedCount;
          const matchPercentage =
            totalCount > 0 ? (usedCount / totalCount) * 100 : 0;
          const adjustedPercentage = Math.min(100, matchPercentage + 15);
          recipe.matchInfo = {
            used: usedCount,
            missed: missedCount,
            total: totalCount,
            percentage: matchPercentage,
            displayPercentage: adjustedPercentage,
            matchLevel: getMatchLevel(matchPercentage),
          };
          return recipe;
        });
        const sortedRecipes = processedRecipes.sort((a, b) => {
          const levelOrder = { perfect: 0, close: 1, missing: 2 };
          const levelDiff =
            levelOrder[a.matchInfo.matchLevel] -
            levelOrder[b.matchInfo.matchLevel];
          if (levelDiff !== 0) {
            return levelDiff;
          }
          return b.matchInfo.percentage - a.matchInfo.percentage;
        });
        setRecipes(sortedRecipes);
      } else {
        console.log("No recipes found for the selected criteria");
        setRecipes([]);
      }
    } catch (error) {
      console.error("Error fetching recipes:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecipesAlternative = async () => {
    try {
      const pantryItems = (await getItems("pantry")) || [];
      const fridgeItems = (await getItems("fridge")) || [];
      const freezerItems = (await getItems("freezer")) || [];
      const spicesItems = (await getItems("spices")) || [];
      const allIngredients = [
        ...pantryItems,
        ...fridgeItems,
        ...freezerItems,
        ...spicesItems,
      ];
      const existingIngredientNames = allIngredients.map((item) => item.name);
      const combinedIngredients = [...existingIngredientNames, ...cravings];
      const ingredientNames = combinedIngredients.join(",");

      const apiUrl = `https://api.spoonacular.com/recipes/findByIngredients?apiKey=${API_KEY}&ingredients=${ingredientNames}&number=6`;
      console.log("Trying alternative endpoint:", apiUrl);
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const recipesWithImage = data.filter((recipe) => recipe.image);
        const detailedRecipes = await Promise.all(
          recipesWithImage.map(async (recipe) => {
            try {
              const detailResponse = await fetch(
                `https://api.spoonacular.com/recipes/${recipe.id}/information?apiKey=${API_KEY}`
              );
              if (!detailResponse.ok) {
                return recipe;
              }
              return await detailResponse.json();
            } catch (e) {
              console.error(
                `Error fetching details for recipe ${recipe.id}:`,
                e
              );
              return recipe;
            }
          })
        );
        const processedRecipes = detailedRecipes.map((recipe) => {
          const usedCount = recipe.usedIngredientCount || 0;
          const missedCount = recipe.missedIngredientCount || 0;
          const totalCount = usedCount + missedCount;
          const matchPercentage =
            totalCount > 0 ? (usedCount / totalCount) * 100 : 0;
          recipe.matchInfo = {
            used: usedCount,
            missed: missedCount,
            total: totalCount,
            percentage: matchPercentage,
            matchLevel: getMatchLevel(matchPercentage),
          };
          return recipe;
        });
        setRecipes(processedRecipes);
      } else {
        setRecipes([]);
      }
    } catch (error) {
      console.error("Alternative fetch failed:", error);
      setRecipes([]);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, [selectedCuisine, cravings]);

  useEffect(() => {
    const fetchBookmarkedStatus = async () => {
      try {
        const bookmarkedStatus = {};
        for (const recipe of recipes) {
          bookmarkedStatus[recipe.id] = await isRecipeBookmarked(recipe.id);
        }
        setBookmarkedRecipes(bookmarkedStatus);
      } catch (error) {
        console.error("Error fetching bookmarked status:", error);
      }
    };
    fetchBookmarkedStatus();
  }, [recipes]);

  const handleRecipePress = (recipe) => {
    console.log("Recipe pressed:", recipe.title);
    addRecipeToHistory({
      id: recipe.id,
      title: recipe.title,
      image: recipe.image,
    }).catch((err) => console.error("Failed to log recipe to history", err));
    setSelectedRecipe({
      ...recipe,
      isFirstRecipe: recipes.length > 0 && recipe.id === recipes[0].id,
    });
    setModalVisible(true);
  };

  const formatInstructions = (instructions) => {
    if (!instructions) return "No instructions available.";
    return instructions.replace(/<\/?[^>]+(>|$)/g, "\n");
  };

  const toggleMenu = () => {
    setMenuOpen(!isMenuOpen);
  };

  const toggleCuisineDropdown = () => {
    setShowCuisineDropdown(!showCuisineDropdown);
  };

  const toggleBookmark = async (recipeId, e) => {
    if (e) {
      e.stopPropagation();
    }
    try {
      const recipe = recipes.find((r) => r.id === recipeId);
      if (!recipe) return;
      const isCurrentlyBookmarked = bookmarkedRecipes[recipeId] || false;
      setBookmarkedRecipes((prev) => ({
        ...prev,
        [recipeId]: !prev[recipeId],
      }));
      if (isCurrentlyBookmarked) {
        await removeBookmark(recipeId);
      } else {
        await addBookmark({
          id: recipe.id,
          title: recipe.title,
          image: recipe.image,
        });
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      setBookmarkedRecipes((prev) => ({
        ...prev,
        [recipeId]: !prev[recipeId],
      }));
    }
  };

  const isBookmarked = (recipeId) => {
    return bookmarkedRecipes[recipeId] || false;
  };

  const handleCuisineSelect = (cuisine) => {
    setSelectedCuisine(cuisine);
    setShowCuisineDropdown(false);
  };

  // When the user submits their cravings, split on commas and trim extra whitespace
  const handleCravingSubmit = () => {
    const newCravings = cravingInput
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
    setCravings((prev) => [...prev, ...newCravings]);
    setCravingInput("");
    setCravingModalVisible(false);
  };

  const MatchLegend = () => (
    <View style={styles.legendContainer}>
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.perfectBox]} />
          <Text style={styles.legendText}>Perfect Match</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.closeBox]} />
          <Text style={styles.legendText}>Close</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.missingBox]} />
          <Text style={styles.legendText}>Missing Items</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
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

      <TouchableOpacity
        style={styles.cuisineButton}
        onPress={toggleCuisineDropdown}
      >
        <Text style={styles.cuisineButtonText}>
          {selectedCuisine === "All" ? "All Cuisines" : selectedCuisine} ▼
        </Text>
      </TouchableOpacity>

      {/* Cuisine dropdown with background dismissal */}
      {showCuisineDropdown && (
        <>
          <TouchableWithoutFeedback
            onPress={() => setShowCuisineDropdown(false)}
          >
            <View style={styles.dropdownOverlay} />
          </TouchableWithoutFeedback>
          <View style={styles.cuisineDropdown}>
            <ScrollView style={styles.cuisineScrollView}>
              {CUISINES.map((cuisine) => (
                <TouchableOpacity
                  key={cuisine}
                  style={[
                    styles.cuisineOption,
                    selectedCuisine === cuisine && styles.selectedCuisine,
                  ]}
                  onPress={() => handleCuisineSelect(cuisine)}
                >
                  <Text
                    style={[
                      styles.cuisineOptionText,
                      selectedCuisine === cuisine && styles.selectedCuisineText,
                    ]}
                  >
                    {cuisine}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
        >
          <View style={styles.recipeContainer}>
            {recipes.length > 0 ? (
              recipes.map((recipe, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.recipeCardContainer}
                  onPress={() => handleRecipePress(recipe)}
                >
                  <View style={styles.recipeCard}>
                    <View style={styles.imageContainer}>
                      {recipe.image ? (
                        <Image
                          source={{ uri: recipe.image }}
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
                      <Text style={styles.imageTitle}>{recipe.title}</Text>
                      <Text style={styles.imageDescription} numberOfLines={1}>
                        {recipe.matchInfo
                          ? `${Math.round(
                              recipe.matchInfo.displayPercentage
                            )}% match`
                          : ""}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.noRecipesContainer}>
                <Text style={styles.noRecipesText}>
                  No recipes found. Try adding more ingredients, cravings or
                  changing the cuisine.
                </Text>
              </View>
            )}
            <View style={styles.spacer} />
          </View>
        </ScrollView>
      )}

      {/* Recipe Modal with background dismissal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          {/* Background dismiss area */}
          <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
            <View style={styles.backgroundDismiss} />
          </TouchableWithoutFeedback>
          {/* Modal content */}
          <View style={styles.modalContent}>
            {selectedRecipe && (
              <>
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
                  showsVerticalScrollIndicator={true}
                  scrollEventThrottle={16}
                  removeClippedSubviews={false}
                  keyboardShouldPersistTaps="handled"
                >
                  <Text style={styles.modalTitle}>{selectedRecipe.title}</Text>
                  {selectedRecipe.image && (
                    <Image
                      source={{ uri: selectedRecipe.image }}
                      style={styles.modalImage}
                    />
                  )}
                  <Text style={styles.sectionTitle}>Ingredients 🥕:</Text>
                  <View style={styles.ingredientsContainer}>
                    {selectedRecipe.extendedIngredients &&
                      selectedRecipe.extendedIngredients.map(
                        (ingredient, index) => (
                          <Text key={index} style={styles.ingredientItem}>
                            <Text style={{ fontWeight: "bold" }}>•</Text>{" "}
                            {ingredient.original}
                          </Text>
                        )
                      )}
                  </View>
                  <Text style={styles.sectionTitle}>Instructions 👨‍🍳:</Text>
                  <View style={styles.instructionsContainer}>
                    {selectedRecipe.analyzedInstructions &&
                    selectedRecipe.analyzedInstructions.length > 0 ? (
                      selectedRecipe.analyzedInstructions[0].steps.map(
                        (step, idx) => (
                          <View key={idx} style={styles.instructionRow}>
                            <Text style={styles.stepNumber}>{idx + 1}.</Text>
                            <Text style={styles.instructionText}>
                              {step.step}
                            </Text>
                          </View>
                        )
                      )
                    ) : (
                      <Text style={styles.instructionText}>
                        {formatInstructions(selectedRecipe.instructions)}
                      </Text>
                    )}
                  </View>
                  <View
                    style={{
                      height: selectedRecipe.isFirstRecipe ? 200 : 60,
                    }}
                  />
                </ScrollView>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Craving Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={cravingModalVisible}
        onRequestClose={() => setCravingModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setCravingModalVisible(false)}>
          <View style={styles.modalContainer}>
            <TouchableWithoutFeedback>
              <View style={styles.cravingModalContent}>
                <View style={styles.cravingHeader}>
                  <Ionicons
                    name="fast-food-outline"
                    size={28}
                    color="#007BFF"
                  />
                  <Text style={[styles.modalTitle, { marginLeft: 8 }]}>
                    Add Your Cravings
                  </Text>
                </View>
                <Text style={styles.sectionTitle}>
                  Enter craving items (comma separated):
                </Text>
                <TextInput
                  style={styles.cravingInput}
                  placeholder="e.g. chocolate, chips, ice cream"
                  placeholderTextColor="grey"
                  value={cravingInput}
                  onChangeText={(text) => setCravingInput(text)}
                />
                <View style={styles.modalButtonContainer}>
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={handleCravingSubmit}
                  >
                    <Text style={styles.modalButtonText}>Add</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setCravingModalVisible(false)}
                  >
                    <Text style={styles.modalButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Floating Craving Button */}
      <TouchableOpacity
        style={styles.cravingButton}
        onPress={() => setCravingModalVisible(true)}
      >
        <Ionicons name="fast-food-outline" size={30} color="#fff" />
        <Text style={styles.cravingButtonText}>Crave</Text>
      </TouchableOpacity>

      <AnimatedSideMenu
        isMenuOpen={isMenuOpen}
        onClose={() => setMenuOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    width: "100%",
  },
  scrollViewContent: {
    paddingVertical: 20,
    paddingBottom: 50,
  },
  recipeContainer: {
    width: "100%",
    padding: 5,
  },
  recipeCardContainer: {
    marginVertical: 6,
    width: "92%",
    alignSelf: "center",
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
  },
  imageContainer: {
    width: "100%",
    height: 175,
    position: "relative",
  },
  recipeImage: {
    width: "100%",
    height: "100%",
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
  placeholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#E0E0E0",
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
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  cuisineButton: {
    backgroundColor: "#007BFF",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginTop: 10,
    marginBottom: 10,
    width: "80%",
    alignItems: "center",
  },
  cuisineButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  cuisineDropdown: {
    position: "absolute",
    top: 170,
    backgroundColor: "#fff",
    width: "80%",
    maxHeight: 200,
    borderRadius: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 3,
  },
  dropdownOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
    zIndex: 2,
  },
  cuisineScrollView: {
    maxHeight: 200,
  },
  cuisineOption: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  selectedCuisine: {
    backgroundColor: "#e6f2ff",
  },
  cuisineOptionText: {
    fontSize: 16,
  },
  selectedCuisineText: {
    fontWeight: "bold",
    color: "#007BFF",
  },
  noRecipesContainer: {
    marginTop: 50,
    alignItems: "center",
    padding: 20,
  },
  noRecipesText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  backgroundDismiss: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    width: "90%",
    height: height * 0.75,
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  cravingModalContent: {
    width: "90%",
    height: height * 0.3,
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  modalScrollViewContent: {
    alignItems: "center",
    paddingBottom: 100,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
    paddingRight: 40,
  },
  modalImage: {
    width: "100%",
    height: 150,
    borderRadius: 10,
    marginBottom: 5,
  },
  closeButton: {
    backgroundColor: "#007BFF",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginTop: 10,
    alignSelf: "center",
  },
  closeButtonText: {
    color: "#FFF",
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
  modalBookmarkIcon: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 10,
    color: "#333",
    textAlign: "center",
  },
  ingredientItem: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 5,
    textAlign: "left",
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
  legendContainer: {
    width: "90%",
    backgroundColor: "transparent",
    borderRadius: 10,
    padding: 5,
    marginTop: 0,
    marginBottom: 5,
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    width: "100%",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 5,
  },
  legendBox: {
    width: 20,
    height: 20,
    borderWidth: 3,
    marginRight: 5,
    backgroundColor: "transparent",
  },
  legendText: {
    fontSize: 11,
    color: "#333",
    fontWeight: "500",
  },
  perfectBox: {
    borderColor: "#1AC737",
  },
  closeBox: {
    borderColor: "#FFC107",
  },
  missingBox: {
    borderColor: "#F44336",
  },
  matchBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  matchText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },
  spacer: {
    height: 50,
  },
  ingredientsContainer: {
    width: "100%",
    paddingHorizontal: 10,
  },
  instructionsContainer: {
    width: "100%",
    paddingHorizontal: 10,
  },
  extraPadding: {
    height: 150,
  },
  cravingButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#007BFF",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 50,
    flexDirection: "row",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  cravingButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 5,
  },
  cravingHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  cravingInput: {
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    width: "90%",
    padding: 10,
    marginVertical: 10,
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 10,
  },
  modalButton: {
    backgroundColor: "#007BFF",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  cancelButton: {
    backgroundColor: "#F44336",
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 16,
  },
});