import React, { useState } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { formatDistanceToNow } from 'date-fns'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../api'
import CreateCommentForm from './CreateCommentForm'

interface Comment {
  id: string
  content: string
  createdAt: string
  isEdited: boolean
  isDeleted: boolean
  user: {
    id: string
    username: string
  }
  replies: Comment[]
}

interface CommentProps {
  comment: Comment
  onReply: (parentId: string) => void
  onEdit: () => void
  onDelete: () => void
  isReplying: boolean
  onCreateReply: (content: string, parentId?: string) => void
  replyingTo?: string | null
}

export default function CommentComponent({
  comment,
  onReply,
  onEdit,
  onDelete,
  isReplying,
  onCreateReply,
  replyingTo,
}: CommentProps) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)

  const deleteMutation = useMutation(
    () => api.delete(`/comments/${comment.id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('comments')
      },
      onError: (error: any) => {
        console.error('Error deleting comment:', error)
        alert(error.response?.data?.message || 'Failed to delete comment')
      },
    }
  )

  const editMutation = useMutation(
    (content: string) => api.put(`/comments/${comment.id}`, { content }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('comments')
        setIsEditing(false)
      },
      onError: (error: any) => {
        console.error('Error editing comment:', error)
        alert(error.response?.data?.message || 'Failed to edit comment')
      },
    }
  )

  const restoreMutation = useMutation(
    () => api.post(`/comments/${comment.id}/restore`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('comments')
      },
      onError: (error: any) => {
        console.error('Error restoring comment:', error)
        alert(error.response?.data?.message || 'Failed to restore comment')
      },
    }
  )

  const handleEdit = () => {
    editMutation.mutate(editContent)
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this comment?')) {
      deleteMutation.mutate()
    }
  }

  const handleRestore = () => {
    restoreMutation.mutate()
  }

  const canEdit = user?.id === comment.user.id
  const canDelete = user?.id === comment.user.id

  if (comment.isDeleted) {
    return (
      <div className="bg-gray-100 rounded-lg p-4 border-l-4 border-gray-400">
        <p className="text-gray-500 italic">This comment has been deleted</p>
        {canDelete && (
          <button
            onClick={handleRestore}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Restore
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-gray-900">{comment.user.username}</span>
          <span className="text-sm text-gray-500">
            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
          </span>
          {comment.isEdited && (
            <span className="text-xs text-gray-400">(edited)</span>
          )}
        </div>
        
        {(canEdit || canDelete) && (
          <div className="flex space-x-2">
            {canEdit && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Edit
              </button>
            )}
            {canDelete && (
              <button
                onClick={handleDelete}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
          <div className="flex space-x-2">
            <button
              onClick={handleEdit}
              disabled={editMutation.isLoading}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              {editMutation.isLoading ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="text-gray-800 mb-3">{comment.content}</p>
      )}

      <div className="flex space-x-4 text-sm">
        <button
          onClick={() => onReply(comment.id)}
          className="text-blue-600 hover:text-blue-800"
        >
          Reply
        </button>
      </div>

      {isReplying && (
        <div className="mt-4 pl-4 border-l-2 border-gray-200">
          <CreateCommentForm
            onSubmit={onCreateReply}
            parentId={comment.id}
            onCancel={() => onReply('')}
          />
        </div>
      )}
      


      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4 space-y-3 pl-4 border-l-2 border-gray-200">
          {comment.replies.map((reply) => (
            <CommentComponent
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              isReplying={replyingTo === reply.id}
              onCreateReply={onCreateReply}
              replyingTo={replyingTo}
            />
          ))}
        </div>
      )}
    </div>
  )
} 