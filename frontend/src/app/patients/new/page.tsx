'use client';

/**
 * New patient form page with tutor validation for minors.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCreatePatient } from '@/hooks/use-patients';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Home, ArrowLeft } from 'lucide-react';

// Zod schema with tutor validation
const patientSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  appointment_reason: z.string().optional(),
  tutor_name: z.string().optional(),
  tutor_phone: z.string().optional(),
  tutor_email: z.string().email('Invalid email').optional().or(z.literal('')),
  tutor_relationship: z.string().optional(),
}).refine((data) => {
  // Calculate age from date_of_birth
  if (!data.date_of_birth) return true;

  const dob = new Date(data.date_of_birth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  // If minor, require tutor fields
  if (age < 16) {
    return !!(data.tutor_name && data.tutor_phone && data.tutor_relationship);
  }
  return true;
}, {
  message: 'Tutor information is required for patients under 16 years old',
  path: ['tutor_name'],
});

type PatientFormValues = z.infer<typeof patientSchema>;

export default function NewPatientPage() {
  const router = useRouter();
  const createPatient = useCreatePatient();
  const [isMinor, setIsMinor] = useState(false);

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      date_of_birth: '',
      email: '',
      phone: '',
      appointment_reason: '',
      tutor_name: '',
      tutor_phone: '',
      tutor_email: '',
      tutor_relationship: '',
    },
  });

  // Watch date_of_birth to determine if tutor fields should show
  const dateOfBirth = form.watch('date_of_birth');

  useEffect(() => {
    if (dateOfBirth) {
      const dob = new Date(dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      setIsMinor(age < 16);
    } else {
      setIsMinor(false);
    }
  }, [dateOfBirth]);

  const onSubmit = async (data: PatientFormValues) => {
    // Clean up empty strings to undefined
    const cleanData = {
      ...data,
      email: data.email || undefined,
      phone: data.phone || undefined,
      appointment_reason: data.appointment_reason || undefined,
      tutor_name: data.tutor_name || undefined,
      tutor_phone: data.tutor_phone || undefined,
      tutor_email: data.tutor_email || undefined,
      tutor_relationship: data.tutor_relationship || undefined,
    };

    createPatient.mutate(cleanData, {
      onSuccess: (patient) => {
        router.push(`/patients/${patient.id}`);
      },
    });
  };

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
              <BreadcrumbPage>New Patient</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">New Patient</h1>
            <p className="text-muted-foreground mt-1">Create a new patient record</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Patient Information</CardTitle>
              <CardDescription>Enter the patient's details below</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="first_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="last_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="date_of_birth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="appointment_reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Appointment Reason</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={3} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {isMinor && (
                    <div className="space-y-4 p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/10">
                      <h3 className="font-semibold text-sm">Tutor Information (Required for minors)</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="tutor_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tutor Name *</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="tutor_phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tutor Phone *</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="tutor_email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tutor Email</FormLabel>
                              <FormControl>
                                <Input type="email" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="tutor_relationship"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Relationship *</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. Parent, Guardian" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <Button type="submit" disabled={createPatient.isPending}>
                      {createPatient.isPending ? 'Creating...' : 'Create Patient'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
