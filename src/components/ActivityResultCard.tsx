"use client";

import { useState } from "react";
import Link from "next/link";
import { Activity } from "@/lib/types";

interface Props {
  activity: Activity;
  onStart: (payload: { notes: string; rating: number }) => void;
  onSave: () => void;
  onSpinAgain: () => void;
}

export function ActivityResultCard({ activity, onStart, onSave, onSpinAgain }: Props) {
  const [rating, setRating] = useState(3);
  const [notes, setNotes] = useState("");
  const mapsUrl =
    activity.lat !== null && activity.lng !== null
      ? `https://www.google.com/maps/search/?api=1&query=${activity.lat},${activity.lng}`
      : activity.source_url ?? "#";

  const calendarUrl = (() => {
    const start = new Date();
    const end = new Date(start.getTime() + activity.duration * 60_000);
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
    const details = encodeURIComponent(`Planned via Get Out. ${activity.source_url ?? ""}`.trim());
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(activity.name)}&dates=${fmt(start)}/${fmt(end)}&details=${details}`;
  })();

  const onShare = async () => {
    const shareUrl = activity.source_url ?? mapsUrl;
    try {
      if (navigator.share) {
        await navigator.share({
          title: activity.name,
          text: `Try this: ${activity.name}`,
          url: shareUrl
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
      }
    } catch {
      // User canceled share flow; no action needed.
    }
  };

  return (
    <section className="card p-6">
      <h2 className="text-xl font-bold">{activity.name}</h2>
      <p className="mt-2 text-sm text-slate-600">
        Category: {activity.category} | Duration: {activity.duration} minutes | Social: {activity.social_context}
      </p>
      <p className="mt-1 text-sm text-slate-600">Energy level: {activity.energy_level}/5</p>
      {activity.source_url && (
        <Link className="mt-2 inline-block text-sm text-sky-600 underline" href={activity.source_url} target="_blank">
          View source
        </Link>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={() => onStart({ notes, rating })} className="primary-btn">
          Start
        </button>
        <button onClick={onSpinAgain} className="rounded-lg bg-slate-100 px-3 py-2">
          Spin Again
        </button>
        <button onClick={onSave} className="rounded-lg bg-slate-100 px-3 py-2">
          Save
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link href={mapsUrl} target="_blank" className="rounded-lg bg-slate-100 px-3 py-2 text-sm">
          Open in Maps
        </Link>
        <button onClick={onShare} className="rounded-lg bg-slate-100 px-3 py-2 text-sm">
          Share
        </button>
        <Link href={calendarUrl} target="_blank" className="rounded-lg bg-slate-100 px-3 py-2 text-sm">
          Add to Calendar
        </Link>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-sm">Rating (1-5 stars)</span>
          <select className="w-full rounded-lg border px-3 py-2" value={rating} onChange={(e) => setRating(Number(e.target.value))}>
            {[1, 2, 3, 4, 5].map((value) => (
              <option key={value} value={value}>
                {value} star{value > 1 ? "s" : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-sm">Notes</span>
          <textarea
            className="w-full rounded-lg border px-3 py-2"
            rows={3}
            placeholder="Example: Spoke with Griselda, very helpful hostess..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>
      </div>
      {activity.lat !== null && activity.lng !== null && (
        <div className="mt-4 space-y-2">
          <p className="text-xs text-slate-500">Map pin: {activity.lat.toFixed(4)}, {activity.lng.toFixed(4)}</p>
          <iframe
            title="Activity location preview"
            className="h-44 w-full rounded-lg border"
            loading="lazy"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${activity.lng - 0.01}%2C${activity.lat - 0.01}%2C${activity.lng + 0.01}%2C${activity.lat + 0.01}&layer=mapnik&marker=${activity.lat}%2C${activity.lng}`}
          />
        </div>
      )}
    </section>
  );
}
