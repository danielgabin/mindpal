/**
 * Custom hook for user profile management.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import apiClient from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import type { User, UserUpdate, PasswordUpdate } from '@/types/auth';

export function useUser() {
  const queryClient = useQueryClient();
  const { user: storeUser, setUser } = useAuthStore();

  // Fetch current user profile
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: async () => {
      const response = await apiClient.get<User>('/users/me');
      return response.data;
    },
    enabled: !!storeUser, // Only fetch if user is logged in
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: UserUpdate) => {
      const response = await apiClient.patch<User>('/users/me', data);
      return response.data;
    },
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      queryClient.setQueryData(['user', 'me'], updatedUser);
      toast.success('Profile updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Failed to update profile';
      toast.error(message);
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: PasswordUpdate) => {
      await apiClient.patch('/users/me/password', data);
    },
    onSuccess: () => {
      toast.success('Password changed successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Failed to change password';
      toast.error(message);
    },
  });

  return {
    user: user || storeUser,
    isLoading,
    error,
    updateProfile: updateProfileMutation.mutate,
    changePassword: changePasswordMutation.mutate,
    isUpdating: updateProfileMutation.isPending || changePasswordMutation.isPending,
  };
}
