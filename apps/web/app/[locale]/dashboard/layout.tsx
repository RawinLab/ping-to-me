import { setRequestLocale } from 'next-intl/server';
import DashboardLayoutClient from './DashboardLayoutClient';

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
