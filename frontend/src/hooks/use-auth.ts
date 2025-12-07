/**
 * Custom hook for authentication operations.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import apiClient from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import type { LoginRequest, RegisterRequest, TokenResponse, User } from '@/types/auth';

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setAuth, clearAuth, user, isAuthenticated } = useAuthStore();

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterRequest) => {
      const response = await apiClient.post<User>('/auth/register', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Registration successful! Please sign in.');
      router.push('/signin');
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Registration failed';
      toast.error(message);
    },
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      const response = await apiClient.post<TokenResponse>('/auth/login', credentials);
      return response.data;
    },
    onSuccess: async (data) => {
      // Fetch user profile with the new access token
      const userResponse = await apiClient.get<User>('/users/me', {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
        },
      });

      setAuth(userResponse.data, data.access_token, data.refresh_token);
      toast.success('Welcome back!');
      router.push('/dashboard');
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Login failed';
      toast.error(message);
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refresh_token: refreshToken });
      }
    },
    onSuccess: () => {
      clearAuth();
      queryClient.clear();
      toast.success('Logged out successfully');
      router.push('/signin');
    },
    onError: () => {
      // Even if API call fails, clear local auth
      clearAuth();
      queryClient.clear();
      router.push('/signin');
    },
  });

  return {
    user,
    isAuthenticated: isAuthenticated(),
    register: registerMutation.mutate,
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    isLoading: registerMutation.isPending || loginMutation.isPending || logoutMutation.isPending,
  };
}
