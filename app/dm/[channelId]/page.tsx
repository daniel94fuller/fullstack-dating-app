import DMClient from "./DMClient";

export default async function Page({
  params,
}: {
  params: Promise<{ channelId: string }>;
}) {
  const { channelId } = await params;

  return <DMClient channelId={channelId} />;
}
