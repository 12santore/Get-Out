"use client";

import { useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/api-client";
import { Activity } from "@/lib/types";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Activity[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const response = await fetchWithAuth("/api/favorites");
      if (!response.ok) {
        setError("Failed to load favorites.");
        return;
      }

      setFavorites((await response.json()) as Activity[]);
    };

    void load();
  }, []);

  return (
    <section className="card p-6">
      <h1 className="text-xl font-semibold">Saved activities</h1>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <ul className="mt-4 space-y-3">
        {favorites.map((activity) => (
          <li key={activity.id} className="rounded-lg border border-slate-200 p-3">
            <p className="font-medium">{activity.name}</p>
            <p className="text-sm text-slate-500">
              {activity.category} | {activity.duration}m | {activity.social_context}
            </p>
          </li>
        ))}
      </ul>
      {!favorites.length && !error && <p className="mt-4 text-sm text-slate-500">No saved activities yet.</p>}
    </section>
  );
}
