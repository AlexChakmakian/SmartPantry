import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image } from "react-native";
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

const { width } = Dimensions.get('window');

export default function ReciptScanner() {
  const [image, setImage] = useState<string | null>(null);

  const openCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
      alert("You've refused to allow this app to access your camera!");
      return;
    }

    const result = await ImagePicker.launchCameraAsync();

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const imageUri = result.assets[0].uri;
      const fileName = imageUri.split('/').pop();
      const newPath = `${FileSystem.documentDirectory}assets/images/${fileName}`;

      try {
        await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}assets/images`, { intermediates: true });
        await FileSystem.moveAsync({
          from: imageUri,
          to: newPath,
        });
        setImage(newPath);
      } catch (error) {
        console.error("Error saving image:", error);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recipt Scanner</Text>
      <TouchableOpacity style={styles.button} onPress={openCamera}>
        <Text style={styles.buttonText}>Scan Recipt!</Text>
      </TouchableOpacity>
      {image && <Image source={{ uri: image }} style={styles.image} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ADD8E6',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  button: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#000',
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
  },
  image: {
    marginTop: 20,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: 10,
  },
});