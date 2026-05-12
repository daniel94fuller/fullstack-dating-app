import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";

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

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createClient(supabaseUrl, supabaseAnonKey);
}

function formatDate(startsAt: string | number | null | undefined) {
  if (!startsAt) {
    return {
      date: "Date TBD",
      time: "",
    };
  }

  const d = new Date(Number(startsAt));

  if (Number.isNaN(d.getTime())) {
    return {
      date: "Date TBD",
      time: "",
    };
  }

  return {
    date: d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    }),
    time: d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }),
  };
}

export default async function Image({ params }: Props) {
  const { slug } = await params;
  const supabase = getSupabase();

  const { data: plan } = await supabase
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

  const title = plan?.title || "Plan";
  const location = plan?.location_name || "Location TBD";
  const participants = plan?.dm_participants || [];
  const goingCount = participants.length;

  const { date, time } = formatDate(plan?.starts_at);

  const mapUrl =
    plan?.lat && plan?.lng && process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY
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
        background: "#09090b",
        color: "white",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      {mapUrl ? (
        <img
          src={mapUrl}
          width="1200"
          height="630"
          style={{
            position: "absolute",
            inset: 0,
            width: "1200px",
            height: "630px",
            objectFit: "cover",
            opacity: 0.5,
          }}
        />
      ) : (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(135deg, #09090b 0%, #18181b 45%, #3f0715 100%)",
          }}
        />
      )}

      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(90deg, rgba(0,0,0,0.98) 0%, rgba(0,0,0,0.88) 38%, rgba(0,0,0,0.45) 70%, rgba(0,0,0,0.2) 100%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(0deg, rgba(70,0,20,0.92) 0%, rgba(70,0,20,0.45) 22%, rgba(0,0,0,0) 55%)",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 2,
          width: "100%",
          height: "100%",
          padding: "54px 64px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        {/* BRAND */}
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
              background: "#ef0000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "32px",
              fontWeight: 900,
              letterSpacing: "-3px",
            }}
          >
            pop
          </div>

          <div
            style={{
              fontSize: "34px",
              fontWeight: 900,
              letterSpacing: "-1px",
            }}
          >
            circle
          </div>
        </div>

        {/* MAIN */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "30px",
            maxWidth: "700px",
          }}
        >
          <div
            style={{
              fontSize: title.length > 18 ? "74px" : "96px",
              fontWeight: 900,
              letterSpacing: "-5px",
              lineHeight: 0.94,
            }}
          >
            {title}
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "24px",
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
                  background: "rgba(255,255,255,0.14)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "32px",
                  fontWeight: 900,
                }}
              >
                17
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
                    fontWeight: 900,
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
                  background: "rgba(79,70,229,0.95)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "38px",
                  fontWeight: 900,
                }}
              >
                •
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
                    fontWeight: 900,
                  }}
                >
                  {location}
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

        {/* FOOTER */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(255,255,255,0.16)",
            paddingTop: "26px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "18px",
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
                    background: "#27272a",
                    border: "3px solid rgba(255,255,255,0.9)",
                    marginLeft: index === 0 ? "0px" : "-14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "28px",
                    fontWeight: 900,
                  }}
                >
                  {p.avatar_url ? (
                    <img
                      src={p.avatar_url}
                      width="64"
                      height="64"
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

              {participants.length === 0 && (
                <div
                  style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "999px",
                    background: "#27272a",
                    border: "3px solid rgba(255,255,255,0.9)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "28px",
                    fontWeight: 900,
                  }}
                >
                  P
                </div>
              )}
            </div>

            <div
              style={{
                fontSize: "32px",
                fontWeight: 900,
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
      width: 1200,
      height: 630,
    },
  );
}
