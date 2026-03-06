import { Category } from "@/lib/types";

export type MockActivity = {
  id: string;
  name: string;
  category: Category;
  subcategory: string;
  lat: number;
  lng: number;
  rating: number;
  duration: number;
  distance: number;
  tags: string[];
  image: string;
  imageGallery: string[];
  quick_highlight: string;
  user_tip: string;
  source_url: string;
};

export type LocaleSpotlight = {
  city: string;
  hook: string;
  history: string;
  culture: string;
  images: string[];
};

export const scottsdaleSpotlight: LocaleSpotlight = {
  city: "Scottsdale",
  hook: "Sonoran light, desert trails, and mountain silhouettes make Scottsdale one of the most photogenic active-lifestyle cities in the US.",
  history:
    "Scottsdale began as a small desert farming community and evolved into a design-forward city known for public art, architecture, and access to the McDowell Sonoran Preserve.",
  culture:
    "Today, Scottsdale blends wellness, coffee culture, and standout restaurants with galleries, farmers markets, and weekend outdoor adventure.",
  images: [
    "https://upload.wikimedia.org/wikipedia/commons/0/0c/Scottsdale_Civic_Center.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/3/33/McDowell_Mountains_from_Scottsdale.jpg",
    "https://images.unsplash.com/photo-1516939884455-1445c8652f83?auto=format&fit=crop&w=1200&q=60"
  ]
};

export const mockActivities: MockActivity[] = [
  {
    id: "m1",
    name: "Torrey Pines Coastal Trail",
    category: "Movement",
    subcategory: "Scenic hike",
    lat: 32.9207,
    lng: -117.252,
    rating: 4.8,
    duration: 90,
    distance: 12,
    tags: ["outdoor", "trail", "scenic"],
    image: "https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=900&q=60",
    imageGallery: [
      "https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1200&q=60",
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=60",
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=60"
    ],
    quick_highlight: "Golden-hour cliff views with ocean air and steady movement.",
    user_tip: "Be sure to pack sunscreen and water, little shade on this beautiful trail.",
    source_url: "https://www.alltrails.com/"
  },
  {
    id: "m2",
    name: "Golden Hour Run Club",
    category: "Movement",
    subcategory: "Run club",
    lat: 33.503,
    lng: -111.924,
    rating: 4.6,
    duration: 60,
    distance: 6,
    tags: ["outdoor", "social", "run"],
    image: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=900&q=60",
    imageGallery: [
      "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1200&q=60",
      "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?auto=format&fit=crop&w=1200&q=60"
    ],
    quick_highlight: "An easy social run with skyline sunset energy.",
    user_tip: "First timers are welcome; arrive 10 minutes early for warm-up intros.",
    source_url: "https://www.google.com/maps"
  },
  {
    id: "m3",
    name: "Studio Burn Pilates",
    category: "Movement",
    subcategory: "Pilates studio",
    lat: 33.488,
    lng: -111.931,
    rating: 4.7,
    duration: 60,
    distance: 5,
    tags: ["indoor", "pilates", "fitness"],
    image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=900&q=60",
    imageGallery: [
      "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=60"
    ],
    quick_highlight: "Low-impact burn in a bright, modern studio.",
    user_tip: "Users recommend booking reformer spots 24h ahead.",
    source_url: "https://www.google.com/maps"
  },
  {
    id: "f1",
    name: "Sonora Farm Table",
    category: "Food",
    subcategory: "Farm-to-table",
    lat: 33.495,
    lng: -111.92,
    rating: 4.7,
    duration: 75,
    distance: 8,
    tags: ["american", "healthy", "dine-in"],
    image: "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=900&q=60",
    imageGallery: [
      "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=1200&q=60",
      "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1200&q=60"
    ],
    quick_highlight: "Fresh, seasonal menu with vibrant patio atmosphere.",
    user_tip: "Users recommend the tri tip and roasted carrots.",
    source_url: "https://www.google.com/maps"
  },
  {
    id: "f2",
    name: "Mizu Sushi Bar",
    category: "Food",
    subcategory: "Sushi",
    lat: 33.492,
    lng: -111.926,
    rating: 4.6,
    duration: 60,
    distance: 4,
    tags: ["japanese", "sushi", "dinner"],
    image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=900&q=60",
    imageGallery: [
      "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=1200&q=60",
      "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?auto=format&fit=crop&w=1200&q=60"
    ],
    quick_highlight: "Chef-forward rolls with a clean minimalist vibe.",
    user_tip: "Sit at the bar for the seasonal omakase specials.",
    source_url: "https://www.google.com/maps"
  },
  {
    id: "f3",
    name: "Casa Sol Mexican Kitchen",
    category: "Food",
    subcategory: "Mexican",
    lat: 33.507,
    lng: -111.93,
    rating: 4.5,
    duration: 55,
    distance: 7,
    tags: ["mexican", "trendy", "brunch"],
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=900&q=60",
    imageGallery: [
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=60"
    ],
    quick_highlight: "Colorful, energetic dining with great patio seating.",
    user_tip: "Best tables are the outdoor corner booths after 6pm.",
    source_url: "https://www.google.com/maps"
  },
  {
    id: "w1",
    name: "Salt + Stone Recovery",
    category: "Wellness",
    subcategory: "Sauna + cold plunge",
    lat: 33.498,
    lng: -111.927,
    rating: 4.9,
    duration: 60,
    distance: 5,
    tags: ["wellness", "recovery", "indoor"],
    image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=900&q=60",
    imageGallery: [
      "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1200&q=60"
    ],
    quick_highlight: "High-end recovery circuit for stress reset and energy lift.",
    user_tip: "Book the contrast therapy block for best recovery value.",
    source_url: "https://www.google.com/maps"
  },
  {
    id: "w2",
    name: "Desert Breathwork Collective",
    category: "Wellness",
    subcategory: "Breathwork class",
    lat: 33.501,
    lng: -111.92,
    rating: 4.8,
    duration: 45,
    distance: 6,
    tags: ["wellness", "breathwork", "mindful"],
    image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=900&q=60",
    imageGallery: [
      "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=60"
    ],
    quick_highlight: "Nervous-system reset in under an hour.",
    user_tip: "Bring a light layer; rooms are intentionally cool.",
    source_url: "https://www.google.com/maps"
  },
  {
    id: "w3",
    name: "Quiet Light Yoga Flow",
    category: "Wellness",
    subcategory: "Yoga studio",
    lat: 33.489,
    lng: -111.934,
    rating: 4.7,
    duration: 60,
    distance: 4,
    tags: ["yoga", "wellness", "indoor"],
    image: "https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?auto=format&fit=crop&w=900&q=60",
    imageGallery: [
      "https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?auto=format&fit=crop&w=1200&q=60"
    ],
    quick_highlight: "Calming flow classes with clean, airy design.",
    user_tip: "Users love the 6:30am class for a peaceful start.",
    source_url: "https://www.google.com/maps"
  },
  {
    id: "e1",
    name: "Scottsdale Contemporary Gallery",
    category: "Explore",
    subcategory: "Art gallery",
    lat: 33.491,
    lng: -111.927,
    rating: 4.6,
    duration: 90,
    distance: 5,
    tags: ["art", "culture", "indoor"],
    image: "https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?auto=format&fit=crop&w=900&q=60",
    imageGallery: [
      "https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?auto=format&fit=crop&w=1200&q=60"
    ],
    quick_highlight: "Rotating exhibitions and local artist showcases.",
    user_tip: "Check first-Friday programming for live talks.",
    source_url: "https://www.google.com/maps"
  },
  {
    id: "e2",
    name: "Civic Market Saturday Pop-Up",
    category: "Explore",
    subcategory: "Market",
    lat: 33.493,
    lng: -111.924,
    rating: 4.5,
    duration: 120,
    distance: 5,
    tags: ["market", "culture", "outdoor"],
    image: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=900&q=60",
    imageGallery: [
      "https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=1200&q=60"
    ],
    quick_highlight: "Local makers, coffee, and neighborhood energy.",
    user_tip: "Arrive early for best bakery and produce picks.",
    source_url: "https://www.google.com/maps"
  },
  {
    id: "e3",
    name: "Desert Botanical Garden Loop",
    category: "Explore",
    subcategory: "Scenic spot",
    lat: 33.46,
    lng: -111.944,
    rating: 4.8,
    duration: 120,
    distance: 14,
    tags: ["garden", "outdoor", "scenic"],
    image: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=900&q=60",
    imageGallery: [
      "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=60",
      "https://images.unsplash.com/photo-1497250681960-ef046c08a56e?auto=format&fit=crop&w=1200&q=60"
    ],
    quick_highlight: "Iconic Sonoran landscape paths and desert blooms.",
    user_tip: "Golden hour here is unreal; bring water and shade gear.",
    source_url: "https://www.google.com/maps"
  }
];
