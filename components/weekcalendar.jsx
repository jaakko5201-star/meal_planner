import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import './weekcalendar.css';

const MEAL_TYPES = [
  { key: 'breakfast', label: 'Aamiainen' },
  { key: 'lunch', label: 'Lounas' },
  { key: 'dinner', label: 'Illallinen' },
];

const DAY_ABBREV = ['MAAN.', 'TIIS.', 'KESK.', 'TORST.', 'PERJ.', 'LA', 'SUNN.'];

export default function WeekCalendar() {
  const [weekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [plannedMeals, setPlannedMeals] = useState([]);
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingTo, setAddingTo] = useState(null);
  const [selectValue, setSelectValue] = useState('');

  const today = new Date();

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    return {
      date,
      dateStr: format(date, 'yyyy-MM-dd'),
      dayName: DAY_ABBREV[i],
      dayNumber: format(date, 'd'),
      isToday: isSameDay(date, today),
    };
  });

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      const startStr = format(weekStart, 'yyyy-MM-dd');
      const endStr = format(addDays(weekStart, 6), 'yyyy-MM-dd');

      const [mealsRes, plannedRes] = await Promise.all([
        supabase
          .from('meals')
          .select('id, name, estimated_cost')
          .order('name'),

        supabase
          .from('planned_meals')
          .select('id, date, meal_type, meals (id, name, estimated_cost)')
          .gte('date', startStr)
          .lte('date', endStr),
      ]);

      if (mealsRes.data) setMeals(mealsRes.data);
      if (plannedRes.data) setPlannedMeals(plannedRes.data);
      if (plannedRes.error)
        console.error('Error fetching planned meals:', plannedRes.error);

      setLoading(false);
    }

    fetchData();
  }, [weekStart]);

  const getMealForSlot = (dateStr, mealType) =>
    plannedMeals.find(
      (m) => m.date === dateStr && m.meal_type === mealType
    );

  const handleAddClick = (dateStr, mealType) => {
    setAddingTo({ dateStr, mealType });
    setSelectValue('');
  };

  const handleAddSubmit = async () => {
    if (!addingTo || !selectValue) return;

    const { error } = await supabase.from('planned_meals').insert({
      date: addingTo.dateStr,
      meal_type: addingTo.mealType,
      meal_id: selectValue,
    });

    if (error) {
      console.error('Error adding meal:', error);
      return;
    }

    const added = meals.find((m) => String(m.id) === String(selectValue));

    setPlannedMeals((prev) => [
      ...prev,
      {
        id: crypto.randomUUID?.() ?? Date.now(),
        date: addingTo.dateStr,
        meal_type: addingTo.mealType,
        meals: added,
      },
    ]);

    setAddingTo(null);
    setSelectValue('');
  };

  const handleRemoveMeal = async (plannedMealId) => {
    const { error } = await supabase
      .from('planned_meals')
      .delete()
      .eq('id', plannedMealId);

    if (!error) {
      setPlannedMeals((prev) =>
        prev.filter((m) => m.id !== plannedMealId)
      );
    }
  };

  if (loading) {
    return (
      <div className="calendar-container">
        <div className="calendar-loading">Ladataan aterioita…</div>
      </div>
    );
  }

  return (
    <div className="calendar-container">
      <h1 className="calendar-title">Viikon ateriat</h1>

      <div className="calendar-grid">
        {/* Top-left empty cell */}
        <div />

        {/* Day headers */}
        {weekDays.map((day) => (
          <div
            key={day.dateStr}
            className={`calendar-day-header ${
              day.isToday ? 'today' : ''
            }`}
          >
            <span className="calendar-day-name">{day.dayName}</span>
            <span className="calendar-day-number">{day.dayNumber}</span>
          </div>
        ))}

        {/* Meal rows */}
        {MEAL_TYPES.map(({ key: mealType, label }) => (
          <React.Fragment key={mealType}>
            {/* Meal label */}
            <div className="calendar-meal-label">{label}</div>

            {/* Meal slots */}
            {weekDays.map((day) => {
              const meal = getMealForSlot(day.dateStr, mealType);
              const isAdding =
                addingTo?.dateStr === day.dateStr &&
                addingTo?.mealType === mealType;

              return (
                <div
                  key={`${day.dateStr}-${mealType}`}
                  className={`calendar-meal-slot ${
                    meal ? 'filled' : 'empty'
                  }`}
                  onClick={
                    !meal && !isAdding
                      ? () =>
                          handleAddClick(day.dateStr, mealType)
                      : undefined
                  }
                >
                  {meal ? (
                    <>
                      <div className="meal-name">
                        {meal.meals?.name}
                      </div>
                      <div className="meal-cost">
                        {meal.meals?.estimated_cost}€
                      </div>
                      <button
                        className="meal-remove-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveMeal(meal.id);
                        }}
                      >
                        ×
                      </button>
                    </>
                  ) : isAdding ? (
                    <div className="meal-slot-add-form">
                      <select
                        value={selectValue}
                        onChange={(e) =>
                          setSelectValue(e.target.value)
                        }
                        autoFocus
                      >
                        <option value="">Valitse ateria</option>
                        {meals.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.estimated_cost}€)
                          </option>
                        ))}
                      </select>

                      <div className="meal-slot-add-actions">
                        <button
                          className="btn-add-meal"
                          onClick={handleAddSubmit}
                          disabled={!selectValue}
                        >
                          Lisää
                        </button>
                        <button
                          className="btn-cancel"
                          onClick={() => setAddingTo(null)}
                        >
                          Peruuta
                        </button>
                      </div>
                    </div>
                  ) : (
                    <span className="meal-slot-plus">+</span>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}