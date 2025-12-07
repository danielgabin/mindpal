'use client';

/**
 * Patients list page with search, filter, and actions.
 */

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePatients } from '@/hooks/use-patients';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Home, Plus, Search, Users, Archive, UserCheck } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';

export default function PatientsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  // Debounce search to avoid excessive API calls
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch patients with filters
  const { data: patients, isLoading } = usePatients(
    debouncedSearch || undefined,
    showArchived ? undefined : true // Show active by default
  );

  const activeCount = useMemo(
    () => patients?.filter((p) => p.is_active).length || 0,
    [patients]
  );

  const archivedCount = useMemo(
    () => patients?.filter((p) => !p.is_active).length || 0,
    [patients]
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header with Breadcrumbs */}
      <div className="border-b bg-white dark:bg-gray-900 px-8 py-6">
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">
                <Home className="h-4 w-4" />
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Patients</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Patients</h1>
            <p className="text-muted-foreground mt-1">
              Manage your patient records and information
            </p>
          </div>
          <Button onClick={() => router.push('/patients/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Patient
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Patients</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeCount}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Archived</CardTitle>
                <Archive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{archivedCount}</div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex-1 w-full sm:max-w-sm">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search patients..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={!showArchived ? 'default' : 'outline'}
                    onClick={() => setShowArchived(false)}
                    size="sm"
                  >
                    Active
                  </Button>
                  <Button
                    variant={showArchived ? 'default' : 'outline'}
                    onClick={() => setShowArchived(true)}
                    size="sm"
                  >
                    Archived
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : !patients || patients.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No patients found</h3>
                  <p className="text-muted-foreground mt-2">
                    {searchQuery
                      ? 'Try adjusting your search query'
                      : 'Get started by creating your first patient'}
                  </p>
                  {!searchQuery && (
                    <Button onClick={() => router.push('/patients/new')} className="mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      New Patient
                    </Button>
                  )}
                </div>
              ) : (
                <div className="divide-y">
                  {patients.map((patient) => (
                    <Link
                      key={patient.id}
                      href={`/patients/${patient.id}`}
                      className="flex items-center gap-4 py-4 hover:bg-accent rounded-lg px-4 -mx-4 transition-colors"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                        {patient.first_name[0]}
                        {patient.last_name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold truncate">{patient.full_name}</p>
                          {patient.is_minor && (
                            <Badge variant="secondary" className="text-xs">
                              Minor
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span>{patient.age} years old</span>
                          {patient.email && <span>{patient.email}</span>}
                          {patient.phone && <span>{patient.phone}</span>}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
