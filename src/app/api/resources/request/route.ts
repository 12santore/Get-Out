import { NextRequest, NextResponse } from "next/server";
import { configuredCap, countNewCityRequestsToday, logNewCityRequest, logSpend } from "@/lib/system-logs";

async function sendApprovalEmail(params: { requestId: string; lat: number; lng: number; requesterEmail: string }) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const approvalEmail = process.env.APPROVAL_EMAIL_TO;
  const fromEmail = process.env.APPROVAL_EMAIL_FROM;
  if (!resendApiKey || !approvalEmail || !fromEmail) {
    return { sent: false, reason: "missing_email_env" as const };
  }

  const subject = `Get Out city update request ${params.requestId}`;
  const body = [
    "A New City Mode update request is pending approval.",
    "",
    `Request ID: ${params.requestId}`,
    `Requested at: ${new Date().toISOString()}`,
    `Coordinates: ${params.lat.toFixed(6)}, ${params.lng.toFixed(6)}`,
    `Requester email: ${params.requesterEmail || "not_provided"}`
  ].join("\n");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [approvalEmail],
      subject,
      text: body
    }),
    cache: "no-store"
  });

  if (!response.ok) {
    return { sent: false, reason: "provider_error" as const };
  }

  await logSpend({
    kind: "email",
    provider: "resend",
    estimatedUsd: configuredCap("ESTIMATED_RESEND_EMAIL_COST_USD", 0),
    notes: `city_request:${params.requestId}`
  });

  return { sent: true as const };
}

export async function POST(request: NextRequest) {
  if ((process.env.NEW_CITY_REQUESTS_ENABLED ?? "true").toLowerCase() === "false") {
    return NextResponse.json({ error: "New city requests are temporarily disabled." }, { status: 503 });
  }

  const payload = (await request.json().catch(() => ({}))) as {
    lat?: number;
    lng?: number;
    requesterEmail?: string;
  };

  const lat = Number(payload.lat);
  const lng = Number(payload.lng);
  const requesterEmail = typeof payload.requesterEmail === "string" ? payload.requesterEmail : "";

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "lat and lng are required" }, { status: 400 });
  }

  const dailyLimit = configuredCap("DAILY_NEW_CITY_REQUEST_LIMIT", 10);
  const todayCount = await countNewCityRequestsToday();
  if (todayCount >= dailyLimit) {
    return NextResponse.json({ error: "Daily request cap reached. Try again tomorrow." }, { status: 429 });
  }

  const requestId = `REQ-${Date.now().toString(36).toUpperCase()}`;
  await logNewCityRequest({ requestId, lat, lng, requesterEmail });
  const email = await sendApprovalEmail({ requestId, lat, lng, requesterEmail });

  return NextResponse.json({
    success: true,
    requestId,
    emailSent: email.sent
  });
}
