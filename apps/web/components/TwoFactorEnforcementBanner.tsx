"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { Card, CardContent, Button } from "@pingtome/ui";
import { Shield, X, AlertTriangle } from "lucide-react";

interface TwoFactorEnforcementBannerProps {
  className?: string;
}

export function TwoFactorEnforcementBanner({
  className = "",
}: TwoFactorEnforcementBannerProps) {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkEnforcement();
  }, []);

  const checkEnforcement = async () => {
    try {
      // Check if user's organization requires 2FA
      const orgResponse = await apiRequest("/organizations/current");
      if (!orgResponse || !orgResponse.settings) {
        setLoading(false);
        return;
      }

      const enforced2FA = orgResponse.settings.enforced2FA;

      // Check if user has 2FA enabled
      const twoFAStatus = await apiRequest("/auth/2fa/status");

      // Show banner if organization requires 2FA but user hasn't enabled it
      if (enforced2FA && !twoFAStatus.enabled) {
        // Check if banner was dismissed in this session
        const dismissed = sessionStorage.getItem("2fa-enforcement-dismissed");
        if (!dismissed) {
          setShow(true);
        }
      }
    } catch (error) {
      console.error("Failed to check 2FA enforcement", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    // Dismiss only for this session
    sessionStorage.setItem("2fa-enforcement-dismissed", "true");
    setShow(false);
  };

  if (loading || !show) {
    return null;
  }

  return (
    <Card
      className={`border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 shadow-lg ${className}`}
    >
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-amber-900 mb-1">
                  Two-Factor Authentication Required
                </h3>
                <p className="text-sm text-amber-700 mb-4">
                  Your organization requires all members to enable two-factor
                  authentication. Please set it up now to continue accessing
                  your account securely.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link href="/dashboard/settings/two-factor">
                    <Button
                      size="sm"
                      className="bg-amber-600 hover:bg-amber-700 text-white rounded-lg"
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      Set up 2FA now
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDismiss}
                    className="text-amber-700 hover:bg-amber-100 rounded-lg"
                  >
                    Dismiss for now
                  </Button>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="text-amber-600 hover:text-amber-800 p-1 rounded-lg hover:bg-amber-100 transition-colors flex-shrink-0"
                aria-label="Dismiss"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
