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
} from "react-native";
import { useRouter } from "expo-router";
import { getAuth, signOut } from "firebase/auth"; // Import Firebase auth functions
import { db } from "../firebase/firebaseConfig"; // Import the Firestore database
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Ionicons } from '@expo/vector-icons'; // Import Ionicons for the notification icon

const { width } = Dimensions.get("window");

const RecipeCard = ({ title, imagePath, description, onPress }) => (
  <TouchableOpacity onPress={onPress}>
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
      </View>
      <View style={styles.recipeContent}>
        <Text style={styles.recipeTitle}>{title}</Text>
        <Text style={styles.recipeText}>{description}</Text>
      </View>
    </View>
  </TouchableOpacity>
);

const HomeScreen = () => {
  const router = useRouter();
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [showButton, setShowButton] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-width)).current;

  const auth = getAuth();

  // Function to check if the user has already seen the "Configure Pantry" button
  useEffect(() => {
    const checkIfFirstTimeUser = async () => {
      const user = auth.currentUser;

      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          // If the flag `hasSeenConfigureButton` is true, hide the button
          if (userData.hasSeenConfigureButton) {
            setShowButton(false); // Do not show the button if the flag is true
          }
        } else {
          console.log("User document does not exist.");
        }
      }
    };
    checkIfFirstTimeUser();
  }, [auth.currentUser]);

  // Function to set flag in Firestore when user clicks "Configure Pantry"
  const handleConfigurePantry = async () => {
    const user = auth.currentUser;

    if (user) {
      const userDocRef = doc(db, "users", user.uid);
      try {
        // Update Firestore to set `hasSeenConfigureButton` to true
        await setDoc(
          userDocRef,
          { hasSeenConfigureButton: true },
          { merge: true }
        );

        // Hide the button after successful Firestore update
        setShowButton(false); // Hide the button once clicked
      } catch (error) {
        console.error("Error updating Firestore:", error);
      }
    }
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
        console.log("User signed out");
        router.push("/"); // Redirect to the login screen
      } catch (error) {
        console.error("Error signing out:", error);
      }
    } else {
      const paths = {
        Appliances: "/screens/Appliances",
        AIRecipes: "/screens/AIRecipes",
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

  const handleRecipePress = (recipe) => {
    setSelectedRecipe(recipe);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.hamburger} onPress={toggleMenu}>
        <View style={styles.line} />
        <View style={styles.line} />
        <View style={styles.line} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.notificationIcon} onPress={() => Alert.alert("Notifications", "You have no new notifications.")}>
        <Ionicons name="notifications-outline" size={30} color="#fff" />
      </TouchableOpacity>

      <Image source={require("../assets/Logo.png")} style={styles.logo} />

      <View style={styles.contentContainer}>
        <View style={styles.topButtonsContainer}>
          <TouchableOpacity
            style={styles.squareButton}
            onPress={() => router.push("/screens/AIRecipes")}
          >
            <Text style={styles.squareButtonText}>My AI Recipes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.squareButton}
            onPress={() => router.push("/screens/Pantry")}
          >
            <Text style={styles.squareButtonText}>Add to Pantry</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
        >
          <Text style={styles.recipesHeader}>Trending Recipes🧑‍🍳</Text>
          <View style={styles.recipeContainer}>
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
          </View>
        </ScrollView>
      </View>

      {/* Show "Configure Pantry" button only for first-time users */}
      {showButton && (
        <TouchableOpacity
          style={styles.circleButton}
          onPress={handleConfigurePantry}
        >
          <Text style={styles.buttonText}>Configure</Text>
          <Text style={styles.buttonText}>Pantry 🍽️</Text>
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
                {selectedRecipe.imagePath && (
                  <Image
                    source={selectedRecipe.imagePath}
                    style={styles.modalImage}
                  />
                )}
                <Text style={styles.modalText}>{selectedRecipe.description}</Text>
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
        <TouchableOpacity
          style={styles.firstMenuItem}
          onPress={() => handleMenuSelect("Recipes")}
          disabled
        >
          <Text style={styles.menuText}>Recipes</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleMenuSelect("AIRecipes")}>
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
          <Text style={styles.menuText}>Log out</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ADD8E6",
    paddingTop: 10,
  },
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
    zIndex: 1,
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
  topButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "90%",
    marginBottom: 20,
  },
  squareButton: {
    width: width * 0.4,
    height: width * 0.125, // Make the button more like a square vertically
    backgroundColor: "rgba(0, 170, 255, 0.7)", // Adjust the opacity
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 25,
    marginHorizontal: 10,
    borderWidth: 1, // Add border width
    borderColor: "#fff", // Border color
  },
  squareButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  recipesHeader: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  recipeContainer: {
    width: "100%",
    padding: 5,
  },
  recipeCard: {
    backgroundColor: "#ffffff",
    padding: 10,
    marginVertical: 10,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    width: "90%",
    alignSelf: "center",
    flexDirection: "row",
  },
  imageContainer: {
    width: 100,
    height: 100,
    marginRight: 15,
  },
  recipeImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  placeholder: {
    width: 100,
    height: 100,
    backgroundColor: "#E0E0E0",
    borderRadius: 10,
  },
  recipeContent: {
    flex: 1,
  },
  recipeTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  recipeText: {
    fontSize: 14,
    marginLeft: 10,
  },
  circleButton: {
    width: 110,
    height: 110,
    borderRadius: 75,
    backgroundColor: "#AFDFE6",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    position: "absolute",
    bottom: 20,
    borderColor: "#fff",
    borderWidth: 3,
    borderStyle: "dashed",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
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
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "90%",
    height: "75%",
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
});

export default HomeScreen;