/**
 * ThemeSelector Usage Example
 *
 * This file demonstrates how to use the ThemeSelector component
 * in a Bio Page editor or settings form.
 */

"use client";

import { useState } from "react";
import { ThemeSelector } from "./ThemeSelector";
import { getThemePreset } from "@/lib/biopage-themes";
import type { ThemeName } from "@/lib/biopage-themes";

export function BioPageThemeEditor() {
  const [selectedTheme, setSelectedTheme] = useState<string>("minimal");

  const handleThemeChange = (themeName: string) => {
    setSelectedTheme(themeName);

    // Get the full theme object if needed
    const themeConfig = getThemePreset(themeName as ThemeName);
    console.log("Selected theme:", themeConfig);

    // You can now save this to your bio page settings
    // Example: updateBioPage({ theme: themeConfig });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Choose a Theme</h2>
        <p className="text-sm text-gray-600 mb-4">
          Select a theme for your bio page. The preview shows how your buttons
          will look.
        </p>
      </div>

      <ThemeSelector value={selectedTheme} onChange={handleThemeChange} />

      {/* Preview section - optional */}
      <div className="mt-8 p-4 border rounded-lg bg-gray-50">
        <h3 className="font-medium mb-2">Current Selection:</h3>
        <p className="text-sm text-gray-600">
          Theme: <span className="font-semibold">{selectedTheme}</span>
        </p>
      </div>
    </div>
  );
}

/**
 * Integration with BioPageBuilder
 *
 * To integrate ThemeSelector into the existing BioPageBuilder:
 *
 * 1. Import the component:
 *    import { ThemeSelector } from './ThemeSelector';
 *
 * 2. Add state for the theme:
 *    const [theme, setTheme] = useState<string>(existingPage?.theme?.name || 'minimal');
 *
 * 3. Add it to your form in the Theme section:
 *    <section className="bg-white p-6 rounded-lg shadow-sm border">
 *      <h2 className="text-lg font-semibold mb-4">Theme</h2>
 *      <ThemeSelector value={theme} onChange={setTheme} />
 *    </section>
 *
 * 4. Include it in your save payload:
 *    const themeConfig = getThemePreset(theme as ThemeName);
 *    const payload = {
 *      ...values,
 *      theme: themeConfig,
 *      // ... other fields
 *    };
 */
