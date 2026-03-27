"use client";

export default function ActivityCard({ item }: any) {
  return (
    <div className="flex items-center gap-3 p-3 bg-zinc-900/70 rounded-xl border border-white/10">
      {/* USER 1 */}
      <img
        src={item.user1?.avatar_url || "/default-avatar.png"}
        className="w-10 h-10 rounded-full object-cover"
      />

      {/* TEXT */}
      <div className="text-sm text-white">
        <span className="font-semibold">{item.user1?.full_name}</span> added{" "}
        <span className="font-semibold">{item.user2?.full_name}</span> to their
        circle
      </div>

      {/* USER 2 */}
      <img
        src={item.user2?.avatar_url || "/default-avatar.png"}
        className="w-10 h-10 rounded-full object-cover ml-auto"
      />
    </div>
  );
}
