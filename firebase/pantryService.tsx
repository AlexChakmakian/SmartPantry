import { db } from "./firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { getAuth } from "firebase/auth"; // Import Firebase Auth to get the current user's uid

const user = getAuth().currentUser;

// Function to add an item to a specific collection for a user
export const addItem = async (location, userId, item) => {
  try {
    // Ensure that `item` is a valid object
    const userRef = collection(db, "users", userId, location); // Reference to user's pantry collection
    await addDoc(userRef, item); // Add item object to Firestore
  } catch (e) {
    console.error("Error adding item: ", e);
  }
};

// Function to retrieve all items from a specific collection for the authenticated user
export const getItems = async (location) => {
  try {
    const user = getAuth().currentUser; // Get the current user
    if (user) {
      const userRef = collection(db, "users", user.uid, location); // Get items from the user's collection
      const querySnapshot = await getDocs(userRef);
      const items = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      return items;
    } else {
      console.error("User not authenticated");
      return [];
    }
  } catch (e) {
    console.error("Error retrieving items: ", e);
  }
};

// Function to update an item in a specific collection for the authenticated user
export const updateItem = async (location, userId, id, updatedData) => {
  try {
    // Check if the updatedData is a valid object and doesn't contain undefined fields
    if (updatedData && updatedData.name && updatedData.quantity) {
      const user = getAuth().currentUser; // Get the current user
      if (user) {
        const itemRef = doc(db, "users", userId, location, id); // Access the item using the user's UID
        console.log("Updating item with data:", updatedData);
        await updateDoc(itemRef, updatedData);
        console.log("Item updated successfully");
      } else {
        console.error("User not authenticated");
      }
    } else {
      console.error("Invalid update data:", updatedData);
      throw new Error(
        "Invalid update data. Ensure all required fields are present."
      );
    }
  } catch (e) {
    console.error("Error updating item: ", e);
  }
};

// Function to delete an item from a specific collection for the authenticated user
export const deleteItem = async (location, userId, id) => {
  try {
    if (userId) {
      const itemRef = doc(db, "users", userId, location, id); // Delete item using user ID and item ID
      await deleteDoc(itemRef); // Perform the deletion in Firestore
    } else {
      console.error("User not authenticated or invalid user ID");
    }
  } catch (e) {
    console.error("Error deleting item: ", e);
  }
};

// import { db } from "./firebaseConfig";
// import {
//   collection,
//   addDoc,
//   getDocs,
//   updateDoc,
//   deleteDoc,
//   doc,
// } from "firebase/firestore";

// // Function to add an item to a specific collection (pantry, spices, fridge, freezer, appliances)
// export const addItem = async (location, item) => {
//   try {
//     await addDoc(collection(db, location), item);
//   } catch (e) {
//     console.error("Error adding item: ", e);
//   }
// };

// // Function to retrieve all items from a specific collection
// export const getItems = async (location) => {
//   try {
//     const querySnapshot = await getDocs(collection(db, location));
//     const items = querySnapshot.docs.map((doc) => ({
//       id: doc.id,
//       ...doc.data(),
//     }));
//     return items;
//   } catch (e) {
//     console.error("Error retrieving items: ", e);
//   }
// };

// // Function to update an item in a specific collection
// export const updateItem = async (location, id, updatedData) => {
//   try {
//     const itemRef = doc(db, location, id);
//     await updateDoc(itemRef, updatedData);
//   } catch (e) {
//     console.error("Error updating item: ", e);
//   }
// };

// // Function to delete an item from a specific collection
// export const deleteItem = async (location, id) => {
//   try {
//     const itemRef = doc(db, location, id);
//     await deleteDoc(itemRef);
//   } catch (e) {
//     console.error("Error deleting item: ", e);
//   }
// };
