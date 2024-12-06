import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const RecipeCard = ({ title, imagePath, description }) => (
  <View style={styles.recipeCard}>
    <View style={styles.imageContainer}>
      {imagePath ? (
        <Image source={imagePath} style={styles.recipeImage} resizeMode="cover" />
      ) : (
        <View style={styles.placeholder} />
      )}
    </View>
    <View style={styles.recipeContent}>
      <Text style={styles.recipeTitle}>{title}</Text>
      <Text style={styles.recipeText}>{description}</Text>
    </View>
  </View>
);

const HomeScreen = () => {
  const router = useRouter();
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState('Recipes');
  const [showConfigurePage, setShowConfigurePage] = useState(false);
  const [showRecipes, setShowRecipes] = useState(true);
  const [showButton, setShowButton] = useState(true);
  const slideAnim = useRef(new Animated.Value(-width)).current;

  const toggleMenu = () => {
    setMenuOpen(!isMenuOpen);
    Animated.timing(slideAnim, {
      toValue: isMenuOpen ? -width : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleMenuSelect = (page: string) => {
    setShowConfigurePage(false);
    setMenuOpen(false);
    Animated.timing(slideAnim, {
      toValue: -width,
      duration: 300,
      useNativeDriver: true,
    }).start();

    if (page === 'Recipes') {
      setSelectedMenu(page);
      setShowRecipes(true);
    } else {
      setSelectedMenu(page);
      setShowRecipes(false);
      const paths: { [key: string]: '/screens/Appliances' | '/screens/Freezer' | '/screens/Fridge' | '/screens/Pantry' | '/screens/Spices' | '/' } = {
        Appliances: '/screens/Appliances',
        Freezer: '/screens/Freezer',
        Fridge: '/screens/Fridge',
        Pantry: '/screens/Pantry',
        Spices: '/screens/Spices',
      };
      router.push({
        pathname: paths[page] || '/',
      });
    }
  };

  const handleConfigurePantry = () => {
    setShowButton(false);
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
        {showRecipes && !showConfigurePage && selectedMenu === 'Recipes' && (
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
            <Text style={styles.recipesHeader}>Your Recipes</Text>
            <View style={styles.recipeContainer}>
              <RecipeCard
                title="Spaghetti Alfredo"
                imagePath={require('../assets/spaghetti.jpg')}
                description="A creamy and delicious pasta dish made with Alfredo sauce and garnished with Parmesan cheese."
              />
              <RecipeCard
                title="Steak and Potatoes"
                imagePath={require('../assets/steakpotatoes.jpg')}
                description="A hearty meal featuring a perfectly seasoned steak served with baked potatoes."
              />
              <RecipeCard
                title="Tacos"
                imagePath={require('../assets/tacos.jpg')}
                description="A flavorful Mexican dish with tortillas filled with beef, cheese, and salsa."
              />
              <RecipeCard
                title="Fish and Chips"
                imagePath={require('../assets/fishandchips.jpg')}
                description="A classic British dish with crispy fried fish and golden fries."
              />
            </View>
          </ScrollView>
        )}
        {!showConfigurePage && selectedMenu === 'Pantry' && <Text style={styles.contentText}>Your pantry items:</Text>}
        {!showConfigurePage && selectedMenu === 'Fridge' && <Text style={styles.contentText}>Items in your fridge:</Text>}
        {!showConfigurePage && selectedMenu === 'Freezer' && <Text style={styles.contentText}>Items in your freezer:</Text>}
        {!showConfigurePage && selectedMenu === 'Spices' && <Text style={styles.contentText}>Your spice collection:</Text>}
        {!showConfigurePage && selectedMenu === 'Appliances' && <Text style={styles.contentText}>Your Appliances:</Text>}
        {!showConfigurePage && selectedMenu === 'Log out' && <Text style={styles.contentText}>Logging out...</Text>}
      </View>

      {showButton && (
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
        <TouchableOpacity style={styles.firstMenuItem} onPress={() => handleMenuSelect('Recipes')}>
          <Text style={styles.menuText}>Recipes</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleMenuSelect('Pantry')}>
          <Text style={styles.menuText}>Pantry</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleMenuSelect('Fridge')}>
          <Text style={styles.menuText}>Fridge</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleMenuSelect('Freezer')}>
          <Text style={styles.menuText}>Freezer</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleMenuSelect('Spices')}>
          <Text style={styles.menuText}>Spices</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleMenuSelect('Appliances')}>
          <Text style={styles.menuText}>Appliances</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleMenuSelect('Log out')}>
          <Text style={styles.menuText}>Log out</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ADD8E6',
    paddingTop: 10,
  },
  logo: {
    width: 80,
    height: 80,
    alignSelf: 'center',
    marginTop: 3,
  },
  hamburger: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 1,
  },
  line: {
    width: 30,
    height: 4,
    backgroundColor: '#fff',
    marginVertical: 4,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollViewContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: 20,
  },
  contentContainer: {
    marginTop: 20,
    alignItems: 'center',
    flex: 1,
    width: '100%',
  },
  recipesHeader: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  recipeContainer: {
    width: '100%',
    padding: 5,
  },
  recipeCard: {
    backgroundColor: '#ffffff',
    padding: 10,
    marginVertical: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    width: '90%',
    alignSelf: 'center',
    flexDirection: 'row',
  },
  imageContainer: {
    width: 100,
    height: 100,
    marginRight: 15,
  },
  recipeImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  placeholder: {
    width: 100,
    height: 100,
    backgroundColor: '#E0E0E0',
    borderRadius: 10,
  },
  recipeContent: {
    flex: 1,
  },
  recipeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  recipeText: {
    fontSize: 14,
    marginLeft: 10,
  },
  circleButton: {
    width: 110,
    height: 110,
    borderRadius: 75,
    backgroundColor: '#AFDFE6',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    position: 'absolute',
    bottom: 20,
    borderColor: '#fff',
    borderWidth: 3,
    borderStyle: 'dashed',
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
    width: width * 0.40,
    backgroundColor: '#4C5D6B',
    padding: 20,
    paddingTop: 40,
    zIndex: 0,
  },
  firstMenuItem: {
    paddingTop: 40,
  },
  menuText: {
    fontSize: 18,
    color: '#fff',
    marginVertical: 10,
  },
  configureContainer: {
    alignItems: 'center',
    marginTop: 30,
    padding: 20,
    backgroundColor: '#E0F7FA',
    borderRadius: 10,
  },
  configureText: {
    fontSize: 16,
    color: '#333',
  },
  contentText: {
    fontSize: 18,
    color: '#333',
  },
});

export default HomeScreen;