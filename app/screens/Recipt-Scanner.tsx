import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image, TextInput, ScrollView } from "react-native";
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';

const { width } = Dimensions.get('window');

const GOOGLE_API_KEY = "ask cody"; // Replace with your actual API key

export default function ReciptScanner() {
  const [image, setImage] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState<string | null>(null);

  // Function to handle image selection and OCR processing
  const pickImageAndProcess = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      alert("You've refused to allow this app to access your media library!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false, // Set editing to false to avoid deprecation warnings
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {  // Use 'cancelled' instead of 'canceled'
      const imageUri = result.assets[0].uri;
      setImage(imageUri);

      // Move the image to a local file path
      const fileName = imageUri.split('/').pop();
      const newPath = `${FileSystem.documentDirectory}assets/images/${fileName}`;

      try {
        await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}assets/images`, { intermediates: true });
        await FileSystem.moveAsync({
          from: imageUri,
          to: newPath,
        });
        // Call performOCR with the new image path
        await performOCR(newPath);
      } catch (error) {
        console.error("Error saving image:", error);
      }
    }
  };

  // Function to perform OCR using Google Vision API
  const performOCR = async (imageUri: string) => {
    const base64Image = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    try {
      const response = await axios.post(
        `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_API_KEY}`,
        {
          requests: [
            {
              image: {
                content: base64Image,
              },
              features: [
                {
                  type: "TEXT_DETECTION",
                },
              ],
            },
          ],
        }
      );

      const ocrText = response.data.responses[0].fullTextAnnotation?.text || "No text found";
      setOcrText(ocrText);
    } catch (error) {
      console.error("Error performing OCR:", error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Receipt Scanner</Text>
      <TouchableOpacity style={styles.button} onPress={pickImageAndProcess}>
        <Text style={styles.buttonText}>Scan Receipt!</Text>
      </TouchableOpacity>
      {image && <Image source={{ uri: image }} style={styles.image} />}
      {ocrText && (
        <TextInput
          style={styles.ocrText}
          multiline
          editable={false}
          value={ocrText}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ADD8E6',
    padding: 20,
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
  ocrText: {
    marginTop: 20,
    width: width * 0.8,
    height: 200,
    borderColor: '#000',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    backgroundColor: '#fff',
  },
});