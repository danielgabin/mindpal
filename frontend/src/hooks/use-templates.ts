/**
 * Custom hooks for templates using React Query.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import apiClient from '@/lib/api-client';

export interface Template {
  id: string;
  owner_id: string | null;
  name: string;
  content_markdown: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export type TemplateCreate = {
  name: string;
  content_markdown: string;
  is_default?: boolean;
};

export type TemplateUpdate = Partial<TemplateCreate>;

export const templateKeys = {
  all: ['templates'] as const,
  lists: () => [...templateKeys.all, 'list'] as const,
  details: () => [...templateKeys.all, 'detail'] as const,
  detail: (id: string) => [...templateKeys.details(), id] as const,
};

// Fetch templates
export function useTemplates(includeDefaults: boolean = true) {
  return useQuery({
    queryKey: [...templateKeys.lists(), { includeDefaults }],
    queryFn: async () => {
      const response = await apiClient.get<Template[]>('/templates', {
        params: { include_defaults: includeDefaults },
      });
      return response.data;
    },
  });
}

// Fetch single template
export function useTemplate(id: string) {
  return useQuery({
    queryKey: templateKeys.detail(id),
    queryFn: async () => {
      const response = await apiClient.get<Template>(`/templates/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

// Create template mutation
export function useCreateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: TemplateCreate) => {
      const response = await apiClient.post<Template>('/templates', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
      toast.success('Template created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Failed to create template';
      toast.error(message);
    },
  });
}

// Update template mutation
export function useUpdateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TemplateUpdate }) => {
      const response = await apiClient.put<Template>(`/templates/${id}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
      queryClient.invalidateQueries({ queryKey: templateKeys.detail(data.id) });
      toast.success('Template updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Failed to update template';
      toast.error(message);
    },
  });
}

// Delete template mutation
export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
      toast.success('Template deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Failed to delete template';
      toast.error(message);
    },
  });
}
