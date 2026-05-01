import Link from "next/link";
import { Button } from "@pingtome/ui";
import { Check } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function Pricing() {
  const t = await getTranslations("landing.pricing");

  const plans = [
    {
      id: "free",
      name: t("free.name"),
      price: t("free.price"),
      period: t("free.period"),
      description: t("free.description"),
      features: [
        t("free.feature1"),
        t("free.feature2"),
        t("free.feature3"),
        t("free.feature4"),
      ],
      cta: t("free.cta"),
    },
    {
      id: "pro",
      name: t("pro.name"),
      price: t("pro.price"),
      period: t("pro.period"),
      description: t("pro.description"),
      features: [
        t("pro.feature1"),
        t("pro.feature2"),
        t("pro.feature3"),
        t("pro.feature4"),
        t("pro.feature5"),
        t("pro.feature6"),
      ],
      cta: t("pro.cta"),
      popular: true,
    },
    {
      id: "enterprise",
      name: t("enterprise.name"),
      price: t("enterprise.price"),
      period: t("enterprise.period"),
      description: t("enterprise.description"),
      features: [
        t("enterprise.feature1"),
        t("enterprise.feature2"),
        t("enterprise.feature3"),
        t("enterprise.feature4"),
        t("enterprise.feature5"),
        t("enterprise.feature6"),
      ],
      cta: t("enterprise.cta"),
    },
  ];

  return (
    <section id="pricing" className="section-padding bg-white">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
          <div className="inline-block rounded-full bg-blue-100 px-4 py-1.5 text-sm font-medium text-blue-700">
            {t("badge")}
          </div>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            {t("heading")}
          </h2>
          <p className="max-w-[600px] text-muted-foreground md:text-lg">
            {t("description")}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col p-8 rounded-2xl border ${
                plan.popular
                  ? "border-blue-600 shadow-xl shadow-blue-100 scale-105"
                  : "border-slate-200 hover:border-blue-200"
              } bg-white transition-all`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full gradient-bg text-white text-sm font-medium">
                  {t("mostPopular")}
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <p className="text-muted-foreground text-sm">
                  {plan.description}
                </p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold">{plan.price}</span>
                {plan.period && (
                  <span className="text-muted-foreground">{plan.period}</span>
                )}
              </div>

              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <div className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                      <Check className="h-3 w-3 text-blue-600" />
                    </div>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link href="/register" className="mt-auto">
                <Button
                  className={`w-full h-12 font-semibold ${
                    plan.popular ? "gradient-bg" : ""
                  }`}
                  variant={plan.popular ? "default" : "outline"}
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-muted-foreground text-sm mt-12">
          {t("guarantee")}
        </p>
      </div>
    </section>
  );
}
