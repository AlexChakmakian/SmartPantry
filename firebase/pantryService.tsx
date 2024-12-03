import { db } from "./firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

// Function to add an item to a specific collection (pantry, spices, fridge, freezer, appliances)
export const addItem = async (location, item) => {
  try {
    await addDoc(collection(db, location), item);
  } catch (e) {
    console.error("Error adding item: ", e);
  }
};

// Function to retrieve all items from a specific collection
export const getItems = async (location) => {
  try {
    const querySnapshot = await getDocs(collection(db, location));
    const items = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return items;
  } catch (e) {
    console.error("Error retrieving items: ", e);
  }
};

// Function to update an item in a specific collection
export const updateItem = async (location, id, updatedData) => {
  try {
    const itemRef = doc(db, location, id);
    await updateDoc(itemRef, updatedData);
  } catch (e) {
    console.error("Error updating item: ", e);
  }
};

// Function to delete an item from a specific collection
export const deleteItem = async (location, id) => {
  try {
    const itemRef = doc(db, location, id);
    await deleteDoc(itemRef);
  } catch (e) {
    console.error("Error deleting item: ", e);
  }
};
