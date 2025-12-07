"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@pingtome/ui";
import { Button } from "@pingtome/ui";
import { Badge } from "@pingtome/ui";
import { AlertTriangle, ArrowDown } from "lucide-react";

interface OverLimitItem {
  resource: string;
  current: number;
  newLimit: number;
  excess: number;
}

interface DowngradeWarningProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newPlanName: string;
  overLimit: OverLimitItem[];
  onConfirm: () => void;
  onCancel: () => void;
}

const resourceLabels: Record<string, string> = {
  domains: "Custom domains",
  members: "Team members",
  links: "Links",
};

const resourceActions: Record<string, string> = {
  domains: "remove",
  members: "remove",
  links: "delete",
};

export function DowngradeWarning({
  open,
  onOpenChange,
  newPlanName,
  overLimit,
  onConfirm,
  onCancel,
}: DowngradeWarningProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-full bg-yellow-100">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            </div>
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
              Action Required
            </Badge>
          </div>
          <DialogTitle className="text-xl">
            Downgrade to {newPlanName}?
          </DialogTitle>
          <DialogDescription className="text-base">
            Your current usage exceeds the limits of the {newPlanName} plan.
            You&apos;ll need to reduce your usage before downgrading.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 my-4">
          {overLimit.map((item) => (
            <div
              key={item.resource}
              className="p-4 rounded-lg border border-yellow-200 bg-yellow-50"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-yellow-900">
                  {resourceLabels[item.resource] || item.resource}
                </span>
                <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                  {item.excess} over limit
                </Badge>
              </div>
              <p className="text-sm text-yellow-800">
                You have <strong>{item.current}</strong> {resourceLabels[item.resource]?.toLowerCase() || item.resource},
                but the {newPlanName} plan only allows <strong>{item.newLimit}</strong>.
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                Please {resourceActions[item.resource] || "remove"} {item.excess}{" "}
                {resourceLabels[item.resource]?.toLowerCase() || item.resource} to continue.
              </p>
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={overLimit.length > 0}
          >
            <ArrowDown className="h-4 w-4 mr-2" />
            Proceed Anyway
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
