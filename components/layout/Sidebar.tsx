'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUIStore } from '@/lib/store/ui-store';
import { useAuth } from '@/lib/hooks/use-auth';
import CollapsibleMenu from './CollapsibleMenu';
import {
  DashboardIcon,
  FileTextIcon,
  BuildingIcon,
  PackageIcon,
  BriefcaseIcon,
  DollarIcon,
  UsersIcon,
  XIcon,
  ShoppingCartIcon,
} from '@/components/icons';

// Purchase Management submenu items
const purchaseManagementItems = [
  // Purchase Requests
  { name: 'PR List', href: '/purchase-requests', icon: <FileTextIcon className="w-4 h-4" /> },
  
  // Quotation Requests
  { name: 'QR List', href: '/quotation-requests', icon: <BriefcaseIcon className="w-4 h-4" /> },
  
  // Supplier Quotations
  { name: 'Quotations List', href: '/purchase-quotations', icon: <DollarIcon className="w-4 h-4" /> },
  
  // Purchase Orders
  { name: 'PO List', href: '/purchase-orders', icon: <ShoppingCartIcon className="w-4 h-4" /> },
  
  // Goods Received Notes
  { name: 'GRN List', href: '/goods-receiving', icon: <PackageIcon className="w-4 h-4" /> },
  
  // Purchase Invoices
  { name: 'Invoice List', href: '/purchase-invoices', icon: <DollarIcon className="w-4 h-4" /> },
];

// Simple menu items (non-collapsible)
const simpleMenuItems = [
  { name: 'Suppliers', href: '/suppliers', icon: BuildingIcon, subItems: [
    { name: 'Supplier List', href: '/suppliers' },
  ]},
  { name: 'Items / Products', href: '/products', icon: PackageIcon, subItems: [
    { name: 'Items List', href: '/products' },
  ]},
  { name: 'Projects', href: '/projects', icon: BuildingIcon, subItems: [
    { name: 'Projects List', href: '/projects' },
  ]},
  { name: 'Settings', href: '/settings', icon: UsersIcon, adminOnly: true, superAdminOnly: true, subItems: [
    { name: 'Users', href: '/users' },
    { name: 'Roles', href: '/settings/roles' },
    { name: 'Permissions', href: '/settings/permissions' },
    { name: 'Notification Rules', href: '/settings/notifications' },
  ]},
];

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const { user } = useAuth();

  // Check if purchase management should be open
  const isPurchaseManagementActive = 
    pathname.startsWith('/purchase-') || 
    pathname.startsWith('/quotation-') || 
    pathname.startsWith('/goods-receiving') || 
    pathname.startsWith('/purchase-invoices') || 
    pathname.startsWith('/payments');

  return (
    <>
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 h-full w-64 border-r transition-transform duration-300 ease-in-out lg:relative lg:z-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{ 
          backgroundColor: 'var(--sidebar-bg)',
          borderColor: 'var(--sidebar-border)',
        }}
      >
        <div className="flex h-full flex-col">
          {/* Branding Section - Enhanced */}
          <div 
            className="flex flex-col items-center px-4 pt-5 pb-4 border-b"
            style={{ 
              borderColor: 'var(--sidebar-border)',
              background: 'linear-gradient(180deg, var(--sidebar-bg) 0%, rgba(249, 115, 22, 0.03) 100%)',
            }}
          >
            {/* Close Button (Mobile Only) */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden absolute top-3 right-3 p-1.5 rounded-md transition-all duration-200"
              style={{ 
                color: 'var(--text-secondary)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.backgroundColor = 'var(--sidebar-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              aria-label="Close sidebar"
            >
              <XIcon className="w-4 h-4" />
            </button>
            
            {/* Logo - Larger with enhanced styling */}
            <div className="mb-3 flex justify-center">
              <div 
                className="p-2 rounded-lg transition-all duration-200"
                style={{
                  backgroundColor: 'rgba(249, 115, 22, 0.1)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                }}
              >
                <img
                  src="/logo.png"
                  alt="AL YAFOUR CONSTRUCTION Logo"
                  width={44}
                  height={44}
                  className="object-contain"
                  style={{
                    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15))',
                  }}
                  onError={(e) => {
                    e.currentTarget.src = '/logo.svg';
                  }}
                />
              </div>
            </div>
            
            {/* Company Name - Enhanced */}
            <h2 
              className="text-sm font-bold text-center leading-tight mb-1"
              style={{ 
                color: 'var(--text-primary)',
                letterSpacing: '0.02em',
              }}
            >
              <span className="hidden sm:inline">AL YAFOUR CONSTRUCTION</span>
              <span className="sm:hidden">AL YAFOUR</span>
            </h2>
            
            {/* Subtitle - Enhanced */}
            <p 
              className="text-[11px] text-center leading-tight font-medium"
              style={{ color: 'var(--text-tertiary)' }}
            >
              <span className="hidden sm:inline">Operations & Procurement</span>
              <span className="sm:hidden">OPS</span>
            </p>
          </div>

          {/* Menu - Compact with better spacing */}
          <nav className="flex-1 space-y-0.5 px-2 py-3 overflow-y-auto">
            {/* Dashboard - Only for Super Admin */}
            {(user?.role === 'super_admin' || user?.is_superuser) && (
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-all duration-200"
              style={{
                backgroundColor: pathname === '/dashboard' ? 'var(--sidebar-active-bg)' : 'transparent',
                color: pathname === '/dashboard' ? 'var(--sidebar-active-text)' : 'var(--text-secondary)',
                fontWeight: pathname === '/dashboard' ? 'var(--font-weight-semibold)' : 'var(--font-weight-medium)',
              }}
              onMouseEnter={(e) => {
                if (pathname !== '/dashboard') {
                  e.currentTarget.style.backgroundColor = 'var(--sidebar-hover)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                  e.currentTarget.style.fontWeight = 'var(--font-weight-semibold)';
                }
              }}
              onMouseLeave={(e) => {
                if (pathname !== '/dashboard') {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.fontWeight = 'var(--font-weight-medium)';
                }
              }}
              onClick={() => setSidebarOpen(false)}
            >
              <DashboardIcon className="w-4 h-4 flex-shrink-0" style={{ minWidth: '16px' }} />
              <span className="truncate font-semibold">Dashboard</span>
            </Link>
            )}

            {/* Profile */}
            <Link
              href="/profile"
              className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-all duration-200"
              style={{
                backgroundColor: pathname === '/profile' ? 'var(--sidebar-active-bg)' : 'transparent',
                color: pathname === '/profile' ? 'var(--sidebar-active-text)' : 'var(--text-secondary)',
                fontWeight: pathname === '/profile' ? 'var(--font-weight-semibold)' : 'var(--font-weight-medium)',
              }}
              onMouseEnter={(e) => {
                if (pathname !== '/profile') {
                  e.currentTarget.style.backgroundColor = 'var(--sidebar-hover)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                  e.currentTarget.style.fontWeight = 'var(--font-weight-semibold)';
                }
              }}
              onMouseLeave={(e) => {
                if (pathname !== '/profile') {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.fontWeight = 'var(--font-weight-medium)';
                }
              }}
              onClick={() => setSidebarOpen(false)}
            >
              <UsersIcon className="w-4 h-4 flex-shrink-0" style={{ minWidth: '16px' }} />
              <span className="truncate font-semibold">My Profile</span>
            </Link>

            {/* Separator */}
            <div className="my-2 mx-2 h-px" style={{ backgroundColor: 'var(--sidebar-border)' }} />

            {/* Purchase Management */}
            <CollapsibleMenu
              title="Purchase Management"
              icon={<ShoppingCartIcon className="w-4 h-4" />}
              items={purchaseManagementItems}
              defaultOpen={isPurchaseManagementActive}
              user={user}
            />

            {/* Separator */}
            <div className="my-2 mx-2 h-px" style={{ backgroundColor: 'var(--sidebar-border)' }} />

            {/* Simple Menu Items */}
            {simpleMenuItems
              .filter((item) => {
                if (item.superAdminOnly) {
                  return user?.role === 'super_admin' || user?.is_superuser;
                }
                if (item.adminOnly) {
                  return user?.role === 'super_admin' || user?.is_staff || user?.is_superuser;
                }
                return true;
              })
              .map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                const Icon = item.icon;
                
                return (
                  <div key={item.href}>
                    {item.subItems ? (
                      <CollapsibleMenu
                        title={item.name}
                        icon={<Icon className="w-4 h-4" />}
                        items={item.subItems.map((subItem) => ({
                          name: subItem.name,
                          href: subItem.href,
                          adminOnly: item.adminOnly,
                          superAdminOnly: item.superAdminOnly,
                        }))}
                        defaultOpen={isActive}
                        user={user}
                      />
                    ) : (
                      <Link
                        href={item.href}
                        className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-all duration-200"
                        style={{
                          backgroundColor: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
                          color: isActive ? 'var(--sidebar-active-text)' : 'var(--text-secondary)',
                          fontWeight: isActive ? 'var(--font-weight-semibold)' : 'var(--font-weight-medium)',
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.backgroundColor = 'var(--sidebar-hover)';
                            e.currentTarget.style.color = 'var(--text-primary)';
                            e.currentTarget.style.fontWeight = 'var(--font-weight-semibold)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = 'var(--text-secondary)';
                            e.currentTarget.style.fontWeight = 'var(--font-weight-medium)';
                          }
                        }}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" style={{ minWidth: '16px' }} />
                        <span className="truncate font-semibold">{item.name}</span>
                      </Link>
                    )}
                  </div>
                );
              })}
          </nav>
        </div>
      </aside>
    </>
  );
}
