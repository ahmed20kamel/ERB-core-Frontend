'use client';

import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api/users';
import { permissionsApi } from '@/lib/api/permissions';
import { User } from '@/types';
import { useAuth } from '@/lib/hooks/use-auth';
import { PERMISSIONS_QUERY_KEY } from '@/lib/hooks/use-permissions';
import { toast } from '@/lib/hooks/use-toast';
import { confirm } from '@/lib/hooks/use-toast';
import { Button, Loader, Badge } from '@/components/ui';
import SearchableDropdown from '@/components/ui/SearchableDropdown';

export default function PendingUsersPage() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPermissionSet, setSelectedPermissionSet] = useState<Record<number, number>>({});

  const { data: pendingUsers, isLoading, error } = useQuery({
    queryKey: ['users', 'pending'],
    queryFn: async () => {
      try {
        return await usersApi.getPending();
      } catch (err: any) {
        const errorMessage = err?.response?.data?.error ||
                            err?.response?.data?.detail ||
                            err?.message ||
                            'Failed to fetch pending users';
        toast(errorMessage, 'error');
        throw err;
      }
    },
    refetchInterval: 5000,
    retry: 2,
  });

  const { data: permissionSetsData } = useQuery({
    queryKey: ['permission-sets'],
    queryFn: () => permissionsApi.getAllPermissionSets({ page: 1, page_size: 1000 }),
  });

  const permissionSets = permissionSetsData?.results || [];

  const approveMutation = useMutation({
    mutationFn: ({ id, permissionSetId }: { id: number; permissionSetId?: number }) =>
      usersApi.approve(id, permissionSetId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'pending'] });
      queryClient.invalidateQueries({ queryKey: PERMISSIONS_QUERY_KEY });
      toast(`User ${data.username} has been approved`, 'success');
      setSelectedPermissionSet(prev => {
        const newState = { ...prev };
        delete newState[variables.id];
        return newState;
      });
    },
    onError: () => {
      toast('Failed to approve user', 'error');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) => usersApi.reject(id),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'pending'] });
      toast(`User ${data?.username ?? ''} has been rejected`, 'success');
    },
    onError: () => {
      toast('Failed to reject user', 'error');
    },
  });

  const handleApprove = (user: User) => {
    const permissionSetId = selectedPermissionSet[user.id];
    approveMutation.mutate({ id: user.id, permissionSetId });
  };

  const handleReject = async (user: User) => {
    const confirmed = await confirm(`Reject user "${user.username}"? This will delete the account.`);
    if (confirmed) {
      rejectMutation.mutate(user.id);
    }
  };

  if (currentUser?.role !== 'super_admin' && !currentUser?.is_superuser) {
    return (
      <MainLayout>
        <div className="card" style={{ borderColor: 'var(--color-error)', backgroundColor: 'var(--color-error-light)' }}>
          <p style={{ color: 'var(--color-error)', fontSize: 'var(--font-sm)', margin: 0 }}>
            Access Denied. Admin access required.
          </p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
        {/* Header */}
        <div>
          <h1 style={{
            fontSize: 'var(--font-2xl)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--text-primary)',
            margin: 0,
            marginBottom: 'var(--spacing-1)',
          }}>
            Pending Users
          </h1>
          <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', margin: 0 }}>
            Review and approve new user registrations
          </p>
        </div>

        {/* Content */}
        <div className="card">
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--spacing-8)' }}>
              <Loader />
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: 'var(--spacing-8)', color: 'var(--color-error)' }}>
              Failed to load pending users
            </div>
          ) : !pendingUsers || (pendingUsers as User[]).length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--spacing-8)', color: 'var(--text-secondary)' }}>
              No pending users at this time
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                    {['Username', 'Email', 'Role', 'Registered', 'Permission Set', 'Actions'].map((h) => (
                      <th key={h} style={{
                        padding: 'var(--spacing-3) var(--spacing-4)',
                        textAlign: 'left',
                        fontSize: 'var(--font-xs)',
                        fontWeight: 'var(--font-weight-medium)',
                        color: 'var(--text-secondary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(pendingUsers as User[]).map((user) => (
                    <tr key={user.id} style={{ borderBottom: '1px solid var(--border-primary)' }}>
                      <td style={{ padding: 'var(--spacing-3) var(--spacing-4)' }}>
                        <div style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)' }}>
                          {user.username}
                        </div>
                        {user.first_name && (
                          <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>
                            {user.first_name} {user.last_name}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: 'var(--spacing-3) var(--spacing-4)', color: 'var(--text-secondary)', fontSize: 'var(--font-sm)' }}>
                        {user.email}
                      </td>
                      <td style={{ padding: 'var(--spacing-3) var(--spacing-4)' }}>
                        <Badge variant="info">{user.role}</Badge>
                      </td>
                      <td style={{ padding: 'var(--spacing-3) var(--spacing-4)', color: 'var(--text-secondary)', fontSize: 'var(--font-sm)' }}>
                        {user.date_joined ? new Date(user.date_joined).toLocaleDateString() : '—'}
                      </td>
                      <td style={{ padding: 'var(--spacing-3) var(--spacing-4)', minWidth: '200px' }}>
                        <SearchableDropdown
                          options={permissionSets.map((ps: any) => ({ value: String(ps.id), label: ps.name }))}
                          value={selectedPermissionSet[user.id] ? String(selectedPermissionSet[user.id]) : ''}
                          onChange={(val) => setSelectedPermissionSet(prev => ({ ...prev, [user.id]: Number(val) }))}
                          placeholder="Select permission set (optional)"
                        />
                      </td>
                      <td style={{ padding: 'var(--spacing-3) var(--spacing-4)' }}>
                        <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(user)}
                            disabled={approveMutation.isPending}
                            className="btn btn-primary"
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleReject(user)}
                            disabled={rejectMutation.isPending}
                            className="btn btn-danger"
                          >
                            Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
