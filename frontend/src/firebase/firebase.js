import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyADQVBs-BHrvK_ZDa4Rhb8aDf7_icaVxco",
  authDomain: "memora-ai-ae65d.firebaseapp.com",
  projectId: "memora-ai-ae65d",
  storageBucket: "memora-ai-ae65d.firebasestorage.app",
  messagingSenderId: "921668792940",
  appId: "1:921668792940:web:b71427a3ae97762a599e49",
  measurementId: "G-J4W6BGL7BX"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export default app;