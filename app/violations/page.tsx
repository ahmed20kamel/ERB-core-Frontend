'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MainLayout from '@/components/layout/MainLayout';
import { violationsApi } from '@/lib/api/violations';
import { MunicipalViolation } from '@/types';
import { useAuth } from '@/lib/hooks/use-auth';
import { useT } from '@/lib/i18n/useT';

const FRONTEND_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://purchase-self.vercel.app';

const S = {
  new:      { bg: '#FEF9C3', color: '#854D0E', dot: '#EAB308', border: '#FDE047' },
  notified: { bg: '#DBEAFE', color: '#1E3A8A', dot: '#3B82F6', border: '#93C5FD' },
  resolved: { bg: '#DCFCE7', color: '#14532D', dot: '#22C55E', border: '#86EFAC' },
  fined:    { bg: '#FEE2E2', color: '#7F1D1D', dot: '#EF4444', border: '#FCA5A5' },
} as const;

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: '2-digit' });
}

function parseMessage(text: string): { body: string; urls: string[] } {
  const urlRx = /https?:\/\/[^\s]+/g;
  const urls = text.match(urlRx) ?? [];
  const body = text.replace(urlRx, '').replace(/\n{3,}/g, '\n\n').trim();
  return { body, urls };
}

/* group violations by reference_number */
function groupViolations(violations: MunicipalViolation[]): MunicipalViolation[][] {
  const map = new Map<string, MunicipalViolation[]>();
  for (const v of violations) {
    const key = v.reference_number?.trim() || `__id_${v.id}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(v);
  }
  return Array.from(map.values());
}

/* ─── Stat card ──────────────────────────────────────────────────────────── */
function StatCard({ label, value, color, border, onClick, active, sublabel }: {
  label: string; value: number; color: string; border: string;
  onClick?: () => void; active?: boolean; sublabel?: string;
}) {
  return (
    <button onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default', textAlign: 'left', width: '100%', background: 'none', border: 'none', padding: 0 }}>
      <div style={{
        background: active ? `${color}0f` : '#fff',
        border: active ? `2px solid ${color}` : `1.5px solid ${border}`,
        borderRadius: 12, padding: '14px 16px',
        boxShadow: active ? `0 0 0 3px ${color}18` : '0 1px 3px rgba(0,0,0,0.05)',
        transition: 'all 0.15s',
      }}>
        <div style={{ fontSize: 30, fontWeight: 800, color, lineHeight: 1, marginBottom: 5 }}>{value}</div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>{label}</div>
        {sublabel && <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>{sublabel}</div>}
      </div>
    </button>
  );
}

/* ─── Main ───────────────────────────────────────────────────────────────── */
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
  const [expandedRef, setExpandedRef] = useState<string | null>(null);
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
  const totalCount = data?.count ?? 0;
  const totalPages = Math.ceil(totalCount / 50);

  const grouped = groupViolations(violations);
  const allPrimaryIds = grouped.map(g => g[0].id);
  const allSelected = allPrimaryIds.length > 0 && allPrimaryIds.every(id => selectedIds.has(id));

  const statusLabels: Record<string, string> = {
    new: t('viol', 'statusNew'), notified: t('viol', 'statusNotified'),
    resolved: t('viol', 'statusResolved'), fined: t('viol', 'statusFined'),
  };

  const toggleAll = () => {
    if (allSelected) setSelectedIds(p => { const s = new Set(p); allPrimaryIds.forEach(id => s.delete(id)); return s; });
    else             setSelectedIds(p => { const s = new Set(p); allPrimaryIds.forEach(id => s.add(id)); return s; });
  };
  const toggleOne = (id: number) =>
    setSelectedIds(p => { const s = new Set(p); s.has(id) ? s.delete(id) : s.add(id); return s; });

  return (
    <MainLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 21, fontWeight: 800, color: 'var(--text-primary)' }}>
              {t('viol', 'title')}
            </h1>
            <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
              {t('viol', 'subtitle')}
              {stats && <span style={{ fontWeight: 700, color: 'var(--color-primary)', marginLeft: 6 }}>{stats.total} {t('viol', 'violations')}</span>}
            </p>
          </div>
          <button
            onClick={() => { setTestOpen(o => !o); setTestResult(null); }}
            style={{
              padding: '8px 16px', borderRadius: 9, border: '1.5px solid #E5E7EB',
              background: testOpen ? '#F0FDF4' : '#fff', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, color: testOpen ? '#15803D' : 'var(--text-primary)',
            }}
          >
            {t('viol', 'testPanel')}
          </button>
        </div>

        {/* Test panel */}
        {testOpen && (
          <div style={{ background: '#FFFBEB', border: '1.5px solid #FDE68A', borderRadius: 14, padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#92400E' }}>{t('viol', 'testPanel')}</p>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: '#B45309' }}>{t('viol', 'testHint')}</p>
            </div>
            <textarea value={testMsg} onChange={e => { setTestMsg(e.target.value); setTestResult(null); }}
              placeholder={t('viol', 'testPlaceholder')} rows={4} className="input w-full"
              style={{ resize: 'vertical', direction: 'rtl', fontSize: 13 }} />
            {testResult && (
              <div style={{
                padding: '9px 13px', borderRadius: 9, fontSize: 13, fontWeight: 600,
                background: testResult.type === 'ok' ? '#DCFCE7' : testResult.type === 'ignored' ? '#FEF9C3' : '#FEE2E2',
                color:      testResult.type === 'ok' ? '#14532D' : testResult.type === 'ignored' ? '#854D0E' : '#7F1D1D',
              }}>
                {testResult.detail}
              </div>
            )}
            <button onClick={() => simulateMutation.mutate(testMsg)} disabled={!testMsg.trim() || simulateMutation.isPending}
              className="btn btn-primary text-sm" style={{ alignSelf: 'flex-start' }}>
              {simulateMutation.isPending ? t('viol', 'testSending') : t('viol', 'testSend')}
            </button>
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
            <StatCard label="Total" value={stats.total}
              color="var(--color-primary)" border="#C7D2FE"
              sublabel="All violations"
              onClick={() => { setStatusFilter(''); setPage(1); }} active={statusFilter === ''} />
            <StatCard label={statusLabels.new} value={stats.new}
              color={S.new.color} border={S.new.border}
              sublabel="Needs action"
              onClick={() => { setStatusFilter('new'); setPage(1); }} active={statusFilter === 'new'} />
            <StatCard label={statusLabels.notified} value={stats.notified}
              color={S.notified.color} border={S.notified.border}
              sublabel="Engineer notified"
              onClick={() => { setStatusFilter('notified'); setPage(1); }} active={statusFilter === 'notified'} />
            <StatCard label={statusLabels.resolved} value={stats.resolved}
              color={S.resolved.color} border={S.resolved.border}
              sublabel="Closed"
              onClick={() => { setStatusFilter('resolved'); setPage(1); }} active={statusFilter === 'resolved'} />
            <StatCard label={statusLabels.fined} value={stats.fined}
              color={S.fined.color} border={S.fined.border}
              sublabel="Fine issued"
              onClick={() => { setStatusFilter('fined'); setPage(1); }} active={statusFilter === 'fined'} />
            {stats.no_project > 0 && (
              <StatCard label="No Project" value={stats.no_project}
                color="#D97706" border="#FDE68A"
                sublabel="Unlinked" />
            )}
          </div>
        )}

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input type="text" placeholder={t('viol', 'searchPlaceholder')} value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="input" style={{ flex: 1, minWidth: 220, fontSize: 13 }} />
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="input" style={{ minWidth: 160, fontSize: 13 }}>
            <option value="">{t('viol', 'allStatuses')}</option>
            {(['new', 'notified', 'resolved', 'fined'] as const).map(s => (
              <option key={s} value={s}>{statusLabels[s]}</option>
            ))}
          </select>
        </div>

        {/* Bulk bar */}
        {selectedIds.size > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 10, background: '#EFF6FF', border: '1.5px solid #93C5FD' }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: '#1E40AF' }}>{selectedIds.size} selected</span>
            <button onClick={() => bulkMutation.mutate(Array.from(selectedIds))} disabled={bulkMutation.isPending}
              style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: '#22C55E', color: '#fff', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
              {t('viol', 'markResolved')}
            </button>
            <button onClick={() => setSelectedIds(new Set())}
              style={{ padding: '6px 10px', borderRadius: 8, border: 'none', background: '#E5E7EB', cursor: 'pointer', fontSize: 12, color: '#6B7280' }}>
              Cancel
            </button>
          </div>
        )}

        {/* Table */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
          {isLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 180 }}>
              <div className="w-7 h-7 border-4 rounded-full animate-spin"
                style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
            </div>
          ) : grouped.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 180, gap: 8 }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{t('viol', 'noViolations')}</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                    <th style={thStyle(36)}>
                      <input type="checkbox" checked={allSelected} onChange={toggleAll} style={{ width: 15, height: 15, cursor: 'pointer' }} />
                    </th>
                    <th style={thStyle()}>Reference</th>
                    <th style={thStyle()}>Area / Plot</th>
                    <th style={thStyle()}>Project</th>
                    <th style={thStyle()}>Engineer</th>
                    <th style={{ ...thStyle(80), textAlign: 'center' }}>Deadline</th>
                    <th style={{ ...thStyle(100), textAlign: 'center' }}>Fine</th>
                    <th style={{ ...thStyle(90), textAlign: 'center' }}>Date</th>
                    <th style={{ ...thStyle(115), textAlign: 'center' }}>Status</th>
                    <th style={thStyle(155)}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {grouped.map((group, gi) => {
                    const primary = group[0];
                    const extra   = group.slice(1);
                    const refKey  = primary.reference_number || `__id_${primary.id}`;
                    const isExp   = expandedRef === refKey;
                    const isSel   = selectedIds.has(primary.id);
                    const meta    = S[primary.status as keyof typeof S] ?? S.new;
                    const noProj  = !primary.project;
                    const isEven  = gi % 2 === 0;

                    return (
                      <>
                        {/* Primary row */}
                        <tr key={primary.id} style={{
                          background: isSel ? '#EFF6FF' : noProj && !primary.sector ? '#FFFBEB' : isEven ? '#fff' : '#FAFAFA',
                          borderBottom: '1px solid #F1F5F9',
                        }}>
                          <td style={tdStyle()}>
                            <input type="checkbox" checked={isSel} onChange={() => toggleOne(primary.id)}
                              style={{ width: 15, height: 15, cursor: 'pointer' }} />
                          </td>

                          {/* Reference + message count badge */}
                          <td style={tdStyle()}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              {noProj && primary.sector && (
                                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#F59E0B', display: 'inline-block', flexShrink: 0 }} />
                              )}
                              <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 12, color: 'var(--text-primary)' }}>
                                {primary.reference_number || '—'}
                              </span>
                              {extra.length > 0 && (
                                <span style={{
                                  fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 10,
                                  background: '#E0F2FE', color: '#0369A1', cursor: 'pointer',
                                  flexShrink: 0,
                                }} onClick={() => setExpandedRef(isExp ? null : refKey)}
                                  title={`${extra.length + 1} messages`}>
                                  +{extra.length}
                                </span>
                              )}
                            </div>
                          </td>

                          <td style={tdStyle()}>
                            {primary.sector
                              ? <div>
                                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{primary.sector}</div>
                                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 1 }}>Plot {primary.plot}</div>
                                </div>
                              : <span style={{ color: 'var(--text-tertiary)' }}>—</span>
                            }
                          </td>

                          <td style={tdStyle()}>
                            {primary.project_name
                              ? <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{primary.project_name}</span>
                              : <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 20, background: '#FEF3C7', color: '#92400E', fontSize: 11, fontWeight: 600 }}>
                                  No project
                                </span>
                            }
                          </td>

                          <td style={tdStyle()}>
                            {primary.engineer_name
                              ? <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--color-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                                    {primary.engineer_name[0].toUpperCase()}
                                  </div>
                                  <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}>{primary.engineer_name}</span>
                                </div>
                              : <span style={{ color: 'var(--text-tertiary)' }}>—</span>
                            }
                          </td>

                          <td style={{ ...tdStyle(), textAlign: 'center' }}>
                            {primary.deadline_days != null
                              ? <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 8, fontWeight: 700, fontSize: 12, background: primary.deadline_days <= 1 ? '#FEE2E2' : primary.deadline_days <= 3 ? '#FEF3C7' : '#F0FDF4', color: primary.deadline_days <= 1 ? '#DC2626' : primary.deadline_days <= 3 ? '#D97706' : '#16A34A' }}>
                                  {primary.deadline_days}d
                                </span>
                              : <span style={{ color: 'var(--text-tertiary)' }}>—</span>
                            }
                          </td>

                          <td style={{ ...tdStyle(), textAlign: 'center' }}>
                            {primary.fine_amount
                              ? <div>
                                  <span style={{ fontWeight: 800, color: '#DC2626', fontSize: 13 }}>{Number(primary.fine_amount).toLocaleString()}</span>
                                  <span style={{ fontSize: 10, color: '#9CA3AF', display: 'block' }}>AED</span>
                                </div>
                              : <span style={{ color: 'var(--text-tertiary)' }}>—</span>
                            }
                          </td>

                          <td style={{ ...tdStyle(), textAlign: 'center' }}>
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{fmtDate(primary.received_at)}</div>
                            {primary.resolved_at && (
                              <div style={{ fontSize: 10, color: '#22C55E', marginTop: 2 }}>{fmtDate(primary.resolved_at)}</div>
                            )}
                          </td>

                          <td style={{ ...tdStyle(), textAlign: 'center' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: meta.bg, color: meta.color, fontSize: 11, fontWeight: 700, border: `1px solid ${meta.border}`, whiteSpace: 'nowrap' }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: meta.dot, flexShrink: 0 }} />
                              {statusLabels[primary.status] ?? primary.status}
                            </span>
                          </td>

                          <td style={tdStyle()}>
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                              <Btn bg={copiedId === primary.id ? '#DCFCE7' : '#EFF6FF'} color={copiedId === primary.id ? '#15803D' : '#1D4ED8'} onClick={() => copyLink(primary)}>
                                {copiedId === primary.id ? 'Copied' : 'Link'}
                              </Btn>
                              {extra.length > 0 && (
                                <Btn bg="#F1F5F9" color="#475569" onClick={() => setExpandedRef(isExp ? null : refKey)}>
                                  {isExp ? 'Hide' : `Messages (${extra.length + 1})`}
                                </Btn>
                              )}
                              {primary.violation_url && (
                                <a href={primary.violation_url} target="_blank" rel="noreferrer"
                                  style={{ padding: '4px 9px', borderRadius: 7, fontSize: 11, fontWeight: 600, background: '#F0FDF4', color: '#15803D', border: '1px solid #86EFAC', textDecoration: 'none' }}>
                                  ADM ↗
                                </a>
                              )}
                              {primary.status !== 'resolved' && (
                                <Btn bg="#DCFCE7" color="#15803D" disabled={resolveMutation.isPending} onClick={() => resolveMutation.mutate(primary.id)}>
                                  Resolve
                                </Btn>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Grouped messages panel */}
                        {isExp && (
                          <tr key={`${refKey}-exp`} style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                            <td colSpan={10} style={{ padding: '12px 24px 20px' }}>
                              <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <div style={{ width: '100%', maxWidth: 760 }}>
                                  <p style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
                                    {group.length} messages for reference {primary.reference_number}
                                  </p>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {group.map((v, mi) => {

                                      const { body, urls } = parseMessage(v.raw_message);
                                      const vmeta = S[v.status as keyof typeof S] ?? S.new;
                                      return (
                                        <div key={v.id} style={{ background: '#fff', border: '1.5px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
                                          {/* Message header */}
                                          <div style={{ padding: '8px 14px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                              <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>
                                                {mi === 0 ? 'Latest' : `Message ${group.length - mi}`}
                                              </span>
                                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, background: vmeta.bg, color: vmeta.color, fontSize: 10, fontWeight: 700, border: `1px solid ${vmeta.border}` }}>
                                                <span style={{ width: 5, height: 5, borderRadius: '50%', background: vmeta.dot }} />
                                                {statusLabels[v.status]}
                                              </span>
                                            </div>
                                            <span style={{ fontSize: 11, color: '#94A3B8' }}>{v.sender} · {fmtDate(v.received_at)}</span>
                                          </div>
                                          {/* Message body */}
                                          <div style={{ padding: '14px 24px', direction: 'rtl', textAlign: 'center', fontSize: 13, lineHeight: 2, color: '#1E293B', fontFamily: 'system-ui, -apple-system, Tahoma, Arial, sans-serif', whiteSpace: 'pre-wrap' }}>
                                            {body}
                                          </div>
                                          {/* URLs */}
                                          {urls.length > 0 && (
                                            <div style={{ padding: '8px 14px 12px', borderTop: '1px solid #F1F5F9', display: 'flex', gap: 8 }}>
                                              {urls.map((url, ui) => (
                                                <a key={ui} href={url} target="_blank" rel="noreferrer"
                                                  style={{ padding: '5px 12px', borderRadius: 8, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', fontSize: 11, fontWeight: 600, textDecoration: 'none' }}>
                                                  {ui === 0 ? 'View on ADM' : `Link ${ui + 1}`} ↗
                                                </a>
                                              ))}
                                              {v.status !== 'resolved' && (
                                                <button onClick={() => resolveMutation.mutate(v.id)} disabled={resolveMutation.isPending}
                                                  style={{ padding: '5px 12px', borderRadius: 8, background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                                                  Mark Resolved
                                                </button>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                  {/* Collapse arrow */}
                                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14 }}>
                                    <button
                                      onClick={() => setExpandedRef(null)}
                                      title="Close"
                                      style={{
                                        display: 'flex', alignItems: 'center', gap: 5,
                                        padding: '5px 16px', borderRadius: 20,
                                        border: '1.5px solid #E2E8F0', background: '#fff',
                                        color: '#64748B', fontSize: 11, fontWeight: 600,
                                        cursor: 'pointer', lineHeight: 1,
                                      }}
                                    >
                                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                        <path d="M2 8L6 4L10 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                      </svg>
                                      Close
                                    </button>
                                  </div>
                                </div>
                              </div>
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn btn-secondary text-sm px-3 py-1.5">
              {t('btn', 'previous')}
            </button>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn btn-secondary text-sm px-3 py-1.5">
              {t('btn', 'next')}
            </button>
          </div>
        )}

      </div>
    </MainLayout>
  );
}

/* ─── Tiny helpers ───────────────────────────────────────────────────────── */
function thStyle(w?: number): React.CSSProperties {
  return { padding: '11px 14px', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap', width: w };
}
function tdStyle(): React.CSSProperties {
  return { padding: '12px 14px', verticalAlign: 'middle' };
}
function Btn({ children, onClick, bg, color, disabled, title }: {
  children: React.ReactNode; onClick?: () => void;
  bg: string; color: string; disabled?: boolean; title?: string;
}) {
  return (
    <button onClick={onClick} disabled={disabled} title={title} style={{
      padding: '4px 9px', borderRadius: 7, border: 'none', background: bg, color,
      fontSize: 11, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1, transition: 'opacity 0.15s', whiteSpace: 'nowrap',
    }}>
      {children}
    </button>
  );
}
