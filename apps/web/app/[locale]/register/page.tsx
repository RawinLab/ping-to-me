import { RegisterForm } from "@/components/auth/RegisterForm";
import { AuthSidebar } from "@/components/auth/AuthSidebar";
import { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.register");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function RegisterPage() {
  const t = await getTranslations("auth.register");

  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <AuthSidebar
        title={t("sidebarTitle")}
        description={t("sidebarDescription")}
      />
      <div className="flex items-center justify-center py-12 lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight">
              {t("heading")}
            </h1>
            <p className="text-muted-foreground">
              {t("subheading")}
            </p>
          </div>
          <RegisterForm />
          <p className="px-8 text-center text-sm text-muted-foreground">
            {t.rich("agreeToTerms", {
              terms: () => (
                <Link
                  href="/terms"
                  className="underline underline-offset-4 hover:text-primary"
                >
                  {t("termsOfService")}
                </Link>
              ),
              privacy: () => (
                <Link
                  href="/privacy"
                  className="underline underline-offset-4 hover:text-primary"
                >
                  {t("privacyPolicy")}
                </Link>
              ),
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
