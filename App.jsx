// App.jsx
import React, { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/navbar';
import WeekCalendar from './components/weekcalendar';
import BudgetCard from './components/budgetcard';
import MealForm from './components/mealform';
import GroceryList from './components/grocerylist';
import { supabase } from './lib/supabaseClient';
import LoginButton from './lib/src/LoginButton';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Function to register new users automatically
    const registerFirstTimeUser = async (user) => {
      if (!user) return;

      // Upsert profile row
      await supabase.from('profiles').upsert({
        id: user.id,
        full_name: user.user_metadata.full_name,
        created_at: new Date().toISOString(),
      });

      // Upsert a default weekly budget
      await supabase.from('budgets').upsert({
        user_id: user.id,
        amount: 50, // default starting budget
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });
    };

    // Check for existing session
    supabase.auth.getSession().then(async ({ data }) => {
      const user = data.session?.user ?? null;
      setUser(user);
      if (user) await registerFirstTimeUser(user);
      setLoading(false);
    });

    // Listen for login/logout events
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const user = session?.user ?? null;
        setUser(user);
        if (user) await registerFirstTimeUser(user);
        setLoading(false);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Logout error:', error);
  };

  if (loading) return <div>Loading...</div>;

  // LOGIN SCREEN
  if (!user) {
    return (
      <div className="login-container">
        <h2>Welcome to Meal Planner</h2>
        <LoginButton />
      </div>
    );
  }

  // MAIN APP WHEN LOGGED IN
  return (
    <>
      <Navbar user={user} onLogout={handleLogout} />
      <div className="app-container">
        <Routes>
          <Route path="/" element={<WeekCalendar user={user} />} />
          <Route path="/budget" element={<BudgetCard user={user} />} />
          <Route path="/meals" element={<MealForm user={user} />} />
          <Route path="/groceries" element={<GroceryList user={user} />} />
        </Routes>
      </div>
    </>
  );
}

export default App;