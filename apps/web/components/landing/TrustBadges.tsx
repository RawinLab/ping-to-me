import { Zap, Shield, Globe, BarChart3 } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function TrustBadges() {
  const t = await getTranslations("landing.trustBadges");

  const badges = [
    {
      icon: Zap,
      title: t("freeForever.title"),
      description: t("freeForever.description"),
    },
    {
      icon: Globe,
      title: t("customDomains.title"),
      description: t("customDomains.description"),
    },
    {
      icon: Shield,
      title: t("linkSafety.title"),
      description: t("linkSafety.description"),
    },
    {
      icon: BarChart3,
      title: t("richAnalytics.title"),
      description: t("richAnalytics.description"),
    },
  ];

  return (
    <section className="border-y bg-white">
      <div className="container px-4 md:px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {badges.map((badge) => (
            <div
              key={badge.title}
              className="flex items-center gap-3 justify-center md:justify-start"
            >
              <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <badge.icon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-sm">{badge.title}</p>
                <p className="text-xs text-muted-foreground">
                  {badge.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
