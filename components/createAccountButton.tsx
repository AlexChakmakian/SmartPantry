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
  createAccountText: {
    color: "#ffffff",
    fontSize: 15,
    paddingTop: 0,
  },
});

export default CreateAccountButton;
