'use client';

import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/lib/api/notifications';
import type { Notification } from '@/types';
import { useWebSocketNotifications } from '@/lib/hooks/use-websocket';
import { toast, confirm } from '@/lib/hooks/use-toast';
import Link from 'next/link';
import { Button, Loader } from '@/components/ui';

const getNotificationIcon = (type: string) => {
  if (type.includes('approved')) {
    return (
      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }
  if (type.includes('rejected') || type.includes('deleted')) {
    return (
      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }
  if (type.includes('created')) {
    return (
      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    );
  }
  return (
    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
};

const getNotificationLink = (notification: Notification): string | null => {
  if (!notification.related_object_type || !notification.related_object_id) {
    return null;
  }

  const type = notification.related_object_type;
  const id = notification.related_object_id;

  switch (type) {
    case 'purchase_request':
      return `/purchase-requests/${id}`;
    case 'quotation_request':
      return `/quotation-requests/${id}`;
    case 'purchase_quotation':
      return `/purchase-quotations/${id}`;
    case 'product':
      return `/products/view/${id}`;
    case 'supplier':
      return `/suppliers/view/${id}`;
    case 'user':
      return `/users/${id}`;
    default:
      return null;
  }
};

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const queryClient = useQueryClient();

  // Real-time WebSocket notifications
  useWebSocketNotifications((notification) => {
    // Invalidate queries to refresh notifications
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['notifications', page, filter],
    queryFn: () => notificationsApi.getAll({
      page,
      is_read: filter === 'unread' ? false : undefined,
    }),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const markAsReadMutation = useMutation({
    mutationFn: notificationsApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast('Notification marked as read', 'success');
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: notificationsApi.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast('All notifications marked as read', 'success');
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: notificationsApi.clearAll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast('All notifications cleared', 'success');
    },
  });

  const handleMarkAsRead = (id: number) => {
    markAsReadMutation.mutate(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleClearAll = async () => {
    const confirmed = await confirm('Are you sure you want to clear all notifications?');
    if (confirmed) {
      clearAllMutation.mutate();
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Notifications</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Stay updated with all system activities
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending}
              isLoading={markAllAsReadMutation.isPending}
            >
              Mark All Read
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleClearAll}
              disabled={clearAllMutation.isPending}
              isLoading={clearAllMutation.isPending}
            >
              Clear All
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button
              variant={filter === 'unread' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter('unread')}
            >
              Unread
            </Button>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="card text-center py-12">
            <Loader className="mx-auto mb-4" />
            <p className="text-muted-foreground">Loading notifications...</p>
          </div>
        ) : error ? (
          <div className="card border-destructive bg-destructive/10">
            <p className="text-destructive text-sm">Error loading notifications. Please try again.</p>
          </div>
        ) : !data || !data.results || data.results.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-muted-foreground">No notifications found</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {data.results.map((notification: Notification) => {
                const link = getNotificationLink(notification);
                const NotificationContent = (
                  <div
                    className={`card cursor-pointer ${
                      !notification.is_read ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                    onClick={() => {
                      if (!notification.is_read) {
                        handleMarkAsRead(notification.id);
                      }
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.notification_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h3 className={`text-sm font-semibold ${!notification.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {notification.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(notification.created_at).toLocaleString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                          {!notification.is_read && (
                            <span className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-600 mt-1.5" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );

                if (link) {
                  return (
                    <Link key={notification.id} href={link}>
                      {NotificationContent}
                    </Link>
                  );
                }

                return <div key={notification.id}>{NotificationContent}</div>;
              })}
            </div>

            {/* Pagination */}
            {data && data.count > 50 && (
              <div className="flex items-center justify-between card">
                <div className="text-sm text-muted-foreground">
                  Showing {((page - 1) * 50) + 1} to {Math.min(page * 50, data.count)} of {data.count} notifications
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={!data.previous || page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setPage(p => p + 1)}
                    disabled={!data.next}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}

