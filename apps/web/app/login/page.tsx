import { LoginForm } from "@/components/auth/LoginForm";
import { AuthSidebar } from "@/components/auth/AuthSidebar";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login - PingTO.Me",
  description: "Login to your account.",
};

export default function LoginPage() {
  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <AuthSidebar
        title="Welcome Back"
        description="Sign in to manage your links, track analytics, and grow your reach."
      />
      <div className="flex items-center justify-center py-12 lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight">
              Sign in to your account
            </h1>
            <p className="text-muted-foreground">
              Enter your credentials to access your dashboard
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
