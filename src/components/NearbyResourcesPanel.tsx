"use client";

import { useState } from "react";

export function NearbyResourcesPanel() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const requestNearbyUpdate = () => {
    setLoading(true);
    setError(null);
    setNotice(null);

    const today = new Date().toISOString().slice(0, 10);
    const lastRequest = localStorage.getItem("nearby_request_date");
    if (lastRequest === today) {
      setError("Daily limit reached. You can send another request tomorrow.");
      setLoading(false);
      return;
    }

    if (!navigator.geolocation) {
      setError("Location is unavailable on this device/browser.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await fetch("/api/resources/request", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            })
          });
          if (!response.ok) {
            setError("Could not send update request.");
            return;
          }
          const payload = (await response.json()) as { requestId?: string };
          localStorage.setItem("nearby_request_date", today);
          setNotice(`Request sent for approval${payload.requestId ? ` (#${payload.requestId})` : ""}.`);
        } catch {
          setError("Could not send update request.");
        } finally {
          setLoading(false);
        }
      },
      () => {
        setError("Location permission is required for nearby resources.");
        setLoading(false);
      }
    );
  };

  return (
    <section className="card p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">New city mode</h2>
          <p className="text-sm text-slate-600">
            Request an update for your current city and I will review/approve before it is pulled. Limited to one request per day.
          </p>
        </div>
        <button className="primary-btn" onClick={requestNearbyUpdate} disabled={loading}>
          {loading ? "Sending request..." : "Update to my current city"}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {notice && <p className="mt-3 text-sm text-emerald-700">{notice}</p>}
    </section>
  );
}
