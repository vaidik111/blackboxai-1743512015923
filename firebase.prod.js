// Production Firebase Configuration - Replace with your actual credentials
const firebaseConfig = {
  apiKey: "AIzaSyBeh71LqtkHN2s6eGQK0bUzq_VsdLgcDZw",
  authDomain: "videocallapp-7ae84.firebaseapp.com",
  databaseURL: "https://videocallapp-7ae84.firebaseio.com",
  projectId: "videocallapp-7ae84",
  storageBucket: "videocallapp-7ae84.firebasestorage.app",
  messagingSenderId: "809126173366",
  appId: "1:809126173366:web:f5748f8be3878104c76417"
};

// Enhanced Firebase Initialization
(function initFirebase() {
  try {
    // Verify Firebase SDK is loaded
    if (typeof firebase === 'undefined') {
      throw new Error('Firebase SDK not loaded - check script includes');
    }

    // Initialize only if not already initialized
    if (!firebase.apps.length) {
      const app = firebase.initializeApp(firebaseConfig);
      
      // Initialize services with error checking
      const auth = firebase.auth();
      const database = firebase.database();
      
      if (!auth || !database) {
        throw new Error('Failed to initialize Firebase services');
      }

      // Configure auth persistence
      auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
        .then(() => {
          console.log('Firebase initialized successfully');
          
          // Test database connection
          database.ref('.info/connected').on('value', (snap) => {
            if (snap.val() === true) {
              console.log('Database connection established');
            }
          });
        })
        .catch((error) => {
          console.error('Auth persistence error:', error);
        });
        
      return app;
    }
    console.log('Firebase already initialized');
    return firebase.app();
  } catch (error) {
    console.error('Firebase initialization failed:', error);
    
    // Display user-friendly error message
    if (typeof document !== 'undefined') {
      const errorEl = document.createElement('div');
      errorEl.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #ef4444;
        color: white;
        padding: 1rem;
        z-index: 1000;
        text-align: center;
      `;
      errorEl.textContent = `Application error: ${error.message}`;
      document.body.prepend(errorEl);
    }
    
    throw error;
  }
})();