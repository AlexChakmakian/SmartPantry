import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";

const CreateAccountButton = ({ onPress, style }) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.button}>
      <Text style={[styles.text, style]}>Create Account</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    marginBottom: 20,
  },
  text: {
    color: "white",
    fontSize: 18, // Default font size
  },
});

export default CreateAccountButton;
