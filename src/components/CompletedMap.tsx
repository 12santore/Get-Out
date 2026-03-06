"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { categoryEmoji } from "@/components/discovery/MapPin";
import { Category } from "@/lib/types";

type MapPoint = {
  id: string;
  name: string;
  category: Category;
  lat: number;
  lng: number;
  date_completed: string;
};

export function CompletedMap({ points }: { points: MapPoint[] }) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    // Guard against Next.js fast refresh / strict remounts reusing a stale Leaflet container.
    const existingLeafletId = (container as HTMLDivElement & { _leaflet_id?: number })._leaflet_id;
    if (existingLeafletId) {
      (container as HTMLDivElement & { _leaflet_id?: number })._leaflet_id = undefined;
    }

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const center: L.LatLngExpression = points.length ? [points[0].lat, points[0].lng] : [37.7749, -122.4194];
    const map = L.map(container).setView(center, 12);
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    points.forEach((point) => {
      const icon = L.divIcon({
        className: "category-pin",
        html: `<span class=\"pin-bounce\">${categoryEmoji(point.category)}</span>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      L.marker([point.lat, point.lng], { icon })
        .addTo(map)
        .bindPopup(
          `<strong>${point.name}</strong><br/>${point.category}<br/>Completed: ${new Date(point.date_completed).toLocaleString()}`
        );
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [points]);

  return <div ref={mapContainerRef} className="h-[500px] overflow-hidden rounded-2xl shadow-sm" />;
}
