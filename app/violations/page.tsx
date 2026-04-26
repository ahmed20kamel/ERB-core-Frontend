'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MainLayout from '@/components/layout/MainLayout';
import { violationsApi } from '@/lib/api/violations';
import { MunicipalViolation } from '@/types';
import { useAuth } from '@/lib/hooks/use-auth';
import { useT } from '@/lib/i18n/useT';
import { AlertIcon } from '@/components/icons';

const FRONTEND_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://purchase-self.vercel.app';

/* ── Status config ───────────────────────────────────────────────── */
const STATUS_META = {
  new:      { bg: '#FEF3C7', color: '#92400E', dot: '#F59E0B' },
  notified: { bg: '#DBEAFE', color: '#1E40AF', dot: '#3B82F6' },
  resolved: { bg: '#D1FAE5', color: '#065F46', dot: '#10B981' },
  fined:    { bg: '#FEE2E2', color: '#991B1B', dot: '#EF4444' },
} as const;

/* ── Stat card ───────────────────────────────────────────────────── */
function StatCard({ label, value, color, bg, onClick, active }:
  { label: string; value: number; color: string; bg: string; onClick?: () => void; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      className="card p-4 text-center transition-all duration-150 w-full"
      style={{
        cursor: onClick ? 'pointer' : 'default',
        outline: active ? `2px solid ${color}` : 'none',
        outlineOffset: 2,
      }}
    >
      <div className="text-3xl font-bold mb-1" style={{ color }}>{value}</div>
      <div className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</div>
    </button>
  );
}

/* ── Main page ───────────────────────────────────────────────────── */
export default function ViolationsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const t = useT();

  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [testOpen, setTestOpen] = useState(false);
  const [testMsg, setTestMsg]   = useState('');
  const [testResult, setTestResult] = useState<null | { type: 'ok' | 'ignored' | 'error'; detail: string }>(null);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const isAdmin = user?.role === 'super_admin' || user?.is_superuser || user?.role === 'procurement_manager';

  const { data: stats } = useQuery({
    queryKey: ['violations-stats'],
    queryFn: violationsApi.getStats,
    enabled: isAdmin,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['violations', page, search, statusFilter],
    queryFn: () => violationsApi.getAll({
      page,
      search: search || undefined,
      status: statusFilter || undefined,
      page_size: 20,
    }),
    enabled: isAdmin,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['violations'] });
    queryClient.invalidateQueries({ queryKey: ['violations-stats'] });
  };

  const resolveMutation = useMutation({
    mutationFn: (id: number) => violationsApi.markResolved(id),
    onSuccess: invalidate,
  });

  const bulkMutation = useMutation({
    mutationFn: (ids: number[]) => violationsApi.bulkAction(ids, 'resolve'),
    onSuccess: () => { setSelectedIds(new Set()); invalidate(); },
  });

  const simulateMutation = useMutation({
    mutationFn: (message: string) => violationsApi.simulate(message),
    onSuccess: (res) => {
      if (res.status === 'ok') {
        const parts = [
          res.reference ? `${t('viol', 'testRef')}: ${res.reference}` : '',
          res.project   ? `${t('viol', 'testProject')}: ${res.project}` : t('viol', 'testNotLinked'),
          res.engineer  ? `${t('viol', 'testEngineer')}: ${res.engineer}` : '',
        ].filter(Boolean).join(' · ');
        setTestResult({ type: 'ok', detail: parts });
        setTestMsg('');
        invalidate();
      } else {
        setTestResult({ type: 'ignored', detail: res.reason ?? t('viol', 'testIgnored') });
      }
    },
    onError: () => setTestResult({ type: 'error', detail: t('viol', 'testError') }),
  });

  const copyLink = (v: MunicipalViolation) => {
    navigator.clipboard.writeText(`${FRONTEND_URL}/resolve/${v.resolve_token}`);
    setCopiedId(v.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

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
  const allSelected = violations.length > 0 && violations.every(v => selectedIds.has(v.id));

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(prev => { const s = new Set(prev); violations.forEach(v => s.delete(v.id)); return s; });
    } else {
      setSelectedIds(prev => { const s = new Set(prev); violations.forEach(v => s.add(v.id)); return s; });
    }
  };

  const toggleOne = (id: number) => {
    setSelectedIds(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  };

  const statusLabels: Record<string, string> = {
    new:      t('viol', 'statusNew'),
    notified: t('viol', 'statusNotified'),
    resolved: t('viol', 'statusResolved'),
    fined:    t('viol', 'statusFined'),
  };

  return (
    <MainLayout>
      <div className="space-y-5">

        {/* ── Header ── */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <AlertIcon className="w-6 h-6 flex-shrink-0" />
              {t('viol', 'title')}
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {t('viol', 'subtitle')}
              {stats && (
                <span className="ms-2 font-semibold" style={{ color: 'var(--text-primary)' }}>
                  — {stats.total} {stats.total === 1 ? t('viol', 'violation') : t('viol', 'violations')}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => { setTestOpen(o => !o); setTestResult(null); }}
            className="btn btn-secondary flex items-center gap-2 text-sm"
          >
            <AlertIcon className="w-4 h-4" />
            {t('viol', 'testPanel')}
          </button>
        </div>

        {/* ── Test SMS Panel ── */}
        {testOpen && (
          <div className="card p-4 space-y-3" style={{ border: '1px solid #FDE68A', background: 'var(--color-surface, #FFFBEB)' }}>
            <div>
              <p className="font-semibold text-sm" style={{ color: '#92400E' }}>{t('viol', 'testPanel')}</p>
              <p className="text-xs mt-0.5" style={{ color: '#B45309' }}>{t('viol', 'testHint')}</p>
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
              <div className="px-3 py-2 rounded-lg text-sm font-medium" style={{
                background: testResult.type === 'ok' ? '#D1FAE5' : testResult.type === 'ignored' ? '#FEF3C7' : '#FEE2E2',
                color:      testResult.type === 'ok' ? '#065F46' : testResult.type === 'ignored' ? '#92400E' : '#991B1B',
              }}>
                {testResult.type === 'ok' ? '✅ ' : testResult.type === 'ignored' ? '⚠️ ' : '❌ '}
                {testResult.type === 'ok' ? `${t('viol', 'testSuccess')} — ` : ''}
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

        {/* ── Stats cards ── */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard
              label={t('status', 'active')}
              value={stats.total}
              color="var(--color-primary)"
              bg="var(--sidebar-active-bg)"
              onClick={() => { setStatusFilter(''); setPage(1); }}
              active={statusFilter === ''}
            />
            {(['new', 'notified', 'resolved', 'fined'] as const).map(s => (
              <StatCard key={s}
                label={statusLabels[s]}
                value={stats[s]}
                color={STATUS_META[s].color}
                bg={STATUS_META[s].bg}
                onClick={() => { setStatusFilter(s); setPage(1); }}
                active={statusFilter === s}
              />
            ))}
            {stats.no_project > 0 && (
              <div className="card p-4 text-center" style={{ border: '1px dashed #F59E0B' }}>
                <div className="text-3xl font-bold mb-1" style={{ color: '#D97706' }}>{stats.no_project}</div>
                <div className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {t('viol', 'testNotLinked')}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Filters ── */}
        <div className="flex gap-3 flex-wrap">
          <input
            type="text"
            placeholder={t('viol', 'searchPlaceholder')}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input flex-1"
            style={{ minWidth: 240 }}
          />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="input"
            style={{ minWidth: 150 }}
          >
            <option value="">{t('viol', 'allStatuses')}</option>
            {(['new', 'notified', 'resolved', 'fined'] as const).map(s => (
              <option key={s} value={s}>{statusLabels[s]}</option>
            ))}
          </select>
        </div>

        {/* ── Bulk actions bar ── */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{ background: 'var(--sidebar-active-bg)', border: '1px solid var(--color-primary)' }}>
            <span className="text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>
              {selectedIds.size} {t('viol', 'violations')} {t('misc', 'selected') || 'محددة'}
            </span>
            <button
              onClick={() => bulkMutation.mutate(Array.from(selectedIds))}
              disabled={bulkMutation.isPending}
              className="text-xs px-3 py-1.5 rounded-lg font-semibold"
              style={{ background: '#10B981', color: '#fff' }}
            >
              {bulkMutation.isPending ? '...' : `✅ ${t('viol', 'markResolved')}`}
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-xs px-3 py-1.5 rounded-lg font-medium"
              style={{ background: '#F3F4F6', color: '#6B7280' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* ── Table ── */}
        <div className="card overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-8 h-8 border-4 rounded-full animate-spin"
                style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
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
                    <th className="th w-8">
                      <input type="checkbox" checked={allSelected} onChange={toggleAll}
                        className="w-4 h-4 cursor-pointer" />
                    </th>
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
                    const meta = STATUS_META[v.status as keyof typeof STATUS_META] ?? STATUS_META.new;
                    const hasError = !!v.parse_error && !v.project;
                    const isExpanded = expandedRow === v.id;
                    const isSelected = selectedIds.has(v.id);

                    return (
                      <>
                        <tr
                          key={v.id}
                          className="tr"
                          style={{
                            background: isSelected
                              ? 'var(--sidebar-active-bg)'
                              : hasError ? '#FFFBEB' : undefined,
                          }}
                        >
                          {/* Checkbox */}
                          <td className="td">
                            <input type="checkbox" checked={isSelected} onChange={() => toggleOne(v.id)}
                              className="w-4 h-4 cursor-pointer" />
                          </td>

                          {/* Reference */}
                          <td className="td">
                            <div className="flex items-center gap-1.5">
                              {hasError && (
                                <span title={v.parse_error} style={{ color: '#D97706', fontSize: 14 }}>⚠️</span>
                              )}
                              <span className="font-mono text-sm font-semibold">
                                {v.reference_number || '—'}
                              </span>
                            </div>
                          </td>

                          {/* Sector / Plot */}
                          <td className="td">
                            {v.sector ? (
                              <>
                                <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{v.sector}</div>
                                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                  {t('viol', 'plot')} {v.plot}
                                </div>
                              </>
                            ) : (
                              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>—</span>
                            )}
                          </td>

                          {/* Project */}
                          <td className="td text-sm">
                            {v.project_name
                              ? <span style={{ color: 'var(--text-primary)' }}>{v.project_name}</span>
                              : <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                                  style={{ background: '#FEF3C7', color: '#92400E' }}>
                                  {t('viol', 'testNotLinked')}
                                </span>
                            }
                          </td>

                          {/* Engineer */}
                          <td className="td text-sm" style={{ color: v.engineer_name ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                            {v.engineer_name || '—'}
                          </td>

                          {/* Deadline */}
                          <td className="td">
                            {v.deadline_days != null ? (
                              <span className="text-sm font-semibold" style={{
                                color: v.deadline_days <= 1 ? '#DC2626' : v.deadline_days <= 3 ? '#D97706' : 'var(--text-primary)'
                              }}>
                                {v.deadline_days} {t('viol', 'days')}
                              </span>
                            ) : '—'}
                          </td>

                          {/* Fine */}
                          <td className="td text-sm">
                            {v.fine_amount
                              ? <span className="font-semibold" style={{ color: '#DC2626' }}>
                                  {Number(v.fine_amount).toLocaleString()} {t('misc', 'currency')}
                                </span>
                              : '—'}
                          </td>

                          {/* Date + updated */}
                          <td className="td" style={{ minWidth: 90 }}>
                            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                              {new Date(v.received_at).toLocaleDateString('ar-AE')}
                            </div>
                            {v.resolved_at && (
                              <div className="text-xs mt-0.5" style={{ color: '#10B981' }}>
                                ✅ {new Date(v.resolved_at).toLocaleDateString('ar-AE')}
                              </div>
                            )}
                          </td>

                          {/* Status badge */}
                          <td className="td">
                            <span className="flex items-center gap-1.5 text-xs font-semibold w-max px-2.5 py-1 rounded-full"
                              style={{ background: meta.bg, color: meta.color }}>
                              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: meta.dot }} />
                              {statusLabels[v.status] ?? v.status}
                            </span>
                            {v.resolved_by_name && (
                              <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                                {v.resolved_by_name}
                              </div>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="td">
                            <div className="flex gap-1.5 items-center flex-wrap">
                              {/* Copy resolve link */}
                              <button
                                onClick={() => copyLink(v)}
                                title="نسخ رابط المعالجة"
                                className="text-xs px-2 py-1 rounded-md font-medium"
                                style={{ background: '#EFF6FF', color: '#1D4ED8' }}
                              >
                                {copiedId === v.id ? '✓' : '🔗'}
                              </button>

                              {v.parse_error && (
                                <button
                                  onClick={() => setExpandedRow(isExpanded ? null : v.id)}
                                  className="text-xs px-2 py-1 rounded-md font-medium"
                                  style={{ background: '#FEF3C7', color: '#92400E' }}
                                >
                                  {isExpanded ? '▲' : '▼'} {t('viol', 'details')}
                                </button>
                              )}
                              {v.violation_url && (
                                <a href={v.violation_url} target="_blank" rel="noreferrer"
                                  className="text-xs underline"
                                  style={{ color: 'var(--color-primary)' }}>
                                  {t('viol', 'details')}
                                </a>
                              )}
                              {v.status !== 'resolved' && (
                                <button
                                  onClick={() => resolveMutation.mutate(v.id)}
                                  disabled={resolveMutation.isPending}
                                  className="text-xs px-2 py-1 rounded-md font-medium"
                                  style={{ background: '#D1FAE5', color: '#065F46' }}
                                >
                                  {t('viol', 'markResolved')}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Expandable row */}
                        {isExpanded && (
                          <tr key={`${v.id}-expanded`} style={{ background: '#FFFBEB' }}>
                            <td colSpan={10} className="px-4 py-3">
                              {v.parse_error && (
                                <p className="text-xs mb-2 font-medium" style={{ color: '#D97706' }}>
                                  ⚠️ {v.parse_error}
                                </p>
                              )}
                              <p className="text-xs font-mono leading-relaxed" dir="rtl"
                                style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', maxWidth: 700 }}>
                                {v.raw_message}
                              </p>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="btn btn-secondary text-sm px-3 py-1.5">
              {t('btn', 'previous')}
            </button>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {page} {t('misc', 'pageOf')} {totalPages}
            </span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="btn btn-secondary text-sm px-3 py-1.5">
              {t('btn', 'next')}
            </button>
          </div>
        )}

      </div>
    </MainLayout>
  );
}
