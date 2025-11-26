import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { permissionsApi } from '@/lib/api/permissions';
import { useAuth } from './use-auth';

export function usePermissions() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['user-permissions', 'me'],
    queryFn: () => permissionsApi.getMyPermissions(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const permissions = data?.permissions || [];
  const permissionSet = data?.permission_set;

  const hasPermission = (category: string, action: string): boolean => {
    // Superuser has all permissions
    if (user?.is_superuser) {
      return true;
    }
    return permissions.some(
      (p) => p.category === category && p.action === action
    );
  };

  const hasAnyPermission = (checks: Array<{ category: string; action: string }>): boolean => {
    return checks.some((check) => hasPermission(check.category, check.action));
  };

  const hasAllPermissions = (checks: Array<{ category: string; action: string }>): boolean => {
    return checks.every((check) => hasPermission(check.category, check.action));
  };

  return {
    permissions,
    permissionSet,
    isLoading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
}

export function useHasPermission(category: string, action: string): boolean {
  const { hasPermission } = usePermissions();
  return hasPermission(category, action);
}

