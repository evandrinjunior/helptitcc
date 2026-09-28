import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBKwb6HxDovyzfhSc6YKa_xgLoYBZczowA",
  authDomain: "helpti-733d5.firebaseapp.com",
  projectId: "helpti-733d5",
  storageBucket: "helpti-733d5.firebasestorage.app",
  messagingSenderId: "980754900695",
  appId: "1:980754900695:web:f49f57ee086df24385b292"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);