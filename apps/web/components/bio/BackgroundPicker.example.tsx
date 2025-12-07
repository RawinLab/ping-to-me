/**
 * Example usage of BackgroundPicker component
 *
 * This file demonstrates how to integrate the BackgroundPicker
 * into a bio page editor or settings form.
 */

"use client";

import { useState } from "react";
import { BackgroundPicker } from "./BackgroundPicker";
import { Card, CardContent, CardHeader, CardTitle } from "@pingtome/ui";

export function BackgroundPickerExample() {
  const [backgroundType, setBackgroundType] = useState<
    "solid" | "gradient" | "image"
  >("solid");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [backgroundGradient, setBackgroundGradient] = useState(
    "linear-gradient(to bottom, #667eea, #764ba2)"
  );
  const [backgroundImage, setBackgroundImage] = useState("");

  const handleBackgroundChange = (updates: {
    backgroundType: "solid" | "gradient" | "image";
    backgroundColor?: string;
    backgroundGradient?: string;
    backgroundImage?: string;
  }) => {
    setBackgroundType(updates.backgroundType);

    if (updates.backgroundColor !== undefined) {
      setBackgroundColor(updates.backgroundColor);
    }
    if (updates.backgroundGradient !== undefined) {
      setBackgroundGradient(updates.backgroundGradient);
    }
    if (updates.backgroundImage !== undefined) {
      setBackgroundImage(updates.backgroundImage);
    }
  };

  // Generate the final background style
  const getBackgroundStyle = () => {
    switch (backgroundType) {
      case "solid":
        return { backgroundColor };
      case "gradient":
        return { background: backgroundGradient };
      case "image":
        return {
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        };
      default:
        return {};
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Configuration Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Background Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <BackgroundPicker
            backgroundType={backgroundType}
            backgroundColor={backgroundColor}
            backgroundGradient={backgroundGradient}
            backgroundImage={backgroundImage}
            onChange={handleBackgroundChange}
          />
        </CardContent>
      </Card>

      {/* Full Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Full Page Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="flex h-96 items-center justify-center rounded-md border p-8"
            style={getBackgroundStyle()}
          >
            <div className="rounded-lg bg-white p-6 shadow-lg">
              <h2 className="text-2xl font-bold">Bio Page Preview</h2>
              <p className="mt-2 text-gray-600">
                This is how your background will look
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Configuration Display */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Current Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 font-mono text-sm">
            <div>
              <span className="font-semibold">Type:</span> {backgroundType}
            </div>
            {backgroundType === "solid" && (
              <div>
                <span className="font-semibold">Color:</span> {backgroundColor}
              </div>
            )}
            {backgroundType === "gradient" && (
              <div>
                <span className="font-semibold">Gradient:</span>{" "}
                {backgroundGradient}
              </div>
            )}
            {backgroundType === "image" && (
              <div>
                <span className="font-semibold">Image URL:</span>{" "}
                {backgroundImage || "(none)"}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Integration with form state (React Hook Form example)
 */
export function BackgroundPickerFormExample() {
  // In a real implementation, you would use react-hook-form
  // const form = useForm({
  //   defaultValues: {
  //     backgroundType: 'solid',
  //     backgroundColor: '#ffffff',
  //     backgroundGradient: 'linear-gradient(to bottom, #667eea, #764ba2)',
  //     backgroundImage: '',
  //   },
  // });

  // const handleChange = (updates: any) => {
  //   Object.entries(updates).forEach(([key, value]) => {
  //     form.setValue(key, value);
  //   });
  // };

  return (
    <div>
      {/* Example with form integration */}
      {/* <BackgroundPicker
        backgroundType={form.watch('backgroundType')}
        backgroundColor={form.watch('backgroundColor')}
        backgroundGradient={form.watch('backgroundGradient')}
        backgroundImage={form.watch('backgroundImage')}
        onChange={handleChange}
      /> */}
    </div>
  );
}
