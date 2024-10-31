import { initializeApp } from "@firebase/app";
import { getFirestore } from "@firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCUN6Kj0JJJbhE8O_nIalUjp6wbn6slsv0",
  authDomain: "smart-pantry-125d8.firebaseapp.com",
  databaseURL: "https://smart-pantry-125d8-default-rtdb.firebaseio.com",
  projectId: "smart-pantry-125d8",
  storageBucket: "smart-pantry-125d8.appspot.com",
  messagingSenderId: "612766690550",
  appId: "1:612766690550:web:586466662ccb04c76110d7",
  measurementId: "G-T4LTLGK3YB",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default app;
