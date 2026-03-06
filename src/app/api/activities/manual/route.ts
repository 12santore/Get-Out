import { NextRequest, NextResponse } from "next/server";
import { getManualActivityUpdates } from "@/lib/manual-updates";

export async function GET(request: NextRequest) {
  const limit = Number(request.nextUrl.searchParams.get("limit") ?? "50");
  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(100, Math.floor(limit))) : 50;
  const rows = await getManualActivityUpdates(safeLimit);
  return NextResponse.json(rows);
}
