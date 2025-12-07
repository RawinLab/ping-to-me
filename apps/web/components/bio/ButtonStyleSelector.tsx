"use client";

import { Label, Switch } from "@pingtome/ui";
import { cn } from "@pingtome/ui";

type ButtonStyle = "rounded" | "square" | "pill";

interface ButtonStyleSelectorProps {
  buttonStyle: ButtonStyle;
  buttonShadow: boolean;
  onChange: (updates: { buttonStyle?: ButtonStyle; buttonShadow?: boolean }) => void;
}

export function ButtonStyleSelector({
  buttonStyle,
  buttonShadow,
  onChange,
}: ButtonStyleSelectorProps) {
  const styles: { value: ButtonStyle; label: string; roundedClass: string }[] = [
    { value: "rounded", label: "Rounded", roundedClass: "rounded-md" },
    { value: "square", label: "Square", roundedClass: "rounded-none" },
    { value: "pill", label: "Pill", roundedClass: "rounded-full" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium mb-3 block">Button Style</Label>
        <div className="grid grid-cols-3 gap-3">
          {styles.map((style) => (
            <button
              key={style.value}
              type="button"
              onClick={() => onChange({ buttonStyle: style.value })}
              className={cn(
                "relative flex flex-col items-center gap-3 p-4 border-2 transition-all hover:border-gray-400",
                style.roundedClass,
                buttonStyle === style.value
                  ? "border-primary bg-primary/5"
                  : "border-gray-200 bg-white"
              )}
            >
              {/* Visual Preview Button */}
              <div
                className={cn(
                  "w-full py-2.5 px-4 bg-gray-900 text-white text-sm font-medium transition-shadow",
                  style.roundedClass,
                  buttonShadow && "shadow-md"
                )}
              >
                Preview
              </div>

              {/* Label */}
              <span
                className={cn(
                  "text-xs font-medium",
                  buttonStyle === style.value
                    ? "text-primary"
                    : "text-gray-600"
                )}
              >
                {style.label}
              </span>

              {/* Selected Indicator */}
              {buttonStyle === style.value && (
                <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Shadow Toggle */}
      <div className="flex items-center justify-between p-4 border rounded-md bg-gray-50">
        <div className="space-y-0.5">
          <Label htmlFor="button-shadow" className="text-sm font-medium cursor-pointer">
            Button Shadow
          </Label>
          <p className="text-xs text-muted-foreground">
            Add a subtle shadow effect to buttons
          </p>
        </div>
        <Switch
          id="button-shadow"
          checked={buttonShadow}
          onCheckedChange={(checked) => onChange({ buttonShadow: checked })}
        />
      </div>
    </div>
  );
}
