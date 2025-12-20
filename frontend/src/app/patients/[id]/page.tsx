'use client';

/**
 * Patient detail and edit page with tabs for information and entities.
 */

import { use, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePatient, useUpdatePatient, useDeletePatient, usePatientEntities, useAddPatientEntity, useDeletePatientEntity } from '@/hooks/use-patients';
import { useNotes, useCreateNote } from '@/hooks/use-notes';
import { useTemplates } from '@/hooks/use-templates';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Home, ArrowLeft, Archive, Plus, X, User, Activity, FileText } from 'lucide-react';
import type { EntityType } from '@/types/patient';
import type { Note } from '@/types/note';

const updateSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  date_of_birth: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  appointment_reason: z.string().optional(),
  tutor_name: z.string().optional(),
  tutor_phone: z.string().optional(),
  tutor_email: z.string().email().optional().or(z.literal('')),
  tutor_relationship: z.string().optional(),
});

type UpdateFormValues = z.infer<typeof updateSchema>;

export default function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { data: patient, isLoading } = usePatient(resolvedParams.id);
  const updatePatient = useUpdatePatient();
  const deletePatient = useDeletePatient();


  const form = useForm<UpdateFormValues>({
    resolver: zodResolver(updateSchema),
    values: patient ? {
      first_name: patient.first_name,
      last_name: patient.last_name,
      date_of_birth: patient.date_of_birth.split('T')[0],
      email: patient.email || '',
      phone: patient.phone || '',
      appointment_reason: patient.appointment_reason || '',
      tutor_name: patient.tutor_name || '',
      tutor_phone: patient.tutor_phone || '',
      tutor_email: patient.tutor_email || '',
      tutor_relationship: patient.tutor_relationship || '',
    } : undefined,
  });

  const onUpdate = (data: UpdateFormValues) => {
    updatePatient.mutate({ id: resolvedParams.id, data });
  };

  const onArchive = () => {
    if (confirm('Are you sure you want to archive this patient?')) {
      deletePatient.mutate(resolvedParams.id, {
        onSuccess: () => router.push('/patients'),
      });
    }
  };



  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!patient) {
    return <div className="p-8">Patient not found</div>;
  }



  return (
    <div className="flex flex-col h-full">
      <div className="border-b bg-white dark:bg-gray-900 px-8 py-6">
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard"><Home className="h-4 w-4" /></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/patients">Patients</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{patient.full_name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">{patient.full_name}</h1>
                {patient.is_minor && <Badge>Minor</Badge>}
              </div>
            </div>
          </div>
          <Button variant="destructive" onClick={onArchive}>
            <Archive className="h-4 w-4 mr-2" />
            Archive
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">
          <Tabs defaultValue="notes" className="space-y-6">

            <TabsList className="w-full flex border rounded-lg bg-white p-1 h-auto">
              {[
                { value: 'details', label: 'Details', icon: User },
                { value: 'entities', label: 'Entities', icon: Activity },
                { value: 'notes', label: 'Notes', icon: FileText },
              ].map((tab, index, arr) => (
                <div key={tab.value} className="flex-1 flex items-center">
                  <TabsTrigger
                    value={tab.value}
                    className="relative h-10 w-full rounded-md border-0 bg-transparent px-4 font-semibold text-muted-foreground shadow-none 
                    data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600/10 data-[state=active]:to-purple-600/10 
                    data-[state=active]:text-foreground data-[state=active]:shadow-none 
                    hover:text-foreground hover:bg-transparent transition-colors"
                  >
                    <tab.icon className="mr-2 h-4 w-4" />
                    {tab.label}
                  </TabsTrigger>
                </div>
              ))}
            </TabsList>

            <TabsContent value="details">
              <Card>
                <CardHeader>
                  <CardTitle>Patient Information</CardTitle>
                  <CardDescription>Update patient details</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onUpdate)} className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="first_name" render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="last_name" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>

                      <FormField control={form.control} name="date_of_birth" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of Birth</FormLabel>
                          <FormControl><Input type="date" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="email" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl><Input type="email" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="phone" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>

                      <FormField control={form.control} name="appointment_reason" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Appointment Reason</FormLabel>
                          <FormControl><Textarea {...field} rows={3} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      {patient.is_minor && (
                        <div className="space-y-4 p-4 border rounded-lg">
                          <h3 className="font-semibold text-sm">Tutor Information</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="tutor_name" render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tutor Name</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                            <FormField control={form.control} name="tutor_phone" render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tutor Phone</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                            <FormField control={form.control} name="tutor_email" render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tutor Email</FormLabel>
                                <FormControl><Input type="email" {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                            <FormField control={form.control} name="tutor_relationship" render={({ field }) => (
                              <FormItem>
                                <FormLabel>Relationship</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                          </div>
                        </div>
                      )}

                      <Button type="submit" disabled={updatePatient.isPending}>
                        {updatePatient.isPending ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="entities" className="space-y-4">
              <EntitiesTab patientId={resolvedParams.id} patientName={patient.full_name} />
            </TabsContent>

            <TabsContent value="notes" className="space-y-4">
              <NotesTab patientId={resolvedParams.id} patientName={patient.full_name} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function EntitiesTab({ patientId, patientName }: { patientId: string; patientName: string }) {
  const { data: entities } = usePatientEntities(patientId);
  const addEntity = useAddPatientEntity();
  const deleteEntity = useDeletePatientEntity();
  const [entityDialogOpen, setEntityDialogOpen] = useState(false);
  const [entityType, setEntityType] = useState<EntityType>('symptom');
  const [entityValue, setEntityValue] = useState('');

  const onAddEntity = () => {
    if (!entityValue.trim()) return;
    addEntity.mutate(
      { patientId, data: { type: entityType, value: entityValue } },
      {
        onSuccess: () => {
          setEntityValue('');
          setEntityDialogOpen(false);
        },
      }
    );
  };

  const entityConfig = [
    {
      type: 'symptom' as EntityType,
      title: 'Symptoms',
    },
    {
      type: 'medication' as EntityType,
      title: 'Medications',
    },
    {
      type: 'feeling' as EntityType,
      title: 'Feelings',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Clinical Entities</CardTitle>
            <CardDescription>Manage symptoms, medications and feelings for {patientName}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {entityConfig.map((config) => {
            const items = entities?.filter(e => e.type === config.type) || [];
            return (
              <Card
                key={config.type}
                className="group hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/20 h-full flex flex-col"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">{config.title}</CardTitle>
                    <Dialog open={entityDialogOpen && entityType === config.type} onOpenChange={(open) => {
                      setEntityDialogOpen(open);
                      if (open) setEntityType(config.type);
                    }}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="h-8">
                          <Plus className="h-3 w-3 mr-1" /> Add
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add {config.title.slice(0, -1)}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <Input
                            placeholder={`Enter ${config.title.toLowerCase().slice(0, -1)}`}
                            value={entityValue}
                            onChange={(e) => setEntityValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && onAddEntity()}
                          />
                          <div className="flex gap-2">
                            <Button onClick={onAddEntity} disabled={!entityValue.trim()}>Add</Button>
                            <Button variant="outline" onClick={() => setEntityDialogOpen(false)}>Cancel</Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center opacity-50">
                      <p className="text-xs">No {config.title.toLowerCase()} recorded</p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {items.map((entity) => (
                        <Badge
                          key={entity.id}
                          variant="secondary"
                          className="bg-secondary/50 hover:bg-secondary/70 gap-1 pl-2.5 pr-1.5 py-1"
                        >
                          {entity.value}
                          <button
                            onClick={() => deleteEntity.mutate({ patientId, entityId: entity.id })}
                            className="ml-1 hover:text-red-500 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Notes Tab Component
function NotesTab({ patientId, patientName }: { patientId: string; patientName: string }) {
  const router = useRouter();
  const [kindFilter, setKindFilter] = useState<'all' | 'conceptualization' | 'followup' | 'split'>('all');
  const { data: notes, isLoading } = useNotes(patientId, kindFilter === 'all' ? undefined : kindFilter);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const searchParams = useSearchParams();
  const templateIdParam = searchParams.get('template');

  // Auto-open dialog if template param is present and not yet opened
  useEffect(() => {
    if (templateIdParam && !createDialogOpen) {
      setCreateDialogOpen(true);
    }
  }, [templateIdParam]);


  const getBadgeColor = (kind: string) => {
    switch (kind) {
      case 'conceptualization':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300 hover:bg-indigo-200';
      case 'followup':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300 hover:bg-emerald-200';
      case 'split':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300 hover:bg-amber-200';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Clinical Notes</CardTitle>
              <CardDescription>View and manage notes for {patientName}</CardDescription>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" />New Note</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Note</DialogTitle>
                </DialogHeader>
                <NewNoteForm
                  patientId={patientId}
                  onSuccess={(noteId) => {
                    setCreateDialogOpen(false);
                    router.push(`/notes/${noteId}`);
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex gap-2">
            <Button variant={kindFilter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setKindFilter('all')}>All</Button>
            <Button variant={kindFilter === 'conceptualization' ? 'default' : 'outline'} size="sm" onClick={() => setKindFilter('conceptualization')}>Conceptualization</Button>
            <Button variant={kindFilter === 'followup' ? 'default' : 'outline'} size="sm" onClick={() => setKindFilter('followup')}>Follow-up</Button>
            <Button variant={kindFilter === 'split' ? 'default' : 'outline'} size="sm" onClick={() => setKindFilter('split')}>Split Files</Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-[220px] w-full rounded-xl" />)}
            </div>
          ) : !notes || notes.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-xl">
              <p className="text-muted-foreground mb-4">No notes found</p>
              <Button onClick={() => setCreateDialogOpen(true)}>Create your first note</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {notes.map((note) => (
                <Card
                  key={note.id}
                  onClick={() => router.push(`/notes/${note.id}`)}
                  className="group cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/20 flex flex-col h-full min-h-[220px]"
                >
                  <CardHeader className="pb-3 space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <Badge className={`${getBadgeColor(note.kind)} border-none capitalize px-2.5 py-0.5 pointer-events-none`}>
                        {note.kind}
                      </Badge>
                      <div className="text-xs text-white whitespace-nowrap font-medium px-2 py-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-md">
                        v{note.version_count}
                      </div>
                    </div>
                    <CardTitle className="text-xl font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2">
                      {note.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-end gap-2 text-sm text-muted-foreground pt-0">
                    <div className="w-full h-px bg-border/50 my-2" />
                    <div className="flex justify-between items-center text-xs">
                      <span>Created</span>
                      <span className="font-medium text-foreground">{new Date(note.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span>Last updated</span>
                      <span className="font-medium text-foreground">{new Date(note.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

// New Note Form Component
function NewNoteForm({ patientId, onSuccess }: { patientId: string; onSuccess: (noteId: string) => void }) {
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<'conceptualization' | 'followup'>('conceptualization');
  const createNote = useCreateNote();

  const searchParams = useSearchParams();
  const initialTemplateId = searchParams.get('template');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(initialTemplateId || '');

  const { data: templates } = useTemplates(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let content = '# ' + title + '\n\nStart writing your note here...';

    if (selectedTemplateId && templates) {
      const template = templates.find(t => t.id === selectedTemplateId);
      if (template) {
        content = template.content_markdown;
      }
    }

    createNote.mutate(
      {
        patient_id: patientId,
        title,
        kind,
        content_markdown: content,
      },
      {
        onSuccess: (data) => onSuccess(data.id),
      }
    );
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div>
        <label className="text-sm font-medium">Title</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title"
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium">Type</label>
        <Select value={kind} onValueChange={(v: any) => setKind(v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="conceptualization">Conceptualization</SelectItem>
            <SelectItem value="followup">Follow-up</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium">Template (Optional)</label>
        <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a template..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None (Blank Note)</SelectItem>
            {templates?.map((template) => (
              <SelectItem key={template.id} value={template.id}>
                {template.name} {template.is_default && '(Default)'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={createNote.isPending}>
          {createNote.isPending ? 'Creating...' : 'Create & Edit'}
        </Button>
      </div>
    </form>
  );
}
