import Link from "next/link";
import { Button } from "@pingtome/ui";
import { ArrowRight, Check } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function CTA() {
  const t = await getTranslations("landing.cta");

  const benefits = [
    t("benefit1"),
    t("benefit2"),
    t("benefit3"),
  ];

  return (
    <section className="section-padding bg-gradient-to-r from-blue-600 to-cyan-500">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-5xl">
            {t("heading")}
          </h2>
          <p className="max-w-[600px] text-blue-100 md:text-lg">
            {t("description")}
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/register">
              <Button
                size="lg"
                className="h-12 px-8 text-base font-semibold bg-white text-blue-600 hover:bg-blue-50"
              >
                {t("createAccount")}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                variant="outline"
                size="lg"
                className="h-12 px-8 text-base font-semibold border-white text-white hover:bg-white/10"
              >
                {t("talkToSales")}
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-6 pt-4">
            {benefits.map((benefit) => (
              <div
                key={benefit}
                className="flex items-center gap-2 text-blue-100"
              >
                <Check className="h-5 w-5" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
