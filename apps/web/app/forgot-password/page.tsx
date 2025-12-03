import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { AuthSidebar } from "@/components/auth/AuthSidebar";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Password - PingTO.Me",
  description: "Reset your password.",
};

export default function ForgotPasswordPage() {
  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <AuthSidebar
        variant="security"
        title="Forgot Your Password?"
        description="No worries! We will send you a secure link to reset your password."
      />
      <div className="flex items-center justify-center py-12 lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight">
              Reset your password
            </h1>
            <p className="text-muted-foreground">
              Enter your email address and we will send you a reset link
            </p>
          </div>
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}
