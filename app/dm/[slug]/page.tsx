import { createClient } from "@/lib/supabase/server";
import DMClient from "./DMClient";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const siteUrl = "https://www.popcircle.com";

async function getPlan(slug: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("dm_channels")
    .select("title, location_name, starts_at, slug")
    .eq("slug", slug)
    .single();

  return data;
}

function formatPlanDate(startsAt: string | number | null | undefined) {
  if (!startsAt) return null;

  const date = new Date(Number(startsAt));

  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function formatPlanTime(startsAt: string | number | null | undefined) {
  if (!startsAt) return null;

  const date = new Date(Number(startsAt));

  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const plan = await getPlan(slug);

  const planTitle = plan?.title || "Plan";
  const planDate = formatPlanDate(plan?.starts_at);
  const planTime = formatPlanTime(plan?.starts_at);

  const title = `${planTitle} on Popcircle`;

  const descriptionParts = [
    planDate && planTime ? `${planDate} at ${planTime}` : null,
    plan?.location_name ? plan.location_name : null,
  ].filter(Boolean);

  const description =
    descriptionParts.length > 0
      ? `Join ${planTitle}: ${descriptionParts.join(" • ")}`
      : "Join this plan on Popcircle.";

  const pageUrl = `${siteUrl}/dm/${slug}`;
  const imageUrl = `${siteUrl}/api/og/${slug}/image`;

  return {
    metadataBase: new URL(siteUrl),
    title,
    description,

    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: "Popcircle",
      type: "website",
      images: [
        {
          url: imageUrl,
          secureUrl: imageUrl,
          width: 1200,
          height: 630,
          alt: `${planTitle} plan preview`,
          type: "image/png",
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [
        {
          url: imageUrl,
          alt: `${planTitle} plan preview`,
        },
      ],
    },

    other: {
      "og:image": imageUrl,
      "og:image:secure_url": imageUrl,
      "og:image:type": "image/png",
      "og:image:width": "1200",
      "og:image:height": "630",
      "twitter:image": imageUrl,
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;

  return <DMClient slug={slug} />;
}
