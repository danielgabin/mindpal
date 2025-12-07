'use client';

/**
 * Patient detail and edit page with tabs for information and entities.
 */

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePatient, useUpdatePatient, useDeletePatient, usePatientEntities, useAddPatientEntity, useDeletePatientEntity } from '@/hooks/use-patients';
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
import { Home, ArrowLeft, Archive, Plus, X } from 'lucide-react';
import type { EntityType } from '@/types/patient';

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
  const { data: entities } = usePatientEntities(resolvedParams.id);
  const updatePatient = useUpdatePatient();
  const deletePatient = useDeletePatient();
  const addEntity = useAddPatientEntity();
  const deleteEntity = useDeletePatientEntity();

  const [entityDialogOpen, setEntityDialogOpen] = useState(false);
  const [entityType, setEntityType] = useState<EntityType>('symptom');
  const [entityValue, setEntityValue] = useState('');

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

  const onAddEntity = () => {
    if (!entityValue.trim()) return;
    addEntity.mutate(
      { patientId: resolvedParams.id, data: { type: entityType, value: entityValue } },
      {
        onSuccess: () => {
          setEntityValue('');
          setEntityDialogOpen(false);
        },
      }
    );
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

  const symptomEntities = entities?.filter(e => e.type === 'symptom') || [];
  const medicationEntities = entities?.filter(e => e.type === 'medication') || [];
  const feelingEntities = entities?.filter(e => e.type === 'feeling') || [];

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
                <h1 className="text-3xl font-bold tracking-tight">{patient.full_name}</h1>
                {patient.is_minor && <Badge>Minor</Badge>}
              </div>
              <p className="text-muted-foreground mt-1">{patient.age} years old</p>
            </div>
          </div>
          <Button variant="destructive" onClick={onArchive}>
            <Archive className="h-4 w-4 mr-2" />
            Archive
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-5xl mx-auto">
          <Tabs defaultValue="details" className="space-y-6">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="entities">Entities</TabsTrigger>
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
              {[
                { type: 'symptom' as EntityType, title: 'Symptoms', items: symptomEntities },
                { type: 'medication' as EntityType, title: 'Medications', items: medicationEntities },
                { type: 'feeling' as EntityType, title: 'Feelings', items: feelingEntities },
              ].map(({ type, title, items }) => (
                <Card key={type}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{title}</CardTitle>
                      <Dialog open={entityDialogOpen && entityType === type} onOpenChange={(open) => {
                        setEntityDialogOpen(open);
                        if (open) setEntityType(type);
                      }}>
                        <DialogTrigger asChild>
                          <Button size="sm"><Plus className="h-4 w-4 mr-1" />Add</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add {title.slice(0, -1)}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 pt-4">
                            <Input
                              placeholder={`Enter ${title.toLowerCase().slice(0, -1)}`}
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
                  <CardContent>
                    {items.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No {title.toLowerCase()} added yet</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {items.map((entity) => (
                          <Badge key={entity.id} variant="secondary" className="gap-2">
                            {entity.value}
                            <button
                              onClick={() => deleteEntity.mutate({ patientId: resolvedParams.id, entityId: entity.id })}
                              className="hover:text-red-600"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
