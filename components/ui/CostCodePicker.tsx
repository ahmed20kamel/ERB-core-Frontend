'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { costCodesApi } from '@/lib/api/cost-codes';
import { CostCode } from '@/types';

interface Props {
  value: CostCode | null;
  onChange: (code: CostCode | null) => void;
  placeholder?: string;
}

export default function CostCodePicker({ value, onChange, placeholder = 'Search cost code...' }: Props) {
  const [open, setOpen]     = useState(false);
  const [search, setSearch] = useState('');
  const [level1, setLevel1] = useState<CostCode | null>(null);
  const [level2, setLevel2] = useState<CostCode | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const { data: allCodes = [] } = useQuery({
    queryKey: ['cost-codes'],
    queryFn: () => costCodesApi.getAll(),
    staleTime: 60 * 60 * 1000,
  });

  const l1 = allCodes.filter(c => c.level === 1);
  const l2 = allCodes.filter(c => c.level === 2 && (!level1 || c.parent === level1.id));
  const l3 = allCodes.filter(c => c.level === 3 && (!level2 || c.parent === level2.id));

  // Search mode: filter all L3 items
  const searchResults = search.trim().length > 1
    ? allCodes.filter(c =>
        c.level === 3 &&
        (c.excel_code.toLowerCase().includes(search.toLowerCase()) ||
         c.description.toLowerCase().includes(search.toLowerCase()))
      ).slice(0, 20)
    : null;

  const handleSelect = (code: CostCode) => {
    onChange(code);
    setOpen(false);
    setSearch('');
    setLevel1(null);
    setLevel2(null);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setLevel1(null);
    setLevel2(null);
  };

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      {/* Trigger */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8,
          background: 'var(--background)', cursor: 'pointer', minHeight: 40,
          fontSize: 14, gap: 8,
        }}
      >
        {value ? (
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <span style={{ fontWeight: 600, color: 'var(--primary)', marginRight: 8 }}>{value.excel_code}</span>
            <span style={{ color: 'var(--muted-foreground)', fontSize: 13 }}>{value.description.slice(0, 60)}{value.description.length > 60 ? '…' : ''}</span>
          </div>
        ) : (
          <span style={{ color: 'var(--muted-foreground)' }}>{placeholder}</span>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {value && (
            <span onClick={handleClear} style={{ cursor: 'pointer', color: 'var(--muted-foreground)', fontSize: 16, lineHeight: 1 }}>×</span>
          )}
          <span style={{ color: 'var(--muted-foreground)', fontSize: 12 }}>{open ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
          background: 'var(--background)', border: '1px solid var(--border)',
          borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,.14)',
          marginTop: 4, overflow: 'hidden',
        }}>
          {/* Search bar */}
          <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Type code or description..."
              style={{
                width: '100%', padding: '6px 10px', border: '1px solid var(--border)',
                borderRadius: 6, fontSize: 13, background: 'var(--muted)',
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {searchResults ? (
            /* ── Search results ── */
            <div style={{ maxHeight: 280, overflowY: 'auto' }}>
              {searchResults.length === 0 && (
                <div style={{ padding: '16px 12px', color: 'var(--muted-foreground)', textAlign: 'center', fontSize: 13 }}>No results</div>
              )}
              {searchResults.map(c => (
                <SearchRow key={c.id} code={c} allCodes={allCodes} onSelect={handleSelect} />
              ))}
            </div>
          ) : (
            /* ── Cascading picker ── */
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', maxHeight: 320 }}>
              {/* L1 */}
              <Column
                title="Category"
                items={l1}
                selected={level1}
                onSelect={c => { setLevel1(c); setLevel2(null); onChange(null); }}
              />
              {/* L2 */}
              <Column
                title="Sub-Category"
                items={l2}
                selected={level2}
                onSelect={c => { setLevel2(c); onChange(null); }}
                disabled={!level1}
              />
              {/* L3 */}
              <Column
                title="Select Item"
                items={l3}
                selected={value}
                onSelect={handleSelect}
                disabled={!level2}
                isLeaf
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Column subcomponent ── */
function Column({ title, items, selected, onSelect, disabled, isLeaf }: {
  title: string;
  items: CostCode[];
  selected: CostCode | null;
  onSelect: (c: CostCode) => void;
  disabled?: boolean;
  isLeaf?: boolean;
}) {
  return (
    <div style={{ borderRight: '1px solid var(--border)', overflowY: 'auto', maxHeight: 320 }}>
      <div style={{
        padding: '6px 10px', fontSize: 11, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '.5px',
        color: 'var(--muted-foreground)', borderBottom: '1px solid var(--border)',
        background: 'var(--muted)', position: 'sticky', top: 0,
      }}>
        {title}
      </div>
      {disabled ? (
        <div style={{ padding: '12px 10px', color: 'var(--muted-foreground)', fontSize: 12, textAlign: 'center' }}>← Select first</div>
      ) : items.length === 0 ? (
        <div style={{ padding: '12px 10px', color: 'var(--muted-foreground)', fontSize: 12, textAlign: 'center' }}>—</div>
      ) : items.map(item => (
        <div
          key={item.id}
          onClick={() => onSelect(item)}
          style={{
            padding: '7px 10px', cursor: 'pointer', fontSize: 13,
            background: selected?.id === item.id ? 'var(--primary)' : 'transparent',
            color: selected?.id === item.id ? '#fff' : 'var(--foreground)',
            borderBottom: '1px solid var(--border)',
            transition: 'background .1s',
          }}
          onMouseEnter={e => { if (selected?.id !== item.id) (e.currentTarget as HTMLElement).style.background = 'var(--muted)'; }}
          onMouseLeave={e => { if (selected?.id !== item.id) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        >
          <div style={{ fontWeight: isLeaf ? 500 : 600, lineHeight: 1.3 }}>
            {isLeaf && <span style={{ color: '#f97316', fontWeight: 700, marginRight: 6 }}>{item.excel_code}</span>}
            {item.description.slice(0, isLeaf ? 55 : 45)}{item.description.length > (isLeaf ? 55 : 45) ? '…' : ''}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Search row ── */
function SearchRow({ code, allCodes, onSelect }: { code: CostCode; allCodes: CostCode[]; onSelect: (c: CostCode) => void }) {
  const parent2 = allCodes.find(c => c.id === code.parent);
  const parent1 = parent2 ? allCodes.find(c => c.id === parent2.parent) : null;

  return (
    <div
      onClick={() => onSelect(code)}
      style={{
        padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border)',
        transition: 'background .1s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--muted)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontWeight: 700, color: '#f97316', fontSize: 13 }}>{code.excel_code}</span>
        <span style={{ fontSize: 13, color: 'var(--foreground)' }}>{code.description.slice(0, 70)}</span>
      </div>
      {(parent1 || parent2) && (
        <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 2 }}>
          {[parent1?.description?.slice(0,30), parent2?.description?.slice(0,30)].filter(Boolean).join(' › ')}
        </div>
      )}
    </div>
  );
}
