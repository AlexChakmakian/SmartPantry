import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window'); // Get device width for menu slide

const HomeScreen = () => {
  const [isMenuOpen, setMenuOpen] = useState(false); // Track menu state (open/close)
  const slideAnim = useRef(new Animated.Value(-width)).current; // Slide animation starting off-screen

  const toggleMenu = () => {
    setMenuOpen(!isMenuOpen); // Toggle the menu state
    Animated.timing(slideAnim, {
      toValue: isMenuOpen ? -width : 0, // Move menu in or out
      duration: 300, // Animation duration
      useNativeDriver: true, // Optimize performance
    }).start();
  };

  return (
    <View style={styles.container}>
      {/* Hamburger Icon */}
      <TouchableOpacity style={styles.hamburger} onPress={toggleMenu}>
        <View style={styles.line} />
        <View style={styles.line} />
        <View style={styles.line} />
      </TouchableOpacity>

      <Text style={styles.headerText}>Your SmartPantry</Text>

      {/* Main content */}
      <TouchableOpacity style={styles.circleButton}>
        <Text style={styles.buttonText}>Configure</Text>
        <Text style={styles.buttonText}>Pantry 🍽️</Text>
      </TouchableOpacity>

      {/* Animated Sliding Menu */}
      <Animated.View
        style={[
          styles.menuContainer,
          { transform: [{ translateX: slideAnim }] }, // Slide animation
        ]}
      >
        <Text style={styles.menuText}></Text>
        <Text style={styles.menuText}>Home</Text>
        <Text style={styles.menuText}>Profile</Text>
        <Text style={styles.menuText}>Testing</Text>
        <Text style={styles.menuText}>Testing</Text>
        <Text style={styles.menuText}>Testing</Text>
        <Text style={styles.menuText}>Settings</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ADD8E6',
    paddingTop: 20,
  },
  headerText: {
    fontSize: 20,
    textAlign: 'center',
    marginTop: 20,
    color: '#fff',
  },
  hamburger: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 1, // Ensure the hamburger is on top of the menu
  },
  line: {
    width: 30,
    height: 4,
    backgroundColor: '#fff',
    marginVertical: 4,
  },
  circleButton: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#AFDFE6',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 100, // Pushed lower on the screen
    borderColor: '#fff', // White border color
    borderWidth: 3, // Thickness of the border
    borderStyle: 'dashed', // Dashed border style
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
  },
  menuContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: width * 0.40, // CHANGE WIDTH OF CONTAINER THAT OPENS
    backgroundColor: '#4C5D6B',
    padding: 20,
    paddingTop: 60, // To avoid the status bar
    zIndex: 0, // Behind the hamburger icon
  },
  menuText: {
    fontSize: 18,
    color: '#fff',
    marginVertical: 10,
  },
});

export default HomeScreen;
