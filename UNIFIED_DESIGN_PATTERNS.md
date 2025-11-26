# Unified Design Patterns - 100% Consistency Guide

## Standard Page Structure

### 1. Header Section (Unified)
```tsx
<div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
  <div>
    <Link 
      href="/back-link" 
      className="text-sm mb-2 inline-block"
      style={{ 
        color: 'var(--text-secondary)',
        textDecoration: 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = 'var(--text-primary)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = 'var(--text-secondary)';
      }}
    >
      ← Back to [Page Name]
    </Link>
    <h1 style={{ 
      fontSize: 'var(--font-2xl)',
      fontWeight: 'var(--font-weight-semibold)',
      color: 'var(--text-primary)',
      margin: 0,
      marginBottom: 'var(--spacing-1)',
    }}>
      [Page Title]
    </h1>
    <p style={{ 
      fontSize: 'var(--font-sm)',
      color: 'var(--text-secondary)',
      margin: 0,
    }}>
      [Page Description]
    </p>
  </div>
```

### 2. Form Card (Unified)
```tsx
<form onSubmit={handleSubmit} className="card">
  {/* Form Fields Grid - Unified Spacing */}
  <div style={{ 
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: 'var(--spacing-4)',
    marginBottom: 'var(--spacing-6)',
  }}>
    {/* Form Fields */}
  </div>
  
  {/* Form Actions - Unified */}
  <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
    <button type="submit" className="btn btn-primary">
      [Action Text]
    </button>
    <Link href="/back" className="btn btn-secondary">
      Cancel
    </Link>
  </div>
</form>
```

### 3. Form Fields (Unified)
```tsx
<FormField
  label="Field Label"
  required
  error={errors.fieldName}
  fieldName="fieldName"
>
  <input
    type="text"
    className="input"
    // ... other props
  />
</FormField>
```

### 4. Section Headers (Unified)
```tsx
<h3 style={{ 
  fontSize: 'var(--font-lg)',
  fontWeight: 'var(--font-weight-semibold)',
  color: 'var(--text-primary)',
  margin: 0,
  marginBottom: 'var(--spacing-4)',
}}>
  Section Title
</h3>
```

### 5. Tables (Unified)
```tsx
<div className="card" style={{ padding: 0, overflow: 'hidden' }}>
  <div style={{ overflowX: 'auto' }}>
    <table>
      <thead>
        <tr>
          <th>Column 1</th>
          <th>Column 2</th>
        </tr>
      </thead>
      <tbody>
        {/* Table Rows */}
      </tbody>
    </table>
  </div>
</div>
```

## Spacing System (Unified)
- Container gap: `var(--spacing-6)` (24px)
- Section margin bottom: `var(--spacing-6)` (24px)
- Form field gap: `var(--spacing-4)` (16px)
- Button gap: `var(--spacing-3)` (12px)
- Small spacing: `var(--spacing-2)` (8px)
- Tiny spacing: `var(--spacing-1)` (4px)

## Typography (Unified)
- Page Title: `var(--font-2xl)` (24px), `var(--font-weight-semibold)`
- Section Title: `var(--font-lg)` (18px), `var(--font-weight-semibold)`
- Body Text: `var(--font-sm)` (14px), `var(--font-weight-normal)`
- Small Text: `var(--font-xs)` (12px), `var(--font-weight-normal)`

## Colors (Unified)
- Primary Text: `var(--text-primary)`
- Secondary Text: `var(--text-secondary)`
- Tertiary Text: `var(--text-tertiary)`
- Error: `var(--color-error)`
- Warning: `var(--color-warning)`
- Success: `var(--color-success)`
- Info: `var(--color-info)`

## Components (Unified)
- All inputs: `className="input"`
- All buttons: `className="btn btn-primary"` or `className="btn btn-secondary"`
- All cards: `className="card"`
- All form fields: Use `<FormField>` component

