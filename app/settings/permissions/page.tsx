'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MainLayout from '@/components/layout/MainLayout';
import { permissionsApi, Permission, PermissionSet } from '@/lib/api/permissions';
import { usersApi } from '@/lib/api/users';
import { useAuth } from '@/lib/hooks/use-auth';
import { toast } from '@/lib/hooks/use-toast';
import { Button, TextField, Checkbox, Loader, Badge } from '@/components/ui';
import { User } from '@/types';

const CATEGORY_LABELS: Record<string, string> = {
  purchase_request: 'Purchase Request',
  quotation_request: 'Quotation Request',
  purchase_quotation: 'Purchase Quotation',
  purchase_order: 'Purchase Order',
  goods_receiving: 'Goods Receiving',
  purchase_invoice: 'Purchase Invoice',
  supplier: 'Supplier',
  product: 'Product',
  project: 'Project',
  user: 'User',
  settings: 'Settings',
};

const ACTION_LABELS: Record<string, string> = {
  create: 'Create',
  view: 'View',
  update: 'Update',
  delete: 'Delete',
  approve: 'Approve',
  reject: 'Reject',
  cancel: 'Cancel',
  award: 'Award',
  convert: 'Convert',
  mark_paid: 'Mark as Paid',
};

export default function PermissionsPage() {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'super_admin' || currentUser?.is_staff;
  const queryClient = useQueryClient();
  
  const [selectedPermissionSet, setSelectedPermissionSet] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [searchPermissionSet, setSearchPermissionSet] = useState('');
  const [searchUser, setSearchUser] = useState('');

  // Fetch permissions grouped by category
  const { data: permissionsByCategory, isLoading: isLoadingPermissions } = useQuery({
    queryKey: ['permissions', 'by-category'],
    queryFn: () => permissionsApi.getPermissionsByCategory(),
  });

  // Fetch permission sets
  const { data: permissionSetsData, isLoading: isLoadingSets } = useQuery({
    queryKey: ['permission-sets', searchPermissionSet],
    queryFn: () => permissionsApi.getAllPermissionSets({ search: searchPermissionSet }),
  });

  // Fetch users
  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users', 'all', searchUser],
    queryFn: () => usersApi.getAll({ search: searchUser }),
  });

  // Fetch selected permission set details
  const { data: selectedSetDetails } = useQuery({
    queryKey: ['permission-set', selectedPermissionSet],
    queryFn: () => permissionsApi.getPermissionSetById(selectedPermissionSet!),
    enabled: !!selectedPermissionSet,
  });

  // Fetch selected user permissions
  const { data: selectedUserPermissions } = useQuery({
    queryKey: ['user-permission-summary', selectedUser],
    queryFn: () => permissionsApi.getUserPermissionSummary(selectedUser!),
    enabled: !!selectedUser,
  });

  // Update permission set mutation
  const updatePermissionSetMutation = useMutation({
    mutationFn: async ({ id, permissionIds }: { id: number; permissionIds: number[] }) => {
      return permissionsApi.assignPermissionsToSet(id, permissionIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permission-set', selectedPermissionSet] });
      queryClient.invalidateQueries({ queryKey: ['permission-sets'] });
      toast('Permission set updated successfully', 'success');
    },
    onError: () => {
      toast('Failed to update permission set', 'error');
    },
  });

  // Assign permission set to user mutation
  const assignPermissionSetMutation = useMutation({
    mutationFn: async ({ userId, permissionSetId }: { userId: number; permissionSetId: number | null }) => {
      return permissionsApi.assignPermissionSetToUser(userId, permissionSetId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-permission-summary', selectedUser] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast('Permission set assigned successfully', 'success');
    },
    onError: () => {
      toast('Failed to assign permission set', 'error');
    },
  });

  const handlePermissionToggle = (permissionId: number, checked: boolean) => {
    if (!selectedSetDetails) return;
    
    const currentPermissionIds = selectedSetDetails.permissions.map((p) => p.id);
    const newPermissionIds = checked
      ? [...currentPermissionIds, permissionId]
      : currentPermissionIds.filter((id) => id !== permissionId);
    
    updatePermissionSetMutation.mutate({
      id: selectedSetDetails.id,
      permissionIds: newPermissionIds,
    });
  };

  const handleAssignPermissionSet = (userId: number, permissionSetId: number | null) => {
    assignPermissionSetMutation.mutate({ userId, permissionSetId });
  };

  if (!isAdmin) {
    return (
      <MainLayout>
        <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-12)' }}>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            You don't have permission to access this page
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
          <h1
            style={{
              fontSize: 'var(--font-2xl)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-primary)',
              margin: 0,
              marginBottom: 'var(--spacing-1)',
            }}
          >
            Permissions Management
          </h1>
          <p
            style={{
              fontSize: 'var(--font-sm)',
              color: 'var(--text-secondary)',
              margin: 0,
            }}
          >
            Manage user permissions and roles
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-6)' }}>
          {/* Left: Permission Sets */}
          <div className="card">
            <h3
              style={{
                fontSize: 'var(--font-lg)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--text-primary)',
                margin: 0,
                marginBottom: 'var(--spacing-4)',
              }}
            >
              Permission Sets (Roles)
            </h3>

            {/* Search */}
            <div style={{ marginBottom: 'var(--spacing-4)' }}>
              <TextField
                type="text"
                placeholder="Search permission sets..."
                value={searchPermissionSet}
                onChange={(e) => setSearchPermissionSet(e.target.value)}
                className="input"
              />
            </div>

            {/* Permission Sets List */}
            {isLoadingSets ? (
              <div style={{ textAlign: 'center', padding: 'var(--spacing-8)' }}>
                <Loader className="mx-auto mb-4" />
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Loading...</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                {permissionSetsData?.results.map((set: PermissionSet) => (
                  <div
                    key={set.id}
                    onClick={() => setSelectedPermissionSet(set.id)}
                    className="card"
                    style={{
                      padding: 'var(--spacing-3)',
                      cursor: 'pointer',
                      border: selectedPermissionSet === set.id ? '2px solid var(--brand-orange)' : '1px solid var(--border-primary)',
                      backgroundColor: selectedPermissionSet === set.id ? 'var(--brand-orange-light)' : 'var(--card-bg)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>
                          {set.name}
                        </div>
                        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginTop: 'var(--spacing-1)' }}>
                          {set.permissions_count} permissions
                        </div>
                      </div>
                      {set.is_system && (
                        <Badge variant="info">System</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Users */}
          <div className="card">
            <h3
              style={{
                fontSize: 'var(--font-lg)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--text-primary)',
                margin: 0,
                marginBottom: 'var(--spacing-4)',
              }}
            >
              Users
            </h3>

            {/* Search */}
            <div style={{ marginBottom: 'var(--spacing-4)' }}>
              <TextField
                type="text"
                placeholder="Search users..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                className="input"
              />
            </div>

            {/* Users List */}
            {isLoadingUsers ? (
              <div style={{ textAlign: 'center', padding: 'var(--spacing-8)' }}>
                <Loader className="mx-auto mb-4" />
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Loading...</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                {usersData?.results.map((user: User) => (
                  <div
                    key={user.id}
                    onClick={() => setSelectedUser(user.id)}
                    className="card"
                    style={{
                      padding: 'var(--spacing-3)',
                      cursor: 'pointer',
                      border: selectedUser === user.id ? '2px solid var(--brand-orange)' : '1px solid var(--border-primary)',
                      backgroundColor: selectedUser === user.id ? 'var(--brand-orange-light)' : 'var(--card-bg)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>
                          {user.username}
                        </div>
                        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginTop: 'var(--spacing-1)' }}>
                          {user.email}
                        </div>
                      </div>
                      <Badge variant="info">{user.role}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Permissions Grid */}
        {selectedPermissionSet && selectedSetDetails && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)' }}>
              <h3
                style={{
                  fontSize: 'var(--font-lg)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--text-primary)',
                  margin: 0,
                }}
              >
                Permissions for: {selectedSetDetails.name}
              </h3>
              {selectedSetDetails.description && (
                <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', margin: 0 }}>
                  {selectedSetDetails.description}
                </p>
              )}
            </div>

            {isLoadingPermissions ? (
              <div style={{ textAlign: 'center', padding: 'var(--spacing-8)' }}>
                <Loader className="mx-auto mb-4" />
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Loading permissions...</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
                {Object.entries(permissionsByCategory || {}).map(([category, permissions]: [string, Permission[]]) => (
                  <div key={category}>
                    <h4
                      style={{
                        fontSize: 'var(--font-base)',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--text-primary)',
                        margin: 0,
                        marginBottom: 'var(--spacing-3)',
                        paddingBottom: 'var(--spacing-2)',
                        borderBottom: '1px solid var(--border-primary)',
                      }}
                    >
                      {CATEGORY_LABELS[category] || category}
                    </h4>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                        gap: 'var(--spacing-3)',
                      }}
                    >
                      {permissions.map((permission) => {
                        const isChecked = selectedSetDetails.permissions.some((p) => p.id === permission.id);
                        return (
                          <label
                            key={permission.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 'var(--spacing-2)',
                              padding: 'var(--spacing-2)',
                              borderRadius: 'var(--radius-md)',
                              cursor: 'pointer',
                              backgroundColor: isChecked ? 'var(--brand-orange-light)' : 'transparent',
                              border: `1px solid ${isChecked ? 'var(--brand-orange)' : 'var(--border-primary)'}`,
                            }}
                            onMouseEnter={(e) => {
                              if (!isChecked) {
                                e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isChecked) {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }
                            }}
                          >
                            <Checkbox
                              checked={isChecked}
                              onChange={(e) => handlePermissionToggle(permission.id, e.target.checked)}
                              disabled={updatePermissionSetMutation.isPending}
                            />
                            <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-primary)' }}>
                              {ACTION_LABELS[permission.action] || permission.action}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* User Permission Assignment */}
        {selectedUser && selectedUserPermissions && (
          <div className="card">
            <h3
              style={{
                fontSize: 'var(--font-lg)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--text-primary)',
                margin: 0,
                marginBottom: 'var(--spacing-4)',
              }}
            >
              Assign Permission Set to: {selectedUserPermissions.username}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 'var(--font-sm)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--text-secondary)',
                    marginBottom: 'var(--spacing-2)',
                  }}
                >
                  Current Permission Set
                </label>
                <p style={{ fontSize: 'var(--font-base)', color: 'var(--text-primary)', margin: 0 }}>
                  {selectedUserPermissions.permission_set?.name || 'None'}
                </p>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 'var(--font-sm)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--text-secondary)',
                    marginBottom: 'var(--spacing-2)',
                  }}
                >
                  Assign Permission Set
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-2)' }}>
                  <Button
                    onClick={() => handleAssignPermissionSet(selectedUser, null)}
                    className="btn btn-secondary"
                    size="sm"
                    disabled={assignPermissionSetMutation.isPending}
                  >
                    Clear
                  </Button>
                  {permissionSetsData?.results.map((set: PermissionSet) => (
                    <Button
                      key={set.id}
                      onClick={() => handleAssignPermissionSet(selectedUser, set.id)}
                      className={`btn ${selectedUserPermissions.permission_set?.id === set.id ? 'btn-primary' : 'btn-secondary'}`}
                      size="sm"
                      disabled={assignPermissionSetMutation.isPending}
                    >
                      {set.name}
                    </Button>
                  ))}
                </div>
              </div>

              {selectedUserPermissions.permissions.length > 0 && (
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 'var(--font-sm)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'var(--text-secondary)',
                      marginBottom: 'var(--spacing-2)',
                    }}
                  >
                    User Permissions ({selectedUserPermissions.permissions.length})
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-2)' }}>
                    {selectedUserPermissions.permissions.map((perm, index) => (
                      <Badge key={index} variant="info">
                        {CATEGORY_LABELS[perm.category] || perm.category}.{ACTION_LABELS[perm.action] || perm.action}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

