import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";

const CreateAccountButton = ({ onPress }) => {
  return (
    <TouchableOpacity onPress={onPress}>
      <Text style={styles.createAccountText}>Create Account</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  createAccountText: {
    color: "#ffffff",
    fontSize: 14,
  },
});

export default CreateAccountButton;