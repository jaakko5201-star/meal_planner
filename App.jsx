// App.jsx
import React, { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
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
    // Check for existing session
    supabase.auth.getSession().then(({ data }) => {
      console.log('Initial session:', data);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    // Listen for login/logout events
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state change:', _event, session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

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
        <h2>Welcome to Family Meal Planner</h2>
        <LoginButton />
        {/* Optional test button to confirm rendering */}
        <button onClick={() => alert('Button works!')}>Test Button</button>
      </div>
    );
  }

  // MAIN APP WHEN LOGGED IN
  return (
    <>
      <Navbar user={user} onLogout={handleLogout} />
      <div className="app-container">
        <Routes>
          <Route path="/" element={<WeekCalendar />} />
          <Route path="/budget" element={<BudgetCard />} />
          <Route path="/meals" element={<MealForm />} />
          <Route path="/groceries" element={<GroceryList />} />
        </Routes>
      </div>
    </>
  );
}

export default App;