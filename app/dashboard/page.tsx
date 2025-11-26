'use client';

import { useAuth } from '@/lib/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api/dashboard';
import { 
  FileTextIcon, 
  BuildingIcon, 
  PackageIcon, 
  DollarIcon,
  ShoppingCartIcon,
  BriefcaseIcon,
  UsersIcon,
} from '@/components/icons';
import Link from 'next/link';
import { Loader } from '@/components/ui';
import { Badge } from '@/components/ui';
import { formatPrice } from '@/lib/utils/format';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

import RouteGuard from '@/components/auth/RouteGuard';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Only Super Admin can access Executive Dashboard
  if (user && user.role !== 'super_admin' && !user.is_superuser) {
    router.push('/purchase-requests');
    return null;
  }

  return (
    <RouteGuard
      requiredPermission={{ category: 'purchase_request', action: 'view' }}
      redirectTo="/purchase-requests"
    >
      <DashboardPageContent />
    </RouteGuard>
  );
}

function DashboardPageContent() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: dashboardApi.getStats,
    enabled: isAuthenticated,
  });

  const { data: projectAnalytics, isLoading: projectsLoading } = useQuery({
    queryKey: ['dashboard', 'project-analytics'],
    queryFn: dashboardApi.getProjectAnalytics,
    enabled: isAuthenticated,
  });

  const { data: recentActivity, isLoading: activityLoading } = useQuery({
    queryKey: ['dashboard', 'recent-activity'],
    queryFn: dashboardApi.getRecentActivity,
    enabled: isAuthenticated,
  });

  const { data: userActivity, isLoading: userActivityLoading } = useQuery({
    queryKey: ['dashboard', 'user-activity'],
    queryFn: dashboardApi.getUserActivity,
    enabled: isAuthenticated,
  });

  const { data: cycleMetrics, isLoading: cycleLoading } = useQuery({
    queryKey: ['dashboard', 'cycle-metrics'],
    queryFn: dashboardApi.getProcurementCycleMetrics,
    enabled: isAuthenticated,
  });

  const { data: chartData, isLoading: chartsLoading } = useQuery({
    queryKey: ['dashboard', 'chart-data'],
    queryFn: dashboardApi.getChartData,
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'paid':
        return 'success';
      default:
        return 'info';
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'created':
        return 'Created';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'paid':
        return 'Paid';
      default:
        return action;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'purchase_request':
        return 'Purchase Request';
      case 'quotation':
        return 'Quotation';
      case 'purchase_order':
        return 'Purchase Order';
      case 'grn':
        return 'GRN';
      case 'invoice':
        return 'Invoice';
      default:
        return type;
    }
  };

  const COLORS = ['#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  return (
    <MainLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
        {/* Header */}
        <div>
          <h1 style={{ 
            fontSize: 'var(--font-2xl)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--text-primary)',
            margin: 0,
            marginBottom: 'var(--spacing-1)',
          }}>
            Dashboard
          </h1>
          <p style={{ 
            fontSize: 'var(--font-sm)',
            color: 'var(--text-secondary)',
            margin: 0,
          }}>
            Overview of your procurement system
          </p>
        </div>

        {/* Main KPIs - Grouped by Category */}
        {statsLoading ? (
          <div className="card text-center" style={{ padding: 'var(--spacing-12)' }}>
            <Loader className="mx-auto mb-4" />
            <p style={{ color: 'var(--text-secondary)' }}>Loading statistics...</p>
          </div>
        ) : (
          <>
            {/* Purchase Requests Section */}
            <div className="card">
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: 'var(--spacing-4)',
              }}>
                <h2 style={{ 
                  fontSize: 'var(--font-lg)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--text-primary)',
                  margin: 0,
                }}>
                  Purchase Requests
                </h2>
                <Link 
                  href="/purchase-requests"
                  className="text-sm"
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
                  View All →
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link href="/purchase-requests">
                  <div 
                    className="p-4 rounded-lg transition-all cursor-pointer"
                    style={{ 
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-primary)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                      Total
                    </div>
                    <div className="text-2xl font-semibold" style={{ color: '#3B82F6' }}>
                      {stats?.purchaseRequests.total || 0}
                    </div>
                  </div>
                </Link>
                <Link href="/purchase-requests?status=pending">
                  <div 
                    className="p-4 rounded-lg transition-all cursor-pointer"
                    style={{ 
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-primary)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                      Pending
                    </div>
                    <div className="text-2xl font-semibold" style={{ color: '#F59E0B' }}>
                      {stats?.purchaseRequests.pending || 0}
                    </div>
                  </div>
                </Link>
                <Link href="/purchase-requests?status=approved">
                  <div 
                    className="p-4 rounded-lg transition-all cursor-pointer"
                    style={{ 
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-primary)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                      Approved
                    </div>
                    <div className="text-2xl font-semibold" style={{ color: '#22C55E' }}>
                      {stats?.purchaseRequests.approved || 0}
                    </div>
                  </div>
                </Link>
                <Link href="/purchase-requests?status=rejected">
                  <div 
                    className="p-4 rounded-lg transition-all cursor-pointer"
                    style={{ 
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-primary)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                      Rejected
                    </div>
                    <div className="text-2xl font-semibold" style={{ color: '#EF4444' }}>
                      {stats?.purchaseRequests.rejected || 0}
                    </div>
                  </div>
                </Link>
              </div>
            </div>

            {/* Purchase Orders & Invoices Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Purchase Orders */}
              <div className="card">
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  marginBottom: 'var(--spacing-4)',
                }}>
                  <h2 style={{ 
                    fontSize: 'var(--font-lg)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--text-primary)',
                    margin: 0,
                  }}>
                    Purchase Orders
                  </h2>
                  <Link 
                    href="/purchase-orders"
                    className="text-sm"
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
                    View All →
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Link href="/purchase-orders">
                    <div 
                      className="p-4 rounded-lg transition-all cursor-pointer"
                      style={{ 
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-primary)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                        Total
                      </div>
                      <div className="text-2xl font-semibold" style={{ color: '#3B82F6' }}>
                        {stats?.purchaseOrders.total || 0}
                      </div>
                    </div>
                  </Link>
                  <Link href="/purchase-orders?status=pending">
                    <div 
                      className="p-4 rounded-lg transition-all cursor-pointer"
                      style={{ 
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-primary)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                        Pending
                      </div>
                      <div className="text-2xl font-semibold" style={{ color: '#F59E0B' }}>
                        {stats?.purchaseOrders.pending || 0}
                      </div>
                    </div>
                  </Link>
                  <Link href="/purchase-orders?status=approved">
                    <div 
                      className="p-4 rounded-lg transition-all cursor-pointer"
                      style={{ 
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-primary)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                        Approved
                      </div>
                      <div className="text-2xl font-semibold" style={{ color: '#22C55E' }}>
                        {stats?.purchaseOrders.approved || 0}
                      </div>
                    </div>
                  </Link>
                  <Link href="/purchase-orders?status=completed">
                    <div 
                      className="p-4 rounded-lg transition-all cursor-pointer"
                      style={{ 
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-primary)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                        Completed
                      </div>
                      <div className="text-2xl font-semibold" style={{ color: '#10B981' }}>
                        {stats?.purchaseOrders.completed || 0}
                      </div>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Invoices */}
              <div className="card">
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  marginBottom: 'var(--spacing-4)',
                }}>
                  <h2 style={{ 
                    fontSize: 'var(--font-lg)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--text-primary)',
                    margin: 0,
                  }}>
                    Invoices
                  </h2>
                  <Link 
                    href="/purchase-invoices"
                    className="text-sm"
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
                    View All →
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Link href="/purchase-invoices">
                    <div 
                      className="p-4 rounded-lg transition-all cursor-pointer"
                      style={{ 
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-primary)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                        Total
                      </div>
                      <div className="text-2xl font-semibold" style={{ color: '#EC4899' }}>
                        {stats?.invoices.total || 0}
                      </div>
                    </div>
                  </Link>
                  <Link href="/purchase-invoices?status=pending">
                    <div 
                      className="p-4 rounded-lg transition-all cursor-pointer"
                      style={{ 
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-primary)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                        Pending
                      </div>
                      <div className="text-2xl font-semibold" style={{ color: '#F59E0B' }}>
                        {stats?.invoices.pending || 0}
                      </div>
                    </div>
                  </Link>
                  <Link href="/purchase-invoices?status=approved">
                    <div 
                      className="p-4 rounded-lg transition-all cursor-pointer"
                      style={{ 
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-primary)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                        Approved
                      </div>
                      <div className="text-2xl font-semibold" style={{ color: '#22C55E' }}>
                        {stats?.invoices.approved || 0}
                      </div>
                    </div>
                  </Link>
                  <Link href="/purchase-invoices?status=paid">
                    <div 
                      className="p-4 rounded-lg transition-all cursor-pointer"
                      style={{ 
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-primary)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                        Paid
                      </div>
                      <div className="text-2xl font-semibold" style={{ color: '#10B981' }}>
                        {stats?.invoices.paid || 0}
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/quotation-requests">
                <div 
                  className="card cursor-pointer transition-all"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                        Quotation Requests
                      </div>
                      <div className="text-2xl font-semibold" style={{ color: '#8B5CF6' }}>
                        {stats?.quotationRequests.total || 0}
                      </div>
                    </div>
                    <DollarIcon className="w-8 h-8 text-[#8B5CF6]/20" />

                  </div>
                </div>
              </Link>
              <Link href="/suppliers">
                <div 
                  className="card cursor-pointer transition-all"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                        Suppliers
                      </div>
                      <div className="text-2xl font-semibold" style={{ color: '#22C55E' }}>
                        {stats?.suppliers.total || 0}
                      </div>
                    </div>
                    <BuildingIcon className="w-8 h-8 text-green-500 opacity-20" />

                  </div>
                </div>
              </Link>
              <Link href="/products">
                <div 
                  className="card cursor-pointer transition-all"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                        Products
                      </div>
                      <div className="text-2xl font-semibold" style={{ color: '#8B5CF6' }}>
                        {stats?.products.total || 0}
                      </div>
                    </div>
                    <PackageIcon className="w-8 h-8 text-[#8B5CF6]/20" />
                  </div>
                </div>
              </Link>
              <Link href="/goods-receiving">
                <div 
                  className="card cursor-pointer transition-all"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                <div className="flex items-center justify-between">
                  <div>
                      <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                        GRN
                      </div>
                      <div className="text-2xl font-semibold" style={{ color: '#6366F1' }}>
                        {stats?.goodsReceiving.total || 0}
                      </div>
                    </div>
                    <PackageIcon className="w-8 h-8 text-[#6366F1]/20" />
                  </div>
                </div>
              </Link>
            </div>
          </>
        )}

        {/* Charts Row - Status Distribution */}
        {chartsLoading ? (
          <div className="card text-center" style={{ padding: 'var(--spacing-8)' }}>
            <Loader className="mx-auto mb-4" />
            <p style={{ color: 'var(--text-secondary)' }}>Loading charts...</p>
          </div>
        ) : chartData ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Purchase Requests Status */}
            <div className="card">
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: 'var(--spacing-4)',
              }}>
                <h3 style={{ 
                  fontSize: 'var(--font-base)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--text-primary)',
                  margin: 0,
                }}>
                  Purchase Requests
                </h3>
                <Link 
                  href="/purchase-requests"
                  className="text-xs"
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
                  View →
                </Link>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Pending', value: chartData.statusDistribution.purchaseRequests.pending },
                      { name: 'Approved', value: chartData.statusDistribution.purchaseRequests.approved },
                      { name: 'Rejected', value: chartData.statusDistribution.purchaseRequests.rejected },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => percent > 0 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''}
                    outerRadius={70}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="#F59E0B" />
                    <Cell fill="#22C55E" />
                    <Cell fill="#EF4444" />
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--card-bg)',
                      border: '1px solid var(--border-primary)',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Purchase Orders Status */}
            <div className="card">
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: 'var(--spacing-4)',
              }}>
                <h3 style={{ 
                  fontSize: 'var(--font-base)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--text-primary)',
                  margin: 0,
                }}>
                  Purchase Orders
                </h3>
                <Link 
                  href="/purchase-orders"
                  className="text-xs"
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
                  View →
                </Link>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Pending', value: chartData.statusDistribution.purchaseOrders.pending },
                      { name: 'Approved', value: chartData.statusDistribution.purchaseOrders.approved },
                      { name: 'Rejected', value: chartData.statusDistribution.purchaseOrders.rejected },
                      { name: 'Completed', value: chartData.statusDistribution.purchaseOrders.completed },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => percent > 0 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''}
                    outerRadius={70}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="#F59E0B" />
                    <Cell fill="#22C55E" />
                    <Cell fill="#EF4444" />
                    <Cell fill="#10B981" />
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--card-bg)',
                      border: '1px solid var(--border-primary)',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Invoices Status */}
            <div className="card">
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: 'var(--spacing-4)',
              }}>
                <h3 style={{ 
                  fontSize: 'var(--font-base)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--text-primary)',
                  margin: 0,
                }}>
                  Invoices
                </h3>
                <Link 
                  href="/purchase-invoices"
                  className="text-xs"
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
                  View →
                </Link>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Pending', value: chartData.statusDistribution.invoices.pending },
                      { name: 'Approved', value: chartData.statusDistribution.invoices.approved },
                      { name: 'Paid', value: chartData.statusDistribution.invoices.paid },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => percent > 0 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''}
                    outerRadius={70}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="#F59E0B" />
                    <Cell fill="#22C55E" />
                    <Cell fill="#10B981" />
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--card-bg)',
                      border: '1px solid var(--border-primary)',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : null}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Analytics */}
            {projectsLoading ? (
              <div className="card text-center" style={{ padding: 'var(--spacing-8)' }}>
                <Loader className="mx-auto mb-4" />
                <p style={{ color: 'var(--text-secondary)' }}>Loading project analytics...</p>
              </div>
            ) : projectAnalytics && projectAnalytics.length > 0 ? (
              <div className="card">
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  marginBottom: 'var(--spacing-4)',
                }}>
                  <h2 style={{ 
                    fontSize: 'var(--font-lg)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--text-primary)',
                    margin: 0,
                  }}>
                    Top Spending Projects
                  </h2>
                  <Link 
                    href="/projects"
                    className="text-sm"
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
                    View All →
                  </Link>
                </div>
                <div className="overflow-x-auto">
                  <table>
                    <thead>
                      <tr>
                        <th>Project</th>
                        <th>Code</th>
                        <th>Total Spending</th>
                        <th>PO Count</th>
                        <th>Progress</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projectAnalytics.slice(0, 5).map((project) => (
                        <tr key={project.id}>
                          <td>
                            <Link 
                              href={`/projects/view/${project.id}`}
                              className="font-medium"
                              style={{ 
                                color: 'var(--text-primary)',
                                textDecoration: 'none',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = 'var(--color-primary)';
                                e.currentTarget.style.textDecoration = 'underline';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = 'var(--text-primary)';
                                e.currentTarget.style.textDecoration = 'none';
                              }}
                            >
                              {project.name}
                            </Link>
                          </td>
                          <td>
                            <div style={{ color: 'var(--text-secondary)' }}>{project.code}</div>
                          </td>
                          <td>
                            <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                              {formatPrice(project.totalSpending)}
                            </div>
                          </td>
                          <td>
                            <Badge variant="info">{project.poCount}</Badge>
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              <div 
                                className="flex-1 h-2 rounded-full overflow-hidden"
                                style={{ backgroundColor: 'var(--bg-tertiary)' }}
                              >
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${project.progress}%`,
                                    backgroundColor: project.progress > 75 ? '#22C55E' : project.progress > 50 ? '#F59E0B' : '#3B82F6',
                                  }}
                                />
                              </div>
                              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                {project.progress}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {/* Monthly Charts */}
            {chartData && (
              <>
                {chartData.monthlyProcurement.length > 0 && (
                  <div className="card">
                    <h2 style={{ 
                      fontSize: 'var(--font-lg)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--text-primary)',
                      margin: 0,
                      marginBottom: 'var(--spacing-4)',
                    }}>
                      Monthly Procurement Volume
                    </h2>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={chartData.monthlyProcurement}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                        <XAxis 
                          dataKey="month" 
                          stroke="var(--text-secondary)"
                          style={{ fontSize: '12px' }}
                        />
                        <YAxis 
                          stroke="var(--text-secondary)"
                          style={{ fontSize: '12px' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'var(--card-bg)',
                            border: '1px solid var(--border-primary)',
                            borderRadius: '8px',
                            color: 'var(--text-primary)',
                          }}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="count" 
                          stroke="#3B82F6" 
                          strokeWidth={2}
                          name="Purchase Requests"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {chartData.projectSpending.length > 0 && (
                  <div className="card">
                    <h2 style={{ 
                      fontSize: 'var(--font-lg)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--text-primary)',
                      margin: 0,
                      marginBottom: 'var(--spacing-4)',
                    }}>
                      Project Spending Comparison
                    </h2>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartData.projectSpending}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                        <XAxis 
                          dataKey="project" 
                          stroke="var(--text-secondary)"
                          style={{ fontSize: '12px' }}
                          angle={-45}
                          textAnchor="end"
                          height={100}
                        />
                        <YAxis 
                          stroke="var(--text-secondary)"
                          style={{ fontSize: '12px' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'var(--card-bg)',
                            border: '1px solid var(--border-primary)',
                            borderRadius: '8px',
                            color: 'var(--text-primary)',
                          }}
                          formatter={(value: number) => formatPrice(value)}
                        />
                        <Bar dataKey="spending" fill="#22C55E" name="Total Spending (AED)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right Column - 1/3 width */}
          <div className="space-y-6">
            {/* Procurement Cycle Metrics */}
            {cycleLoading ? (
              <div className="card text-center" style={{ padding: 'var(--spacing-8)' }}>
                <Loader className="mx-auto mb-4" />
                <p style={{ color: 'var(--text-secondary)' }}>Loading cycle metrics...</p>
              </div>
            ) : cycleMetrics ? (
              <div className="card">
                <h2 style={{ 
                  fontSize: 'var(--font-lg)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--text-primary)',
                  margin: 0,
                  marginBottom: 'var(--spacing-4)',
                }}>
                  Procurement Cycle
                </h2>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                      PR → PO
                    </div>
                    <div className="text-xl font-semibold" style={{ color: '#3B82F6' }}>
                      {cycleMetrics.avgPRToPO} days
                    </div>
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                      PO → GRN
                    </div>
                    <div className="text-xl font-semibold" style={{ color: '#22C55E' }}>
                      {cycleMetrics.avgPOToGRN} days
                    </div>
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                      GRN → Invoice
                    </div>
                    <div className="text-xl font-semibold" style={{ color: '#8B5CF6' }}>
                      {cycleMetrics.avgGRNToInvoice} days
                    </div>
                  </div>
                </div>
                {cycleMetrics.bottlenecks.length > 0 && (
                  <div style={{ marginTop: 'var(--spacing-4)', paddingTop: 'var(--spacing-4)', borderTop: '1px solid var(--border-primary)' }}>
                    <h3 style={{ 
                      fontSize: 'var(--font-sm)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--text-primary)',
                      margin: 0,
                      marginBottom: 'var(--spacing-3)',
                    }}>
                      Bottlenecks
                    </h3>
                    <div className="space-y-2">
                      {cycleMetrics.bottlenecks.map((bottleneck, index) => (
                        <div key={index} className="p-2 rounded" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                          <div className="flex items-center justify-between">
                            <div className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                              {bottleneck.stage}
                            </div>
                            <div className="text-sm font-semibold" style={{ 
                              color: bottleneck.avgDays > 7 ? '#EF4444' : bottleneck.avgDays > 3 ? '#F59E0B' : '#22C55E' 
                            }}>
                              {bottleneck.avgDays}d
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {/* User Activity */}
            {userActivityLoading ? (
              <div className="card text-center" style={{ padding: 'var(--spacing-8)' }}>
                <Loader className="mx-auto mb-4" />
                <p style={{ color: 'var(--text-secondary)' }}>Loading user activity...</p>
              </div>
            ) : userActivity && userActivity.length > 0 ? (
              <div className="card">
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  marginBottom: 'var(--spacing-4)',
                }}>
                  <h2 style={{ 
                    fontSize: 'var(--font-lg)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--text-primary)',
                    margin: 0,
                  }}>
                    Top Active Users
                  </h2>
                  <Link 
                    href="/users"
                    className="text-sm"
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
                    View All →
                  </Link>
                </div>
                <div className="space-y-3">
                  {userActivity.slice(0, 5).map((user) => {
                    const totalActivity = user.createdPR + user.approvedRequests + user.createdPO + user.createdInvoices;
                    return (
                      <Link
                        key={user.id}
                        href={`/users/view/${user.id}`}
                        className="block p-3 rounded-lg transition-colors"
                        style={{
                          backgroundColor: 'var(--bg-secondary)',
                          border: '1px solid var(--border-primary)',
                          textDecoration: 'none',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                            {user.username}
                          </div>
                          <Badge variant="info">{totalActivity}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                          <div>PR: {user.createdPR}</div>
                          <div>Approved: {user.approvedRequests}</div>
                          <div>PO: {user.createdPO}</div>
                          <div>Invoices: {user.createdInvoices}</div>
                        </div>
                      </Link>
            );
          })}
                </div>
              </div>
            ) : null}

            {/* Recent Activity */}
            {activityLoading ? (
              <div className="card text-center" style={{ padding: 'var(--spacing-8)' }}>
                <Loader className="mx-auto mb-4" />
                <p style={{ color: 'var(--text-secondary)' }}>Loading recent activity...</p>
              </div>
            ) : recentActivity && recentActivity.length > 0 ? (
              <div className="card">
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  marginBottom: 'var(--spacing-4)',
                }}>
                  <h2 style={{ 
                    fontSize: 'var(--font-lg)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--text-primary)',
                    margin: 0,
                  }}>
                    Recent Activity
                  </h2>
                </div>
                <div className="space-y-2">
                  {recentActivity.slice(0, 8).map((activity) => (
                    <Link
                      key={`${activity.type}-${activity.id}`}
                      href={activity.link}
                      className="block p-2 rounded transition-colors"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        textDecoration: 'none',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant={getActionBadgeVariant(activity.action)}
                        className="text-[10px] px-[6px]"
                      >
                        {getActionLabel(activity.action)}
                      </Badge>

                        <div className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                          {getTypeLabel(activity.type)}
                        </div>
                      </div>
                      <div className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                        {activity.title}
                      </div>
                      <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                        {activity.user} • {new Date(activity.timestamp).toLocaleDateString()}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
