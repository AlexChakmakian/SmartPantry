import { getAuth } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";

interface BookmarkedRecipe {
  id: number;
  title: string;
  image?: string;
  timestamp: number;
}

// Add a recipe to bookmarks
export const addBookmark = async (recipe: {
  id: number;
  title: string;
  image?: string;
}) => {
  const user = getAuth().currentUser;
  if (!user) return null;

  try {
    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);

    const bookmarkItem: BookmarkedRecipe = {
      ...recipe,
      timestamp: Date.now(),
    };

    if (userDoc.exists()) {
      // Get current bookmarks or create empty array
      const userData = userDoc.data();
      const currentBookmarks: BookmarkedRecipe[] =
        userData.bookmarkedRecipes || [];

      // Check if recipe is already bookmarked
      const existingIndex = currentBookmarks.findIndex(
        (item) => item.id === recipe.id
      );

      if (existingIndex >= 0) {
        // Recipe is already bookmarked, nothing to do
        return currentBookmarks;
      }

      // Add new bookmark
      const newBookmarks = [...currentBookmarks, bookmarkItem];

      // Update the document
      await updateDoc(userRef, {
        bookmarkedRecipes: newBookmarks,
      });

      return newBookmarks;
    } else {
      // Create new document with bookmarks
      await setDoc(
        userRef,
        {
          bookmarkedRecipes: [bookmarkItem],
        },
        { merge: true }
      );

      return [bookmarkItem];
    }
  } catch (error) {
    console.error("Error adding bookmark:", error);
    return null;
  }
};

// Remove a recipe from bookmarks
export const removeBookmark = async (recipeId: number) => {
  const user = getAuth().currentUser;
  if (!user) return null;

  try {
    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      const currentBookmarks: BookmarkedRecipe[] =
        userData.bookmarkedRecipes || [];

      // Remove the recipe from bookmarks
      const newBookmarks = currentBookmarks.filter(
        (item) => item.id !== recipeId
      );

      // Update the document
      await updateDoc(userRef, {
        bookmarkedRecipes: newBookmarks,
      });

      return newBookmarks;
    }
    return [];
  } catch (error) {
    console.error("Error removing bookmark:", error);
    return null;
  }
};

// Get all bookmarked recipes
export const getBookmarks = async () => {
  const user = getAuth().currentUser;
  if (!user) return [];

  try {
    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      return userData.bookmarkedRecipes || [];
    }
    return [];
  } catch (error) {
    console.error("Error getting bookmarks:", error);
    return [];
  }
};

// Check if a recipe is bookmarked
export const isRecipeBookmarked = async (recipeId: number) => {
  const user = getAuth().currentUser;
  if (!user) return false;

  try {
    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      const bookmarks: BookmarkedRecipe[] = userData.bookmarkedRecipes || [];
      return bookmarks.some((item) => item.id === recipeId);
    }
    return false;
  } catch (error) {
    console.error("Error checking bookmark:", error);
    return false;
  }
};
