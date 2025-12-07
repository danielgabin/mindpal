/**
 * Protected route wrapper that redirects unauthenticated users.
 */

'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { Loader2 } from 'lucide-react';
import { useEffect, useRef } from 'react';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const authenticated = isAuthenticated();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Only redirect once if not authenticated
    if (!authenticated && !hasRedirected.current) {
      hasRedirected.current = true;
      router.push('/signin');
    }
  }, [authenticated, router]);

  // Show loader while not authenticated (during redirect)
  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // User is authenticated, show the content
  return <>{children}</>;
}
