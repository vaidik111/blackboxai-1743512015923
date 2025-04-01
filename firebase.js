// Firebase configuration (replace with your actual config)
const firebaseConfig = {
  apiKey: "AIzaSyBeh71LqtkHN2s6eGQK0bUzq_VsdLgcDZw",
  authDomain: "videocallapp-7ae84.firebaseapp.com",
  databaseURL: "https://console.firebase.google.com/project/videocallapp-7ae84/database/videocallapp-7ae84-default-rtdb/data/~2F",
  storageBucket: "videocallapp-7ae84.firebasestorage.app",
  projectId: "videocallapp-7ae84",
  messagingSenderId: "809126173366",
  appId: "1:809126173366:web:f5748f8be3878104c76417"
};

// Initialize Firebase
try {
  if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase initialized successfully");
    
    // Initialize services
    const auth = firebase.auth();
    const database = firebase.database();
    
    // Set auth persistence
    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
      .then(() => console.log("Auth persistence enabled"))
      .catch((err) => console.error("Auth persistence error:", err));
      
  } else {
    console.log("Firebase already initialized");
  }
} catch (error) {
  console.error("Firebase initialization error:", error);
}
