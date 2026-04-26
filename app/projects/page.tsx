'use client';

import { useState, useRef } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '@/lib/api/projects';
import { Project } from '@/types';
import Link from 'next/link';
import { toast } from '@/lib/hooks/use-toast';
import { confirm } from '@/lib/hooks/use-toast';
import { useAuth } from '@/lib/hooks/use-auth';
import { usePermissions } from '@/lib/hooks/use-permissions';
import { Button, TextField, Checkbox, Loader, Badge } from '@/components/ui';
import { exportToExcel, fetchAllPages } from '@/lib/utils/export-excel';
import BilingualName from '@/components/ui/BilingualName';
import { useT } from '@/lib/i18n/useT';

const statusColors: Record<string, 'success' | 'info' | 'warning' | 'error'> = {
  on_going: 'success',
  completed: 'info',
  on_hold: 'warning',
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
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [selectMode, setSelectMode] = useState<'page' | 'all'>('page');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const importFileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const t = useT();
  const { hasPermission } = usePermissions();
  const isSuperuser = user?.is_superuser ?? false;
  const isAdmin = isSuperuser || user?.role === 'super_admin' || user?.is_staff;
  const canCreate = isSuperuser || (hasPermission('project', 'create') ?? false);
  const canDelete = isSuperuser;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const allProjects = await fetchAllPages<Project>(
        (p, ps) => projectsApi.getAll({ page: p, page_size: ps, search }),
      );
      exportToExcel<Project>(
        allProjects,
        [
          { header: 'Code',           key: 'code',           width: 15 },
          { header: 'Name',           key: 'name',           width: 40 },
          { header: 'Name AR',        key: 'name_ar',        width: 40 },
          { header: 'Location',       key: 'location',       width: 30 },
          { header: 'Contact Person', key: 'contact_person', width: 25 },
          { header: 'Mobile Number',  key: 'mobile_number',  width: 18 },
          { header: 'Sector',         key: 'sector',         width: 20 },
          { header: 'Plot',           key: 'plot',           width: 15 },
          { header: 'Consultant',     key: 'consultant',     width: 25 },
          { header: 'Status',         key: 'project_status', width: 15 },
          { header: 'Active',         key: (r) => r.is_active ? 'Yes' : 'No', width: 10 },
          { header: 'Description',    key: 'description',    width: 40 },
        ],
        `Projects_Export_${new Date().toISOString().slice(0, 10)}`,
        'Projects',
      );
      toast(`Exported ${allProjects.length} projects`, 'success');
    } catch {
      toast('Export failed', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setIsImporting(true);
    try {
      const result = await projectsApi.importExcel(file);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast(`Import done: ${result.created} created, ${result.updated} updated, ${result.skipped} skipped`, 'success');
    } catch {
      toast('Import failed', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['projects', page, search],
    queryFn: () => projectsApi.getAll({ page, search }),
  });

  const { data: allProjectsData, isLoading: isLoadingAll } = useQuery({
    queryKey: ['projects', 'all-ids', search],
    queryFn: async () => {
      const allIds: number[] = [];
      let currentPage = 1;
      let hasMore = true;
      while (hasMore) {
        const response = await projectsApi.getAll({ page: currentPage, search });
        allIds.push(...response.results.map((p: Project) => p.id));
        hasMore = !!response.next;
        currentPage++;
        if (currentPage > 100) break;
      }
      return allIds;
    },
    enabled: selectMode === 'all' && isAdmin,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => projectsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast('Project deleted', 'success');
    },
    onError: () => toast('Failed to delete project', 'error'),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      await Promise.all(ids.map(id => projectsApi.delete(id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      const count = selectedItems.size;
      setSelectedItems(new Set());
      toast(`${count} projects deleted successfully`, 'success');
    },
    onError: () => toast('Failed to delete some projects', 'error'),
  });

  const handleDelete = async (id: number) => {
    if (await confirm('Delete this project?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      if (selectMode === 'page' && data?.results) {
        setSelectedItems(new Set(data.results.map((p: Project) => p.id)));
      } else if (selectMode === 'all' && allProjectsData) {
        setSelectedItems(new Set(allProjectsData));
      }
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (id: number, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) newSelected.add(id);
    else newSelected.delete(id);
    setSelectedItems(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;
    if (await confirm(`Delete ${selectedItems.size} project(s)?`)) {
      bulkDeleteMutation.mutate(Array.from(selectedItems));
    }
  };

  const currentPageIds = data?.results?.map((p: Project) => p.id) || [];
  const allPageSelected = currentPageIds.length > 0 && currentPageIds.every(id => selectedItems.has(id));
  const somePageSelected = currentPageIds.some(id => selectedItems.has(id)) && !allPageSelected;

  const allSystemSelected = selectMode === 'all' && allProjectsData &&
    allProjectsData.length > 0 &&
    allProjectsData.every(id => selectedItems.has(id));
  const someSystemSelected = selectMode === 'all' && allProjectsData &&
    allProjectsData.some(id => selectedItems.has(id)) &&
    !allSystemSelected;

  const checkboxChecked = selectMode === 'page' ? allPageSelected : (allSystemSelected ?? false);
  const checkboxIndeterminate = selectMode === 'page' ? somePageSelected : (someSystemSelected ?? false);

  const totalCount = data?.count ?? 0;
  const totalPages = Math.ceil(totalCount / 20);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Projects</h1>
            <p className="text-sm text-muted-foreground mt-1">{totalCount} total projects</p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <div className="flex items-center gap-2 border-r border-border pr-2 mr-2">
                <span className="text-xs text-muted-foreground">{t('btn', 'selectAll')}:</span>
                <Button
                  variant={selectMode === 'page' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => { setSelectMode('page'); setSelectedItems(new Set()); }}
                >
                  {t('btn', 'selectPage')}
                </Button>
                <Button
                  variant={selectMode === 'all' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => { setSelectMode('all'); setSelectedItems(new Set()); }}
                >
                  {t('btn', 'selectAllSys')}
                </Button>
              </div>
            )}
            {canDelete && selectedItems.size > 0 && (
              <Button
                variant="destructive"
                onClick={handleBulkDelete}
                disabled={bulkDeleteMutation.isPending}
                isLoading={bulkDeleteMutation.isPending}
              >
                {bulkDeleteMutation.isPending ? t('btn', 'deleting') : `${t('btn', 'delete')} ${selectedItems.size}`}
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={handleExport}
              isLoading={isExporting}
              disabled={isExporting}
            >
              {isExporting ? t('btn', 'exporting') : `⬇ ${t('btn', 'export')}`}
            </Button>
            {isAdmin && (
              <>
                <input
                  ref={importFileRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleImport}
                />
                <Button
                  variant="secondary"
                  onClick={() => importFileRef.current?.click()}
                  isLoading={isImporting}
                  disabled={isImporting}
                >
                  {isImporting ? t('btn', 'importing') : `⬆ ${t('btn', 'import')}`}
                </Button>
              </>
            )}
            {canCreate && (
              <Link href="/projects/new">
                <Button variant="primary">+ New Project</Button>
              </Link>
            )}
          </div>
        </div>

        {/* Search */}
        <TextField
          placeholder="Search projects..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />

        {/* Content */}
        {isLoading ? (
          <div className="card text-center py-12"><Loader /></div>
        ) : error ? (
          <div className="card text-center py-12">
            <p className="text-destructive">Failed to load projects</p>
          </div>
        ) : !data?.results || data.results.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-muted-foreground">No projects found</p>
            {canCreate && (
              <Link href="/projects/new">
                <Button variant="primary" className="mt-4">Create Project</Button>
              </Link>
            )}
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
                              if (input) input.indeterminate = checkboxIndeterminate ?? false;
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
                      <th>Status</th>
                      <th>Active</th>
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
                        <td className="font-mono text-sm">{project.code}</td>
                        <td>
                          <Link href={`/projects/view/${project.id}`} className="text-primary hover:underline font-medium">
                            <BilingualName nameEn={project.name} nameAr={project.name_ar} />
                          </Link>
                        </td>
                        <td className="text-muted-foreground">{project.location || '—'}</td>
                        <td>
                          <Badge variant={statusColors[project.project_status] || 'info'}>
                            {statusLabels[project.project_status] || project.project_status}
                          </Badge>
                        </td>
                        <td>
                          <Badge variant={project.is_active ? 'success' : 'error'}>
                            {project.is_active ? 'Yes' : 'No'}
                          </Badge>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <Link href={`/projects/view/${project.id}`}>
                              <Button variant="view" size="sm">View</Button>
                            </Link>
                            <Link href={`/projects/${project.id}`}>
                              <Button variant="edit" size="sm">Edit</Button>
                            </Link>
                            {canDelete && (
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
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between card">
                <div className="text-sm text-muted-foreground">
                  {t('misc', 'showing')} {((page - 1) * 20) + 1} {t('misc', 'pageTo')} {Math.min(page * 20, totalCount)} {t('misc', 'pageOf')} {totalCount} projects
                  {selectMode === 'all' && selectedItems.size > 0 && (
                    <span className="ml-2 text-foreground font-medium">({selectedItems.size} selected)</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                    {t('btn', 'previous')}
                  </Button>
                  <Button variant="secondary" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                    {t('btn', 'next')}
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
