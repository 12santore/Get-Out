import { Activity } from "@/lib/types";
import { loadScottsdaleActivitiesFromCsv } from "@/lib/scottsdale-csv";

const store = {
  loaded: false,
  activities: [] as Activity[]
};

function ensureLoaded() {
  if (store.loaded) return;
  store.activities = loadScottsdaleActivitiesFromCsv();
  store.loaded = true;
}

export function getDemoActivities(): Activity[] {
  ensureLoaded();
  return store.activities;
}

export function addDemoActivity(activity: Activity) {
  ensureLoaded();
  store.activities.unshift(activity);
}
