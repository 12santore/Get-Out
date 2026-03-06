"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/api-client";

const CompletedMap = dynamic(() => import("@/components/CompletedMap").then((mod) => mod.CompletedMap), {
  ssr: false
});

type CompletedPoint = {
  id: string;
  name: string;
  category: "Movement" | "Food" | "Wellness" | "Explore";
  lat: number;
  lng: number;
  date_completed: string;
};

export default function MapPage() {
  const [points, setPoints] = useState<CompletedPoint[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const response = await fetchWithAuth("/api/completed");
      if (!response.ok) {
        setError("Could not load completed experiences.");
        return;
      }
      setPoints((await response.json()) as CompletedPoint[]);
    };

    void load();
  }, []);

  return (
    <section className="card space-y-3 p-6">
      <h1 className="text-xl font-semibold">Completed activity map</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <CompletedMap points={points} />
    </section>
  );
}
