'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MainLayout from '@/components/layout/MainLayout';
import { violationsApi } from '@/lib/api/violations';
import { MunicipalViolation } from '@/types';
import { useAuth } from '@/lib/hooks/use-auth';
import { useT } from '@/lib/i18n/useT';
import { AlertIcon } from '@/components/icons';

const STATUS_CONFIG = (t: ReturnType<typeof useT>) => ({
  new:      { bg: '#FEF3C7', color: '#92400E', label: t('viol', 'statusNew')      },
  notified: { bg: '#DBEAFE', color: '#1E40AF', label: t('viol', 'statusNotified') },
  resolved: { bg: '#D1FAE5', color: '#065F46', label: t('viol', 'statusResolved') },
  fined:    { bg: '#FEE2E2', color: '#991B1B', label: t('viol', 'statusFined')    },
} as Record<string, { bg: string; color: string; label: string }>);

export default function ViolationsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const t = useT();

  const [page, setPage]     = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const [testOpen, setTestOpen]   = useState(false);
  const [testMsg, setTestMsg]     = useState('');
  const [testResult, setTestResult] = useState<null | { type: 'ok' | 'ignored' | 'error'; detail: string }>(null);

  const isAdmin = user?.role === 'super_admin' || user?.is_superuser || user?.role === 'procurement_manager';

  const statusConfig = STATUS_CONFIG(t);

  const { data, isLoading } = useQuery({
    queryKey: ['violations', page, search, status],
    queryFn:  () => violationsApi.getAll({ page, search: search || undefined, status: status || undefined, page_size: 20 }),
    enabled: isAdmin,
  });

  const resolveMutation = useMutation({
    mutationFn: (id: number) => violationsApi.markResolved(id),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ['violations'] }),
  });

  const simulateMutation = useMutation({
    mutationFn: (message: string) => violationsApi.simulate(message),
    onSuccess: (res) => {
      if (res.status === 'ok') {
        const detail = [
          res.reference ? `${t('viol', 'testRef')}: ${res.reference}` : '',
          res.project   ? `${t('viol', 'testProject')}: ${res.project}` : t('viol', 'testNotLinked'),
          res.engineer  ? `${t('viol', 'testEngineer')}: ${res.engineer}` : '',
        ].filter(Boolean).join(' · ');
        setTestResult({ type: 'ok', detail });
        setTestMsg('');
        queryClient.invalidateQueries({ queryKey: ['violations'] });
      } else {
        setTestResult({ type: 'ignored', detail: res.reason ?? t('viol', 'testIgnored') });
      }
    },
    onError: () => setTestResult({ type: 'error', detail: t('viol', 'testError') }),
  });

  if (!isAdmin) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <p style={{ color: 'var(--text-secondary)' }}>{t('viol', 'accessDenied')}</p>
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
            <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <AlertIcon className="w-5 h-5" style={{ color: '#D97706' }} />
              {t('viol', 'title')}
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {t('viol', 'subtitle')} — {totalCount} {totalCount === 1 ? t('viol', 'violation') : t('viol', 'violations')}
            </p>
          </div>
          <button
            onClick={() => { setTestOpen(o => !o); setTestResult(null); }}
            className="btn btn-secondary text-sm flex items-center gap-2"
          >
            <AlertIcon className="w-4 h-4" />
            {t('viol', 'testPanel')}
          </button>
        </div>

        {/* Test SMS Panel */}
        {testOpen && (
          <div className="card p-4 space-y-3" style={{ border: '1px solid #FDE68A', background: '#FFFBEB' }}>
            <div>
              <p className="font-semibold text-sm" style={{ color: '#92400E' }}>
                {t('viol', 'testPanel')}
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#B45309' }}>
                {t('viol', 'testHint')}
              </p>
            </div>
            <textarea
              value={testMsg}
              onChange={(e) => { setTestMsg(e.target.value); setTestResult(null); }}
              placeholder={t('viol', 'testPlaceholder')}
              rows={5}
              className="input w-full font-mono text-sm"
              style={{ resize: 'vertical', direction: 'rtl' }}
            />
            {testResult && (
              <div
                className="px-3 py-2 rounded-md text-sm font-medium"
                style={{
                  backgroundColor: testResult.type === 'ok' ? '#D1FAE5' : testResult.type === 'ignored' ? '#FEF3C7' : '#FEE2E2',
                  color:           testResult.type === 'ok' ? '#065F46' : testResult.type === 'ignored' ? '#92400E' : '#991B1B',
                }}
              >
                {testResult.type === 'ok' ? '✅ ' : testResult.type === 'ignored' ? '⚠️ ' : '❌ '}
                {testResult.type === 'ok' ? t('viol', 'testSuccess') + ' — ' : ''}
                {testResult.detail}
              </div>
            )}
            <button
              onClick={() => simulateMutation.mutate(testMsg)}
              disabled={!testMsg.trim() || simulateMutation.isPending}
              className="btn btn-primary text-sm"
            >
              {simulateMutation.isPending ? t('viol', 'testSending') : t('viol', 'testSend')}
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <input
            type="text"
            placeholder={t('viol', 'searchPlaceholder')}
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
            <option value="">{t('viol', 'allStatuses')}</option>
            <option value="new">{t('viol', 'statusNew')}</option>
            <option value="notified">{t('viol', 'statusNotified')}</option>
            <option value="resolved">{t('viol', 'statusResolved')}</option>
            <option value="fined">{t('viol', 'statusFined')}</option>
          </select>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(statusConfig).map(([key, val]) => {
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
              <p style={{ color: 'var(--text-secondary)' }}>{t('viol', 'noViolations')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead className="thead">
                  <tr>
                    <th className="th">{t('viol', 'refNum')}</th>
                    <th className="th">{t('viol', 'sectorPlot')}</th>
                    <th className="th">{t('viol', 'project')}</th>
                    <th className="th">{t('viol', 'engineer')}</th>
                    <th className="th">{t('viol', 'deadline')}</th>
                    <th className="th">{t('viol', 'fine')}</th>
                    <th className="th">{t('viol', 'date')}</th>
                    <th className="th">{t('viol', 'status')}</th>
                    <th className="th">{t('viol', 'action')}</th>
                  </tr>
                </thead>
                <tbody className="tbody">
                  {violations.map((v) => {
                    const sc = statusConfig[v.status] ?? statusConfig.new;
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
                            {t('viol', 'plot')} {v.plot}
                          </div>
                        </td>
                        <td className="td text-sm">
                          {v.project_name || <span style={{ color: 'var(--text-tertiary)' }}>{t('viol', 'unspecified')}</span>}
                        </td>
                        <td className="td text-sm">
                          {v.engineer_name || <span style={{ color: 'var(--text-tertiary)' }}>—</span>}
                        </td>
                        <td className="td">
                          {v.deadline_days != null ? (
                            <span
                              className="text-sm font-semibold"
                              style={{ color: v.deadline_days <= 1 ? '#DC2626' : v.deadline_days <= 3 ? '#D97706' : 'var(--text-primary)' }}
                            >
                              {v.deadline_days} {t('viol', 'days')}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="td text-sm">
                          {v.fine_amount ? `${Number(v.fine_amount).toLocaleString()} ${t('misc', 'currency')}` : '—'}
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
                                {t('viol', 'details')}
                              </a>
                            )}
                            {v.status !== 'resolved' && (
                              <button
                                onClick={() => resolveMutation.mutate(v.id)}
                                disabled={resolveMutation.isPending}
                                className="text-xs px-2 py-1 rounded-md font-medium transition-colors"
                                style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}
                              >
                                {t('viol', 'markResolved')}
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
              {t('btn', 'previous')}
            </button>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {page} {t('misc', 'pageOf')} {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn btn-secondary text-sm px-3 py-1.5"
            >
              {t('btn', 'next')}
            </button>
          </div>
        )}

      </div>
    </MainLayout>
  );
}
