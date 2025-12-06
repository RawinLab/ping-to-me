"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Card,
  CardContent,
} from "@pingtome/ui";
import { ExternalLink } from "lucide-react";

interface BioLink {
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
}

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
  bioLinks: BioLink[];
}

interface BioPageRendererProps {
  pageData: BioPageData;
}

export function BioPageRenderer({ pageData }: BioPageRendererProps) {
  const { title, description, avatarUrl, bioLinks, showBranding } = pageData;

  // Get the URL for each link (either external URL or short link)
  const getUrl = (bioLink: BioLink): string => {
    if (bioLink.externalUrl) {
      return bioLink.externalUrl;
    }
    if (bioLink.link) {
      // Construct the short URL from the slug
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3010";
      return `${baseUrl}/${bioLink.link.slug}`;
    }
    return "#";
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex justify-center">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Avatar className="h-24 w-24 mx-auto mb-4">
            <AvatarImage src={avatarUrl || undefined} alt={title} />
            <AvatarFallback>
              {title.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          {description && (
            <p className="mt-2 text-gray-600">{description}</p>
          )}
        </div>

        <div className="space-y-4">
          {bioLinks.map((bioLink) => {
            const url = getUrl(bioLink);
            const displayTitle = bioLink.title;
            const displayDescription = bioLink.description ||
              (bioLink.link ? bioLink.link.originalUrl : bioLink.externalUrl);

            return (
              <a
                key={bioLink.id}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Card
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  style={{
                    backgroundColor: bioLink.buttonColor || undefined,
                  }}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div
                        className="font-medium text-lg"
                        style={{
                          color: bioLink.textColor || undefined,
                        }}
                      >
                        {displayTitle}
                      </div>
                      {displayDescription && (
                        <div
                          className="text-sm truncate max-w-[250px]"
                          style={{
                            color: bioLink.textColor
                              ? `${bioLink.textColor}99` // Add transparency
                              : undefined,
                          }}
                        >
                          {displayDescription}
                        </div>
                      )}
                    </div>
                    <ExternalLink
                      className="h-5 w-5 flex-shrink-0 ml-3"
                      style={{
                        color: bioLink.textColor || undefined,
                      }}
                    />
                  </CardContent>
                </Card>
              </a>
            );
          })}
          {bioLinks.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              No links to display.
            </div>
          )}
        </div>

        {showBranding !== false && (
          <div className="text-center mt-8">
            <a href="/" className="text-xs text-gray-400 hover:text-gray-600">
              Powered by PingTO.Me
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
