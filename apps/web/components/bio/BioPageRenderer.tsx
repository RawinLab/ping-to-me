"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Card,
  CardContent,
} from "@pingtome/ui";
import { ExternalLink } from "lucide-react";

interface BioPageProps {
  page: {
    title: string;
    description?: string;
    avatarUrl?: string;
    theme?: any;
    content: {
      links: string[]; // Array of link IDs
    };
  };
  links: any[]; // Array of full link objects
}

export function BioPageRenderer({ page, links }: BioPageProps) {
  // Filter links to only show those in the content list, preserving order
  const displayLinks = page.content.links
    .map((id) => links.find((l) => l.id === id))
    .filter((l) => l !== undefined);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex justify-center">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Avatar className="h-24 w-24 mx-auto mb-4">
            <AvatarImage src={page.avatarUrl} alt={page.title} />
            <AvatarFallback>
              {page.title.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <h1 className="text-3xl font-bold text-gray-900">{page.title}</h1>
          {page.description && (
            <p className="mt-2 text-gray-600">{page.description}</p>
          )}
        </div>

        <div className="space-y-4">
          {displayLinks.map((link) => (
            <a
              key={link.id}
              href={link.shortUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-lg">
                      {link.title || link.slug}
                    </div>
                    <div className="text-sm text-muted-foreground truncate max-w-[250px]">
                      {link.originalUrl}
                    </div>
                  </div>
                  <ExternalLink className="h-5 w-5 text-gray-400" />
                </CardContent>
              </Card>
            </a>
          ))}
          {displayLinks.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              No links to display.
            </div>
          )}
        </div>

        <div className="text-center mt-8">
          <a href="/" className="text-xs text-gray-400 hover:text-gray-600">
            Powered by PingTO.Me
          </a>
        </div>
      </div>
    </div>
  );
}
