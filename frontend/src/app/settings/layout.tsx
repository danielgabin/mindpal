/**
 * Settings layout - uses the reusable AuthenticatedLayout to show sidebar.
 */

import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
