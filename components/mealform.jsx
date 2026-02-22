// src/lib/src/MealForm.jsx
import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import './meal_form.css';

const emptyIngredient = () => ({
  name: '',
  kgPrice: '',
  amount: '',
});

export default function MealForm() {
  const [mealName, setMealName] = useState('');
  const [ingredients, setIngredients] = useState([emptyIngredient()]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const addIngredient = () => setIngredients([...ingredients, emptyIngredient()]);
  const removeIngredient = (index) => {
    if (ingredients.length <= 1) return;
    setIngredients(ingredients.filter((_, i) => i !== index));
  };
  const updateIngredient = (index, field, value) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

  const getIngredientCost = (ing) => {
    const price = parseFloat(ing.kgPrice) || 0;
    const amount = parseFloat(ing.amount) || 0;
    return price * amount;
  };

  const estimatedCost = ingredients.reduce(
    (sum, ing) => sum + getIngredientCost(ing),
    0
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (!mealName.trim()) {
      setMessage({ type: 'error', text: 'Please enter a meal name.' });
      return;
    }

    const validIngredients = ingredients
      .filter((ing) => ing.name.trim() && ing.kgPrice && ing.amount)
      .map((ing) => ({
        name: ing.name.trim(),
        kgPrice: parseFloat(ing.kgPrice),
        amount: parseFloat(ing.amount),
      }));

    if (validIngredients.length === 0) {
      setMessage({ type: 'error', text: 'Please add at least one ingredient.' });
      return;
    }

    setSubmitting(true);

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('You must be logged in to add meals');

      // Insert meal with user_id and ingredients JSONB
      const { data: mealData, error: mealError } = await supabase
        .from('meals')
        .insert({
          name: mealName.trim(),
          estimated_cost: Math.round(estimatedCost * 100) / 100,
          user_id: user.id,
          ingredients: validIngredients, // store as JSONB
        })
        .select('id')
        .single();

      if (mealError) throw mealError;

      setMessage({
        type: 'success',
        text: `Meal "${mealName}" saved. Estimated cost: ${estimatedCost.toFixed(2)}€`,
      });

      // Reset form
      setMealName('');
      setIngredients([emptyIngredient()]);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to save meal.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="meal-form-container">
      <form onSubmit={handleSubmit} className="meal-form">
        <h2 className="meal-form-title">Add a meal</h2>

        <div className="form-group">
          <label htmlFor="meal-name">Meal name</label>
          <input
            id="meal-name"
            type="text"
            value={mealName}
            onChange={(e) => setMealName(e.target.value)}
            placeholder="e.g. Spaghetti Bolognese"
          />
        </div>

        <div className="ingredients-section">
          <div className="ingredients-header">
            <h3>Ingredients</h3>
            <button
              type="button"
              onClick={addIngredient}
              className="btn-add-ingredient"
            >
              + Add ingredient
            </button>
          </div>

          <div className="ingredients-list">
            {ingredients.map((ing, index) => (
              <div key={index} className="ingredient-row">
                <input
                  type="text"
                  placeholder="Ingredient name"
                  value={ing.name}
                  onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="€/kg"
                  value={ing.kgPrice}
                  onChange={(e) => updateIngredient(index, 'kgPrice', e.target.value)}
                />
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  placeholder="Amount (kg)"
                  value={ing.amount}
                  onChange={(e) => updateIngredient(index, 'amount', e.target.value)}
                />
                <span className="ingredient-cost">{getIngredientCost(ing).toFixed(2)}€</span>
                <button
                  type="button"
                  onClick={() => removeIngredient(index)}
                  className="btn-remove"
                  disabled={ingredients.length <= 1}
                  title="Remove ingredient"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="form-footer">
          <div className="estimated-cost">
            <strong>Estimated cost:</strong> {estimatedCost.toFixed(2)}€
          </div>
          <button type="submit" disabled={submitting} className="btn-submit">
            {submitting ? 'Saving...' : 'Save meal'}
          </button>
        </div>

        {message && (
          <div className={`form-message form-message--${message.type}`}>
            {message.text}
          </div>
        )}
      </form>
    </div>
  );
}