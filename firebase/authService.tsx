// import {
//   getAuth,
//   createUserWithEmailAndPassword,
//   signInWithEmailAndPassword,
//   signOut,
//   sendPasswordResetEmail,
// } from "@firebase/auth";
// import { app } from "./firebaseConfig";

// const auth = getAuth(app);

// export const loginWithEmailAndPassword = (email, password) => {
//   return signInWithEmailAndPassword(auth, email, password);
// };

// export const registerWithEmailAndPassword = (email, password) => {
//   return createUserWithEmailAndPassword(auth, email, password); // This is used to create a new user
// };

// export const logout = () => {
//   return signOut(auth);
// };

// export const resetPassword = (email) => {
//   return sendPasswordResetEmail(auth, email);
// };

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from "@firebase/auth";
import { app } from "./firebaseConfig";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const auth = getAuth(app);
const db = getFirestore(app); // Initialize Firestore

// Function to log in with email and password
export const loginWithEmailAndPassword = (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

// Function to register a new user with email and password
export const registerWithEmailAndPassword = async (
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  pantryItems: any[] // Add pantryItems as a parameter
) => {
  try {
    // Create the user with Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // After user is created, create their document in Firestore
    const userRef = doc(db, "users", user.uid); // Document path is "users/{userId}"

    // Initialize the user's pantry (you can set it to an empty array or predefined items)
    await setDoc(userRef, {
      email: user.email,
      firstName,
      lastName,
      photoURL: null, // Set photoURL to null initially
      pantry: pantryItems || [], // Set pantry items, or an empty array if no items provided
    });

    console.log("User created and pantry data saved");
    console.log("User data:", user.providerData);
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

// Function to log out the user
export const logout = () => {
  return signOut(auth);
};

// Function to send password reset email
export const resetPassword = (email: string) => {
  return sendPasswordResetEmail(auth, email);
};
