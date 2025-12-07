import { PricingPlan } from "../types/landing";

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "/month",
    description: "Perfect for getting started",
    features: [
      "Up to 50 links",
      "Basic analytics",
      "Standard QR codes",
      "1 Bio Page",
    ],
    cta: "Get Started",
  },
  {
    id: "pro",
    name: "Pro",
    price: "$12",
    period: "/month",
    description: "For power users and creators",
    features: [
      "Unlimited links",
      "Advanced analytics",
      "Custom QR codes",
      "Unlimited Bio Pages",
      "Custom domains",
      "Priority support",
    ],
    cta: "Upgrade to Pro",
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large teams and organizations",
    features: [
      "SSO & SAML",
      "Dedicated success manager",
      "SLA guarantee",
      "Custom contracts",
      "Audit logs",
      "Role-based access",
    ],
    cta: "Contact Sales",
  },
];
