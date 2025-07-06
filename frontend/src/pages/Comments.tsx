import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { formatDistanceToNow } from 'date-fns'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../api'
import CommentComponent from '../components/Comment'
import CreateCommentForm from '../components/CreateCommentForm'
import NotificationBell from '../components/NotificationBell'

interface Comment {
  id: string
  content: string
  createdAt: string
  isEdited: boolean
  isDeleted: boolean
  deletedAt?: string
  user: {
    id: string
    username: string
  }
  replies: Comment[]
}

export default function Comments() {
  const { user, logout } = useAuth()
  const queryClient = useQueryClient()
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [showDeletedComments, setShowDeletedComments] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  const { data: comments, isLoading, error } = useQuery<Comment[]>(
    'comments',
    () => api.get('/comments').then(res => res.data)
  )

  const { data: deletedComments, isLoading: deletedLoading } = useQuery<Comment[]>(
    ['deleted-comments'],
    () => api.get('/comments/deleted/user').then(res => res.data),
    {
      enabled: showDeletedComments,
    }
  )

  const createCommentMutation = useMutation(
    (data: { content: string; parentId?: string }) => api.post('/comments', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('comments')
        queryClient.invalidateQueries('deleted-comments')
        setReplyingTo(null)
      },
      onError: (error: any) => {
        console.error('Error creating comment:', error)
        alert(error.response?.data?.message || 'Failed to create comment')
      },
    }
  )

  const restoreCommentMutation = useMutation(
    (commentId: string) => api.post(`/comments/${commentId}/restore`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('comments')
        queryClient.invalidateQueries('deleted-comments')
      },
      onError: (error: any) => {
        console.error('Error restoring comment:', error)
        alert(error.response?.data?.message || 'Failed to restore comment')
      },
    }
  )

  const handleCreateComment = (content: string, parentId?: string) => {
    createCommentMutation.mutate({ content, parentId })
  }

  const handleRestoreComment = (commentId: string) => {
    if (confirm('Are you sure you want to restore this comment?')) {
      restoreCommentMutation.mutate(commentId)
    }
  }

  const canRestoreComment = (deletedAt: string) => {
    const deletedTime = new Date(deletedAt)
    const timeDiff = currentTime.getTime() - deletedTime.getTime()
    const fifteenMinutes = 15 * 60 * 1000
    return timeDiff <= fifteenMinutes
  }

  const getTimeRemaining = (deletedAt: string) => {
    const deletedTime = new Date(deletedAt)
    const timeDiff = currentTime.getTime() - deletedTime.getTime()
    const fifteenMinutes = 15 * 60 * 1000
    const remaining = fifteenMinutes - timeDiff
    
    if (remaining <= 0) return null
    
    const minutes = Math.floor(remaining / 60000)
    const seconds = Math.floor((remaining % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Update current time every second when showing deleted comments
  React.useEffect(() => {
    if (!showDeletedComments) return
    
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    
    return () => clearInterval(interval)
  }, [showDeletedComments])

  if (isLoading) return <div className="text-center p-8">Loading comments...</div>
  if (error) return <div className="text-center p-8 text-red-500">Error loading comments</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Comments</h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Welcome, {user?.username}</span>
              <NotificationBell />
              <button
                onClick={logout}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Create new comment */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <CreateCommentForm onSubmit={handleCreateComment} />
        </div>

        {/* Deleted Comments Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Deleted Comments</h2>
            <button
              onClick={() => setShowDeletedComments(!showDeletedComments)}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              {showDeletedComments ? 'Hide' : 'Show'} Deleted Comments
            </button>
          </div>
          
          {showDeletedComments && (
            <div>
              {deletedLoading ? (
                <div className="text-center py-4">Loading deleted comments...</div>
              ) : deletedComments && deletedComments.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 mb-3">
                    You can restore deleted comments within 15 minutes of deletion.
                  </p>
                  {deletedComments.map((comment) => {
                    const canRestore = comment.deletedAt ? canRestoreComment(comment.deletedAt) : false
                    const timeRemaining = comment.deletedAt ? getTimeRemaining(comment.deletedAt) : null
                    
                    return (
                      <div key={comment.id} className="bg-gray-50 rounded-lg p-4 border-l-4 border-gray-400">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="font-semibold text-gray-900">{comment.user.username}</span>
                              <span className="text-sm text-gray-500">
                                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                              </span>
                              <span className="text-xs text-gray-400">(deleted)</span>
                              {timeRemaining && (
                                <span className="text-xs text-red-600">
                                  Time remaining: {timeRemaining}
                                </span>
                              )}
                            </div>
                            <p className="text-gray-600 italic">{comment.content}</p>
                          </div>
                          <button
                            onClick={() => handleRestoreComment(comment.id)}
                            disabled={restoreCommentMutation.isLoading || !canRestore}
                            className={`text-sm ml-4 disabled:opacity-50 ${
                              canRestore 
                                ? 'text-blue-600 hover:text-blue-800' 
                                : 'text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            {restoreCommentMutation.isLoading ? 'Restoring...' : 
                             canRestore ? 'Restore' : 'Expired'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No deleted comments found.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Comments list */}
        <div className="space-y-4">
          {comments?.map((comment) => (
            <CommentComponent
              key={comment.id}
              comment={comment}
              onReply={(parentId) => setReplyingTo(parentId)}
              onEdit={() => {}}
              onDelete={() => {}}
              isReplying={replyingTo === comment.id}
              onCreateReply={handleCreateComment}
              replyingTo={replyingTo}
            />
          ))}
        </div>
      </div>
    </div>
  )
} 