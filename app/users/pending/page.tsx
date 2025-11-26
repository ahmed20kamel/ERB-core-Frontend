'use client';

import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api/users';
import { permissionsApi } from '@/lib/api/permissions';
import { User, PermissionSet } from '@/types';
import { useAuth } from '@/lib/hooks/use-auth';
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
      const data = await usersApi.getPending();
      console.log('Pending users from API:', data);
      return data;
    },
    refetchInterval: 5000, // Refetch every 5 seconds to catch new registrations
  });
  
  // Debug: Log pending users
  if (typeof window !== 'undefined' && pendingUsers) {
    console.log('Pending users in component:', pendingUsers);
  }

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
      toast(`User ${data.username} has been approved`, 'success');
      // Clear selected permission set
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

  const handleApprove = async (user: User) => {
    const confirmed = await confirm(
      `Approve user "${user.username}"?${selectedPermissionSet[user.id] ? '\n\nA permission set will be assigned.' : ''}`
    );
    if (confirmed) {
      approveMutation.mutate({
        id: user.id,
        permissionSetId: selectedPermissionSet[user.id],
      });
    }
  };

  // Only show this page to admins
  if (currentUser?.role !== 'super_admin' && !currentUser?.is_staff) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="card border-destructive bg-destructive/10">
            <p className="text-destructive text-sm">Access Denied. Admin access required.</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              Pending User Approvals
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Review and approve new user registrations
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['users', 'pending'] });
              toast('Refreshed pending users list', 'success');
            }}
          >
            Refresh
          </Button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="card text-center py-12">
            <Loader className="mx-auto mb-4" />
            <p style={{ color: 'var(--text-secondary)' }}>Loading pending users...</p>
          </div>
        ) : error ? (
          <div className="card text-center py-12 border-destructive bg-destructive/10">
            <p className="text-destructive text-sm">Error loading pending users</p>
            <p className="text-xs mt-2 text-destructive/70">{String(error)}</p>
          </div>
        ) : !pendingUsers || pendingUsers.length === 0 ? (
          <div className="card text-center py-12">
            <p style={{ color: 'var(--text-secondary)' }}>No pending users</p>
            <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
              All new registrations will appear here for approval
            </p>
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Registered</th>
                    <th>Permission Set</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingUsers.map((user: User) => (
                    <tr key={user.id}>
                      <td>
                        <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                          {user.username}
                        </div>
                      </td>
                      <td>
                        <div style={{ color: 'var(--text-secondary)' }}>{user.email}</div>
                      </td>
                      <td>
                        <div style={{ color: 'var(--text-secondary)' }}>
                          {user.first_name} {user.last_name}
                        </div>
                      </td>
                      <td>
                        <div style={{ color: 'var(--text-secondary)' }}>{user.phone || '—'}</div>
                      </td>
                      <td>
                        <Badge variant="info">{user.role}</Badge>
                      </td>
                      <td>
                        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                        </div>
                      </td>
                      <td>
                        <div style={{ minWidth: '200px' }}>
                          <SearchableDropdown
                            label=""
                            options={(permissionSets || []).map((ps: PermissionSet) => ({
                              value: ps.id,
                              label: ps.name,
                            }))}
                            value={selectedPermissionSet[user.id] || ''}
                            onChange={(value) => {
                              setSelectedPermissionSet(prev => ({
                                ...prev,
                                [user.id]: value ? parseInt(value) : undefined,
                              }));
                            }}
                            placeholder="Select permission set (optional)"
                          />
                        </div>
                      </td>
                      <td>
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleApprove(user)}
                          disabled={approveMutation.isPending}
                          isLoading={approveMutation.isPending}
                        >
                          Approve
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

