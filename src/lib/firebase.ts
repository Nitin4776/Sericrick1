// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCJUTQ6qDpKXN6LYTGbyt4u7Ixdk8wmqP8",
  authDomain: "cricklive-tb354.firebaseapp.com",
  projectId: "cricklive-tb354",
  storageBucket: "cricklive-tb354.appspot.com",
  messagingSenderId: "290919398005",
  appId: "1:290919398005:web:2b6195652728a57a4c563c"
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
