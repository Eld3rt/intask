'use client'

import { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui'
import { Sparkles, Loader2 } from 'lucide-react'
import { generateInsight } from '../api/generate-insight'
import { calculateImportance } from '../api/calculate-importance'
import { cn } from '@/shared/lib'

type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent'
type TaskStatus = 'ToDo' | 'InProgress' | 'Review' | 'Done'

type TaskData = {
  priority: TaskPriority
  deadline: Date | string | null
  status: TaskStatus
}

type ImportanceBadgeProps = {
  task: TaskData
}

/**
 * Bookmark badge component in the upper right corner of the card.
 * Shows task importance and generates AI insight on click.
 * Only displays when importance score exceeds threshold.
 */
export function ImportanceBadge({ task }: ImportanceBadgeProps) {
  const [insight, setInsight] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)

  // Calculate importance score
  const importance = calculateImportance(task)

  // Don't show badge if score is below threshold
  if (importance.score < importance.threshold) {
    return null
  }

  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open)

    // Generate insight when popover opens for the first time
    if (open && !insight && !isLoading && !error) {
      setIsLoading(true)
      setError(null)

      try {
        const result = await generateInsight(importance.reasons)
        if (result.insight) {
          setInsight(result.insight)
        } else if (result.error) {
          setError(result.error)
        }
      } catch (err) {
        setError('Не удалось загрузить информацию')
        console.error('Error loading insight:', err)
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10">
      {/* Tooltip on hover */}
      {showTooltip && !isOpen && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 bg-popover border border-border rounded-md px-3 py-2 shadow-md text-xs text-popover-foreground whitespace-nowrap animate-in fade-in-0 zoom-in-95">
          Нажмите, чтобы узнать почему эта задача важна
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-popover border-r border-b border-border rotate-45" />
        </div>
      )}
      <Popover open={isOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              'w-6 h-6',
              'bg-gradient-to-br from-purple-500 to-purple-600',
              'text-white shadow-md',
              'flex items-center justify-center',
              'cursor-pointer transition-all duration-300',
              'hover:scale-110 hover:shadow-lg',
              'animate-pulse hover:animate-none',
              'focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2',
              'rounded-full'
            )}
            onClick={e => {
              e.stopPropagation()
            }}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            aria-label="Важная задача"
          >
            <Sparkles className="h-3.5 w-3.5" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-80"
          align="center"
          side="bottom"
          onClick={e => {
            // Prevent card edit modal from opening when clicking in popover
            e.stopPropagation()
          }}
          onPointerDown={e => {
            // Prevent drag-and-drop activation when clicking in popover
            e.stopPropagation()
          }}
          onMouseDown={e => {
            // Prevent drag-and-drop activation when clicking in popover
            e.stopPropagation()
          }}
        >
          <div
            className="space-y-2 select-text"
            onClick={e => {
              // Prevent card edit modal from opening when clicking in popover content
              e.stopPropagation()
            }}
            onPointerDown={e => {
              // Prevent drag-and-drop when interacting with popover content
              e.stopPropagation()
            }}
            onPointerMove={e => {
              // Prevent drag activation during text selection
              e.stopPropagation()
            }}
            onMouseDown={e => {
              // Prevent drag-and-drop when interacting with popover content
              e.stopPropagation()
            }}
            onMouseMove={e => {
              // Prevent drag activation during text selection
              e.stopPropagation()
            }}
            onDragStart={e => {
              // Prevent drag when selecting text
              e.preventDefault()
              e.stopPropagation()
            }}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <h4 className="font-semibold text-sm">Почему эта задача важна</h4>
            </div>
            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Генерация информации...</span>
              </div>
            )}
            {error && <p className="text-sm text-destructive py-2">{error}</p>}
            {insight && !isLoading && (
              <p
                className="text-sm text-foreground leading-relaxed"
                onClick={e => e.stopPropagation()}
                onPointerDown={e => e.stopPropagation()}
                onPointerMove={e => e.stopPropagation()}
                onMouseDown={e => e.stopPropagation()}
                onMouseMove={e => e.stopPropagation()}
                onDragStart={e => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
              >
                {insight}
              </p>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
