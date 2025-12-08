import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

export default function NotesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
