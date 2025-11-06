# 🎓 SkillSwap - Complete Setup & Deployment Guide

## 📁 Project Structure

Your project should have the following files:

```
skillswap/
│
├── index.html              # Landing page
├── dashboard.html          # User dashboard
├── profile.html           # User profile management
├── find-match.html        # Find learning partners
├── sessions.html          # Session management
│
├── styles.css             # Global styles
├── dashboard.css          # Dashboard & app styles
│
├── config.js              # Firebase configuration
├── auth.js                # Authentication functions
├── main.js                # Landing page scripts
├── dashboard.js           # Dashboard scripts
├── profile.js             # Profile page scripts
├── find-match.js          # Find match scripts
├── sessions.js            # Sessions management scripts
│
└── README.md              # This file
```

---

## 🚀 Setup Instructions

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Enter project name: `skillswap` (or your choice)
4. Disable Google Analytics (optional for free tier)
5. Click "Create Project"

### Step 2: Enable Authentication

1. In Firebase Console, go to **Authentication**
2. Click "Get Started"
3. Enable **Email/Password** sign-in method
4. Enable **Google** sign-in method
5. Add your email as authorized domain (for local testing: `localhost`)

### Step 3: Create Firestore Database

1. Go to **Firestore Database**
2. Click "Create Database"
3. Select **Start in test mode** (for development)
4. Choose your region (closest to your users)
5. Click "Enable"

### Step 4: Set Firestore Security Rules

In Firestore Database, go to **Rules** tab and paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    // Matches collection
    match /matches/{matchId} {
      allow read: if request.auth != null && 
                     request.auth.uid in resource.data.participants;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
                       request.auth.uid in resource.data.participants;
      allow delete: if request.auth != null && 
                       request.auth.uid == resource.data.requesterId;
    }
    
    // Sessions collection
    match /sessions/{sessionId} {
      allow read: if request.auth != null && 
                     request.auth.uid in resource.data.participants;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
                       request.auth.uid in resource.data.participants;
      allow delete: if request.auth != null && 
                       request.auth.uid in resource.data.participants;
    }
    
    // Ratings collection
    match /ratings/{ratingId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
    }
  }
}
```

Click **Publish** to save the rules.

### Step 5: Get Firebase Configuration

1. In Firebase Console, click the **Gear icon** → **Project Settings**
2. Scroll down to "Your apps"
3. Click the **Web icon** (`</>`)
4. Register your app name: `SkillSwap`
5. Copy the `firebaseConfig` object

### Step 6: Update config.js

Open `config.js` and replace with your Firebase config:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// Google Auth Provider
const googleProvider = new firebase.auth.GoogleAuthProvider();
```

**IMPORTANT:** Replace ALL the placeholder values with your actual Firebase config!

---

## 💻 Local Testing

### Option 1: Using Python (Recommended)

1. Open terminal in your project folder
2. Run one of these commands:

```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

3. Open browser: `http://localhost:8000`

### Option 2: Using Node.js

1. Install http-server globally:
```bash
npm install -g http-server
```

2. Run in project folder:
```bash
http-server
```

3. Open browser: `http://localhost:8080`

### Option 3: Using VS Code

1. Install "Live Server" extension
2. Right-click on `index.html`
3. Select "Open with Live Server"

---

## 🌐 Deploy to Firebase Hosting (FREE)

### Step 1: Install Firebase Tools

```bash
npm install -g firebase-tools
```

### Step 2: Login to Firebase

```bash
firebase login
```

### Step 3: Initialize Firebase in Your Project

```bash
cd your-project-folder
firebase init
```

Select:
- **Hosting** (use spacebar to select)
- Choose your existing Firebase project
- Public directory: `.` (current directory)
- Configure as single-page app: **No**
- Set up automatic builds: **No**
- Don't overwrite existing files

### Step 4: Deploy to Firebase

```bash
firebase deploy
```

Your app will be live at: `https://your-project-id.web.app`

---

## 🆓 Alternative Free Hosting Options

### Option 1: Netlify

1. Go to [Netlify](https://www.netlify.com/)
2. Sign up with GitHub/Email
3. Drag and drop your project folder
4. Your site is live!

**OR use Netlify CLI:**

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
cd your-project-folder
netlify deploy
```

### Option 2: Vercel

1. Go to [Vercel](https://vercel.com/)
2. Sign up with GitHub/Email
3. Import your project
4. Deploy with one click!

**OR use Vercel CLI:**

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd your-project-folder
vercel
```

### Option 3: GitHub Pages

1. Create GitHub repository
2. Push your code:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_REPO_URL
git push -u origin main
```

3. Go to repository **Settings** → **Pages**
4. Source: Deploy from branch `main`
5. Save

Your site: `https://yourusername.github.io/repository-name`

---

## 🔧 Common Issues & Solutions

### Issue 1: Firebase Config Not Working
**Solution:** Make sure you copied ALL values from Firebase Console including quotes

### Issue 2: Google Sign-In Not Working
**Solution:** Add your domain to authorized domains in Firebase Console → Authentication → Settings → Authorized domains

### Issue 3: Firestore Permission Denied
**Solution:** Check Firestore Rules are set correctly (see Step 4 above)

### Issue 4: CORS Errors
**Solution:** Use a local server (Python/Node.js), don't open HTML files directly

### Issue 5: CSS Not Loading
**Solution:** Check file paths are correct (case-sensitive on Linux servers)

---

## 📊 Firebase Free Tier Limits

✅ **Completely FREE includes:**
- Authentication: 10K verifications/month
- Firestore: 50K reads, 20K writes, 1GB storage/day
- Hosting: 10GB storage, 360MB/day transfer
- **More than enough for testing and small user base!**

---

## 🎯 Next Steps After Deployment

1. **Test all features:**
   - Sign up / Login
   - Add skills
   - Find matches
   - Send requests
   - Schedule sessions
   - Complete sessions
   - Rate users

2. **Share your app:**
   - Share the URL with friends
   - Test with real users
   - Gather feedback

3. **Monitor usage:**
   - Check Firebase Console → Analytics
   - Monitor Firestore usage
   - Check Authentication stats

---

## 🛡️ Production Security (Before Public Launch)

### Update Firestore Rules for Production:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    match /matches/{matchId} {
      allow read: if request.auth != null && 
                     request.auth.uid in resource.data.participants;
      allow create: if request.auth != null &&
                       request.auth.uid == request.resource.data.requesterId;
      allow update: if request.auth != null && 
                       request.auth.uid in resource.data.participants;
      allow delete: if request.auth != null && 
                       request.auth.uid == resource.data.requesterId;
    }
    
    match /sessions/{sessionId} {
      allow read: if request.auth != null && 
                     request.auth.uid in resource.data.participants;
      allow create: if request.auth != null &&
                       request.auth.uid in request.resource.data.participants;
      allow update: if request.auth != null && 
                       request.auth.uid in resource.data.participants;
      allow delete: if request.auth != null && 
                       request.auth.uid in resource.data.participants;
    }
    
    match /ratings/{ratingId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null &&
                       request.auth.uid == request.resource.data.raterId;
      allow update, delete: if false;
    }
  }
}
```

---

## 📞 Support & Resources

- **Firebase Documentation:** https://firebase.google.com/docs
- **Firestore Guide:** https://firebase.google.com/docs/firestore
- **Firebase Hosting:** https://firebase.google.com/docs/hosting

---

## ✨ Features Implemented

✅ User Authentication (Email & Google)
✅ User Profiles with Skills
✅ Smart Matching Algorithm
✅ Match Requests System
✅ Session Scheduling
✅ Rating & Review System
✅ Points & Badges (Gamification)
✅ Responsive Design
✅ Real-time Updates

---

## 🎉 You're All Set!

Your SkillSwap platform is ready to revolutionize peer-to-peer learning!

**Default URL after Firebase deploy:** `https://your-project-id.web.app`

---

**Need Help?** Check Firebase Console logs or browser console (F12) for error messages.

**Happy Learning & Teaching! 🎓📚**