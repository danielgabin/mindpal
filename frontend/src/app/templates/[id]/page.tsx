'use client';

import { use, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useTemplate, useUpdateTemplate, useDeleteTemplate } from '@/hooks/use-templates';
import { usePatients } from '@/hooks/use-patients';
import { useDebounce } from 'use-debounce';
import { TemplateForm } from '@/components/templates/template-form';


import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Home, ArrowLeft, Edit, Trash2, FileText, Lock, Search, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';


// Dynamic import for Toast UI Viewer
const Viewer = dynamic(() => import('@toast-ui/react-editor').then(mod => mod.Viewer), { ssr: false });


export default function TemplateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { data: template, isLoading } = useTemplate(resolvedParams.id);
  const updateTemplate = useUpdateTemplate();
  const deleteTemplate = useDeleteTemplate();
  const searchParams = useSearchParams();

  const [isEditing, setIsEditing] = useState(false);
  const [showUseDialog, setShowUseDialog] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [debouncedPatientSearch] = useDebounce(patientSearch, 300);
  const { data: patients, isLoading: isLoadingPatients } = usePatients(debouncedPatientSearch, true);

  useEffect(() => {
    if (searchParams.get('mode') === 'edit') {
      setIsEditing(true);
    }
  }, [searchParams]);

  const handleSelectPatient = (patientId: string) => {
    router.push(`/patients/${patientId}?template=${resolvedParams.id}`);
  };


  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        {/* Header Skeleton */}
        <div className="border-b bg-white dark:bg-gray-900 px-8 py-6">
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
          </div>
        </div>
        {/* Content Skeleton */}
        <div className="flex-1 p-8">
          <Skeleton className="h-[500px] w-full max-w-7xl mx-auto rounded-xl" />
        </div>
      </div>
    );
  }

  if (!template) {
    return <div>Template not found</div>;
  }

  // Handle Update
  const handleSubmit = async (values: any) => {
    await updateTemplate.mutateAsync({ id: template.id, data: values });
    setIsEditing(false); // Return to view mode
    // router.refresh(); // Or invalidate query handled by react-query
  };

  // Handle Delete
  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this template?')) {
      await deleteTemplate.mutateAsync(template.id);
      router.push('/templates');
    }
  };


  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-white dark:bg-gray-900 px-8 py-6">
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard"><Home className="h-4 w-4" /></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/templates">Templates</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{template.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{isEditing ? `Edit: ${template.name}` : template.name}</h1>
              {template.is_default ? (
                <Badge variant="secondary" className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  <Lock className="h-3 w-3 mr-1" /> System Default
                </Badge>
              ) : (
                <Badge variant="outline">Custom Template</Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-1">
              {template.is_default
                ? "This is a system template and cannot be modified."
                : isEditing
                  ? "Make changes to your template below"
                  : "View details of your template"}
            </p>
          </div>
          <div className="flex gap-2">
            {!isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowUseDialog(true)}
                  className="bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary hover:text-primary"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Use Template
                </Button>

                {!template.is_default && (
                  <>
                    <Button variant="outline" onClick={() => setIsEditing(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="destructive" onClick={handleDelete}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </>
                )}
              </>
            ) : (
              <Button variant="ghost" onClick={() => setIsEditing(false)}>
                Cancel Edit
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">
          <Card className="border-none shadow-none bg-transparent">
            {!isEditing ? (
              // View Mode
              <CardContent className="px-0">
                <Card className="border p-6 min-h-[500px]">
                  <div className="prose dark:prose-invert max-w-none">
                    <Viewer initialValue={template.content_markdown} key={template.content_markdown} />
                  </div>
                </Card>
              </CardContent>
            ) : (
              // Edit Mode
              <CardContent className="px-0">
                <TemplateForm
                  initialData={template}
                  onSubmit={handleSubmit}
                  isSubmitting={updateTemplate.isPending}
                />
              </CardContent>
            )}
          </Card>
        </div>
      </div>
      {/* Patient Selection Dialog */}
      <Dialog open={showUseDialog} onOpenChange={setShowUseDialog}>
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



