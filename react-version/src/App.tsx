import React, { useState, useEffect } from 'react';
import { supabase, auth } from './lib/supabase';
import './App.css';

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current session
    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    const { session } = await auth.getSession();
    setUser(session?.user ?? null);
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    const { error } = await auth.signInWithGoogle();
    if (error) {
      alert('Login failed: ' + (error as any).message);
    }
  };

  const handleSignOut = async () => {
    const { error } = await auth.signOut();
    if (error) {
      alert('Sign out failed: ' + (error as any).message);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>🎓 My Tutor App - React Version</h1>
        <p>This is the React development version of your tutor marketplace</p>

        {user ? (
          <div className="user-info">
            <p>Welcome, {user.user_metadata?.full_name || user.email}!</p>
            <button onClick={handleSignOut} className="auth-button">
              Sign Out
            </button>
            <p><small>✅ Supabase authentication working in React!</small></p>
          </div>
        ) : (
          <div className="auth-section">
            <p>Test the same authentication system in React:</p>
            <button onClick={handleGoogleLogin} className="auth-button">
              Continue with Google
            </button>
          </div>
        )}

        <div className="info-section">
          <h3>🔧 Development Status:</h3>
          <ul>
            <li>✅ React app setup complete</li>
            <li>✅ Supabase integration working</li>
            <li>✅ Google OAuth configured</li>
            <li>🔄 Ready for incremental page migration</li>
          </ul>
        </div>
      </header>
    </div>
  );
}

export default App;
