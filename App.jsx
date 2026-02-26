import React, { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/navbar";
import WeekCalendar from "./components/weekcalendar";
import BudgetCard from "./components/budgetcard";
import MealForm from "./components/mealform";
import GroceryList from "./components/grocerylist";
import { supabase } from "./lib/supabaseClient";
import LoginButton from "./lib/src/LoginButton";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- AUTH STATE MANAGEMENT ---
  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);
      setLoading(false);
    };
    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Logout error:", error);
  };

  // --- LOADING SCREEN ---
  if (loading) return <div className="loading">Loading...</div>;

  // --- LOGIN SCREEN ---
  if (!user) {
    return (
      <div className="login-container">
        <h2>Welcome to Budget Bites</h2>
        <LoginButton />
      </div>
    );
  }

  // --- MAIN APP ---
  return (
    <div className="app">
      <Navbar user={user} onLogout={handleLogout} />
      <main className="app-container">
        <Routes>
          <Route path="/" element={<WeekCalendar />} />
          <Route path="/budget" element={<BudgetCard user={user} />} />
          <Route path="/meals" element={<MealForm user={user} />} />
          <Route path="/groceries" element={<GroceryList user={user} />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;