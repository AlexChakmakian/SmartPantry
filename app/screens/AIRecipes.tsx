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
} from "react-native";

import { getItems } from "../../firebase/pantryService"; // Import the getItems function from pantryService
import { Ionicons } from "@expo/vector-icons"; // Import Ionicons for the bookmark icon

import { addRecipeToHistory } from "@/firebase/recipeHistoryService";
import {
  addBookmark,
  removeBookmark,
  isRecipeBookmarked,
} from "@/firebase/bookmarkService";
import AnimatedSideMenu from "@/components/SideMenu";
import { useRouter } from "expo-router";
import { getAuth } from "firebase/auth";

const API_KEY = "ea48a472f7df4ebd9c8c5301c6f0b042";

const { width, height } = Dimensions.get("window");

// List of available cuisines from Spoonacular
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
  const slideAnim = useRef(new Animated.Value(-width)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const [activeFilters, setActiveFilters] = useState({
    gold: false,
    silver: false,
    bronze: false,
  });

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

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // Helper function to determine match level
  const getMatchLevel = (percentage) => {
    if (percentage >= 80) return "gold";
    if (percentage >= 50) return "silver";
    if (percentage >= 30) return "bronze";
    return "none";
  };

  // Add filter function
  const getFilteredRecipes = (recipeList) => {
    if (!Object.values(activeFilters).includes(true)) {
      return recipeList; // Return all recipes if no filters are active
    }

    return recipeList.filter((recipe) => {
      if (!recipe.matchInfo) return false;
      return (
        (activeFilters.gold && recipe.matchInfo.matchLevel === "gold") ||
        (activeFilters.silver && recipe.matchInfo.matchLevel === "silver") ||
        (activeFilters.bronze && recipe.matchInfo.matchLevel === "bronze")
      );
    });
  };

  // Function to get border style based on match level
  const getRecipeContainerStyle = (recipe) => {
    if (!recipe || !recipe.matchInfo) return styles.recipeContainer;

    switch (recipe.matchInfo.matchLevel) {
      case "gold":
        return [styles.recipeContainer, styles.goldBorder];
      case "silver":
        return [styles.recipeContainer, styles.silverBorder];
      case "bronze":
        return [styles.recipeContainer, styles.bronzeBorder];
      default:
        return styles.recipeContainer;
    }
  };

  const fetchRecipes = async () => {
    setLoading(true);
    try {
      // Randomize the emoji
      const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
      setEmoji(randomEmoji);

      // Fetch ingredients from Firebase - COMBINE ALL STORAGE LOCATIONS
      const pantryItems = (await getItems("pantry")) || [];
      const fridgeItems = (await getItems("fridge")) || [];
      const freezerItems = (await getItems("freezer")) || [];
      const spicesItems = (await getItems("spices")) || [];

      // Combine all ingredients
      const allIngredients = [
        ...pantryItems,
        ...fridgeItems,
        ...freezerItems,
        ...spicesItems,
      ];

      console.log("All ingredients:", allIngredients);

      // Extract ingredient names and join with commas
      const ingredientNames = allIngredients.map((item) => item.name).join(",");
      console.log("Ingredients for API:", ingredientNames);

      // Build the API URL with parameters
      let apiUrl = `https://api.spoonacular.com/recipes/complexSearch?apiKey=${API_KEY}&includeIngredients=${ingredientNames}&fillIngredients=true&addRecipeInformation=true&number=6&sort=max-used-ingredients`;

      // Add cuisine filter if a specific cuisine is selected
      if (selectedCuisine !== "All") {
        apiUrl += `&cuisine=${selectedCuisine}`;
      }

      console.log("Fetching recipes with URL:", apiUrl);

      // Fetch recipes from Spoonacular API
      const response = await fetch(apiUrl);
      const data = await response.json();

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

      // Calculate matching information for each recipe
      if (data.results && data.results.length > 0) {
        const processedRecipes = data.results.map((recipe) => {
          // Calculate matching percentage based on used and missed ingredients
          const usedCount = recipe.usedIngredientCount || 0;
          const missedCount = recipe.missedIngredientCount || 0;
          const totalCount = usedCount + missedCount;

          const matchPercentage =
            totalCount > 0 ? (usedCount / totalCount) * 100 : 0;

          // Add match info to recipe
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
        console.log("No recipes found for the selected criteria");
      }
    } catch (error) {
      console.error("Error fetching recipes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, [selectedCuisine]); // Re-fetch when cuisine changes

  useEffect(() => {
    fetchBookmarkedStatus();
  }, [recipes]);

  const fetchBookmarkedStatus = async () => {
    try {
      // For each recipe in recipes array, check if it's bookmarked
      const bookmarkedStatus = {};
      for (const recipe of recipes) {
        bookmarkedStatus[recipe.id] = await isRecipeBookmarked(recipe.id);
      }
      setBookmarkedRecipes(bookmarkedStatus);
    } catch (error) {
      console.error("Error fetching bookmarked status:", error);
    }
  };

  const handleRecipePress = (recipe) => {
    // Log this recipe to the history
    addRecipeToHistory({
      id: recipe.id,
      title: recipe.title,
      image: recipe.image,
    }).catch((err) => console.error("Failed to log recipe to history", err));

    setSelectedRecipe(recipe);
    setModalVisible(true);
  };

  const formatInstructions = (instructions) => {
    if (!instructions) return "No instructions available.";
    return instructions.replace(/<\/?[^>]+(>|$)/g, "\n"); // Replace HTML tags with new lines
  };

  const toggleMenu = () => {
    setMenuOpen(!isMenuOpen);
  };

  const toggleCuisineDropdown = () => {
    setShowCuisineDropdown(!showCuisineDropdown);
  };

  const toggleBookmark = async (recipeId, e) => {
    if (e) {
      e.stopPropagation(); // Prevent triggering the parent onPress
    }

    try {
      // Get the recipe from recipes array
      const recipe = recipes.find((r) => r.id === recipeId);
      if (!recipe) return;

      // Check current bookmark status
      const isCurrentlyBookmarked = bookmarkedRecipes[recipeId] || false;

      // Update UI immediately for responsive feel
      setBookmarkedRecipes((prev) => ({
        ...prev,
        [recipeId]: !prev[recipeId],
      }));

      // Update in Firebase
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
      // Revert UI if operation failed
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

  const MatchLegend = () => (
    <View style={styles.legendContainer}>
      <Text style={styles.legendTitle}>Filter by Match:</Text>
      <View style={styles.legendItem}>
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() =>
            setActiveFilters((prev) => ({
              ...prev,
              gold: !prev.gold,
            }))
          }
        >
          <View
            style={[
              styles.checkbox,
              activeFilters.gold && styles.checkboxChecked,
            ]}
          >
            {activeFilters.gold && (
              <Ionicons name="checkmark" size={16} color="#fff" />
            )}
          </View>
        </TouchableOpacity>
        <View style={styles.legendColorBox}>
          <View style={[styles.legendBox, styles.goldBorder]} />
        </View>
        <Text style={styles.legendText}>
          80%+ match - You have most ingredients!
        </Text>
      </View>

      <View style={styles.legendItem}>
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() =>
            setActiveFilters((prev) => ({
              ...prev,
              silver: !prev.silver,
            }))
          }
        >
          <View
            style={[
              styles.checkbox,
              activeFilters.silver && styles.checkboxChecked,
            ]}
          >
            {activeFilters.silver && (
              <Ionicons name="checkmark" size={16} color="#fff" />
            )}
          </View>
        </TouchableOpacity>
        <View style={styles.legendColorBox}>
          <View style={[styles.legendBox, styles.silverBorder]} />
        </View>
        <Text style={styles.legendText}>50-79% match - Good option</Text>
      </View>

      <View style={styles.legendItem}>
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() =>
            setActiveFilters((prev) => ({
              ...prev,
              bronze: !prev.bronze,
            }))
          }
        >
          <View
            style={[
              styles.checkbox,
              activeFilters.bronze && styles.checkboxChecked,
            ]}
          >
            {activeFilters.bronze && (
              <Ionicons name="checkmark" size={16} color="#fff" />
            )}
          </View>
        </TouchableOpacity>
        <View style={styles.legendColorBox}>
          <View style={[styles.legendBox, styles.bronzeBorder]} />
        </View>
        <Text style={styles.legendText}>
          30-49% match - Missing some ingredients
        </Text>
      </View>
    </View>
  );

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

      {/* Cuisine Dropdown Button */}
      <TouchableOpacity
        style={styles.cuisineButton}
        onPress={toggleCuisineDropdown}
      >
        <Text style={styles.cuisineButtonText}>
          {selectedCuisine === "All" ? "All Cuisines" : selectedCuisine} ▼
        </Text>
      </TouchableOpacity>

      {/* Cuisine Dropdown Menu */}
      {showCuisineDropdown && (
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
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scrollViewContent,
            { paddingBottom: 100 },
          ]}
        >
          <MatchLegend />
          {recipes.length > 0 ? (
            getFilteredRecipes(recipes).map((recipe, index) => (
              <TouchableOpacity
                key={index}
                style={getRecipeContainerStyle(recipe)}
                onPress={() => handleRecipePress(recipe)}
              >
                <View style={styles.recipeHeader}>
                  <Text style={styles.recipeTitle}>{recipe.title}</Text>
                  <TouchableOpacity
                    onPress={(e) => toggleBookmark(recipe.id, e)}
                  >
                    <Ionicons
                      name={
                        isBookmarked(recipe.id)
                          ? "bookmark"
                          : "bookmark-outline"
                      }
                      size={24}
                      color={isBookmarked(recipe.id) ? "gold" : "#333"}
                    />
                  </TouchableOpacity>
                </View>

                {/* Add match badge if it's a good match */}
                {recipe.matchInfo && recipe.matchInfo.percentage >= 30 && (
                  <View style={styles.matchBadge}>
                    <Text style={styles.matchText}>
                      {Math.round(recipe.matchInfo.percentage)}% match
                    </Text>
                  </View>
                )}

                {recipe.image && (
                  <Image
                    source={{ uri: recipe.image }}
                    style={styles.recipeImage}
                  />
                )}
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.noRecipesContainer}>
              <Text style={styles.noRecipesText}>
                No recipes found for {selectedCuisine} cuisine with your
                ingredients.
              </Text>
              <Text style={styles.noRecipesSubtext}>
                Try selecting a different cuisine or adding more ingredients to
                your pantry.
              </Text>
            </View>
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
                  name={
                    isBookmarked(selectedRecipe.id)
                      ? "bookmark"
                      : "bookmark-outline"
                  }
                  size={30}
                  color={isBookmarked(selectedRecipe.id) ? "gold" : "#000"}
                />
              </TouchableOpacity>

              <ScrollView contentContainerStyle={styles.modalScrollViewContent}>
                <Text style={styles.modalTitle}>{selectedRecipe.title}</Text>
                {selectedRecipe.image && (
                  <Image
                    source={{ uri: selectedRecipe.image }}
                    style={styles.modalImage}
                  />
                )}

                {/* Ingredients Section */}
                <Text style={styles.sectionTitle}>Ingredients 🥕:</Text>
                {selectedRecipe.extendedIngredients &&
                  selectedRecipe.extendedIngredients.map(
                    (ingredient, index) => (
                      <Text key={index} style={styles.ingredientItem}>
                        <Text style={{ fontWeight: "bold" }}>•</Text>{" "}
                        {ingredient.original}
                      </Text>
                    )
                  )}

                {/* Instructions Section */}
                <Text style={styles.sectionTitle}>Instructions 👨‍🍳:</Text>
                {selectedRecipe.analyzedInstructions &&
                selectedRecipe.analyzedInstructions.length > 0 ? (
                  selectedRecipe.analyzedInstructions[0].steps.map(
                    (step, idx) => (
                      <View key={idx} style={styles.instructionRow}>
                        <Text style={styles.stepNumber}>{idx + 1}.</Text>
                        <Text style={styles.instructionText}>{step.step}</Text>
                      </View>
                    )
                  )
                ) : (
                  <Text style={styles.instructionText}>
                    {formatInstructions(selectedRecipe.instructions)}
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

      <AnimatedSideMenu
        isMenuOpen={isMenuOpen}
        onClose={() => setMenuOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Add these new styles
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
  },
  // Cuisine dropdown styles
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
    top: 170, // Adjust based on your layout
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
  scrollViewContent: {
    alignItems: "center",
    paddingVertical: 20,
    paddingBottom: 50,
  },
  recipeContainer: {
    marginTop: 20,
    alignItems: "center",
    width: "90%",
    backgroundColor: "#fff",
    padding: 10,
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
    flex: 1,
    marginRight: 10,
  },
  recipeImage: {
    width: "100%",
    height: 250,
    borderRadius: 10,
  },
  recipeInfo: {
    fontSize: 16,
    color: "#333",
    marginTop: 5,
  },
  spacer: {
    height: 50,
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
  noRecipesSubtext: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginTop: 10,
  },
  resetButton: {
    backgroundColor: "#007BFF",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 20,
    marginBottom: 20,
  },
  resetButtonText: {
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
    padding: 10,
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
    paddingRight: 40,
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
  goldBorder: {
    borderWidth: 5,
    borderColor: "#FFD700", // Gold color
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  silverBorder: {
    borderWidth: 5,
    borderColor: "#C0C0C0", // Silver color
    shadowColor: "#C0C0C0",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  bronzeBorder: {
    borderWidth: 5,
    borderColor: "#CD7F32", // Bronze color
    shadowColor: "#CD7F32",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
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
  checkboxContainer: {
    marginRight: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: "#007BFF",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: "#007BFF",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 5,
    paddingVertical: 5,
  },
  legendContainer: {
    width: "90%",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 10,
    padding: 15,
    marginTop: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  legendTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 5,
    textAlign: "center",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 3,
  },
  legendColorBox: {
    width: 40,
    height: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  legendBox: {
    width: 30,
    height: 20,
    backgroundColor: "#fff",
  },
  legendText: {
    fontSize: 14,
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
  // Add these styles to your StyleSheet

  sectionTitle: {
    fontSize: 20, // Slightly larger font size
    fontWeight: "bold", // Bold text
    marginVertical: 10, // Add spacing above and below
    color: "#333", // Darker color for better readability
    textAlign: "center", // Center the title
  },

  ingredientItem: {
    fontSize: 16, // Standard font size for ingredients
    lineHeight: 22, // Add spacing between lines
    marginBottom: 5, // Add spacing between ingredients
    textAlign: "left", // Align ingredients to the left
  },

  instructionRow: {
    flexDirection: "row", // Align step number and text in a row
    marginBottom: 8, // Add spacing between steps
    alignItems: "flex-start", // Align items at the top
  },

  stepNumber: {
    fontSize: 16, // Font size for step numbers
    fontWeight: "bold", // Bold step numbers
    marginRight: 8, // Add spacing between number and text
    color: "#333", // Darker color for better readability
  },

  instructionText: {
    fontSize: 16, // Standard font size for instructions
    lineHeight: 22, // Add spacing between lines
    flex: 1, // Allow text to wrap properly
    color: "#333", // Darker color for better readability
  },
  // Menu dropdown styles
  menuItemWithSubmenu: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    color: "red",
    marginVertical: 10,
  },
  rightPadding: {
    paddingLeft: 20,
  },
});
