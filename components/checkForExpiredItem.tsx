import { getAuth } from "firebase/auth";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  DocumentData,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

const checkForExpiredItems = async () => {
  const user = getAuth().currentUser;
  if (!user) return [];

  const userRef = doc(db, "users", user.uid);
  const userDoc = await getDoc(userRef);
  const expiryThreshold = userDoc.data()?.expiryThreshold || 30;

  const collectionsToCheck = ["pantry", "fridge", "freezer"];
  const expiredItems: DocumentData[] = [];

  for (const collectionName of collectionsToCheck) {
    const collectionRef = collection(db, "users", user.uid, collectionName);
    const querySnapshot = await getDocs(collectionRef);

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const dateAdded = new Date(data.dateAdded);
      const currentDate = new Date();
      const diffDays = Math.ceil(
        (currentDate.getTime() - dateAdded.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays >= expiryThreshold) {
        expiredItems.push({ ...data, location: collectionName });
        console.log(`Item ${data.name} in ${collectionName} has expired`);
        console.log("diffDays:", diffDays);
      }
    });
  }

  return expiredItems;
};

export default checkForExpiredItems;
