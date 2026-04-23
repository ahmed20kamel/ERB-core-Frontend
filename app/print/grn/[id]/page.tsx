'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { goodsReceivingApi, GoodsReceivedNote, GRNItem } from '@/lib/api/goods-receiving';
import { PurchaseOrder, Supplier } from '@/types';
import PrintTemplate, {
  SectionTitle, InfoGrid, SignatureRow, NotesBox, StatusBadge,
  fmt, fmtDate,
} from '@/components/print/PrintTemplate';

const NAVY   = '#1a1a2e';
const GREY   = '#64748b';

const QUALITY_LABEL: Record<string, string> = {
  good:      'Good',
  damaged:   'Damaged',
  defective: 'Defective',
  missing:   'Missing',
};
const QUALITY_COLOR: Record<string, string> = {
  good:      '#15803d',
  damaged:   '#b45309',
  defective: '#b91c1c',
  missing:   '#6b7280',
};

export default function PrintGRNPage() {
  const { id } = useParams<{ id: string }>();
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => { setHasToken(!!localStorage.getItem('access_token')); }, []);

  const { data: grn, isLoading, isError } = useQuery<GoodsReceivedNote>({
    queryKey: ['grn', id],
    queryFn: () => goodsReceivingApi.getById(Number(id)),
    enabled: hasToken,
    retry: 1,
  });

  if (!hasToken || isLoading) return <PrintLoader />;
  if (isError || !grn) return <PrintError msg="Goods received note not found. Please make sure you are logged in." />;

  const po       = typeof grn.purchase_order === 'object' && grn.purchase_order ? grn.purchase_order as PurchaseOrder : null;
  const supplier = po && typeof po.supplier === 'object' && po.supplier ? po.supplier as Supplier : null;

  const totalOrdered  = grn.items.reduce((s, i) => s + Number(i.ordered_quantity  ?? 0), 0);
  const totalReceived = grn.items.reduce((s, i) => s + Number(i.received_quantity  ?? 0), 0);
  const totalRejected = grn.items.reduce((s, i) => s + Number(i.rejected_quantity  ?? 0), 0);

  return (
    <div className="print-page-bg" style={{ minHeight: '100vh', background: '#e8ecf0', fontFamily: "'Inter','Cairo','Segoe UI',sans-serif", fontSize: '12px' }}>

      {/* ── Controls ── */}
      <div className="print-controls-bar" style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 32px',
        background: '#fff', borderBottom: '1px solid #e2e8f0',
        boxShadow: '0 1px 4px rgba(0,0,0,.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: NAVY }}>GRN — {grn.grn_number}</span>
          <StatusBadge status={grn.status} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => window.print()} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 16px', borderRadius: 6, border: '1px solid #e2e8f0',
            background: '#f8fafc', color: '#374151', fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}>🖨 Print / Save PDF</button>
          <button onClick={() => window.close()} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 6, border: '1px solid #e5e7eb',
            background: 'transparent', color: '#9ca3af', fontSize: 12, cursor: 'pointer',
          }}>✕ Close</button>
        </div>
      </div>

      {/* ── A4 Sheet ── */}
      <div className="print-doc" style={{
        width: '210mm', minHeight: '297mm',
        margin: '24px auto', background: '#fff',
        borderRadius: 4, boxShadow: '0 4px 32px rgba(0,0,0,.18)',
        overflow: 'hidden',
      }}>
        <PrintTemplate
          docType="GOODS RECEIVED NOTE"
          docNumber={grn.grn_number}
          date={grn.receipt_date}
          status={grn.status}
        >
          {/* ── GRN + Supplier info ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div>
              <SectionTitle>Supplier</SectionTitle>
              {supplier ? (
                <div style={{ fontSize: '9.5pt', lineHeight: 1.7 }}>
                  <div style={{ fontWeight: 700, fontSize: '11pt', color: NAVY }}>{supplier.business_name || supplier.name}</div>
                  {supplier.contact_person && <div style={{ color: GREY }}>{supplier.contact_person}</div>}
                  {supplier.phone && <div style={{ color: GREY }}>Tel: {supplier.phone}</div>}
                  {(supplier.city || supplier.country) && <div style={{ color: GREY }}>{[supplier.city, supplier.country].filter(Boolean).join(', ')}</div>}
                </div>
              ) : <div style={{ color: '#94a3b8' }}>—</div>}
            </div>
            <div>
              <SectionTitle>Receipt Information</SectionTitle>
              <InfoGrid rows={[
                ['GRN Number',    grn.grn_number],
                ['Receipt Date',  fmtDate(grn.receipt_date)],
                ['LPO Ref',       po?.order_number ?? '—'],
                ['Received By',   grn.received_by_name ?? '—'],
                ['Status',        <StatusBadge key="s" status={grn.status} />],
                ['Inv. Delivery', grn.invoice_delivery_status ?? '—'],
              ]} />
            </div>
          </div>

          {/* ── Items ── */}
          <SectionTitle>Received Items</SectionTitle>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt', marginBottom: 4 }}>
            <thead>
              <tr style={{ background: NAVY, color: '#fff' }}>
                {[
                  { label: '#',        align: 'center', width: 28 },
                  { label: 'Product / Material'                    },
                  { label: 'Unit',     align: 'center', width: 55 },
                  { label: 'Ordered',  align: 'right',  width: 60 },
                  { label: 'Received', align: 'right',  width: 65 },
                  { label: 'Rejected', align: 'right',  width: 60 },
                  { label: 'Quality',  align: 'center', width: 75 },
                  { label: 'Remarks',                   width: 90 },
                ].map((h, i) => (
                  <th key={i} style={{ padding: '8px 10px', textAlign: (h.align as any) ?? 'left', fontSize: '7.5pt', fontWeight: 700, letterSpacing: '.5px', textTransform: 'uppercase', width: h.width }}>
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grn.items.map((item: GRNItem, idx: number) => (
                <tr key={item.id ?? idx} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={{ padding: '7px 10px', textAlign: 'center', color: '#94a3b8' }}>{idx + 1}</td>
                  <td style={{ padding: '7px 10px' }}>
                    <div style={{ fontWeight: 600, color: NAVY, lineHeight: 1.3 }}>{item.product?.name ?? `Product #${item.product_id}`}</div>
                    {item.product?.code && <div style={{ fontSize: '7.5pt', color: '#94a3b8', marginTop: 1 }}>{item.product.code}</div>}
                  </td>
                  <td style={{ padding: '7px 10px', textAlign: 'center' }}>{item.product?.unit || '—'}</td>
                  <td style={{ padding: '7px 10px', textAlign: 'right' }}>{fmt(item.ordered_quantity, 2)}</td>
                  <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 600 }}>{fmt(item.received_quantity, 2)}</td>
                  <td style={{ padding: '7px 10px', textAlign: 'right', color: Number(item.rejected_quantity) > 0 ? '#ef4444' : '#888' }}>
                    {fmt(item.rejected_quantity, 2)}
                  </td>
                  <td style={{ padding: '7px 10px', textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-block', padding: '2px 7px', borderRadius: 4,
                      fontSize: '7.5pt', fontWeight: 700,
                      color: QUALITY_COLOR[item.quality_status] ?? GREY,
                      border: `1px solid ${QUALITY_COLOR[item.quality_status] ?? GREY}`,
                      background: '#fff',
                    }}>
                      {QUALITY_LABEL[item.quality_status] ?? item.quality_status}
                    </span>
                  </td>
                  <td style={{ padding: '7px 10px', fontSize: '8.5pt', color: '#555' }}>{item.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
                <td colSpan={3} style={{ padding: '7px 10px', fontWeight: 600, fontSize: '8.5pt', color: GREY }}>TOTALS</td>
                <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 700 }}>{fmt(totalOrdered, 2)}</td>
                <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 700, color: '#10b981' }}>{fmt(totalReceived, 2)}</td>
                <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 700, color: totalRejected > 0 ? '#ef4444' : '#888' }}>{fmt(totalRejected, 2)}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>

          {/* ── Summary ── */}
          <div style={{ display: 'flex', gap: 12, margin: '8px 0', flexWrap: 'wrap' }}>
            {[
              { label: 'Total Items',        value: String(grn.items.length),        color: '#3b82f6' },
              { label: 'Total Ordered Qty',  value: fmt(totalOrdered,  0),            color: '#6b7280' },
              { label: 'Total Received Qty', value: fmt(totalReceived, 0),            color: '#10b981' },
              { label: 'Total Rejected Qty', value: fmt(totalRejected, 0),            color: totalRejected > 0 ? '#ef4444' : '#9ca3af' },
            ].map((s, i) => (
              <div key={i} style={{
                flex: 1, minWidth: 100, background: '#f9fafb', border: '1px solid #e5e7eb',
                borderRadius: 6, padding: '6px 10px', textAlign: 'center',
              }}>
                <div style={{ fontSize: '7.5pt', color: '#888', marginBottom: 2 }}>{s.label}</div>
                <div style={{ fontSize: '12pt', fontWeight: 700, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          <NotesBox text={grn.notes} />

          {po && (
            <>
              <SectionTitle>Reference</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, margin: '8px 0', padding: '10px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6 }}>
                <div>
                  <div style={{ fontSize: '7.5pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.4px', color: GREY, marginBottom: 3 }}>LPO Number</div>
                  <div style={{ fontSize: '9pt', color: NAVY, lineHeight: 1.5 }}>{po.order_number}</div>
                </div>
                <div>
                  <div style={{ fontSize: '7.5pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.4px', color: GREY, marginBottom: 3 }}>Payment Terms</div>
                  <div style={{ fontSize: '9pt', color: NAVY, lineHeight: 1.5 }}>{po.payment_terms || '—'}</div>
                </div>
              </div>
            </>
          )}

          <SectionTitle>Acknowledgement</SectionTitle>
          <SignatureRow signatories={[
            { label: 'Received By',   name: grn.received_by_name ?? '' },
            { label: 'Inspected By',  name: '' },
            { label: 'Store Keeper',  name: '' },
            { label: 'Supplier Rep.', name: '' },
          ]} />
        </PrintTemplate>
      </div>

    </div>
  );
}

function PrintLoader() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter,sans-serif', color: '#888' }}>
      Loading…
    </div>
  );
}
function PrintError({ msg }: { msg: string }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter,sans-serif', color: '#ef4444' }}>
      {msg}
    </div>
  );
}
