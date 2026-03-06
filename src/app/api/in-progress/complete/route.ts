import { NextRequest, NextResponse } from "next/server";
import { demoState } from "@/lib/demo-data";

export async function POST(request: NextRequest) {
  const { inProgressId } = (await request.json()) as { inProgressId?: string };
  if (!inProgressId) {
    return NextResponse.json({ error: "inProgressId is required." }, { status: 400 });
  }

  const state = demoState as {
    inProgress?: Array<{
      id: string;
      activityId: string;
      name: string;
      category: string;
      lat: number;
      lng: number;
      quick_highlight?: string;
      user_tip?: string;
      source_url?: string;
      image?: string;
      imageGallery?: string[];
      queued_at: string;
    }>;
  };

  const inProgress = state.inProgress ?? [];
  const idx = inProgress.findIndex((item) => item.id === inProgressId);
  if (idx === -1) return NextResponse.json({ error: "Activity not found." }, { status: 404 });

  const [item] = inProgress.splice(idx, 1);
  if (!item) return NextResponse.json({ error: "Activity not found." }, { status: 404 });

  demoState.completed.unshift({
    id: `demo-completed-${Date.now()}`,
    activityId: item.activityId,
    activityName: item.name,
    category: item.category,
    lat: item.lat,
    lng: item.lng,
    date_completed: new Date().toISOString(),
    notes: "Completed from In Progress",
    rating: 5
  });

  return NextResponse.json({ success: true });
}
