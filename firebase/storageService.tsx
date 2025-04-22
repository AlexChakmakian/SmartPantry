import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
} from "firebase/storage";
import { getAuth } from "firebase/auth";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db, storage } from "./firebaseConfig";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { Platform, Alert } from "react-native";

// Initialize Firebase Storage
//const storage = getStorage();
const auth = getAuth();

/**
 * Pick an image from the device gallery
 */
export const pickImage = async () => {
  try {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "We need photo library permissions to upload images."
      );
      return null;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0].uri;
    }

    return null;
  } catch (error) {
    console.error("Error picking image:", error);
    Alert.alert("Error", "Failed to pick image from gallery");
    return null;
  }
};

/**
 * Take a photo using the device camera
 */
export const takePhoto = async () => {
  try {
    // Request permission
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "We need camera permissions to take photos."
      );
      return null;
    }

    // Launch camera
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0].uri;
    }

    return null;
  } catch (error) {
    console.error("Error taking photo:", error);
    Alert.alert("Error", "Failed to take photo");
    return null;
  }
};

/**
 * Uploads an image to Firebase Storage
 * @param {string} uri - Local URI of the image
 * @param {string} path - Storage path where the image should be saved
 * @param {Function} onProgress - Optional callback for upload progress
 * @returns {Promise<string>} Download URL of the uploaded image
 */
export const uploadImage = async (uri, path, onProgress = null) => {
  try {
    console.log(`Starting upload to path: ${path}`);

    // Get file info
    const fileInfo = await FileSystem.getInfoAsync(uri);
    console.log("File info:", fileInfo);

    if (!fileInfo.exists) {
      throw new Error("File does not exist");
    }

    // Create a storage reference
    const storageRef = ref(storage, path);

    // Create a blob from the file
    const blob = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function () {
        resolve(xhr.response);
      };
      xhr.onerror = function (e) {
        console.error("XHR error:", e);
        reject(new Error("Network request failed"));
      };
      xhr.responseType = "blob";
      xhr.open("GET", uri, true);
      xhr.send(null);
    });

    console.log("Blob created successfully, size:", blob.size);

    // Upload the blob
    const uploadTask = uploadBytesResumable(storageRef, blob);

    // Monitor upload progress
    return new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload progress: ${progress.toFixed(2)}%`);

          if (onProgress) {
            onProgress(progress);
          }
        },
        (error) => {
          // Handle unsuccessful uploads
          console.error("Upload error:", error);
          console.error("Error code:", error.code);
          console.error("Error message:", error.message);

          // Clean up the blob
          blob.close();

          reject(error);
        },
        async () => {
          // Upload completed successfully
          console.log("Upload completed successfully");

          // Clean up the blob
          blob.close();

          // Get download URL
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log("File available at:", downloadURL);
            resolve(downloadURL);
          } catch (error) {
            console.error("Error getting download URL:", error);
            reject(error);
          }
        }
      );
    });
  } catch (error) {
    console.error("Error in uploadImage:", error);
    throw error;
  }
};

/**
 * Uploads a profile image and updates the user's profile
 * @param {string} imageUri - Local URI of the image
 * @returns {Promise<Object>} Result object with success status and download URL
 */
export const uploadProfileImage = async (imageUri) => {
  const user = auth.currentUser;

  if (!user) {
    return { success: false, error: "User not authenticated" };
  }

  try {
    console.log("Starting profile image upload");

    // Generate a unique file path
    const filePath = `profile_images/${user.uid}_${Date.now()}.jpg`;

    // Upload the image
    const downloadURL = await uploadImage(imageUri, filePath, (progress) => {
      console.log(`Profile image upload progress: ${progress.toFixed(2)}%`);
    });

    // Update user profile in Firestore
    const userRef = doc(db, "users", user.uid);

    // Get current user data to check if they already have a profile image
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      const userData = userDoc.data();

      // If user had a previous profile image, delete it
      if (userData.photoURL && userData.photoURL.includes("profile_images")) {
        try {
          const oldImagePath = extractPathFromURL(userData.photoURL);
          if (oldImagePath) {
            await deleteImage(oldImagePath);
          }
        } catch (error) {
          console.log("Failed to delete old profile image, continuing anyway");
        }
      }
    }

    // Update user profile with new image URL
    await updateDoc(userRef, {
      photoURL: downloadURL,
    });

    return { success: true, downloadURL };
  } catch (error) {
    console.error("Error uploading profile image:", error);
    return {
      success: false,
      error: error.message || "Failed to upload profile image",
    };
  }
};

/**
 * Upload a receipt image and return the download URL
 * @param {string} imageUri - Local URI of the image
 * @returns {Promise<Object>} Result object with success status and download URL
 */
export const uploadReceiptImage = async (imageUri) => {
  const user = auth.currentUser;

  if (!user) {
    return { success: false, error: "User not authenticated" };
  }

  try {
    console.log("Starting receipt image upload");

    // Generate a unique file path
    const filePath = `receipts/${user.uid}/${Date.now()}.jpg`;

    // Upload the image
    const downloadURL = await uploadImage(imageUri, filePath);

    return { success: true, downloadURL };
  } catch (error) {
    console.error("Error uploading receipt image:", error);
    return {
      success: false,
      error: error.message || "Failed to upload receipt image",
    };
  }
};

/**
 * Upload a food item image and return the download URL
 * @param {string} imageUri - Local URI of the image
 * @param {string} itemType - Type of food item (pantry, fridge, etc.)
 * @returns {Promise<Object>} Result object with success status and download URL
 */
export const uploadFoodItemImage = async (imageUri, itemType) => {
  const user = auth.currentUser;

  if (!user) {
    return { success: false, error: "User not authenticated" };
  }

  try {
    console.log(`Starting ${itemType} item image upload`);

    // Generate a unique file path
    const filePath = `food_items/${user.uid}/${itemType}/${Date.now()}.jpg`;

    // Upload the image
    const downloadURL = await uploadImage(imageUri, filePath);

    return { success: true, downloadURL };
  } catch (error) {
    console.error(`Error uploading ${itemType} image:`, error);
    return {
      success: false,
      error: error.message || `Failed to upload ${itemType} image`,
    };
  }
};

/**
 * Delete an image from Firebase Storage
 * @param {string} path - Storage path of the image to delete
 */
export const deleteImage = async (path) => {
  try {
    const imageRef = ref(storage, path);
    await deleteObject(imageRef);
    console.log(`Image deleted: ${path}`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting image:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Extract storage path from download URL
 * @param {string} url - Download URL
 * @returns {string|null} Storage path or null if not found
 */
export const extractPathFromURL = (url) => {
  if (!url) return null;

  try {
    // Firebase Storage URLs contain "/o/" followed by the encoded path
    const regex = /firebasestorage\.googleapis\.com\/v0\/b\/[^\/]+\/o\/([^?]+)/;
    const match = url.match(regex);

    if (match && match[1]) {
      // Decode the URL-encoded path
      return decodeURIComponent(match[1]);
    }

    return null;
  } catch (error) {
    console.error("Error extracting path from URL:", error);
    return null;
  }
};

/**
 * Debug function to verify Firebase Storage setup
 */
export const debugStorageConnection = async () => {
  try {
    console.log("--- Firebase Storage Debug ---");

    // Check if storage is initialized
    if (!storage) {
      console.error("Storage not initialized");
      return { success: false, error: "Storage not initialized" };
    }

    console.log("Storage initialized successfully");

    // Check authentication
    const user = auth.currentUser;
    console.log(
      "Current user:",
      user ? `${user.uid} (${user.email})` : "No user signed in"
    );

    if (!user) {
      return {
        success: true,
        message: "Storage initialized but no user is signed in",
      };
    }

    // Try to list some files
    try {
      const listRef = ref(storage, `profile_images`);
      const result = await listAll(listRef);
      console.log(`Found ${result.items.length} profile images`);
    } catch (error) {
      console.error("Error listing files:", error);
      return {
        success: false,
        error: `Error listing files: ${error.message}`,
        initialized: true,
      };
    }

    return {
      success: true,
      message: "Storage connection verified successfully",
      user: { uid: user.uid, email: user.email },
    };
  } catch (error) {
    console.error("Storage debug error:", error);
    return { success: false, error: error.message };
  }
};
