"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Badge,
} from "@pingtome/ui";
import { Check } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  displayName: string;
  limits: {
    linksPerMonth: number; // -1 = unlimited
    customDomains: number;
    teamMembers: number;
    apiCallsPerMonth: number;
    analyticsRetentionDays: number;
  };
  pricing: {
    monthly: number;
    yearly: number;
    yearlySavings: number;
  };
  features: string[];
  stripePriceIds: {
    monthly: string | null;
    yearly: string | null;
  };
}

export default function PricingPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<string>("free");
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch plans from public endpoint (no auth required)
      const plansRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/plans`).then(res => res.json());
      setPlans(plansRes);

      // Try to fetch current subscription (requires auth, may fail if not logged in)
      try {
        const subRes = await apiRequest("/payments/subscription");
        setCurrentPlan(subRes.plan);
      } catch {
        // User not logged in or no subscription, default to free
        setCurrentPlan("free");
      }
    } catch (error) {
      console.error("Failed to fetch pricing data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatLimit = (value: number): string => {
    return value === -1 ? 'Unlimited' : value.toLocaleString();
  };

  const handleUpgrade = async (plan: Plan) => {
    const priceId = billingInterval === "monthly"
      ? plan.stripePriceIds.monthly
      : plan.stripePriceIds.yearly;

    if (!priceId) return;

    setCheckoutLoading(plan.id);
    try {
      const res = await apiRequest("/payments/checkout", {
        method: "POST",
        body: JSON.stringify({
          priceId: priceId,
          successUrl: `${window.location.origin}/dashboard/billing?success=true`,
          cancelUrl: `${window.location.origin}/pricing`,
        }),
      });

      if (res.url) {
        window.location.href = res.url;
      }
    } catch (error) {
      alert("Failed to start checkout");
    } finally {
      setCheckoutLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-muted-foreground">
            Choose the plan that fits your needs
          </p>

          {/* Billing Interval Toggle */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <Button
              variant={billingInterval === "monthly" ? "default" : "outline"}
              onClick={() => setBillingInterval("monthly")}
            >
              Monthly
            </Button>
            <Button
              variant={billingInterval === "yearly" ? "default" : "outline"}
              onClick={() => setBillingInterval("yearly")}
            >
              Yearly
              {plans.length > 0 && plans[0].pricing.yearlySavings > 0 && (
                <Badge className="ml-2" variant="secondary">
                  Save {plans[0].pricing.yearlySavings}%
                </Badge>
              )}
            </Button>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {plans.map((plan) => {
            const isCurrentPlan = plan.id === currentPlan;
            const isPro = plan.id === "pro";
            const currentPrice = billingInterval === "monthly"
              ? plan.pricing.monthly
              : plan.pricing.yearly;

            return (
              <Card
                key={plan.id}
                className={`relative ${isPro ? "border-primary shadow-lg scale-105" : ""}`}
              >
                {isPro && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                    Most Popular
                  </Badge>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.displayName}</CardTitle>
                  <CardDescription>
                    <span className="text-4xl font-bold text-foreground">
                      ${currentPrice}
                    </span>
                    <span className="text-muted-foreground">
                      /{billingInterval === "monthly" ? "month" : "year"}
                    </span>
                    {billingInterval === "yearly" && currentPrice > 0 && (
                      <div className="text-sm mt-1">
                        ${(currentPrice / 12).toFixed(2)}/month billed annually
                      </div>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  {isCurrentPlan ? (
                    <Button disabled className="w-full">
                      Current Plan
                    </Button>
                  ) : currentPrice === 0 ? (
                    <Button variant="outline" className="w-full" disabled>
                      Free Forever
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => handleUpgrade(plan)}
                      disabled={checkoutLoading === plan.id}
                    >
                      {checkoutLoading === plan.id ? "Loading..." : "Upgrade"}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>

        <div className="mt-12 text-center text-muted-foreground">
          <p>All plans include 14-day money-back guarantee</p>
          <p>
            Need a custom plan?{" "}
            <a
              href="mailto:support@pingto.me"
              className="text-primary hover:underline"
            >
              Contact us
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
