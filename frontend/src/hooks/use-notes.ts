/**
 * Custom hooks for clinical notes using React Query.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import apiClient from '@/lib/api-client';
import type {
  Note,
  NoteListItem,
  NoteCreate,
  NoteUpdate,
  NoteVersion,
  NoteKind,
} from '@/types/note';

// Query keys
export const noteKeys = {
  all: ['notes'] as const,
  lists: () => [...noteKeys.all, 'list'] as const,
  list: (patientId: string, kind?: NoteKind) =>
    [...noteKeys.lists(), { patientId, kind }] as const,
  details: () => [...noteKeys.all, 'detail'] as const,
  detail: (id: string) => [...noteKeys.details(), id] as const,
  versions: (id: string) => [...noteKeys.detail(id), 'versions'] as const,
  splits: (id: string) => [...noteKeys.detail(id), 'splits'] as const,
};

// Fetch notes list for a patient
export function useNotes(patientId: string, kind?: NoteKind) {
  return useQuery({
    queryKey: noteKeys.list(patientId, kind),
    queryFn: async () => {
      const params = new URLSearchParams({ patient_id: patientId });
      if (kind) params.append('kind', kind);

      const response = await apiClient.get<NoteListItem[]>(
        `/notes?${params.toString()}`
      );
      return response.data;
    },
    enabled: !!patientId,
  });
}

// Fetch single note
export function useNote(id: string) {
  return useQuery({
    queryKey: noteKeys.detail(id),
    queryFn: async () => {
      const response = await apiClient.get<Note>(`/notes/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

// Fetch note versions
export function useNoteVersions(noteId: string) {
  return useQuery({
    queryKey: noteKeys.versions(noteId),
    queryFn: async () => {
      const response = await apiClient.get<NoteVersion[]>(
        `/notes/${noteId}/versions`
      );
      return response.data;
    },
    enabled: !!noteId,
  });
}

// Fetch split notes
export function useSplitNotes(parentNoteId: string) {
  return useQuery({
    queryKey: noteKeys.splits(parentNoteId),
    queryFn: async () => {
      const response = await apiClient.get<Note[]>(
        `/notes/${parentNoteId}/splits`
      );
      return response.data;
    },
    enabled: !!parentNoteId,
  });
}

// Create note mutation
export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: NoteCreate) => {
      const response = await apiClient.post<Note>('/notes', data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
      toast.success('Note created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Failed to create note';
      toast.error(message);
    },
  });
}

// Update note mutation
export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: NoteUpdate }) => {
      const response = await apiClient.put<Note>(`/notes/${id}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
      queryClient.invalidateQueries({ queryKey: noteKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: noteKeys.versions(data.id) });
      toast.success('Note updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Failed to update note';
      toast.error(message);
    },
  });
}

// Delete note mutation
export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/notes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
      toast.success('Note deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Failed to delete note';
      toast.error(message);
    },
  });
}

// Restore version mutation
export function useRestoreVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ noteId, versionNumber }: { noteId: string; versionNumber: number }) => {
      const response = await apiClient.post<Note>(
        `/notes/${noteId}/restore/${versionNumber}`
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: noteKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: noteKeys.versions(data.id) });
      toast.success('Version restored successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Failed to restore version';
      toast.error(message);
    },
  });
}
