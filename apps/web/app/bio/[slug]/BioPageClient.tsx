"use client";

import { useEffect, useState } from "react";
import { BioPageRenderer } from "@/components/bio/BioPageRenderer";
import { Loader2, Frown, Home } from "lucide-react";
import axios from "axios";
import { trackBioPageView, trackBioLinkClick } from "@/lib/bio-analytics";
import { Button } from "@pingtome/ui";
import Link from "next/link";

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
        `${apiUrl}/biopages/public/${slug}`,
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
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-md w-full space-y-8">
          {/* Skeleton Header */}
          <div className="text-center">
            {/* Avatar Skeleton */}
            <div className="h-24 w-24 mx-auto mb-4 rounded-full bg-gray-200 animate-pulse" />

            {/* Title Skeleton */}
            <div className="h-8 w-48 mx-auto bg-gray-200 rounded-lg animate-pulse mb-3" />

            {/* Description Skeleton */}
            <div className="h-5 w-64 mx-auto bg-gray-200 rounded-lg animate-pulse" />
          </div>

          {/* Social Links Skeleton */}
          <div className="flex justify-center gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-11 w-11 bg-gray-200 rounded-lg animate-pulse"
                style={{ animationDelay: `${i * 50}ms` }}
              />
            ))}
          </div>

          {/* Bio Links Skeleton */}
          <div className="space-y-4 mt-8">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-20 w-full bg-gray-200 rounded-xl animate-pulse"
                style={{ animationDelay: `${i * 75}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !pageData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
        <div className="text-center max-w-md">
          {/* Sad Face Icon */}
          <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-200">
            <Frown className="h-10 w-10 text-gray-400" />
          </div>

          {/* Error Message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Page Not Found
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            The bio page you&apos;re looking for doesn&apos;t exist or has been
            removed.
          </p>

          {/* Go Home Button */}
          <Link href="/">
            <Button size="lg" className="inline-flex items-center gap-2">
              <Home className="h-4 w-4" />
              Go Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleLinkClick = (linkId: string) => {
    trackBioLinkClick(pageData.id, linkId);
  };

  return <BioPageRenderer pageData={pageData} onLinkClick={handleLinkClick} />;
}
