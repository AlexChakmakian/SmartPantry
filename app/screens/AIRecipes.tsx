import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Image, TouchableOpacity, Modal, Dimensions } from "react-native";

const API_KEY = "bf9f4c5b0f83442eb2ce0569bb20529b";
const { height } = Dimensions.get('window');

export default function AIRecipes() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchRecipes = () => {
    setLoading(true);
    fetch(`https://api.spoonacular.com/recipes/random?apiKey=${API_KEY}&number=20`)
      .then(response => response.json())
      .then(data => {
        setRecipes(data.recipes);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching recipes:", error);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  const handleRecipePress = (recipe) => {
    setSelectedRecipe(recipe);
    setModalVisible(true);
  };

  const formatInstructions = (instructions) => {
    return instructions
      .replace(/<\/?[^>]+(>|$)/g, "\n") // Replace HTML tags with new lines
      .replace(/\n\s*\n/g, "\n"); // Remove multiple new lines
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AI RECIPES</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          {recipes.map((recipe, index) => (
            <TouchableOpacity key={index} style={styles.recipeContainer} onPress={() => handleRecipePress(recipe)}>
              <Text style={styles.recipeTitle}>{recipe.title}</Text>
              {recipe.image && (
                <Image source={{ uri: recipe.image }} style={styles.recipeImage} />
              )}
            </TouchableOpacity>
          ))}
          <View style={styles.spacer} />
        </ScrollView>
      )}

      <TouchableOpacity style={styles.resetButton} onPress={fetchRecipes}>
        <Text style={styles.resetButtonText}>Generate New Recipes</Text>
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
              <ScrollView contentContainerStyle={styles.modalScrollViewContent}>
                <Text style={styles.modalTitle}>{selectedRecipe.title}</Text>
                {selectedRecipe.image && (
                  <Image source={{ uri: selectedRecipe.image }} style={styles.modalImage} />
                )}
                <Text style={styles.modalText}>Ingredients:</Text>
                {selectedRecipe.extendedIngredients && selectedRecipe.extendedIngredients.map((ingredient, index) => (
                  <Text key={index} style={styles.modalText}>{ingredient.original}</Text>
                ))}
                <Text style={styles.modalText}>Instructions:</Text>
                <Text style={styles.modalText}>{formatInstructions(selectedRecipe.instructions)}</Text>
              </ScrollView>
              <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 50, // Adjust this value to position the text at the top
    backgroundColor: '#ADD8E6',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollViewContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  recipeContainer: {
    marginTop: 20,
    alignItems: 'center',
    width: '90%',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  recipeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  recipeImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
  },
  spacer: {
    height: 50, // Adjust this value to add space at the bottom
  },
  resetButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 20,
    marginBottom: 20,
  },
  resetButtonText: {
    color: '#FFF',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    height: height * 0.75, // Set the height to 75% of the screen height
    backgroundColor: '#fff',
    padding: 10, // Reduced padding
    borderRadius: 10,
    alignItems: 'center',
  },
  modalScrollViewContent: {
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5, // Reduced margin
  },
  modalImage: {
    width: '100%',
    height: 150, // Reduced height
    borderRadius: 10,
    marginBottom: 5, // Reduced margin
  },
  modalText: {
    fontSize: 16,
    marginBottom: 5,
  },
  closeButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 5, // Reduced padding
    paddingHorizontal: 10, // Reduced padding
    borderRadius: 5,
    marginTop: 10, // Reduced margin
    alignSelf: 'center', // Center the button horizontally
  },
  closeButtonText: {
    color: '#FFF',
    fontSize: 16,
  },
});