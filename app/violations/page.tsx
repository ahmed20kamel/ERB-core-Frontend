'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MainLayout from '@/components/layout/MainLayout';
import { violationsApi } from '@/lib/api/violations';
import { projectsApi } from '@/lib/api/projects';
import { MunicipalViolation } from '@/types';
import { useAuth } from '@/lib/hooks/use-auth';
import { useT } from '@/lib/i18n/useT';

const FRONTEND_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://purchase-self.vercel.app';

/* ─── Status config ──────────────────────────────────────────────────────── */
const STATUS_CFG = {
  new:      { bg: '#FEF9C3', color: '#854D0E', dot: '#EAB308', border: '#FDE047', label: 'جديدة',       labelEn: 'New' },
  notified: { bg: '#DBEAFE', color: '#1E3A8A', dot: '#3B82F6', border: '#93C5FD', label: 'تم الإبلاغ',  labelEn: 'Notified' },
  resolved: { bg: '#DCFCE7', color: '#14532D', dot: '#22C55E', border: '#86EFAC', label: 'محلولة',      labelEn: 'Resolved' },
  fined:    { bg: '#FEE2E2', color: '#7F1D1D', dot: '#EF4444', border: '#FCA5A5', label: 'صدرت غرامة',  labelEn: 'Fined' },
} as const;

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('ar-AE', { day: '2-digit', month: 'short', year: '2-digit' });
}

function parseMessage(text: string) {
  const urlRx = /https?:\/\/[^\s]+/g;
  const urls = text.match(urlRx) ?? [];
  const body = text.replace(urlRx, '').replace(/\n{3,}/g, '\n\n').trim();
  return { body, urls };
}

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
function StatCard({ label, value, sub, color, border, active, onClick }: {
  label: string; value: number; sub?: string;
  color: string; border: string; active?: boolean; onClick?: () => void;
}) {
  return (
    <button onClick={onClick} style={{
      textAlign: 'left', width: '100%', background: 'none', border: 'none', padding: 0,
      cursor: onClick ? 'pointer' : 'default',
    }}>
      <div style={{
        background: active ? `${color}10` : '#fff',
        border: active ? `2px solid ${color}` : `1.5px solid ${border}`,
        borderRadius: 12, padding: '12px 16px',
        boxShadow: active ? `0 0 0 3px ${color}15` : '0 1px 3px rgba(0,0,0,0.04)',
        transition: 'all 0.15s',
      }}>
        <div style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1, marginBottom: 4 }}>{value}</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>{label}</div>
        {sub && <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>{sub}</div>}
      </div>
    </button>
  );
}

/* ─── Status badge ───────────────────────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status as keyof typeof STATUS_CFG] ?? STATUS_CFG.new;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 20,
      background: cfg.bg, color: cfg.color,
      fontSize: 11, fontWeight: 700, border: `1px solid ${cfg.border}`,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

/* ─── Detail Panel ───────────────────────────────────────────────────────── */
function ViolationDetailPanel({
  group, onClose, onResolve, onLinkProject, resolving, linking,
  projects,
}: {
  group: MunicipalViolation[];
  onClose: () => void;
  onResolve: (id: number) => void;
  onLinkProject: (id: number, projectId: number | null) => void;
  resolving: boolean;
  linking: boolean;
  projects: Array<{ id: number; name: string }>;
}) {
  const primary = group[0];
  const { body, urls } = parseMessage(primary.raw_message);
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>(primary.project?.toString() ?? '');

  useEffect(() => {
    setSelectedProject(primary.project?.toString() ?? '');
  }, [primary.id, primary.project]);

  const copyLink = () => {
    navigator.clipboard.writeText(`${FRONTEND_URL}/resolve/${primary.resolve_token}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div style={{
      width: 420, flexShrink: 0, display: 'flex', flexDirection: 'column',
      background: '#fff', border: '1.5px solid #E2E8F0', borderRadius: 16,
      overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
      position: 'sticky', top: 0, maxHeight: 'calc(100vh - 140px)', overflowY: 'auto',
    }}>
      {/* Panel header */}
      <div style={{ padding: '14px 18px', borderBottom: '1.5px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 10, background: '#FAFAFA' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 15, color: '#0F172A' }}>
              {primary.reference_number || `#${primary.id}`}
            </span>
            <StatusBadge status={primary.status} />
          </div>
          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 3 }}>
            {primary.sender} · {fmtDate(primary.received_at)}
            {group.length > 1 && <span style={{ marginLeft: 8, background: '#E0F2FE', color: '#0369A1', padding: '1px 6px', borderRadius: 8, fontSize: 10, fontWeight: 700 }}>{group.length} رسائل</span>}
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#94A3B8', fontSize: 18, lineHeight: 1 }}>✕</button>
      </div>

      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Raw SMS message */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>نص الرسالة</div>
          <div style={{
            background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: 12,
            padding: '14px 16px', direction: 'rtl', textAlign: 'right',
            fontSize: 13, lineHeight: 2, color: '#1E293B',
            fontFamily: 'system-ui, Tahoma, Arial, sans-serif',
            whiteSpace: 'pre-wrap', maxHeight: 200, overflowY: 'auto',
          }}>
            {body || primary.raw_message}
          </div>
          {urls.length > 0 && (
            <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {urls.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noreferrer" style={{
                  padding: '4px 10px', borderRadius: 7, background: '#EFF6FF',
                  color: '#1D4ED8', border: '1px solid #BFDBFE', fontSize: 11, fontWeight: 600,
                  textDecoration: 'none',
                }}>
                  فتح رابط ADM ↗
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Parsed fields grid */}
        {(primary.area || primary.sector || primary.plot || primary.fine_amount || primary.deadline_days) && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>تفاصيل المخالفة</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {primary.area && <InfoBox label="المنطقة" value={primary.area} />}
              {primary.sector && <InfoBox label="رقم الحوض" value={primary.sector} />}
              {primary.plot && <InfoBox label="رقم القطعة" value={primary.plot} />}
              {primary.violation_date && <InfoBox label="تاريخ المخالفة" value={primary.violation_date} />}
              {primary.fine_amount && (
                <InfoBox label="قيمة الغرامة"
                  value={`${Number(primary.fine_amount).toLocaleString()} AED`}
                  valueColor="#DC2626" bold />
              )}
              {primary.deadline_days != null && (
                <InfoBox label="المهلة"
                  value={`${primary.deadline_days} يوم`}
                  valueColor={primary.deadline_days <= 1 ? '#DC2626' : primary.deadline_days <= 3 ? '#D97706' : '#16A34A'}
                  bold />
              )}
            </div>
            {primary.violation_description && (
              <div style={{ marginTop: 8, padding: '10px 12px', background: '#FEF9C3', borderRadius: 8, border: '1px solid #FDE68A', fontSize: 12, color: '#92400E', direction: 'rtl', textAlign: 'right', lineHeight: 1.7 }}>
                {primary.violation_description}
              </div>
            )}
          </div>
        )}

        {/* Project & engineer */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>المشروع والمهندس</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Project selector */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select
                value={selectedProject}
                onChange={e => setSelectedProject(e.target.value)}
                style={{
                  flex: 1, padding: '8px 12px', borderRadius: 8, border: '1.5px solid #E2E8F0',
                  fontSize: 12, background: '#fff', color: '#0F172A',
                }}
              >
                <option value="">— بدون مشروع —</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <button
                onClick={() => onLinkProject(primary.id, selectedProject ? Number(selectedProject) : null)}
                disabled={linking || selectedProject === (primary.project?.toString() ?? '')}
                style={{
                  padding: '8px 14px', borderRadius: 8, border: 'none',
                  background: '#2563EB', color: '#fff', fontSize: 12, fontWeight: 600,
                  cursor: linking ? 'wait' : 'pointer', opacity: linking ? 0.7 : 1,
                  whiteSpace: 'nowrap',
                }}
              >
                {linking ? '...' : 'ربط'}
              </button>
            </div>
            {/* Engineer */}
            {primary.engineer_name ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#F8FAFC', borderRadius: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#2563EB', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                  {primary.engineer_name[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#0F172A' }}>{primary.engineer_name}</div>
                  <div style={{ fontSize: 10, color: '#94A3B8' }}>المهندس المسؤول</div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '8px 12px', background: '#FEF9C3', borderRadius: 8, fontSize: 11, color: '#92400E', border: '1px solid #FDE68A' }}>
                لم يتم تعيين مهندس — اختر المشروع لتعيين المهندس تلقائياً
              </div>
            )}
          </div>
        </div>

        {/* Multiple messages in group */}
        {group.length > 1 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
              جميع الرسائل ({group.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {group.map((v, i) => {
                const { body: vBody } = parseMessage(v.raw_message);
                return (
                  <div key={v.id} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{ padding: '6px 12px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#64748B' }}>{i === 0 ? 'الأحدث' : `رسالة ${group.length - i}`}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <StatusBadge status={v.status} />
                        <span style={{ fontSize: 10, color: '#94A3B8' }}>{fmtDate(v.received_at)}</span>
                      </div>
                    </div>
                    <div style={{ padding: '10px 12px', direction: 'rtl', textAlign: 'right', fontSize: 12, lineHeight: 1.8, color: '#334155', whiteSpace: 'pre-wrap', maxHeight: 120, overflowY: 'auto', fontFamily: 'system-ui, Tahoma, Arial, sans-serif' }}>
                      {vBody}
                    </div>
                    {v.status !== 'resolved' && (
                      <div style={{ padding: '6px 12px', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'flex-end' }}>
                        <button onClick={() => onResolve(v.id)} disabled={resolving}
                          style={{ padding: '4px 12px', borderRadius: 7, border: '1px solid #86EFAC', background: '#DCFCE7', color: '#15803D', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                          تمت المعالجة
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', borderTop: '1.5px solid #F1F5F9', paddingTop: 14 }}>
          {primary.status !== 'resolved' && (
            <button
              onClick={() => onResolve(primary.id)} disabled={resolving}
              style={{
                flex: 1, padding: '10px', borderRadius: 9, border: 'none',
                background: '#22C55E', color: '#fff', fontSize: 13, fontWeight: 700,
                cursor: resolving ? 'wait' : 'pointer', opacity: resolving ? 0.7 : 1,
              }}
            >
              ✓ تمت المعالجة
            </button>
          )}
          <button
            onClick={copyLink}
            style={{
              padding: '10px 14px', borderRadius: 9,
              border: `1.5px solid ${copiedLink ? '#86EFAC' : '#CBD5E1'}`,
              background: copiedLink ? '#DCFCE7' : '#F8FAFC',
              color: copiedLink ? '#15803D' : '#475569',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            {copiedLink ? '✓ تم النسخ' : '🔗 رابط المهندس'}
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoBox({ label, value, valueColor, bold }: { label: string; value: string; valueColor?: string; bold?: boolean }) {
  return (
    <div style={{ padding: '8px 12px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #F1F5F9' }}>
      <div style={{ fontSize: 10, color: '#94A3B8', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: bold ? 700 : 600, color: valueColor ?? '#0F172A' }}>{value}</div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */
export default function ViolationsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const t = useT();

  const [page, setPage]                 = useState(1);
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedRef, setSelectedRef]   = useState<string | null>(null);
  const [testOpen, setTestOpen]         = useState(false);
  const [testMsg, setTestMsg]           = useState('');
  const [testResult, setTestResult]     = useState<null | { type: 'ok' | 'ignored' | 'error'; detail: string }>(null);
  const [selectedIds, setSelectedIds]   = useState<Set<number>>(new Set());

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

  const { data: projectsData } = useQuery({
    queryKey: ['projects-list'],
    queryFn: () => projectsApi.getAll({ page_size: 200 }),
    enabled: isAdmin,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['violations'] });
    queryClient.invalidateQueries({ queryKey: ['violations-stats'] });
  };

  const resolveMutation   = useMutation({ mutationFn: (id: number) => violationsApi.markResolved(id), onSuccess: invalidate });
  const bulkMutation      = useMutation({ mutationFn: (ids: number[]) => violationsApi.bulkAction(ids, 'resolve'), onSuccess: () => { setSelectedIds(new Set()); invalidate(); } });
  const linkMutation      = useMutation({ mutationFn: ({ id, projectId }: { id: number; projectId: number | null }) => violationsApi.linkProject(id, projectId), onSuccess: invalidate });

  const simulateMutation = useMutation({
    mutationFn: (msg: string) => violationsApi.simulate(msg),
    onSuccess: (res) => {
      if (res.status === 'ok') {
        setTestResult({ type: 'ok', detail: [res.reference && `Ref: ${res.reference}`, res.project ?? 'لا يوجد مشروع', res.engineer].filter(Boolean).join(' · ') });
        setTestMsg(''); invalidate();
      } else {
        setTestResult({ type: 'ignored', detail: res.reason ?? 'ليست رسالة مخالفة' });
      }
    },
    onError: () => setTestResult({ type: 'error', detail: 'حدث خطأ' }),
  });

  if (!isAdmin) return (
    <MainLayout>
      <div className="flex items-center justify-center h-64">
        <p style={{ color: 'var(--text-secondary)' }}>ليس لديك صلاحية لعرض هذه الصفحة</p>
      </div>
    </MainLayout>
  );

  const violations: MunicipalViolation[] = data?.results ?? [];
  const totalCount = data?.count ?? 0;
  const totalPages = Math.ceil(totalCount / 50);
  const grouped = groupViolations(violations);
  const allPrimaryIds = grouped.map(g => g[0].id);
  const allSelected = allPrimaryIds.length > 0 && allPrimaryIds.every(id => selectedIds.has(id));
  const projects = (projectsData?.results ?? []).map((p: any) => ({ id: p.id, name: p.name || p.project_name || `Project ${p.id}` }));

  const selectedGroup = selectedRef ? grouped.find(g => (g[0].reference_number || `__id_${g[0].id}`) === selectedRef) : null;

  const toggleAll = () => {
    if (allSelected) setSelectedIds(p => { const s = new Set(p); allPrimaryIds.forEach(id => s.delete(id)); return s; });
    else             setSelectedIds(p => { const s = new Set(p); allPrimaryIds.forEach(id => s.add(id)); return s; });
  };

  return (
    <MainLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 21, fontWeight: 800, color: 'var(--text-primary)' }}>
              مخالفات بلدية أبوظبي
            </h1>
            <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
              رسائل بلدية مدينة أبوظبي
              {stats && <span style={{ fontWeight: 700, color: 'var(--color-primary)', marginLeft: 6 }}>{stats.total} مخالفة</span>}
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
            اختبار برسالة قديمة
          </button>
        </div>

        {/* Status workflow explanation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 11, color: '#64748B', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700 }}>مسار المخالفة:</span>
          {(['new', 'notified', 'resolved'] as const).map((s, i) => (
            <span key={s} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {i > 0 && <span style={{ color: '#CBD5E1' }}>←</span>}
              <StatusBadge status={s} />
            </span>
          ))}
          <span style={{ marginLeft: 8, color: '#94A3B8' }}>اضغط على أي مخالفة لعرض التفاصيل والإجراءات</span>
        </div>

        {/* Test panel */}
        {testOpen && (
          <div style={{ background: '#FFFBEB', border: '1.5px solid #FDE68A', borderRadius: 14, padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#92400E' }}>اختبار بنص رسالة</p>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: '#B45309' }}>الصق نص رسالة بلدية أبوظبي لاختبار التحليل</p>
            </div>
            <textarea value={testMsg} onChange={e => { setTestMsg(e.target.value); setTestResult(null); }}
              placeholder="الصق نص الرسالة هنا..." rows={4}
              style={{ padding: 12, borderRadius: 8, border: '1.5px solid #FDE68A', resize: 'vertical', direction: 'rtl', fontSize: 13, fontFamily: 'system-ui, Tahoma, Arial, sans-serif', background: '#fff', width: '100%' }} />
            {testResult && (
              <div style={{
                padding: '9px 13px', borderRadius: 9, fontSize: 13, fontWeight: 600,
                background: testResult.type === 'ok' ? '#DCFCE7' : testResult.type === 'ignored' ? '#FEF9C3' : '#FEE2E2',
                color:      testResult.type === 'ok' ? '#14532D' : testResult.type === 'ignored' ? '#854D0E' : '#7F1D1D',
              }}>
                {testResult.type === 'ok' ? '✓ ' : testResult.type === 'ignored' ? '⊘ ' : '✗ '}{testResult.detail}
              </div>
            )}
            <button onClick={() => simulateMutation.mutate(testMsg)} disabled={!testMsg.trim() || simulateMutation.isPending}
              style={{ padding: '9px 20px', borderRadius: 9, border: 'none', background: '#D97706', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', alignSelf: 'flex-start', opacity: simulateMutation.isPending ? 0.7 : 1 }}>
              {simulateMutation.isPending ? 'جاري المعالجة...' : 'تحليل الرسالة'}
            </button>
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10 }}>
            <StatCard label="الإجمالي" value={stats.total} sub="جميع المخالفات"
              color="#2563EB" border="#C7D2FE" active={statusFilter === ''} onClick={() => { setStatusFilter(''); setPage(1); }} />
            <StatCard label="جديدة" value={stats.new} sub="تحتاج إجراء"
              color={STATUS_CFG.new.color} border={STATUS_CFG.new.border} active={statusFilter === 'new'} onClick={() => { setStatusFilter('new'); setPage(1); }} />
            <StatCard label="تم الإبلاغ" value={stats.notified} sub="المهندس أُبلغ"
              color={STATUS_CFG.notified.color} border={STATUS_CFG.notified.border} active={statusFilter === 'notified'} onClick={() => { setStatusFilter('notified'); setPage(1); }} />
            <StatCard label="محلولة" value={stats.resolved} sub="مغلقة"
              color={STATUS_CFG.resolved.color} border={STATUS_CFG.resolved.border} active={statusFilter === 'resolved'} onClick={() => { setStatusFilter('resolved'); setPage(1); }} />
            <StatCard label="غرامة" value={stats.fined} sub="صدرت غرامة"
              color={STATUS_CFG.fined.color} border={STATUS_CFG.fined.border} active={statusFilter === 'fined'} onClick={() => { setStatusFilter('fined'); setPage(1); }} />
            {stats.no_project > 0 && (
              <StatCard label="بدون مشروع" value={stats.no_project} sub="تحتاج ربط يدوي"
                color="#D97706" border="#FDE68A" />
            )}
          </div>
        )}

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <input type="text" placeholder="بحث برقم مرجعي أو منطقة أو قطعة..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ flex: 1, minWidth: 220, padding: '9px 14px', borderRadius: 9, border: '1.5px solid #E2E8F0', fontSize: 13 }} />
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            style={{ minWidth: 160, padding: '9px 12px', borderRadius: 9, border: '1.5px solid #E2E8F0', fontSize: 13 }}>
            <option value="">جميع الحالات</option>
            <option value="new">جديدة</option>
            <option value="notified">تم الإبلاغ</option>
            <option value="resolved">محلولة</option>
            <option value="fined">صدرت غرامة</option>
          </select>
        </div>

        {/* Bulk action bar */}
        {selectedIds.size > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 10, background: '#EFF6FF', border: '1.5px solid #93C5FD' }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: '#1E40AF' }}>تم اختيار {selectedIds.size}</span>
            <button onClick={() => bulkMutation.mutate(Array.from(selectedIds))} disabled={bulkMutation.isPending}
              style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: '#22C55E', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
              تمت المعالجة
            </button>
            <button onClick={() => setSelectedIds(new Set())}
              style={{ padding: '6px 10px', borderRadius: 8, border: 'none', background: '#E5E7EB', cursor: 'pointer', fontSize: 12, color: '#6B7280' }}>
              إلغاء
            </button>
          </div>
        )}

        {/* Main content: table + detail panel */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>

          {/* Table */}
          <div style={{ flex: 1, minWidth: 0, background: '#fff', borderRadius: 14, border: '1.5px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
            {isLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 180 }}>
                <div className="w-7 h-7 border-4 rounded-full animate-spin" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
              </div>
            ) : grouped.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 180, gap: 8 }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>لا توجد مخالفات</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                      <th style={thS(36)}>
                        <input type="checkbox" checked={allSelected} onChange={toggleAll} style={{ width: 15, height: 15, cursor: 'pointer' }} />
                      </th>
                      <th style={thS()}>المرجع</th>
                      <th style={thS()}>وصف المخالفة</th>
                      <th style={thS()}>المنطقة / القطعة</th>
                      <th style={thS()}>المشروع</th>
                      <th style={{ ...thS(90), textAlign: 'center' }}>المهلة</th>
                      <th style={{ ...thS(110), textAlign: 'center' }}>الغرامة</th>
                      <th style={{ ...thS(100), textAlign: 'center' }}>الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grouped.map((group, gi) => {
                      const primary = group[0];
                      const refKey  = primary.reference_number || `__id_${primary.id}`;
                      const isSel   = selectedIds.has(primary.id);
                      const isActive = selectedRef === refKey;
                      const noProj  = !primary.project;
                      const isEven  = gi % 2 === 0;

                      return (
                        <tr
                          key={primary.id}
                          onClick={() => setSelectedRef(isActive ? null : refKey)}
                          style={{
                            background: isActive ? '#EFF6FF' : isSel ? '#F0F9FF' : noProj ? '#FFFBEB' : isEven ? '#fff' : '#FAFAFA',
                            borderBottom: '1px solid #F1F5F9',
                            cursor: 'pointer',
                            borderLeft: isActive ? '3px solid #2563EB' : '3px solid transparent',
                            transition: 'background 0.1s',
                          }}
                        >
                          <td style={tdS()} onClick={e => e.stopPropagation()}>
                            <input type="checkbox" checked={isSel}
                              onChange={() => setSelectedIds(p => { const s = new Set(p); s.has(primary.id) ? s.delete(primary.id) : s.add(primary.id); return s; })}
                              style={{ width: 15, height: 15, cursor: 'pointer' }} />
                          </td>

                          <td style={tdS()}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                              {noProj && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#F59E0B', display: 'inline-block', flexShrink: 0 }} title="بدون مشروع" />}
                              <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 12 }}>
                                {primary.reference_number || `#${primary.id}`}
                              </span>
                              {group.length > 1 && (
                                <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 8, background: '#E0F2FE', color: '#0369A1' }}>
                                  +{group.length - 1}
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>{fmtDate(primary.received_at)}</div>
                          </td>

                          <td style={{ ...tdS(), maxWidth: 220 }}>
                            {primary.violation_description
                              ? <span style={{ fontSize: 12, color: '#334155', direction: 'rtl', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                                  {primary.violation_description}
                                </span>
                              : <span style={{ fontSize: 11, color: '#94A3B8', fontStyle: 'italic' }}>اضغط لعرض الرسالة</span>
                            }
                          </td>

                          <td style={tdS()}>
                            {primary.sector || primary.plot
                              ? <div>
                                  {primary.sector && <div style={{ fontWeight: 600, fontSize: 12 }}>{primary.sector}</div>}
                                  {primary.plot && <div style={{ fontSize: 11, color: '#64748B' }}>قطعة {primary.plot}</div>}
                                </div>
                              : <span style={{ color: '#CBD5E1' }}>—</span>
                            }
                          </td>

                          <td style={tdS()}>
                            {primary.project_name
                              ? <span style={{ fontWeight: 500, fontSize: 12 }}>{primary.project_name}</span>
                              : <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 20, background: '#FEF3C7', color: '#92400E', fontSize: 11, fontWeight: 600 }}>
                                  بدون مشروع
                                </span>
                            }
                          </td>

                          <td style={{ ...tdS(), textAlign: 'center' }}>
                            {primary.deadline_days != null
                              ? <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 8, fontWeight: 700, fontSize: 12, background: primary.deadline_days <= 1 ? '#FEE2E2' : primary.deadline_days <= 3 ? '#FEF3C7' : '#F0FDF4', color: primary.deadline_days <= 1 ? '#DC2626' : primary.deadline_days <= 3 ? '#D97706' : '#16A34A' }}>
                                {primary.deadline_days}د
                              </span>
                              : <span style={{ color: '#CBD5E1' }}>—</span>
                            }
                          </td>

                          <td style={{ ...tdS(), textAlign: 'center' }}>
                            {primary.fine_amount
                              ? <div>
                                  <span style={{ fontWeight: 800, color: '#DC2626', fontSize: 13 }}>{Number(primary.fine_amount).toLocaleString()}</span>
                                  <span style={{ fontSize: 10, color: '#9CA3AF', display: 'block' }}>AED</span>
                                </div>
                              : <span style={{ color: '#CBD5E1' }}>—</span>
                            }
                          </td>

                          <td style={{ ...tdS(), textAlign: 'center' }}>
                            <StatusBadge status={primary.status} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Detail panel */}
          {selectedGroup && (
            <ViolationDetailPanel
              group={selectedGroup}
              onClose={() => setSelectedRef(null)}
              onResolve={(id) => resolveMutation.mutate(id)}
              onLinkProject={(id, projectId) => linkMutation.mutate({ id, projectId })}
              resolving={resolveMutation.isPending}
              linking={linkMutation.isPending}
              projects={projects}
            />
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{ padding: '7px 16px', borderRadius: 8, border: '1.5px solid #E2E8F0', background: '#fff', fontSize: 13, fontWeight: 600, cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1 }}>
              السابق
            </button>
            <span style={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              style={{ padding: '7px 16px', borderRadius: 8, border: '1.5px solid #E2E8F0', background: '#fff', fontSize: 13, fontWeight: 600, cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.4 : 1 }}>
              التالي
            </button>
          </div>
        )}

      </div>
    </MainLayout>
  );
}

function thS(w?: number): React.CSSProperties {
  return { padding: '11px 14px', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap', width: w };
}
function tdS(): React.CSSProperties {
  return { padding: '11px 14px', verticalAlign: 'middle' };
}
