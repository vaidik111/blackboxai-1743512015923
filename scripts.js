// Initialize Firebase services
const auth = firebase.auth();
const database = firebase.database();

// Set up auth state persistence
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
  .then(() => {
    console.log("Auth state persistence enabled");
  })
  .catch((error) => {
    console.error("Error enabling auth persistence:", error);
  });

// DOM Elements
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const signupEmail = document.getElementById('signupEmail');
const signupPassword = document.getElementById('signupPassword');
const newRoomBtn = document.getElementById('newRoomBtn');
const createRoomBtn = document.getElementById('createRoomBtn');
const signOutBtn = document.getElementById('signOutBtn');
const roomsContainer = document.getElementById('roomsContainer');

// WebRTC Configuration
const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

// Global Variables
let currentUser = null;
let peerConnection = null;
let localStream = null;
let roomId = null;

// Modal Functions
function showRoomModal() {
  document.getElementById('newRoomModal').classList.remove('hidden');
}

function hideRoomModal() {
  document.getElementById('newRoomModal').classList.add('hidden');
}

// Initialize App
function initApp() {
  // Auth State Listener
  auth.onAuthStateChanged((user) => {
    currentUser = user;
    if (user) {
      if (window.location.pathname.includes('index.html')) {
        window.location.href = 'dashboard.html';
      } else if (window.location.pathname.includes('call.html')) {
        initCall();
      } else {
        loadRooms();
      }
    } else if (!window.location.pathname.includes('index.html')) {
      window.location.href = 'index.html';
    }
  });

  // Event Listeners
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
  if (signupForm) {
    signupForm.addEventListener('submit', handleSignup);
  }
  if (newRoomBtn) {
    newRoomBtn.addEventListener('click', showRoomModal);
  }
  if (createRoomBtn) {
    createRoomBtn.addEventListener('click', createNewRoom);
  }
  if (signOutBtn) {
    signOutBtn.addEventListener('click', handleSignOut);
  }
}

// Authentication Functions
async function handleLogin(e) {
  e.preventDefault();
  try {
    await auth.signInWithEmailAndPassword(loginEmail.value, loginPassword.value);
    window.location.href = 'dashboard.html';
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function handleSignup(e) {
  e.preventDefault();
  try {
    await auth.createUserWithEmailAndPassword(signupEmail.value, signupPassword.value);
    showToast('Account created successfully!', 'success');
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function handleSignOut() {
  try {
    await auth.signOut();
    window.location.href = 'index.html';
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// Room Management
async function createNewRoom() {
  const roomName = document.getElementById('roomName').value || 'New Room';
  try {
    const roomRef = database.ref('rooms').push();
    roomId = roomRef.key;
    
    await roomRef.set({
      name: roomName,
      createdBy: currentUser.uid,
      createdAt: firebase.database.ServerValue.TIMESTAMP,
      participants: {
        [currentUser.uid]: true
      }
    });
    
    window.location.href = `call.html?room=${roomId}`;
  } catch (error) {
    showToast('Failed to create room', 'error');
  }
}

async function loadRooms() {
  database.ref('rooms').orderByChild('createdAt').on('value', (snapshot) => {
    roomsContainer.innerHTML = '';
    snapshot.forEach((roomSnapshot) => {
      const room = roomSnapshot.val();
      const roomCard = createRoomCard(roomSnapshot.key, room);
      roomsContainer.appendChild(roomCard);
    });
  });
}

function createRoomCard(roomId, room) {
  const card = document.createElement('div');
  card.className = 'bg-white p-4 rounded-lg shadow hover:shadow-md transition cursor-pointer';
  card.innerHTML = `
    <div class="flex justify-between items-start">
      <h3 class="font-semibold text-lg">${room.name}</h3>
      <span class="text-sm text-gray-500">${Object.keys(room.participants || {}).length} participants</span>
    </div>
    <p class="text-gray-600 mt-2">Created: ${formatDate(room.createdAt)}</p>
    <div class="mt-4 flex justify-end">
      <button class="join-btn bg-blue-100 text-blue-600 px-3 py-1 rounded text-sm hover:bg-blue-200 transition" 
              data-room="${roomId}">
        Join
      </button>
    </div>
  `;
  card.querySelector('.join-btn').addEventListener('click', () => {
    window.location.href = `call.html?room=${roomId}`;
  });
  return card;
}

// WebRTC Functions
async function initCall() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    roomId = urlParams.get('room');
    
    if (!roomId) {
      throw new Error('Room ID not provided');
    }

    // Join room in database
    await database.ref(`rooms/${roomId}/participants/${currentUser.uid}`).set(true);
    
    // Get user media
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    document.getElementById('localVideo').srcObject = localStream;
    
    // Setup peer connection
    setupPeerConnection();
    
    // Listen for room changes
    database.ref(`rooms/${roomId}`).on('value', handleRoomUpdate);
    
  } catch (error) {
    console.error('Call initialization failed:', error);
    showToast('Failed to start call', 'error');
    window.location.href = 'dashboard.html';
  }
}

function setupPeerConnection() {
  peerConnection = new RTCPeerConnection(configuration);
  
  // Add local stream to connection
  localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
  });
  
  // Handle remote stream
  peerConnection.ontrack = (event) => {
    document.getElementById('remoteVideo').srcObject = event.streams[0];
  };
  
  // ICE candidate handling
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      database.ref(`rooms/${roomId}/candidates/${currentUser.uid}`).push({
        candidate: event.candidate,
        from: currentUser.uid
      });
    }
  };
  
  // Start signaling
  if (isCaller()) {
    createOffer();
  } else {
    listenForOffer();
  }
}

async function createOffer() {
  try {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    
    await database.ref(`rooms/${roomId}/offer`).set({
      sdp: offer.sdp,
      type: offer.type,
      from: currentUser.uid
    });
  } catch (error) {
    console.error('Offer creation failed:', error);
  }
}

async function listenForOffer() {
  database.ref(`rooms/${roomId}/offer`).on('value', async (snapshot) => {
    const offer = snapshot.val();
    if (offer && offer.from !== currentUser.uid) {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      await database.ref(`rooms/${roomId}/answer`).set({
        sdp: answer.sdp,
        type: answer.type,
        from: currentUser.uid
      });
    }
  });
  
  database.ref(`rooms/${roomId}/answer`).on('value', async (snapshot) => {
    const answer = snapshot.val();
    if (answer && answer.from !== currentUser.uid && peerConnection.remoteDescription === null) {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    }
  });
  
  database.ref(`rooms/${roomId}/candidates`).on('child_added', async (snapshot) => {
    const candidateData = snapshot.val();
    if (candidateData.from !== currentUser.uid) {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidateData.candidate));
    }
  });
}

function isCaller() {
  return !window.location.search.includes('join=true');
}

function handleRoomUpdate(snapshot) {
  const room = snapshot.val();
  if (!room) {
    showToast('Room has been closed', 'info');
    endCall();
  }
}

function endCall() {
  // Clean up WebRTC connection
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }

  // Stop all media tracks
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
  }

  // Remove user from room participants
  if (roomId && currentUser) {
    const updates = {};
    updates[`rooms/${roomId}/participants/${currentUser.uid}`] = null;
    updates[`rooms/${roomId}/candidates/${currentUser.uid}`] = null;
    database.ref().update(updates).catch(console.error);
  }

  window.location.href = 'dashboard.html';
}

// Utility Functions
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `fixed top-4 right-4 px-4 py-2 rounded-md shadow-lg ${
    type === 'error' ? 'bg-red-500' : 
    type === 'success' ? 'bg-green-500' : 'bg-blue-500'
  } text-white`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

function formatDate(timestamp) {
  if (!timestamp) return 'Unknown';
  const date = new Date(timestamp);
  return date.toLocaleString();
}

// Initialize the app
document.addEventListener('DOMContentLoaded', initApp);
