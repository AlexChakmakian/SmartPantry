import { getAuth } from "firebase/auth";
import { doc, updateDoc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Function to get the current user's profile data
export const getUserProfile = async () => {
  const user = getAuth().currentUser;
  if (!user) return null;

  try {
    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      return userDoc.data();
    } else {
      console.log("No user document found!");
      return null;
    }
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
};

// Function to update user profile
export const updateUserProfile = async (profileData: {
  firstName?: string;
  lastName?: string;
  photoURL?: string;
  expiryThreshold?: number;
}) => {
  const user = getAuth().currentUser;
  if (!user) throw new Error("No authenticated user");

  try {
    const userRef = doc(db, "users", user.uid);

    // Check if the document exists first
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      // Update existing document
      await updateDoc(userRef, profileData);
    } else {
      // Create a new document if it doesn't exist
      await setDoc(userRef, {
        email: user.email,
        ...profileData,
      });
    }

    return true;
  } catch (error) {
    console.error("Error updating profile:", error);
    throw error;
  }
};

// Function to upload a profile image and get its URL
export const uploadProfileImage = async (uri: string) => {
  const user = getAuth().currentUser;
  if (!user) throw new Error("No authenticated user");

  try {
    // Convert URI to blob
    const response = await fetch(uri);
    const blob = await response.blob();

    // Upload to Firebase Storage
    const storage = getStorage();
    const storageRef = ref(storage, `profileImages/${user.uid}`);

    await uploadBytes(storageRef, blob);

    // Get the public URL
    const downloadURL = await getDownloadURL(storageRef);

    return downloadURL;
  } catch (error) {
    console.error("Error uploading profile image:", error);
    throw error;
  }
};
