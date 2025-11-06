// Firebase Configuration
// REPLACE THESE VALUES WITH YOUR FIREBASE PROJECT CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyBjBQYoXYBtsj-0R5nFW6MQBLbXKsHj3Bo",
  authDomain: "skillswap-sheepu.firebaseapp.com",
  projectId: "skillswap-sheepu",
  storageBucket: "skillswap-sheepu.firebasestorage.app",
  messagingSenderId: "155383716397",
  appId: "1:155383716397:web:423db1c94db60ecc1936a4"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get Firebase services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Google Auth Provider
const googleProvider = new firebase.auth.GoogleAuthProvider();

// Helper function to upload image
async function uploadImage(file, path) {
    try {
        const storageRef = storage.ref();
        const fileRef = storageRef.child(path);
        const snapshot = await fileRef.put(file);
        const downloadURL = await snapshot.ref.getDownloadURL();
        return downloadURL;
    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
}

// Helper function to delete image
async function deleteImage(url) {
    try {
        if (!url) return;
        const storageRef = storage.refFromURL(url);
        await storageRef.delete();
    } catch (error) {
        console.error('Error deleting image:', error);
    }
}