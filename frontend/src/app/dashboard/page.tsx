/**
 * Dashboard home page - landing page after login.
 */

'use client';

import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <h3 className="font-medium">Add New Patient</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Start managing a new patient
                </p>
              </div>
              <button className="text-blue-600 hover:text-blue-700 font-medium">
                + Add
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <h3 className="font-medium">Create Clinical Note</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Document a session
                </p>
              </div>
              <button className="text-blue-600 hover:text-blue-700 font-medium">
                + Create
              </button>
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
    </div>
  );
}
