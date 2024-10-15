import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const HomeScreen = () => {
  return (
    <View style={styles.container}>
      {/* Row containing "sandwich" lines and SmartPantry text */}
      <View style={styles.header}>
        {/* Sandwich made of three horizontal lines */}
        <View style={styles.sandwich}>
          <View style={styles.sandwichLine} />
          <View style={styles.sandwichLine} />
          <View style={styles.sandwichLine} />
        </View>
        <Text style={styles.text}>Your SmartPantry</Text>
      </View>

      {/* Horizontal line (separator) */}
      <View style={styles.separator} />

      {/* Large circular button in the middle */}
      <TouchableOpacity style={styles.circleButton}>
        <Text style={styles.buttonText}>Configure</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ADD8E6',
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row', // Align "sandwich" and text horizontally
    alignItems: 'center', // Vertically center items
    justifyContent: 'center', // Horizontally center the row
    marginBottom: 10, // Space below the header
  },
  sandwich: {
    marginRight: 10, // Space between "sandwich" and text
  },
  sandwichLine: {
    width: 30, // Width of each "sandwich" line
    height: 4, // Height/thickness of each line
    backgroundColor: '#fff', // White color for the lines
    marginVertical: 2, // Space between the lines
  },
  text: {
    fontSize: 20,
    color: '#fff',
  },
  separator: {
    height: 2, // Thickness of the separator line
    backgroundColor: '#fff', // Color of the line
    width: '90%', // Line width across 90% of the screen
    alignSelf: 'center', // Center the line horizontally
    marginVertical: 20, // Space above and below the line
  },
  circleButton: {
    width: 150, // Width of the circle
    height: 150, // Height of the circle
    borderRadius: 75, // Half of width/height to make it a circle
    backgroundColor: '#FF6347', // Tomato color for the button
    justifyContent: 'center', // Center content vertically
    alignItems: 'center', // Center content horizontally
    alignSelf: 'center', // Center the button on the screen
  },
  buttonText: {
    color: '#fff', // White text
    fontSize: 18, // Text size
  },
});

export default HomeScreen;
