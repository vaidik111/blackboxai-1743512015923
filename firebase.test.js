// Test Firebase configuration
const firebaseConfig = {
  apiKey: "test-api-key",
  authDomain: "test-project.firebaseapp.com",
  databaseURL: "https://test-project.firebaseio.com",
  projectId: "test-project",
  storageBucket: "test-project.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:test-app-id"
};

// Initialize Firebase with test mode
try {
  if (typeof firebase !== 'undefined') {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig, "testApp");
      console.log("Firebase test initialization successful");
      
      // Test auth service
      const auth = firebase.auth();
      console.log("Auth service test:", auth ? "OK" : "Failed");
      
      // Test database service
      const database = firebase.database();
      console.log("Database service test:", database ? "OK" : "Failed");
      
    } else {
      console.log("Firebase already initialized in test mode");
    }
  } else {
    console.error("Firebase SDK not loaded");
  }
} catch (error) {
  console.error("Firebase test initialization failed:", error);
}

// Export for testing
if (typeof module !== 'undefined') {
  module.exports = { firebaseConfig };
}