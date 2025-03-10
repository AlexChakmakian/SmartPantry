import { getAuth } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";

// Maximum number of recipes to store in history
const MAX_HISTORY_ITEMS = 5;

interface RecipeHistoryItem {
  id: number;
  title: string;
  image: string;
  timestamp: number;
}

// Add a recipe to history
export const addRecipeToHistory = async (recipe: {
  id: number;
  title: string;
  image: string;
}) => {
  const user = getAuth().currentUser;
  if (!user) return null;

  try {
    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);

    const historyItem: RecipeHistoryItem = {
      ...recipe,
      timestamp: Date.now(),
    };

    if (userDoc.exists()) {
      // Get current history or create empty array
      const userData = userDoc.data();
      const currentHistory: RecipeHistoryItem[] = userData.recipeHistory || [];

      // Remove this recipe if it already exists in history to avoid duplicates
      const filteredHistory = currentHistory.filter(
        (item) => item.id !== recipe.id
      );

      // Add new recipe to the beginning
      const newHistory = [historyItem, ...filteredHistory];

      // Trim to max length
      const trimmedHistory = newHistory.slice(0, MAX_HISTORY_ITEMS);

      // Update the document
      await updateDoc(userRef, {
        recipeHistory: trimmedHistory,
      });

      return trimmedHistory;
    } else {
      // Create new document with history
      await setDoc(
        userRef,
        {
          recipeHistory: [historyItem],
        },
        { merge: true }
      );

      return [historyItem];
    }
  } catch (error) {
    console.error("Error adding recipe to history:", error);
    return null;
  }
};

// Get user's recipe history
export const getRecipeHistory = async () => {
  const user = getAuth().currentUser;
  if (!user) return [];

  try {
    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      return userData.recipeHistory || [];
    }
    return [];
  } catch (error) {
    console.error("Error getting recipe history:", error);
    return [];
  }
};

// Clear recipe history
export const clearRecipeHistory = async () => {
  const user = getAuth().currentUser;
  if (!user) return false;

  try {
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      recipeHistory: [],
    });
    return true;
  } catch (error) {
    console.error("Error clearing recipe history:", error);
    return false;
  }
};

// Remove a specific recipe from history
export const removeRecipeFromHistory = async (recipeId: number) => {
  const user = getAuth().currentUser;
  if (!user) return false;

  try {
    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      const currentHistory: RecipeHistoryItem[] = userData.recipeHistory || [];
      const updatedHistory = currentHistory.filter(
        (item) => item.id !== recipeId
      );

      await updateDoc(userRef, {
        recipeHistory: updatedHistory,
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error removing recipe from history:", error);
    return false;
  }
};
