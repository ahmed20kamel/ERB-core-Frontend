'use client';

import { useState, useEffect, useMemo, useRef } from 'react';

export interface DropdownOption {
  value: string | number;
  label: string;
  searchText?: string; // Optional: custom text to search in (defaults to label)
}

interface SearchableDropdownProps {
  options: DropdownOption[];
  value: string | number | null | undefined;
  onChange: (value: string | number | null) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  allowClear?: boolean;
  filterFunction?: (option: DropdownOption, query: string) => boolean;
}

export default function SearchableDropdown({
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  label,
  required = false,
  disabled = false,
  searchPlaceholder = 'Search...',
  emptyMessage = 'No options found',
  className = '',
  allowClear = false,
  filterFunction,
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Find selected option
  const selectedOption = useMemo(() => {
    if (value === null || value === undefined || value === '') return null;
    return options.find((opt) => opt.value === value) || null;
  }, [options, value]);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;

    const query = searchQuery.toLowerCase().trim();
    
    if (filterFunction) {
      return options.filter((opt) => filterFunction(opt, query));
    }

    // Default filter: search in label and searchText
    return options.filter((opt) => {
      const labelMatch = opt.label?.toLowerCase().includes(query);
      const searchTextMatch = opt.searchText?.toLowerCase().includes(query);
      const valueMatch = String(opt.value).toLowerCase().includes(query);
      return labelMatch || searchTextMatch || valueMatch;
    });
  }, [options, searchQuery, filterFunction]);

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (option: DropdownOption) => {
    onChange(option.value);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setIsOpen(false);
    setSearchQuery('');
  };

  const displayValue = selectedOption ? selectedOption.label : '';

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="form-label">
          {label} {required && <span style={{ color: 'var(--color-error)' }}>*</span>}
        </label>
      )}
      
      <div ref={dropdownRef} className="relative">
        {/* Input/Button */}
        <div
          className={cn(
            'input cursor-pointer flex items-center justify-between',
            isOpen && 'ring-2',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          style={{
            borderColor: isOpen ? 'var(--input-focus-border)' : 'var(--input-border)',
            boxShadow: isOpen ? '0 0 0 3px var(--input-focus-ring)' : 'none',
          }}
          onClick={() => !disabled && setIsOpen(!isOpen)}
        >
          {isOpen ? (
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!isOpen) setIsOpen(true);
              }}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent outline-none border-none p-0"
              style={{ color: 'var(--text-primary)' }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div className="flex items-center justify-between w-full">
              <span style={{ color: displayValue ? 'var(--text-primary)' : 'var(--input-placeholder)' }}>
                {displayValue || placeholder}
              </span>
              <div className="flex items-center gap-1">
                {allowClear && selectedOption && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors"
                    style={{ color: 'var(--text-tertiary)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--text-tertiary)';
                    }}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                <svg
                  className={cn(
                    'w-4 h-4 transition-transform',
                    isOpen && 'rotate-180'
                  )}
                  style={{ color: 'var(--text-tertiary)' }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Dropdown List */}
        {isOpen && !disabled && (
          <div className="dropdown-container absolute z-50 w-full mt-1">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-center" style={{ color: 'var(--text-tertiary)' }}>
                {emptyMessage}
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto">
                {filteredOptions.map((option) => (
                  <button
                    key={String(option.value)}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className={cn(
                      'dropdown-item',
                      selectedOption?.value === option.value && 'selected'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
