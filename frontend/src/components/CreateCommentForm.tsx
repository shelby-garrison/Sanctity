import React, { useState } from 'react'
import { useForm } from 'react-hook-form'

interface CreateCommentFormProps {
  onSubmit: (content: string, parentId?: string) => void
  parentId?: string
  onCancel?: () => void
}

interface FormData {
  content: string
}

export default function CreateCommentForm({ onSubmit, parentId, onCancel }: CreateCommentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>()

  const handleFormSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    try {
      await onSubmit(data.content, parentId)
      reset()
    } catch (error) {
      console.error('Error creating comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <textarea
          {...register('content', { 
            required: 'Comment content is required',
            minLength: { value: 1, message: 'Comment cannot be empty' }
          })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={parentId ? "Write your reply..." : "Write your comment..."}
        />
        {errors.content && (
          <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
        )}
      </div>
      
      <div className="flex justify-end space-x-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Posting...' : (parentId ? 'Reply' : 'Post Comment')}
        </button>
      </div>
    </form>
  )
} 