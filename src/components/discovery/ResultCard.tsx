"use client";

import { useState } from "react";
import Link from "next/link";
import { MockActivity } from "@/lib/mock-discovery-data";

export function ResultCard({
  activity,
  onLetsGo,
  onShare
}: {
  activity: MockActivity;
  onLetsGo: () => void;
  onShare: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [friendEmails, setFriendEmails] = useState("");

  const calendarUrl = (() => {
    const start = new Date();
    const end = new Date(start.getTime() + activity.duration * 60_000);
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
    const details = encodeURIComponent(`${activity.quick_highlight}\n${activity.source_url}`);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(activity.name)}&dates=${fmt(start)}/${fmt(end)}&details=${details}`;
  })();

  const addFriends = () => {
    const recipients = friendEmails.trim();
    const subject = encodeURIComponent(`Join me: ${activity.name}`);
    const body = encodeURIComponent(`Hey! Want to do this with me?\n\n${activity.name}\n${activity.quick_highlight}\n${activity.source_url}`);
    window.location.href = `mailto:${recipients}?subject=${subject}&body=${body}`;
  };

  return (
    <section className="result-card fade-in">
      <div className="result-image" style={{ backgroundImage: `url(${activity.image})` }} />
      <div className="p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#3AAFA9]">{activity.category}</p>
        <p className="mt-1 text-sm text-slate-600">
          {activity.duration} min • {activity.distance} minutes away • ⭐ {activity.rating.toFixed(1)}
        </p>
        <h3 className="mt-1 text-lg font-semibold text-[#1E1E1E]">{activity.name}</h3>
        <p className="mt-1 text-sm text-slate-600">{activity.subcategory}</p>
        <div className="mt-4 flex gap-2">
          <button className="primary-btn flex-1" onClick={onLetsGo}>Let&apos;s Go</button>
          <button className="chip-pill" onClick={onShare}>Share</button>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <button className="chip-pill text-sm" onClick={() => setExpanded((v) => !v)}>
            {expanded ? "Hide info" : "Expand info"}
          </button>
          <Link href={calendarUrl} target="_blank" className="chip-pill text-center text-sm">
            Add to Calendar
          </Link>
        </div>
        <div className="mt-3 rounded-xl border border-slate-200 p-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Add friends by email</p>
          <div className="flex gap-2">
            <input
              className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="friend1@email.com, friend2@email.com"
              value={friendEmails}
              onChange={(e) => setFriendEmails(e.target.value)}
            />
            <button className="chip-pill text-sm" onClick={addFriends}>Add friends</button>
          </div>
        </div>
        {expanded && (
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm text-slate-700">{activity.quick_highlight}</p>
            <p className="mt-2 text-sm text-slate-700">
              📣 <span className="font-medium">User shout:</span> {activity.user_tip}
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {activity.imageGallery.slice(0, 3).map((img, idx) => (
                <button
                  key={img}
                  className="h-20 overflow-hidden rounded-lg"
                  onClick={() => setLightboxIndex(idx)}
                  style={{ backgroundImage: `url(${img})`, backgroundSize: "cover", backgroundPosition: "center" }}
                />
              ))}
            </div>
          </div>
        )}
        <div className="mt-3">
          <Link href={activity.source_url} target="_blank" className="text-sm text-[#3A4F7A] underline">Open source</Link>
        </div>
      </div>

      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-black/75 p-4">
          <div className="w-full max-w-md">
            <div
              className="h-[70vh] w-full rounded-xl bg-contain bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${activity.imageGallery[lightboxIndex]})` }}
            />
            <div className="mt-3 flex items-center justify-between">
              <button className="lightbox-btn" onClick={() => setLightboxIndex((i) => (i === null ? 0 : Math.max(0, i - 1)))}>
                Prev
              </button>
              <button className="lightbox-btn" onClick={() => setLightboxIndex(null)}>Close</button>
              <button
                className="lightbox-btn"
                onClick={() =>
                  setLightboxIndex((i) => (i === null ? 0 : Math.min(activity.imageGallery.length - 1, i + 1)))
                }
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
