import DMClient from "./DMClient";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return <DMClient slug={slug} />;
}
