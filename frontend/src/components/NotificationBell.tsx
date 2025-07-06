import React, { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { formatDistanceToNow } from 'date-fns'
import { api } from '../api'

interface Notification {
  id: string
  message: string
  type: string
  isRead: boolean
  createdAt: string
  relatedCommentId?: string
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const { data: unreadCount, isLoading: isLoadingCount, error: countError } = useQuery(
    'notifications-count',
    () => api.get('/notifications/unread/count').then(res => res.data.count),
    { 
      refetchInterval: 30000, // Refetch every 30 seconds
      onError: (error: any) => {
        console.error('Error fetching notification count:', error)
      }
    }
  )

  const { data: notifications, isLoading: isLoadingNotifications, error: notificationsError } = useQuery(
    'notifications',
    () => api.get('/notifications').then(res => res.data),
    { 
      enabled: isOpen,
      onError: (error: any) => {
        console.error('Error fetching notifications:', error)
      }
    }
  )

  const markAsReadMutation = useMutation(
    (id: string) => api.post(`/notifications/${id}/read`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('notifications')
        queryClient.invalidateQueries('notifications-count')
      },
      onError: (error: any) => {
        console.error('Error marking notification as read:', error)
      },
    }
  )

  const markAllAsReadMutation = useMutation(
    () => api.post('/notifications/read-all'),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('notifications')
        queryClient.invalidateQueries('notifications-count')
      },
      onError: (error: any) => {
        console.error('Error marking all notifications as read:', error)
      },
    }
  )

  const handleMarkAsRead = (id: string) => {
    markAsReadMutation.mutate(id)
  }

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate()
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-800"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {isLoadingCount ? (
          <span className="absolute -top-1 -right-1 bg-gray-400 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            ...
          </span>
        ) : unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50" ref={dropdownRef}>
          <div className="p-4 border-b">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Mark all as read
                </button>
              )}
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {isLoadingNotifications ? (
              <div className="p-4 text-center text-gray-500">
                Loading notifications...
              </div>
            ) : notificationsError ? (
              <div className="p-4 text-center text-red-500">
                Error loading notifications
              </div>
            ) : notifications?.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No notifications
              </div>
            ) : (
              notifications?.map((notification: Notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${
                    !notification.isRead ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleMarkAsRead(notification.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm text-gray-800">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt))}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full ml-2"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
} 