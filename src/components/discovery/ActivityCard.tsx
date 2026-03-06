import Link from "next/link";
import { MockActivity } from "@/lib/mock-discovery-data";

type SuggestionCard = {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  image: string;
  href: string;
};

export function ActivityCard({ card }: { card: SuggestionCard }) {
  return (
    <Link className="suggestion-card fade-in" style={{ backgroundImage: `url(${card.image})` }} href={card.href} target="_blank">
      <div className="suggestion-overlay" />
      <div className="relative z-10 text-left text-white">
        <p className="text-sm">{card.icon}</p>
        <p className="mt-1 text-lg font-semibold">{card.title}</p>
        <p className="text-sm text-white/90">{card.subtitle}</p>
        <p className="mt-1 text-xs font-medium text-white/90 underline">More info</p>
      </div>
    </Link>
  );
}

export function activityToSuggestion(activity: MockActivity): SuggestionCard {
  const iconMap: Record<MockActivity["category"], string> = {
    Movement: "🌿",
    Food: "🍜",
    Wellness: "🧘",
    Explore: "🎨"
  };

  return {
    id: activity.id,
    icon: iconMap[activity.category],
    title: activity.name,
    subtitle: activity.subcategory,
    image: activity.image,
    href: activity.source_url
  };
}
