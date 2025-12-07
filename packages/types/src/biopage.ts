/**
 * Bio Page Theming System Types
 *
 * Defines types for customizable bio pages (link-in-bio feature)
 * including themes, layouts, social links, and bio link configurations.
 */

/**
 * Available theme presets for bio pages
 */
export type ThemeName =
  | "minimal"
  | "dark"
  | "colorful"
  | "neon"
  | "gradient"
  | "pastel"
  | "custom";

/**
 * Layout types for bio link display
 */
export type LayoutType = "stacked" | "grid";

/**
 * Background rendering styles
 */
export type BackgroundType = "solid" | "gradient" | "image";

/**
 * Button shape styles
 */
export type ButtonStyle = "rounded" | "square" | "pill";

/**
 * Complete theme configuration for a bio page
 */
export interface BioPageTheme {
  /** Theme preset name */
  name: ThemeName;

  /** Primary accent color (hex or rgb) */
  primaryColor: string;

  /** Page background color (hex or rgb) */
  backgroundColor: string;

  /** Default button background color (hex or rgb) */
  buttonColor: string;

  /** Button text color (hex or rgb) */
  buttonTextColor: string;

  /** Primary text color for bio content (hex or rgb) */
  textColor: string;

  /** Font family (CSS font-family value) */
  fontFamily: string;

  /** Background rendering type */
  backgroundType: BackgroundType;

  /** Optional background image URL (when backgroundType is 'image') */
  backgroundImage?: string;

  /** Optional CSS gradient definition (when backgroundType is 'gradient') */
  backgroundGradient?: string;

  /** Button shape style */
  buttonStyle: ButtonStyle;

  /** Whether to apply shadow to buttons */
  buttonShadow: boolean;
}

/**
 * Supported social media platforms
 */
export type SocialPlatform =
  | "instagram"
  | "twitter"
  | "tiktok"
  | "youtube"
  | "facebook"
  | "linkedin"
  | "github"
  | "email"
  | "whatsapp";

/**
 * Social media link configuration
 */
export interface SocialLink {
  /** Social platform identifier */
  platform: SocialPlatform;

  /** Full URL to social profile */
  url: string;

  /** Display order (ascending) */
  order: number;
}

/**
 * Individual bio link/button configuration
 */
export interface BioLink {
  /** Unique identifier */
  id: string;

  /** Display title for the link */
  title: string;

  /** Optional description text */
  description?: string;

  /** Optional icon identifier or URL */
  icon?: string;

  /** Optional thumbnail/preview image URL */
  thumbnailUrl?: string;

  /** Optional custom button color override (hex or rgb) */
  buttonColor?: string;

  /** Optional custom text color override (hex or rgb) */
  textColor?: string;

  /** Display order (ascending) */
  order: number;

  /** External URL (used if link is not connected to a shortened link) */
  externalUrl?: string;

  /** Connected shortened link data */
  link?: {
    /** Short URL slug */
    slug: string;

    /** Original destination URL */
    originalUrl: string;
  };
}

/**
 * Complete bio page configuration
 */
export interface BioPageConfig {
  /** Unique identifier */
  id: string;

  /** URL slug for the bio page (e.g., /bio/[slug]) */
  slug: string;

  /** Display title/name */
  title: string;

  /** Optional bio description/tagline */
  description?: string;

  /** Optional profile avatar/photo URL */
  avatarUrl?: string;

  /** Theme configuration */
  theme: BioPageTheme;

  /** Layout type for bio links */
  layout: LayoutType;

  /** Social media links */
  socialLinks: SocialLink[];

  /** Bio links/buttons */
  bioLinks: BioLink[];

  /** Whether to show PingTO.Me branding */
  showBranding: boolean;
}
