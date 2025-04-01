import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAuth } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";
import { uploadBytesResumable } from "firebase/storage";

const storage = getStorage();

/**
 * Picks an image from the device's media library
 */
export const pickImage = async () => {
  try {
    // Request media library permissions
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      return {
        success: false,
        error: "Permission to access media library was denied",
      };
    }

    // Launch the image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled) {
      return { success: false, error: "Image selection was canceled" };
    }

    return { success: true, uri: result.assets[0].uri };
  } catch (error) {
    console.error("Error picking image:", error);
    return { success: false, error: "Failed to pick image" };
  }
};

/**
 * Takes a photo using the device's camera
 */
export const takePhoto = async () => {
  try {
    // Request camera permissions
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (!permissionResult.granted) {
      return {
        success: false,
        error: "Permission to access camera was denied",
      };
    }

    // Launch the camera
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled) {
      return { success: false, error: "Camera capture was canceled" };
    }

    return { success: true, uri: result.assets[0].uri };
  } catch (error) {
    console.error("Error taking photo:", error);
    return { success: false, error: "Failed to take photo" };
  }
};

/**
 * Uploads an image to Firebase Storage and updates the user's profile
 * This version handles both gallery and camera photos reliably
 */
export const uploadProfileImage = async (imageUri: string) => {
  const user = getAuth().currentUser;

  if (!user) {
    return { success: false, error: "User not authenticated" };
  }

  console.log(
    "Starting upload process with URI:",
    imageUri.substring(0, 30) + "..."
  );
  console.log("Running on platform:", Platform.OS);

  try {
    // Create a file name with timestamp to avoid caching issues
    const fileName = `profile_${user.uid}_${Date.now()}.jpg`;

    // First create a resized/processed copy of the image in app cache
    // This helps normalize various image sources (camera, gallery, etc.)
    const processedUri = `${FileSystem.cacheDirectory}${fileName}`;

    console.log("Will save processed image to:", processedUri);

    // Copy and potentially resize the image
    await FileSystem.copyAsync({
      from: imageUri,
      to: processedUri,
    });

    console.log("Image processed and saved to cache");

    // Create a storage reference
    const storageRef = ref(storage, `profile_images/${fileName}`);
    console.log("Storage reference created");

    // Different upload approach based on platform
    if (Platform.OS === "web") {
      return webUpload(processedUri, storageRef, user);
    } else {
      return nativeUpload(processedUri, storageRef, user);
    }
  } catch (error) {
    console.error("Error in upload preparation:", error);

    if (error instanceof Error) {
      console.error(`Error name: ${error.name}, message: ${error.message}`);
      if (error.stack) console.error(`Stack trace: ${error.stack}`);
    }

    return {
      success: false,
      error: "Failed to prepare image for upload",
    };
  }
};

// Helper function for web upload
const webUpload = async (imageUri, storageRef, user) => {
  try {
    console.log("Using web upload approach");
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // Upload the blob
    await uploadBytes(storageRef, blob);

    return finalizeUpload(storageRef, user);
  } catch (error) {
    console.error("Web upload failed:", error);
    return { success: false, error: "Web upload failed" };
  }
};

// Helper function for native upload (iOS/Android)
const nativeUpload = async (imageUri, storageRef, user) => {
  try {
    console.log("Using native upload approach");

    // Read the file as binary data
    const fileInfo = await FileSystem.getInfoAsync(imageUri);
    console.log("File exists:", fileInfo.exists, "Size:", fileInfo.size);

    if (!fileInfo.exists) {
      console.error("File does not exist at path:", imageUri);
      return { success: false, error: "File not found" };
    }

    // Convert file to blob using fetch API
    // This is more reliable than the XMLHttpRequest approach
    const response = await fetch(imageUri);
    const blob = await response.blob();
    console.log("File converted to blob, size:", blob.size);

    // Upload with progress tracking
    return new Promise((resolve, reject) => {
      const uploadTask = uploadBytesResumable(storageRef, blob);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          // Track progress
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload progress: ${progress.toFixed(2)}%`);
        },
        (error) => {
          console.error("Upload error:", error);
          reject({ success: false, error: "Upload failed during transfer" });
        },
        async () => {
          // Upload completed successfully
          console.log("Upload completed");
          try {
            const result = await finalizeUpload(storageRef, user);
            resolve(result);
          } catch (error) {
            console.error("Finalization error:", error);
            reject({ success: false, error: "Failed to complete upload" });
          }
        }
      );
    });
  } catch (error) {
    console.error("Native upload failed:", error);
    return { success: false, error: "Native upload failed" };
  }
};

// Helper function to finalize the upload (get URL and update profile)
const finalizeUpload = async (storageRef, user) => {
  // Get the download URL
  const downloadURL = await getDownloadURL(storageRef);
  console.log("Download URL obtained:", downloadURL);

  // Update user's profile document in Firestore
  const userRef = doc(db, "users", user.uid);
  await updateDoc(userRef, {
    photoURL: downloadURL,
  });
  console.log("User profile updated with new photo URL");

  return { success: true, downloadURL };
};
