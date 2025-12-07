"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@pingtome/ui";
import { Button } from "@pingtome/ui";
import { Badge } from "@pingtome/ui";
import { Check, TrendingUp, Zap } from "lucide-react";
import Link from "next/link";

interface UpgradePromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resourceType: "links" | "domains" | "members" | "api_calls";
  currentUsage: number;
  limit: number;
  currentPlan?: string;
}

const resourceLabels: Record<string, string> = {
  links: "Monthly links",
  domains: "Custom domains",
  members: "Team members",
  api_calls: "API calls",
};

const planFeatures = {
  pro: [
    "1,000 links per month",
    "5 custom domains",
    "Up to 10 team members",
    "10,000 API calls per month",
    "Advanced analytics (90 days)",
    "Priority support",
  ],
  enterprise: [
    "Unlimited links",
    "Unlimited custom domains",
    "Unlimited team members",
    "Unlimited API calls",
    "Analytics retention (2 years)",
    "SSO/SAML support",
    "Dedicated support",
    "SLA guarantee",
  ],
};

export function UpgradePrompt({
  open,
  onOpenChange,
  resourceType,
  currentUsage,
  limit,
  currentPlan = "free",
}: UpgradePromptProps) {
  const resourceLabel = resourceLabels[resourceType] || resourceType;
  const nextPlan = currentPlan === "free" ? "pro" : "enterprise";
  const features = planFeatures[nextPlan as keyof typeof planFeatures] || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-full bg-yellow-100">
              <Zap className="h-5 w-5 text-yellow-600" />
            </div>
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
              Limit Reached
            </Badge>
          </div>
          <DialogTitle className="text-xl">
            Upgrade to continue
          </DialogTitle>
          <DialogDescription className="text-base">
            You&apos;ve reached your {resourceLabel.toLowerCase()} limit ({currentUsage}/{limit}).
            Upgrade to {nextPlan.charAt(0).toUpperCase() + nextPlan.slice(1)} to unlock more.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-4">
          <div className="p-4 rounded-lg bg-muted/50">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              {nextPlan.charAt(0).toUpperCase() + nextPlan.slice(1)} Plan includes:
            </h4>
            <ul className="space-y-2">
              {features.slice(0, 5).map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Maybe later
          </Button>
          <Button asChild>
            <Link href="/pricing">
              Upgrade Now
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
