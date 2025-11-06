// Authentication Functions

// Show/Hide Loading Spinner
function showLoading() {
    document.getElementById('loadingSpinner').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loadingSpinner').classList.add('hidden');
}

// Show Error Message
function showError(message) {
    const errorDiv = document.getElementById('authError');
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
    setTimeout(() => {
        errorDiv.classList.add('hidden');
    }, 5000);
}

// Email/Password Signup
async function signupWithEmail(name, email, password) {
    try {
        showLoading();
        
        // Create user account
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Update user profile with name
        await user.updateProfile({
            displayName: name
        });

        // Create user document in Firestore
        await db.collection('users').doc(user.uid).set({
            uid: user.uid,
            name: name,
            email: email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            skillsToTeach: [],
            skillsToLearn: [],
            completedSessions: 0,
            rating: 0,
            points: 0,
            badges: []
        });

        hideLoading();
        // Redirect to dashboard
        window.location.href = 'dashboard.html';
        
    } catch (error) {
        hideLoading();
        console.error('Signup error:', error);
        showError(error.message);
    }
}

// Email/Password Login
async function loginWithEmail(email, password) {
    try {
        showLoading();
        await auth.signInWithEmailAndPassword(email, password);
        hideLoading();
        // Redirect to dashboard
        window.location.href = 'dashboard.html';
    } catch (error) {
        hideLoading();
        console.error('Login error:', error);
        showError(error.message);
    }
}

// Google Sign In/Sign Up
async function signInWithGoogle() {
    try {
        showLoading();
        const result = await auth.signInWithPopup(googleProvider);
        const user = result.user;

        // Check if user document exists
        const userDoc = await db.collection('users').doc(user.uid).get();
        
        if (!userDoc.exists) {
            // Create new user document for first-time Google users
            await db.collection('users').doc(user.uid).set({
                uid: user.uid,
                name: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                skillsToTeach: [],
                skillsToLearn: [],
                completedSessions: 0,
                rating: 0,
                points: 0,
                badges: []
            });
        }

        hideLoading();
        // Redirect to dashboard
        window.location.href = 'dashboard.html';
        
    } catch (error) {
        hideLoading();
        console.error('Google sign in error:', error);
        showError(error.message);
    }
}

// Logout
async function logout() {
    try {
        await auth.signOut();
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
        showError('Error logging out');
    }
}

// Check if user is authenticated
function checkAuth(redirectToLogin = true) {
    return new Promise((resolve, reject) => {
        auth.onAuthStateChanged(user => {
            if (user) {
                resolve(user);
            } else {
                if (redirectToLogin) {
                    window.location.href = 'index.html';
                }
                reject('No user logged in');
            }
        });
    });
}