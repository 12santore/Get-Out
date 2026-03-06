import { NextRequest, NextResponse } from "next/server";
import { appendFile, mkdir, stat } from "node:fs/promises";
import { join } from "node:path";

const requestLogPath = join(process.cwd(), "data", "nearby_requests.csv");

function csvEscape(value: string) {
  return value.replace(/,/g, " ").replace(/\n/g, " ").trim();
}

async function ensureRequestLogHeader() {
  try {
    await stat(requestLogPath);
  } catch {
    await mkdir(join(process.cwd(), "data"), { recursive: true });
    await appendFile(requestLogPath, "request_id,requested_at,status,lat,lng,requester_email\n", "utf-8");
  }
}

async function logRequest(params: { requestId: string; lat: number; lng: number; requesterEmail: string }) {
  await ensureRequestLogHeader();
  const row = [
    csvEscape(params.requestId),
    new Date().toISOString(),
    "pending_approval",
    String(params.lat),
    String(params.lng),
    csvEscape(params.requesterEmail)
  ].join(",");
  await appendFile(requestLogPath, `${row}\n`, "utf-8");
}

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

  return { sent: true as const };
}

export async function POST(request: NextRequest) {
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

  const requestId = `REQ-${Date.now().toString(36).toUpperCase()}`;
  await logRequest({ requestId, lat, lng, requesterEmail });
  const email = await sendApprovalEmail({ requestId, lat, lng, requesterEmail });

  return NextResponse.json({
    success: true,
    requestId,
    emailSent: email.sent
  });
}
