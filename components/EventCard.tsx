import Image from "next/image";

export default function EventCard({ event }: any) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-md">
      {/* Host */}
      <div className="flex items-center gap-3 mb-3">
        <div className="relative w-10 h-10">
          <Image
            src={event.host.avatar_url || "/default-avatar.png"}
            alt={event.host.username}
            fill
            className="rounded-full object-cover"
          />
        </div>
        <div>
          <p className="font-semibold">{event.host.full_name}</p>
          <p className="text-xs text-gray-500">@{event.host.username}</p>
        </div>
      </div>

      {/* Event Info */}
      <h2 className="text-lg font-bold">{event.title}</h2>
      <p className="text-sm text-gray-500">{event.description}</p>

      <div className="mt-2 text-sm">📍 {event.location}</div>
      <div className="text-sm">
        🕒 {new Date(event.event_time).toLocaleString()}
      </div>

      {/* Interested Users */}
      <div className="flex mt-4 -space-x-2">
        {event.interests.slice(0, 5).map((i: any, idx: number) => (
          <div key={idx} className="relative w-8 h-8">
            <Image
              src={i.user.avatar_url || "/default-avatar.png"}
              alt=""
              fill
              className="rounded-full border-2 border-white object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
