import { AccessToken } from "livekit-server-sdk";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const room = searchParams.get("room");
  const username = searchParams.get("username");

  if (!room || !username) {
    return new NextResponse("Missing params", { status: 400 });
  }

  try {
    const at = new AccessToken(
      process.env.LIVEKIT_API_KEY!,
      process.env.LIVEKIT_API_SECRET!,
      {
        identity: username,
        // Token expires after 6 hours — prevents stale tokens from being
        // reused in a new session with a conflicting identity claim.
        ttl: "6h",
      },
    );

    at.addGrant({
      room,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();

    return NextResponse.json({ token });
  } catch (err) {
    console.error("TOKEN ERROR:", err);
    return new NextResponse("Token error", { status: 500 });
  }
}
