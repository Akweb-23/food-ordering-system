// Firebase configuration
// IMPORTANT: Replace these with your Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyAkAkPMuPv1GD9-UPlowU2K9NnC5Uh2sTo",
    authDomain: "cafe-web-b4691.firebaseapp.com",
    databaseURL: "https://cafe-web-b4691-default-rtdb.firebaseio.com",
    projectId: "cafe-web-b4691",
    storageBucket: "cafe-web-b4691.firebasestorage.app",
    messagingSenderId: "526046919327",
    appId: "1:526046919327:web:3243e0627993404f7180aa"
  };

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get a reference to the database service
const database = firebase.database();

// Reference to different nodes in the database
const menuItemsRef = database.ref('menuItems');
const ordersRef = database.ref('orders');
const completedOrdersRef = database.ref('completedOrders');
const cancelledOrdersRef = database.ref('cancelledOrders');

// Function to check connection status
const connectedRef = database.ref('.info/connected');
connectedRef.on('value', (snap) => {
    if (snap.val() === true) {
        console.log('Connected to Firebase');
    } else {
        console.log('Not connected to Firebase');
    }
}); 