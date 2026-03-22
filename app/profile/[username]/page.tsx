import { getMatchCount } from "@/lib/actions/circle";
import { getMatchFeed } from "@/lib/actions/feed";
import { createClient } from "@/lib/supabase/server";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const supabase = await createClient();

  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .maybeSingle(); // ✅ FIX

  if (!user) {
    return <div>User not found</div>;
  }

  const matchCount = await getMatchCount(user.id);
  const feed = await getMatchFeed(user.id);

  return <ProfileClient user={user} matchCount={matchCount} feed={feed} />;
}
