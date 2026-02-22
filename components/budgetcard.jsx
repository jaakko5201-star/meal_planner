import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
console.log("Is Supabase loaded?", supabase);
import { format, startOfWeek, addDays } from 'date-fns';
import { fi } from 'date-fns/locale';
import './budgetcard.css';

const STORAGE_KEY = 'my-food-app-weekly-budget';

const getWeekKey = (date) => format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');

const loadBudgetForWeek = (weekKey) => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const budgets = stored ? JSON.parse(stored) : {};
    return budgets[weekKey] ?? '';
  } catch {
    return '';
  }
};

const saveBudgetForWeek = (weekKey, value) => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const budgets = stored ? JSON.parse(stored) : {};
    budgets[weekKey] = value;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(budgets));
  } catch {
    // ignore
  }
};

export default function BudgetCard() {
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [budgetInput, setBudgetInput] = useState('');
  const [plannedMeals, setPlannedMeals] = useState([]);
  const [loading, setLoading] = useState(true);

  const weekKey = getWeekKey(weekStart);
  const weekLabel = `${format(weekStart, 'd MMM', { locale: fi })} – ${format(addDays(weekStart, 6), 'd MMM yyyy', { locale: fi })}`;

  useEffect(() => {
    setBudgetInput(loadBudgetForWeek(weekKey));
  }, [weekKey]);

  useEffect(() => {
    async function fetchPlannedMeals() {
      const startStr = format(weekStart, 'yyyy-MM-dd');
      const endStr = format(addDays(weekStart, 6), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('planned_meals')
        .select('meals (estimated_cost)')
        .gte('date', startStr)
        .lte('date', endStr);

      if (error) {
        console.error('Error fetching planned meals:', error);
      }
      setPlannedMeals(data || []);
      setLoading(false);
    }
    fetchPlannedMeals();
  }, [weekStart]);

  const budget = parseFloat(budgetInput) || 0;
  const used = plannedMeals.reduce(
    (sum, pm) => sum + (parseFloat(pm.meals?.estimated_cost) || 0),
    0
  );
  const left = Math.max(0, budget - used);
  const isOverBudget = budget > 0 && used > budget;

  const handleBudgetChange = (e) => {
    const value = e.target.value;
    setBudgetInput(value);
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0) {
      saveBudgetForWeek(weekKey, value);
    }
  };

  const handleBudgetBlur = () => {
    if (budgetInput === '' || parseFloat(budgetInput) < 0) {
      saveBudgetForWeek(weekKey, '');
    }
  };

  return (
    <div className="budget-card-container">
      <div className="budget-card">
        <h2 className="budget-card-title">Weekly budget</h2>
        <p className="budget-week-label">{weekLabel}</p>

        <div className="budget-input-section">
          <label htmlFor="weekly-budget">Set budget (€)</label>
          <input
            id="weekly-budget"
            type="number"
            step="0.01"
            min="0"
            placeholder="e.g. 150"
            value={budgetInput}
            onChange={handleBudgetChange}
            onBlur={handleBudgetBlur}
          />
        </div>

        {loading ? (
          <div className="budget-loading">Loading…</div>
        ) : (
          <div className="budget-summary">
            <div className="budget-row budget-row--used">
              <span className="budget-label">Used</span>
              <span className="budget-value">{used.toFixed(2)}€</span>
            </div>
            <div className="budget-row budget-row--left">
              <span className="budget-label">Left</span>
              <span className={`budget-value ${isOverBudget ? 'budget-value--over' : ''}`}>
                {left.toFixed(2)}€
              </span>
            </div>
            {budget > 0 && (
              <div className="budget-progress">
                <div
                  className="budget-progress-bar"
                  style={{
                    width: `${Math.min(100, (used / budget) * 100)}%`,
                    backgroundColor: isOverBudget ? '#dc2626' : '#667eea',
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
