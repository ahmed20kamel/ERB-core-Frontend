'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { usersApi } from '@/lib/api/users';
import MainLayout from '@/components/layout/MainLayout';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/use-auth';
import { toast } from '@/lib/hooks/use-toast';
import SearchableDropdown from '@/components/ui/SearchableDropdown';
import FormField from '@/components/ui/FormField';
import { Button } from '@/components/ui';
import Image from 'next/image';

const roles = [
  {
    value: 'site_engineer',
    label: 'Site Engineer - مهندس الموقع',
    description: 'Create purchase requests, receive materials (GRN), add notes'
  },
  {
    value: 'procurement_manager',
    label: 'Procurement Manager - مدير المشتريات',
    description: 'الموافقة على الطلبات، اختيار أفضل سعر، الموافقة على LPO'
  },
  {
    value: 'procurement_officer',
    label: 'Procurement Officer - موظف المشتريات',
    description: 'إعداد Quotation Requests، إدخال الأسعار، إنشاء LPO و Invoice'
  },
  {
    value: 'super_admin',
    label: 'Super Admin - المدير الرئيسي',
    description: 'جميع الصلاحيات بما فيها الحذف وإدارة النظام'
  },
];

export default function NewUserPage() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
    full_name_ar: '',
    phone: '',
    role: 'site_engineer',
    is_staff: false,
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => {
      toast('User created successfully', 'success');
      router.push('/users');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.detail ||
                          error?.response?.data?.message ||
                          (typeof error?.response?.data === 'object' && error?.response?.data !== null
                            ? Object.values(error.response.data).flat().join(', ')
                            : 'Failed to create user. Please try again.');
      toast(errorMessage, 'error');
    },
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast('Please select an image file', 'error');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast('Image size must be less than 5MB', 'error');
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.password2) {
      toast('Passwords do not match', 'error');
      return;
    }
    const { password2, ...submitData } = formData;
    if (avatarFile) {
      (submitData as any).avatar = avatarFile;
    }
    mutation.mutate({
      ...submitData,
      role: submitData.role as 'site_engineer' | 'procurement_manager' | 'procurement_officer' | 'super_admin',
    });
  };

  if (currentUser?.role !== 'super_admin' && !currentUser?.is_superuser) {
    return (
      <MainLayout>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
          <div className="card" style={{
            borderColor: 'var(--color-error)',
            backgroundColor: 'var(--color-error-light)',
          }}>
            <p style={{
              color: 'var(--color-error)',
              fontSize: 'var(--font-sm)',
              margin: 0,
            }}>
              Access Denied. Admin access required.
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
        {/* Header Section */}
        <div>
          <Link
            href="/users"
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
            ← Back to Users
          </Link>
          <h1 style={{
            fontSize: 'var(--font-2xl)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--text-primary)',
            margin: 0,
            marginBottom: 'var(--spacing-1)',
          }}>
            Add New User
          </h1>
          <p style={{
            fontSize: 'var(--font-sm)',
            color: 'var(--text-secondary)',
            margin: 0,
          }}>
            Create a new user account
          </p>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="card">
          {/* Avatar Upload Section */}
          <div style={{ marginBottom: 'var(--spacing-6)' }}>
            <label
              style={{
                display: 'block',
                fontSize: 'var(--font-sm)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--text-secondary)',
                marginBottom: 'var(--spacing-2)',
              }}
            >
              Profile Picture
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)' }}>
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  backgroundColor: 'var(--bg-tertiary)',
                  border: '2px solid var(--border-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {avatarPreview ? (
                  <Image
                    src={avatarPreview}
                    alt="Avatar preview"
                    width={80}
                    height={80}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
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
                      fontSize: 'var(--font-xl)',
                      fontWeight: 'var(--font-weight-bold)',
                    }}
                  >
                    {(formData.username || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: 'none' }}
                />
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-secondary"
                  size="sm"
                >
                  {avatarPreview ? 'Change Photo' : 'Upload Photo'}
                </Button>
                <p
                  style={{
                    fontSize: 'var(--font-xs)',
                    color: 'var(--text-tertiary)',
                    margin: 'var(--spacing-1) 0 0 0',
                  }}
                >
                  JPG, PNG or GIF. Max size 5MB
                </p>
              </div>
            </div>
          </div>

          {/* Form Fields Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 'var(--spacing-4)',
            marginBottom: 'var(--spacing-6)',
          }}>
            <FormField label="Username" required>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="input"
              />
            </FormField>

            <FormField label="Email" required>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input"
              />
            </FormField>

            <FormField label="Role" required>
              <div>
                <SearchableDropdown
                  options={roles.map((role) => ({
                    value: role.value,
                    label: role.label,
                  }))}
                  value={formData.role}
                  onChange={(val) => setFormData({ ...formData, role: val as any })}
                  placeholder="Select Role"
                />
                {formData.role && (
                  <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                    {roles.find(r => r.value === formData.role)?.description}
                  </p>
                )}
              </div>
            </FormField>

            <FormField label="Password" required>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input"
              />
            </FormField>

            <FormField label="Confirm Password" required>
              <input
                type="password"
                required
                value={formData.password2}
                onChange={(e) => setFormData({ ...formData, password2: e.target.value })}
                className="input"
              />
            </FormField>

            <FormField label="Phone">
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input"
              />
            </FormField>

            <FormField label="First Name">
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="input"
              />
            </FormField>

            <FormField label="Last Name">
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="input"
              />
            </FormField>

            <FormField label="الاسم الكامل بالعربي">
              <input type="text" className="input" dir="rtl" placeholder="الاسم الكامل بالعربي"
                value={formData.full_name_ar}
                onChange={(e) => setFormData({ ...formData, full_name_ar: e.target.value })}
              />
            </FormField>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
              <input
                type="checkbox"
                checked={formData.is_staff}
                onChange={(e) => setFormData({ ...formData, is_staff: e.target.checked })}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <label style={{
                fontSize: 'var(--font-sm)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
              }}>
                Staff Member
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="btn btn-primary"
            >
              {mutation.isPending ? 'Creating...' : 'Create User'}
            </button>
            <Link href="/users" className="btn btn-secondary">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
