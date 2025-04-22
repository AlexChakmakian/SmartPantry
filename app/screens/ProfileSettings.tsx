import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Animated,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { getAuth, signOut } from "firebase/auth";
import { Ionicons } from "@expo/vector-icons";
import AnimatedSideMenu from "@/components/SideMenu";
import {
  getUserProfile,
  updateUserProfile,
  UserProfile,
} from "../../firebase/profileService";
import {
  pickImage,
  takePhoto,
  uploadProfileImage,
} from "../../firebase/storageService";

const { width } = Dimensions.get("window");

// Default avatar
const DEFAULT_AVATAR = require("../../assets/default-avatar.png");

export default function ProfileSettings() {
  const [profile, setProfile] = useState<UserProfile>({
    firstName: "",
    lastName: "",
    photoURL: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [tempImageUri, setTempImageUri] = useState<string | null>(null);
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [showImageOptions, setShowImageOptions] = useState(false);
  const slideAnim = useRef(new Animated.Value(-width)).current;

  const router = useRouter();
  const auth = getAuth();

  // Load user profile on component mount
  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      const userProfile = await getUserProfile();
      if (userProfile) {
        setProfile(userProfile);
      }
      setLoading(false);
    };

    loadProfile();
  }, []);

  const toggleMenu = () => {
    setMenuOpen(!isMenuOpen);
    // Animated.timing(slideAnim, {
    //   toValue: isMenuOpen ? -width : 0,
    //   duration: 300,
    //   useNativeDriver: true,
    // }).start();
  };

  const handleMenuSelect = async (page) => {
    setMenuOpen(false);
    Animated.timing(slideAnim, {
      toValue: -width,
      duration: 300,
      useNativeDriver: true,
    }).start();

    if (page === "Log out") {
      try {
        await signOut(auth);
        console.log("User signed out");
        router.push("/");
      } catch (error) {
        console.error("Error signing out:", error);
      }
    } else {
      const paths = {
        Home: "/home",
        AIRecipes: "/screens/AIRecipes",
        Pantry: "/screens/Pantry",
        Fridge: "/screens/Fridge",
        Freezer: "/screens/Freezer",
        Spices: "/screens/Spices",
        Appliances: "/screens/Appliances",
        History: "/screens/History",
        Bookmarked: "/screens/Bookmarked",
        ReceiptScanner: "/screens/ReceiptScanner",
        ProfileSettings: "/screens/ProfileSettings",
        Settings: "/Settings",
      };
      router.push({
        pathname: paths[page] || "/home",
      });
    }
  };

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);

      // Upload image if there's a temporary one
      if (tempImageUri) {
        setUploadingImage(true);
        const uploadResult = await uploadProfileImage(tempImageUri);
        setUploadingImage(false);

        if (uploadResult.success) {
          setProfile((prev) => ({
            ...prev,
            photoURL: uploadResult.downloadURL || null,
          }));
          setTempImageUri(null);
        } else {
          Alert.alert(
            "Error",
            "Failed to upload profile image. Please try again."
          );
          setSaving(false);
          return;
        }
      }

      // Update profile data
      const success = await updateUserProfile({
        firstName: profile.firstName,
        lastName: profile.lastName,
        photoURL: profile.photoURL,
      });
      console.log("Profile updated:", success);

      if (success) {
        Alert.alert("Success", "Profile updated successfully");
      } else {
        Alert.alert("Error", "Failed to update profile. Please try again.");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleSelectImage = async () => {
    setShowImageOptions(true);
  };

  const handleImagePickerResponse = async (result: {
    success: boolean;
    uri?: string;
    error?: string;
  }) => {
    setShowImageOptions(false);

    if (result.success && result.uri) {
      // Set the temporary URI for preview
      setTempImageUri(result.uri);
    } else if (result.error) {
      Alert.alert("Error", result.error);
    }
  };

  const handleGallerySelect = async () => {
    const result = await pickImage();
    handleImagePickerResponse(result);
  };

  const handleCameraSelect = async () => {
    const imageuri = await takePhoto();
    if (imageuri) {
      setLoading(true);
      const result = await uploadProfileImage(imageuri);
      setLoading(false);

      if (result.success) {
        Alert.alert("Success", "Profile picture updated!");
      } else {
        Alert.alert("Error", result.error);
      }
    }

    // handleImagePickerResponse(result);
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text style={styles.loaderText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Add overlay to close menu when clicking anywhere on the screen */}
      {isMenuOpen && (
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={toggleMenu}
        />
      )}

      <TouchableOpacity style={styles.hamburger} onPress={toggleMenu}>
        <View style={styles.line} />
        <View style={styles.line} />
        <View style={styles.line} />
      </TouchableOpacity>

      <Image source={require("../../assets/Logo.png")} style={styles.logo} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Profile Settings</Text>

        <View style={styles.profileImageContainer}>
          <Image
            source={
              tempImageUri
                ? { uri: tempImageUri }
                : profile.photoURL
                ? { uri: profile.photoURL }
                : DEFAULT_AVATAR
            }
            style={styles.profileImage}
          />
          <TouchableOpacity
            style={styles.changePhotoButton}
            onPress={handleSelectImage}
            disabled={uploadingImage}
          >
            {uploadingImage ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.changePhotoText}>Change Photo</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>First Name</Text>
          <TextInput
            style={styles.input}
            value={profile.firstName}
            onChangeText={(text) => handleInputChange("firstName", text)}
            placeholder="Enter first name"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Last Name</Text>
          <TextInput
            style={styles.input}
            value={profile.lastName}
            onChangeText={(text) => handleInputChange("lastName", text)}
            placeholder="Enter last name"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.emailText}>
            {profile.email || "No email address"}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSaveProfile}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Image option modal */}
      {showImageOptions && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Profile Picture</Text>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={handleGallerySelect}
            >
              <Ionicons name="images" size={24} color="#007BFF" />
              <Text style={styles.modalOptionText}>Choose from Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={handleCameraSelect}
            >
              <Ionicons name="camera" size={24} color="#007BFF" />
              <Text style={styles.modalOptionText}>Take a Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowImageOptions(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* <Animated.View
        style={[
          styles.menuContainer,
          { transform: [{ translateX: slideAnim }] },
        ]}
      >
        <SideMenu onSelectMenuItem={handleMenuSelect} />
      </Animated.View> */}
      <AnimatedSideMenu
        isMenuOpen={isMenuOpen}
        onClose={() => setMenuOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  menuOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
    zIndex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#C1E0EC",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ADD8E6",
  },
  loaderText: {
    marginTop: 10,
    color: "#333",
    fontSize: 16,
  },
  hamburger: {
    position: "absolute",
    top: 40,
    left: 20,
    zIndex: 5,
  },
  line: {
    width: 30,
    height: 4,
    backgroundColor: "#fff",
    marginVertical: 4,
  },
  menuContainer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: width * 0.4,
    backgroundColor: "#4C5D6B",
    padding: 20,
    paddingTop: 40,
    zIndex: 0,
  },
  logo: {
    width: 85,
    height: 85,
    alignSelf: "center",
    marginTop: 20,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  profileImageContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 3,
    borderColor: "#fff",
  },
  changePhotoButton: {
    backgroundColor: "#007BFF",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 10,
  },
  changePhotoText: {
    color: "#fff",
    fontWeight: "bold",
  },
  formGroup: {
    width: "80%",
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#333",
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    color: "#333",
  },
  emailText: {
    fontSize: 16,
    padding: 12,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    color: "#666",
  },
  saveButton: {
    backgroundColor: "#28a745",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
    marginTop: 10,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    width: "100%",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalOptionText: {
    fontSize: 16,
    marginLeft: 10,
    color: "#333",
  },
  modalCancelButton: {
    marginTop: 15,
    paddingVertical: 10,
  },
  modalCancelText: {
    color: "#dc3545",
    fontWeight: "bold",
    fontSize: 16,
  },
});
