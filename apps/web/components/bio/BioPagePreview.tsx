"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Card,
  CardContent,
} from "@pingtome/ui";
import {
  Instagram,
  Twitter,
  Youtube,
  Facebook,
  Linkedin,
  Github,
  Mail,
  MessageCircle,
  ExternalLink,
} from "lucide-react";
import { BioPageTheme } from "@pingtome/types";
import {
  getButtonStyleClasses,
  getButtonShadowClasses,
} from "@/lib/biopage-themes";

/**
 * Social platform icon mapping
 */
const SOCIAL_ICONS = {
  instagram: Instagram,
  twitter: Twitter,
  tiktok: MessageCircle, // TikTok not available in lucide, using placeholder
  youtube: Youtube,
  facebook: Facebook,
  linkedin: Linkedin,
  github: Github,
  email: Mail,
  whatsapp: MessageCircle,
} as const;

interface BioLink {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  externalUrl?: string;
}

interface SocialLink {
  platform: string;
  url: string;
}

interface BioPagePreviewProps {
  title: string;
  description?: string;
  avatarUrl?: string;
  theme: BioPageTheme;
  layout: "stacked" | "grid";
  bioLinks: BioLink[];
  socialLinks?: SocialLink[];
  showBranding: boolean;
}

/**
 * Mobile Preview Component for Bio Page Editor
 *
 * Renders a realistic iPhone-like mobile phone mockup with live preview
 * of the bio page content as the user edits.
 */
export function BioPagePreview({
  title,
  description,
  avatarUrl,
  theme,
  layout,
  bioLinks,
  socialLinks = [],
  showBranding,
}: BioPagePreviewProps) {
  // Determine background style based on theme
  const getBackgroundStyle = (): React.CSSProperties => {
    if (theme.backgroundType === "gradient" && theme.backgroundGradient) {
      return {
        background: theme.backgroundGradient,
      };
    }

    if (theme.backgroundType === "image" && theme.backgroundImage) {
      return {
        backgroundImage: `url(${theme.backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      };
    }

    return {
      backgroundColor: theme.backgroundColor,
    };
  };

  // Get button classes based on theme
  const getButtonClasses = () => {
    const baseClasses = "transition-all duration-200 hover:scale-105";
    const styleClasses = getButtonStyleClasses(theme.buttonStyle);
    const shadowClasses = getButtonShadowClasses(theme.buttonShadow);

    return `${baseClasses} ${styleClasses} ${shadowClasses}`;
  };

  // Get social icon component
  const getSocialIcon = (platform: string) => {
    const Icon =
      SOCIAL_ICONS[platform as keyof typeof SOCIAL_ICONS] || ExternalLink;
    return Icon;
  };

  return (
    <div className="flex items-center justify-center p-8 bg-gradient-to-br from-gray-100 to-gray-200">
      {/* iPhone Mockup Frame */}
      <div className="relative" style={{ transform: "scale(0.65)" }}>
        {/* Phone Device Bezel */}
        <div
          className="relative bg-black rounded-[3rem] p-3 shadow-2xl"
          style={{
            width: "375px",
            height: "812px",
          }}
        >
          {/* Screen */}
          <div className="relative w-full h-full bg-white rounded-[2.5rem] overflow-hidden">
            {/* iPhone Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 z-50">
              <div className="bg-black h-7 w-48 rounded-b-3xl flex items-center justify-center">
                <div className="w-16 h-1 bg-gray-800 rounded-full"></div>
              </div>
            </div>

            {/* Scrollable Content Area */}
            <div
              className="w-full h-full overflow-y-auto overflow-x-hidden"
              style={getBackgroundStyle()}
            >
              <div
                className="min-h-full py-12 px-6"
                style={{
                  fontFamily: theme.fontFamily,
                }}
              >
                {/* Profile Section */}
                <div className="text-center mb-8">
                  {/* Avatar */}
                  <Avatar className="h-24 w-24 mx-auto mb-4 ring-4 ring-white/20">
                    <AvatarImage src={avatarUrl} alt={title} />
                    <AvatarFallback
                      style={{
                        backgroundColor: theme.primaryColor,
                        color: theme.buttonTextColor,
                      }}
                    >
                      {title.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  {/* Title */}
                  <h1
                    className="text-2xl font-bold mb-2"
                    style={{ color: theme.textColor }}
                  >
                    {title || "Your Name"}
                  </h1>

                  {/* Description */}
                  {description && (
                    <p
                      className="text-sm opacity-80"
                      style={{ color: theme.textColor }}
                    >
                      {description}
                    </p>
                  )}

                  {/* Social Links */}
                  {socialLinks.length > 0 && (
                    <div className="flex items-center justify-center gap-3 mt-4">
                      {socialLinks.map((social, index) => {
                        const Icon = getSocialIcon(social.platform);
                        return (
                          <a
                            key={index}
                            href={social.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-full transition-transform hover:scale-110"
                            style={{
                              backgroundColor: theme.buttonColor,
                              color: theme.buttonTextColor,
                            }}
                            onClick={(e) => e.preventDefault()} // Prevent navigation in preview
                          >
                            <Icon className="h-5 w-5" />
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Bio Links Section */}
                <div
                  className={
                    layout === "grid" ? "grid grid-cols-2 gap-3" : "space-y-4"
                  }
                >
                  {bioLinks.length > 0 ? (
                    bioLinks.map((bioLink) => (
                      <a
                        key={bioLink.id}
                        href={bioLink.externalUrl || "#"}
                        onClick={(e) => e.preventDefault()} // Prevent navigation in preview
                        className="block"
                      >
                        <Card
                          className={getButtonClasses()}
                          style={{
                            backgroundColor: theme.buttonColor,
                            borderColor: "transparent",
                          }}
                        >
                          <CardContent
                            className={`flex items-center justify-between ${
                              layout === "grid" ? "p-4" : "p-5"
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <div
                                className={`font-medium ${
                                  layout === "grid" ? "text-sm" : "text-base"
                                }`}
                                style={{
                                  color: theme.buttonTextColor,
                                }}
                              >
                                {bioLink.title}
                              </div>
                              {bioLink.description && layout === "stacked" && (
                                <div
                                  className="text-xs mt-1 truncate opacity-70"
                                  style={{
                                    color: theme.buttonTextColor,
                                  }}
                                >
                                  {bioLink.description}
                                </div>
                              )}
                            </div>
                            {layout === "stacked" && (
                              <ExternalLink
                                className="h-4 w-4 flex-shrink-0 ml-3"
                                style={{
                                  color: theme.buttonTextColor,
                                }}
                              />
                            )}
                          </CardContent>
                        </Card>
                      </a>
                    ))
                  ) : (
                    <div
                      className="text-center py-12 px-4 text-sm opacity-60"
                      style={{ color: theme.textColor }}
                    >
                      Add links to preview them here
                    </div>
                  )}
                </div>

                {/* Branding */}
                {showBranding && (
                  <div className="text-center mt-8">
                    <a
                      href="#"
                      className="text-xs opacity-50 hover:opacity-70 transition-opacity"
                      style={{ color: theme.textColor }}
                      onClick={(e) => e.preventDefault()}
                    >
                      Powered by PingTO.Me
                    </a>
                  </div>
                )}

                {/* Extra padding for scroll area */}
                <div className="h-8"></div>
              </div>
            </div>
          </div>

          {/* Home Indicator (Bottom Bar) */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-50">
            <div className="w-32 h-1 bg-white rounded-full"></div>
          </div>
        </div>

        {/* Power Button */}
        <div className="absolute -right-1 top-24 w-1 h-16 bg-gray-800 rounded-r-lg"></div>

        {/* Volume Buttons */}
        <div className="absolute -left-1 top-20 w-1 h-8 bg-gray-800 rounded-l-lg"></div>
        <div className="absolute -left-1 top-32 w-1 h-12 bg-gray-800 rounded-l-lg"></div>
        <div className="absolute -left-1 top-48 w-1 h-12 bg-gray-800 rounded-l-lg"></div>
      </div>
    </div>
  );
}
