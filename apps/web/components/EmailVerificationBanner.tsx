"use client";

import { useState } from "react";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription, Button } from "@pingtome/ui";
import { Mail, X } from "lucide-react";

export function EmailVerificationBanner() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [dismissed, setDismissed] = useState(false);

  // Don't show if email is verified or banner is dismissed
  if (!user || user.emailVerified || dismissed) {
    return null;
  }

  const handleResend = async () => {
    setIsLoading(true);
    try {
      await apiRequest("/auth/resend-verification", { method: "POST" });
      setMessage("Verification email sent! Check your inbox.");
    } catch (error: any) {
      setMessage(error.response?.data?.message || "Failed to send email");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Alert className="mb-4 border-amber-500 bg-amber-50">
      <Mail className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between flex-1">
        <span>
          {message || "Please verify your email address to unlock all features."}
        </span>
        <div className="flex gap-2 ml-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResend}
            disabled={isLoading}
          >
            {isLoading ? "Sending..." : "Resend Email"}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDismissed(true)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
