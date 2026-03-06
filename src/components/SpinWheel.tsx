"use client";

import { useMemo } from "react";
import { Activity } from "@/lib/types";

export function SpinWheel({ options, onSpin }: { options: Activity[]; onSpin: () => void }) {
  const labels = useMemo(() => options.slice(0, 6).map((a) => a.name), [options]);

  return (
    <div className="card p-5">
      <div className="mx-auto mb-4 grid h-56 w-56 place-items-center rounded-full border-8 border-brand-100 bg-gradient-to-br from-brand-50 to-white">
        <ul className="max-h-40 list-disc overflow-auto px-6 text-sm">
          {labels.length ? labels.map((label) => <li key={label}>{label}</li>) : <li>No activities available</li>}
        </ul>
      </div>
      <button className="primary-btn w-full" onClick={onSpin}>
        Spin the Wheel
      </button>
    </div>
  );
}
