import React, { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

// Default avatar if the user doesn't have a profile picture
const DEFAULT_AVATAR = require("../assets/default-avatar.png");

interface UserProfile {
  firstName: string;
  lastName: string;
  photoURL: string | null;
}

const ProfileHeader = () => {
  const [profile, setProfile] = useState<UserProfile>({
    firstName: "",
    lastName: "",
    photoURL: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);
      const user = getAuth().currentUser;

      if (user) {
        try {
          const userRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            setProfile({
              firstName: userData.firstName || "",
              lastName: userData.lastName || "",
              photoURL: userData.photoURL || null,
            });
          } else {
            // Handle case where user document doesn't exist
            console.log("No user profile found in database");
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      }
      setLoading(false);
    };

    fetchUserProfile();
  }, []);

  // Display full name if available, otherwise use email
  const displayName =
    profile.firstName && profile.lastName
      ? `${profile.firstName} ${profile.lastName}`
      : getAuth().currentUser?.email?.split("@")[0] || "User";

  return (
    <View style={styles.profileContainer}>
      <Image
        source={profile.photoURL ? { uri: profile.photoURL } : DEFAULT_AVATAR}
        style={styles.avatar}
      />
      <Text style={styles.userName}>{displayName}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  profileContainer: {
    alignItems: "center",
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#5D6D7E", // Slightly lighter than the menu background
    marginBottom: 10,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "#fff",
  },
  userName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
});

export default ProfileHeader;
