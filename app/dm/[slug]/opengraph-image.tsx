import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";

export const runtime = "edge";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

async function getPlan(slug: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("dm_channels")
    .select(
      `
      title,
      location_name,
      starts_at,
      lat,
      lng,
      slug,
      dm_participants(name, avatar_url, guest_id)
    `,
    )
    .eq("slug", slug)
    .single();

  return data;
}

function formatPlanDate(startsAt: string | number | null) {
  if (!startsAt) {
    return {
      date: "Date TBD",
      time: "",
    };
  }

  const date = new Date(Number(startsAt));

  return {
    date: date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    }),
    time: date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }),
  };
}

export default async function Image({ params }: Props) {
  const { slug } = await params;
  const plan = await getPlan(slug);

  const title = plan?.title || "Plan";
  const locationName = plan?.location_name || "Location TBD";
  const participants = plan?.dm_participants || [];
  const goingCount = participants.length;

  const { date, time } = formatPlanDate(plan?.starts_at || null);

  const mapUrl =
    plan?.lat && plan?.lng
      ? `https://maps.googleapis.com/maps/api/staticmap?center=${plan.lat},${plan.lng}&zoom=14&size=1200x630&scale=2&markers=color:red%7C${plan.lat},${plan.lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}`
      : null;

  const planUrl = `www.popcircle.com/dm/${slug}`;

  return new ImageResponse(
    <div
      style={{
        width: "1200px",
        height: "630px",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        background: "#080808",
        color: "white",
        fontFamily: "Arial",
      }}
    >
      {mapUrl && (
        <img
          src={mapUrl}
          style={{
            position: "absolute",
            inset: 0,
            width: "1200px",
            height: "630px",
            objectFit: "cover",
            opacity: 0.55,
          }}
        />
      )}

      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(90deg, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.82) 34%, rgba(0,0,0,0.45) 62%, rgba(0,0,0,0.25) 100%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(0deg, rgba(70,0,20,0.86) 0%, rgba(70,0,20,0.42) 20%, rgba(0,0,0,0) 52%)",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 2,
          width: "100%",
          height: "100%",
          padding: "56px 64px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        {/* Top branding */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "999px",
              background: "#ff0000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "32px",
              fontWeight: 800,
              letterSpacing: "-2px",
            }}
          >
            pop
          </div>

          <div
            style={{
              fontSize: "34px",
              fontWeight: 800,
              letterSpacing: "-1px",
            }}
          >
            circle
          </div>
        </div>

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "28px",
            maxWidth: "650px",
          }}
        >
          <div
            style={{
              fontSize: title.length > 18 ? "76px" : "94px",
              fontWeight: 900,
              letterSpacing: "-5px",
              lineHeight: 0.95,
            }}
          >
            {title}
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "22px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "20px",
              }}
            >
              <div
                style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "18px",
                  background: "rgba(255,255,255,0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "34px",
                }}
              >
                📅
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    fontSize: "34px",
                    fontWeight: 800,
                  }}
                >
                  {date}
                </div>

                <div
                  style={{
                    fontSize: "32px",
                    color: "rgba(255,255,255,0.78)",
                  }}
                >
                  {time}
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "20px",
              }}
            >
              <div
                style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "18px",
                  background: "rgba(99,102,241,0.8)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "34px",
                }}
              >
                📍
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    fontSize: "34px",
                    fontWeight: 800,
                  }}
                >
                  {locationName}
                </div>

                <div
                  style={{
                    fontSize: "28px",
                    color: "rgba(255,255,255,0.72)",
                  }}
                >
                  {planUrl}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom people row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(255,255,255,0.16)",
            paddingTop: "28px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
              }}
            >
              {participants.slice(0, 4).map((p: any, index: number) => (
                <div
                  key={`${p.guest_id}-${index}`}
                  style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "999px",
                    overflow: "hidden",
                    background: "#333",
                    border: "3px solid rgba(255,255,255,0.9)",
                    marginLeft: index === 0 ? "0px" : "-14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "28px",
                    fontWeight: 800,
                  }}
                >
                  {p.avatar_url ? (
                    <img
                      src={p.avatar_url}
                      style={{
                        width: "64px",
                        height: "64px",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    p.name?.[0] || "G"
                  )}
                </div>
              ))}
            </div>

            <div
              style={{
                fontSize: "32px",
                fontWeight: 800,
                color: "#22c55e",
              }}
            >
              {goingCount} going
            </div>
          </div>

          <div
            style={{
              background: "linear-gradient(135deg, #2563eb, #4f46e5)",
              padding: "24px 42px",
              borderRadius: "28px",
              fontSize: "34px",
              fontWeight: 900,
              boxShadow: "0 20px 60px rgba(37,99,235,0.35)",
            }}
          >
            Open Chat
          </div>
        </div>
      </div>
    </div>,
    {
      ...size,
    },
  );
}
