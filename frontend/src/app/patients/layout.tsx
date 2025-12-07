/**
 * Patients layout - uses the reusable AuthenticatedLayout to show sidebar.
 */

import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

export default function PatientsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
