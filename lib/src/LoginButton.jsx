import React, { useState } from "react";
import { supabase } from "../supabaseClient";

export default function LoginButton() {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleLogin = async () => {
    setLoading(true);
    setErrorMsg(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });

    if (error) {
      console.error("Error signing in:", error.message);
      setErrorMsg(error.message);
    }

    setLoading(false);
  };

  return (
    <div className="login-button-wrapper">
      <button
        onClick={handleLogin}
        className="login-btn"
        disabled={loading}
      >
        {loading ? "Redirecting..." : "Login with Google"}
      </button>
      {errorMsg && <p className="login-error">Error: {errorMsg}</p>}
    </div>
  );
}