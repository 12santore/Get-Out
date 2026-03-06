export const foodCuisines = [
  "Any",
  "American",
  "Mexican",
  "Italian",
  "French",
  "Japanese",
  "Chinese",
  "Thai",
  "Indian",
  "Mediterranean",
  "Middle Eastern",
  "Korean",
  "Vietnamese",
  "Seafood",
  "BBQ",
  "Pizza",
  "Cafe",
  "Dessert",
  "Vegetarian/Vegan"
] as const;

export type FoodCuisine = (typeof foodCuisines)[number];

const cuisineKeywords: Record<Exclude<FoodCuisine, "Any">, string[]> = {
  American: ["american", "burger", "diner"],
  Mexican: ["mexican", "taco", "taqueria", "burrito"],
  Italian: ["italian", "pasta", "trattoria"],
  French: ["french", "bistro", "brasserie"],
  Japanese: ["japanese", "sushi", "ramen", "izakaya"],
  Chinese: ["chinese", "szechuan", "dim sum"],
  Thai: ["thai"],
  Indian: ["indian", "curry", "tandoori"],
  Mediterranean: ["mediterranean", "greek"],
  "Middle Eastern": ["middle eastern", "lebanese", "persian", "turkish", "falafel"],
  Korean: ["korean", "bbq korean"],
  Vietnamese: ["vietnamese", "pho", "banh mi"],
  Seafood: ["seafood", "oyster", "fish"],
  BBQ: ["bbq", "barbecue", "smokehouse"],
  Pizza: ["pizza", "pizzeria"],
  Cafe: ["cafe", "coffee", "bakery"],
  Dessert: ["dessert", "gelato", "ice cream", "pastry"],
  "Vegetarian/Vegan": ["vegetarian", "vegan", "plant-based"]
};

export function normalizeCuisineTags(rawCuisine: string | undefined): string[] {
  if (!rawCuisine) return [];
  return rawCuisine
    .split(/[;,]/)
    .map((chunk) => chunk.trim().toLowerCase())
    .filter(Boolean);
}

export function inferCuisineFromName(name: string): string[] {
  const lower = name.toLowerCase();
  const cuisines: string[] = [];
  for (const [cuisine, words] of Object.entries(cuisineKeywords)) {
    if (words.some((word) => lower.includes(word))) cuisines.push(cuisine.toLowerCase());
  }
  return cuisines;
}

export function matchesCuisine(tags: string[], cuisine: FoodCuisine): boolean {
  if (cuisine === "Any") return true;
  const lowerTags = tags.map((tag) => tag.toLowerCase());
  const keywords = cuisineKeywords[cuisine] ?? [];
  return keywords.some((keyword) => lowerTags.some((tag) => tag.includes(keyword)));
}
