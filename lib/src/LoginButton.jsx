// src/lib/src/LoginButton.jsx
import React from 'react';           // <<< ADD THIS
import { supabase } from '../supabaseClient';

export default function LoginButton() {
  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) console.error('Error signing in:', error.message);
  };

  return (
    <button onClick={handleLogin} className="login-btn">
      Login with Google
    </button>
  );
}