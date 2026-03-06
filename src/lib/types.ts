// Shared data contracts for client and API routes.
export type Category = "Movement" | "Food" | "Wellness" | "Explore";
export type SocialContext = "Solo" | "With Friends" | "Either";

export interface Activity {
  id: string;
  name: string;
  category: Category;
  duration: number;
  energy_level: number;
  social_context: SocialContext;
  lat: number | null;
  lng: number | null;
  tags: string[];
  source_url: string | null;
  created_at: string;
}

export interface CompletedExperience {
  id: string;
  activity_id: string;
  date_completed: string;
  rating?: number | null;
  notes: string | null;
  activity?: Activity;
}

export interface WeatherSummary {
  temp: number;
  description: string;
  icon: string;
  isRaining: boolean;
}
