"use client";

import { useEffect, useState } from "react";
import { BioPageRenderer } from "@/components/bio/BioPageRenderer";
import { Loader2 } from "lucide-react";
import axios from "axios";
import { trackBioPageView, trackBioLinkClick } from "@/lib/bio-analytics";

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
  bioLinks: Array<{
    id: string;
    title: string;
    description: string | null;
    icon: string | null;
    thumbnailUrl: string | null;
    buttonColor: string | null;
    textColor: string | null;
    order: number;
    externalUrl: string | null;
    link: {
      slug: string;
      originalUrl: string;
    } | null;
  }>;
}

export function BioPageClient({ slug }: { slug: string }) {
  const [pageData, setPageData] = useState<BioPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchData();
    }
  }, [slug]);

  // Track page view when data is loaded
  useEffect(() => {
    if (pageData) {
      trackBioPageView(pageData.id);
    }
  }, [pageData]);

  const fetchData = async () => {
    try {
      // Fetch public bio page data from the public endpoint
      // This endpoint does not require authentication
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const response = await axios.get<BioPageData>(
        `${apiUrl}/biopages/public/${slug}`
      );

      setPageData(response.data);
    } catch (err: any) {
      console.error("Failed to load bio page", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !pageData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Page not found
          </h1>
          <p className="text-muted-foreground">
            The bio page you&apos;re looking for doesn&apos;t exist.
          </p>
        </div>
      </div>
    );
  }

  const handleLinkClick = (linkId: string) => {
    trackBioLinkClick(pageData.id, linkId);
  };

  return <BioPageRenderer pageData={pageData} onLinkClick={handleLinkClick} />;
}
