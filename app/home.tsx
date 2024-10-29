import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
} from 'react-native';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState('Home');
  const [showConfigurePage, setShowConfigurePage] = useState(false);
  const slideAnim = useRef(new Animated.Value(-width)).current;

  const toggleMenu = () => {
    setMenuOpen(!isMenuOpen);
    Animated.timing(slideAnim, {
      toValue: isMenuOpen ? -width : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleMenuSelect = (menuItem: any) => {
    setShowConfigurePage(false); // Hide Configure page when selecting a menu item
    setSelectedMenu(menuItem);
    toggleMenu();
  };

  const handleConfigurePantry = () => {
    setSelectedMenu(''); // Deselect menu items when opening Configure
    setShowConfigurePage(true);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.hamburger} onPress={toggleMenu}>
        <View style={styles.line} />
        <View style={styles.line} />
        <View style={styles.line} />
      </TouchableOpacity>

      <Image source={require('../assets/Logo.png')} style={styles.logo} />

      <View style={styles.contentContainer}>
        {!showConfigurePage && selectedMenu === 'Home' && <Text style={styles.contentText}>Welcome to your Smart Pantry!</Text>}
        {!showConfigurePage && selectedMenu === 'Recipes' && <Text style={styles.contentText}>Your Recipes</Text>}
        {!showConfigurePage && selectedMenu === 'Pantry' && <Text style={styles.contentText}>Your pantry items:</Text>}
        {!showConfigurePage && selectedMenu === 'Fridge' && <Text style={styles.contentText}>Items in your fridge:</Text>}
        {!showConfigurePage && selectedMenu === 'Freezer' && <Text style={styles.contentText}>Items in your freezer:</Text>}
        {!showConfigurePage && selectedMenu === 'Spices' && <Text style={styles.contentText}>Your spice collection:</Text>}
        {!showConfigurePage && selectedMenu === 'Appliances' && <Text style={styles.contentText}>Your Appliances:</Text>}
        {!showConfigurePage && selectedMenu === 'Log out' && <Text style={styles.contentText}>Logging out...</Text>}
      </View>

      {showConfigurePage ? (
        <View style={styles.configureContainer}>
          <Text style={styles.configureText}>Pantry Configuration</Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.circleButton} onPress={handleConfigurePantry}>
          <Text style={styles.buttonText}>Configure</Text>
          <Text style={styles.buttonText}>Pantry 🍽️</Text>
        </TouchableOpacity>
      )}

      <Animated.View
        style={[
          styles.menuContainer,
          { transform: [{ translateX: slideAnim }] },
        ]}
      >
        <Text style={styles.menuText}></Text>
        <TouchableOpacity onPress={() => handleMenuSelect('Recipes')}><Text style={styles.menuText}>Recipes</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => handleMenuSelect('Pantry')}><Text style={styles.menuText}>Pantry</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => handleMenuSelect('Fridge')}><Text style={styles.menuText}>Fridge</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => handleMenuSelect('Freezer')}><Text style={styles.menuText}>Freezer</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => handleMenuSelect('Spices')}><Text style={styles.menuText}>Spices</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => handleMenuSelect('Appliances')}><Text style={styles.menuText}>Appliances</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => handleMenuSelect('Log out')}><Text style={styles.menuText}>Log out</Text></TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ADD8E6', paddingTop: 20 },
  logo: { width: 80, height: 80, alignSelf: 'center', marginTop: -5 },
  hamburger: { position: 'absolute', top: 40, left: 20, zIndex: 1 },
  line: { width: 30, height: 4, backgroundColor: '#fff', marginVertical: 4 },
  circleButton: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#AFDFE6',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 100,
    borderColor: '#fff',
    borderWidth: 3,
    borderStyle: 'dashed',
  },
  buttonText: { color: '#fff', fontSize: 18 },
  menuContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: width * 0.40,
    backgroundColor: '#4C5D6B',
    padding: 20,
    paddingTop: 60,
    zIndex: 0,
  },
  menuText: { fontSize: 18, color: '#fff', marginVertical: 10 },
  contentContainer: { marginTop: 50, alignItems: 'center' },
  contentText: { fontSize: 18, color: '#333' },
  configureContainer: {
    alignItems: 'center',
    marginTop: 30,
    padding: 20,
    backgroundColor: '#E0F7FA',
    borderRadius: 10,
  },
  configureText: { fontSize: 16, color: '#333' },
});

export default HomeScreen;