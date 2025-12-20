'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

import dynamic from 'next/dynamic';
import '@toast-ui/editor/dist/toastui-editor.css';

// Dynamic import for Toast UI Editor (client-side only)
const Editor = dynamic(() => import('@toast-ui/react-editor').then(mod => mod.Editor), { ssr: false });
import { useRef } from 'react';


import type { Template } from '@/hooks/use-templates';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  content_markdown: z.string().min(1, 'Content is required'),
  is_default: z.boolean().default(false),

});

type FormValues = z.infer<typeof formSchema>;

interface TemplateFormProps {
  initialData?: Template;
  onSubmit: (values: FormValues) => Promise<void>;
  isSubmitting?: boolean;
}

export function TemplateForm({ initialData, onSubmit, isSubmitting }: TemplateFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || '',
      content_markdown: initialData?.content_markdown || '',
      is_default: initialData?.is_default || false,
    },
  });

  const editorRef = useRef<any>(null);

  const handleEditorChange = () => {
    if (editorRef.current) {
      const markdown = editorRef.current.getInstance().getMarkdown();
      form.setValue('content_markdown', markdown);
    }
  };


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Template Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Progress Note, Intake Session" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="content_markdown"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Content (Markdown)</FormLabel>
                <div className="border rounded-md overflow-hidden">
                  <Editor
                    ref={editorRef}
                    initialValue={field.value}
                    previewStyle="vertical"
                    height="500px"
                    initialEditType="wysiwyg"
                    useCommandShortcut={true}
                    onChange={handleEditorChange}
                  />
                </div>

                <FormMessage />
              </FormItem>
            )}
          />

          {/* Hidden for now unless we implement admin roles properly or want to allow users to set 'default' behavior conceptually (though backend restricts it) */}
          {/* 
          <FormField
            control={form.control}
            name="is_default"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    System Default
                  </FormLabel>
                  <FormDescription>
                    Available to all users (Admin only)
                  </FormDescription>
                </div>
              </FormItem>
            )}
          /> 
          */}
        </div>

        <div className="flex justify-end gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? 'Update Template' : 'Create Template'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
