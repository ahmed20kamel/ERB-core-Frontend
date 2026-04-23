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
import { usePermissions } from '@/lib/hooks/use-permissions';
import { Button, TextField, Loader, Badge } from '@/components/ui';
import BilingualName from '@/components/ui/BilingualName';
import { useT } from '@/lib/i18n/useT';

const statusColors: Record<string, string> = {
  on_going: 'badge-success',
  completed: 'badge-info',
  on_hold: 'badge-warning',
  cancelled: 'badge-error',
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
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const t = useT();
  const { hasPermission } = usePermissions();
  const isSuperuser = user?.is_superuser ?? false;
  const isAdmin = isSuperuser || user?.role === 'super_admin' || user?.is_staff;
  const canCreate = isSuperuser || (hasPermission('project', 'create') ?? false);
  const canDelete = isSuperuser;

  const { data, isLoading, error } = useQuery({
    queryKey: ['projects', page, search],
    queryFn: () => projectsApi.getAll({ page, search }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => projectsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast('Project deleted', 'success');
    },
    onError: () => toast('Failed to delete project', 'error'),
  });

  const handleDelete = async (id: number) => {
    if (await confirm('Delete this project?')) {
      deleteMutation.mutate(id);
    }
  };

  const projects = data?.results ?? [];
  const totalCount = data?.count ?? 0;
  const totalPages = Math.ceil(totalCount / 20);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Projects</h1>
            <p className="text-sm text-muted-foreground mt-1">{totalCount} total projects</p>
          </div>
          {canCreate && (
            <Link href="/projects/new">
              <Button variant="primary">+ New Project</Button>
            </Link>
          )}
        </div>

        <TextField
          placeholder="Search projects..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />

        {isLoading ? (
          <div className="card text-center py-12"><Loader /></div>
        ) : error ? (
          <div className="card text-center py-12">
            <p className="text-destructive">Failed to load projects</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-muted-foreground">No projects found</p>
            {canCreate && (
              <Link href="/projects/new">
                <Button variant="primary" className="mt-4">Create Project</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="card overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project: Project) => (
                  <tr key={project.id}>
                    <td className="font-mono text-sm">{project.code}</td>
                    <td>
                      <Link href={`/projects/view/${project.id}`} className="text-primary hover:underline font-medium">
                        <BilingualName nameEn={project.name} nameAr={project.name_ar} />
                      </Link>
                    </td>
                    <td className="text-muted-foreground">{project.location || '—'}</td>
                    <td>
                      <span className={`badge ${statusColors[project.project_status] || 'badge-info'}`}>
                        {statusLabels[project.project_status] || project.project_status}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${project.is_active ? 'badge-success' : 'badge-error'}`}>
                        {project.is_active ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <Link href={`/projects/view/${project.id}`}>
                          <Button variant="secondary" size="sm">View</Button>
                        </Link>
                        <Link href={`/projects/${project.id}`}>
                          <Button variant="edit" size="sm">Edit</Button>
                        </Link>
                        {canDelete && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(project.id)}
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
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <Button variant="secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <span className="flex items-center px-4 text-sm text-muted-foreground">Page {page} of {totalPages}</span>
            <Button variant="secondary" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
