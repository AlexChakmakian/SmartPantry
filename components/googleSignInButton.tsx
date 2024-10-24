import React from "react";
import { TouchableOpacity, Image, StyleSheet } from "react-native";

const GoogleSignInButton = ({ onPress }) => {
  return (
    <TouchableOpacity style={styles.googleSignInButton} onPress={onPress}>
      <Image
        source={require("C:/Users/chine/Documents/repos/SmartPantry/assets/sign-in-with-google.png")}
        style={styles.googleSignInImage}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  googleSignInButton: {
    marginTop: 10,
  },
  googleSignInImage: {
    width: 160,
    height: 50,
    resizeMode: "contain",
  },
});

export default GoogleSignInButton;
