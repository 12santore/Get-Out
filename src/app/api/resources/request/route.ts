import { NextRequest, NextResponse } from "next/server";
import { join } from "node:path";
import { appendCsvRow, countCsvRowsForDate, ensureCsvHeader, envNumber } from "@/lib/csv-usage";

const requestLogPath = join(process.cwd(), "data", "nearby_requests.csv");
const spendAuditPath = join(process.cwd(), "data", "spend_audit.csv");

async function ensureRequestLogHeader() {
  await ensureCsvHeader(requestLogPath, "request_id,requested_at,status,lat,lng,requester_email");
}

async function ensureSpendAuditHeader() {
  await ensureCsvHeader(spendAuditPath, "logged_at,kind,provider,estimated_usd,notes");
}

async function logRequest(params: { requestId: string; lat: number; lng: number; requesterEmail: string }) {
  await ensureRequestLogHeader();
  await appendCsvRow(requestLogPath, [
    params.requestId,
    new Date().toISOString(),
    "pending_approval",
    String(params.lat),
    String(params.lng),
    params.requesterEmail
  ]);
}

async function logSpend(params: { kind: string; provider: string; estimatedUsd: number; notes: string }) {
  await ensureSpendAuditHeader();
  await appendCsvRow(spendAuditPath, [
    new Date().toISOString(),
    params.kind,
    params.provider,
    params.estimatedUsd.toFixed(4),
    params.notes
  ]);
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

  await logSpend({
    kind: "email",
    provider: "resend",
    estimatedUsd: envNumber("ESTIMATED_RESEND_EMAIL_COST_USD", 0),
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

  const today = new Date().toISOString().slice(0, 10);
  const dailyLimit = envNumber("DAILY_NEW_CITY_REQUEST_LIMIT", 10);
  const todayCount = await countCsvRowsForDate(requestLogPath, 1, today);
  if (todayCount >= dailyLimit) {
    return NextResponse.json({ error: "Daily request cap reached. Try again tomorrow." }, { status: 429 });
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
