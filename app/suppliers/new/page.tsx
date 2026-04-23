'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { suppliersApi } from '@/lib/api/suppliers';
import MainLayout from '@/components/layout/MainLayout';
import Link from 'next/link';
import SearchableDropdown from '@/components/ui/SearchableDropdown';
import FormField from '@/components/ui/FormField';
import { useT } from '@/lib/i18n/useT';

const currencies = [
  { value: 'AED', label: 'AED - UAE Dirham' },
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'EGP', label: 'EGP - Egyptian Pound' },
  { value: 'SAR', label: 'SAR - Saudi Riyal' },
];

const countries = [
  'United Arab Emirates',
  'Saudi Arabia',
  'Egypt',
  'United States',
  'United Kingdom',
  'Other',
];

export default function NewSupplierPage() {
  const t = useT();
  const router = useRouter();
  const [formData, setFormData] = useState({
    business_name: '',
    business_name_ar: '',
    supplier_number: '',
    first_name: '',
    last_name: '',
    contact_person: '',
    email: '',
    telephone: '',
    phone: '',
    mobile: '',
    street_address_1: '',
    street_address_2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'United Arab Emirates',
    tax_id: '',
    trn: '',
    currency: 'AED',
    bank_name: '',
    bank_account: '',
    notes: '',
    is_active: true,
  });

  const mutation = useMutation({
    mutationFn: suppliersApi.create,
    onSuccess: () => {
      router.push('/suppliers');
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
            href="/suppliers" 
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
            ← {t('btn','back')} {t('page','suppliers')}
          </Link>
          <h1 style={{ 
            fontSize: 'var(--font-2xl)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--text-primary)',
            margin: 0,
            marginBottom: 'var(--spacing-1)',
          }}>
            {t('page', 'newSupplier')}
          </h1>
          <p style={{ 
            fontSize: 'var(--font-sm)',
            color: 'var(--text-secondary)',
            margin: 0,
          }}>
            Add a new supplier to your network
          </p>
        </div>

        {/* Form Card - Unified */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
          {/* Supplier Details Section */}
          <div className="card">
            <h2 style={{ 
              fontSize: 'var(--font-lg)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-primary)',
              margin: 0,
              marginBottom: 'var(--spacing-4)',
            }}>
              Supplier Details
            </h2>
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: 'var(--spacing-4)',
            }}>
              <FormField label={t('field', 'businessNameEn')} required>
                <input type="text" required className="input"
                  value={formData.business_name}
                  onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                />
              </FormField>

              <FormField label="اسم الشركة بالعربي">
                <input type="text" className="input" dir="rtl" placeholder="اسم المورد بالعربي"
                  value={formData.business_name_ar}
                  onChange={(e) => setFormData({ ...formData, business_name_ar: e.target.value })}
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

              <FormField label="Telephone">
                <input
                  type="tel"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  className="input"
                />
              </FormField>

              <FormField label="Mobile">
                <input
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
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

              <div style={{ gridColumn: 'span 2' }}>
                <FormField label="Street Address 1">
                  <input
                    type="text"
                    value={formData.street_address_1}
                    onChange={(e) => setFormData({ ...formData, street_address_1: e.target.value })}
                    className="input"
                  />
                </FormField>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <FormField label="Street Address 2">
                  <input
                    type="text"
                    value={formData.street_address_2}
                    onChange={(e) => setFormData({ ...formData, street_address_2: e.target.value })}
                    className="input"
                  />
                </FormField>
              </div>

              <FormField label="City">
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="input"
                />
              </FormField>

              <FormField label="State">
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="input"
                />
              </FormField>

              <FormField label="Postal Code">
                <input
                  type="text"
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  className="input"
                />
              </FormField>

              <FormField label="Country">
                <SearchableDropdown
                  options={countries.map((country) => ({
                    value: country,
                    label: country,
                  }))}
                  value={formData.country}
                  onChange={(val) => setFormData({ ...formData, country: val as string })}
                  placeholder="Select Country"
                />
              </FormField>

              <FormField label="TRN (Optional)">
                <input
                  type="text"
                  value={formData.trn}
                  onChange={(e) => setFormData({ ...formData, trn: e.target.value })}
                  className="input"
                />
              </FormField>
            </div>
          </div>

          {/* Account Details Section */}
          <div className="card">
            <h2 style={{ 
              fontSize: 'var(--font-lg)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-primary)',
              margin: 0,
              marginBottom: 'var(--spacing-4)',
            }}>
              Account Details
            </h2>
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: 'var(--spacing-4)',
            }}>
              <FormField label="Supplier Number" required>
                <input
                  type="text"
                  required
                  value={formData.supplier_number}
                  onChange={(e) => setFormData({ ...formData, supplier_number: e.target.value })}
                  className="input"
                />
              </FormField>

              <FormField label="Currency">
                <SearchableDropdown
                  options={currencies.map((currency) => ({
                    value: currency.value,
                    label: currency.label,
                  }))}
                  value={formData.currency}
                  onChange={(val) => setFormData({ ...formData, currency: val as string })}
                  placeholder="Select Currency"
                />
              </FormField>

              <FormField label="Email">
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input"
                />
              </FormField>

              <FormField label="Contact Person">
                <input
                  type="text"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  className="input"
                />
              </FormField>

              <FormField label="Tax ID">
                <input
                  type="text"
                  value={formData.tax_id}
                  onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                  className="input"
                />
              </FormField>

              <FormField label="Bank Name">
                <input
                  type="text"
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  className="input"
                />
              </FormField>

              <FormField label="Bank Account">
                <input
                  type="text"
                  value={formData.bank_account}
                  onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })}
                  className="input"
                />
              </FormField>

              <div style={{ gridColumn: '1 / -1' }}>
                <FormField label="Notes">
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={4}
                    className="input"
                  />
                </FormField>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label style={{
                  fontSize: 'var(--font-sm)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                }}>
                  {t('col', 'active')}
                </label>
              </div>
            </div>
          </div>

          {/* Form Actions - Unified */}
          <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="btn btn-primary"
            >
              {mutation.isPending ? t('btn', 'saving') : t('btn', 'save')}
            </button>
            <Link href="/suppliers" className="btn btn-secondary">
              {t('btn', 'cancel')}
            </Link>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
