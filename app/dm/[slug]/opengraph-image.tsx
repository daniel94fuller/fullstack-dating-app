import { ImageResponse } from "next/og";

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

export default async function Image({ params }: Props) {
  const { slug } = await params;

  return new ImageResponse(
    <div
      style={{
        width: "1200px",
        height: "630px",
        background: "linear-gradient(135deg, #050505 0%, #16000a 100%)",
        color: "white",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "64px",
        fontFamily: "Arial",
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
            width: "90px",
            height: "90px",
            borderRadius: "999px",
            background: "#ff0000",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "38px",
            fontWeight: 900,
            letterSpacing: "-3px",
          }}
        >
          pop
        </div>

        <div
          style={{
            fontSize: "42px",
            fontWeight: 900,
            letterSpacing: "-2px",
          }}
        >
          circle
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <div
          style={{
            fontSize: "96px",
            fontWeight: 900,
            letterSpacing: "-5px",
            lineHeight: 1,
          }}
        >
          Plan Preview
        </div>

        <div
          style={{
            fontSize: "36px",
            color: "rgba(255,255,255,0.72)",
          }}
        >
          Join this plan on Popcircle
        </div>

        <div
          style={{
            fontSize: "28px",
            color: "rgba(255,255,255,0.5)",
          }}
        >
          www.popcircle.com/dm/{slug}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: "1px solid rgba(255,255,255,0.16)",
          paddingTop: "28px",
        }}
      >
        <div
          style={{
            fontSize: "34px",
            fontWeight: 800,
            color: "#22c55e",
          }}
        >
          People going
        </div>

        <div
          style={{
            background: "#2563eb",
            padding: "22px 38px",
            borderRadius: "28px",
            fontSize: "32px",
            fontWeight: 900,
          }}
        >
          Open Chat
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
    },
  );
}
