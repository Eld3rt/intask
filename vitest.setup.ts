import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock environment variables
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
process.env.GMAIL_SMTP_USER = 'test@example.com'
process.env.GMAIL_SMTP_PASSWORD = 'test-password'
process.env.GMAIL_FROM_EMAIL = 'test@example.com'

// Mock Next.js server components
vi.mock('next/server', () => ({
  headers: vi.fn(() => ({
    get: vi.fn(),
  })),
}))
