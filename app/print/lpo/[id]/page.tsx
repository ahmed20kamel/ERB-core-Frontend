'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { purchaseOrdersApi } from '@/lib/api/purchase-orders';
import { PurchaseOrder, PurchaseOrderItem, PurchaseRequest, Project, Supplier } from '@/types';
import { fmt, fmtDate, StatusBadge, COMPANY } from '@/components/print/PrintTemplate';
import Image from 'next/image';

/* ── Amount in words ────────────────────────────────────────────── */
function toWords(n: number): string {
  if (!n || isNaN(n) || n <= 0) return 'Zero Dirhams Only';
  const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine',
    'Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  function h(x: number): string {
    if (x < 20) return ones[x];
    if (x < 100) return tens[Math.floor(x/10)] + (x%10 ? ' '+ones[x%10] : '');
    return ones[Math.floor(x/100)]+' Hundred'+(x%100 ? ' and '+h(x%100) : '');
  }
  const d = Math.floor(n);
  const f = Math.round((n - d) * 100);
  let r = '';
  if (d >= 1000000) r += h(Math.floor(d/1000000))+' Million ';
  if (d >= 1000)    r += h(Math.floor((d%1000000)/1000))+' Thousand ';
  r += h(d % 1000);
  r = r.trim() + ' Dirhams';
  if (f > 0) r += ` and ${h(f)} Fils`;
  return r + ' Only';
}

/* ── Shared colours ─────────────────────────────────────────────── */
const NAVY = '#1a1a2e';
const ORANGE = '#f97316';
const GREY = '#64748b';
const LIGHT = '#f8fafc';
const BORDER = '#e2e8f0';

export default function PrintLPOPage() {
  const { id } = useParams<{ id: string }>();
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => { setHasToken(!!localStorage.getItem('access_token')); }, []);

  const { data: po, isLoading, isError } = useQuery<PurchaseOrder>({
    queryKey: ['purchase-order', id],
    queryFn: () => purchaseOrdersApi.getById(Number(id)),
    enabled: hasToken,
    retry: 1,
  });

  if (!hasToken || isLoading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter,sans-serif', color:'#888' }}>
      Loading…
    </div>
  );
  if (isError || !po) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter,sans-serif', color:'#ef4444' }}>
      Purchase order not found. Please make sure you are logged in.
    </div>
  );

  const supplier   = typeof po.supplier === 'object' && po.supplier ? po.supplier as Supplier : null;
  const prObj      = typeof po.purchase_request === 'object' && po.purchase_request ? po.purchase_request as PurchaseRequest : null;
  const project    = prObj && typeof prObj.project === 'object' && prObj.project ? prObj.project as Project : null;
  const subtotal   = Number(po.subtotal  ?? 0);
  const discount   = Number(po.discount  ?? 0);
  const taxRate    = Number(po.tax_rate  ?? 0);
  const taxAmount  = Number(po.tax_amount ?? 0);
  const total      = Number(po.total     ?? 0);
  const hasDiscount = discount > 0;

  const signatories = [
    { label: 'Prepared By', name: prObj?.created_by_name || '' },
    { label: 'Checked By',  name: po.quotation_created_by_name || '' },
    { label: 'LPO By',      name: po.created_by_name },
    { label: 'Approved By', name: po.approved_by_name || '' },
  ];

  return (
    <div className="print-page-bg" style={{ minHeight:'100vh', background:'#e8ecf0', fontFamily:"'Inter','Cairo','Segoe UI',sans-serif", fontSize:'12px' }}>

      {/* ── Control bar ── */}
      <div className="print-controls-bar" style={{
        position:'sticky', top:0, zIndex:100,
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'8px 32px',
        background:'#fff', borderBottom:`1px solid ${BORDER}`,
        boxShadow:'0 1px 4px rgba(0,0,0,.06)',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontWeight:700, fontSize:14, color:NAVY }}>LPO — {po.order_number}</span>
          <StatusBadge status={po.status} />
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => window.print()} style={{
            display:'inline-flex', alignItems:'center', gap:6,
            padding:'6px 16px', borderRadius:6, border:`1px solid ${BORDER}`,
            background:LIGHT, color:'#374151', fontSize:12, fontWeight:600, cursor:'pointer',
          }}>🖨 Print / Save PDF</button>
          <button onClick={() => window.close()} style={{
            display:'inline-flex', alignItems:'center', gap:6,
            padding:'6px 14px', borderRadius:6, border:`1px solid #e5e7eb`,
            background:'transparent', color:'#9ca3af', fontSize:12, cursor:'pointer',
          }}>✕ Close</button>
        </div>
      </div>

      {/* ── A4 sheet ── */}
      <div className="print-doc" style={{
        width:'210mm', minHeight:'297mm',
        margin:'24px auto', background:'#fff',
        borderRadius:4, boxShadow:'0 4px 32px rgba(0,0,0,.18)',
        overflow:'hidden',
      }}>
        <div style={{ padding:'12mm 16mm 10mm', color:NAVY, lineHeight:1.5 }}>

          {/* ── HEADER ── */}
          <table style={{ width:'100%', borderCollapse:'collapse', marginBottom:0 }}>
            <tbody>
              <tr>
                <td style={{ width:80, verticalAlign:'middle' }}>
                  <Image src={COMPANY.logo} alt="Logo" width={68} height={68}
                    style={{ objectFit:'contain', display:'block' }} priority unoptimized />
                </td>
                <td style={{ verticalAlign:'middle', paddingLeft:14 }}>
                  <div style={{ fontSize:'13pt', fontWeight:800, color:NAVY, letterSpacing:'-.3px', lineHeight:1.2 }}>{COMPANY.name}</div>
                  <div style={{ fontSize:'8pt', color:GREY, marginTop:2 }}>{COMPANY.address}</div>
                  <div style={{ fontSize:'8pt', color:GREY, marginTop:1 }}>{COMPANY.phone} &nbsp;·&nbsp; {COMPANY.email}</div>
                  <div style={{ fontSize:'8pt', color:GREY, marginTop:1 }}>TRN: {COMPANY.trn}</div>
                </td>
                <td style={{ verticalAlign:'top', textAlign:'right', width:190 }}>
                  <div style={{
                    background:LIGHT, border:`1px solid ${BORDER}`,
                    borderRadius:8, padding:'10px 14px', display:'inline-block', textAlign:'right', minWidth:165,
                  }}>
                    <div style={{ fontSize:'7pt', fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', color:ORANGE, marginBottom:3 }}>
                      LOCAL PURCHASE ORDER
                    </div>
                    <div style={{ fontSize:'16pt', fontWeight:800, color:NAVY, lineHeight:1.1, letterSpacing:'-.5px', marginBottom:6 }}>
                      {po.order_number}
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', gap:8, fontSize:'8.5pt', marginTop:3 }}>
                      <span style={{ color:GREY, fontWeight:500 }}>Date</span>
                      <span style={{ fontWeight:600 }}>{fmtDate(po.order_date)}</span>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', gap:8, fontSize:'8.5pt', marginTop:3, alignItems:'center' }}>
                      <span style={{ color:GREY, fontWeight:500 }}>Status</span>
                      <StatusBadge status={po.status} />
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* ── Project + Engineer info bar ── */}
          {(project || po.created_by_name) && (
            <div style={{
              display:'flex', alignItems:'center', flexWrap:'wrap', gap:16,
              background:LIGHT, border:`1px solid ${BORDER}`, borderRadius:6,
              padding:'6px 14px', marginTop:8, fontSize:'8.5pt', color:NAVY,
            }}>
              {project && (
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:'7.5pt', fontWeight:700, textTransform:'uppercase', letterSpacing:'.4px', color:GREY }}>Project</span>
                  <span style={{ fontWeight:700, color:NAVY }}>{project.name}</span>
                  {project.code && (
                    <span style={{
                      background:'#fff', border:`1px solid ${BORDER}`, borderRadius:4,
                      padding:'1px 8px', fontSize:'7.5pt', fontWeight:700, color:ORANGE,
                    }}>
                      {project.code}
                    </span>
                  )}
                </div>
              )}
              {(po.created_by_name || po.created_by_phone) && (
                <div style={{ display:'flex', alignItems:'center', gap:8, marginLeft:'auto' }}>
                  <span style={{ fontSize:'7.5pt', fontWeight:700, textTransform:'uppercase', letterSpacing:'.4px', color:GREY }}>Engineer</span>
                  {po.created_by_name && <span style={{ fontWeight:600, color:NAVY }}>{po.created_by_name}</span>}
                  {po.created_by_phone && (
                    <span style={{ color:GREY, fontSize:'8pt' }}>· Tel: {po.created_by_phone}</span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Divider ── */}
          <div style={{ height:3, background:`linear-gradient(90deg,${ORANGE} 0%,#fb923c 60%,${BORDER} 100%)`, margin:'10px 0 14px', borderRadius:2 }} />

          {/* ── Supplier + Order info ── */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:4 }}>

            {/* Supplier */}
            <div>
              <div style={{ fontSize:'9pt', fontWeight:700, letterSpacing:'.8px', textTransform:'uppercase', color:ORANGE, borderBottom:`1.5px solid #fed7aa`, paddingBottom:4, marginBottom:10 }}>
                Supplier
              </div>
              {supplier ? (
                <div style={{ fontSize:'9.5pt', lineHeight:1.7 }}>
                  <div style={{ fontWeight:700, fontSize:'11pt', color:NAVY }}>{supplier.business_name || supplier.name}</div>
                  {supplier.contact_person && <div style={{ color:GREY }}>{supplier.contact_person}</div>}
                  {supplier.phone && <div style={{ color:GREY }}>Tel: {supplier.phone}</div>}
                  {supplier.email && <div style={{ color:GREY }}>{supplier.email}</div>}
                  {(supplier.city || supplier.country) && <div style={{ color:GREY }}>{[supplier.city, supplier.country].filter(Boolean).join(', ')}</div>}
                  {supplier.trn && <div style={{ marginTop:2, color:'#94a3b8', fontSize:'8.5pt' }}>TRN: {supplier.trn}</div>}
                </div>
              ) : <div style={{ color:'#94a3b8' }}>—</div>}
            </div>

            {/* Order Info */}
            <div>
              <div style={{ fontSize:'9pt', fontWeight:700, letterSpacing:'.8px', textTransform:'uppercase', color:ORANGE, borderBottom:`1.5px solid #fed7aa`, paddingBottom:4, marginBottom:10 }}>
                Order Information
              </div>
              <div style={{ border:`1px solid ${BORDER}`, borderRadius:8, overflow:'hidden' }}>
                {[
                  ['Order Date',    fmtDate(po.order_date)],
                  ['Delivery Date', fmtDate(po.delivery_date)],
                  ['Payment Terms', po.payment_terms || '—'],
                  ['Delivery',      po.delivery_method === 'pickup' ? 'Ex-Works / Pickup' : 'Delivery to Site'],
                  ['Approved By',   po.approved_by_name || '—'],
                  ['LPO By',        po.created_by_name],
                ].map(([label, value], i) => (
                  <div key={i} style={{
                    display:'flex', alignItems:'baseline', padding:'5px 10px',
                    background: i%2===0 ? '#fafafa' : '#fff',
                    borderBottom: i < 5 ? `1px solid #f1f5f9` : 'none',
                  }}>
                    <span style={{ fontSize:'7.5pt', fontWeight:600, color:GREY, width:100, flexShrink:0, textTransform:'uppercase', letterSpacing:'.3px' }}>{label}</span>
                    <span style={{ fontSize:'9pt', color:NAVY, fontWeight:500 }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Items table ── */}
          <div style={{ fontSize:'9pt', fontWeight:700, letterSpacing:'.8px', textTransform:'uppercase', color:ORANGE, borderBottom:`1.5px solid #fed7aa`, paddingBottom:4, margin:'14px 0 10px' }}>
            Order Items
          </div>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'9pt', marginBottom:4 }}>
            <thead>
              <tr style={{ background:NAVY, color:'#fff' }}>
                <th style={{ padding:'7px 10px', textAlign:'left', fontSize:'7.5pt', fontWeight:700, letterSpacing:'.5px', textTransform:'uppercase', width:28 }}>#</th>
                <th style={{ padding:'7px 10px', textAlign:'left', fontSize:'7.5pt', fontWeight:700, letterSpacing:'.5px', textTransform:'uppercase' }}>Description</th>
                <th style={{ padding:'7px 10px', textAlign:'center', fontSize:'7.5pt', fontWeight:700, letterSpacing:'.5px', textTransform:'uppercase', width:45 }}>Unit</th>
                <th style={{ padding:'7px 10px', textAlign:'right', fontSize:'7.5pt', fontWeight:700, letterSpacing:'.5px', textTransform:'uppercase', width:55 }}>Qty</th>
                <th style={{ padding:'7px 10px', textAlign:'right', fontSize:'7.5pt', fontWeight:700, letterSpacing:'.5px', textTransform:'uppercase', width:80 }}>Unit Price</th>
                {hasDiscount && <th style={{ padding:'7px 10px', textAlign:'right', fontSize:'7.5pt', fontWeight:700, letterSpacing:'.5px', textTransform:'uppercase', width:55 }}>Disc%</th>}
                <th style={{ padding:'7px 10px', textAlign:'right', fontSize:'7.5pt', fontWeight:700, letterSpacing:'.5px', textTransform:'uppercase', width:85 }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {po.items.map((item: PurchaseOrderItem, idx: number) => (
                <tr key={item.id ?? idx} style={{ borderBottom:`1px solid #f1f5f9`, background: idx%2===0 ? '#fff' : '#fafafa' }}>
                  <td style={{ padding:'6px 10px', textAlign:'center', color:'#94a3b8' }}>{idx+1}</td>
                  <td style={{ padding:'6px 10px' }}>
                    <div style={{ fontWeight:600, color:NAVY, lineHeight:1.3 }}>{item.product?.name ?? `Item #${item.product_id}`}</div>
                    {item.product?.code && <div style={{ fontSize:'7.5pt', color:'#94a3b8', marginTop:1 }}>{item.product.code}</div>}
                    {item.notes && <div style={{ fontSize:'8pt', color:'#777', marginTop:1 }}>{item.notes}</div>}
                  </td>
                  <td style={{ padding:'6px 10px', textAlign:'center' }}>{item.product?.unit || '—'}</td>
                  <td style={{ padding:'6px 10px', textAlign:'right' }}>{fmt(item.quantity, 2)}</td>
                  <td style={{ padding:'6px 10px', textAlign:'right' }}>AED {fmt(item.unit_price)}</td>
                  {hasDiscount && <td style={{ padding:'6px 10px', textAlign:'right' }}>{fmt(item.discount ?? 0, 1)}%</td>}
                  <td style={{ padding:'6px 10px', textAlign:'right', fontWeight:600 }}>AED {fmt(item.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background:LIGHT, borderTop:`2px solid ${BORDER}` }}>
                <td colSpan={hasDiscount ? 4 : 3} />
                <td style={{ padding:'6px 10px', textAlign:'right', fontSize:'8.5pt', color:GREY, fontWeight:600 }}>
                  {po.items.length} item{po.items.length !== 1 ? 's' : ''}
                </td>
                <td />
                {hasDiscount && <td />}
              </tr>
            </tfoot>
          </table>

          {/* ── Totals ── */}
          <div style={{ display:'flex', justifyContent:'flex-end', marginTop:10, marginBottom:6 }}>
            <div style={{ width:280, border:`1px solid ${BORDER}`, borderRadius:8, overflow:'hidden' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 14px', fontSize:'9pt', borderBottom:`1px solid #f1f5f9`, background:'#fafafa' }}>
                <span style={{ color:GREY, fontWeight:500 }}>Subtotal</span>
                <span style={{ fontWeight:600 }}>AED {fmt(subtotal)}</span>
              </div>
              {hasDiscount && (
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 14px', fontSize:'9pt', borderBottom:`1px solid #f1f5f9`, background:'#fff' }}>
                  <span style={{ color:GREY, fontWeight:500 }}>Discount</span>
                  <span style={{ fontWeight:600, color:'#dc2626' }}>− AED {fmt(discount)}</span>
                </div>
              )}
              {taxAmount !== 0 && (
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 14px', fontSize:'9pt', borderBottom:`1px solid #f1f5f9`, background: hasDiscount ? '#fafafa' : '#fff' }}>
                  <span style={{ color:GREY, fontWeight:500 }}>VAT ({taxRate}%)</span>
                  <span style={{ fontWeight:600 }}>AED {fmt(taxAmount)}</span>
                </div>
              )}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 14px', background:NAVY, color:'#fff', fontSize:'11pt', fontWeight:800 }}>
                <span>TOTAL</span>
                <span>AED {fmt(total)}</span>
              </div>
            </div>
          </div>

          {/* ── Amount in words ── */}
          <div style={{
            background:LIGHT, border:`1px solid ${BORDER}`, borderLeft:`3px solid ${NAVY}`,
            borderRadius:'0 6px 6px 0', padding:'7px 14px',
            fontSize:'9pt', color:NAVY, fontStyle:'italic', margin:'8px 0', lineHeight:1.5,
          }}>
            <span style={{ fontStyle:'normal', fontWeight:700, fontSize:'7.5pt', textTransform:'uppercase', letterSpacing:'.5px', color:GREY, marginRight:8 }}>
              Amount in Words
            </span>
            {toWords(total)}
          </div>

          {/* ── Terms ── */}
          {(po.payment_terms || po.delivery_terms) && (
            <>
              <div style={{ fontSize:'9pt', fontWeight:700, letterSpacing:'.8px', textTransform:'uppercase', color:ORANGE, borderBottom:`1.5px solid #fed7aa`, paddingBottom:4, margin:'14px 0 8px' }}>
                Terms & Conditions
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, padding:'8px 14px', background:LIGHT, border:`1px solid ${BORDER}`, borderRadius:6, marginBottom:6 }}>
                {po.payment_terms && (
                  <div>
                    <div style={{ fontSize:'7.5pt', fontWeight:700, textTransform:'uppercase', letterSpacing:'.4px', color:GREY, marginBottom:3 }}>Payment Terms</div>
                    <div style={{ fontSize:'9pt', color:NAVY, lineHeight:1.5 }}>{po.payment_terms}</div>
                  </div>
                )}
                {po.delivery_terms && (
                  <div>
                    <div style={{ fontSize:'7.5pt', fontWeight:700, textTransform:'uppercase', letterSpacing:'.4px', color:GREY, marginBottom:3 }}>Delivery Terms</div>
                    <div style={{ fontSize:'9pt', color:NAVY, lineHeight:1.5 }}>{po.delivery_terms}</div>
                  </div>
                )}
              </div>
            </>
          )}

          {po.terms_and_conditions && (
            <div style={{ fontSize:'8.5pt', color:'#555', lineHeight:1.65, marginBottom:6, padding:'6px 0' }}>
              {po.terms_and_conditions}
            </div>
          )}

          {po.notes && (
            <div style={{
              background:'#fffbeb', border:`1px solid #fed7aa`, borderLeft:`3px solid ${ORANGE}`,
              borderRadius:'0 6px 6px 0', padding:'7px 12px',
              fontSize:'9pt', color:'#78350f', margin:'8px 0', lineHeight:1.55,
            }}>
              <span style={{ fontWeight:700, color:'#c2410c', marginRight:4 }}>Notes:</span> {po.notes}
            </div>
          )}

          {/* ── Signatures ── */}
          <div style={{ fontSize:'9pt', fontWeight:700, letterSpacing:'.8px', textTransform:'uppercase', color:ORANGE, borderBottom:`1.5px solid #fed7aa`, paddingBottom:4, margin:'14px 0 10px' }}>
            Authorization
          </div>
          <div style={{ display:'flex', gap:0, border:`1px solid ${BORDER}`, borderRadius:8, overflow:'hidden' }}>
            {signatories.map((s, i) => (
              <div key={i} style={{
                flex:1, padding:'10px 12px 8px', textAlign:'center',
                borderRight: i < signatories.length - 1 ? `1px solid ${BORDER}` : 'none',
                background:'#fafafa',
              }}>
                <div style={{ height:1, background:'#94a3b8', margin:'24px 0 6px' }} />
                <div style={{ fontSize:'7.5pt', fontWeight:700, textTransform:'uppercase', letterSpacing:'.5px', color:GREY }}>{s.label}</div>
                {s.name && <div style={{ fontSize:'9pt', fontWeight:600, color:NAVY, marginTop:3 }}>{s.name}</div>}
              </div>
            ))}
          </div>

          {/* ── Footer ── */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:16, paddingTop:8, borderTop:`1px solid ${BORDER}`, fontSize:'7pt', color:'#94a3b8', gap:16 }}>
            <span>This document is computer-generated and valid without a handwritten signature unless otherwise stated.</span>
            <span>{COMPANY.name} &nbsp;·&nbsp; {COMPANY.address}</span>
          </div>

        </div>
      </div>

    </div>
  );
}
