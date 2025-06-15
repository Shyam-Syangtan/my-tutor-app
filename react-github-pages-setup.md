# React + GitHub Pages Setup Guide

## Step 1: Initialize React in Your Current Repository

### Option A: Create React App in Subfolder (Recommended)
```bash
# In your current repository root
npx create-react-app react-app
cd react-app

# Install additional dependencies
npm install @supabase/supabase-js
npm install react-router-dom
```

### Option B: Convert Entire Repository to React
```bash
# Backup your current files first!
mkdir backup
cp *.html *.css *.js backup/

# Initialize React in root
npx create-react-app .
```

## Step 2: Configure for GitHub Pages

### Install GitHub Pages Deployment Package
```bash
npm install --save-dev gh-pages
```

### Update package.json
```json
{
  "name": "my-tutor-app",
  "version": "0.1.0",
  "homepage": "https://shyam-syangtan.github.io/my-tutor-app",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@supabase/supabase-js": "^2.38.0",
    "react-router-dom": "^6.8.0"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject",
    "predeploy": "npm run build",
    "deploy": "gh-pages -d build"
  }
}
```

## Step 3: Configure React Router for GitHub Pages

### Create src/App.js
```jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import StudentDashboard from './pages/StudentDashboard';
import TutorDashboard from './pages/TutorDashboard';
import FindTutors from './pages/FindTutors';

function App() {
  return (
    <Router basename="/my-tutor-app">
      <div className="App">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/student-dashboard" element={<StudentDashboard />} />
          <Route path="/tutor-dashboard" element={<TutorDashboard />} />
          <Route path="/find-tutors" element={<FindTutors />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
```

## Step 4: Migrate Your Current Pages

### Convert index.html to React Component
```jsx
// src/pages/LandingPage.jsx
import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qbyyutebrgpxngvwenkd.supabase.co',
  'your-anon-key'
);

function LandingPage() {
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleGoogleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/my-tutor-app/student-dashboard`
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Your existing HTML content converted to JSX */}
      <header className="bg-white shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Navigation content */}
        </nav>
      </header>
      
      <main>
        {/* Your landing page content */}
        <button 
          onClick={() => setShowLoginModal(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg"
        >
          Get Started
        </button>
      </main>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg">
            <button onClick={handleGoogleLogin}>
              Continue with Google
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default LandingPage;
```

## Step 5: Set Up Supabase Integration

### Create Supabase Client
```jsx
// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qbyyutebrgpxngvwenkd.supabase.co';
const supabaseAnonKey = 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Create Authentication Hook
```jsx
// src/hooks/useAuth.js
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}
```

## Step 6: Deploy to GitHub Pages

### Deploy Command
```bash
# Build and deploy
npm run deploy
```

### GitHub Repository Settings
1. Go to your repository settings
2. Scroll to "Pages" section
3. Source: "Deploy from a branch"
4. Branch: "gh-pages"
5. Folder: "/ (root)"

## Step 7: Update Supabase URLs

### Update Authentication URLs in Supabase
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Site URL: `https://shyam-syangtan.github.io/my-tutor-app`
3. Redirect URLs: `https://shyam-syangtan.github.io/my-tutor-app/**`

## File Structure After Migration
```
my-tutor-app/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── Header.jsx
│   │   ├── TutorCard.jsx
│   │   └── MessageInterface.jsx
│   ├── pages/
│   │   ├── LandingPage.jsx
│   │   ├── StudentDashboard.jsx
│   │   ├── TutorDashboard.jsx
│   │   └── FindTutors.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   └── useMessaging.js
│   ├── lib/
│   │   └── supabase.js
│   ├── App.js
│   └── index.js
├── backup/ (your original files)
├── package.json
└── README.md
```
