/**
 * Dashboard home page - landing page after login.
 */

'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Users, Calendar, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();

  const stats = [
    { label: 'Total Patients', value: '0', icon: Users, color: 'text-blue-600' },
    { label: 'Clinical Notes', value: '0', icon: FileText, color: 'text-purple-600' },
    { label: 'This Month', value: '0', icon: Calendar, color: 'text-green-600' },
    { label: 'Progress', value: '0%', icon: TrendingUp, color: 'text-orange-600' },
  ];

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome back, {user?.full_name || 'User'}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Here's an overview of your clinical practice
        </p>
      </div>

      {/* Stats Grid */}
      <Card className="bg-gradient-to-r from-blue-600/5 to-purple-600/5">
        <CardHeader>
          <CardTitle>Quick look</CardTitle>
          <CardDescription>See overall stats for your practice</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {stat.label}
                    </CardTitle>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stat.value}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-r from-blue-600/5 to-purple-600/5">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/patients/new" className="block">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                <div>
                  <h3 className="font-medium">Add New Patient</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Start managing a new patient
                  </p>
                </div>
                <Button size="sm">+ Add</Button>
              </div>
            </Link>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg opacity-50">
              <div>
                <h3 className="font-medium">Create Clinical Note</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Document a session (coming soon)
                </p>
              </div>
              <Button size="sm" disabled>+ Create</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No recent activity</p>
              <p className="text-sm mt-1">Your activity will appear here</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div >
  );
}
