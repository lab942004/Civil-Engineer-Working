import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import toast from 'react-hot-toast';
import type { ApiResponse } from '@/types';

export function useList<T>(endpoint: string, queryKey: string[], params?: Record<string, any>) {
  return useQuery<ApiResponse<T[]>>({
    queryKey: [...queryKey, params],
    queryFn: () => api.get<T[]>(endpoint, { params }),
  });
}

export function useGet<T>(endpoint: string, queryKey: string[], id?: string) {
  return useQuery<ApiResponse<T>>({
    queryKey: [...queryKey, id],
    queryFn: () => api.get<T>(`${endpoint}/${id}`),
    enabled: !!id,
  });
}

export function useCreate<T>(endpoint: string, queryKey: string[], successMsg?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post<T>(endpoint, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success(successMsg || 'Created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Operation failed');
    },
  });
}

export function useUpdate<T>(endpoint: string, queryKey: string[], successMsg?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put<T>(`${endpoint}/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success(successMsg || 'Updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Update failed');
    },
  });
}

export function useUpload<T>(endpoint: string, queryKey: string[], successMsg?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ formData, onProgress }: { formData: FormData; onProgress?: (progress: number) => void }) =>
      api.upload<T>(endpoint, formData, onProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success(successMsg || 'Uploaded successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Upload failed');
    },
  });
}

export function useDelete(endpoint: string, queryKey: string[], successMsg?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`${endpoint}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success(successMsg || 'Deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Delete failed');
    },
  });
}