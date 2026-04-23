'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/lib/api/users';
import MainLayout from '@/components/layout/MainLayout';
import Link from 'next/link';
import EntityHeader from '@/components/ui/EntityHeader';
import { useAuth } from '@/lib/hooks/use-auth';

export default function UserDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  
  // Call all hooks at the top, before any conditional returns
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'super_admin' || currentUser?.is_staff;

  const { data: user, isLoading } = useQuery({
    queryKey: ['users', id],
    queryFn: () => usersApi.getById(id),
  });

  if (isLoading) {
    return (
      <MainLayout>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
          <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-12)' }}>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Loading...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    return (
      <MainLayout>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
          <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-12)' }}>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>User not found</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username;
  const displayName = fullName || user.username;

  return (
    <MainLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
        {/* Entity Header - Unified */}
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
            <>
              <Link href={`/users/${id}`} className="btn btn-edit">
                Edit
              </Link>
            </>
          }
          imageSize={120}
        />

        {/* User Information - Unified */}
        <div className="card">
          <h3 style={{ 
            fontSize: 'var(--font-lg)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--text-primary)',
            margin: 0,
            marginBottom: 'var(--spacing-4)',
          }}>
            User Information
          </h3>
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 'var(--spacing-4)',
          }}>
            <div>
              <label style={{ 
                display: 'block',
                fontSize: 'var(--font-sm)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--text-secondary)',
                marginBottom: 'var(--spacing-2)',
              }}>
                Username
              </label>
              <p style={{ 
                fontSize: 'var(--font-base)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--text-primary)',
                margin: 0,
              }}>
                {user.username}
              </p>
            </div>
            <div>
              <label style={{ 
                display: 'block',
                fontSize: 'var(--font-sm)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--text-secondary)',
                marginBottom: 'var(--spacing-2)',
              }}>
                Email
              </label>
              <p style={{ 
                fontSize: 'var(--font-base)',
                color: 'var(--text-primary)',
                margin: 0,
              }}>
                {user.email}
              </p>
            </div>
            <div>
              <label style={{ 
                display: 'block',
                fontSize: 'var(--font-sm)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--text-secondary)',
                marginBottom: 'var(--spacing-2)',
              }}>
                Role
              </label>
              <span className={`badge ${
                user.role === 'super_admin' ? 'badge-error' :
                user.role === 'procurement_manager' ? 'badge-warning' :
                user.role === 'procurement_officer' ? 'badge-info' :
                'badge-success'
              }`}>
                {{
                  site_engineer: 'Site Engineer',
                  procurement_manager: 'Procurement Manager',
                  procurement_officer: 'Procurement Officer',
                  super_admin: 'Super Admin',
                }[user.role] || user.role}
              </span>
            </div>
            <div>
              <label style={{ 
                display: 'block',
                fontSize: 'var(--font-sm)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--text-secondary)',
                marginBottom: 'var(--spacing-2)',
              }}>
                First Name
              </label>
              <p style={{ 
                fontSize: 'var(--font-base)',
                color: 'var(--text-primary)',
                margin: 0,
              }}>
                {user.first_name || '-'}
              </p>
            </div>
            <div>
              <label style={{ 
                display: 'block',
                fontSize: 'var(--font-sm)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--text-secondary)',
                marginBottom: 'var(--spacing-2)',
              }}>
                Last Name
              </label>
              <p style={{ 
                fontSize: 'var(--font-base)',
                color: 'var(--text-primary)',
                margin: 0,
              }}>
                {user.last_name || '-'}
              </p>
            </div>
            {user.job_title && (
              <div>
                <label style={{ 
                  display: 'block',
                  fontSize: 'var(--font-sm)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--text-secondary)',
                  marginBottom: 'var(--spacing-2)',
                }}>
                  Job Title
                </label>
                <p style={{ 
                  fontSize: 'var(--font-base)',
                  color: 'var(--text-primary)',
                  margin: 0,
                }}>
                  {user.job_title}
                </p>
              </div>
            )}
            <div>
              <label style={{ 
                display: 'block',
                fontSize: 'var(--font-sm)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--text-secondary)',
                marginBottom: 'var(--spacing-2)',
              }}>
                Phone
              </label>
              <p style={{ 
                fontSize: 'var(--font-base)',
                color: 'var(--text-primary)',
                margin: 0,
              }}>
                {user.phone || '-'}
              </p>
            </div>
            <div>
              <label style={{
                display: 'block',
                fontSize: 'var(--font-sm)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--text-secondary)',
                marginBottom: 'var(--spacing-2)',
              }}>
                Account Status
              </label>
              <span className={`badge ${user.is_active ? 'badge-success' : 'badge-error'}`}>
                {user.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            {(user.is_staff || user.is_superuser) && (
              <div>
                <label style={{
                  display: 'block',
                  fontSize: 'var(--font-sm)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--text-secondary)',
                  marginBottom: 'var(--spacing-2)',
                }}>
                  System Access
                </label>
                <span className="badge badge-warning">
                  {user.is_superuser ? 'Superuser' : 'Staff'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

