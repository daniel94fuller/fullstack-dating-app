import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

function formatDate(startsAt: string | number | null | undefined) {
  if (!startsAt) {
    return {
      day: "?",
      date: "Date TBD",
      time: "",
    };
  }

  const d = new Date(Number(startsAt));

  if (Number.isNaN(d.getTime())) {
    return {
      day: "?",
      date: "Date TBD",
      time: "",
    };
  }

  return {
    day: d.toLocaleDateString("en-US", { day: "numeric" }),
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

function getShortName(name?: string | null) {
  if (!name) return "Guest";

  const first = name.trim().split(" ")[0] || "Guest";
  return first.length > 9 ? `${first.slice(0, 9)}…` : first;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
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
  const shownParticipants = participants.slice(0, 4);

  const { day, date, time } = formatDate(plan?.starts_at);

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
        background: "#010101",
        color: "white",
        fontFamily: "Arial",
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
            opacity: 0.13,
          }}
        />
      ) : (
        <div
          style={{
            display: "flex",
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(135deg, #010101 0%, #050505 45%, #120007 100%)",
          }}
        />
      )}

      <div
        style={{
          display: "flex",
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.58)",
        }}
      />

      <div
        style={{
          display: "flex",
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(90deg, rgba(0,0,0,0.998) 0%, rgba(0,0,0,0.994) 30%, rgba(0,0,0,0.965) 52%, rgba(0,0,0,0.84) 74%, rgba(0,0,0,0.62) 100%)",
        }}
      />

      <div
        style={{
          display: "flex",
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(0deg, rgba(10,0,5,0.98) 0%, rgba(0,0,0,0.72) 38%, rgba(0,0,0,0.12) 100%)",
        }}
      />

      <div
        style={{
          display: "flex",
          position: "absolute",
          left: "44px",
          top: "34px",
          width: "710px",
          height: "548px",
          borderRadius: "30px",
          background: "rgba(0,0,0,0.44)",
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.56)",
        }}
      />

      <div
        style={{
          display: "flex",
          position: "relative",
          zIndex: 2,
          width: "100%",
          height: "100%",
          padding: "50px 60px",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "26px",
            maxWidth: "690px",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: title.length > 18 ? "68px" : "88px",
              fontWeight: 900,
              letterSpacing: "-4px",
              lineHeight: 0.92,
              textShadow: "0 10px 34px rgba(0,0,0,0.98)",
            }}
          >
            {title}
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "18px",
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
                  width: "70px",
                  height: "70px",
                  borderRadius: "20px",
                  background: "rgba(255,255,255,0.09)",
                  border: "1px solid rgba(255,255,255,0.14)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "30px",
                  fontWeight: 900,
                }}
              >
                {day}
              </div>

              <div style={{ display: "flex", flexDirection: "column" }}>
                <div
                  style={{
                    display: "flex",
                    fontSize: "34px",
                    fontWeight: 900,
                    lineHeight: 1.08,
                  }}
                >
                  {date}
                </div>

                <div
                  style={{
                    display: "flex",
                    fontSize: "32px",
                    color: "rgba(255,255,255,0.86)",
                    lineHeight: 1.12,
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
                  width: "70px",
                  height: "70px",
                  borderRadius: "20px",
                  background: "rgba(79,70,229,0.95)",
                  border: "1px solid rgba(255,255,255,0.14)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "42px",
                  fontWeight: 900,
                  flexShrink: 0,
                }}
              >
                •
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  maxWidth: "560px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    fontSize: "32px",
                    fontWeight: 900,
                    lineHeight: 1.08,
                  }}
                >
                  {location}
                </div>

                <div
                  style={{
                    display: "flex",
                    fontSize: "25px",
                    color: "rgba(255,255,255,0.64)",
                    lineHeight: 1.18,
                  }}
                >
                  {planUrl}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            width: "100%",
            borderTop: "1px solid rgba(255,255,255,0.12)",
            paddingTop: "18px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              maxWidth: "720px",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: "31px",
                fontWeight: 900,
                color: "#22c55e",
                lineHeight: 1,
              }}
            >
              {goingCount} going
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "16px",
                height: "104px",
              }}
            >
              {shownParticipants.length > 0 ? (
                shownParticipants.map((p: any, index: number) => (
                  <div
                    key={`${p.guest_id}-${index}`}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "7px",
                      width: "88px",
                    }}
                  >
                    <div
                      style={{
                        width: "74px",
                        height: "74px",
                        borderRadius: "999px",
                        overflow: "hidden",
                        background: "#27272a",
                        border: "3px solid rgba(255,255,255,0.96)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "28px",
                        fontWeight: 900,
                        boxShadow: "0 10px 28px rgba(0,0,0,0.5)",
                      }}
                    >
                      {p.avatar_url ? (
                        <img
                          src={p.avatar_url}
                          width="74"
                          height="74"
                          style={{
                            width: "74px",
                            height: "74px",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        getShortName(p.name)[0]
                      )}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        textAlign: "center",
                        fontSize: "17px",
                        fontWeight: 700,
                        lineHeight: 1,
                        color: "rgba(255,255,255,0.9)",
                        width: "88px",
                      }}
                    >
                      {getShortName(p.name)}
                    </div>
                  </div>
                ))
              ) : (
                <div
                  style={{
                    display: "flex",
                    fontSize: "24px",
                    color: "rgba(255,255,255,0.75)",
                  }}
                >
                  Be first to join
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              background: "linear-gradient(135deg, #2563eb, #4f46e5)",
              padding: "22px 42px",
              borderRadius: "30px",
              fontSize: "32px",
              fontWeight: 900,
              boxShadow: "0 20px 50px rgba(37,99,235,0.45)",
              marginBottom: "22px",
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
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Type": "image/png",
      },
    },
  );
}
