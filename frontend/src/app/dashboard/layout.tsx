/**
 * Dashboard layout - uses the reusable AuthenticatedLayout.
 */

import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
