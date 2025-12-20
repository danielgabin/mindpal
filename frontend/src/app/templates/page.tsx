'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';
import { useTemplates, useDeleteTemplate } from '@/hooks/use-templates';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { Skeleton } from '@/components/ui/skeleton';
import { TemplateCard } from '@/components/templates/template-card';
import { TemplateListSection } from '@/components/templates/template-list-section';


import {
  Plus,
  LayoutTemplate,
  Lock,
  Search,
  ExternalLink,
  Home
} from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { usePatients } from '@/hooks/use-patients';
import { useDebounce } from 'use-debounce';

export default function TemplatesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: templates, isLoading } = useTemplates(true);
  const deleteTemplate = useDeleteTemplate();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    await deleteTemplate.mutateAsync(id);
    setDeleteId(null);
  };

  // Use Template Flow
  const [useTemplateId, setUseTemplateId] = useState<string | null>(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [debouncedPatientSearch] = useDebounce(patientSearch, 300);
  const { data: patients, isLoading: isLoadingPatients } = usePatients(debouncedPatientSearch, true);

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[200px] w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const systemTemplates = templates?.filter(t => t.is_default) || [];
  const myTemplates = templates?.filter(t => !t.is_default) || [];

  const handleUseTemplate = (templateId: string) => {
    setUseTemplateId(templateId);
    setPatientSearch('');
  };

  const handleSelectPatient = (patientId: string) => {
    if (useTemplateId) {
      router.push(`/patients/${patientId}?template=${useTemplateId}`);
    }
  };

  return (
    <div className="flex flex-col h-full">
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
              <BreadcrumbPage>Templates</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
            <p className="text-muted-foreground mt-1">
              Manage your note templates
            </p>
          </div>
          <Button onClick={() => router.push('/templates/new')} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </div>
      </div>


      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto space-y-8">


          {/* System Templates */}
          <TemplateListSection
            title="System Templates"
            icon={<Lock className="h-4 w-4 text-muted-foreground" />}
            templates={systemTemplates}
            onUse={handleUseTemplate}
          />

          {/* My Templates */}
          <TemplateListSection
            title="My Templates"
            templates={myTemplates}
            onUse={handleUseTemplate}
            onDelete={handleDelete}
            emptyState={{
              title: "No custom templates",
              description: "Create your own templates to speed up your workflow.",
              action: (
                <Button variant="outline" onClick={() => router.push('/templates/new')}>
                  Create Template
                </Button>
              )
            }}
          />


        </div>
      </div>

      {/* Patient Selection Dialog */}
      <Dialog open={!!useTemplateId} onOpenChange={(open) => !open && setUseTemplateId(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Select Patient</DialogTitle>
            <DialogDescription>
              Choose a patient to create a new note for using this template.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search patients..."
                className="pl-9"
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
              />
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {isLoadingPatients ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : patients?.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No patients found.</p>
              ) : (
                patients?.map((patient) => (
                  <Button
                    key={patient.id}
                    variant="ghost"
                    className="w-full justify-between h-auto py-3 px-4 hover:bg-muted"
                    onClick={() => handleSelectPatient(patient.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                        {patient.first_name[0]}{patient.last_name[0]}
                      </div>
                      <div className="text-left">
                        <div className="font-medium">{patient.full_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {patient.is_minor ? 'Minor' : 'Adult'}
                        </div>
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </Button>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
