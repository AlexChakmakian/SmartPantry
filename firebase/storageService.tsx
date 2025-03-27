import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAuth } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";

const storage = getStorage();

console.log(storage);

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
 */
export const uploadProfileImage = async (imageUri: string) => {
  const user = getAuth().currentUser;

  if (!user) {
    return { success: false, error: "User not authenticated" };
  }

  try {
    // First, ensure the image isn't too large by resizing or compressing if needed
    // Create a file name with timestamp to avoid caching issues
    const fileName = `profile_${user.uid}_${Date.now()}.jpg`;

    // Use FileSystem to read the file as base64
    const base64Image = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Create a reference to the storage location with the new filename
    const storageRef = ref(storage, `profile_images/${fileName}`);

    // Convert base64 to blob
    const blob = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function () {
        resolve(xhr.response);
      };
      xhr.onerror = function (e) {
        console.error("Blob conversion error:", e);
        reject(new Error("Blob conversion failed"));
      };
      xhr.responseType = "blob";
      xhr.open("GET", `data:image/jpeg;base64,${base64Image}`, true);
      xhr.send(null);
    });

    // Upload the blob with content type specified
    const metadata = {
      contentType: "image/jpeg",
    };

    console.log("Starting upload to Firebase Storage...");
    await uploadBytes(storageRef, blob as Blob, metadata);
    console.log("Upload successful!");

    // Close the blob to prevent memory leaks
    (blob as any).close?.();

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
  } catch (error) {
    console.error("Error uploading profile image - detailed error:", error);

    // More detailed error information
    if (error instanceof Error) {
      console.error(`Error name: ${error.name}, message: ${error.message}`);
      if (error.stack) console.error(`Stack trace: ${error.stack}`);
    }

    return {
      success: false,
      error:
        "Failed to upload profile image. Please try again or choose a different image.",
    };
  }
};
