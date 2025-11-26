'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '@/lib/api/projects';
import MainLayout from '@/components/layout/MainLayout';
import Link from 'next/link';
import { toast } from '@/lib/hooks/use-toast';
import SearchableDropdown from '@/components/ui/SearchableDropdown';

const statusOptions = [
  { value: 'on_going', label: 'On Going' },
  { value: 'completed', label: 'Completed' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  const queryClient = useQueryClient();

  const { data: project, isLoading } = useQuery({
    queryKey: ['projects', id],
    queryFn: () => projectsApi.getById(id),
  });

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    location: '',
    contact_person: '',
    mobile_number: '',
    sector: '',
    plot: '',
    project_status: 'on_going' as 'on_going' | 'completed' | 'on_hold' | 'cancelled',
    consultant: '',
    description: '',
    is_active: true,
  });

  useEffect(() => {
    if (project) {
      setFormData({
        code: project.code || '',
        name: project.name || '',
        location: project.location || '',
        contact_person: project.contact_person || '',
        mobile_number: project.mobile_number || '',
        sector: project.sector || '',
        plot: project.plot || '',
        project_status: project.project_status || 'on_going',
        consultant: project.consultant || '',
        description: project.description || '',
        is_active: project.is_active ?? true,
      });
    }
  }, [project]);

  const mutation = useMutation({
    mutationFn: (data: typeof formData) => projectsApi.update(id, data),
    onSuccess: () => {
      toast('Project updated successfully!', 'success');
      queryClient.invalidateQueries({ queryKey: ['projects', id] });
      router.push('/projects');
    },
    onError: (error: any) => {
      toast(error?.response?.data?.detail || 'Failed to update project', 'error');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="card text-center py-12">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!project) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="card text-center py-12">
            <p className="text-muted-foreground">Project not found</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <Link href="/projects" className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-block">
            ← Back to Projects
          </Link>
          <h1 className="text-2xl font-semibold text-foreground">Edit Project</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Update project information
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4 text-foreground">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label 
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: 'var(--foreground)' }}
                >
                  Project Code *
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full"
                />
              </div>

              <div className="md:col-span-2">
                <label 
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: 'var(--foreground)' }}
                >
                  Project Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full"
                />
              </div>

              <div className="md:col-span-3">
                <label 
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: 'var(--foreground)' }}
                >
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full"
                />
              </div>

              <div className="md:col-span-3">
                <label 
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: 'var(--foreground)' }}
                >
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4 text-foreground">Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label 
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: 'var(--foreground)' }}
                >
                  Contact Person
                </label>
                <input
                  type="text"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  className="w-full"
                />
              </div>

              <div className="md:col-span-2">
                <label 
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: 'var(--foreground)' }}
                >
                  Mobile Number
                </label>
                <input
                  type="text"
                  value={formData.mobile_number}
                  onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Project Details */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4 text-foreground">Project Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label 
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: 'var(--foreground)' }}
                >
                  Sector
                </label>
                <input
                  type="text"
                  value={formData.sector}
                  onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                  className="w-full"
                />
              </div>

              <div>
                <label 
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: 'var(--foreground)' }}
                >
                  Plot
                </label>
                <input
                  type="text"
                  value={formData.plot}
                  onChange={(e) => setFormData({ ...formData, plot: e.target.value })}
                  className="w-full"
                />
              </div>

              <div>
                <label 
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: 'var(--foreground)' }}
                >
                  Consultant
                </label>
                <input
                  type="text"
                  value={formData.consultant}
                  onChange={(e) => setFormData({ ...formData, consultant: e.target.value })}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4 text-foreground">Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <SearchableDropdown
                  label="Project Status"
                  options={statusOptions.map((option) => ({
                    value: option.value,
                    label: option.label,
                  }))}
                  value={formData.project_status}
                  onChange={(val) => setFormData({ ...formData, project_status: val as any })}
                  placeholder="Select Status"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4"
                />
                <label 
                  htmlFor="is_active" 
                  className="text-sm"
                  style={{ color: 'var(--foreground)' }}
                >
                  Is Active
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <Link href="/projects" className="btn btn-secondary">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="btn btn-primary"
            >
              {mutation.isPending ? 'Updating...' : 'Update Project'}
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}

