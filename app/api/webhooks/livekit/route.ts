import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.text();

    console.log("LiveKit webhook received:", body);

    // ✅ Always return success so LiveKit stops retrying
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ ok: true });
  }
}
