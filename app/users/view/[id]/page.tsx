'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/lib/api/users';
import { projectsApi } from '@/lib/api/projects';
import { Project } from '@/types';
import MainLayout from '@/components/layout/MainLayout';
import Link from 'next/link';
import EntityHeader from '@/components/ui/EntityHeader';
import { useAuth } from '@/lib/hooks/use-auth';
import { useT } from '@/lib/i18n/useT';
import { BuildingIcon } from '@/components/icons';

const STATUS_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  on_going:  { bg: '#DBEAFE', color: '#1E40AF', label: 'On Going'  },
  completed: { bg: '#D1FAE5', color: '#065F46', label: 'Completed' },
  on_hold:   { bg: '#FEF3C7', color: '#92400E', label: 'On Hold'   },
  cancelled: { bg: '#FEE2E2', color: '#991B1B', label: 'Cancelled' },
};

const ROLE_BADGE: Record<string, string> = {
  site_engineer:        'badge-success',
  procurement_manager:  'badge-warning',
  procurement_officer:  'badge-info',
  super_admin:          'badge-error',
};

const ROLE_LABEL: Record<string, string> = {
  site_engineer:        'Site Engineer',
  procurement_manager:  'Procurement Manager',
  procurement_officer:  'Procurement Officer',
  super_admin:          'Super Admin',
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 'var(--font-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-1)' }}>
        {label}
      </label>
      <div style={{ fontSize: 'var(--font-base)', color: 'var(--text-primary)' }}>
        {value || <span style={{ color: 'var(--text-tertiary)' }}>—</span>}
      </div>
    </div>
  );
}

export default function UserDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const { user: currentUser } = useAuth();
  const t = useT();

  const { data: user, isLoading } = useQuery({
    queryKey: ['users', id],
    queryFn: () => usersApi.getById(id),
  });

  const { data: projectsData } = useQuery({
    queryKey: ['projects', 'by-engineer', id],
    queryFn: () => projectsApi.getAll({ responsible_engineer: id, page_size: 50, is_active: true }),
    enabled: !!user && user.role === 'site_engineer',
  });

  const projects: Project[] = projectsData?.results ?? [];

  if (isLoading) {
    return (
      <MainLayout>
        <div className="card text-center py-12">
          <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    return (
      <MainLayout>
        <div className="card text-center py-12">
          <p style={{ color: 'var(--text-secondary)' }}>User not found</p>
        </div>
      </MainLayout>
    );
  }

  const displayName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username;

  return (
    <MainLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>

        {/* Header */}
        <EntityHeader
          title={displayName}
          subtitle={user.email}
          image={user.avatar_url || user.avatar || null}
          imageAlt={displayName}
          entityType="user"
          statusBadge={user.is_active ? 'Active' : 'Inactive'}
          statusVariant={user.is_active ? 'success' : 'error'}
          backHref="/users"
          backLabel="Back to Users"
          actions={
            <Link href={`/users/${id}`} className="btn btn-edit">
              {t('btn', 'edit')}
            </Link>
          }
          imageSize={120}
        />

        {/* User Info */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            User Information
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--spacing-4)' }}>
            <InfoRow label="Username" value={user.username} />
            <InfoRow label="Email"    value={user.email} />
            <InfoRow label="Phone"    value={user.phone} />
            <InfoRow label="First Name" value={user.first_name} />
            <InfoRow label="Last Name"  value={user.last_name} />
            {user.full_name_ar && <InfoRow label="الاسم بالعربي" value={<span dir="rtl">{user.full_name_ar}</span>} />}
            {user.job_title    && <InfoRow label="Job Title"     value={user.job_title} />}
            <InfoRow label="Role" value={
              <span className={`badge ${ROLE_BADGE[user.role] ?? 'badge-info'}`}>
                {ROLE_LABEL[user.role] ?? user.role}
              </span>
            } />
            <InfoRow label="Account Status" value={
              <span className={`badge ${user.is_active ? 'badge-success' : 'badge-error'}`}>
                {user.is_active ? 'Active' : 'Inactive'}
              </span>
            } />
            {(user.is_staff || user.is_superuser) && (
              <InfoRow label="System Access" value={
                <span className="badge badge-warning">
                  {user.is_superuser ? 'Superuser' : 'Staff'}
                </span>
              } />
            )}
          </div>
        </div>

        {/* Responsible Projects — shown only for site engineers */}
        {user.role === 'site_engineer' && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BuildingIcon className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)', margin: 0 }}>
                  {t('page', 'projects')}
                </h3>
                {projects.length > 0 && (
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: 'var(--sidebar-active-bg)', color: 'var(--color-primary)' }}
                  >
                    {projects.length}
                  </span>
                )}
              </div>
            </div>

            {projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <BuildingIcon className="w-8 h-8 opacity-40" />
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {t('empty', 'noProjects')}
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--spacing-3)' }}>
                {projects.map((p) => {
                  const st = STATUS_BADGE[p.project_status] ?? STATUS_BADGE.on_going;
                  return (
                    <Link
                      key={p.id}
                      href={`/projects/view/${p.id}`}
                      style={{ textDecoration: 'none' }}
                    >
                      <div
                        className="rounded-xl p-4 transition-all duration-150 cursor-pointer"
                        style={{
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-secondary)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--color-primary)';
                          e.currentTarget.style.background = 'var(--sidebar-active-bg)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border-color)';
                          e.currentTarget.style.background = 'var(--bg-secondary)';
                        }}
                      >
                        {/* Project code + status */}
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded"
                            style={{ background: 'var(--sidebar-active-bg)', color: 'var(--color-primary)' }}>
                            #{p.code}
                          </span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: st.bg, color: st.color }}>
                            {st.label}
                          </span>
                        </div>

                        {/* Project name */}
                        <p className="text-sm font-semibold mb-2 leading-snug"
                          style={{ color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
                          {p.name}
                        </p>

                        {/* Location + Sector/Plot */}
                        <div className="space-y-1">
                          {p.location && (
                            <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                              <span>📍</span> {p.location}
                            </div>
                          )}
                          {(p.sector || p.plot) && (
                            <div className="flex items-center gap-1.5 text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                              <span>🗺</span>
                              {p.sector && <span>{p.sector}</span>}
                              {p.sector && p.plot && <span>·</span>}
                              {p.plot && <span>{t('viol', 'plot')} {p.plot}</span>}
                            </div>
                          )}
                          {p.consultant && (
                            <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                              <span>🏢</span> {p.consultant}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </MainLayout>
  );
}
