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

const API_KEY = "d614cca7ed2341d2995df8150f4d9ef3";

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

  const emojis = [
    "📝", "🍔", "🥗", "🌮", "🍝", "🍕", "🍳", "🥞", "🍜", "🍰", "🍪", "🍩"
  ];

  const auth = getAuth();

  useEffect(() => {
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    setEmoji(randomEmoji);
  }, []);

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Helper function to determine match level with a 15% curve
  const getMatchLevel = (percentage) => {
    // Apply a 15% curve to make matches appear more favorable
    const adjustedPercentage = Math.min(100, percentage + 15);
    
    if (adjustedPercentage >= 80) return "perfect";
    if (adjustedPercentage >= 50) return "close";
    return "missing";
  };

  // Function to get border style based on match level
  const getRecipeContainerStyle = (recipe) => {
    if (!recipe || !recipe.matchInfo) return styles.recipeContainer;

    switch (recipe.matchInfo.matchLevel) {
      case "perfect": return [styles.recipeContainer, styles.perfectBorder];
      case "close": return [styles.recipeContainer, styles.closeBorder];
      case "missing": return [styles.recipeContainer, styles.missingBorder];
      default: return styles.recipeContainer;
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
      let apiUrl = `https://api.spoonacular.com/recipes/complexSearch?apiKey=${API_KEY}&includeIngredients=${ingredientNames}&fillIngredients=true&addRecipeInformation=true&number=6&sort=max-used-ingredients&instructionsRequired=true`;

      // Add cuisine filter if a specific cuisine is selected
      if (selectedCuisine !== "All") {
        apiUrl += `&cuisine=${selectedCuisine}`;
      }

      console.log("Fetching recipes with URL:", apiUrl);

      // Fetch recipes from Spoonacular API
      const response = await fetch(apiUrl);
      
      // Check if the response is OK
      if (!response.ok) {
        console.error(`API responded with status: ${response.status}`);
        const textResponse = await response.text();
        console.error("API error response:", textResponse);
        setRecipes([]);
        setLoading(false);
        return;
      }
      
      const responseText = await response.text();
      console.log("API response text first 100 chars:", responseText.substring(0, 100));
      
      // Try to parse the JSON response
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

      // Calculate matching information for each recipe
      if (data.results && data.results.length > 0) {
        const processedRecipes = data.results.map((recipe) => {
          // Calculate matching percentage based on used and missed ingredients
          const usedCount = recipe.usedIngredientCount || 0;
          const missedCount = recipe.missedIngredientCount || 0;
          const totalCount = usedCount + missedCount;

          const matchPercentage =
            totalCount > 0 ? (usedCount / totalCount) * 100 : 0;
          
          // Store both the original and adjusted percentages
          const adjustedPercentage = Math.min(100, matchPercentage + 15);

          // Add match info to recipe
          recipe.matchInfo = {
            used: usedCount,
            missed: missedCount,
            total: totalCount,
            percentage: matchPercentage,
            displayPercentage: adjustedPercentage, // The percentage to display
            matchLevel: getMatchLevel(matchPercentage),
          };

          return recipe;
        });

        // Sort recipes by match level (perfect > close > missing) and then by percentage within each level
        const sortedRecipes = processedRecipes.sort((a, b) => {
          // First sort by match level
          const levelOrder = { "perfect": 0, "close": 1, "missing": 2 };
          const levelDiff = levelOrder[a.matchInfo.matchLevel] - levelOrder[b.matchInfo.matchLevel];
          
          if (levelDiff !== 0) {
            return levelDiff; // Different match levels, sort by level
          }
          
          // Same match level, sort by percentage (higher percentage first)
          return b.matchInfo.percentage - a.matchInfo.percentage;
        });

        setRecipes(sortedRecipes);
      } else {
        setRecipes([]);
        console.log("No recipes found for the selected criteria");
      }
    } catch (error) {
      console.error("Error fetching recipes:", error);
      // Try using alternative API endpoint if there's a parsing error
      if (error instanceof SyntaxError && error.message.includes("JSON Parse error")) {
        try {
          console.log("Trying alternative API endpoint due to parsing error");
          await fetchRecipesAlternative();
        } catch (alternativeError) {
          console.error("Alternative API fetch also failed:", alternativeError);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Add this alternative fetch function for backup
  const fetchRecipesAlternative = async () => {
    try {
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

      // Extract ingredient names and join with commas
      const ingredientNames = allIngredients.map((item) => item.name).join(",");
      
      // Use a different endpoint or approach
      const apiUrl = `https://api.spoonacular.com/recipes/findByIngredients?apiKey=${API_KEY}&ingredients=${ingredientNames}&number=6`;
      
      console.log("Trying alternative endpoint:", apiUrl);
      
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (Array.isArray(data) && data.length > 0) {
        // Fetch detailed recipe info for each recipe
        const detailedRecipes = await Promise.all(
          data.map(async (recipe) => {
            try {
              const detailResponse = await fetch(
                `https://api.spoonacular.com/recipes/${recipe.id}/information?apiKey=${API_KEY}`
              );
              if (!detailResponse.ok) {
                return recipe; // Return basic recipe if detail fetch fails
              }
              return await detailResponse.json();
            } catch (e) {
              console.error(`Error fetching details for recipe ${recipe.id}:`, e);
              return recipe; // Return basic recipe on error
            }
          })
        );
        
        // Process recipes like in main function
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
    console.log("Recipe pressed:", recipe.title);
    
    // Log this recipe to the history
    addRecipeToHistory({
      id: recipe.id,
      title: recipe.title,
      image: recipe.image,
    }).catch((err) => console.error("Failed to log recipe to history", err));

    // Set selected recipe and flag if it's the first in the list
    setSelectedRecipe({
      ...recipe,
      isFirstRecipe: recipes.length > 0 && recipe.id === recipes[0].id
    });
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

      {/* Match Legend moved here, right after cuisine button */}
      <MatchLegend />

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
                <Text style={[
                  styles.cuisineOptionText,
                  selectedCuisine === cuisine && styles.selectedCuisineText,
                ]}>
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
          {recipes.length > 0 ? (
            recipes.map((recipe, index) => (
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

                <View style={styles.imageWrapper}>
                  {recipe.image && (
                    <Image
                      source={{ uri: recipe.image }}
                      style={styles.recipeImage}
                    />
                  )}
                  
                  {/* Gradient overlay */}
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.5)']}
                    style={styles.gradientOverlay}
                  />

                  {/* Add match badge if it's a good match */}
                  {recipe.matchInfo && (
                    <View style={[
                      styles.matchBadge,
                      recipe.matchInfo.matchLevel === "perfect" && styles.perfectBadge,
                      recipe.matchInfo.matchLevel === "close" && styles.closeBadge,
                      recipe.matchInfo.matchLevel === "missing" && styles.missingBadge,
                    ]}>
                      <Text style={styles.matchText}>
                        {Math.round(recipe.matchInfo.displayPercentage)}% match
                      </Text>
                    </View>
                  )}
                </View>
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

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {selectedRecipe && (
              <>
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
                
                <ScrollView 
                  contentContainerStyle={styles.modalScrollViewContent}
                  showsVerticalScrollIndicator={true}
                  scrollEventThrottle={16}
                  removeClippedSubviews={false}
                  keyboardShouldPersistTaps="handled"
                >
                  <Text style={styles.modalTitle}>{selectedRecipe.title}</Text>
                  {selectedRecipe.image && (
                    <Image source={{ uri: selectedRecipe.image }} style={styles.modalImage} />
                  )}
                  
                  {/* Ingredients Section */}
                  <Text style={styles.sectionTitle}>Ingredients 🥕:</Text>
                  <View style={styles.ingredientsContainer}>
                    {selectedRecipe.extendedIngredients && 
                      selectedRecipe.extendedIngredients.map((ingredient, index) => (
                        <Text key={index} style={styles.ingredientItem}>
                          <Text style={{ fontWeight: "bold" }}>•</Text> {ingredient.original}
                        </Text>
                      ))
                    }
                  </View>
                  
                  {/* Instructions Section */}
                  <Text style={styles.sectionTitle}>Instructions 👨‍🍳:</Text>
                  <View style={styles.instructionsContainer}>
                    {selectedRecipe.analyzedInstructions && 
                    selectedRecipe.analyzedInstructions.length > 0 ? (
                      selectedRecipe.analyzedInstructions[0].steps.map((step, idx) => (
                        <View key={idx} style={styles.instructionRow}>
                          <Text style={styles.stepNumber}>{idx + 1}.</Text>
                          <Text style={styles.instructionText}>{step.step}</Text>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.instructionText}>
                        {formatInstructions(selectedRecipe.instructions)}
                      </Text>
                    )}
                  </View>
                  
                  {/* Dynamic padding based on whether this is the first recipe (which needs more padding) */}
                  <View style={{ 
                    height: selectedRecipe.isFirstRecipe ? 200 : 60 
                  }} />
                </ScrollView>
              </>
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

      <AnimatedSideMenu
        isMenuOpen={isMenuOpen}
        onClose={() => setMenuOpen(false)}
      />
    </View>
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
    marginTop: 12, // Reduced from 20
    marginBottom: 0, // Added to reduce vertical spacing
    alignItems: "center",
    width: "92%",
    backgroundColor: "#fff",
    padding: 0,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: "hidden",
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 150, // Reduced from 220
    overflow: "hidden",
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
  perfectBorder: {
    borderWidth: 5,
    borderColor: "#99E1AC", // Green
    shadowColor: "99E1AC",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  closeBorder: {
    borderWidth: 5,
    borderColor: "#FFF894", // Amber
    shadowColor: "#FFF894",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  missingBorder: {
    borderWidth: 5,
    borderColor: "#F06A6A", // Red
    shadowColor: "#F06A6A",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  goldBorder: undefined,
  silverBorder: undefined,
  bronzeBorder: undefined,
  perfectBadge: {
    backgroundColor: "rgba(76, 175, 80, 0.8)", // Green with transparency
  },
  closeBadge: {
    backgroundColor: "rgba(255, 193, 7, 0.8)", // Amber with transparency
  },
  missingBadge: {
    backgroundColor: "rgba(244, 67, 54, 0.8)", // Red with transparency
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
    backgroundColor: "transparent", // Make inside hollow
  },
  legendText: {
    fontSize: 11,
    color: "#333",
    fontWeight: "500",
  },
  perfectBox: {
    borderColor: "#1AC737", // Green
  },
  closeBox: {
    borderColor: "#FFC107", // Amber
  },
  missingBox: {
    borderColor: "#F44336", // Red
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
  imageWrapper: {
    position: "relative",
    width: "100%",
    height: 250,
    borderRadius: 10,
    overflow: "hidden",
  },
  gradientOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "50%",
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
    height: 150, // Increased from 100 to 150 for more scroll space
  },
});