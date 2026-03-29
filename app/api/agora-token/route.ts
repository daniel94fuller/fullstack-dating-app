import { RtcTokenBuilder, RtcRole } from "agora-access-token";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const channel = searchParams.get("channel");
  const uid = searchParams.get("uid");

  if (!channel || !uid) {
    return new NextResponse("Missing params", { status: 400 });
  }

  try {
    const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID!;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE!;

    const role = RtcRole.PUBLISHER;
    const expirationTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    const numericUid = Number(uid);

    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channel,
      numericUid,
      role,
      privilegeExpiredTs,
    );

    return NextResponse.json({ token });
  } catch (err) {
    console.error(err);
    return new NextResponse("Token error", { status: 500 });
  }
}
