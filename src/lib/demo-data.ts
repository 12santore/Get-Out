import { WeatherSummary } from "@/lib/types";

export const demoWeather: WeatherSummary = {
  temp: 67,
  description: "partly cloudy",
  icon: "02d",
  isRaining: false
};

export const demoState: {
  favorites: string[];
  inProgress?: Array<{
    id: string;
    activityId: string;
    name: string;
    category: string;
    lat: number;
    lng: number;
    source_url: string;
    image?: string;
    imageGallery?: string[];
    quick_highlight?: string;
    user_tip?: string;
    queued_at: string;
  }>;
  completed: Array<{
    id: string;
    activityId: string;
    date_completed: string;
    notes?: string;
    rating?: number;
    activityName?: string;
    lat?: number;
    lng?: number;
    category?: string;
  }>;
} = {
  favorites: [],
  completed: []
};
