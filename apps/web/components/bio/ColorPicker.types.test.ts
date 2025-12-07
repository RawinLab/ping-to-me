/**
 * Type tests for ColorPicker component
 * These tests verify type safety at compile time
 */

import { ColorPicker } from "./ColorPicker";
import type { ComponentProps } from "react";

// Extract props type
type ColorPickerProps = ComponentProps<typeof ColorPicker>;

// Test: value prop must be a string
const validValue: ColorPickerProps["value"] = "#FF5500";

// Test: onChange must accept a string and return void
const validOnChange: ColorPickerProps["onChange"] = (color: string): void => {
  console.log(color);
};

// Test: label is optional
const withLabel: ColorPickerProps = {
  value: "#FF5500",
  onChange: (color) => console.log(color),
  label: "Primary Color",
};

const withoutLabel: ColorPickerProps = {
  value: "#FF5500",
  onChange: (color) => console.log(color),
};

// Test: Valid usage examples
const usageExample1: ColorPickerProps = {
  value: "#3B82F6",
  onChange: (color: string) => {
    // color is inferred as string
    const uppercased = color.toUpperCase();
    console.log(uppercased);
  },
};

const usageExample2: ColorPickerProps = {
  value: "#000000",
  onChange: (newColor) => {
    // newColor is inferred as string
    if (newColor.startsWith("#")) {
      console.log("Valid hex color");
    }
  },
  label: "Text Color",
};

// Export types for external use
export type { ColorPickerProps };
