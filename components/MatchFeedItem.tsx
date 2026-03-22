import UserAvatarBubble from "@/components/UserAvatarBubble";
import Link from "next/link";

export default function MatchFeedItem({
  userA,
  userB,
  created_at,
  currentUserId,
}: {
  userA: any;
  userB: any;
  created_at: string;
  currentUserId: string;
}) {
  const isA = userA.id === currentUserId;

  const viewer = isA ? userA : userB;
  const other = isA ? userB : userA;

  const viewerName = viewer.full_name || viewer.username;
  const otherName = other.full_name || other.username;

  return (
    <div className="flex items-center gap-4 py-4 border-b">
      {/* 🔥 FIXED AVATAR ORDER */}
      <div className="flex -space-x-2">
        <UserAvatarBubble src={other.avatar_url} size={40} />
        <UserAvatarBubble src={viewer.avatar_url} size={40} />
      </div>

      <div>
        <div className="flex items-center gap-1 text-sm">
          <Link href={`/profile/${other.username}`}>
            <span className="font-semibold hover:text-pink-500 cursor-pointer transition">
              {otherName}
            </span>
          </Link>

          <span className="opacity-70"> joined </span>

          <Link href={`/profile/${viewer.username}`}>
            <span className="font-semibold hover:text-pink-500 cursor-pointer transition">
              {viewerName}
            </span>
          </Link>

          <span className="opacity-70">'s circle.</span>
        </div>

        <p className="text-xs opacity-60">
          {new Date(created_at).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
