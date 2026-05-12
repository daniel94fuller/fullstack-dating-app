import { createClient } from "@/lib/supabase/server";
import DMClient from "./DMClient";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

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
    plan?.location_name ? `at ${plan.location_name}` : null,
  ].filter(Boolean);

  const description =
    descriptionParts.length > 0
      ? `Join ${planTitle} ${descriptionParts.join(" ")}.`
      : "Join this plan on Popcircle.";

  const pageUrl = `https://www.popcircle.com/dm/${slug}`;
  const imageUrl = `/dm/${slug}/opengraph-image`;

  return {
    title,
    description,
    metadataBase: new URL("https://www.popcircle.com"),
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: "Popcircle",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;

  return <DMClient slug={slug} />;
}
