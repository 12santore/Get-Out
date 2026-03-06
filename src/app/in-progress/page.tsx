"use client";

import { useEffect, useState } from "react";

type InProgressItem = {
  id: string;
  activityId: string;
  name: string;
  category: "Movement" | "Food" | "Wellness" | "Explore";
  quick_highlight?: string;
  user_tip?: string;
  queued_at: string;
};

export default function InProgressPage() {
  const [items, setItems] = useState<InProgressItem[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    const response = await fetch("/api/in-progress");
    if (!response.ok) return;
    setItems((await response.json()) as InProgressItem[]);
  };

  useEffect(() => {
    void load();
  }, []);

  const completeAndMap = async (id: string) => {
    const response = await fetch("/api/in-progress/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inProgressId: id })
    });

    if (!response.ok) {
      setMessage("Could not complete activity.");
      return;
    }

    setMessage("Completed activity added to map.");
    await load();
  };

  const removeFromQueue = async (id: string) => {
    const confirmed = window.confirm("Are you sure you want to remove from the queue?");
    if (!confirmed) return;

    const response = await fetch("/api/in-progress", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inProgressId: id })
    });

    if (!response.ok) {
      setMessage("Could not remove from queue.");
      return;
    }

    setMessage("Removed from queue.");
    await load();
  };

  return (
    <section className="card space-y-4 p-4">
      <h1 className="text-xl font-semibold">In Progress</h1>
      <p className="text-sm text-slate-600">Queue activities here, then complete them to add map pins.</p>
      {message && <p className="text-sm text-emerald-700">{message}</p>}
      <div className="space-y-3">
        {items.map((item) => (
          <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#3AAFA9]">{item.category}</p>
            <h2 className="mt-1 text-base font-semibold">{item.name}</h2>
            {item.quick_highlight && <p className="mt-1 text-sm text-slate-600">{item.quick_highlight}</p>}
            {item.user_tip && <p className="mt-1 text-sm text-slate-600">📣 {item.user_tip}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="primary-btn" onClick={() => void completeAndMap(item.id)}>
                Complete activity & add to map!
              </button>
              <button className="chip-pill" onClick={() => void removeFromQueue(item.id)}>
                Remove from queue
              </button>
            </div>
          </article>
        ))}
      </div>
      {!items.length && <p className="text-sm text-slate-500">No activities in progress yet.</p>}
    </section>
  );
}
