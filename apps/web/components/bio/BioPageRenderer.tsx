"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Card,
  CardContent,
} from "@pingtome/ui";
import {
  ExternalLink,
  Instagram,
  Twitter,
  Youtube,
  Facebook,
  Linkedin,
  Github,
  Mail,
  MessageCircle,
} from "lucide-react";
import type {
  BioPageTheme,
  LayoutType,
  SocialLink,
  SocialPlatform,
} from "@pingtome/types";
import {
  getButtonStyleClasses,
  getButtonShadowClasses,
} from "@/lib/biopage-themes";

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
  theme: BioPageTheme;
  layout: LayoutType;
  socialLinks: SocialLink[];
  showBranding: boolean;
  bioLinks: BioLink[];
}

interface BioPageRendererProps {
  pageData: BioPageData;
  onLinkClick?: (linkId: string) => void;
}

// Social platform icon mapping
const socialIcons: Record<SocialPlatform, typeof Instagram> = {
  instagram: Instagram,
  twitter: Twitter,
  tiktok: MessageCircle, // Using MessageCircle as placeholder for TikTok
  youtube: Youtube,
  facebook: Facebook,
  linkedin: Linkedin,
  github: Github,
  email: Mail,
  whatsapp: MessageCircle,
};

export function BioPageRenderer({
  pageData,
  onLinkClick,
}: BioPageRendererProps) {
  const {
    title,
    description,
    avatarUrl,
    bioLinks,
    showBranding,
    theme,
    layout,
    socialLinks,
  } = pageData;

  // Get the URL for each link (either external URL or short link)
  const getUrl = (bioLink: BioLink): string => {
    if (bioLink.externalUrl) {
      return bioLink.externalUrl;
    }
    if (bioLink.link) {
      // Construct the short URL from the slug
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3010";
      return `${baseUrl}/${bioLink.link.slug}`;
    }
    return "#";
  };

  // Compute background style based on theme
  const getBackgroundStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {};

    switch (theme.backgroundType) {
      case "solid":
        baseStyle.backgroundColor = theme.backgroundColor;
        break;
      case "gradient":
        if (theme.backgroundGradient) {
          baseStyle.backgroundImage = theme.backgroundGradient;
        } else {
          baseStyle.backgroundColor = theme.backgroundColor;
        }
        break;
      case "image":
        if (theme.backgroundImage) {
          baseStyle.backgroundImage = `url(${theme.backgroundImage})`;
          baseStyle.backgroundSize = "cover";
          baseStyle.backgroundPosition = "center";
          baseStyle.backgroundRepeat = "no-repeat";
        } else {
          baseStyle.backgroundColor = theme.backgroundColor;
        }
        break;
    }

    return baseStyle;
  };

  // Get button style classes
  const buttonStyleClasses = getButtonStyleClasses(theme.buttonStyle);
  const buttonShadowClasses = getButtonShadowClasses(theme.buttonShadow);

  return (
    <div
      className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex justify-center"
      style={{
        ...getBackgroundStyle(),
        fontFamily: theme.fontFamily,
      }}
    >
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .bio-header {
          animation: fadeIn 0.3s ease-out;
        }

        .bio-link-item {
          animation: fadeInUp 0.3s ease-out backwards;
        }

        .bio-link-card {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .bio-link-card:hover {
          transform: scale(1.03);
          box-shadow:
            0 10px 25px -5px rgba(0, 0, 0, 0.2),
            0 8px 10px -6px rgba(0, 0, 0, 0.15);
        }
      `}</style>

      <div className="max-w-md w-full space-y-8">
        {/* Header Section */}
        <div className="text-center bio-header">
          <Avatar
            className="h-24 w-24 mx-auto mb-4"
            style={{ boxShadow: `0 0 0 4px ${theme.primaryColor}` }}
          >
            <AvatarImage src={avatarUrl || undefined} alt={title} />
            <AvatarFallback
              style={{
                backgroundColor: theme.primaryColor,
                color: theme.buttonTextColor,
              }}
            >
              {title.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <h1 className="text-3xl font-bold" style={{ color: theme.textColor }}>
            {title}
          </h1>
          {description && (
            <p
              className="mt-2 text-lg"
              style={{ color: theme.textColor, opacity: 0.8 }}
            >
              {description}
            </p>
          )}
        </div>

        {/* Social Links */}
        {socialLinks && socialLinks.length > 0 && (
          <div className="flex justify-center gap-4 flex-wrap">
            {socialLinks
              .sort((a, b) => a.order - b.order)
              .map((social) => {
                const Icon = socialIcons[social.platform];
                return (
                  <a
                    key={social.platform}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-3 transition-all hover:scale-110 ${buttonStyleClasses} ${buttonShadowClasses}`}
                    style={{
                      backgroundColor: theme.buttonColor,
                      color: theme.buttonTextColor,
                    }}
                    aria-label={social.platform}
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                );
              })}
          </div>
        )}

        {/* Bio Links */}
        <div
          className={
            layout === "grid"
              ? "grid grid-cols-2 gap-4"
              : layout === "minimal"
              ? "space-y-3 flex flex-col items-center"
              : "space-y-4"
          }
        >
          {bioLinks.map((bioLink, index) => {
            const url = getUrl(bioLink);
            const displayTitle = bioLink.title;
            const displayDescription =
              bioLink.description ||
              (bioLink.link ? bioLink.link.originalUrl : bioLink.externalUrl);

            // Use per-link colors if set, otherwise fall back to theme colors
            const buttonColor = bioLink.buttonColor || theme.buttonColor;
            const textColor = bioLink.textColor || theme.buttonTextColor;

            const handleClick = () => {
              if (onLinkClick) {
                onLinkClick(bioLink.id);
              }
            };

            // Minimal layout - simple text links without background
            if (layout === "minimal") {
              return (
                <a
                  key={bioLink.id}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center py-4 px-8 transition-all duration-200 hover:opacity-80 w-full max-w-sm bio-link-item"
                  onClick={handleClick}
                  style={{
                    color: textColor,
                    borderBottom: `2px solid ${buttonColor}`,
                    animationDelay: `${0.1 + index * 0.05}s`,
                  }}
                >
                  <div className="font-medium text-lg">
                    {displayTitle}
                  </div>
                  {displayDescription && (
                    <div className="text-sm mt-1 opacity-70">
                      {displayDescription}
                    </div>
                  )}
                </a>
              );
            }

            // Cards layout - enhanced shadows and rounded corners
            if (layout === "cards") {
              return (
                <a
                  key={bioLink.id}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bio-link-item"
                  onClick={handleClick}
                  style={{
                    animationDelay: `${0.1 + index * 0.05}s`,
                  }}
                >
                  <Card
                    className="bio-link-card cursor-pointer border-0 rounded-2xl shadow-lg transition-all duration-200 hover:shadow-2xl"
                    style={{
                      backgroundColor: buttonColor,
                    }}
                  >
                    <CardContent className="p-6 flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div
                          className="font-semibold text-lg"
                          style={{
                            color: textColor,
                          }}
                        >
                          {displayTitle}
                        </div>
                        {displayDescription && (
                          <div
                            className="text-sm truncate max-w-[250px] mt-1"
                            style={{
                              color: textColor,
                              opacity: 0.7,
                            }}
                          >
                            {displayDescription}
                          </div>
                        )}
                      </div>
                      <ExternalLink
                        className="h-5 w-5 flex-shrink-0 ml-3"
                        style={{
                          color: textColor,
                        }}
                      />
                    </CardContent>
                  </Card>
                </a>
              );
            }

            // Stacked and Grid layouts
            return (
              <a
                key={bioLink.id}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="block bio-link-item"
                onClick={handleClick}
                style={{
                  animationDelay: `${0.1 + index * 0.05}s`,
                }}
              >
                <Card
                  className={`bio-link-card cursor-pointer border-0 ${buttonStyleClasses} ${buttonShadowClasses}`}
                  style={{
                    backgroundColor: buttonColor,
                  }}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div
                        className="font-medium text-lg"
                        style={{
                          color: textColor,
                        }}
                      >
                        {displayTitle}
                      </div>
                      {displayDescription && (
                        <div
                          className="text-sm truncate max-w-[250px]"
                          style={{
                            color: textColor,
                            opacity: 0.7,
                          }}
                        >
                          {displayDescription}
                        </div>
                      )}
                    </div>
                    <ExternalLink
                      className="h-5 w-5 flex-shrink-0 ml-3"
                      style={{
                        color: textColor,
                      }}
                    />
                  </CardContent>
                </Card>
              </a>
            );
          })}
          {bioLinks.length === 0 && (
            <div
              className="text-center py-8"
              style={{ color: theme.textColor, opacity: 0.6 }}
            >
              No links to display.
            </div>
          )}
        </div>

        {/* Branding */}
        {showBranding !== false && (
          <div className="text-center mt-8">
            <a
              href="/"
              className="text-xs hover:opacity-80 transition-opacity"
              style={{ color: theme.textColor, opacity: 0.5 }}
            >
              Powered by PingTO.Me
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
