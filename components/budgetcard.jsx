import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function BudgetCard({ user }) {
  const [budget, setBudget] = useState(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Fetch budget for current user
  useEffect(() => {
    if (!user) return;

    const fetchBudget = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("budgets")
        .select("*")
        .eq("user_id", user.id)
        .gte("end_date", weekStart.toISOString())
        .order("start_date", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        setError(error.message);
      } else if (data) {
        setBudget(data);
        setAmount(data.amount);
      } else {
        setBudget(null);
        setAmount("");
      }

      setLoading(false);
    };

    fetchBudget();
  }, [user]);

  const handleSave = async () => {
    if (!amount || isNaN(amount)) return;

    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    const { data, error } = await supabase
      .from("budgets")
      .upsert(
        {
          user_id: user.id,
          amount: parseFloat(amount),
          start_date: weekStart.toISOString(),
          end_date: weekEnd.toISOString(),
        },
        { onConflict: ["user_id"] } // ensures RLS respects single budget per user
      )
      .select()
      .single();

    if (error) {
      setError(error.message);
    } else {
      setBudget(data);
      setSuccessMsg("Budget saved successfully!");
    }

    setSaving(false);
  };

  if (!user) {
    return (
      <div className="p-4 border rounded-lg">
        <p>Please log in to manage your budget.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 border rounded-lg">
        <p>Loading budget...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white shadow rounded-2xl space-y-4">
      <h2 className="text-xl font-semibold">Weekly Budget</h2>

      {budget ? (
        <p className="text-gray-600">
          Current budget for this week: <strong>€{budget.amount}</strong>
        </p>
      ) : (
        <p className="text-gray-600">No budget set for this week yet.</p>
      )}

      <div className="flex gap-2">
        <input
          type="number"
          placeholder="Enter weekly budget"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="border p-2 rounded w-full"
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-black text-white px-4 py-2 rounded"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}
      {successMsg && <p className="text-green-500 text-sm">{successMsg}</p>}
    </div>
  ); }