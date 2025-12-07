import { Metadata } from "next";
import { BioPageClient } from "./BioPageClient";

interface BioPageData {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  avatarUrl: string | null;
  theme: any;
  layout: any;
  socialLinks: any;
  showBranding: boolean;
}

async function getBioPageData(slug: string): Promise<BioPageData | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const res = await fetch(`${apiUrl}/biopages/public/${slug}`, {
      cache: "no-store", // Disable caching for dynamic bio pages
    });

    if (!res.ok) {
      return null;
    }

    return await res.json();
  } catch (error) {
    console.error("Failed to fetch bio page data for metadata:", error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const data = await getBioPageData(params.slug);

  if (!data) {
    return {
      title: "Bio Page Not Found",
      description: "The bio page you're looking for doesn't exist.",
    };
  }

  const title = data.title;
  const description =
    data.description || `Check out ${data.title}'s links on PingTO.Me`;
  const images = data.avatarUrl ? [data.avatarUrl] : [];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images,
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
      images,
    },
  };
}

export default function PublicBioPage({
  params,
}: {
  params: { slug: string };
}) {
  return <BioPageClient slug={params.slug} />;
}
