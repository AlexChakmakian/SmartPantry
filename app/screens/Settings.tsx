// import React, { useState, useEffect } from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   Button,
//   StyleSheet,
//   Alert,
//   ActivityIndicator,
// } from "react-native";
// import { getAuth } from "firebase/auth";
// import { doc, updateDoc, getDoc } from "firebase/firestore";
// import { db } from "../../firebase/firebaseConfig";

// export default function SettingsScreen() {
//   const [expiryThreshold, setExpiryThreshold] = useState("");
//   const [isLoading, setIsLoading] = useState(false);

//   useEffect(() => {
//     // Fetch the current expiry threshold from Firebase if available
//     const fetchThreshold = async () => {
//       const user = getAuth().currentUser;
//       if (user) {
//         const userRef = doc(db, "users", user.uid);
//         const userDoc = await getDoc(userRef);
//         const threshold = userDoc.data()?.expiryThreshold || 30; // Default to 30 days
//         setExpiryThreshold(threshold.toString()); // Set the state with the fetched value
//       }
//     };
//     fetchThreshold();
//   }, []);

//   const handleSaveThreshold = async () => {
//     const thresholdNumber = Number(expiryThreshold);
//     if (!expiryThreshold || isNaN(thresholdNumber) || thresholdNumber <= 0) {
//       Alert.alert("Error", "Please enter a valid number of days.");
//       return;
//     }

//     setIsLoading(true);
//     const user = getAuth().currentUser;
//     if (user) {
//       try {
//         const userRef = doc(db, "users", user.uid);
//         await updateDoc(userRef, { expiryThreshold: thresholdNumber });
//         Alert.alert("Success", "Expiry threshold updated.");
//       } catch (error) {
//         console.error("Error saving threshold:", error);
//         Alert.alert("Error", "Failed to save expiry threshold.");
//       }
//     }
//     setIsLoading(false);
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.header}>Set Expiry Threshold</Text>
//       <Text style={styles.subHeader}>Notify me when items are older than:</Text>
//       <TextInput
//         style={styles.input}
//         keyboardType="numeric"
//         value={expiryThreshold}
//         onChangeText={setExpiryThreshold}
//         placeholder="Number of days"
//       />
//       {isLoading ? (
//         <ActivityIndicator size="large" color="#007BFF" />
//       ) : (
//         <Button
//           title="Save"
//           onPress={handleSaveThreshold}
//           disabled={isLoading}
//         />
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     padding: 20,
//     backgroundColor: "#ADD8E6",
//   },
//   header: {
//     fontSize: 24,
//     fontWeight: "bold",
//     marginBottom: 20,
//   },
//   subHeader: {
//     fontSize: 18,
//     marginBottom: 10,
//   },
//   input: {
//     width: "80%",
//     height: 40,
//     borderColor: "#ccc",
//     borderWidth: 1,
//     borderRadius: 5,
//     paddingLeft: 10,
//     marginBottom: 20,
//   },
// });

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { getAuth } from "firebase/auth";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";

export default function SettingsScreen() {
  const [expiryThreshold, setExpiryThreshold] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Fetch the current expiry threshold from Firebase if available
    const fetchThreshold = async () => {
      const user = getAuth().currentUser;
      if (user) {
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);
        const threshold = userDoc.data()?.expiryThreshold || 30; // Default to 30 days
        setExpiryThreshold(threshold.toString()); // Set the state with the fetched value
      }
    };
    fetchThreshold();
  }, []);

  const handleSaveThreshold = async () => {
    const thresholdNumber = Number(expiryThreshold);
    if (!expiryThreshold || isNaN(thresholdNumber) || thresholdNumber <= 0) {
      Alert.alert("Error", "Please enter a valid number of days.");
      return;
    }

    setIsLoading(true);
    const user = getAuth().currentUser;
    if (user) {
      try {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, { expiryThreshold: thresholdNumber });
        Alert.alert("Success", "Expiry threshold updated.");
      } catch (error) {
        console.error("Error saving threshold:", error);
        Alert.alert("Error", "Failed to save expiry threshold.");
      }
    }
    setIsLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.header}>Set Expiry Threshold</Text>
        <Text style={styles.subHeader}>
          Notify me when items are older than:
        </Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={expiryThreshold}
          onChangeText={setExpiryThreshold}
          placeholder="Number of days"
        />
        {isLoading ? (
          <ActivityIndicator size="large" color="#007BFF" />
        ) : (
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveThreshold}
            disabled={isLoading}
          >
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ADD8E6", // Soft blue background
    padding: 20,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 15,
    width: "90%",
    padding: 25,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  subHeader: {
    fontSize: 18,
    color: "#555",
    marginBottom: 15,
  },
  input: {
    width: "100%",
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 10,
    paddingLeft: 15,
    fontSize: 16,
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: "#007BFF", // Blue color for the button
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    width: "100%",
  },
  saveButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});
