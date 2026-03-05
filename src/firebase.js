// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

// TODO: Replace with your app's Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyACPs6N80C3i8SS3aG7ahybThWvsPSf19o",
  authDomain: "senul-80301.firebaseapp.com",
  databaseURL: "https://senul-80301-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "senul-80301",
  storageBucket: "senul-80301.firebasestorage.app",
  messagingSenderId: "718343352275",
  appId: "1:718343352275:web:7c0e22dd69981690df8926",
  measurementId: "G-KFYWFF619M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

// Admin UID snippet variable from instructions
export const ADMIN_UID = "lmnBm1FBQNgD6CJGAFuHRzaC6DD2";
