import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import './grocerylist.css';

const STORAGE_KEY = 'my-food-app-grocery-list';

const loadFromStorage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return parsed.map((item) => ({
      ...item,
      id: item.id ?? crypto.randomUUID?.() ?? Date.now() + Math.random(),
    }));
  } catch {
    return [];
  }
};

const saveToStorage = (items) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

// Merge new ingredients into list, aggregating by name (case-insensitive)
const mergeIngredients = (existing, newItems, source = 'Manual') => {
  const merged = [...existing];
  for (const item of newItems) {
    const name = (item.name || '').trim();
    if (!name) continue;
    const amount = parseFloat(item.amount_kg ?? item.amount ?? 0) || 0;
    const kgPrice = parseFloat(item.kg_price ?? item.kgPrice ?? 0) || 0;

    const existingIndex = merged.findIndex(
      (i) => i.name.toLowerCase() === name.toLowerCase()
    );

    if (existingIndex >= 0) {
      merged[existingIndex].amount += amount;
      if (!merged[existingIndex].source?.includes(source)) {
        merged[existingIndex].source = [
          ...(merged[existingIndex].source || []),
          source,
        ].filter(Boolean);
      }
    } else {
      merged.push({
        id: crypto.randomUUID?.() ?? Date.now() + Math.random(),
        name,
        amount,
        kgPrice,
        checked: false,
        source: source !== 'Manual' ? [source] : [],
      });
    }
  }
  return merged;
};

export default function GroceryList() {
  const [items, setItems] = useState(loadFromStorage);
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMealId, setSelectedMealId] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualAmount, setManualAmount] = useState('');

  useEffect(() => {
    saveToStorage(items);
  }, [items]);

  useEffect(() => {
    async function fetchMeals() {
      const { data, error } = await supabase
        .from('meals')
        .select('id, name')
        .order('name');

      if (error) {
        console.warn('Could not fetch meals:', error);
      } else {
        setMeals(data || []);
      }
      setLoading(false);
    }
    fetchMeals();
  }, []);

  const addFromRecipe = async () => {
    if (!selectedMealId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('ingredients')
      .select('name, kg_price, amount_kg')
      .eq('meal_id', selectedMealId);

    setLoading(false);

    if (error) {
      console.warn('Could not fetch ingredients:', error);
      return;
    }

    const meal = meals.find((m) => m.id === selectedMealId);
    const source = meal?.name || 'Recipe';

    setItems((prev) =>
      mergeIngredients(
        prev,
        (data || []).map((i) => ({
          name: i.name,
          kg_price: i.kg_price,
          amount_kg: i.amount_kg,
        })),
        source
      )
    );
    setSelectedMealId('');
  };

  const addManual = () => {
    const name = manualName.trim();
    if (!name) return;

    const amount = parseFloat(manualAmount) || 0;

    setItems((prev) =>
      mergeIngredients(prev, [{ name, amount_kg: amount }], 'Manual')
    );
    setManualName('');
    setManualAmount('');
  };

  const toggleChecked = (id) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i))
    );
  };

  const removeItem = (id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const clearChecked = () => {
    setItems((prev) => prev.filter((i) => !i.checked));
  };

  const formatAmount = (kg) => {
    if (!kg || kg === 0) return '';
    if (kg >= 1) return `${kg} kg`;
    return `${(kg * 1000).toFixed(0)} g`;
  };

  return (
    <div className="grocery-list-container">
      <div className="grocery-list-card">
        <h2 className="grocery-list-title">Grocery list</h2>

        {/* Add from recipe */}
        <div className="grocery-add-section">
          <h3>Add from recipes</h3>
          <div className="add-from-recipe-row">
            <select
              value={selectedMealId}
              onChange={(e) => setSelectedMealId(e.target.value)}
              disabled={loading || meals.length === 0}
            >
              <option value="">
                {meals.length === 0 ? 'No recipes yet' : 'Select a recipe…'}
              </option>
              {meals.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={addFromRecipe}
              disabled={!selectedMealId}
              className="btn-add"
            >
              Add ingredients
            </button>
          </div>
        </div>

        {/* Add manually */}
        <div className="grocery-add-section">
          <h3>Add product</h3>
          <div className="add-manual-row">
            <input
              type="text"
              placeholder="Product or ingredient name"
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addManual())}
            />
            <input
              type="number"
              step="0.001"
              min="0"
              placeholder="Amount (kg)"
              value={manualAmount}
              onChange={(e) => setManualAmount(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addManual())}
            />
            <button
              type="button"
              onClick={addManual}
              disabled={!manualName.trim()}
              className="btn-add"
            >
              Add
            </button>
          </div>
        </div>

        {/* List */}
        <div className="grocery-list-section">
          <div className="grocery-list-header">
            <h3>Items</h3>
            {items.some((i) => i.checked) && (
              <button
                type="button"
                onClick={clearChecked}
                className="btn-clear-checked"
              >
                Clear bought
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <p className="grocery-empty">No items yet. Add from recipes or manually.</p>
          ) : (
            <ul className="grocery-items">
              {items.map((item) => (
                <li
                  key={item.id}
                  className={`grocery-item ${item.checked ? 'grocery-item--checked' : ''}`}
                >
                  <label className="grocery-item-check">
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => toggleChecked(item.id)}
                    />
                    <span className="checkmark" />
                  </label>
                  <div className="grocery-item-info">
                    <span className="grocery-item-name">{item.name}</span>
                    {(item.amount > 0 || item.source?.length) && (
                      <span className="grocery-item-meta">
                        {formatAmount(item.amount)}
                        {item.source?.length > 0 && (
                          <span className="grocery-item-source">
                            from {item.source.join(', ')}
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                  <div className="grocery-item-actions">
                    {item.kgPrice > 0 && item.amount > 0 && (
                      <span className="grocery-item-cost">
                        {(item.kgPrice * item.amount).toFixed(2)}€
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="btn-remove"
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {items.length > 0 && (
            <div className="grocery-total">
              Total: {items
                .filter((i) => !i.checked)
                .reduce(
                  (sum, i) => sum + (i.kgPrice || 0) * (i.amount || 0),
                  0
                )
                .toFixed(2)}
              €
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
