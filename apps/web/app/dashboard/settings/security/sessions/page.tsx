"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SessionsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to security page with sessions tab
    router.replace("/dashboard/settings/security?tab=sessions");
  }, [router]);

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <p className="text-slate-500">Redirecting to security settings...</p>
      </div>
    </div>
  );
}
