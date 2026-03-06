import { NextRequest, NextResponse } from "next/server";
import { demoState } from "@/lib/demo-data";
import { Category } from "@/lib/types";

type InProgressItem = {
  id: string;
  activityId: string;
  name: string;
  category: Category;
  lat: number;
  lng: number;
  source_url: string;
  image?: string;
  imageGallery?: string[];
  quick_highlight?: string;
  user_tip?: string;
  queued_at: string;
};

export async function GET() {
  return NextResponse.json((demoState as { inProgress?: InProgressItem[] }).inProgress ?? []);
}

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as Partial<InProgressItem>;
  if (!payload.activityId || !payload.name || !payload.category) {
    return NextResponse.json({ error: "Missing required activity payload." }, { status: 400 });
  }

  const inProgress = ((demoState as { inProgress?: InProgressItem[] }).inProgress ??= []);
  if (inProgress.some((item) => item.activityId === payload.activityId)) {
    return NextResponse.json({ success: true, duplicate: true });
  }

  const item: InProgressItem = {
    id: `inprogress-${Date.now()}`,
    activityId: payload.activityId,
    name: payload.name,
    category: payload.category as Category,
    lat: typeof payload.lat === "number" ? payload.lat : 0,
    lng: typeof payload.lng === "number" ? payload.lng : 0,
    source_url: payload.source_url ?? "",
    image: payload.image,
    imageGallery: payload.imageGallery ?? [],
    quick_highlight: payload.quick_highlight,
    user_tip: payload.user_tip,
    queued_at: new Date().toISOString()
  };

  inProgress.unshift(item);
  return NextResponse.json({ success: true, item });
}

export async function DELETE(request: NextRequest) {
  const { inProgressId } = (await request.json()) as { inProgressId?: string };
  if (!inProgressId) {
    return NextResponse.json({ error: "inProgressId is required." }, { status: 400 });
  }

  const inProgress = ((demoState as { inProgress?: InProgressItem[] }).inProgress ??= []);
  const index = inProgress.findIndex((item) => item.id === inProgressId);
  if (index === -1) {
    return NextResponse.json({ error: "Activity not found." }, { status: 404 });
  }

  inProgress.splice(index, 1);
  return NextResponse.json({ success: true });
}
