'use client';

import { useRouter } from 'next/navigation';
import { useCreateTemplate } from '@/hooks/use-templates';
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
import { Home, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';


export default function CreateTemplatePage() {
  const router = useRouter();
  const createTemplate = useCreateTemplate();

  const handleSubmit = async (values: any) => {
    await createTemplate.mutateAsync(values);
    router.push('/templates');
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
              <BreadcrumbPage>New Template</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Template</h1>
            <p className="text-muted-foreground mt-1">
              Design a new template for your clinical notes
            </p>
          </div>
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">


          <Card className="border-none shadow-none bg-transparent">

            <CardContent>
              <TemplateForm
                onSubmit={handleSubmit}
                isSubmitting={createTemplate.isPending}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div >

  );
}
