/**
 * Bio Page Theme Presets
 *
 * This module provides predefined theme configurations for bio pages,
 * including color schemes, typography, and styling options.
 */

// Theme type definitions
export type ThemeName =
  | "minimal"
  | "dark"
  | "colorful"
  | "neon"
  | "gradient"
  | "pastel";
export type BackgroundType = "solid" | "gradient" | "image";
export type ButtonStyle = "rounded" | "square" | "pill";

/**
 * Complete theme configuration interface
 */
export interface BioPageTheme {
  name: ThemeName;
  primaryColor: string;
  backgroundColor: string;
  buttonColor: string;
  buttonTextColor: string;
  textColor: string;
  fontFamily: string;
  backgroundType: BackgroundType;
  backgroundImage?: string;
  backgroundGradient?: string;
  buttonStyle: ButtonStyle;
  buttonShadow: boolean;
}

/**
 * Predefined theme presets
 */
export const THEME_PRESETS: Record<ThemeName, BioPageTheme> = {
  minimal: {
    name: "minimal",
    primaryColor: "#000000",
    backgroundColor: "#FFFFFF",
    buttonColor: "#F5F5F5",
    buttonTextColor: "#000000",
    textColor: "#000000",
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
    backgroundType: "solid",
    buttonStyle: "rounded",
    buttonShadow: false,
  },

  dark: {
    name: "dark",
    primaryColor: "#3B82F6",
    backgroundColor: "#0F172A",
    buttonColor: "#1E293B",
    buttonTextColor: "#F1F5F9",
    textColor: "#F1F5F9",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    backgroundType: "solid",
    buttonStyle: "rounded",
    buttonShadow: true,
  },

  colorful: {
    name: "colorful",
    primaryColor: "#EC4899",
    backgroundColor: "#FBBF24",
    buttonColor: "#F59E0B",
    buttonTextColor: "#FFFFFF",
    textColor: "#1F2937",
    fontFamily: "Roboto, system-ui, sans-serif",
    backgroundType: "gradient",
    backgroundGradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    buttonStyle: "pill",
    buttonShadow: true,
  },

  neon: {
    name: "neon",
    primaryColor: "#06B6D4",
    backgroundColor: "#111827",
    buttonColor: "#14B8A6",
    buttonTextColor: "#000000",
    textColor: "#06B6D4",
    fontFamily: '"Courier New", monospace',
    backgroundType: "solid",
    buttonStyle: "square",
    buttonShadow: true,
  },

  gradient: {
    name: "gradient",
    primaryColor: "#A855F7",
    backgroundColor: "#000000",
    buttonColor: "#A855F7",
    buttonTextColor: "#FFFFFF",
    textColor: "#FFFFFF",
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
    backgroundType: "gradient",
    backgroundGradient: "linear-gradient(180deg, #7C3AED 0%, #EC4899 100%)",
    buttonStyle: "pill",
    buttonShadow: true,
  },

  pastel: {
    name: "pastel",
    primaryColor: "#FB7185",
    backgroundColor: "#FDF2F8",
    buttonColor: "#FBCFE8",
    buttonTextColor: "#831843",
    textColor: "#831843",
    fontFamily: '"Georgia", serif',
    backgroundType: "gradient",
    backgroundGradient: "linear-gradient(135deg, #FDF2F8 0%, #E0F2FE 100%)",
    buttonStyle: "rounded",
    buttonShadow: false,
  },
};

/**
 * Get a theme preset by name
 * @param name - The theme name
 * @returns The theme configuration
 */
export function getThemePreset(name: ThemeName): BioPageTheme {
  return THEME_PRESETS[name];
}

/**
 * Default theme (minimal)
 */
export const DEFAULT_THEME: BioPageTheme = THEME_PRESETS.minimal;

/**
 * Array of all available theme names for iteration
 */
export const THEME_NAMES: ThemeName[] = [
  "minimal",
  "dark",
  "colorful",
  "neon",
  "gradient",
  "pastel",
];

/**
 * Validate if a theme name is valid
 * @param name - The theme name to validate
 * @returns True if valid, false otherwise
 */
export function isValidThemeName(name: string): name is ThemeName {
  return THEME_NAMES.includes(name as ThemeName);
}

/**
 * Get theme display metadata for UI
 */
export const THEME_METADATA: Record<
  ThemeName,
  { label: string; description: string }
> = {
  minimal: {
    label: "Minimal",
    description: "Clean white background with subtle elements",
  },
  dark: {
    label: "Dark",
    description: "Dark mode with blue accents",
  },
  colorful: {
    label: "Colorful",
    description: "Vibrant gradient with bold colors",
  },
  neon: {
    label: "Neon",
    description: "Cyberpunk-inspired with neon cyan accents",
  },
  gradient: {
    label: "Gradient",
    description: "Purple to pink gradient background",
  },
  pastel: {
    label: "Pastel",
    description: "Soft pastel pink and blue tones",
  },
};

/**
 * Apply theme to CSS variables (for runtime theme switching)
 * @param theme - The theme to apply
 */
export function applyThemeToDOM(theme: BioPageTheme): void {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  root.style.setProperty("--theme-primary", theme.primaryColor);
  root.style.setProperty("--theme-background", theme.backgroundColor);
  root.style.setProperty("--theme-button", theme.buttonColor);
  root.style.setProperty("--theme-button-text", theme.buttonTextColor);
  root.style.setProperty("--theme-text", theme.textColor);
  root.style.setProperty("--theme-font", theme.fontFamily);

  if (theme.backgroundType === "gradient" && theme.backgroundGradient) {
    root.style.setProperty(
      "--theme-background-gradient",
      theme.backgroundGradient,
    );
  }

  if (theme.backgroundType === "image" && theme.backgroundImage) {
    root.style.setProperty(
      "--theme-background-image",
      `url(${theme.backgroundImage})`,
    );
  }
}

/**
 * Get CSS class names for button style
 * @param buttonStyle - The button style
 * @returns TailwindCSS class names
 */
export function getButtonStyleClasses(buttonStyle: ButtonStyle): string {
  switch (buttonStyle) {
    case "rounded":
      return "rounded-lg";
    case "square":
      return "rounded-none";
    case "pill":
      return "rounded-full";
    default:
      return "rounded-lg";
  }
}

/**
 * Get CSS class names for button shadow
 * @param hasShadow - Whether button should have shadow
 * @returns TailwindCSS class names
 */
export function getButtonShadowClasses(hasShadow: boolean): string {
  return hasShadow ? "shadow-lg hover:shadow-xl" : "";
}

/**
 * Font family options for bio page customization
 */
export type FontName =
  | "inter"
  | "poppins"
  | "playfair"
  | "jetbrains"
  | "roboto"
  | "opensans";

export interface FontOption {
  name: FontName;
  label: string;
  family: string;
  description: string;
  category: "sans-serif" | "serif" | "monospace";
  googleFont?: string; // Google Fonts URL parameter
}

/**
 * Available font presets
 */
export const FONT_PRESETS: Record<FontName, FontOption> = {
  inter: {
    name: "inter",
    label: "Inter",
    family: "Inter, system-ui, -apple-system, sans-serif",
    description: "Clean and modern",
    category: "sans-serif",
    googleFont: "Inter:wght@400;500;600;700",
  },
  poppins: {
    name: "poppins",
    label: "Poppins",
    family: "Poppins, system-ui, sans-serif",
    description: "Friendly and approachable",
    category: "sans-serif",
    googleFont: "Poppins:wght@400;500;600;700",
  },
  playfair: {
    name: "playfair",
    label: "Playfair Display",
    family: '"Playfair Display", Georgia, serif',
    description: "Elegant and sophisticated",
    category: "serif",
    googleFont: "Playfair+Display:wght@400;500;600;700",
  },
  jetbrains: {
    name: "jetbrains",
    label: "JetBrains Mono",
    family: '"JetBrains Mono", monospace',
    description: "Technical and precise",
    category: "monospace",
    googleFont: "JetBrains+Mono:wght@400;500;600;700",
  },
  roboto: {
    name: "roboto",
    label: "Roboto",
    family: "Roboto, system-ui, sans-serif",
    description: "Simple and versatile",
    category: "sans-serif",
    googleFont: "Roboto:wght@400;500;700",
  },
  opensans: {
    name: "opensans",
    label: "Open Sans",
    family: '"Open Sans", system-ui, sans-serif',
    description: "Readable and neutral",
    category: "sans-serif",
    googleFont: "Open+Sans:wght@400;500;600;700",
  },
};

/**
 * Array of all font names for iteration
 */
export const FONT_NAMES: FontName[] = [
  "inter",
  "poppins",
  "playfair",
  "jetbrains",
  "roboto",
  "opensans",
];

/**
 * Get font option by name
 */
export function getFontPreset(name: FontName): FontOption {
  return FONT_PRESETS[name];
}

/**
 * Get Google Fonts URL for loading fonts
 */
export function getGoogleFontsUrl(fonts: FontName[]): string {
  const families = fonts
    .map((name) => FONT_PRESETS[name].googleFont)
    .filter(Boolean)
    .join("&family=");
  return `https://fonts.googleapis.com/css2?family=${families}&display=swap`;
}
