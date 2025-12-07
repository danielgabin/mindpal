/**
 * Home page - redirects to dashboard if authenticated, otherwise shows landing page.
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileText, Brain, Shield } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated()) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center space-y-8">
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
              <span className="text-4xl font-bold text-white">M</span>
            </div>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white">
            Welcome to <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">MindPal</span>
          </h1>

          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Professional clinical notes management with AI-powered features for psychologists
          </p>

          <div className="flex justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Get Started
              </Button>
            </Link>
            <Link href="/signin">
              <Button size="lg" variant="outline">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
          <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 mb-4">
              <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Clinical Notes</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Organize and manage all your patient notes in one secure place
            </p>
          </div>

          <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900 mb-4">
              <Brain className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">AI-Powered</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Enhance your notes with intelligent suggestions and insights
            </p>
          </div>

          <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 mb-4">
              <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Secure & Private</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Your patient data is encrypted and protected with industry-standard security
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
