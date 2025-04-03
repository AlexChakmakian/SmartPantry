import { getAuth } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";

export interface UserProfile {
  firstName: string;
  lastName: string;
  photoURL: string | null;
  email?: string;
}

/**
 * Fetches the current user's profile from Firestore
 */
export const getUserProfile = async (): Promise<UserProfile | null> => {
  const user = getAuth().currentUser;

  if (!user) {
    return null;
  }

  try {
    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      return {
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        photoURL: userData.photoURL || null,
        email: user.email || undefined,
      };
    } else {
      // If no profile exists, create an empty one
      const newProfile = {
        firstName: "",
        lastName: "",
        photoURL: null,
        email: user.email || undefined,
      };

      await setDoc(userRef, newProfile);
      return newProfile;
    }
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
};

/**
 * Updates the current user's profile in Firestore
 */
export const updateUserProfile = async (
  profileData: Partial<UserProfile>
): Promise<boolean> => {
  const user = getAuth().currentUser;

  if (!user) {
    return false;
  }

  try {
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, profileData);
    return true;
  } catch (error) {
    console.error("Error updating user profile:", error);
    return false;
  }
};

/**
 * Creates a new user profile in Firestore
 */
export const createUserProfile = async (
  profileData: UserProfile
): Promise<boolean> => {
  const user = getAuth().currentUser;

  if (!user) {
    return false;
  }

  try {
    const userRef = doc(db, "users", user.uid);
    await setDoc(userRef, profileData);
    return true;
  } catch (error) {
    console.error("Error creating user profile:", error);
    return false;
  }
};
