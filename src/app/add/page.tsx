"use client";

import { FormEvent, useEffect, useState } from "react";

const categories = ["Movement", "Food", "Wellness", "Explore"];
const socialOptions = ["Solo", "With Friends", "Either"];

type ManualUpdateRow = {
  id: string;
  created_at: string;
  name: string;
  category: string;
  source_url: string;
};

export default function AddActivityPage() {
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("Explore");
  const [duration, setDuration] = useState(60);
  const [socialContext, setSocialContext] = useState("Either");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [tags, setTags] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [manualUpdates, setManualUpdates] = useState<ManualUpdateRow[]>([]);
  const [loadingUpdates, setLoadingUpdates] = useState(true);

  const loadManualUpdates = async () => {
    setLoadingUpdates(true);
    try {
      const response = await fetch("/api/activities/manual?limit=20");
      if (!response.ok) {
        setManualUpdates([]);
        return;
      }
      setManualUpdates((await response.json()) as ManualUpdateRow[]);
    } catch {
      setManualUpdates([]);
    } finally {
      setLoadingUpdates(false);
    }
  };

  useEffect(() => {
    void loadManualUpdates();
  }, []);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage(null);

    const response = await fetch("/api/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url,
        category,
        duration,
        socialContext,
        lat: lat ? Number(lat) : undefined,
        lng: lng ? Number(lng) : undefined,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      })
    });

    const data = (await response.json()) as { name?: string; error?: string };
    if (!response.ok) {
      setMessage(data.error ?? "Could not add activity.");
      return;
    }

    setMessage(`Added: ${data.name ?? "New activity"}`);
    setUrl("");
    setLat("");
    setLng("");
    setTags("");
    void loadManualUpdates();
  };

  return (
    <section className="card mx-auto max-w-2xl p-6">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">+ Activity</h1>
        <span
          className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-xs font-semibold text-slate-600"
          title="You can add a link to any particular activity here."
          aria-label="Help"
        >
          ?
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-600">
        Paste links from AllTrails, Google Maps, Apple Maps, Yelp, and more. We parse what we can, and you can override details.
      </p>

      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        <label className="block space-y-1">
          <span className="text-sm">URL</span>
          <input
            required
            type="url"
            className="w-full rounded-lg border border-slate-200 px-3 py-2"
            placeholder="https://maps.google.com/..."
            value={url}
            onChange={(event) => setUrl(event.target.value)}
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-sm">Category</span>
            <select className="w-full rounded-lg border px-3 py-2" value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-sm">Social context</span>
            <select className="w-full rounded-lg border px-3 py-2" value={socialContext} onChange={(e) => setSocialContext(e.target.value)}>
              {socialOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-sm">Duration (minutes)</span>
            <input
              type="number"
              min={5}
              className="w-full rounded-lg border px-3 py-2"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm">Latitude (optional)</span>
            <input className="w-full rounded-lg border px-3 py-2" value={lat} onChange={(e) => setLat(e.target.value)} />
          </label>

          <label className="space-y-1">
            <span className="text-sm">Longitude (optional)</span>
            <input className="w-full rounded-lg border px-3 py-2" value={lng} onChange={(e) => setLng(e.target.value)} />
          </label>
        </div>

        <label className="block space-y-1">
          <span className="text-sm">Tags (comma-separated, optional)</span>
          <input
            className="w-full rounded-lg border px-3 py-2"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="date-night, outdoor, kid-friendly"
          />
        </label>

        <button className="primary-btn" type="submit">
          Add Activity
        </button>
      </form>

      {message && <p className="mt-4 text-sm text-slate-700">{message}</p>}

      <section className="mt-8 border-t border-slate-200 pt-5">
        <h2 className="text-lg font-semibold">Prior manual updates</h2>
        <p className="mt-1 text-sm text-slate-600">Most recent links added through this page.</p>

        {loadingUpdates ? (
          <p className="mt-3 text-sm text-slate-500">Loading updates...</p>
        ) : manualUpdates.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No manual updates yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {manualUpdates.map((row) => (
              <li key={`${row.id}-${row.created_at}`} className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-slate-800">{row.name}</p>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">{row.category}</span>
                </div>
                <a className="mt-1 block truncate text-xs text-blue-700 underline" href={row.source_url} target="_blank" rel="noreferrer">
                  {row.source_url}
                </a>
                <p className="mt-1 text-xs text-slate-500">{new Date(row.created_at).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
