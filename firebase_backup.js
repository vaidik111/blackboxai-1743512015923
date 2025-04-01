// Backup of original firebase.js
// Firebase configuration (replace with your actual config)
const firebaseConfig = {
  apiKey: "AIzaSyDEXAMPLEEXAMPLEEXAMPLE",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef1234567890"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

// Export Firebase services
export { auth, database };