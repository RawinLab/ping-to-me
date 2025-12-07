/**
 * Example usage of the ColorPicker component
 *
 * This file demonstrates how to use the ColorPicker in your bio page theme settings
 */

import { useState } from "react";
import { ColorPicker } from "./ColorPicker";

export function ColorPickerExample() {
  const [primaryColor, setPrimaryColor] = useState("#3B82F6");
  const [backgroundColor, setBackgroundColor] = useState("#FFFFFF");
  const [textColor, setTextColor] = useState("#000000");

  return (
    <div className="space-y-6 max-w-md">
      <h2 className="text-lg font-semibold">Theme Customization</h2>

      <ColorPicker
        label="Primary Color"
        value={primaryColor}
        onChange={setPrimaryColor}
      />

      <ColorPicker
        label="Background Color"
        value={backgroundColor}
        onChange={setBackgroundColor}
      />

      <ColorPicker
        label="Text Color"
        value={textColor}
        onChange={setTextColor}
      />

      {/* Preview */}
      <div className="mt-8 p-6 rounded-lg border" style={{ backgroundColor }}>
        <h3 className="text-xl font-bold mb-2" style={{ color: primaryColor }}>
          Preview
        </h3>
        <p style={{ color: textColor }}>
          This is how your bio page will look with these colors.
        </p>
      </div>
    </div>
  );
}

/**
 * Usage in a form:
 *
 * const [theme, setTheme] = useState({
 *   primaryColor: "#3B82F6",
 *   backgroundColor: "#FFFFFF",
 *   textColor: "#000000"
 * });
 *
 * <ColorPicker
 *   label="Primary Color"
 *   value={theme.primaryColor}
 *   onChange={(color) => setTheme({ ...theme, primaryColor: color })}
 * />
 */
