import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

export const CustomDropdown = ({ selectedValue, onValueChange, options }) => {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.dropdownContainer}>
      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => setVisible(true)}
      >
        <Text style={styles.dropdownButtonText}>{selectedValue}</Text>
        <Icon name="chevron-down" size={18} color="#333" />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity
          style={styles.dropdownOverlay}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <View style={styles.dropdownModal}>
            <ScrollView>
              {options.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.dropdownItem,
                    selectedValue === option && styles.dropdownItemSelected,
                  ]}
                  onPress={() => {
                    onValueChange(option);
                    setVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      selectedValue === option &&
                        styles.dropdownItemTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  dropdownContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    backgroundColor: "#f9f9f9",
  },
  dropdownButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 10,
    height: 40,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: "#000",
  },
  dropdownOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  dropdownModal: {
    width: "70%",
    maxHeight: "50%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 10,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dropdownItemSelected: {
    backgroundColor: "#e6f7ff",
  },
  dropdownItemText: {
    fontSize: 16,
    color: "#333",
  },
  dropdownItemTextSelected: {
    color: "#007BFF",
    fontWeight: "bold",
  },
});

export default CustomDropdown;
