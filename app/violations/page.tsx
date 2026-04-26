'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MainLayout from '@/components/layout/MainLayout';
import { violationsApi } from '@/lib/api/violations';
import { MunicipalViolation } from '@/types';
import { useAuth } from '@/lib/hooks/use-auth';
import { useT } from '@/lib/i18n/useT';

const FRONTEND_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://purchase-self.vercel.app';

/* ─── Status config ──────────────────────────────────────────────────────── */
const S = {
  new:      { bg: '#FEF9C3', color: '#854D0E', dot: '#EAB308', border: '#FDE047' },
  notified: { bg: '#DBEAFE', color: '#1E3A8A', dot: '#3B82F6', border: '#93C5FD' },
  resolved: { bg: '#DCFCE7', color: '#14532D', dot: '#22C55E', border: '#86EFAC' },
  fined:    { bg: '#FEE2E2', color: '#7F1D1D', dot: '#EF4444', border: '#FCA5A5' },
} as const;

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: '2-digit' });
}

function parseMessage(text: string): { body: string; urls: string[] } {
  const urlRx = /https?:\/\/[^\s]+/g;
  const urls = text.match(urlRx) ?? [];
  const body = text.replace(urlRx, '').replace(/\n{3,}/g, '\n\n').trim();
  return { body, urls };
}

/* ─── Stat card ──────────────────────────────────────────────────────────── */
function StatCard({ label, value, color, border, onClick, active }: {
  label: string; value: number; color: string;
  border: string; onClick?: () => void; active?: boolean;
}) {
  return (
    <button onClick={onClick} className="w-full text-start" style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div style={{
        background: '#fff',
        border: active ? `2px solid ${color}` : `1.5px solid ${border}`,
        borderRadius: 12,
        padding: '14px 16px',
        transition: 'box-shadow 0.15s, border-color 0.15s',
        boxShadow: active ? `0 0 0 3px ${color}22` : '0 1px 3px rgba(0,0,0,0.05)',
      }}>
        <div style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1, marginBottom: 6 }}>{value}</div>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</div>
      </div>
    </button>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────── */
export default function ViolationsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const t = useT();

  const [page, setPage]               = useState(1);
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [testOpen, setTestOpen]       = useState(false);
  const [testMsg, setTestMsg]         = useState('');
  const [testResult, setTestResult]   = useState<null | { type: 'ok' | 'ignored' | 'error'; detail: string }>(null);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [copiedId, setCopiedId]       = useState<number | null>(null);

  const isAdmin = user?.role === 'super_admin' || user?.is_superuser || user?.role === 'procurement_manager';

  const { data: stats } = useQuery({
    queryKey: ['violations-stats'],
    queryFn: violationsApi.getStats,
    enabled: isAdmin,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['violations', page, search, statusFilter],
    queryFn: () => violationsApi.getAll({ page, search: search || undefined, status: statusFilter || undefined, page_size: 50 }),
    enabled: isAdmin,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['violations'] });
    queryClient.invalidateQueries({ queryKey: ['violations-stats'] });
  };

  const resolveMutation = useMutation({ mutationFn: (id: number) => violationsApi.markResolved(id), onSuccess: invalidate });
  const bulkMutation    = useMutation({ mutationFn: (ids: number[]) => violationsApi.bulkAction(ids, 'resolve'), onSuccess: () => { setSelectedIds(new Set()); invalidate(); } });
  const simulateMutation = useMutation({
    mutationFn: (msg: string) => violationsApi.simulate(msg),
    onSuccess: (res) => {
      if (res.status === 'ok') {
        setTestResult({ type: 'ok', detail: [res.reference && `Ref: ${res.reference}`, res.project ?? 'No project', res.engineer].filter(Boolean).join(' · ') });
        setTestMsg(''); invalidate();
      } else {
        setTestResult({ type: 'ignored', detail: res.reason ?? 'Not a violation' });
      }
    },
    onError: () => setTestResult({ type: 'error', detail: 'Processing failed' }),
  });

  const copyLink = (v: MunicipalViolation) => {
    navigator.clipboard.writeText(`${FRONTEND_URL}/resolve/${v.resolve_token}`);
    setCopiedId(v.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isAdmin) return (
    <MainLayout>
      <div className="flex items-center justify-center h-64">
        <p style={{ color: 'var(--text-secondary)' }}>{t('viol', 'accessDenied')}</p>
      </div>
    </MainLayout>
  );

  const violations: MunicipalViolation[] = data?.results ?? [];
  const totalCount  = data?.count ?? 0;
  const totalPages  = Math.ceil(totalCount / 50);
  const allSelected = violations.length > 0 && violations.every(v => selectedIds.has(v.id));
  const statusLabels: Record<string, string> = {
    new: t('viol', 'statusNew'), notified: t('viol', 'statusNotified'),
    resolved: t('viol', 'statusResolved'), fined: t('viol', 'statusFined'),
  };

  const toggleAll = () => {
    if (allSelected) setSelectedIds(p => { const s = new Set(p); violations.forEach(v => s.delete(v.id)); return s; });
    else             setSelectedIds(p => { const s = new Set(p); violations.forEach(v => s.add(v.id)); return s; });
  };
  const toggleOne = (id: number) =>
    setSelectedIds(p => { const s = new Set(p); s.has(id) ? s.delete(id) : s.add(id); return s; });

  return (
    <MainLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '4px 0' }}>

        {/* ══ Header ══════════════════════════════════════════════════════════ */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div>
                <div style={{ width: 4, height: 36, borderRadius: 4, background: 'var(--color-primary)', marginRight: 14, display: 'inline-block', verticalAlign: 'middle' }} />
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                  {t('viol', 'title')}
                </h1>
                <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
                  {t('viol', 'subtitle')}
                  {stats && <span style={{ fontWeight: 700, color: 'var(--text-primary)', marginLeft: 6 }}>— {stats.total} {t('viol', 'violations')}</span>}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={() => { setTestOpen(o => !o); setTestResult(null); }}
            style={{
              padding: '9px 18px', borderRadius: 10, border: '1.5px solid #E5E7EB',
              background: testOpen ? '#F0FDF4' : '#fff', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, color: testOpen ? '#15803D' : 'var(--text-primary)',
              transition: 'all 0.15s',
            }}
          >
            {t('viol', 'testPanel')}
          </button>
        </div>

        {/* ══ Test Panel ══════════════════════════════════════════════════════ */}
        {testOpen && (
          <div style={{
            background: '#FFFBEB', border: '1.5px solid #FDE68A', borderRadius: 16, padding: 20,
            display: 'flex', flexDirection: 'column', gap: 14,
          }}>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#92400E' }}>{t('viol', 'testPanel')}</p>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#B45309' }}>{t('viol', 'testHint')}</p>
            </div>
            <textarea
              value={testMsg}
              onChange={e => { setTestMsg(e.target.value); setTestResult(null); }}
              placeholder={t('viol', 'testPlaceholder')}
              rows={4}
              className="input w-full font-mono text-sm"
              style={{ resize: 'vertical', direction: 'rtl', fontSize: 13 }}
            />
            {testResult && (
              <div style={{
                padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                background: testResult.type === 'ok' ? '#DCFCE7' : testResult.type === 'ignored' ? '#FEF9C3' : '#FEE2E2',
                color:      testResult.type === 'ok' ? '#14532D' : testResult.type === 'ignored' ? '#854D0E' : '#7F1D1D',
              }}>
                {testResult.type === 'ok' ? '✅ ' : testResult.type === 'ignored' ? '⚠️ ' : '❌ '}
                {testResult.detail}
              </div>
            )}
            <button
              onClick={() => simulateMutation.mutate(testMsg)}
              disabled={!testMsg.trim() || simulateMutation.isPending}
              className="btn btn-primary text-sm"
              style={{ alignSelf: 'flex-start', opacity: (!testMsg.trim() || simulateMutation.isPending) ? 0.6 : 1 }}
            >
              {simulateMutation.isPending ? t('viol', 'testSending') : t('viol', 'testSend')}
            </button>
          </div>
        )}

        {/* ══ Stats ═══════════════════════════════════════════════════════════ */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 14 }}>
            <StatCard label="Total" value={stats.total}
              color="var(--color-primary)" border="#C7D2FE"
              onClick={() => { setStatusFilter(''); setPage(1); }} active={statusFilter === ''} />
            <StatCard label={statusLabels.new}      value={stats.new}
              color={S.new.color}      border={S.new.border}
              onClick={() => { setStatusFilter('new'); setPage(1); }} active={statusFilter === 'new'} />
            <StatCard label={statusLabels.notified} value={stats.notified}
              color={S.notified.color} border={S.notified.border}
              onClick={() => { setStatusFilter('notified'); setPage(1); }} active={statusFilter === 'notified'} />
            <StatCard label={statusLabels.resolved} value={stats.resolved}
              color={S.resolved.color} border={S.resolved.border}
              onClick={() => { setStatusFilter('resolved'); setPage(1); }} active={statusFilter === 'resolved'} />
            <StatCard label={statusLabels.fined}    value={stats.fined}
              color={S.fined.color}    border={S.fined.border}
              onClick={() => { setStatusFilter('fined'); setPage(1); }} active={statusFilter === 'fined'} />
            {stats.no_project > 0 && (
              <StatCard label="No Project" value={stats.no_project}
                color="#D97706" border="#FDE68A" />
            )}
          </div>
        )}

        {/* ══ Filters ═════════════════════════════════════════════════════════ */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder={t('viol', 'searchPlaceholder')}
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="input"
            style={{ flex: 1, minWidth: 220, fontSize: 13 }}
          />
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="input"
            style={{ minWidth: 160, fontSize: 13 }}
          >
            <option value="">{t('viol', 'allStatuses')}</option>
            {(['new', 'notified', 'resolved', 'fined'] as const).map(s => (
              <option key={s} value={s}>{statusLabels[s]}</option>
            ))}
          </select>
        </div>

        {/* ══ Bulk Actions ════════════════════════════════════════════════════ */}
        {selectedIds.size > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 18px', borderRadius: 12,
            background: '#EFF6FF', border: '1.5px solid #93C5FD',
          }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#1E40AF' }}>
              {selectedIds.size} {t('viol', 'violations')} selected
            </span>
            <button
              onClick={() => bulkMutation.mutate(Array.from(selectedIds))}
              disabled={bulkMutation.isPending}
              style={{
                padding: '7px 16px', borderRadius: 8, border: 'none',
                background: '#22C55E', color: '#fff', fontWeight: 600, fontSize: 13,
                cursor: 'pointer', opacity: bulkMutation.isPending ? 0.6 : 1,
              }}
            >
              {t('viol', 'markResolved')}
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              style={{ padding: '7px 12px', borderRadius: 8, border: 'none', background: '#E5E7EB', cursor: 'pointer', fontSize: 13, color: '#6B7280' }}
            >
              ✕ Cancel
            </button>
          </div>
        )}

        {/* ══ Table ═══════════════════════════════════════════════════════════ */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          {isLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
              <div className="w-8 h-8 border-4 rounded-full animate-spin"
                style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
            </div>
          ) : violations.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 8 }}>
              <span style={{ fontSize: 40 }}>✅</span>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{t('viol', 'noViolations')}</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                    <Th w={40}>
                      <input type="checkbox" checked={allSelected} onChange={toggleAll} style={{ width: 16, height: 16, cursor: 'pointer' }} />
                    </Th>
                    <Th>{t('viol', 'refNum')}</Th>
                    <Th>{t('viol', 'sectorPlot')}</Th>
                    <Th>{t('viol', 'project')}</Th>
                    <Th>{t('viol', 'engineer')}</Th>
                    <Th w={80} center>{t('viol', 'deadline')}</Th>
                    <Th w={110} center>{t('viol', 'fine')}</Th>
                    <Th w={90} center>{t('viol', 'date')}</Th>
                    <Th w={120} center>{t('viol', 'status')}</Th>
                    <Th w={150}>{t('viol', 'action')}</Th>
                  </tr>
                </thead>
                <tbody>
                  {violations.map((v, idx) => {
                    const meta      = S[v.status as keyof typeof S] ?? S.new;
                    const hasError  = !!v.parse_error && !v.project;
                    const isExp     = expandedRow === v.id;
                    const isSel     = selectedIds.has(v.id);
                    const isEven    = idx % 2 === 0;

                    return (
                      <>
                        <tr key={v.id} style={{
                          background: isSel ? '#EFF6FF' : hasError ? '#FFFBEB' : isEven ? '#fff' : '#FAFAFA',
                          borderBottom: '1px solid #F1F5F9',
                          transition: 'background 0.1s',
                        }}>
                          {/* Checkbox */}
                          <Td>
                            <input type="checkbox" checked={isSel} onChange={() => toggleOne(v.id)}
                              style={{ width: 16, height: 16, cursor: 'pointer' }} />
                          </Td>

                          {/* Reference */}
                          <Td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              {hasError && <span title={v.parse_error} style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B', display: 'inline-block', flexShrink: 0 }} />}
                              <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 12, color: 'var(--text-primary)', letterSpacing: 0.3 }}>
                                {v.reference_number || '—'}
                              </span>
                            </div>
                          </Td>

                          {/* Sector / Plot */}
                          <Td>
                            {v.sector
                              ? <div>
                                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{v.sector}</div>
                                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                                    {t('viol', 'plot')} {v.plot}
                                  </div>
                                </div>
                              : <span style={{ color: 'var(--text-tertiary)' }}>—</span>
                            }
                          </Td>

                          {/* Project */}
                          <Td>
                            {v.project_name
                              ? <span style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: 13 }}>{v.project_name}</span>
                              : <span style={{
                                  display: 'inline-block', padding: '2px 8px', borderRadius: 20,
                                  background: '#FEF3C7', color: '#92400E', fontSize: 11, fontWeight: 600,
                                }}>
                                  {t('viol', 'testNotLinked')}
                                </span>
                            }
                          </Td>

                          {/* Engineer */}
                          <Td>
                            {v.engineer_name
                              ? <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <div style={{
                                    width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                                    background: 'var(--color-primary)', color: '#fff',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 11, fontWeight: 700,
                                  }}>
                                    {v.engineer_name[0].toUpperCase()}
                                  </div>
                                  <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{v.engineer_name}</span>
                                </div>
                              : <span style={{ color: 'var(--text-tertiary)' }}>—</span>
                            }
                          </Td>

                          {/* Deadline */}
                          <Td center>
                            {v.deadline_days != null
                              ? <span style={{
                                  display: 'inline-block', padding: '3px 9px', borderRadius: 8,
                                  fontWeight: 700, fontSize: 12,
                                  background: v.deadline_days <= 1 ? '#FEE2E2' : v.deadline_days <= 3 ? '#FEF3C7' : '#F0FDF4',
                                  color: v.deadline_days <= 1 ? '#DC2626' : v.deadline_days <= 3 ? '#D97706' : '#16A34A',
                                }}>
                                  {v.deadline_days}d
                                </span>
                              : <span style={{ color: 'var(--text-tertiary)' }}>—</span>
                            }
                          </Td>

                          {/* Fine */}
                          <Td center>
                            {v.fine_amount
                              ? <div style={{ lineHeight: 1.3 }}>
                                  <span style={{ fontWeight: 800, color: '#DC2626', fontSize: 13 }}>
                                    {Number(v.fine_amount).toLocaleString()}
                                  </span>
                                  <span style={{ fontSize: 10, color: '#9CA3AF', display: 'block' }}>AED</span>
                                </div>
                              : <span style={{ color: 'var(--text-tertiary)' }}>—</span>
                            }
                          </Td>

                          {/* Date */}
                          <Td center>
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{fmtDate(v.received_at)}</div>
                            {v.resolved_at && (
                              <div style={{ fontSize: 10, color: '#22C55E', marginTop: 2 }}>✅ {fmtDate(v.resolved_at)}</div>
                            )}
                          </Td>

                          {/* Status */}
                          <Td center>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              padding: '5px 11px', borderRadius: 20,
                              background: meta.bg, color: meta.color,
                              fontSize: 11, fontWeight: 700, border: `1px solid ${meta.border}`,
                              whiteSpace: 'nowrap',
                            }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: meta.dot, flexShrink: 0 }} />
                              {statusLabels[v.status] ?? v.status}
                            </span>
                          </Td>

                          {/* Actions */}
                          <Td>
                            <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
                              {/* Copy resolve link */}
                              <ActionBtn
                                onClick={() => copyLink(v)}
                                title="Copy resolve link"
                                bg={copiedId === v.id ? '#DCFCE7' : '#EFF6FF'}
                                color={copiedId === v.id ? '#15803D' : '#1D4ED8'}
                              >
                                {copiedId === v.id ? 'Copied' : 'Link'}
                              </ActionBtn>

                              {/* Expand details */}
                              {(v.parse_error || v.raw_message) && (
                                <ActionBtn
                                  onClick={() => setExpandedRow(isExp ? null : v.id)}
                                  bg={isExp ? '#F3F4F6' : '#F8FAFC'}
                                  color="#64748B"
                                >
                                  {isExp ? '▲' : '▼'}
                                </ActionBtn>
                              )}

                              {/* ADM link */}
                              {v.violation_url && (
                                <a href={v.violation_url} target="_blank" rel="noreferrer"
                                  style={{
                                    padding: '4px 9px', borderRadius: 7, fontSize: 11, fontWeight: 600,
                                    background: '#F0FDF4', color: '#15803D', border: '1px solid #86EFAC',
                                    textDecoration: 'none', whiteSpace: 'nowrap',
                                  }}>
                                  ADM ↗
                                </a>
                              )}

                              {/* Mark resolved */}
                              {v.status !== 'resolved' && (
                                <ActionBtn
                                  onClick={() => resolveMutation.mutate(v.id)}
                                  bg="#DCFCE7" color="#15803D"
                                  disabled={resolveMutation.isPending}
                                >
                                  Resolve
                                </ActionBtn>
                              )}
                            </div>
                          </Td>
                        </tr>

                        {/* Expanded row */}
                        {isExp && (() => {
                          const { body, urls } = parseMessage(v.raw_message);
                          return (
                            <tr key={`${v.id}-exp`} style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                              <td colSpan={10} style={{ padding: '0 24px 20px 24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <div style={{
                                  background: '#fff', borderRadius: 14,
                                  border: '1.5px solid #E2E8F0',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                                  overflow: 'hidden', width: 640,
                                }}>
                                  {/* Header strip */}
                                  <div style={{
                                    padding: '9px 16px', background: '#F8FAFC',
                                    borderBottom: '1px solid #E2E8F0',
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                  }}>
                                    <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B' }}>
                                      Original SMS
                                    </span>
                                    <span style={{ fontSize: 11, color: '#94A3B8' }}>{v.sender} · {fmtDate(v.received_at)}</span>
                                  </div>

                                  {/* Parse error */}
                                  {v.parse_error && (
                                    <div style={{
                                      padding: '8px 16px',
                                      background: '#FFFBEB', borderBottom: '1px solid #FDE68A',
                                      fontSize: 12, fontWeight: 600, color: '#92400E',
                                    }}>
                                      {v.parse_error}
                                    </div>
                                  )}

                                  {/* Message body */}
                                  <div style={{
                                    padding: '20px 32px',
                                    direction: 'rtl', textAlign: 'center',
                                    fontSize: 14, lineHeight: 2.2, color: '#1E293B',
                                    fontFamily: 'system-ui, -apple-system, "Segoe UI", Tahoma, Arial, sans-serif',
                                    whiteSpace: 'pre-wrap',
                                  }}>
                                    {body}
                                  </div>

                                  {/* URLs as buttons */}
                                  {urls.length > 0 && (
                                    <div style={{
                                      padding: '10px 16px 14px',
                                      borderTop: '1px solid #F1F5F9',
                                      display: 'flex', flexWrap: 'wrap', gap: 8,
                                    }}>
                                      {urls.map((url, i) => (
                                        <a key={i} href={url} target="_blank" rel="noreferrer" style={{
                                          display: 'inline-flex', alignItems: 'center', gap: 5,
                                          padding: '6px 14px', borderRadius: 8,
                                          background: '#EFF6FF', color: '#1D4ED8',
                                          border: '1px solid #BFDBFE',
                                          fontSize: 12, fontWeight: 600,
                                          textDecoration: 'none',
                                        }}>
                                          {i === 0 ? 'View on ADM' : `Link ${i + 1}`} ↗
                                        </a>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                </div>
                              </td>
                            </tr>
                          );
                        })()}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ══ Pagination ══════════════════════════════════════════════════════ */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="btn btn-secondary text-sm px-3 py-1.5">
              {t('btn', 'previous')}
            </button>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>
              {page} / {totalPages}
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

/* ─── Small helpers ──────────────────────────────────────────────────────── */
function Th({ children, w, center }: { children?: React.ReactNode; w?: number; center?: boolean }) {
  return (
    <th style={{
      padding: '12px 16px', fontSize: 11, fontWeight: 700,
      color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.6,
      whiteSpace: 'nowrap', width: w,
      textAlign: center ? 'center' : 'left',
    }}>
      {children}
    </th>
  );
}

function Td({ children, center }: { children: React.ReactNode; center?: boolean }) {
  return (
    <td style={{ padding: '13px 16px', verticalAlign: 'middle', textAlign: center ? 'center' : 'left' }}>
      {children}
    </td>
  );
}

function ActionBtn({ children, onClick, bg, color, title, disabled }: {
  children: React.ReactNode; onClick?: () => void; bg: string; color: string;
  title?: string; disabled?: boolean;
}) {
  return (
    <button onClick={onClick} title={title} disabled={disabled} style={{
      padding: '4px 9px', borderRadius: 7, border: 'none',
      background: bg, color, fontSize: 12, fontWeight: 600,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1, transition: 'opacity 0.15s',
    }}>
      {children}
    </button>
  );
}
