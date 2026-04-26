'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { projectsApi } from '@/lib/api/projects';
import { usersApi } from '@/lib/api/users';
import { User } from '@/types';
import { Button } from '@/components/ui';
import MainLayout from '@/components/layout/MainLayout';
import Link from 'next/link';
import { toast } from '@/lib/hooks/use-toast';
import SearchableDropdown from '@/components/ui/SearchableDropdown';
import FormField from '@/components/ui/FormField';
import { useT } from '@/lib/i18n/useT';

const statusOptions = [
  { value: 'on_going',   label: 'On Going'   },
  { value: 'completed',  label: 'Completed'  },
  { value: 'on_hold',    label: 'On Hold'    },
  { value: 'cancelled',  label: 'Cancelled'  },
];

export default function NewProjectPage() {
  const t = useT();
  const router = useRouter();

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    name_ar: '',
    location: '',
    contact_person: '',
    mobile_number: '',
    sector: '',
    plot: '',
    project_status: 'on_going' as 'on_going' | 'completed' | 'on_hold' | 'cancelled',
    consultant: '',
    description: '',
    responsible_engineer: null as number | null,
    is_active: true,
  });

  const { data: engineersData } = useQuery({
    queryKey: ['users', 'site_engineers'],
    queryFn: () => usersApi.getAll({ role: 'site_engineer', page_size: 200, is_active: true }),
  });
  const engineers: User[] = engineersData?.results ?? [];

  const handleEngineerChange = (val: string | number | null) => {
    const id = val ? Number(val) : null;
    const eng = engineers.find(e => e.id === id);
    setFormData(f => ({
      ...f,
      responsible_engineer: id,
      mobile_number: eng?.phone ?? f.mobile_number,
    }));
  };

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

  const selectedEngineer = engineers.find(e => e.id === formData.responsible_engineer);

  return (
    <MainLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
        {/* Header */}
        <div>
          <Link
            href="/projects"
            className="text-sm mb-2 inline-block"
            style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            ← {t('btn', 'back')} {t('page', 'projects')}
          </Link>
          <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)', margin: 0, marginBottom: 'var(--spacing-1)' }}>
            {t('page', 'newProject')}
          </h1>
          <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', margin: 0 }}>
            {t('page', 'newProjectSubtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>

          {/* Basic Information */}
          <div className="card">
            <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)', margin: 0, marginBottom: 'var(--spacing-4)' }}>
              {t('section', 'basicInfo')}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-4)' }}>
              <FormField label={t('field', 'projectCode')} required>
                <input type="text" required value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })} className="input" />
              </FormField>

              <div style={{ gridColumn: 'span 2' }}>
                <FormField label={t('field', 'projectName')} required>
                  <input type="text" required value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input" />
                </FormField>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <FormField label={t('field', 'projectNameAr')}>
                  <input type="text" className="input" dir="rtl" placeholder="اسم المشروع بالعربي"
                    value={formData.name_ar}
                    onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })} />
                </FormField>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <FormField label={t('field', 'location')}>
                  <input type="text" value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="input" />
                </FormField>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <FormField label={t('field', 'description')}>
                  <textarea value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3} className="input" />
                </FormField>
              </div>
            </div>
          </div>

          {/* Responsible Engineer */}
          <div className="card">
            <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)', margin: 0, marginBottom: 'var(--spacing-1)' }}>
              {t('section', 'contactInfo')}
            </h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              {t('field', 'staffMember')} — {t('role', 'site_engineer')}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-4)' }}>

              {/* Engineer selector */}
              <div style={{ gridColumn: '1 / -1' }}>
                <FormField label={`${t('role', 'site_engineer')} (${t('misc', 'optional')})`}>
                  <SearchableDropdown
                    options={[
                      { value: '', label: `— ${t('misc', 'selectRole')} —` },
                      ...engineers.map(e => ({
                        value: String(e.id),
                        label: `${e.first_name} ${e.last_name}`.trim() || e.username,
                        sublabel: e.phone || '',
                      })),
                    ]}
                    value={formData.responsible_engineer ? String(formData.responsible_engineer) : ''}
                    onChange={handleEngineerChange}
                    placeholder={`${t('misc', 'selectRole')}...`}
                  />
                </FormField>

                {/* Engineer info card — shown when selected */}
                {selectedEngineer && (
                  <div
                    className="mt-2 flex items-center gap-3 px-3 py-2 rounded-lg"
                    style={{ background: 'var(--sidebar-active-bg)', border: '1px solid var(--color-primary)' }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ background: 'var(--color-primary)', color: '#fff' }}
                    >
                      {(selectedEngineer.first_name?.[0] ?? selectedEngineer.username[0]).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                        {`${selectedEngineer.first_name} ${selectedEngineer.last_name}`.trim() || selectedEngineer.username}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {selectedEngineer.job_title || t('role', 'site_engineer')}
                        {selectedEngineer.phone ? ` · ${selectedEngineer.phone}` : ''}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData(f => ({ ...f, responsible_engineer: null }))}
                      className="text-xs px-2 py-1 rounded"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              <FormField label={t('field', 'contactPerson')}>
                <input type="text" value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  className="input" placeholder={t('misc', 'optional')} />
              </FormField>

              <FormField label={t('field', 'mobileNumber')}>
                <input type="text" value={formData.mobile_number}
                  onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                  className="input"
                  placeholder={selectedEngineer ? '' : t('misc', 'optional')}
                />
              </FormField>
            </div>
          </div>

          {/* Project Details */}
          <div className="card">
            <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)', margin: 0, marginBottom: 'var(--spacing-4)' }}>
              {t('section', 'projectDetails')}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-4)' }}>
              <FormField label={t('field', 'sector')}>
                <input type="text" value={formData.sector}
                  onChange={(e) => setFormData({ ...formData, sector: e.target.value })} className="input" />
              </FormField>
              <FormField label={t('field', 'plot')}>
                <input type="text" value={formData.plot}
                  onChange={(e) => setFormData({ ...formData, plot: e.target.value })} className="input" />
              </FormField>
              <FormField label={t('field', 'consultant')}>
                <input type="text" value={formData.consultant}
                  onChange={(e) => setFormData({ ...formData, consultant: e.target.value })} className="input" />
              </FormField>
            </div>
          </div>

          {/* Status */}
          <div className="card">
            <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)', margin: 0, marginBottom: 'var(--spacing-4)' }}>
              {t('section', 'status')}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-4)' }}>
              <FormField label={t('field', 'projectStatus')}>
                <SearchableDropdown
                  options={statusOptions}
                  value={formData.project_status}
                  onChange={(val) => setFormData({ ...formData, project_status: val as any })}
                  placeholder="Select Status"
                />
              </FormField>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                <input type="checkbox" id="is_active" checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  style={{ width: '16px', height: '16px' }} />
                <label htmlFor="is_active" style={{ fontSize: 'var(--font-sm)', color: 'var(--text-primary)', cursor: 'pointer' }}>
                  {t('field', 'isActive')}
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Link href="/projects"><Button variant="secondary">{t('btn', 'cancel')}</Button></Link>
            <Button type="submit" variant="primary" disabled={mutation.isPending} isLoading={mutation.isPending}>
              {t('btn', 'create')}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
