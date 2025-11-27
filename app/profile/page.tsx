'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth';
import MainLayout from '@/components/layout/MainLayout';
import EntityHeader from '@/components/ui/EntityHeader';
import { useAuth } from '@/lib/hooks/use-auth';
import { useAuthStore } from '@/lib/store/auth-store';
import { toast } from '@/lib/hooks/use-toast';
import { Button, TextField, FormField, Badge } from '@/components/ui';
import Image from 'next/image';
import { formatBackendError } from '@/lib/utils/validation';
import { permissionsApi } from '@/lib/api/permissions';

export default function ProfilePage() {
  const { user: currentUser } = useAuth();
  const { setAuth } = useAuthStore();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    job_title: '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch current user data
  const { data: user, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authApi.me(),
  });

  // Update form data when user data is loaded
  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        job_title: user.job_title || '',
      });
    }
  }, [user]);

  // Fetch user permissions
  const { data: userPermissions } = useQuery({
    queryKey: ['user-permissions', 'me'],
    queryFn: () => permissionsApi.getMyPermissions(),
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const updateData: any = {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone,
        job_title: data.job_title,
      };
      
      if (avatarFile) {
        updateData.avatar = avatarFile;
      }
      
      return authApi.updateMe(updateData);
    },
    onSuccess: (updatedUser) => {
      // Update query cache directly for immediate UI update
      queryClient.setQueryData(['auth', 'me'], updatedUser);
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      
      // Update auth store with new user data
      const accessToken = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');
      if (accessToken && refreshToken) {
        setAuth(updatedUser, accessToken, refreshToken);
      }
      
      setIsEditing(false);
      setAvatarFile(null);
      setAvatarPreview(null);
      toast('Profile updated successfully', 'success');
    },
    onError: (error: any) => {
      const errorMessage = formatBackendError(error);
      toast(errorMessage, 'error');
      
      // Set field-specific errors
      if (error?.response?.data) {
        const backendErrors: Record<string, string> = {};
        Object.entries(error.response.data).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            backendErrors[key] = value[0] || 'Error';
          } else if (typeof value === 'string') {
            backendErrors[key] = value;
          }
        });
        setErrors(backendErrors);
      } else {
        setErrors({});
      }
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast('Please select an image file', 'error');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast('Image size must be less than 5MB', 'error');
        return;
      }
      
      setAvatarFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    const updateData: typeof formData & { avatar?: File } = { ...formData };
    if (avatarFile) {
      updateData.avatar = avatarFile;
      console.log('Uploading avatar file:', avatarFile.name, avatarFile.size, avatarFile.type);
    }
    console.log('Submitting profile data:', { ...updateData, avatar: avatarFile ? 'File object' : 'No file' });
    updateMutation.mutate(updateData);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setAvatarFile(null);
    setAvatarPreview(null);
    setErrors({});
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        job_title: user.job_title || '',
      });
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-12)' }}>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Loading...</p>
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    return (
      <MainLayout>
        <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-12)' }}>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>User not found</p>
        </div>
      </MainLayout>
    );
  }

  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username;
  const displayName = fullName || user.username;
  const currentAvatar = avatarPreview || user.avatar_url || user.avatar;

  return (
    <MainLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
        {/* Entity Header - Unified */}
        <EntityHeader
          title={displayName}
          subtitle={user.email}
          image={currentAvatar}
          imageAlt={displayName}
          entityType="user"
          statusBadge={user.is_staff ? 'Staff' : 'User'}
          statusVariant={user.is_staff ? 'success' : 'info'}
          backHref="/dashboard"
          backLabel="Back to Dashboard"
          actions={
            !isEditing ? (
              <Button onClick={() => setIsEditing(true)} className="btn btn-edit">
                Edit Profile
              </Button>
            ) : (
              <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                <Button
                  onClick={handleCancel}
                  className="btn btn-secondary"
                  disabled={updateMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  className="btn btn-primary"
                  disabled={updateMutation.isPending}
                  isLoading={updateMutation.isPending}
                >
                  Save Changes
                </Button>
              </div>
            )
          }
          imageSize={120}
        />

        {/* Profile Information */}
        <div className="card">
          <h3
            style={{
              fontSize: 'var(--font-lg)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-primary)',
              margin: 0,
              marginBottom: 'var(--spacing-4)',
            }}
          >
            Profile Information
          </h3>

          {isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
              {/* Avatar Upload */}
              <div>
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
                    {currentAvatar ? (
                      <Image
                        src={currentAvatar}
                        alt={displayName}
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
                        {displayName.charAt(0).toUpperCase()}
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
                      onClick={() => fileInputRef.current?.click()}
                      className="btn btn-secondary"
                      size="sm"
                    >
                      Change Photo
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

              {/* Form Fields */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: 'var(--spacing-4)',
                }}
              >
                <FormField
                  label="First Name"
                  error={errors.first_name}
                >
                  <TextField
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    placeholder="Enter first name"
                    className="input"
                  />
                </FormField>

                <FormField
                  label="Last Name"
                  error={errors.last_name}
                >
                  <TextField
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    placeholder="Enter last name"
                    className="input"
                  />
                </FormField>

                <FormField
                  label="Email"
                  error={errors.email}
                  required
                >
                  <TextField
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter email address"
                    className="input"
                  />
                </FormField>

                <FormField
                  label="Phone"
                  error={errors.phone}
                >
                  <TextField
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Enter phone number"
                    className="input"
                  />
                </FormField>

                <FormField
                  label="Job Title"
                  error={errors.job_title}
                >
                  <TextField
                    type="text"
                    value={formData.job_title}
                    onChange={(e) => handleInputChange('job_title', e.target.value)}
                    placeholder="Enter job title"
                    className="input"
                  />
                </FormField>
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: 'var(--spacing-4)',
              }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 'var(--font-sm)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--text-secondary)',
                    marginBottom: 'var(--spacing-2)',
                  }}
                >
                  Username
                </label>
                <p
                  style={{
                    fontSize: 'var(--font-base)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--text-primary)',
                    margin: 0,
                  }}
                >
                  {user.username}
                </p>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 'var(--font-sm)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--text-secondary)',
                    marginBottom: 'var(--spacing-2)',
                  }}
                >
                  First Name
                </label>
                <p
                  style={{
                    fontSize: 'var(--font-base)',
                    color: 'var(--text-primary)',
                    margin: 0,
                  }}
                >
                  {user.first_name || '-'}
                </p>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 'var(--font-sm)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--text-secondary)',
                    marginBottom: 'var(--spacing-2)',
                  }}
                >
                  Last Name
                </label>
                <p
                  style={{
                    fontSize: 'var(--font-base)',
                    color: 'var(--text-primary)',
                    margin: 0,
                  }}
                >
                  {user.last_name || '-'}
                </p>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 'var(--font-sm)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--text-secondary)',
                    marginBottom: 'var(--spacing-2)',
                  }}
                >
                  Email
                </label>
                <p
                  style={{
                    fontSize: 'var(--font-base)',
                    color: 'var(--text-primary)',
                    margin: 0,
                  }}
                >
                  {user.email}
                </p>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 'var(--font-sm)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--text-secondary)',
                    marginBottom: 'var(--spacing-2)',
                  }}
                >
                  Phone
                </label>
                <p
                  style={{
                    fontSize: 'var(--font-base)',
                    color: 'var(--text-primary)',
                    margin: 0,
                  }}
                >
                  {user.phone || '-'}
                </p>
              </div>

              {user.job_title && (
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 'var(--font-sm)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'var(--text-secondary)',
                      marginBottom: 'var(--spacing-2)',
                    }}
                  >
                    Job Title
                  </label>
                  <p
                    style={{
                      fontSize: 'var(--font-base)',
                      color: 'var(--text-primary)',
                      margin: 0,
                    }}
                  >
                    {user.job_title}
                  </p>
                </div>
              )}

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 'var(--font-sm)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--text-secondary)',
                    marginBottom: 'var(--spacing-2)',
                  }}
                >
                  Role
                </label>
                <span
                  className={`badge ${
                    user.role === 'super_admin'
                      ? 'badge-error'
                      : user.role === 'procurement_manager'
                      ? 'badge-warning'
                      : user.role === 'procurement_officer'
                      ? 'badge-info'
                      : 'badge-success'
                  }`}
                >
                  {user.role || 'employee'}
                </span>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 'var(--font-sm)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--text-secondary)',
                    marginBottom: 'var(--spacing-2)',
                  }}
                >
                  Staff Member
                </label>
                <span className={`badge ${user.is_staff ? 'badge-success' : 'badge-info'}`}>
                  {user.is_staff ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Permissions Section */}
        {userPermissions && (
          <div className="card">
            <h3
              style={{
                fontSize: 'var(--font-lg)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--text-primary)',
                margin: 0,
                marginBottom: 'var(--spacing-4)',
              }}
            >
              My Permissions
            </h3>
            {userPermissions.permission_set && (
              <div style={{ marginBottom: 'var(--spacing-4)' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: 'var(--font-sm)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--text-secondary)',
                    marginBottom: 'var(--spacing-2)',
                  }}
                >
                  Permission Set (Role)
                </label>
                <Badge variant="info">
                  {userPermissions.permission_set.name}
                </Badge>
              </div>
            )}
            {userPermissions.permissions.length > 0 ? (
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 'var(--font-sm)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--text-secondary)',
                    marginBottom: 'var(--spacing-2)',
                  }}
                >
                  Permissions ({userPermissions.permissions.length})
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-2)' }}>
                  {userPermissions.permissions.map((perm, index) => (
                    <Badge key={index} variant="info">
                      {perm.category}.{perm.action}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', margin: 0 }}>
                No permissions assigned
              </p>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

