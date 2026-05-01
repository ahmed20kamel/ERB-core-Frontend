'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { purchaseOrdersApi } from '@/lib/api/purchase-orders';
import { PurchaseOrder, PurchaseOrderItem, Supplier } from '@/types';
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

const NAVY   = '#1B2A4A';
const STEEL  = '#334155';
const GREY   = '#64748b';
const LIGHT  = '#f8fafc';
const BORDER = '#e2e8f0';
const ORANGE = STEEL; // kept for references — no bright orange in this doc

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

  // PDF filename = LPO number (browsers use document.title as the Save-as-PDF filename)
  useEffect(() => {
    if (po?.order_number) {
      document.title = `LPO-${po.order_number}`;
    }
    return () => { document.title = 'ERB Procurement'; };
  }, [po?.order_number]);

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

  const supplier  = typeof po.supplier === 'object' && po.supplier ? po.supplier as Supplier : null;
  const subtotal  = Number(po.subtotal  ?? 0);
  const discount  = Number(po.discount  ?? 0);
  const taxRate   = Number(po.tax_rate  ?? 0);
  const taxAmount = Number(po.tax_amount ?? 0);
  const total     = Number(po.total     ?? 0);
  const hasDiscount = discount > 0;

  /* ── Signatories ── */
  const hasProjectInfo = po.project_name || po.pr_created_by_name;

  const USER_STAMPS: Record<string, string> = {
    abdo:  '/stamps/abdo-stamp.svg',
    sayed: '/stamps/sayed-stamp.svg',
    noura: '/stamps/noura-stamp.svg',
    saif:  '/stamps/saif-stamp.svg',
  };

  function resolveStamp(username: string | null | undefined): string | null {
    if (!username) return null;
    const key = username.toLowerCase();
    for (const name of Object.keys(USER_STAMPS)) {
      if (key.includes(name)) return USER_STAMPS[name];
    }
    return null;
  }

  const signatories = [
    { label: 'Prepared By', name: po.pr_created_by_name        || '—', stamp: resolveStamp(po.pr_created_by_name) },
    { label: 'Checked By',  name: po.quotation_created_by_name || '—', stamp: resolveStamp(po.quotation_created_by_name) ?? '/stamps/noura-stamp.svg' },
    { label: 'Approved By', name: po.approved_by_name          || '—', stamp: resolveStamp(po.approved_by_name)          ?? '/stamps/saif-stamp.svg'  },
    { label: 'Supplier',    name: '',                                   stamp: null },
  ];

  return (
    <div className="print-page-bg" style={{ minHeight:'100vh', background:'#e8ecf0', fontFamily:"'Inter','Cairo','Segoe UI',sans-serif", fontSize:'12px' }}>

      {/* ── Control bar ── */}
      <div className="print-controls-bar" style={{
        position:'sticky', top:0, zIndex:100,
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'8px 32px', background:'#fff', borderBottom:`1px solid ${BORDER}`,
        boxShadow:'0 1px 4px rgba(0,0,0,.06)',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontWeight:700, fontSize:14, color:NAVY }}>LPO — {po.order_number}</span>
          <StatusBadge status={po.status} />
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          {/* Download PDF — title is already set to LPO number */}
          <button onClick={() => window.print()} style={{
            display:'inline-flex', alignItems:'center', gap:6,
            padding:'7px 18px', borderRadius:6,
            background:NAVY, color:'#fff',
            border:'none', fontSize:12, fontWeight:700, cursor:'pointer',
            letterSpacing:'.2px',
          }}>
            ⬇ Download PDF
          </button>
          {/* Print */}
          <button onClick={() => window.print()} style={{
            display:'inline-flex', alignItems:'center', gap:6,
            padding:'7px 16px', borderRadius:6, border:`1px solid ${BORDER}`,
            background:LIGHT, color:'#374151', fontSize:12, fontWeight:600, cursor:'pointer',
          }}>
            🖨 Print
          </button>
          <button onClick={() => window.close()} style={{
            display:'inline-flex', alignItems:'center', gap:6,
            padding:'7px 12px', borderRadius:6, border:`1px solid #e5e7eb`,
            background:'transparent', color:'#9ca3af', fontSize:12, cursor:'pointer',
          }}>✕</button>
        </div>
      </div>

      {/* ── A4 sheet ── */}
      <div className="print-doc" style={{
        width:'210mm', minHeight:'auto',
        margin:'24px auto', background:'#fff',
        borderRadius:4, boxShadow:'0 4px 32px rgba(0,0,0,.18)',
        overflow:'hidden',
      }}>
        <div style={{ padding:'10mm 14mm 8mm', color:NAVY, lineHeight:1.5 }}>

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
                    <div style={{ fontSize:'6.5pt', fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', color:GREY, marginBottom:3 }}>
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

          {/* ── Project + PR Engineer info bar ── */}
          {hasProjectInfo && (
            <div style={{
              display:'flex', alignItems:'stretch', gap:0,
              background:LIGHT, border:`1px solid ${BORDER}`, borderRadius:6,
              marginTop:8, overflow:'hidden', fontSize:'8.5pt',
            }}>
              {/* Project side */}
              {po.project_name && (
                <div style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 14px', borderRight:`1px solid ${BORDER}`, flex:1 }}>
                  <div style={{ width:3, height:28, background:NAVY, borderRadius:2, flexShrink:0 }} />
                  <div>
                    <div style={{ fontSize:'7pt', fontWeight:700, textTransform:'uppercase', letterSpacing:'.5px', color:GREY, marginBottom:2 }}>Project</div>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontWeight:700, color:NAVY, fontSize:'9pt' }}>{po.project_name}</span>
                      {po.project_code && (
                        <span style={{ background:NAVY, color:'#fff', borderRadius:3, padding:'1px 7px', fontSize:'7pt', fontWeight:700 }}>
                          {po.project_code}
                        </span>
                      )}
                      {po.project_location && (
                        <span style={{ color:GREY, fontSize:'8pt' }}>· {po.project_location}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {/* PR Engineer side */}
              {po.pr_created_by_name && (
                <div style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 14px' }}>
                  <div style={{ width:3, height:28, background:NAVY, borderRadius:2, flexShrink:0 }} />
                  <div>
                    <div style={{ fontSize:'7pt', fontWeight:700, textTransform:'uppercase', letterSpacing:'.5px', color:GREY, marginBottom:2 }}>Site Engineer</div>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontWeight:600, color:NAVY, fontSize:'9pt' }}>{po.pr_created_by_name}</span>
                      {po.pr_created_by_phone && (
                        <span style={{ color:GREY, fontSize:'8pt' }}>· {po.pr_created_by_phone}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Cost Code bar ── */}
          {po.cost_code && (
            <div style={{
              display:'flex', alignItems:'center', gap:10,
              background:LIGHT, border:`1px solid ${BORDER}`, borderLeft:`3px solid ${NAVY}`,
              borderRadius:'0 4px 4px 0', padding:'5px 14px', marginTop:6, fontSize:'8.5pt',
            }}>
              <span style={{ fontSize:'6.5pt', fontWeight:700, textTransform:'uppercase', letterSpacing:'.5px', color:GREY }}>Cost Code</span>
              <span style={{ fontWeight:700, color:NAVY, fontSize:'9pt' }}>{po.cost_code.excel_code}</span>
              <span style={{ color:BORDER, fontSize:'7.5pt' }}>|</span>
              <span style={{ color:GREY, fontWeight:400 }}>{po.cost_code.description.slice(0,80)}</span>
            </div>
          )}

          {/* ── Divider ── */}
          <div style={{ margin:'10px 0 14px', borderTop:`2px solid ${NAVY}` }} />

          {/* ── Supplier + Order info ── */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:4 }}>

            {/* Supplier */}
            <div>
              <div style={{ fontSize:'9pt', fontWeight:700, letterSpacing:'.8px', textTransform:'uppercase', color:ORANGE, borderBottom:`1px solid ${BORDER}`, paddingBottom:4, marginBottom:10 }}>
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
              <div style={{ fontSize:'9pt', fontWeight:700, letterSpacing:'.8px', textTransform:'uppercase', color:ORANGE, borderBottom:`1px solid ${BORDER}`, paddingBottom:4, marginBottom:10 }}>
                Order Information
              </div>
              <div style={{ border:`1px solid ${BORDER}`, borderRadius:8, overflow:'hidden' }}>
                {([
                  ['Order Date',    fmtDate(po.order_date)],
                  ['Delivery Date', fmtDate(po.delivery_date)],
                  ['Payment Terms', po.payment_terms || '—'],
                  ['Delivery',      po.delivery_method === 'pickup' ? 'Ex-Works / Pickup' : 'Delivery to Site'],
                ] as [string, string][]).map(([label, value], i, arr) => (
                  <div key={i} style={{
                    display:'flex', alignItems:'baseline', padding:'5px 10px',
                    background: i%2===0 ? '#fafafa' : '#fff',
                    borderBottom: i < arr.length - 1 ? `1px solid #f1f5f9` : 'none',
                  }}>
                    <span style={{ fontSize:'7.5pt', fontWeight:600, color:GREY, width:100, flexShrink:0, textTransform:'uppercase', letterSpacing:'.3px' }}>{label}</span>
                    <span style={{ fontSize:'9pt', color:NAVY, fontWeight:500 }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Items table ── */}
          <div style={{ fontSize:'9pt', fontWeight:700, letterSpacing:'.8px', textTransform:'uppercase', color:ORANGE, borderBottom:`1px solid ${BORDER}`, paddingBottom:4, margin:'14px 0 10px' }}>
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
              <div style={{ fontSize:'9pt', fontWeight:700, letterSpacing:'.8px', textTransform:'uppercase', color:ORANGE, borderBottom:`1px solid ${BORDER}`, paddingBottom:4, margin:'14px 0 8px' }}>
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
              background:LIGHT, border:`1px solid ${BORDER}`, borderLeft:`3px solid ${STEEL}`,
              borderRadius:'0 4px 4px 0', padding:'6px 12px',
              fontSize:'8.5pt', color:NAVY, margin:'6px 0', lineHeight:1.55,
            }}>
              <span style={{ fontWeight:700, color:STEEL, marginRight:4 }}>Notes:</span> {po.notes}
            </div>
          )}

          {/* ── Authorization / Signatures + Footer — kept together on same page ── */}
          <div style={{ breakInside:'avoid', pageBreakInside:'avoid' }}>
            <div style={{ fontSize:'9pt', fontWeight:700, letterSpacing:'.8px', textTransform:'uppercase', color:STEEL, borderBottom:`1px solid ${BORDER}`, paddingBottom:4, margin:'14px 0 10px' }}>
              Authorization
            </div>
            <div style={{ display:'flex', border:`1px solid ${BORDER}`, borderRadius:8, overflow:'hidden' }}>
              {signatories.map((s, i) => (
                <div key={i} style={{
                  flex:1, textAlign:'center',
                  borderRight: i < signatories.length - 1 ? `1px solid ${BORDER}` : 'none',
                  background:'#fafafa', position:'relative', overflow:'hidden',
                }}>
                  {/* Stamp image — centred, rotated, slightly transparent */}
                  {s.stamp && (
                    <div style={{
                      position:'absolute', top:'50%', left:'50%',
                      transform:'translate(-50%, -54%) rotate(-10deg)',
                      opacity:0.82, pointerEvents:'none', zIndex:1,
                      width:96, height:96, marginTop:-4,
                    }}>
                      <Image src={s.stamp} alt="stamp" width={96} height={96}
                        style={{ objectFit:'contain', width:'100%', height:'100%' }}
                        unoptimized priority />
                    </div>
                  )}
                  {/* Text — above stamp */}
                  <div style={{ position:'relative', zIndex:2, padding:'10px 12px 10px' }}>
                    <div style={{ height:1, background:'#cbd5e1', margin:'20px 0 6px' }} />
                    <div style={{ fontSize:'7.5pt', fontWeight:700, textTransform:'uppercase', letterSpacing:'.6px', color:GREY }}>{s.label}</div>
                    {s.name && s.name !== '—' && (
                      <div style={{ fontSize:'9pt', fontWeight:600, color:NAVY, marginTop:3 }}>{s.name}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* ── Footer ── */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:14, paddingTop:8, borderTop:`1px solid ${BORDER}`, fontSize:'7pt', color:'#94a3b8', gap:16 }}>
              <span>This document is computer-generated and valid without a handwritten signature unless otherwise stated.</span>
              <span>{COMPANY.name} &nbsp;·&nbsp; {COMPANY.address}</span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
