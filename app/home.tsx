import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
  ScrollView,
  Modal,
  Alert,
  ImageBackground,
} from "react-native";
import { useRouter } from "expo-router";
import { getAuth, signOut } from "firebase/auth"; // Import Firebase auth functions
import { db } from "../firebase/firebaseConfig"; // Import the Firestore database
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import NotificationBell from "../components/NotificationBell"; // Component for notifications
import AnimatedSideMenu from "@/components/SideMenu";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

const RecipeCard = ({ title, imagePath, description, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={styles.recipeCardContainer}
    activeOpacity={0.9}
  >
    <View style={styles.recipeCard}>
      <View style={styles.imageContainer}>
        {imagePath ? (
          <Image
            source={imagePath}
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
        <Text style={styles.imageTitle}>{title}</Text>
        <Text style={styles.imageDescription} numberOfLines={1}>
          {description}
        </Text>
      </View>
    </View>
  </TouchableOpacity>
);

const QuickAccessButton = ({ icon, title, onPress, color }) => (
  <TouchableOpacity
    style={[styles.quickAccessButton, { backgroundColor: color }]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <Ionicons name={icon} size={16} color="#fff" style={styles.buttonIcon} />
    <Text style={styles.quickAccessText}>{title}</Text>
  </TouchableOpacity>
);

const HomeScreen = () => {
  const router = useRouter();
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const [isBookmarked, setIsBookmarked] = useState(false); // State for bookmark icon

  const [isMyFoodOpen, setIsMyFoodOpen] = useState(false); // State for My Food dropdown
  const slideAnim = useRef(new Animated.Value(-width)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const auth = getAuth();

  const toggleMenu = () => {
    setMenuOpen(!isMenuOpen);
    // Animated.timing(slideAnim, {
    //   toValue: isMenuOpen ? -width : 0,
    //   duration: 300,
    //   useNativeDriver: true,
    // }).start();
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
    outputRange: ["0deg", "90deg"],
  });

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
    } else if (page === "Settings") {
      router.push("/Settings"); // Redirect to the settings screen
    } else {
      const paths = {
        Home: "/home",
        AIRecipes: "/screens/AIRecipes",
        Pantry: "/screens/Pantry",
        Fridge: "/screens/Fridge",
        Freezer: "/screens/Freezer",
        Spices: "/screens/Spices",
        Appliances: "/screens/Appliances",
        Bookmarked: "/screens/Bookmarked",
        History: "/screens/History",
        ReceiptScanner: "/screens/ReceiptScanner",
        ProfileSettings: "/screens/ProfileSettings",
        Settings: "/Settings",
      };
      router.push({
        pathname: paths[page] || "/home",
      });
    }
  };

  const handleRecipePress = (recipe) => {
    setSelectedRecipe(recipe);
    setModalVisible(true);
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

      <NotificationBell />

      <Image source={require("../assets/Logo.png")} style={styles.logo} />

      <View style={styles.contentContainer}>
        <View style={styles.headerContainer}>
          <View style={styles.headerRow}>
            <View style={styles.buttonsRow}>
              <QuickAccessButton
                icon="flash"
                title="Smart Recipes"
                onPress={() => router.push("/screens/AIRecipes")}
                color="#4CAF50"
              />
              <TouchableOpacity
                style={[
                  styles.quickAccessButton,
                  { backgroundColor: "#FF5722" },
                ]}
                onPress={() => router.push("/screens/Pantry")}
              >
                <Ionicons
                  name="nutrition"
                  size={16}
                  color="#fff"
                  style={styles.buttonIcon}
                />
                <Text style={styles.quickAccessText}>Add to Pantry</Text>
              </TouchableOpacity>
              <QuickAccessButton
                icon="scan"
                title="Scan Receipt"
                onPress={() => router.push("/screens/ReceiptScanner")}
                color="#2196F3"
              />
            </View>
            <Text style={styles.recipesHeader}>Trending Recipes🧑‍🍳</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.recipeContainer}>
            <RecipeCard
              title="Steak and Potatoes"
              imagePath={require("../assets/steakpotatoes.jpg")}
              description="A hearty meal featuring a perfectly seasoned steak served with baked potatoes."
              onPress={() =>
                handleRecipePress({
                  title: "Steak and Potatoes",
                  imagePath: require("../assets/steakpotatoes.jpg"),
                  description: `Ingredients:
- 2 ribeye steaks
- 4 large potatoes
- 2 tablespoons olive oil
- 2 cloves garlic, minced
- Salt and pepper to taste
- Fresh rosemary for garnish

Instructions:
1. Preheat the oven to 400°F (200°C).
2. Rub the steaks with olive oil, minced garlic, salt, and pepper.
3. Heat a skillet over high heat and sear the steaks for 2-3 minutes on each side.
4. Transfer the steaks to a baking sheet and bake in the preheated oven for 10-15 minutes, or until desired doneness.
5. While the steaks are baking, wash and dry the potatoes. Rub them with olive oil, salt, and pepper.
6. Place the potatoes on a baking sheet and bake in the preheated oven for 45-60 minutes, or until tender.
7. Serve the steaks with the baked potatoes and garnish with fresh rosemary.`,
                })
              }
            />
            <RecipeCard
              title="Tacos"
              imagePath={require("../assets/tacos.jpg")}
              description="A flavorful Mexican dish with tortillas filled with beef, cheese, and salsa."
              onPress={() =>
                handleRecipePress({
                  title: "Tacos",
                  imagePath: require("../assets/tacos.jpg"),
                  description: `Ingredients:
- 1 pound ground beef
- 1 packet taco seasoning
- 8 small tortillas
- 1 cup shredded lettuce
- 1 cup shredded cheese
- 1/2 cup salsa
- 1/2 cup sour cream

Instructions:
1. In a skillet, cook the ground beef over medium heat until browned. Drain any excess fat.
2. Add the taco seasoning and water according to the packet instructions. Simmer for 5 minutes.
3. Warm the tortillas in a dry skillet or microwave.
4. Fill each tortilla with the seasoned beef, shredded lettuce, shredded cheese, salsa, and sour cream.
5. Serve immediately.`,
                })
              }
            />
            <RecipeCard
              title="Fish and Chips"
              imagePath={require("../assets/fishandchips.jpg")}
              description="A classic British dish with crispy fried fish and golden fries."
              onPress={() =>
                handleRecipePress({
                  title: "Fish and Chips",
                  imagePath: require("../assets/fishandchips.jpg"),
                  description: `Ingredients:
- 4 cod fillets
- 1 cup all-purpose flour
- 1 teaspoon baking powder
- 1 cup cold sparkling water
- 4 large potatoes
- Salt and pepper to taste
- Vegetable oil for frying
- Lemon wedges for serving

Instructions:
1. Peel and cut the potatoes into thick fries. Soak them in cold water for 30 minutes.
2. In a bowl, whisk together the flour, baking powder, and cold sparkling water to make the batter.
3. Heat the vegetable oil in a deep fryer or large pot to 350°F (175°C).
4. Drain and pat the potatoes dry. Fry them in batches until golden and crispy. Drain on paper towels and season with salt.
5. Dip the cod fillets into the batter, allowing any excess to drip off.
6. Fry the fish in the hot oil until golden and crispy, about 4-5 minutes per side. Drain on paper towels.
7. Serve the fish with the fries and lemon wedges.`,
                })
              }
            />
            <RecipeCard
              title="Spaghetti Alfredo"
              imagePath={require("../assets/spaghetti.jpg")}
              description="A creamy and delicious pasta dish made with Alfredo sauce and garnished with Parmesan cheese."
              onPress={() =>
                handleRecipePress({
                  title: "Spaghetti Alfredo",
                  imagePath: require("../assets/spaghetti.jpg"),
                  description: `Ingredients:
- 12 ounces fettuccine
- 1 cup heavy cream
- 1/2 cup unsalted butter
- 1 cup grated Parmesan cheese
- Salt and pepper to taste
- Chopped parsley for garnish

Instructions:
1. Cook the fettuccine according to package instructions. Drain and set aside.
2. In a large skillet, heat the heavy cream and butter over medium heat until the butter is melted and the mixture is hot.
3. Add the Parmesan cheese and stir until the cheese is melted and the sauce is smooth.
4. Add the cooked fettuccine to the skillet and toss to coat with the sauce.
5. Season with salt and pepper to taste.
6. Garnish with chopped parsley and serve immediately.`,
                })
              }
            />
          </View>
        </ScrollView>
      </View>

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
                style={styles.bookmarkIcon}
                onPress={() => setIsBookmarked(!isBookmarked)}
              >
                <Ionicons
                  name={isBookmarked ? "bookmark" : "bookmark-outline"}
                  size={30}
                  color={isBookmarked ? "gold" : "#000"}
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
                {selectedRecipe.imagePath && (
                  <Image
                    source={selectedRecipe.imagePath}
                    style={styles.modalImage}
                  />
                )}

                <Text style={styles.sectionTitle}>Ingredients 🥕:</Text>
                <View style={styles.ingredientsContainer}>
                  {selectedRecipe.description
                    .split("\n\n")
                    .find((section) => section.startsWith("Ingredients:"))
                    ?.split("\n")
                    .slice(1)
                    .map((ingredient, idx) => (
                      <Text key={idx} style={styles.ingredientItem}>
                        <Text style={{ fontWeight: "bold" }}>•</Text>{" "}
                        {ingredient.substring(1).trim()}
                      </Text>
                    ))}
                </View>

                <Text style={styles.sectionTitle}>Instructions 👨‍🍳:</Text>
                <View style={styles.instructionsContainer}>
                  {selectedRecipe.description
                    .split("\n\n")
                    .find((section) => section.startsWith("Instructions:"))
                    ?.split("\n")
                    .slice(1)
                    .map((instruction, idx) => {
                      const stepMatch = instruction.match(/^(\d+)\./);
                      if (stepMatch) {
                        const [fullMatch, stepNumber] = stepMatch;
                        const stepText = instruction
                          .replace(fullMatch, "")
                          .trim();
                        return (
                          <View key={idx} style={styles.instructionRow}>
                            <Text style={styles.stepNumber}>{stepNumber}.</Text>
                            <Text style={styles.instructionText}>
                              {stepText}
                            </Text>
                          </View>
                        );
                      }
                      return null;
                    })}
                </View>
                <View style={{ height: 60 }} />
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

      {/* Animated Side Menu */}
      <AnimatedSideMenu
        isMenuOpen={isMenuOpen}
        onClose={() => setMenuOpen(false)}
      />
    </View>
  );
};

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
    backgroundColor: "#C1E0EC",
    paddingTop: 10,
  },
  // Add overlay style for closing menu when tapping anywhere
  // menuOverlay: {
  //   position: "absolute",
  //   top: 0,
  //   left: 0,
  //   right: 0,
  //   bottom: 0,
  //   backgroundColor: "transparent",
  //   zIndex: 1,
  // },
  logo: {
    width: 85,
    height: 85,
    alignSelf: "center",
    marginTop: 3,
  },
  hamburger: {
    position: "absolute",
    top: 40,
    left: 20,
    zIndex: 10,
  },
  bookmarkIcon: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 1,
    padding: 5,
  },
  notificationIcon: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 1,
  },
  line: {
    width: 30,
    height: 4,
    backgroundColor: "#fff",
    marginVertical: 4,
  },
  scrollView: {
    flex: 1,
    width: "100%",
  },
  scrollViewContent: {
    flexGrow: 1,
    alignItems: "center",
    paddingBottom: 20,
  },
  contentContainer: {
    marginTop: 20,
    alignItems: "center",
    flex: 1,
    width: "100%",
  },
  headerContainer: {
    width: "100%",
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  headerRow: {
    flexDirection: "column",
    marginBottom: 5,
  },
  buttonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 12,
  },
  quickAccessButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4CAF50",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
    flex: 1,
    marginHorizontal: 4,
    maxWidth: "32%",
  },
  buttonIcon: {
    marginRight: 4,
  },
  quickAccessText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  recipesHeader: {
    fontSize: 28,
    fontWeight: "900",
    color: "#1A2639",
    width: "100%",
    paddingRight: 5,
    lineHeight: 32,
    fontFamily: "System",
    letterSpacing: 0.3,
    textTransform: "uppercase",
    marginTop: 5,
  },
  secondaryButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "90%",
    marginBottom: 15,
  },
  recipeContainer: {
    width: "100%",
    padding: 5,
  },
  recipeCardContainer: {
    marginVertical: 6, // Reduced from 10
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
    overflow: "hidden", // Important for ensuring the image doesn't overflow
    padding: 0, // Remove padding so the image can span full width
  },
  imageContainer: {
    width: "100%",
    height: 150, // Reduced from 180
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
  recipeContent: {
    padding: 12,
    paddingBottom: 14,
  },
  recipeDescription: {
    fontSize: 14,
    color: "#555",
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 5,
    fontWeight: "500",
  },
  difficultyContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  placeholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#E0E0E0",
  },
  menuContainer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: width * 0.4,
    backgroundColor: "#4C5D6B",
    padding: 20,
    paddingTop: 40, // Changed from 40 to 0
    zIndex: 0,
  },
  menuItem: {
    marginTop: 10, // Use this instead of firstMenuItem style
  },
  firstMenuItem: {
    // This can be removed if you're using menuItem instead
    paddingTop: 40,
  },
  menuText: {
    fontSize: 18,
    color: "#fff",
    marginVertical: 10,
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
  // Update these styles in your StyleSheet
  modalScrollViewContent: {
    alignItems: "center",
    paddingBottom: 100, // Increased padding for better scrolling
  },
  // modalContent: {
  //   width: "90%",
  //   height: "75%",
  //   backgroundColor: "#fff",
  //   padding: 10,
  //   borderRadius: 10,
  //   alignItems: "center",
  //   position: "relative", // Added for proper layout
  // },
  recipeContentContainer: {
    width: "90%",
    paddingHorizontal: 5,
  },
  sectionContainer: {
    marginBottom: 10,
    width: "100%",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 10,
    color: "#333",
    textAlign: "center",
    width: "100%",
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
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
    paddingRight: 40,
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
  },
  closeButton: {
    backgroundColor: "#007BFF",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginTop: 10,
    alignSelf: "center",
    marginBottom: 5, // Added to ensure proper spacing
  },
  closeButtonText: {
    color: "#FFF",
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
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF5722",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
    width: 80, // Set fixed width
  },
  addButtonText: {
    color: "#fff",
    fontSize: 11, // Smaller text
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 12, // Tighter line height
  },
  addButtonTextContainer: {
    alignItems: "center",
    marginLeft: 4, // Less space between icon and text
    width: 48, // Fixed width for text container
  },
});

export default HomeScreen;