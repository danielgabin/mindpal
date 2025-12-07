/**
 * Custom hooks for patient management using React Query.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import apiClient from '@/lib/api-client';
import type {
  Patient,
  PatientListItem,
  PatientCreate,
  PatientUpdate,
  PatientEntity,
  PatientEntityCreate,
} from '@/types/patient';

// Query keys
export const patientKeys = {
  all: ['patients'] as const,
  lists: () => [...patientKeys.all, 'list'] as const,
  list: (filters: { search?: string; isActive?: boolean }) =>
    [...patientKeys.lists(), filters] as const,
  details: () => [...patientKeys.all, 'detail'] as const,
  detail: (id: string) => [...patientKeys.details(), id] as const,
  entities: (id: string) => [...patientKeys.detail(id), 'entities'] as const,
};

// Fetch patients list with optional filters
export function usePatients(search?: string, isActive?: boolean) {
  return useQuery({
    queryKey: patientKeys.list({ search, isActive }),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (isActive !== undefined) params.append('is_active', String(isActive));

      const response = await apiClient.get<PatientListItem[]>(
        `/patients${params.toString() ? `?${params.toString()}` : ''}`
      );
      return response.data;
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Fetch single patient
export function usePatient(id: string) {
  return useQuery({
    queryKey: patientKeys.detail(id),
    queryFn: async () => {
      const response = await apiClient.get<Patient>(`/patients/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

// Create patient mutation
export function useCreatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PatientCreate) => {
      const response = await apiClient.post<Patient>('/patients', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: patientKeys.lists() });
      toast.success('Patient created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Failed to create patient';
      toast.error(message);
    },
  });
}

// Update patient mutation
export function useUpdatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PatientUpdate }) => {
      const response = await apiClient.put<Patient>(`/patients/${id}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: patientKeys.lists() });
      queryClient.invalidateQueries({ queryKey: patientKeys.detail(data.id) });
      toast.success('Patient updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Failed to update patient';
      toast.error(message);
    },
  });
}

// Delete (archive) patient mutation
export function useDeletePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/patients/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: patientKeys.lists() });
      toast.success('Patient archived successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Failed to archive patient';
      toast.error(message);
    },
  });
}

// Fetch patient entities
export function usePatientEntities(patientId: string) {
  return useQuery({
    queryKey: patientKeys.entities(patientId),
    queryFn: async () => {
      const response = await apiClient.get<PatientEntity[]>(
        `/patients/${patientId}/entities`
      );
      return response.data;
    },
    enabled: !!patientId,
  });
}

// Add patient entity mutation
export function useAddPatientEntity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ patientId, data }: { patientId: string; data: PatientEntityCreate }) => {
      const response = await apiClient.post<PatientEntity>(
        `/patients/${patientId}/entities`,
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: patientKeys.entities(variables.patientId) });
      toast.success('Entity added successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Failed to add entity';
      toast.error(message);
    },
  });
}

// Delete patient entity mutation
export function useDeletePatientEntity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ patientId, entityId }: { patientId: string; entityId: string }) => {
      await apiClient.delete(`/patients/${patientId}/entities/${entityId}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: patientKeys.entities(variables.patientId) });
      toast.success('Entity deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Failed to delete entity';
      toast.error(message);
    },
  });
}
