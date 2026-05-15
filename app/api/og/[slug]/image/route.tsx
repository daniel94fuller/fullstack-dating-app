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
        background: "#050505",
        color: "white",
        fontFamily: "Arial",
      }}
    >
      {/* MAP BACKGROUND */}
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
            opacity: 0.56,
          }}
        />
      ) : (
        <div
          style={{
            display: "flex",
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(135deg, #050505 0%, #151515 46%, #2a0010 100%)",
          }}
        />
      )}

      {/* LEFT DARK READABILITY OVERLAY */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(90deg, rgba(0,0,0,0.98) 0%, rgba(0,0,0,0.92) 34%, rgba(0,0,0,0.64) 62%, rgba(0,0,0,0.28) 100%)",
        }}
      />

      {/* SOFT BOTTOM TINT */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(0deg, rgba(40,0,15,0.88) 0%, rgba(0,0,0,0.18) 42%, rgba(0,0,0,0) 100%)",
        }}
      />

      {/* MAIN CONTENT */}
      <div
        style={{
          display: "flex",
          position: "relative",
          zIndex: 2,
          width: "100%",
          height: "100%",
          padding: "52px 64px 38px 64px",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        {/* TOP */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "30px",
            maxWidth: "730px",
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
                width: "70px",
                height: "70px",
                borderRadius: "999px",
                background: "#ff0000",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "31px",
                fontWeight: 900,
                letterSpacing: "-3px",
                boxShadow: "0 16px 45px rgba(0,0,0,0.45)",
              }}
            >
              pop
            </div>

            <div
              style={{
                display: "flex",
                fontSize: "34px",
                fontWeight: 900,
                letterSpacing: "-1px",
                textShadow: "0 10px 30px rgba(0,0,0,0.8)",
              }}
            >
              circle
            </div>
          </div>

          {/* TITLE */}
          <div
            style={{
              display: "flex",
              fontSize: title.length > 18 ? "74px" : "98px",
              fontWeight: 900,
              letterSpacing: "-5px",
              lineHeight: 0.94,
              textShadow: "0 14px 40px rgba(0,0,0,0.95)",
            }}
          >
            {title}
          </div>

          {/* DETAILS */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "22px",
            }}
          >
            {/* DATE */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "20px",
              }}
            >
              <div
                style={{
                  width: "76px",
                  height: "76px",
                  borderRadius: "20px",
                  background: "rgba(255,255,255,0.16)",
                  border: "1px solid rgba(255,255,255,0.24)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "32px",
                  fontWeight: 900,
                  boxShadow: "0 14px 40px rgba(0,0,0,0.5)",
                }}
              >
                {day}
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    fontSize: "35px",
                    fontWeight: 900,
                    lineHeight: 1.05,
                  }}
                >
                  {date}
                </div>

                <div
                  style={{
                    display: "flex",
                    fontSize: "33px",
                    color: "rgba(255,255,255,0.84)",
                    lineHeight: 1.15,
                  }}
                >
                  {time}
                </div>
              </div>
            </div>

            {/* LOCATION */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "20px",
              }}
            >
              <div
                style={{
                  width: "76px",
                  height: "76px",
                  borderRadius: "20px",
                  background: "linear-gradient(135deg, #6d5dfc, #4f46e5)",
                  border: "1px solid rgba(255,255,255,0.22)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "44px",
                  fontWeight: 900,
                  boxShadow: "0 14px 40px rgba(79,70,229,0.35)",
                }}
              >
                •
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  maxWidth: "640px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    fontSize: location.length > 38 ? "29px" : "33px",
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
                    color: "rgba(255,255,255,0.68)",
                    lineHeight: 1.2,
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
            paddingTop: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "24px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "14px",
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
                      width: "78px",
                    }}
                  >
                    <div
                      style={{
                        width: "66px",
                        height: "66px",
                        borderRadius: "999px",
                        overflow: "hidden",
                        background: "#27272a",
                        border: "3px solid rgba(255,255,255,0.96)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "26px",
                        fontWeight: 900,
                        boxShadow: "0 10px 26px rgba(0,0,0,0.58)",
                      }}
                    >
                      {p.avatar_url ? (
                        <img
                          src={p.avatar_url}
                          width="66"
                          height="66"
                          style={{
                            width: "66px",
                            height: "66px",
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
                        fontSize: "16px",
                        fontWeight: 700,
                        lineHeight: 1,
                        color: "rgba(255,255,255,0.92)",
                        width: "78px",
                        textShadow: "0 8px 20px rgba(0,0,0,0.8)",
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
                    color: "rgba(255,255,255,0.74)",
                  }}
                >
                  Be first to join
                </div>
              )}
            </div>

            <div
              style={{
                display: "flex",
                fontSize: "32px",
                fontWeight: 900,
                color: "#22c55e",
                marginTop: "-12px",
                textShadow: "0 8px 24px rgba(0,0,0,0.8)",
              }}
            >
              {goingCount} going
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "linear-gradient(135deg, #2563eb, #4f46e5)",
              padding: "22px 42px",
              borderRadius: "30px",
              fontSize: "32px",
              fontWeight: 900,
              boxShadow: "0 22px 55px rgba(37,99,235,0.55)",
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
        "Cache-Control": "public, max-age=60, s-maxage=60",
        "Content-Type": "image/png",
      },
    },
  );
}
