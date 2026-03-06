import { Category } from "@/lib/types";

export function categoryEmoji(category: Category) {
  if (category === "Movement") return "🌿";
  if (category === "Food") return "🍜";
  if (category === "Wellness") return "🧘";
  return "🎨";
}
