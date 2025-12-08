/**
 * Reusable authenticated layout with sidebar.
 * Wrap any page with this component to get the sidebar and protected route.
 */

import { ProtectedRoute } from '@/components/auth/protected-route';
import { Sidebar } from '@/components/layout/sidebar';

export function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden" suppressHydrationWarning>
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0 hidden md:block" suppressHydrationWarning>
          <Sidebar />
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
