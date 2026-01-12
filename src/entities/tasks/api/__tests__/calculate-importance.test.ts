import { describe, it, expect } from 'vitest'
import { calculateImportance, formatReasonsForLLM, type ImportanceReason } from '../calculate-importance'

describe('calculateImportance', () => {
  const now = new Date()
  now.setHours(12, 0, 0, 0) // Set to noon for consistent testing

  describe('deadline missed', () => {
    it('should score high when deadline is past and task is not done', () => {
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)

      const result = calculateImportance({
        priority: 'Medium',
        deadline: yesterday,
        status: 'ToDo',
      })

      expect(result.score).toBeGreaterThanOrEqual(10)
      expect(result.reasons).toContain('deadline_missed')
      expect(result.score).toBeGreaterThanOrEqual(result.threshold)
    })

    it('should not score deadline_missed when task is done', () => {
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)

      const result = calculateImportance({
        priority: 'Medium',
        deadline: yesterday,
        status: 'Done',
      })

      expect(result.reasons).not.toContain('deadline_missed')
    })
  })

  describe('deadline soon', () => {
    it('should score when deadline is within 3 days', () => {
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const result = calculateImportance({
        priority: 'Medium',
        deadline: tomorrow,
        status: 'ToDo',
      })

      expect(result.reasons).toContain('deadline_soon')
      expect(result.score).toBeGreaterThanOrEqual(5)
    })

    it('should score when deadline is exactly 2 days away', () => {
      const twoDaysLater = new Date(now)
      twoDaysLater.setDate(twoDaysLater.getDate() + 2)

      const result = calculateImportance({
        priority: 'Medium',
        deadline: twoDaysLater,
        status: 'ToDo',
      })

      expect(result.reasons).toContain('deadline_soon')
    })

    it('should not score deadline_soon when deadline is 3+ days away', () => {
      const fourDaysLater = new Date(now)
      fourDaysLater.setDate(fourDaysLater.getDate() + 4)

      const result = calculateImportance({
        priority: 'Medium',
        deadline: fourDaysLater,
        status: 'ToDo',
      })

      expect(result.reasons).not.toContain('deadline_soon')
    })

    it('should not score deadline_soon when task is done', () => {
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const result = calculateImportance({
        priority: 'Medium',
        deadline: tomorrow,
        status: 'Done',
      })

      expect(result.reasons).not.toContain('deadline_soon')
    })
  })

  describe('priority scoring', () => {
    it('should score high for urgent priority', () => {
      const result = calculateImportance({
        priority: 'Urgent',
        deadline: null,
        status: 'ToDo',
      })

      expect(result.reasons).toContain('urgent_priority')
      expect(result.score).toBeGreaterThanOrEqual(6)
      expect(result.score).toBeGreaterThanOrEqual(result.threshold)
    })

    it('should score for high priority', () => {
      const result = calculateImportance({
        priority: 'High',
        deadline: null,
        status: 'ToDo',
      })

      expect(result.reasons).toContain('high_priority')
      expect(result.score).toBeGreaterThanOrEqual(3)
    })

    it('should not score for medium priority alone', () => {
      const result = calculateImportance({
        priority: 'Medium',
        deadline: null,
        status: 'ToDo',
      })

      expect(result.reasons).not.toContain('high_priority')
      expect(result.reasons).not.toContain('urgent_priority')
      expect(result.score).toBeLessThan(result.threshold)
    })

    it('should not score for low priority alone', () => {
      const result = calculateImportance({
        priority: 'Low',
        deadline: null,
        status: 'ToDo',
      })

      expect(result.score).toBeLessThan(result.threshold)
    })
  })

  describe('combined factors', () => {
    it('should accumulate score from multiple factors', () => {
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)

      const result = calculateImportance({
        priority: 'Urgent',
        deadline: yesterday,
        status: 'ToDo',
      })

      expect(result.reasons).toContain('deadline_missed')
      expect(result.reasons).toContain('urgent_priority')
      expect(result.score).toBeGreaterThanOrEqual(16) // 10 + 6
    })

    it('should combine deadline_soon with high priority', () => {
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const result = calculateImportance({
        priority: 'High',
        deadline: tomorrow,
        status: 'ToDo',
      })

      expect(result.reasons).toContain('deadline_soon')
      expect(result.reasons).toContain('high_priority')
      expect(result.score).toBeGreaterThanOrEqual(8) // 5 + 3
      expect(result.score).toBeGreaterThanOrEqual(result.threshold)
    })
  })

  describe('threshold', () => {
    it('should return threshold value of 5', () => {
      const result = calculateImportance({
        priority: 'Medium',
        deadline: null,
        status: 'ToDo',
      })

      expect(result.threshold).toBe(5)
    })

    it('should not exceed threshold for low importance tasks', () => {
      const result = calculateImportance({
        priority: 'Low',
        deadline: null,
        status: 'ToDo',
      })

      expect(result.score).toBeLessThan(result.threshold)
    })
  })

  describe('no deadline', () => {
    it('should handle null deadline', () => {
      const result = calculateImportance({
        priority: 'High',
        deadline: null,
        status: 'ToDo',
      })

      expect(result.reasons).not.toContain('deadline_missed')
      expect(result.reasons).not.toContain('deadline_soon')
      expect(result.reasons).toContain('high_priority')
    })
  })
})

describe('formatReasonsForLLM', () => {
  it('should format all reason types correctly', () => {
    const reasons: ImportanceReason[] = ['deadline_missed', 'deadline_soon', 'high_priority', 'urgent_priority']
    const formatted = formatReasonsForLLM(reasons)

    expect(formatted).toEqual([
      'Deadline has passed',
      'Deadline is approaching within 3 days',
      'High priority task',
      'Urgent priority task',
    ])
  })

  it('should handle empty array', () => {
    const formatted = formatReasonsForLLM([])
    expect(formatted).toEqual([])
  })

  it('should handle single reason', () => {
    const formatted = formatReasonsForLLM(['urgent_priority'])
    expect(formatted).toEqual(['Urgent priority task'])
  })
})
