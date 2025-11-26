'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { projectsApi } from '@/lib/api/projects';
import MainLayout from '@/components/layout/MainLayout';
import Link from 'next/link';
import { toast } from '@/lib/hooks/use-toast';
import SearchableDropdown from '@/components/ui/SearchableDropdown';
import FormField from '@/components/ui/FormField';

const statusOptions = [
  { value: 'on_going', label: 'On Going' },
  { value: 'completed', label: 'Completed' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function NewProjectPage() {
  const router = useRouter();
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

  const mutation = useMutation({
    mutationFn: projectsApi.create,
    onSuccess: () => {
      toast('Project created successfully!', 'success');
      router.push('/projects');
    },
    onError: (error: any) => {
      toast(error?.response?.data?.detail || 'Failed to create project', 'error');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <MainLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
        {/* Header Section - Unified */}
        <div>
          <Link 
            href="/projects" 
            className="text-sm mb-2 inline-block"
            style={{ 
              color: 'var(--text-secondary)',
              textDecoration: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            ← Back to Projects
          </Link>
          <h1 style={{ 
            fontSize: 'var(--font-2xl)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--text-primary)',
            margin: 0,
            marginBottom: 'var(--spacing-1)',
          }}>
            Add New Project
          </h1>
          <p style={{ 
            fontSize: 'var(--font-sm)',
            color: 'var(--text-secondary)',
            margin: 0,
          }}>
            Create a new project
          </p>
        </div>

        {/* Form Card - Unified */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
          {/* Basic Information */}
          <div className="card">
            <h2 style={{ 
              fontSize: 'var(--font-lg)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-primary)',
              margin: 0,
              marginBottom: 'var(--spacing-4)',
            }}>
              Basic Information
            </h2>
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: 'var(--spacing-4)',
            }}>
              <FormField label="Project Code" required>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="input"
                />
              </FormField>

              <div style={{ gridColumn: 'span 2' }}>
                <FormField label="Project Name" required>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                  />
                </FormField>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <FormField label="Location">
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="input"
                  />
                </FormField>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <FormField label="Description">
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="input"
                  />
                </FormField>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="card">
            <h2 style={{ 
              fontSize: 'var(--font-lg)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-primary)',
              margin: 0,
              marginBottom: 'var(--spacing-4)',
            }}>
              Contact Information
            </h2>
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: 'var(--spacing-4)',
            }}>
              <FormField label="Contact Person">
                <input
                  type="text"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  className="input"
                />
              </FormField>

              <div style={{ gridColumn: 'span 2' }}>
                <FormField label="Mobile Number">
                  <input
                    type="text"
                    value={formData.mobile_number}
                    onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                    className="input"
                  />
                </FormField>
              </div>
            </div>
          </div>

          {/* Project Details */}
          <div className="card">
            <h2 style={{ 
              fontSize: 'var(--font-lg)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-primary)',
              margin: 0,
              marginBottom: 'var(--spacing-4)',
            }}>
              Project Details
            </h2>
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: 'var(--spacing-4)',
            }}>
              <FormField label="Sector">
                <input
                  type="text"
                  value={formData.sector}
                  onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                  className="input"
                />
              </FormField>

              <FormField label="Plot">
                <input
                  type="text"
                  value={formData.plot}
                  onChange={(e) => setFormData({ ...formData, plot: e.target.value })}
                  className="input"
                />
              </FormField>

              <FormField label="Consultant">
                <input
                  type="text"
                  value={formData.consultant}
                  onChange={(e) => setFormData({ ...formData, consultant: e.target.value })}
                  className="input"
                />
              </FormField>
            </div>
          </div>

          {/* Status */}
          <div className="card">
            <h2 style={{ 
              fontSize: 'var(--font-lg)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-primary)',
              margin: 0,
              marginBottom: 'var(--spacing-4)',
            }}>
              Status
            </h2>
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: 'var(--spacing-4)',
            }}>
              <FormField label="Project Status">
                <SearchableDropdown
                  options={statusOptions.map((option) => ({
                    value: option.value,
                    label: option.label,
                  }))}
                  value={formData.project_status}
                  onChange={(val) => setFormData({ ...formData, project_status: val as any })}
                  placeholder="Select Status"
                />
              </FormField>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  style={{ width: '16px', height: '16px' }}
                />
                <label 
                  htmlFor="is_active" 
                  style={{ 
                    fontSize: 'var(--font-sm)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                  }}
                >
                  Is Active
                </label>
              </div>
            </div>
          </div>

          {/* Form Actions - Unified */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-3)' }}>
            <Link href="/projects" className="btn btn-secondary">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="btn btn-primary"
            >
              {mutation.isPending ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
