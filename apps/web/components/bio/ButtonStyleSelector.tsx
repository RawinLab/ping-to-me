"use client";

import { useTranslations } from "next-intl";
import { Label, Switch, Card, CardContent } from "@pingtome/ui";
import { cn } from "@pingtome/ui";
import { Check, Layers, MousePointer2 } from "lucide-react";

type ButtonStyle = "rounded" | "square" | "pill";

interface ButtonStyleSelectorProps {
  buttonStyle: ButtonStyle;
  buttonShadow: boolean;
  onChange: (updates: {
    buttonStyle?: ButtonStyle;
    buttonShadow?: boolean;
  }) => void;
}

export function ButtonStyleSelector({
  buttonStyle,
  buttonShadow,
  onChange,
}: ButtonStyleSelectorProps) {
  const t = useTranslations("bio");
  const styles: {
    value: ButtonStyle;
    labelKey: string;
    roundedClass: string;
    gradientClass: string;
  }[] = [
    {
      value: "rounded",
      labelKey: "rounded",
      roundedClass: "rounded-md",
      gradientClass: "bg-gradient-to-r from-blue-500 to-purple-600",
    },
    {
      value: "square",
      labelKey: "square",
      roundedClass: "rounded-none",
      gradientClass: "bg-gradient-to-r from-emerald-500 to-teal-600",
    },
    {
      value: "pill",
      labelKey: "pill",
      roundedClass: "rounded-full",
      gradientClass: "bg-gradient-to-r from-pink-500 to-rose-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <MousePointer2 className="h-4 w-4 text-primary" />
          <h3 className="text-base font-semibold text-gray-900">
            {t("buttonStyle")}
          </h3>
        </div>
        <p className="text-sm text-muted-foreground">
          {t("buttonStyleDescription")}
        </p>
      </div>

      {/* Style Options */}
      <div className="grid grid-cols-3 gap-4">
        {styles.map((style) => (
          <button
            key={style.value}
            type="button"
            onClick={() => onChange({ buttonStyle: style.value })}
            className={cn(
              "group relative flex flex-col items-center gap-3 p-4 border-2 transition-all duration-200",
              "hover:scale-[1.02] active:scale-[0.98]",
              style.roundedClass,
              buttonStyle === style.value
                ? "border-primary bg-primary/5 shadow-lg shadow-primary/20"
                : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md",
            )}
          >
            {/* Visual Preview Button */}
            <div
              className={cn(
                "w-full py-2.5 px-4 text-white text-sm font-medium transition-all duration-200",
                "group-hover:shadow-lg group-hover:scale-105",
                style.roundedClass,
                style.gradientClass,
                buttonShadow && "shadow-md",
              )}
            >
              {t("preview")}
            </div>

            {/* Label */}
            <span
              className={cn(
                "text-sm font-semibold transition-colors",
                buttonStyle === style.value
                  ? "text-primary"
                  : "text-gray-700 group-hover:text-gray-900",
              )}
            >
              {t(style.labelKey)}
            </span>

            {/* Selected Indicator - Animated Checkmark */}
            {buttonStyle === style.value && (
              <div className="absolute top-2 right-2 flex items-center justify-center h-5 w-5 rounded-full bg-primary shadow-sm animate-in zoom-in-50 duration-200">
                <Check className="h-3 w-3 text-white" strokeWidth={3} />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Shadow Toggle */}
      <Card
        className={cn(
          "transition-all duration-200 hover:shadow-md",
          buttonShadow && "border-primary/20 bg-primary/5",
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  buttonShadow
                    ? "bg-primary/10 text-primary"
                    : "bg-gray-100 text-gray-600",
                )}
              >
                <Layers className="h-4 w-4" />
              </div>
              <div className="space-y-1 flex-1">
                <Label
                  htmlFor="button-shadow"
                  className="text-sm font-semibold cursor-pointer text-gray-900"
                >
                  {t("buttonShadow")}
                </Label>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t("addDepthWithShadow")}
                </p>
              </div>
            </div>
            <Switch
              id="button-shadow"
              checked={buttonShadow}
              onCheckedChange={(checked) => onChange({ buttonShadow: checked })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
