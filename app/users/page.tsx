'use client';

import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api/users';
import { User } from '@/types';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/use-auth';
import { toast } from '@/lib/hooks/use-toast';
import { confirm } from '@/lib/hooks/use-toast';
import FilterPanel, { FilterField } from '@/components/ui/FilterPanel';
import FilterTags from '@/components/ui/FilterTags';
import { Button, TextField, Checkbox, Loader, Badge } from '@/components/ui';
import Image from 'next/image';

const roleLabels: Record<string, string> = {
  employee: 'Employee',
  manager: 'Manager',
  procurement: 'Procurement',
  admin: 'Admin',
};

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [selectMode, setSelectMode] = useState<'page' | 'all'>('page');
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['users', page, search, filters],
    queryFn: () => usersApi.getAll({ page, search, ...filters }),
  });

  // Get all user IDs when selectMode is 'all'
  const { data: allUsersData, isLoading: isLoadingAll } = useQuery({
    queryKey: ['users', 'all-ids', search, filters],
    queryFn: async () => {
      const allIds: number[] = [];
      let currentPage = 1;
      let hasMore = true;
      
      while (hasMore) {
        const response = await usersApi.getAll({ page: currentPage, search, ...filters });
        allIds.push(...response.results.map((u: User) => u.id));
        hasMore = !!response.next;
        currentPage++;
        if (currentPage > 100) break; // Safety limit
      }
      return allIds;
    },
    enabled: selectMode === 'all' && (currentUser?.role === 'super_admin' || currentUser?.is_staff),
  });

  const filterFields: FilterField[] = [
    // User Info
    { name: 'username', label: 'Username', type: 'text', group: 'User Info' },
    { name: 'email', label: 'Email', type: 'text', group: 'User Info' },
    { name: 'first_name', label: 'First Name', type: 'text', group: 'User Info' },
    { name: 'last_name', label: 'Last Name', type: 'text', group: 'User Info' },
    // Role & Status
    {
      name: 'role',
      label: 'Role',
      type: 'select',
      group: 'Role & Status',
      options: [
        { value: 'site_engineer', label: 'Site Engineer - مهندس الموقع' },
        { value: 'procurement_manager', label: 'Procurement Manager - مدير المشتريات' },
        { value: 'procurement_officer', label: 'Procurement Officer - موظف المشتريات' },
        { value: 'super_admin', label: 'Super Admin - المدير الرئيسي' },
      ],
    },
    { name: 'is_staff', label: 'Is Staff', type: 'boolean', group: 'Role & Status' },
    { name: 'is_active', label: 'Is Active', type: 'boolean', group: 'Role & Status' },
    // Dates
    { name: 'date_joined_after', label: 'Joined From', type: 'date', group: 'Dates' },
    { name: 'date_joined_before', label: 'Joined To', type: 'date', group: 'Dates' },
  ];

  const handleFilterChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleFilterReset = () => {
    setFilters({});
    setPage(1);
  };

  const handleRemoveFilter = (key: string) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    setFilters(newFilters);
    setPage(1);
  };

  const handleClearAllFilters = () => {
    setFilters({});
    setPage(1);
  };

  const deleteMutation = useMutation({
    mutationFn: usersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast('User deleted successfully', 'success');
    },
    onError: () => {
      toast('Failed to delete user', 'error');
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      // Filter out current user's ID
      const filteredIds = ids.filter(id => id !== currentUser?.id);
      await Promise.all(filteredIds.map(id => usersApi.delete(id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      const count = selectedItems.size;
      setSelectedItems(new Set());
      toast(`${count} user(s) deleted successfully`, 'success');
    },
    onError: () => {
      toast('Failed to delete some users', 'error');
    },
  });

  const handleDelete = async (id: number) => {
    if (id === currentUser?.id) {
      toast('You cannot delete your own account', 'warning');
      return;
    }
    const confirmed = await confirm('Are you sure you want to delete this user?');
    if (confirmed) {
      deleteMutation.mutate(id);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      if (selectMode === 'page' && data?.results) {
        // Filter out current user's ID
        setSelectedItems(new Set(data.results
          .filter((u: User) => u.id !== currentUser?.id)
          .map((u: User) => u.id)));
      } else if (selectMode === 'all' && allUsersData) {
        // Filter out current user's ID
        setSelectedItems(new Set(allUsersData.filter(id => id !== currentUser?.id)));
      }
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (id: number, checked: boolean) => {
    if (id === currentUser?.id) {
      toast('You cannot select your own account', 'warning');
      return;
    }
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedItems(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;
    const confirmed = await confirm(`Are you sure you want to delete ${selectedItems.size} user(s)?`);
    if (confirmed) {
      bulkDeleteMutation.mutate(Array.from(selectedItems));
    }
  };

  // Calculate checkbox state
  const currentPageIds = data?.results?.filter((u: User) => u.id !== currentUser?.id).map((u: User) => u.id) || [];
  const allPageSelected = currentPageIds.length > 0 && currentPageIds.every(id => selectedItems.has(id));
  const somePageSelected = currentPageIds.some(id => selectedItems.has(id)) && !allPageSelected;
  
  const allSystemSelected = selectMode === 'all' && allUsersData && 
    allUsersData.filter(id => id !== currentUser?.id).length > 0 && 
    allUsersData.filter(id => id !== currentUser?.id).every(id => selectedItems.has(id));
  const someSystemSelected = selectMode === 'all' && allUsersData && 
    allUsersData.filter(id => id !== currentUser?.id).some(id => selectedItems.has(id)) && 
    !allSystemSelected;

  const checkboxChecked = selectMode === 'page' 
    ? allPageSelected 
    : (allSystemSelected ?? false);
  const checkboxIndeterminate = selectMode === 'page'
    ? somePageSelected
    : (someSystemSelected ?? false);

  // Only show this page to super admins
  const isSuperuser = currentUser?.is_superuser ?? false;
  if (!isSuperuser && currentUser?.role !== 'super_admin' && !currentUser?.is_staff) {
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Users Management</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage system users and permissions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 border-r border-border pr-2 mr-2">
              <span className="text-xs text-muted-foreground">Select:</span>
              <Button
                variant={selectMode === 'page' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => {
                  setSelectMode('page');
                  setSelectedItems(new Set());
                }}
              >
                Page
              </Button>
              <Button
                variant={selectMode === 'all' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => {
                  setSelectMode('all');
                  setSelectedItems(new Set());
                }}
              >
                All
              </Button>
            </div>
            {selectedItems.size > 0 && (
              <Button
                variant="destructive"
                onClick={handleBulkDelete}
                disabled={bulkDeleteMutation.isPending}
                isLoading={bulkDeleteMutation.isPending}
              >
                {bulkDeleteMutation.isPending ? 'Deleting...' : `Delete ${selectedItems.size}`}
              </Button>
            )}
            <Link href="/users/pending">
              <Button variant="warning" style={{ marginRight: 'var(--spacing-2)' }}>
                Pending Approvals
                {(() => {
                  // Count pending users if available
                  const pendingCount = data?.results?.filter((u: User) => !u.is_active).length || 0;
                  return pendingCount > 0 ? ` (${pendingCount})` : '';
                })()}
              </Button>
            </Link>
            <Link href="/users/new">
              <Button variant="primary">Add User</Button>
            </Link>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="card flex items-center gap-4">
          <TextField
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 max-w-md"
          />
          <FilterPanel
            fields={filterFields}
            filters={filters}
            onFilterChange={handleFilterChange}
            onReset={handleFilterReset}
            saveKey="users"
          />
        </div>

        {/* Filter Tags */}
        {Object.keys(filters).length > 0 && (
          <FilterTags
            filters={filters}
            fields={filterFields}
            onRemoveFilter={handleRemoveFilter}
            onClearAll={handleClearAllFilters}
          />
        )}

        {/* Content */}
        {isLoading ? (
          <div className="card text-center py-12">
            <Loader className="mx-auto mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : error ? (
          <div className="card border-destructive bg-destructive/10">
            <p className="text-destructive text-sm">Error loading users. Please try again.</p>
          </div>
        ) : !data || !data.results || data.results.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-muted-foreground">No users found</p>
          </div>
        ) : (
          <>
            <div className="card p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table>
                  <thead>
                    <tr>
                      <th className="w-12">
                        <Checkbox
                          checked={checkboxChecked}
                          ref={(input) => {
                            if (input) input.indeterminate = checkboxIndeterminate ?? false;
                          }}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          disabled={selectMode === 'all' && isLoadingAll}
                          title={selectMode === 'page' ? 'Select all in page' : 'Select all in system'}
                        />
                      </th>
                      <th>User</th>
                      <th>Email</th>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.results.map((user: User) => (
                      <tr key={user.id}>
                        <td>
                          {user.id !== currentUser?.id && (
                            <Checkbox
                              checked={selectedItems.has(user.id)}
                              onChange={(e) => handleSelectItem(user.id, e.target.checked)}
                            />
                          )}
                        </td>
                        <td>
                          <div className="flex items-center gap-2.5">
                            <div
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                overflow: 'hidden',
                                backgroundColor: 'var(--bg-tertiary)',
                                border: '2px solid var(--border-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                position: 'relative',
                              }}
                            >
                              {user.avatar_url ? (
                                <Image
                                  src={user.avatar_url}
                                  alt={user.username}
                                  width={32}
                                  height={32}
                                  unoptimized
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                  }}
                                  onError={(e) => {
                                    // Hide image on error and show fallback
                                    const parent = e.currentTarget.parentElement;
                                    if (parent) {
                                      parent.innerHTML = `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background-color: var(--bg-tertiary); color: var(--text-tertiary); font-size: var(--font-xs); font-weight: var(--font-weight-bold);">${user.username.charAt(0).toUpperCase()}</div>`;
                                    }
                                  }}
                                />
                              ) : (
                                <div
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: 'var(--bg-tertiary)',
                                    color: 'var(--text-tertiary)',
                                    fontSize: 'var(--font-xs)',
                                    fontWeight: 'var(--font-weight-bold)',
                                  }}
                                >
                                  {user.username.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="font-medium text-foreground">{user.username}</div>
                          </div>
                        </td>
                        <td>
                          <div className="text-muted-foreground">{user.email}</div>
                        </td>
                        <td>
                          <div className="text-muted-foreground">
                            {user.first_name} {user.last_name}
                          </div>
                        </td>
                        <td>
                          <Badge variant="info">
                            {roleLabels[user.role] || user.role}
                          </Badge>
                        </td>
                        <td>
                          <Badge variant={user.is_staff ? 'success' : 'info'}>
                            {user.is_staff ? 'Staff' : 'Regular'}
                          </Badge>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <Link href={`/users/view/${user.id}`}>
                              <Button variant="view" size="sm">View</Button>
                            </Link>
                            <Link href={`/users/${user.id}`}>
                              <Button variant="edit" size="sm">Edit</Button>
                            </Link>
                            {user.id !== currentUser?.id && currentUser?.is_superuser && (
                              <Button
                                variant="delete"
                                size="sm"
                                onClick={() => handleDelete(user.id)}
                                disabled={deleteMutation.isPending}
                                isLoading={deleteMutation.isPending}
                              >
                                Delete
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {data && data.count > 50 && (
              <div className="flex items-center justify-between card">
                <div className="text-sm text-muted-foreground">
                  Showing {((page - 1) * 50) + 1} to {Math.min(page * 50, data.count)} of {data.count} users
                  {selectMode === 'all' && selectedItems.size > 0 && (
                    <span className="ml-2 text-foreground font-medium">
                      ({selectedItems.size} selected)
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={!data.previous || page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setPage(p => p + 1)}
                    disabled={!data.next}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}
