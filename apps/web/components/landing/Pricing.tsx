import Link from "next/link";
import { Button } from "@pingtome/ui";
import { Check } from "lucide-react";
import { PRICING_PLANS } from "../../config/pricing";

export function Pricing() {
  return (
    <section id="pricing" className="section-padding bg-white">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
          <div className="inline-block rounded-full bg-blue-100 px-4 py-1.5 text-sm font-medium text-blue-700">
            Pricing
          </div>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            Simple, transparent pricing
          </h2>
          <p className="max-w-[600px] text-muted-foreground md:text-lg">
            Choose the plan that&apos;s right for you. No hidden fees, cancel
            anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 max-w-6xl mx-auto">
          {PRICING_PLANS.map((plan) => (
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
                  Most Popular
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
          All plans include 24/7 support and a 14-day money-back guarantee.
        </p>
      </div>
    </section>
  );
}
