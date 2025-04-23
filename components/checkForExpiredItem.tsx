import { getAuth } from "firebase/auth";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  DocumentData,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

// Add the interface for expired items
interface ExpiredItem {
  id: string;
  name: string;
  location: string;
  dateAdded: Date;
  expirationDate: Date;
  priority: "high" | "medium" | "low";
}

const checkForExpiredItems = async (): Promise<ExpiredItem[]> => {
  const user = getAuth().currentUser;
  if (!user) return [];

  const userRef = doc(db, "users", user.uid);
  const userDoc = await getDoc(userRef);
  const expiryThreshold = userDoc.data()?.expiryThreshold || 30;

  const collectionsToCheck = ["pantry", "fridge", "freezer"];
  const expiredItems: ExpiredItem[] = [];

  for (const collectionName of collectionsToCheck) {
    const collectionRef = collection(db, "users", user.uid, collectionName);
    const querySnapshot = await getDocs(collectionRef);

    querySnapshot.forEach((document) => {
      const data = document.data();
      const dateAdded = new Date(data.dateAdded);
      const currentDate = new Date();
      const diffDays = Math.ceil(
        (currentDate.getTime() - dateAdded.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays >= expiryThreshold) {
        // Calculate priority based on how long it's been expired
        let priority: "high" | "medium" | "low" = "low";
        if (diffDays >= expiryThreshold + 14) {
          priority = "high";
        } else if (diffDays >= expiryThreshold + 7) {
          priority = "medium";
        }

        // Calculate expiration date based on dateAdded and threshold
        const expirationDate = new Date(dateAdded);
        expirationDate.setDate(dateAdded.getDate() + expiryThreshold);

        expiredItems.push({
          id: document.id,
          name: data.name || "Unnamed Item",
          location: collectionName,
          dateAdded: dateAdded,
          expirationDate: expirationDate,
          priority: priority,
          ...data, // Include any other existing data
        });

        console.log(`Item ${data.name} in ${collectionName} has expired`);
        console.log("diffDays:", diffDays);
      }
    });
  }

  // Sort items by priority (high -> medium -> low)
  return expiredItems.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
};

export default checkForExpiredItems;
