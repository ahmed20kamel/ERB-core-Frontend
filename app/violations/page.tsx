'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MainLayout from '@/components/layout/MainLayout';
import { violationsApi } from '@/lib/api/violations';
import { MunicipalViolation } from '@/types';
import { useAuth } from '@/lib/hooks/use-auth';
import { useRouter } from 'next/navigation';

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  new:      { bg: '#FEF3C7', color: '#92400E', label: 'جديدة'       },
  notified: { bg: '#DBEAFE', color: '#1E40AF', label: 'تم الإبلاغ'  },
  resolved: { bg: '#D1FAE5', color: '#065F46', label: 'تم الحل'     },
  fined:    { bg: '#FEE2E2', color: '#991B1B', label: 'صدرت مخالفة' },
};

export default function ViolationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState('');
  const [status, setStatus]   = useState('');

  const isAdmin = user?.role === 'super_admin' || user?.is_superuser || user?.role === 'procurement_manager';

  const { data, isLoading } = useQuery({
    queryKey: ['violations', page, search, status],
    queryFn:  () => violationsApi.getAll({ page, search: search || undefined, status: status || undefined, page_size: 20 }),
    enabled: isAdmin,
  });

  const resolveMutation = useMutation({
    mutationFn: (id: number) => violationsApi.markResolved(id),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ['violations'] }),
  });

  if (!isAdmin) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <p style={{ color: 'var(--text-secondary)' }}>غير مصرح لك بالوصول</p>
        </div>
      </MainLayout>
    );
  }

  const violations: MunicipalViolation[] = data?.results ?? [];
  const totalCount = data?.count ?? 0;
  const totalPages = Math.ceil(totalCount / 20);

  return (
    <MainLayout>
      <div className="space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              ⚠️ المخالفات البلدية
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              رسائل بلدية أبوظبي — {totalCount} مخالفة
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <input
            type="text"
            placeholder="بحث برقم المرجع أو الحوض أو القطعة..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input"
            style={{ minWidth: 280 }}
          />
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="input"
            style={{ minWidth: 160 }}
          >
            <option value="">كل الحالات</option>
            <option value="new">جديدة</option>
            <option value="notified">تم الإبلاغ</option>
            <option value="resolved">تم الحل</option>
            <option value="fined">صدرت مخالفة</option>
          </select>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(STATUS_COLORS).map(([key, val]) => {
            const count = violations.filter(v => v.status === key).length;
            return (
              <div key={key} className="card p-3 text-center">
                <div className="text-2xl font-bold" style={{ color: val.color }}>{count}</div>
                <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{val.label}</div>
              </div>
            );
          })}
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
            </div>
          ) : violations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2">
              <span className="text-3xl">✅</span>
              <p style={{ color: 'var(--text-secondary)' }}>لا توجد مخالفات</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead className="thead">
                  <tr>
                    <th className="th">المرجع</th>
                    <th className="th">المنطقة / القطعة</th>
                    <th className="th">المشروع</th>
                    <th className="th">المهندس</th>
                    <th className="th">المهلة</th>
                    <th className="th">الغرامة</th>
                    <th className="th">التاريخ</th>
                    <th className="th">الحالة</th>
                    <th className="th">إجراء</th>
                  </tr>
                </thead>
                <tbody className="tbody">
                  {violations.map((v) => {
                    const sc = STATUS_COLORS[v.status] ?? STATUS_COLORS.new;
                    return (
                      <tr key={v.id} className="tr">
                        <td className="td font-mono text-sm font-semibold">
                          {v.reference_number || '—'}
                        </td>
                        <td className="td">
                          <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                            {v.sector}
                          </div>
                          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            قطعة {v.plot}
                          </div>
                        </td>
                        <td className="td text-sm">{v.project_name || <span style={{ color: 'var(--text-tertiary)' }}>غير محدد</span>}</td>
                        <td className="td text-sm">{v.engineer_name || <span style={{ color: 'var(--text-tertiary)' }}>—</span>}</td>
                        <td className="td">
                          {v.deadline_days != null ? (
                            <span
                              className="text-sm font-semibold"
                              style={{ color: v.deadline_days <= 1 ? '#DC2626' : v.deadline_days <= 3 ? '#D97706' : 'var(--text-primary)' }}
                            >
                              {v.deadline_days} يوم
                            </span>
                          ) : '—'}
                        </td>
                        <td className="td text-sm">
                          {v.fine_amount ? `${Number(v.fine_amount).toLocaleString()} د.إ` : '—'}
                        </td>
                        <td className="td text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {new Date(v.received_at).toLocaleDateString('ar-AE')}
                        </td>
                        <td className="td">
                          <span
                            className="px-2 py-0.5 rounded-full text-xs font-semibold"
                            style={{ backgroundColor: sc.bg, color: sc.color }}
                          >
                            {sc.label}
                          </span>
                        </td>
                        <td className="td">
                          <div className="flex gap-2 items-center">
                            {v.violation_url && (
                              <a
                                href={v.violation_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs underline"
                                style={{ color: 'var(--color-primary)' }}
                              >
                                تفاصيل
                              </a>
                            )}
                            {v.status !== 'resolved' && (
                              <button
                                onClick={() => resolveMutation.mutate(v.id)}
                                disabled={resolveMutation.isPending}
                                className="text-xs px-2 py-1 rounded-md font-medium transition-colors"
                                style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}
                              >
                                تم الحل ✓
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn btn-secondary text-sm px-3 py-1.5"
            >
              السابق
            </button>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn btn-secondary text-sm px-3 py-1.5"
            >
              التالي
            </button>
          </div>
        )}

      </div>
    </MainLayout>
  );
}
