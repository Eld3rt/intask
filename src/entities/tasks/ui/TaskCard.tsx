'use client'

import { Card, CardContent, CardHeader } from '@/shared/ui'
import { Badge } from '@/shared/ui'
import { Calendar } from 'lucide-react'
import { cn } from '@/shared/lib'
import { YooptaContentValue } from '@yoopta/editor'

type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent'
type TaskStatus = 'ToDo' | 'InProgress' | 'Review' | 'Done'

type Task = {
  id: string
  slug: string
  title: string
  description: string | null
  priority: TaskPriority
  status: TaskStatus
  deadline: Date | string | null
  createdAt: Date | string
}

/**
 * Extracts plain text from YooptaContentValue structure
 * Traverses the content blocks and extracts text nodes
 *
 * YooptaContentValue structure:
 * Record<string, YooptaBlockData> where YooptaBlockData = {
 *   id: string,
 *   value: T[],  // Array of Descendant | SlateElement
 *   type: string,
 *   meta: YooptaBlockBaseMeta
 * }
 */
function extractTextFromYooptaContent(content: YooptaContentValue): string {
  if (!content || typeof content !== 'object') {
    return ''
  }

  const textParts: string[] = []

  // YooptaContentValue is an object where keys are block IDs
  // Each block has a 'value' array (not 'children')
  Object.values(content).forEach(block => {
    if (block && typeof block === 'object' && 'value' in block) {
      const extractTextFromValue = (value: unknown[]): void => {
        if (!Array.isArray(value)) {
          return
        }

        value.forEach(node => {
          if (typeof node === 'string') {
            // Direct string node
            textParts.push(node)
          } else if (node && typeof node === 'object') {
            // Slate text nodes have a 'text' property
            if ('text' in node && typeof node.text === 'string') {
              textParts.push(node.text)
            }
            // Recursively process nested children in Slate elements
            if ('children' in node && Array.isArray(node.children)) {
              extractTextFromValue(node.children)
            }
          }
        })
      }

      if (Array.isArray(block.value)) {
        extractTextFromValue(block.value)
      }
    }
  })

  return textParts.filter(Boolean).join(' ').trim()
}

/**
 * Parses task description JSON and returns plain text preview
 */
function getDescriptionPreview(description: string | null): string | null {
  if (!description) {
    return null
  }

  try {
    const parsed = JSON.parse(description) as YooptaContentValue
    const text = extractTextFromYooptaContent(parsed)
    return text || null
  } catch {
    // If parsing fails, return null (invalid JSON or not Yoopta content)
    return null
  }
}

type TaskCardProps = {
  task: Task
  onEdit?: (task: Task) => void
}

const priorityColors: Record<TaskPriority, string> = {
  Low: 'bg-blue-100 text-blue-800 border-blue-200',
  Medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  High: 'bg-orange-100 text-orange-800 border-orange-200',
  Urgent: 'bg-red-100 text-red-800 border-red-200',
}

const statusColors: Record<TaskStatus, string> = {
  ToDo: 'bg-gray-100 text-gray-800 border-gray-200',
  InProgress: 'bg-blue-100 text-blue-800 border-blue-200',
  Review: 'bg-purple-100 text-purple-800 border-purple-200',
  Done: 'bg-green-100 text-green-800 border-green-200',
}

function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function TaskCard({ task, onEdit }: TaskCardProps) {
  const deadlineDate = task.deadline
    ? typeof task.deadline === 'string'
      ? new Date(task.deadline)
      : task.deadline
    : null
  const isDeadlinePast = deadlineDate && deadlineDate < new Date()
  const isDeadlineToday = deadlineDate && deadlineDate.toDateString() === new Date().toDateString()

  const handleClick = () => {
    if (onEdit) {
      onEdit(task)
    }
  }

  return (
    <Card
      className={cn('hover:shadow-md transition-shadow flex flex-col', onEdit && 'cursor-pointer')}
      onClick={handleClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-foreground leading-tight flex-1">{task.title}</h3>
          <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded whitespace-nowrap">
            {task.slug}
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {(() => {
          const preview = getDescriptionPreview(task.description)
          return preview ? <p className="text-sm text-muted-foreground line-clamp-2">{preview}</p> : null
        })()}
      </CardContent>
      <CardContent className="pt-0 space-y-3 mt-auto">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={cn('text-xs border', statusColors[task.status])}>{task.status}</Badge>
          <Badge className={cn('text-xs border', priorityColors[task.priority])}>{task.priority}</Badge>
          {deadlineDate && (
            <div
              className={cn(
                'flex items-center gap-1 text-xs px-2 py-1 rounded border',
                isDeadlinePast && !isDeadlineToday
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : isDeadlineToday
                  ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                  : 'bg-muted text-muted-foreground border-border'
              )}
            >
              <Calendar className="h-3 w-3" />
              <span>{formatDate(deadlineDate)}</span>
            </div>
          )}
        </div>{' '}
      </CardContent>
    </Card>
  )
}

export { TaskCard }
export type { Task, TaskPriority, TaskStatus }
