'use client';

import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '@/lib/api/projects';
import { Project } from '@/types';
import Link from 'next/link';
import { toast } from '@/lib/hooks/use-toast';
import { confirm } from '@/lib/hooks/use-toast';
import { useAuth } from '@/lib/hooks/use-auth';
import FilterPanel, { FilterField } from '@/components/ui/FilterPanel';
import FilterTags from '@/components/ui/FilterTags';
import { Button, TextField, Checkbox, Loader, Badge } from '@/components/ui';

const statusColors: Record<string, 'warning' | 'success' | 'info' | 'error'> = {
  on_going: 'warning',
  completed: 'success',
  on_hold: 'info',
  cancelled: 'error',
};

const statusLabels: Record<string, string> = {
  on_going: 'On Going',
  completed: 'Completed',
  on_hold: 'On Hold',
  cancelled: 'Cancelled',
};

export default function ProjectsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [selectMode, setSelectMode] = useState<'page' | 'all'>('page');
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isSuperuser = user?.is_superuser ?? false;
  const isAdmin = isSuperuser || user?.role === 'super_admin' || user?.is_staff;

  const { data, isLoading, error } = useQuery({
    queryKey: ['projects', page, search, filters],
    queryFn: () => projectsApi.getAll({ page, search, ...filters }),
  });

  // Get all project IDs when selectMode is 'all'
  const { data: allProjectsData, isLoading: isLoadingAll } = useQuery({
    queryKey: ['projects', 'all-ids', search, filters],
    queryFn: async () => {
      const allIds: number[] = [];
      let currentPage = 1;
      let hasMore = true;
      
      while (hasMore) {
        const response = await projectsApi.getAll({ page: currentPage, search, ...filters });
        allIds.push(...response.results.map((p: Project) => p.id));
        hasMore = !!response.next;
        currentPage++;
        if (currentPage > 100) break; // Safety limit
      }
      return allIds;
    },
    enabled: selectMode === 'all' && isAdmin,
  });

  const filterFields: FilterField[] = [
    // Project Info
    { name: 'code', label: 'Code', type: 'text', group: 'Project Info' },
    { name: 'name', label: 'Name', type: 'text', group: 'Project Info' },
    { name: 'location', label: 'Location', type: 'text', group: 'Project Info' },
    { name: 'contact_person', label: 'Contact Person', type: 'text', group: 'Project Info' },
    { name: 'mobile_number', label: 'Mobile Number', type: 'text', group: 'Project Info' },
    { name: 'sector', label: 'Sector', type: 'text', group: 'Project Info' },
    { name: 'plot', label: 'Plot', type: 'text', group: 'Project Info' },
    { name: 'consultant', label: 'Consultant', type: 'text', group: 'Project Info' },
    // Status
    {
      name: 'project_status',
      label: 'Status',
      type: 'select',
      group: 'Status',
      options: [
        { value: 'on_going', label: 'On Going' },
        { value: 'completed', label: 'Completed' },
        { value: 'on_hold', label: 'On Hold' },
        { value: 'cancelled', label: 'Cancelled' },
      ],
    },
    { name: 'is_active', label: 'Is Active', type: 'boolean', group: 'Status' },
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

  const handleSelectItem = (id: number, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (selectMode === 'page') {
      const currentPageIds = data?.results?.map((p: Project) => p.id) || [];
      const newSelected = new Set(selectedItems);
      if (checked) {
        currentPageIds.forEach((id: number) => newSelected.add(id));
      } else {
        currentPageIds.forEach((id: number) => newSelected.delete(id));
      }
      setSelectedItems(newSelected);
    } else {
      // Select all in system
      if (checked && allProjectsData) {
        setSelectedItems(new Set(allProjectsData));
      } else {
        setSelectedItems(new Set());
      }
    }
  };

  const deleteMutation = useMutation({
    mutationFn: projectsApi.delete,
    onSuccess: () => {
      toast('Project deleted successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setSelectedItems(new Set());
    },
    onError: (error: any) => {
      toast(error?.response?.data?.detail || 'Failed to delete project', 'error');
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      await Promise.all(ids.map((id) => projectsApi.delete(id)));
    },
    onSuccess: () => {
      toast(`${selectedItems.size} project(s) deleted successfully`, 'success');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setSelectedItems(new Set());
    },
    onError: (error: any) => {
      toast(error?.response?.data?.detail || 'Failed to delete projects', 'error');
    },
  });

  const handleDelete = async (id: number) => {
    const confirmed = await confirm('Are you sure you want to delete this project?');
    if (confirmed) {
      deleteMutation.mutate(id);
    }
  };

  const handleBulkDelete = async () => {
    const confirmed = await confirm(`Are you sure you want to delete ${selectedItems.size} project(s)?`);
    if (confirmed) {
      bulkDeleteMutation.mutate(Array.from(selectedItems));
    }
  };

  // Calculate checkbox state
  const currentPageIds = data?.results?.map((p: Project) => p.id) || [];
  const allPageSelected = currentPageIds.length > 0 && currentPageIds.every(id => selectedItems.has(id));
  const somePageSelected = currentPageIds.some(id => selectedItems.has(id)) && !allPageSelected;
  
  const allSystemSelected = selectMode === 'all' && allProjectsData && 
    allProjectsData.length > 0 && 
    allProjectsData.every(id => selectedItems.has(id));
  const someSystemSelected = selectMode === 'all' && allProjectsData && 
    allProjectsData.some(id => selectedItems.has(id)) && 
    !allSystemSelected;

  const checkboxChecked = selectMode === 'page' 
    ? allPageSelected 
    : allSystemSelected;
  const checkboxIndeterminate = selectMode === 'page'
    ? somePageSelected
    : someSystemSelected;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Projects</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage projects and their details
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
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
            )}
            {user?.is_superuser && selectedItems.size > 0 && (
              <Button
                variant="destructive"
                onClick={handleBulkDelete}
                disabled={bulkDeleteMutation.isPending}
                isLoading={bulkDeleteMutation.isPending}
              >
                {bulkDeleteMutation.isPending ? 'Deleting...' : `Delete ${selectedItems.size}`}
              </Button>
            )}
            <Link href="/projects/new">
              <Button variant="primary">New Project</Button>
            </Link>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="card flex items-center gap-4">
          <TextField
            type="text"
            placeholder="Search by code, name, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 max-w-md"
          />
          <FilterPanel
            fields={filterFields}
            filters={filters}
            onFilterChange={handleFilterChange}
            onReset={handleFilterReset}
            saveKey="projects"
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
            <p className="text-destructive text-sm">Error loading projects. Please try again.</p>
          </div>
        ) : !data || !data.results || data.results.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-muted-foreground">No projects found</p>
          </div>
        ) : (
          <>
            <div className="card p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table>
                  <thead>
                    <tr>
                      {isAdmin && (
                        <th className="w-12">
                          <Checkbox
                            checked={checkboxChecked}
                            ref={(input) => {
                              if (input) input.indeterminate = checkboxIndeterminate;
                            }}
                            onChange={(e) => handleSelectAll(e.target.checked)}
                            disabled={selectMode === 'all' && isLoadingAll}
                            title={selectMode === 'page' ? 'Select all in page' : 'Select all in system'}
                          />
                        </th>
                      )}
                      <th>Code</th>
                      <th>Name</th>
                      <th>Location</th>
                      <th>Contact Person</th>
                      <th>Mobile</th>
                      <th>Sector</th>
                      <th>Plot</th>
                      <th>Status</th>
                      <th>Consultant</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.results.map((project: Project) => (
                      <tr key={project.id}>
                        {isAdmin && (
                          <td>
                            <Checkbox
                              checked={selectedItems.has(project.id)}
                              onChange={(e) => handleSelectItem(project.id, e.target.checked)}
                            />
                          </td>
                        )}
                        <td>
                          <div className="font-medium text-foreground">{project.code}</div>
                        </td>
                        <td>
                          <div className="text-foreground max-w-md truncate" title={project.name}>
                            {project.name}
                          </div>
                        </td>
                        <td>
                          <div className="text-muted-foreground">
                            {project.location || '—'}
                          </div>
                        </td>
                        <td>
                          <div className="text-muted-foreground">
                            {project.contact_person || '—'}
                          </div>
                        </td>
                        <td>
                          <div className="text-muted-foreground">
                            {project.mobile_number || '—'}
                          </div>
                        </td>
                        <td>
                          <div className="text-muted-foreground">
                            {project.sector || '—'}
                          </div>
                        </td>
                        <td>
                          <div className="text-muted-foreground">
                            {project.plot || '—'}
                          </div>
                        </td>
                        <td>
                          <Badge variant={statusColors[project.project_status] || 'info'}>
                            {statusLabels[project.project_status] || project.project_status}
                          </Badge>
                        </td>
                        <td>
                          <div className="text-muted-foreground max-w-xs truncate" title={project.consultant}>
                            {project.consultant || '—'}
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <Link href={`/projects/view/${project.id}`}>
                              <Button variant="view" size="sm">View</Button>
                            </Link>
                            {isAdmin && (
                              <>
                                <Link href={`/projects/${project.id}`}>
                                  <Button variant="edit" size="sm">Edit</Button>
                                </Link>
                                {user?.is_superuser && (
                                  <Button
                                    variant="delete"
                                    size="sm"
                                    onClick={() => handleDelete(project.id)}
                                    disabled={deleteMutation.isPending}
                                    isLoading={deleteMutation.isPending}
                                  >
                                    Delete
                                  </Button>
                                )}
                              </>
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
                  Showing {((page - 1) * 50) + 1} to {Math.min(page * 50, data.count)} of {data.count} projects
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

